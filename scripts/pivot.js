/**
 * file:        pivot.js
 * description: Contains functions for the pivot table page of the web app.
 *              New because rewritten for DAL.
 * author:      Liam Fruzyna
 * date:        2022-04-28
 */

const SESSION_KEYS_KEY = 'pivot-selected-keys'
const SESSION_TYPES_KEY = 'pivot-selected-types'
const SESSION_SORT_KEY = 'pivot-sort-idx'
const SESSION_REVERSE_KEY = 'pivot-reverse-key'

let selected_keys = []
let last_sort = 0
let last_reverse = false
var results_tab
var selected_teams = []

const STATS = ['Mean', 'Median', 'Mode', 'Min', 'Max', 'Total', 'StdDev']

var sort_dropdown, picklist_filter, stat_filter

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Assemble the structure of the page.
 */
function init_page()
{
    header_info.innerText = 'Pivot Table'

    let picklists = [''].concat(Object.keys(dal.picklists))

    sort_dropdown = new WRDropdown('Sort By Picklist', picklists)
    sort_dropdown.on_change = () => build_table(-1, last_reverse)
    let picklist_button = new WRButton('Save to Picklist', save_picklist)
    let export_button = new WRButton('Export as Spreadsheet', export_csv)
    let import_button = new WRButton('Import Keys', prompt_csv)

    results_tab = document.createElement('table')
    let card = new WRCard([results_tab])
    preview.append(new WRPage('', [card, new WRColumn('', [sort_dropdown, import_button]),
                                   new WRColumn('', [picklist_button, export_button])]))

    // add pick list filter
    picklist_filter = add_dropdown_filter(picklists, filter_teams_by_picklist, false)
    stat_filter = add_dropdown_filter(['All', 'Stats', 'Pit', 'Rank', 'Meta'], filter_stats, true, 'Stats')

    // add select button above secondary list
    add_button_filter('(De)Select All', () => {toggle_select(false); select_none()}, false)

    // build lists
    populate_keys(dal)
    select_all(false)

    // select keys from sessionStorage
    let stored_keys = sessionStorage.getItem(SESSION_KEYS_KEY)
    let stored_types = sessionStorage.getItem(SESSION_TYPES_KEY)
    last_sort = sessionStorage.getItem(SESSION_SORT_KEY)
    last_reverse = sessionStorage.getItem(SESSION_REVERSE_KEY) == 'true'

    if (last_sort === null)
    {
        last_sort = 0
    }
    else
    {
        last_sort = parseInt(last_sort)
    }

    if (stored_keys !== null)
    {
        selected_keys = JSON.parse(stored_keys)
        for (let i in selected_keys)
        {
            try {
                document.getElementById(`left_pit_option_${selected_keys[i]}`).classList.add('selected')
            }
            catch {
                selected_keys.splice(i, 1)
            }
        }
        build_table(last_sort, last_reverse)

        if (stored_types !== null)
        {
            let selected_types = JSON.parse(stored_types)
            for (let key in selected_types)
            {
                try {
                    document.getElementById(key).value = selected_types[key]
                }
                catch {
                    document.getElementById(key).value = 'Main'
                }
            }
        }
    }

    build_table(last_sort, last_reverse)
    filter_stats()
}

/**
 * Re-build the table using the selected picklist.
 */
function filter_teams_by_picklist()
{
    let list = picklist_filter.element.value
    if (Object.keys(dal.picklists).includes(list))
    {
        filter_by(dal.picklists[list], false)
    }
    else
    {
        select_all(false)
    }

    build_table(last_sort, last_reverse)
}

/**
 * function:    filter_stats
 * parameters:  none
 * returns:     none
 * description: Selects stats based off the selected type.
 */
function filter_stats()
{
    let filter = stat_filter.element.value.toLowerCase()
    let keys = dal.get_keys()
    for (let k of keys)
    {
        let element = document.getElementById(`left_pit_option_${k}`)
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
    if (document.getElementById(`left_pit_option_${key}`).classList.contains('selected'))
    {
        document.getElementById(`left_pit_option_${key}`).classList.remove('selected')
        selected_keys = selected_keys.filter(s => s != key)
    }
    else
    {
        document.getElementById(`left_pit_option_${key}`).classList.add('selected')
        selected_keys.push(key)
    }

    // save selection to sessionStorage
    sessionStorage.setItem(SESSION_KEYS_KEY, JSON.stringify(get_selected_keys()))

    build_table(last_sort, last_reverse)
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

        build_table(last_sort, last_reverse)
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
    let class_list = document.getElementById(`right_pit_option_${key}`).classList
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
    build_table(last_sort, last_reverse)
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
    return Array.prototype.filter.call(document.getElementsByClassName('pit_option selected'), item => item.id.startsWith('right_')).map(item => item.id.replace('right_pit_option_', ''))
}

/**
 * function:    get_sorted_teams
 * parameters:  key to sort by, whether to reverse all
 * returns:     array of selected and sorted teams
 * description: Builds an array of the currently selected teams then sorts.
 */
function get_sorted_teams(sort_by=0, type='mean', reverse=false)
{
    let filtered_teams = get_secondary_selected_keys()

    let picklist_name = sort_dropdown.element.value
    let key = selected_keys[sort_by - 1]

    // sort by selected picklist
    if (sort_by < 0 && picklist_name)
    {
        if (picklist_name in dal.picklists)
        {
            let list = dal.picklists[picklist_name]
            filtered_teams.sort((a,b) => {
                let a_idx = list.indexOf(a)
                if (a_idx < 0)
                {
                    a_idx = list.length
                }
                let b_idx = list.indexOf(b)
                if (b_idx < 0)
                {
                    b_idx = list.length
                }
                return a_idx - b_idx
            })
        }
    }
    // sort by selected key
    else if (sort_by > 0 && typeof key !== 'undefined')
    {    
        let t = ''
        if (key in dal.meta)
        {
            t = dal.meta[key].type
        }
    
        // sort strings alphabetically
        if (t === 'string' || t === 'text')
        {
            filtered_teams.sort((a,b) => dal.get_value(a, key, type).localeCompare(dal.get_value(b, key, type)))
        }
        // sort selectables by
        else if (type === 'total' && (t === 'select' || t === 'dropdown'))
        {
            filtered_teams.sort((a,b) => {
                // total stats are stored as HTML string so some string manipulation is needed
                let a_val = dal.get_value(a, key, type).split('<br>')[0].split(' ')[1]
                let b_val = dal.get_value(b, key, type).split('<br>')[0].split(' ')[1]
                if (isNaN(a_val) && isNaN(b_val))
                {
                    return 0
                }
                else if (isNaN(a_val))
                {
                    return 1
                }
                else if (isNaN(b_val))
                {
                    return -1
                }
                return b_val - a_val
            })
        }
        // sort everything else (numbers) by value
        else
        {
            filtered_teams.sort((a,b) => {
                let a_val = dal.get_value(a, key, type)
                let b_val = dal.get_value(b, key, type)
                if (isNaN(a_val) && isNaN(b_val))
                {
                    return 0
                }
                else if (isNaN(a_val))
                {
                    return 1
                }
                else if (isNaN(b_val))
                {
                    return -1
                }
                return b_val - a_val
            })
        }
    }
    // otherwise maintain sort by team number

    // reverse order if requested
    if (reverse)
    {
        filtered_teams.reverse()
    }

    // move selected teams to the top
    filtered_teams.sort((a, b) => {
        let highlight_a = selected_teams.includes(a)
        let highlight_b = selected_teams.includes(b)
        if (highlight_a == highlight_b)
        {
            return 0
        }
        else if (highlight_a)
        {
            return -1
        }
        else
        {
            return 1
        }
    })

    return filtered_teams
}

/**
 * Determine the filter value for a given column.
 * 
 * @param {number} column_idx The index of the column to parse filters from.
 * @returns Type, filter, and less/greater than value.
 */
function get_filters(column_idx)
{
    // determine previously selected stat
    let type = 'Mean'
    if (document.getElementById(`select_${column_idx}`))
    {
        type = document.getElementById(`select_${column_idx}`).value
    }

    // determine previously selected filter
    let filter = ''
    if (document.getElementById(`filter_${column_idx}`))
    {
        filter = document.getElementById(`filter_${column_idx}`).value
    }

    // determine previously less/greater
    let ltgt_def = ''
    if (document.getElementById(`ltgt_${column_idx}`))
    {
        ltgt_def = WRSelect.get_selected_index(document.getElementById(`ltgt_${column_idx}`))
    }

    return [type, filter, ltgt_def]
}

/**
 * Filter out teams from a given list.
 * 
 * @param {Array} teams List of teams numbers to be reduced.
 * @param {string} key Key to filter on.
 * @param {string} type Type of the key.
 * @param {filter} filter Selected filter value.
 * @param {ltgt_def} ltgt_def Selected less/greater than value.
 * @returns Array of teams to be added to the table.
 */
function filter_teams(teams, key, type, filter, ltgt_def)
{
    let remove_teams = []
    for (let team of teams)
    {
        let val = dal.get_value(team, key, type)
        let mapped_val = dal.get_value(team, key, type, true)
        if (filter !== '' && ((ltgt_def === 0 && val >= parseFloat(filter)) ||
            (ltgt_def === 1 && val <= parseFloat(filter)) ||
            (ltgt_def === '' && filter !== mapped_val)))
        {
            remove_teams.push(team)
        }
    }

    // remove teams that does match
    for (let team of remove_teams)
    {
        teams.splice(teams.indexOf(team), 1)
    }

    return teams
}

/**
 * function:    get_previous_pos
 * parameters:  current position, position that was moved, position it was moved to
 * returns:     position before move
 * description: Determines where the position was previously.
 */
function get_previous_pos(idx, moved_idx, placed_idx)
{
    let prev_idx = idx
    if (moved_idx !== -1 && placed_idx !== -1)
    {
        if (idx === placed_idx)
        {
            prev_idx = moved_idx
        }
        else if (idx > placed_idx && idx <= moved_idx)
        {
            prev_idx--
        }
        else if (idx >= moved_idx && idx < placed_idx)
        {
            prev_idx++
        }
    }
    return prev_idx
}

/**
 * function:    get_selected_type
 * parameters:  sort position
 * returns:     selected type
 * description: Returns the stat select on a column.
 */
function get_selected_type(idx=0)
{
    let type = 'mean'
    if (document.getElementById(`select_${idx}`))
    {
        type = document.getElementById(`select_${idx}`).value.toLowerCase()
    }
    return type
}

/**
 * Determines which if any character should be appended to a column name to indicate sort.
 * 
 * @param {number} idx Index of the current column being considered.
 * @param {number} sort_by Index of the selected column.
 * @param {boolean} reverse Whether the column has been reveresed.
 * @returns An up arrow, down arrow, or empty string.
 */
function get_sort_indicator(idx, sort_by, reverse)
{
    if (idx != sort_by)
    {
        return ''
    }
    else if (!reverse)
    {
        return ' &#9650'
    }
    else
    {
        return ' &#9660'
    }
}

/**
 * function:    build_table
 * parameters:  key to sort by, whether to reverse all
 * returns:     none
 * description: Completes the center info pane with the selected options.
 */
function build_table(sort_by=0, reverse=false, moved_idx=-1, placed_idx=-1)
{
    // get selected keys on either side
    let selected = get_selected_keys()

    // sort teams based on parameters
    let pos = get_previous_pos(sort_by, moved_idx, placed_idx)
    let sorted_teams = get_sorted_teams(sort_by, get_selected_type(pos - 1), reverse)

    let selected_types = {}

    // update stored sort
    last_sort = parseInt(sort_by)
    last_reverse = reverse
    sessionStorage.setItem(SESSION_SORT_KEY, last_sort)
    sessionStorage.setItem(SESSION_REVERSE_KEY, last_reverse)

    // compute totals
    let global_stats = {}

    // get list of picked teams to fade
    let picked_teams = []
    if (Object.keys(dal.picklists).includes('picked'))
    {
        picked_teams = dal.picklists.picked
    }

    // build table headers
    let table = document.createElement('table')

    let keys_row = table.insertRow()
    keys_row.classList.add('sticky_header')
    keys_row.insertCell()
    let team_header = create_element('th', 'team')
    team_header.ondragover = dragover_handler
    team_header.ondragenter = dragenter_handler
    team_header.ondrop = drop_handler
    team_header.onclick = (event) => build_table(0, !reverse)
    team_header.innerHTML = `Team Number${get_sort_indicator(0, sort_by, reverse)}`
    keys_row.append(team_header)

    let filters_row = table.insertRow()
    filters_row.insertCell()
    let filter_header = document.createElement('th')
    filter_header.innerText = 'Filter if'
    filters_row.append(filter_header)

    let totals_row = table.insertRow()
    totals_row.insertCell()
    let total_header = document.createElement('th')
    total_header.innerText = 'All Teams'
    totals_row.append(total_header)

    let filtered_teams = sorted_teams.slice()
    let selected_key_idx = sort_by - 1
    for (let i in selected)
    {
        let key = selected[i]

        // filter teams based off this column
        let from_idx = get_previous_pos(parseInt(i), moved_idx, placed_idx)
        let [type, filter, ltgt_def] = get_filters(from_idx)
        filtered_teams = filter_teams(filtered_teams, key, type, filter, ltgt_def)

        // add key names
        let col_header = create_element('th', `header_${i}`)
        col_header.draggable = true
        col_header.ondragstart = dragstart_handler
        col_header.ondragover = dragover_handler
        col_header.ondragenter = dragenter_handler
        col_header.ondrop = drop_handler
        col_header.onclick = (event) => build_table(parseInt(i) + 1, key == selected_keys[selected_key_idx] && !reverse)
        col_header.onauxclick = (event) => alt_option(key)
        col_header.oncontextmenu = (event) => false
        col_header.ontouchstart = (event) => touch_start()
        col_header.ontouchmove = (event) => touch_move()
        col_header.ontouchend = (event) => touch_end(`alt_option('${key}')`)
        keys_row.append(col_header)

        let unique = []
        for (let team of sorted_teams)
        {
            let mapped_val = dal.get_value(team, key, type, true)
            if (!unique.includes(mapped_val))
            {
                unique.push(mapped_val)
            }
        }

        // sort filter options
        let t = dal.meta[key].type
        if (t === 'number' || t === 'counter' || t === 'slider')
        {
            unique = unique.map(v => v.toString())
            unique.sort(function (a, b)
            {
                let af = parseFloat(a)
                let bf = parseFloat(b)
                if (isNaN(af))
                {
                    return -1
                }
                if (isNaN(bf))
                {
                    return 1
                }
                return af - bf
            })
        }
        else
        {
            unique.sort()
        }
        if (!unique.includes(''))
        {
            unique.unshift('')
        }

        // build dropdown for those that have stats
        if (key.startsWith('stats.'))
        {
            let stats = STATS
            if (t === 'select' || t === 'dropdown')
            {
                stats = stats.concat(dal.meta[key].options)
            }
            let dropdown = new WRDropdown('', stats, type)
            dropdown.input_id = `select_${i}`
            dropdown.on_change = () => build_table(sort_by, reverse)
            dropdown.add_class('label')
            dropdown.add_class('thin')
            col_header.append(dropdown)
        }

        let col_key = document.createElement('span')
        col_key.innerHTML = `${dal.get_name(key, '')}${get_sort_indicator(i, selected_key_idx, reverse)}`
        col_header.append(col_key)

        // build dropdown for filter
        let numeric = t === 'number' || t === 'counter' || t === 'slider' || !STATS.includes(type)
        let filter_el = []
        // build a select for less/greater than if a number
        if (numeric)
        {
            let ltgt = new WRSelect('', ['<', '>'], ['<', '>'][ltgt_def])
            ltgt.input_id = `ltgt_${i}`
            ltgt.on_change = () => build_table(sort_by, reverse)
            ltgt.add_class('slim')
            ltgt.add_class('thin')
            ltgt.add_class('no_input_gap')
            filter_el.push(new WRColumn('', [ltgt]))
        }
        if (type !== 'Total')
        {
            let filter_dd = new WRDropdown('', unique, filter)
            filter_dd.input_id = `filter_${i}`
            filter_dd.on_change = () => build_table(sort_by, reverse)
            filter_dd.add_class('slim')
            filter_dd.add_class('thin')
            filter_dd.add_class('no_input_gap')
            filter_el.push(new WRColumn('', [filter_dd]))
        }

        // build cells
        filters_row.insertCell().append(...filter_el)

        let type_key = `${key}.${type.toLowerCase()}`
        global_stats[type_key] = dal.compute_global_stats([key], filtered_teams, type.toLowerCase())
        totals_row.insertCell().innerHTML = dal.get_global_value(global_stats[type_key], key, type.toLowerCase(), true)
    }

    // build team rows
    for (let idx in filtered_teams)
    {
        let team = filtered_teams[idx]
        let row = table.insertRow()
        row.insertCell().innerText = parseInt(idx) + 1
        let team_num = row.insertCell()
        team_num.innerText = team
        team_num.title = dal.get_value(team, 'meta.name')
        team_num.onclick = (event) => {
            if (!Object.keys(dal.picklists).includes('picked'))
            {
                dal.picklists.picked = []
            }
            if (dal.picklists.picked.includes(team))
            {
                let pos = dal.picklists.picked.indexOf(team)
                dal.picklists.picked.splice(pos, 1)
            }
            else
            {
                dal.picklists.picked.push(team)
            }
            dal.save_picklists()
            build_table(sort_by, reverse, moved_idx, placed_idx)
        }
        team_num.oncontextmenu = (event) => {
            toggle_selected_team(team)
            return false
        }
        team_num.ontouchstart = (event) => touch_start()
        team_num.ontouchmove = (event) => touch_move()
        team_num.ontouchend = (event) => touch_end(`toggle_selected_team('${team}')`)
        if (selected_teams.includes(team)) // (dal.is_unsure(team))
        {
            team_num.classList.add('highlighted')
        }
        if (picked_teams.includes(team))
        {
            row.classList.add('faded')
        }

        for (let i in selected)
        {
            let key = selected[i]

            // determine previously selected stat
            let type = get_selected_type(i)
            selected_types[`select_${i}`] = type[0].toUpperCase() + type.substring(1)

            // compute color
            let color = ''
            let val = dal.get_value(team, key, type)
            let type_key = `${key}.${type.toLowerCase()}`
            let min = dal.get_global_value(global_stats[type_key], key, 'min')
            let max = dal.get_global_value(global_stats[type_key], key, 'max')
            let mean = dal.get_global_value(global_stats[type_key], key, 'mean')
            if (!STATS.includes(type[0].toUpperCase() + type.substring(1)))
            {
                min = 0
                max = 1.0
                mean = 0.5
            }
            let t = dal.meta[key].type 
            if (!picked_teams.includes(team) && val !== mean && (type !== 'total' || (t !== 'select' || t === 'dropdown')))
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

                if (dal.meta[key].negative === true || type === 'stddev')
                {
                    colors = [colors[1], colors[0], colors[2], colors[3]]
                }
                color = `rgba(${colors.join(',')})`
            }

            // build cell
            let cell = row.insertCell()
            cell.style.backgroundColor = color
            cell.innerHTML = dal.get_value(team, key, type, true)
        }
    }

    results_tab.replaceChildren(table)

    sessionStorage.setItem(SESSION_TYPES_KEY, JSON.stringify(selected_types))
}

/**
 * Toggles whether a given team is selected.
 * 
 * @param {String} team_num Team number to toggle
 */
function toggle_selected_team(team_num)
{
    if (selected_teams.includes(team_num))
    {
        selected_teams.splice(selected_teams.indexOf(team_num), 1)
    }
    else
    {
        selected_teams.push(team_num)
    }
    build_table(last_sort, last_reverse)
}

/**
 * function:    save_picklist
 * parameters:  none
 * returns:     none
 * description: Builds and saves a picklist by the current sort.
 */
function save_picklist()
{
    // get selected keys on either side
    let teams = get_sorted_teams(last_sort, get_selected_type(last_sort - 1), last_reverse)

    // filter teams by selected
    let selected = get_selected_keys()
    for (let i in selected)
    {
        let key = selected[i]
        let [type, filter, ltgt_def] = get_filters(i)
        teams = filter_teams(teams, key, type, filter, ltgt_def)
    }

    // build picklist name
    let name = ''
    if (last_sort < 0)
    {
        name = ''
    }
    else if (last_sort === 0)
    {
        name = 'Team Number'
    }
    else
    {
        name = dal.get_name(selected_keys[last_sort - 1])
    }
    if (last_reverse)
    {
        name += ' Reversed'
    }
    while (dal.picklists.hasOwnProperty(name))
    {
        name += '+'
    }

    // save picklist
    dal.picklists[name] = teams
    dal.save_picklists()
    alert(`${name} Created`)
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
    let filtered_teams = get_sorted_teams(last_sort, get_selected_type(last_sort - 1), last_reverse)

    // compute totals
    let global_stats = dal.compute_global_stats(selected, filtered_teams)

    // build table headers
    let types = []
    let table = [['Name'], ['Key'], ['Function'], ['Totals']]
    for (let i in selected)
    {
        let key = selected[i]

        let [type, filter, ltgt_def] = get_filters(i)
        types.push(type)
        filtered_teams = filter_teams(filtered_teams, key, type, filter, ltgt_def)

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
    for (let team of filtered_teams)
    {
        let row = [team]
        for (let i in selected)
        {
            row.push(dal.get_value(team, selected[i], types[i], true))
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
                    document.getElementById(`left_pit_option_${key}`).classList.add('selected')
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
                    if (document.getElementById(`select_${i-1}`))
                    {
                        document.getElementById(`select_${i-1}`).value = type
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
    if (dropped_on === '')
    {
        dropped_on = e.target.parentElement.id
    }

    // determine what was moved
    let old_idx = parseInt(dragging.split('_')[1])
    let key = selected_keys.splice(old_idx, 1)[0]

    // determine which column index to move to
    if (dropped_on === 'team')
    {
        i = 0
    }
    else
    {
        i = parseInt(dropped_on.split('_')[1]) + 1
        let x = e.clientX - document.getElementById(dropped_on).getBoundingClientRect().left
        let middle = document.getElementById(dropped_on).offsetWidth / 2
        if (x < middle)
        {
            i -= 1
        }
    }
    if (i > old_idx)
    {
        i -= 1
    }
    selected_keys.splice(i, 0, key)

    // update sorted column index
    if (last_sort === old_idx)
    {
        last_sort = i
    }
    else if (last_sort > old_idx && last_sort <= i)
    {
        last_sort -= 1
    }
    else if (last_sort < old_idx && last_sort >= i)
    {
        last_sort += 1
    }

    // save selection to sessionStorage
    sessionStorage.setItem(SESSION_KEYS_KEY, JSON.stringify(get_selected_keys()))

    build_table(last_sort, last_reverse, old_idx, i)
}
