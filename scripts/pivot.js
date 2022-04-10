/**
 * file:        pivot.js
 * description: Contains functions for the pivot table page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2021-04-20
 */

const SORT_OPTIONS = ['Mean', 'Median', 'Mode', 'Min', 'Max']
const KEYS_KEY = 'pivot-keys'

var teams = []
var all_teams = []
var lists = {}
var results = {}
var meta = {}

var sort = ''
var ascending = false
var list_name = 'Pivot Export'
var dragging = ''
var selected_keys = []

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
                                    build_column_frame('', [build_button('export_table', 'Export Table', 'export_table()')]) +
                                    build_column_frame('', [build_button('upload_csv', 'Import Headers', 'upload_csv()')])
        
    meta = get_result_meta(type, year)

    // load all event teams from localStorage
    let file_name = get_event_teams_name(event_id)
    if (localStorage.getItem(file_name) != null)
    {
        results = get_results(prefix, year)
        
        all_teams = JSON.parse(localStorage.getItem(file_name)).map(team => team.team_number)
                    .filter(team => Object.keys(get_team_results(results, team)).length > 0)
        
        file_name = get_event_pick_lists_name(event_id)
        if (file_exists(file_name))
        {
            lists = JSON.parse(localStorage.getItem(file_name))

            add_dropdown_filter('picklist_filter', ['None'].concat(Object.keys(lists)), 'filter_teams()', false)
        }

        // add select button above secondary list
        add_button_filter('select_toggle', '(De)Select All', 'toggle_select(false); select_none()', false)

        // load keys from localStorage and build list
        populate_keys(meta, results, all_teams)
        select_all(false)
        keys = sessionStorage.getItem(KEYS_KEY)
        if (keys !== null)
        {
            keys = JSON.parse(keys)
            for (let key of keys)
            {
                open_option(key, false)
            }
        }
        build_table()
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
function open_option(key, table=true)
{
    list_name = "Team Number"
    // select team button 
    if (document.getElementById(`option_${key}`).classList.contains('selected'))
    {
        document.getElementById(`option_${key}`).classList.remove('selected')
        selected_keys = selected_keys.filter(s => s != key)
    }
    else
    {
        document.getElementById(`option_${key}`).classList.add('selected')
        selected_keys.push(key)
    }

    if (table)
    {
        build_table()
    }
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
    let selected = []
    for(let key of selected_keys)
    {
        let type = meta[key].type
        if (type == 'checkbox' || type == 'select' || type == 'dropdown')
        {
            for (let op of meta[key].options)
            {
                selected.push(`${key}-${op}`)
            }
        }
        else
        {
            selected.push(key)
        }
    }
    return selected
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
 * function:    get_weight
 * parameters:  results, team, key, label, sort method
 * returns:     calculated weight
 * description: Calculates a weight for sorting a discrete result average.
 */
function get_weight(results, team, key, label, method)
{
    let res = avg_results(get_team_results(results, team), key, meta[key].type, method, meta[key].options)
    return (100 * res[label] / Object.values(res).reduce((a, b) => a + b, 0))
}

/**
 * function:    dragstart_handler
 * parameters:  drag event
 * returns:     none
 * description: Stores the key of an input when picked up.
 */
function dragstart_handler(e)
{
    dragging = e.target.id

    // select true key if a discrete input
    if (!selected_keys.includes(dragging))
    {
        for (let key of selected_keys)
        {
            if (dragging.startsWith(key))
            {
                dragging = key
            }
        }
    }
}

/**
 * function:    dragover_handler
 * parameters:  drag event
 * returns:     none
 * description: Allows drop handler to work.
 */
function dragover_handler(e)
{
    e.preventDefault()
}

/**
 * function:    drop_handler
 * parameters:  drag event
 * returns:     none
 * description: Shifts select keys around according to drag.
 */
function drop_handler(e)
{
    e.preventDefault()
    let dropped_on = e.target.id

    // select true key if a discrete input
    if (!selected_keys.includes(dropped_on))
    {
        for (let key of selected_keys)
        {
            if (dropped_on.startsWith(key))
            {
                dropped_on = key
                if (dragging.startsWith(key))
                {
                    dragging = ''
                    return
                }
            }
        }
    }
    
    // remove dragged key
    selected_keys = selected_keys.filter(s => s != dragging)

    // insert dragged key
    let index = dropped_on == 'team' ? 0 : selected_keys.indexOf(dropped_on) + 1
    selected_keys.splice(index, 0, dragging)

    dragging = ''
    build_table()
}

/**
 * function:    build_table
 * parameters:  none
 * returns:     none
 * description: Completes right info pane with the selected options.
 */
function build_table(sort_by='', reverse=false)
{
    sessionStorage.setItem(KEYS_KEY, JSON.stringify(selected_keys))

    let selected = get_selected_keys()
    let method = get_selected_option('type_form')

    let filter_teams = get_secondary_selected_keys()
    teams = all_teams.filter(team => filter_teams.includes(team.toString()))

    // restore sort
    if (!sort_by && sort && selected.includes(sort))
    {
        sort_by = sort
        reverse = ascending
    }
    else if (sort_by == 'team')
    {
        teams.sort()
    }

    let raw_sort = sort_by
    if (selected.includes(sort_by))
    {
        sort = sort_by
        let label = ''
        if (sort_by.includes('-'))
        {
            let parts = sort_by.split('-')
            sort_by = parts[0]
            label = parts[1]
        }
        ascending = false
        list_name = `${SORT_OPTIONS[method]} ${meta[sort_by].name}`
        if (label !== '')
        {
            list_name += ` ${label}`
        }
        
        let type = meta[sort_by].type
        let negative = meta[sort_by].negative
        if (type == 'checkbox' || type == 'select' || type == 'dropdown')
        {
            teams.sort((a, b) => get_weight(results, b, sort_by, label, method) - get_weight(results, a, sort_by, label, method))

            let idx = meta[sort_by].options[label]
            negative = negative[idx]
        }
        else
        {
            teams.sort((a, b) => avg_results(get_team_results(results, b), sort_by, type, method) - avg_results(get_team_results(results, a), sort_by, type, method))
        }
        // invert negative key sort
        if (negative === true)
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
        ascending = true
        teams.reverse()
        list_name += ' reversed'
    }

    // header row
    let table = `<tr><th></th><th id="team" ondragover="dragover_handler(event)" ondrop="drop_handler(event)" onclick="build_table('team', ${sort_by !== 'team' ? false : !reverse})" ${sort_by != 'team' ? 'style="font-weight: normal"' : ''}>Team</th>`
    for (let key of selected)
    {
        let name = ''
        if (key.includes('-'))
        {
            let parts = key.split('-')
            let label = parts[1]
            // handle boolean labels
            if (label === 'false')
            {
                label = 'Not'
            }
            else if (label === 'true')
            {
                label = ''
            }
            name = `${meta[parts[0]].name} ${label}`
        }
        else
        {
            name = meta[key].name
        }
        let rev = raw_sort == key ? !reverse : false
        table += `<th id="${key}" draggable="true" ondragstart="dragstart_handler(event)" ondragover="dragover_handler(event)" ondrop="drop_handler(event)" onclick="build_table('${key}', ${rev})" ${raw_sort != key ? 'style="font-weight: normal"' : ''}>${name}</th>`
    }
    table += '</tr>'

    // totals row
    table += '<tr><th></th><th>Totals</th>'
    for (let key of selected)
    {
        let label = ''
        if (key.includes('-'))
        {
            let parts = key.split('-')
            key = parts[0]
            label = parts[1]
        }
        let valStr = ''
        let type = meta[key].type
        // build a value string of percents for discrete inputs
        if (type == 'checkbox' || type == 'select' || type == 'dropdown')
        {
            let res = avg_results(results, key, meta[key].type, method, meta[key].options)
            valStr = (100 * res[label] / Object.values(res).reduce((a, b) => a + b, 0)).toFixed(1) + '%'
        }
        else
        {
            valStr = get_value(meta, key, avg_results(results, key, meta[key].type, method))
        }
        table += `<td>${valStr}</td>`
    }
    table += '</tr>'

    // data rows
    let index = 0
    for (let team of teams)
    {
        let team_results = get_team_results(results, team)
        if (Object.keys(team_results).length > 0)
        {
            table += `<th>${++index}</th><th>${team}</th>`
            for (let key of selected)
            {
                let label = ''
                if (key.includes('-'))
                {
                    let parts = key.split('-')
                    key = parts[0]
                    label = parts[1]
                }
                let color = ''
                let type = meta[key].type
                let negative = meta[key].negative

                let val = avg_results(team_results, key, type, method)
                let valStr = get_value(meta, key, val)
                let base = avg_results(results, key, type, method)
                let min = avg_results(results, key, type, 3)
                let max = avg_results(results, key, type, 4)
                // build a value string of percents for discrete inputs
                if (type == 'checkbox' || type == 'select' || type == 'dropdown')
                {
                    let res = avg_results(team_results, key, type, method, meta[key].options)
                    val = (100 * res[label] / Object.values(res).reduce((a, b) => a + b, 0))
                    valStr = val.toFixed(1) + '%'

                    res = avg_results(results, key, type, method, meta[key].options)
                    base = (100 * res[label] / Object.values(res).reduce((a, b) => a + b, 0))

                    // TODO use real min and max?
                    min = 0
                    max = 100

                    let idx = meta[key].options[label]
                    negative = negative[idx]
                }

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

                        if (negative === true ? label !== 'false' : label === 'false')
                        {
                            colors = [colors[1], colors[0], colors[2], colors[3]]
                        }
                        color = `style="background-color: rgba(${colors.join(',')}`
                    }
            
                    // add std dev if proper number
                    if (method == 0 && type != 'select' && type != 'dropdown' && type != 'checkbox')
                    {
                        valStr += ` (${get_value(meta, key, avg_results(team_results, key, type, 5))})`
                    }
                }
                table += `<td class="result_cell" ${color})">${valStr}</td>`
            }
            table += '</tr>'
        }
    }
    document.getElementById('results_tab').innerHTML = table
}

/**
 * function:    upload_csv
 * paramters:   none
 * returns:     none
 * description: Creates a file prompt to upload a CSV file.
 */
function upload_csv()
{
    var input = document.createElement('input')
    input.type = 'file'
    input.accept = 'text/csv'
    input.onchange = import_headers
    input.click()
}

/**
 * function:    import_headers
 * paramters:   response containing CSV file
 * returns:     none
 * description: Loads in headers from a CSV file.
 */
function import_headers(event)
{
    let file = event.target.files[0]
    let reader = new FileReader()
    reader.readAsText(file, 'UTF-8')
    reader.onload = readerEvent => {
        let lines = readerEvent.target.result.split('\n')
        let headers = lines[0].split(',').map(l => l.trim())
        
        let keys = Array.prototype.filter.call(document.getElementsByClassName('pit_option'), item => item.id.startsWith('o')).map(item => item.id.replace('option_', ''))
        selected_keys = Array(headers.length).fill('')
        for(let key of keys)
        {
            let type = meta[key].type
            if (type == 'checkbox' || type == 'select' || type == 'dropdown')
            {
                for (let op of meta[key].options)
                {
                    // handle boolean labels
                    if (op === 'false')
                    {
                        op = 'Not'
                    }
                    else if (op === 'true')
                    {
                        op = ''
                    }
                    let idx = headers.indexOf(`${meta[key].name} ${op}`)
                    if (idx >= 0)
                    {
                        document.getElementById(`option_${key}`).classList.add('selected')
                        selected_keys[idx] = key
                        break
                    }
                }
            }
            else
            {
                let idx = headers.indexOf(meta[key].name)
                if (idx >= 0)
                {
                    document.getElementById(`option_${key}`).classList.add('selected')
                    selected_keys[idx] = key
                }
            }
        }

        // remove keys not found (skipped in the case of multiple discretes)
        selected_keys = selected_keys.filter(k => k != '')
        
        build_table()
    }
}

/**
 * function:    export_table
 * parameters:  none
 * returns:     none
 * description: Exports the current table as a CSV file.
 */
function export_table()
{
    let selected = get_selected_keys()
    let method = get_selected_option('type_form')

    let filter_teams = get_secondary_selected_keys()
    teams = all_teams.filter(team => filter_teams.includes(team.toString()))

    // header row
    let header = ['Team']
    for (let key of selected)
    {
        let name = ''
        if (key.includes('-'))
        {
            let parts = key.split('-')
            let label = parts[1]
            // handle boolean labels
            if (label === 'false')
            {
                label = 'Not'
            }
            else if (label === 'true')
            {
                label = ''
            }
            name = `${meta[parts[0]].name} ${label}`
        }
        else
        {
            name = meta[key].name
        }
        header.push(name)
    }

    // data rows
    let rows = [header.join(',')]
    for (let team of teams)
    {
        let row = [team]
        let team_results = get_team_results(results, team)
        if (Object.keys(team_results).length > 0)
        {
            for (let key of selected)
            {
                let label = ''
                if (key.includes('-'))
                {
                    let parts = key.split('-')
                    key = parts[0]
                    label = parts[1]
                }
                let type = meta[key].type

                let val = avg_results(team_results, key, type, method)
                let valStr = get_value(meta, key, val)
                let base = avg_results(results, key, type, method)
                // build a value string of percents for discrete inputs
                if (type == 'checkbox' || type == 'select' || type == 'dropdown')
                {
                    let res = avg_results(team_results, key, type, method, meta[key].options)
                    val = (100 * res[label] / Object.values(res).reduce((a, b) => a + b, 0))
                    valStr = val.toFixed(1) + '%'

                    res = avg_results(results, key, type, method, meta[key].options)
                    base = (100 * res[label] / Object.values(res).reduce((a, b) => a + b, 0))
                }
                row.push(valStr)
            }
            rows.push(row.join(','))
        }
    }

    // download CSV
    let element = document.createElement('a')
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.join('\n')))
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
    lists[list_name] = []
    for (let team of teams)
    {
        lists[list_name].push(team.toString())
    }

    // save to localStorage and open
    localStorage.setItem(get_event_pick_lists_name(event_id), JSON.stringify(lists))
    return build_url('selection', {'page': 'picklists', [EVENT_COOKIE]: event_id})
}