/**
 * file:        pivot.js
 * description: Contains functions for the pivot table page of the web app.
 *              New because rewritten for DAL.
 * author:      Liam Fruzyna
 * date:        2022-04-28
 */

const SESSION_KEYS_KEY = 'pivot-selected-keys'
const SESSION_TYPES_KEY = 'pivot-selected-types'

let selected_keys = []
let last_sort = ''
let last_reverse = false

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Assemble the structure of the page.
 */
function init_page()
{
    let picklist_button = new Button('create_picklist', 'Save to Picklist', 'save_picklist()')
    let export_button = new Button('export_pivot', 'Export as Spreadsheet', 'export_csv()')
    let import_button = new Button('import_keys', 'Import Keys', 'prompt_csv()')

    contents_card.innerHTML = '<table id="results_tab"></table>'
    buttons_container.innerHTML = picklist_button.toString + export_button.toString + import_button.toString
    
    // add pick list filter
    add_dropdown_filter('picklist_filter', ['None'].concat(Object.keys(dal.picklists)), 'filter_teams()', false)
    add_dropdown_filter('stat_filter', ['All', 'Stats', 'Pit', 'Rank', 'Meta'], 'filter_stats()', true)

    // add select button above secondary list
    add_button_filter('select_toggle', '(De)Select All', 'toggle_select(false); select_none()', false)

    // build lists
    populate_keys(dal)
    select_all(false)

    // select keys from sessionStorage
    let stored_keys = sessionStorage.getItem(SESSION_KEYS_KEY)
    let stored_types = sessionStorage.getItem(SESSION_TYPES_KEY)
    if (stored_keys !== null)
    {
        selected_keys = JSON.parse(stored_keys)
        for (let i in selected_keys)
        {
            try {
                document.getElementById(`option_${selected_keys[i]}`).classList.add('selected')
            }
            catch {
                selected_keys.splice(i, 1)
            }
        }
        build_table()

        if (stored_types !== null)
        {
            let selected_types = JSON.parse(stored_types)
            for (let key in selected_types)
            {
                try {
                    document.getElementById(key).value = selected_types[key]
                }
                catch {
                    delete selected_types[key]
                }
            }
        }
    }

    build_table()
}

/**
 * function:    filter_teams
 * parameters:  none
 * returns:     none
 * description: Selects teams based off the selected picklist.
 */
function filter_teams()
{
    let list = document.getElementById('picklist_filter').value
    if (Object.keys(dal.picklists).includes(list))
    {
        filter_by(dal.picklists[list], false)
    }

    build_table()
}

/**
 * function:    filter_stats
 * parameters:  none
 * returns:     none
 * description: Selects stats based off the selected type.
 */
function filter_stats()
{
    let filter = document.getElementById('stat_filter').value.toLowerCase()
    let keys = dal.get_keys()
    for (let k of keys)
    {
        let element = document.getElementById(`option_${k}`)
        if (filter !== 'all' && !k.startsWith(filter) && !element.classList.contains('selected'))
        {
            element.style.display = 'none'
        }
        else
        {
            element.style.display = 'block'
        }
    }
}

/**
 * function:    open_option
 * parameters:  Selected key
 * returns:     none
 * description: Selects or unselects options then opens.
 */
function open_option(key)
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

    // save selection to sessionStorage
    sessionStorage.setItem(SESSION_KEYS_KEY, JSON.stringify(get_selected_keys()))

    build_table()
}

/**
 * function:    alt_option
 * parameters:  Selected key
 * returns:     none
 * description: Adds an additional column when right clicked.
 */
function alt_option(key)
{
    if (!selected_keys.includes(key))
    {
        open_option(key)
    }
    else if (key.startsWith('stats.'))
    {
        selected_keys.push(key)

        // save selection to sessionStorage
        sessionStorage.setItem(SESSION_KEYS_KEY, JSON.stringify(get_selected_keys()))
    
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
    return selected_keys
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
 * function:    get_sorted_teams
 * parameters:  key to sort by, whether to reverse all
 * returns:     array of selected and sorted teams
 * description: Builds an array of the currently selected teams then sorts.
 */
function get_sorted_teams(sort_by='', reverse=false)
{
    let filter_teams = get_secondary_selected_keys()

    // sort teams based on parameters
    let type = 'mean'
    if (document.getElementById(`select_${sort_by}`))
    {
        type = document.getElementById(`select_${sort_by}`).value.toLowerCase()
    }
    filter_teams.sort((a,b) => dal.get_value(b, sort_by, type) - dal.get_value(a, sort_by, type))
    if (reverse)
    {
        filter_teams.reverse()
    }

    last_sort = sort_by
    last_reverse = reverse

    return filter_teams
}

/**
 * function:    build_table
 * parameters:  key to sort by, whether to reverse all
 * returns:     none
 * description: Completes the center info pane with the selected options.
 */
function build_table(sort_by='', reverse=false)
{
    // get selected keys on either side
    let selected = get_selected_keys()
    let filter_teams = get_sorted_teams(sort_by, reverse)
    let selected_types = {}

    // compute totals
    let global_stats = dal.compute_global_stats(selected, filter_teams)

    // build table headers
    let table = `<table><tr class="sticky_header"><th id="team" ondragover="dragover_handler(event)" ondragenter="dragenter_handler(event)" ondrop="drop_handler(event)" onclick="build_table('', ${!reverse})">Team Number</th>`
    let types = '<tr><td></td>'
    let filters = '<tr><td></td>'
    let totals = '<tr><td></td>'
    for (let i in selected)
    {
        let key = selected[i]

        // add key names
        table += `<th id="${key}" draggable="true" ondragstart="dragstart_handler(event)" ondragover="dragover_handler(event)" ondragenter="dragenter_handler(event)" ondrop="drop_handler(event)"  onclick="build_table('${key}', ${key == sort_by && !reverse})">${dal.get_name(key, '')}</th>`

        // determine previously selected stat
        let type = 'Mean'
        if (document.getElementById(`select_${key}_${i}`))
        {
            type = document.getElementById(`select_${key}_${i}`).value
            selected_types[`select_${key}_${i}`] = type
        }

        // determine previously selected filter
        let filter = ''
        if (document.getElementById(`filter_${key}_${i}`))
        {
            filter = document.getElementById(`filter_${key}_${i}`).value
        }

        // determine previously less/greater
        let ltgt_def = ''
        if (document.getElementById(`ltgt_${key}_${i}`))
        {
            ltgt_def = Select.get_selected_option(`ltgt_${key}_${i}`)
        }

        // find unique values and make array of teams that don't match filter
        let unique = []
        let remove_teams = []
        for (let team of filter_teams)
        {
            let val = dal.get_value(team, key, type)
            let mapped_val = dal.get_value(team, key, type, true)
            if (filter !== '' && ((ltgt_def === 0 && val >= parseFloat(filter)) ||
                (ltgt_def === 1 && val <= parseFloat(filter)) ||
                (ltgt_def === '' && filter !== mapped_val)))
            {
                remove_teams.push(team)
            }
            if (!unique.includes(mapped_val))
            {
                unique.push(mapped_val)
            }
        }

        // remove teams that does match
        for (let team of remove_teams)
        {
            filter_teams.splice(filter_teams.indexOf(team), 1)
        }

        // sort filter options
        let t = dal.meta[key].type
        if (t === 'number' || t === 'counter' || t === 'slider')
        {
            unique.sort((a, b) => parseFloat(a) - parseFloat(b))
        }
        else
        {
            unique.sort()
        }
        unique.unshift('')

        // build dropdown for filter
        let filter_dd = new Dropdown(`filter_${key}_${i}`, '', unique, filter)
        filter_dd.on_click = `build_table('${sort_by}', ${reverse})`
        filter_dd.add_class('slim')
        filter_dd.add_class('thin')
        let filter_str = filter_dd.toString

        // build dropdown for those that have stats
        let fn = ''
        if (key.startsWith('stats.'))
        {
            let dropdown = new Dropdown(`select_${key}_${i}`, '', ['Mean', 'Median', 'Mode', 'Min', 'Max', 'Total'], type)
            dropdown.on_click = `build_table('${sort_by}', ${reverse})`
            dropdown.add_class('slim')
            dropdown.add_class('thin')
            fn = dropdown.toString
        }

        // build a select for less/greater than if a number
        if (t === 'number' || t === 'counter' || t === 'slider')
        {
            let ltgt = new Select(`ltgt_${key}_${i}`, '', ['Less', 'Greater'], ['Less', 'Greater'][ltgt_def])
            ltgt.on_change = `build_table('${sort_by}', ${reverse})`
            ltgt.add_class('slim')
            ltgt.add_class('thin')
            filter_str = ltgt.toString + filter_str
        }

        // build cells
        types += `<td>${fn}</td>`
        filters += `<td>${filter_str}</td>`
        totals += `<td>${dal.get_global_value(global_stats, key, type.toLowerCase(), true)}</td>`
    }
    table += `</tr>${types}</tr>${filters}</tr>${totals}</tr>`

    // build team rows
    for (let team of filter_teams)
    {
        table += `<tr><td>${team}</td>`
        for (let i in selected)
        {
            let key = selected[i]

            // determine previously selected stat
            let type = 'mean'
            if (document.getElementById(`select_${key}_${i}`))
            {
                type = document.getElementById(`select_${key}_${i}`).value.toLowerCase()
            }

            // compute color
            let color = ''
            let val = dal.get_value(team, key, type)
            let min = dal.get_global_value(global_stats, key, 'min')
            let max = dal.get_global_value(global_stats, key, 'max')
            let mean = dal.get_global_value(global_stats, key, 'mean')
            if (val !== mean)
            {
                let colors = [0,0,0,0]

                if (val > mean)
                {
                    colors = [0, 256, 0, (val - mean) / (max - mean) / 2]
                }
                else if (val < mean)
                {
                    colors = [256, 0, 0, (mean - val) / (mean - min) / 2]
                }

                if (dal.meta[key].negative === true)
                {
                    colors = [colors[1], colors[0], colors[2], colors[3]]
                }
                color = `style="background-color: rgba(${colors.join(',')}"`
            }

            // build cell
            table += `<td ${color}>${dal.get_value(team, key, type, true)}</td>`
        }
        table += '</tr>'
    }
    table += '</table>'

    document.getElementById('results_tab').innerHTML = table

    sessionStorage.setItem(SESSION_TYPES_KEY, JSON.stringify(selected_types))
}

/**
 * function:    save_picklist
 * parameters:  none
 * returns:     none
 * description: Builds and saves a picklist by the current sort.
 */
function save_picklist()
{
    let teams = get_sorted_teams(last_sort, last_reverse)
    let name = ''
    if (last_sort === '')
    {
        name = 'Team Number'
    }
    else
    {
        name = dal.get_name(last_sort)
    }
    if (last_reverse)
    {
        name += ' Reversed'
    }
    if (dal.picklists.hasOwnProperty(name))
    {
        name += '+'
    }
    dal.picklists[name] = teams
    dal.save_picklists()
}

/**
 * function:    export_csv
 * parameters:  none
 * returns:     none
 * description: Builds and saves a csv export of the table.
 */
function export_csv()
{
    // get selected keys on either side
    let selected = get_selected_keys()
    let filter_teams = get_sorted_teams(last_sort, last_reverse)

    // compute totals
    let global_stats = dal.compute_global_stats(selected, filter_teams)

    // build table headers
    let table = [['Name'], ['Key'], ['Function'], ['Totals']]
    for (let i in selected)
    {
        let key = selected[i]
        
        // determine previously selected stat
        let type = 'Mean'
        if (document.getElementById(`select_${key}_${i}`))
        {
            type = document.getElementById(`select_${key}_${i}`).value
        }

        // add key names and totals
        table[1].push(key)
        table[3].push(dal.get_global_value(global_stats, key, type.toLowerCase(), true))

        // build dropdown for those that have stats
        if (!key.startsWith('stats.'))
        {
            type = ''
        }
        table[0].push(dal.get_name(key, type))
        table[2].push(type)
    }

    // build team rows
    for (let team of filter_teams)
    {
        let row = [team]
        for (let i in selected)
        {
            let key = selected[i]

            // determine previously selected stat
            let type = 'mean'
            if (document.getElementById(`select_${key}_${i}`))
            {
                type = document.getElementById(`select_${key}_${i}`).value.toLowerCase()
            }

            // add cell
            row.push(dal.get_value(team, key, type, true))
        }
        table.push(row)
    }

    // convert 2D array to CSV
    let csv = table.map(r => r.map(c => `"${c}"`).join(',')).join('\n')

    // download csv
    let element = document.createElement('a')
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv))
    element.setAttribute('download', `pivot-export.csv`)

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    document.body.removeChild(element)
}

/**
 * function:    prompt_csv
 * parameters:  none
 * returns:     none
 * description: Prompts the user to select a CSV to use for importing keys.
 */
function prompt_csv()
{
    var input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/csv'
    input.onchange = import_keys
    input.click()
}

/**
 * function:    import_keys
 * parameters:  event
 * returns:     none
 * description: Loads in previously selected keys and functions from file.
 *              TODO import teams?
 */
function import_keys(event)
{
    // read in file from event
    let file = event.target.files[0]
    let reader = new FileReader()
    reader.readAsText(file, 'UTF-8')
    reader.onload = readerEvent => {
        let lines = readerEvent.target.result.split('\n')
        if (lines.length >= 4)
        {
            let keys = lines[1].split(',')
            let types = lines[2].split(',')

            // select previously selected keys and rebuild table
            selected_keys = []
            for (let i in keys)
            {
                if (i > 0)
                {
                    let key = keys[i].substring(1, keys[i].length - 1)
                    document.getElementById(`option_${key}`).classList.add('selected')
                    selected_keys.push(key)
                }
            }
            build_table()

            // select previously selected types and rebuild table
            for (let i in types)
            {
                if (i > 0)
                {
                    let key = keys[i].substring(1, keys[i].length - 1)
                    let type = types[i].substring(1, types[i].length - 1)
                    if (document.getElementById(`select_${key}_${i-1}`))
                    {
                        document.getElementById(`select_${key}_${i-1}`).value = type
                    }
                }
            }
            build_table()
        }
    }
}

/**
 * function:    dragstart_handler
 * parameters:  drag event
 * returns:     none
 * description: Stores the key of an input when picked up.
 */
function dragstart_handler(e)
{
    let dragging = e.target.id
    e.dataTransfer.setData("text/plain", dragging)

    // select true key if a discrete input
    if (!selected_keys.includes(dragging))
    {
        for (let key of selected_keys)
        {
            if (dragging.startsWith(key))
            {
                e.dataTransfer.setData("text/plain", key)
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
 * function:    dragenter_handler
 * parameters:  drag event
 * returns:     none
 * description: Allows drop handler to work.
 */
function dragenter_handler(e)
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
    let dragging = e.dataTransfer.getData("text")

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

    // save selection to sessionStorage
    sessionStorage.setItem(SESSION_KEYS_KEY, JSON.stringify(get_selected_keys()))

    build_table()
}
