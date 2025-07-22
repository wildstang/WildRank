/**
 * file:        cycles.js
 * description: Contains functions for the cycle viewer page of the web app.
 *              Primarily for building the interface from results.
 * author:      Liam Fruzyna
 * date:        2022-06-26
 */

include('mini-picklists')

// read parameters from URL
const selected_match = get_parameter('match', '')
const selected_team = get_parameter('team', '')

var title_el, avatar_el, team_el, name_el, match_el, ranking_el, table_el, cycle_container, team_filter

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch results from localStorage. Initialize page contents.
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
 * function:    build_team_list
 * parameters:  none
 * returns:     none
 * description: Completes left select result pane with results.
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
 * function:    open_option
 * parameters:  selected result
 * returns:     none
 * description: Selects the given option and populate the page.
 */
function open_option(option)
{
    // remove &nbsp; from string, which is automatically done when put in HTML
    // so basically only for the automatically opened first option
    option = option.replace(/&nbsp;/g, '\xa0')

    // select the new option
    deselect_all()
    document.getElementById(`left_pit_option_${option}`).classList.add('selected')

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

    let cycles = cfg.filter_keys(cfg.get_match_keys(true, false, false), ['object'])
    for (let key of cycles)
    {
        let cycle = this.get_match_value(match_key, team_num, key)
        let page = new WRPage(dal.get_name(key))
        for (let i in cycle)
        {
            let c = cycle[i]
            let column = new WRColumn(`#${parseInt(i)+1}`)
            let inputs = Object.keys(c)
            for (let id of inputs)
            {
                let input = dal.meta[`results.${id}`]
                let name = input.name
                let type = input.type
                let default_val = c[id]
                let options = input['options']

                let item
                // build each input from its template
                switch (type)
                {
                    case 'counter':
                        item = new WRCounter(name, default_val)
                        break
                    case 'select':
                        item = new WRSelect(name, options, options[default_val])
                        item.vertical = input.vertical
                        break
                    case 'dropdown':
                        item = new WRDropdown(name, options, options[default_val])
                        break
                    case 'multicounter':
                        item = new WRMultiCounter(name, options)
                        for (let op of options)
                        {
                            let op_id = `${id}_${create_id_from_name(op)}`
                            document.getElementById(`${op_id}-value`).innerHTML = c[op_id]
                        }
                        break
                    case 'checkbox':
                        item = new WRCheckbox(name, default_val)
                        break
                    default:
                        continue
                }
                item.input_id = id
                column.add_input(item)
            }

            // remove button for cycle
            let remove = new WRButton('Remove Cycle', () => remove_cycle(option, match_key, team_num, key, i))
            remove.add_class('slim')
            column.add_input(remove)

            page.add_column(column)
        }
        cycle_container.replaceChildren(page)
    }
}

/**
 * function:    remove_cycle
 * parameters:  selected result
 * returns:     none
 * description: Removes a given cycle from the result.
 */
function remove_cycle(option, match_key, team_num, cycle, idx)
{
    // find result by default file name
    let files = Object.keys(localStorage)
    let file = `match-${match_key}-${team_num}`
    let raw = localStorage.getItem(file)
    let found = raw !== null

    // TODO: filename update
    // attempt to find result manually if it wasn't the default name
    if (!found)
    {
        for (file of files)
        {
            if (file.startsWith(`match-${dal.event_id}`))
            {
                raw = localStorage.getItem(file)
                let result = JSON.parse(raw)
                if (match_key === `${dal.event_id}_qm${result.meta_match}` && result.meta_team === parseInt(team_num))
                {
                    found = true
                    break
                }
            }
        }
    }

    // if a file was never found give up
    if (!found)
    {
        return
    }

    // confirm before deleting file
    if (confirm(`Are you sure you want to remove "${dal.get_name(cycle)}" cycle ${idx+1} from ${file}`))
    {
        // load result and remove cycle
        let result = JSON.parse(raw)
        let id = cycle.replace('results.', '')
        result[id].splice(idx, 1)
    
        // save and reload
        localStorage.setItem(file, JSON.stringify(result))
        dal.build_teams()
    
        // rebuild page
        open_option(option)
    }
}