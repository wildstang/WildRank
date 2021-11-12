/**
 * file:        pivot.js
 * description: Contains functions for the pivot table page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2021-04-20
 */

const SORT_OPTIONS = ['Mean', 'Median', 'Mode', 'Min', 'Max']

var teams = []
var all_teams = []
var lists = {}
var results = {}

var name = 'Pivot Export'

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch simple event matches from localStorage. Initialize page contents.
 */
function init_page(contents_card, buttons_container)
{
    contents_card.innerHTML = '<table id="results_tab"></table>'
    buttons_container.innerHTML = build_column_frame('', [build_select('type_form', '', SORT_OPTIONS, 'Mean', 'build_table()')]) +
                                    build_column_frame('', [build_link_button('save_list', 'Save to Pick List', 'save_pick_list()')]) +
                                    build_column_frame('', [build_button('export_table', 'Export Table', 'export_table()')])
        
    load_config(type, year)

    // load all event teams from localStorage
    let file_name = get_event_teams_name(event_id)
    if (localStorage.getItem(file_name) != null)
    {
        results = get_results(prefix)
        
        all_teams = JSON.parse(localStorage.getItem(file_name)).map(team => team.team_number)
                    .filter(team => Object.keys(get_team_results(results, team)).length > 0)
        
        file_name = get_event_pick_lists_name(event_id)
        if (file_exists(file_name))
        {
            lists = JSON.parse(localStorage.getItem(file_name))

            // add select button above secondary list
            add_button_filter('select_toggle', '(De)Select All', 'toggle_select(false); select_none()', false)
            add_dropdown_filter('picklist_filter', ['None'].concat(Object.keys(lists)), 'filter_teams()', false)
    
            // load keys from localStorage and build list
            populate_keys(results, all_teams)
            select_all(false)
            build_table()
        }
    }
}

/**
 * function:    open_option
 * parameters:  none
 * returns:     none
 * description: Selects teams based off the selected picklist.
 */
function filter_teams()
{
    let list = document.getElementById('picklist_filter').value
    if (Object.keys(lists).includes(list))
    {
        filter_by(lists[list], false)
    }

    build_table()
}

/**
 * function:    open_option
 * parameters:  Selected key
 * returns:     none
 * description: Selects or unselects options then opens.
 */
function open_option(key)
{
    name = "Team Number"
    // select team button 
    if (document.getElementById(`option_${key}`).classList.contains('selected'))
    {
        document.getElementById(`option_${key}`).classList.remove('selected')
    }
    else
    {
        document.getElementById(`option_${key}`).classList.add('selected')
    }

    select_none()
    build_table()
}

/**
 * function:    open_secondary_option
 * parameters:  Selected key
 * returns:     none
 * description: Selects and opens a secondary option.
 */
function open_secondary_option(key)
{
    let class_list = document.getElementById(`soption_${key}`).classList
    // select team button
    if (class_list.contains('selected'))
    {
        class_list.remove('selected')
    }
    else
    {
        class_list.add('selected')
    }

    select_none()
    build_table()
}

/**
 * function:    get_selected_keys
 * parameters:  none
 * returns:     array of selected keys
 * description: Builds an array of the currently selected keys.
 */
function get_selected_keys()
{
    return Array.prototype.filter.call(document.getElementsByClassName('pit_option selected'), item => item.id.startsWith('o')).map(item => item.id.replace('option_', ''))
}

/**
 * function:    get_secondary_selected_keys
 * parameters:  none
 * returns:     array of selected keys
 * description: Builds an array of the currently selected keys.
 */
function get_secondary_selected_keys()
{
    return Array.prototype.filter.call(document.getElementsByClassName('pit_option selected'), item => item.id.startsWith('s')).map(item => item.id.replace('soption_', ''))
}

/**
 * function:    build_table
 * parameters:  none
 * returns:     none
 * description: Completes right info pane with the selected options.
 */
function build_table(sort_by='', reverse=false)
{
    let selected = get_selected_keys()
    let method = get_selected_option('type_form')

    let filter_teams = get_secondary_selected_keys()
    teams = all_teams.filter(team => filter_teams.includes(team.toString()))

    if (selected.includes(sort_by))
    {
        name = `${SORT_OPTIONS[method]} ${get_name(sort_by)}`
        console.log('sorting by', sort_by, 'for', method, 'reverse:', reverse)
        teams.sort((a, b) => avg_results(get_team_results(results, b), sort_by, method) - avg_results(get_team_results(results, a), sort_by, method))
        // invert negative key sort
        if (is_negative(sort_by))
        {
            teams.reverse()
        }
    }
    else
    {
        teams.sort((a, b) => parseInt(a) - parseInt(b))
    }
    // reverse teams to ascending
    if (reverse)
    {
        teams.reverse()
        name += ' reversed'
    }

    // header row
    let table = `<tr><th onclick="build_table()" ${sort_by != '' ? 'style="font-weight: normal"' : ''}>Team</th>`
    selected.forEach(function (key)
    {
        let rev = sort_by == key ? !reverse : false
        table += `<th onclick="build_table('${key}', ${rev})" ${sort_by != key ? 'style="font-weight: normal"' : ''}>${get_name(key)}</th>`
    })
    table += '</tr>'

    // totals row
    table += '<tr><th>Totals</th>'
    selected.forEach(function (key)
    {
        let ops = []
        let type = get_type(key)
        // build a value string of percents for discrete inputs
        if (type == 'checkbox' || type == 'select' || type == 'dropdown')
        {
            ops = get_options_index(key, type)
        }
        let valStr = get_value(key, avg_results(results, key, method, ops))
        table += `<td>${valStr}</td>`
    })
    table += '</tr>'

    // data rows
    teams.forEach(function (team)
    {
        let team_results = get_team_results(results, team)
        if (Object.keys(team_results).length > 0)
        {
            table += `<th>${team}</th>`
            selected.forEach(function (key)
            {
                let color = ''
                let ops = []
                let type = get_type(key)
                // build a value string of percents for discrete inputs
                if (type == 'checkbox' || type == 'select' || type == 'dropdown')
                {
                    ops = get_options_index(key, type)
                }
                let val = avg_results(team_results, key, method, ops)
                let valStr = get_value(key, val)
                let base = avg_results(results, key, method, ops)
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
                    if (method == 0 && type != 'select' && type != 'dropdown')
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
 * function:    export_table
 * parameters:  none
 * returns:     none
 * description: Exports the current table as a CSV file.
 */
function export_table()
{
    let keys = get_selected_keys()

    // build csv
    let line = 'Totals'
    keys.forEach(function (key)
    {
        let val = avg_results(results, key, get_selected_option('type_form'))
        line += ',' + get_value(key, val)
    })
    
    let lines = [ 'Team,' + keys.map(key => get_name(key)).join(','), line]
    teams.forEach(function (team, index)
    {
        let team_results = get_team_results(results, team)
        if (Object.keys(team_results).length > 0)
        {
            line = team
            keys.forEach(function (key)
            {
                let val = avg_results(team_results, key, get_selected_option('type_form'))
                let valStr = get_value(key, val)
                line += ',' + valStr
            })
            lines.push(line)
        }
    })
    let csv = lines.join('\n').replace(/,NaN/g, ',')

    // download CSV
    let element = document.createElement('a')
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv))
    element.setAttribute('download', `${event_id}-pivot-export.csv`)

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    document.body.removeChild(element)
}

/**
 * function:    save_pick_list
 * parameters:  none
 * returns:     none
 * description: Saves the current table sort into a pick list, named by the sorting order.
 */
function save_pick_list()
{
    let lists = JSON.parse(localStorage.getItem(get_event_pick_lists_name(event_id)))

    if (lists == null)
    {
        lists = {}
    }
    lists[name] = []
    teams.forEach(function (team)
    {
        lists[name].push(team)
    })

    // save to localStorage and open
    localStorage.setItem(get_event_pick_lists_name(event_id), JSON.stringify(lists))
    return build_url('selection', {'page': 'picklists', [EVENT_COOKIE]: event_id})
}