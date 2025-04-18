/**
 * file:        cycles.js
 * description: Contains functions for the cycle viewer page of the web app.
 *              Primarily for building the interface from results.
 * author:      Liam Fruzyna
 * date:        2022-06-26
 */

include('mini-picklists')

// read parameters from URL
var urlParams = new URLSearchParams(window.location.search)
const selected = urlParams.get('file')

var title_el, avatar_el, team_el, name_el, match_el, location_el, ranking_el, table_el, cycle_container, team_filter

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
    location_el = document.createElement('h3')
    ranking_el = document.createElement('h3')
    title_el.append(avatar_el, ' ', result_name, location_el, ranking_el)
    table_el = document.createElement('table')
    let card = new WRCard([title_el, table_el], true)
    cycle_container = document.createElement('div')
    preview.append(card, cycle_container)

    // add filter for teams
    let avail_teams = Object.keys(dal.teams)
    avail_teams.sort((a,b) => parseInt(a) - parseInt(b))
    avail_teams.unshift('All')
    team_filter = add_dropdown_filter(avail_teams, build_result_list)

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
    let results = dal.get_results()

    // get selected team in filter
    let filter = team_filter.value

    // build list of options, sorted by match
    let options = {}
    for (let result of results)
    {
        let team = result.meta_team
        let match = result.meta_match_key
        if (((selected === '' || selected === null) || `${match}-${result.meta_team}` === selected) &&
            (filter === 'All' || team.toString() === filter))
        {
            let spaces = 4 - team.length
            for (let i = 0; i < spaces; i++)
            {
                team = `&nbsp;${team}`
            }
            options[`${match}-${team}`] = `${dal.get_match_value(match, 'short_match_name')} ${team}`
        }
    }

    // populate list and open first option
    let first = populate_other(options)
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
    let match = parts[0]
    let team = parts[1].trim()
    ws(team)

    // setup header
    avatar_el.src = dal.get_value(team, 'pictures.avatar')
    team_el.innerText = team
    name_el.innerText = dal.get_value(team, 'meta.name')
    match_el.innerText = dal.get_match_value(match, 'match_name')
    location_el.innerText = `${dal.get_value(team, 'meta.city')}, ${dal.get_value(team, 'meta.state_prov')}, ${dal.get_value(team, 'meta.country')}`
    ranking_el.innerText = dal.get_rank_str(team)

    let cycles = dal.get_result_keys(true, ['cycle'])
    for (let key of cycles)
    {
        let cycle = dal.get_result_value(team, match, key)
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
            let remove = new WRButton('Remove Cycle', () => remove_cycle(option, match, team, key, i))
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