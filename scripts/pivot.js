/**
 * file:        pivot.js
 * description: Contains functions for the pivot table page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2021-04-20
 */

const SORT_OPTIONS = ['Mean', 'Median', 'Mode', 'Min', 'Max']

// read parameters from URL
const type = get_parameter(TYPE_COOKIE, TYPE_DEFAULT)
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const year = event_id.substr(0,4)
const prefix = `${type}-${event_id}-`

var keys = []
var teams = []
var results = {}

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch simple event matches from localStorage. Initialize page contents.
 */
function init_page(contents_card, buttons_container)
{
    contents_card.innerHTML = '<table id="results_tab"></table>'
    buttons_container.innerHTML = build_select('type_form', '', SORT_OPTIONS, 'Mean', 'build_table()')
        
    load_config(type, year)

    // load teams from localStorage
    let file_name = get_event_teams_name(event_id)
    if (localStorage.getItem(file_name) != null)
    {
        teams = JSON.parse(localStorage.getItem(file_name))
    }

    // load keys from localStorage and build list
    collect_results()
    keys = Object.keys(results[Object.keys(results)[0]]).filter(key => !key.startsWith('meta_'))
    build_list(keys)
}

/**
 * function:    build_list
 * parameters:  keys
 * returns:     none
 * description: Completes left select key pane with keys from result data.
 */
function build_list(keys)
{
    // iterate through team objs
    keys.forEach(function (key, index)
    {
        // replace placeholders in template and add to screen
        document.getElementById('option_list').innerHTML += build_option(key, '', get_name(key), 'font-size:10px')
    })
}

/**
 * function:    open_option
 * parameters:  Selected key
 * returns:     none
 * description: Selects or unselects options then opens.
 */
function open_option(key)
{
    // select team button
    if (document.getElementById(`option_${key}`).classList.contains('selected'))
    {
        document.getElementById(`option_${key}`).classList.remove('selected')
    }
    else
    {
        document.getElementById(`option_${key}`).classList.add('selected')
    }

    build_table()
}

/**
 * function:    build_table
 * parameters:  none
 * returns:     none
 * description: Completes right info pane with the selected options.
 */
function build_table()
{
    let selected = Array.prototype.map.call(document.getElementsByClassName('pit_option selected'), item => item.id.replace('option_', ''))

    let table = '<tr><th>Team</th>'
    selected.forEach(function (key)
    {
        table += `<th>${get_name(key)}</th>`
    })
    table += '</tr>'
    table += '<tr><th>Totals</th>'
    selected.forEach(function (key)
    {
        let val = avg_results(results, key, get_selected_option('type_form'))
        table += `<td>${get_value(key, val)}</td>`
    })
    table += '</tr>'
    teams.forEach(function (team)
    {
        let team_results = get_team_results(results, team.team_number)
        if (Object.keys(team_results).length > 0)
        {
            table += `<th>${team.team_number}</th>`
            selected.forEach(function (key)
            {
                let color = ''
                let val = avg_results(team_results, key, get_selected_option('type_form'))
                let valStr = get_value(key, val)
                let base = avg_results(results, key, get_selected_option('type_form'))
                let min = avg_results(results, key, 3)
                let max = avg_results(results, key, 4)
                if (typeof base === 'number' && !key.startsWith('meta'))
                {
                    if (val != base)
                    {
                        let colors = [0,0,0]
    
                        if (val > base)
                        {
                            colors = [0, 256, 0, (val - base) / (max - base) / 2]
                        }
                        else if (val < base)
                        {
                            colors = [256, 0, 0, (base - val) / (base - min) / 2]
                        }

                        if (is_negative(key))
                        {
                            colors = [colors[1], colors[0], colors[2], colors[3]]
                        }
                        color = `style="background-color: rgba(${colors.join(',')}`
                    }
            
                    // add std dev if proper number
                    let type = get_type(key)
                    if (get_selected_option('type_form') == 0 && type != 'select' && type != 'dropdown')
                    {
                        valStr += ` (${get_value(key, avg_results(team_results, key, 5))})`
                    }
                }
                table += `<td class="result_cell" ${color})">${valStr}</td>`
            })
            table += '</tr>'
        }
    })
    document.getElementById('results_tab').innerHTML = table
}

/**
 * function:    collect_results
 * parameters:  none
 * returns:     none
 * description: Collects all desired results from file, then add to screen.
 */
function collect_results()
{
    let unsorted = {}
    let files = Object.keys(localStorage)
    files.forEach(function (file, index)
    {
        // determine files which start with the desired type
        if (file.startsWith(prefix))
        {
            unsorted[file] = JSON.parse(localStorage.getItem(file))
        }
    })

    let num_results = Object.keys(unsorted).length
    if (num_results == 0)
    {
        return 0
    }

    // sort results
    Object.keys(unsorted).sort(function (a, b)
    { 
        return parseInt(a.split('-')[2]) - parseInt(b.split('-')[2])
    })
    .forEach(function (key)
    {
        results[key] = unsorted[key]
    })

    return num_results
}