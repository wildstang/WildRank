/**
 * file:        cycles.js
 * description: Contains functions for the cycle viewer page of the web app.
 *              Primarily for building the interface from results.
 *              TODO: edit cycle values
 * author:      Liam Fruzyna
 * date:        2022-06-26
 */

include('mini-picklists')

// read parameters from URL
const selected_match = get_parameter('match', '')
const selected_team = get_parameter('team', '')

var title_el, avatar_el, team_el, name_el, match_el, ranking_el, table_el, cycle_container, team_filter


/**
 * Initalizes the page contents.
 */
function init_page()
{
    header_info.innerText = 'Cycle Viewer'

    title_el = document.createElement('div')
    avatar_el = document.createElement('img')
    avatar_el.className = 'avatar'
    let result_name = document.createElement('h2')
    team_el = create_element('label', 'team_num')
    name_el = document.createElement('name_el')
    match_el = document.createElement('label')
    result_name.append(team_el, ': ', name_el, ', ', match_el)
    ranking_el = document.createElement('h3')
    title_el.append(avatar_el, ' ', result_name, ranking_el)
    table_el = document.createElement('table')
    let card = new WRCard([title_el, table_el])
    cycle_container = document.createElement('div')
    preview.append(card, cycle_container)

    // add filter for teams
    let avail_teams = Object.keys(dal.teams)
    avail_teams.sort((a,b) => parseInt(a) - parseInt(b))
    avail_teams.unshift('All')
    team_filter = add_dropdown_filter(avail_teams, build_result_list)

    enable_list(true, true)
    build_result_list()
    setup_picklists()
}

/**
 * Builds a list of results to choose from.
 */
function build_result_list()
{
    // get selected team in filter
    let filter = team_filter.element.value
    clear_list()

    // build list of options, sorted by match
    let first = ''
    for (let match_key of dal.match_keys)
    {
        if (selected_match.length === 0 || selected_match === match_key)
        {
            for (let team_num in dal.matches[match_key].results)
            {
                if ((selected_team.length === 0 && (filter === 'All' || team_num.toString() === filter)) ||
                    team_num === selected_team)
                {
                    let result = dal.get_match_result(match_key, team_num)
                    let spaces = 5 - team_num.toString().length
                    let disp_team = team_num
                    for (let i = 0; i < spaces; i++)
                    {
                        disp_team = `&nbsp;${disp_team}`
                    }

                    let id = `${match_key}-${team_num}`
                    let title = `${dal.matches[match_key].short_name} ${team_num}`
                    if (first === '')
                    {
                        first = id
                    }
                    let op = new WROption(id, title)
                    if (result.unsure)
                    {
                        op.add_class('highlighted')
                    }
                    add_option(op)
                }
            }
        }
    }

    if (first !== '')
    {
        open_option(first)
    }
}

/**
 * Finds the given column configuration in a specified mode.
 * @param {String} mode Scouting mode ID
 * @param {String} id Column ID
 * @returns Column configuration
 */
function get_column(mode, id)
{
    let conf = cfg.get_scout_config(mode)
    for (let page of conf.pages)
    {
        for (let column of page.columns)
        {
            if (column.id === id)
            {
                return column
            }
        }
    }
    return null
}

/**
 * Opens the specified match-team result(s).
 * @param {String} option "match-team" to open
 */
function open_option(option)
{
    // remove &nbsp; from string, which is automatically done when put in HTML
    // so basically only for the automatically opened first option
    option = option.replace(/&nbsp;/g, '\xa0')

    // select the new option
    deselect_all()
    document.getElementById(`left_pit_option_${option}`).classList.add('selected')
    cycle_container.replaceChildren()

    // pull match and team out
    let parts = option.split('-')
    let match_key = parts[0]
    let team_num = parts[1].trim()
    ws(team_num)

    // setup header
    avatar_el.src = dal.teams[team_num].avatar
    team_el.innerText = team_num
    name_el.innerText = dal.teams[team_num].name
    match_el.innerText = dal.matches[match_key].name
    let rank = dal.get_team_value(team_num, 'fms.rank')
    if (rank !== null)
    {
        ranking_el.innerText = `Rank #${rank} (${dal.get_team_value(team_num, 'fms.sort_orders_0')} RP)`
    }

    // build one page for each mode-result
    let cycles_keys = cfg.filter_keys(cfg.get_match_keys(true, false, false), ['object'])
    let match_result = dal.get_match_result(match_key, team_num)
    let match_results = match_result.results
    for (let mode in match_results)
    {
        let mode_results = match_results[mode]
        for (let res_idx in mode_results)
        {
            let result = mode_results[res_idx]
            let res_cycle_keys = Object.keys(result).filter(k => cycles_keys.includes(`result.${k}`))
            if (res_cycle_keys.length === 0)
            {
                continue
            }

            let file = match_result.file_names[mode][res_idx]
            let mode_name = cfg.get_scout_config(mode).name
            let page = new WRPage(`${mode_name} - ${dal.matches[match_key].short_name} (${file})`)
            for (let key of res_cycle_keys)
            {
                let results = result[key]
                let column_cfg = get_column(mode, key)
                let base_name = column_cfg.name
                for (let i in results)
                {
                    column_cfg.name = `${base_name} ${parseInt(i) + 1}`
                    let column = build_column_from_config(column_cfg, mode, team_num, results[i])

                    // remove button for cycle
                    let remove = new WRButton('Remove Cycle', () => remove_cycle(file, key, i))
                    remove.add_class('slim')
                    column.add_input(remove)
                    page.add_column(column)
                }
                column_cfg.name = base_name
            }
            cycle_container.append(page)
        }
    }
}

/**
 * Removes the specified cycle from the specified result.
 * @param {String} file localStorage result name
 * @param {String} cycle_id cycle ID
 * @param {Number} index cycle index
 */
function remove_cycle(file, cycle_id, index)
{
    let raw = localStorage.getItem(file)

    // if a file was never found give up
    if (!raw === null)
    {
        console.log(`Error deleting ${cycle_id}[${index}] from ${file}`)
        return
    }

    // confirm before deleting file
    if (confirm(`Are you sure you want to remove "${cycle_id}" #${parseInt(index) + 1} from ${file}?`))
    {
        // load result and remove cycle
        let result = JSON.parse(raw)
        result.result[cycle_id].splice(index, 1)
    
        // save and reload
        localStorage.setItem(file, JSON.stringify(result))
        dal.load_matches()
        dal.load_results()
    
        // rebuild page
        open_option(`${result.meta.result.match_key}-${result.meta.result.team_num}`)
    }
}