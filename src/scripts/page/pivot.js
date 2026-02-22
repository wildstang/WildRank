/**
 * file:        pivot.js
 * description: Contains functions for the pivot table page of the web app.
 *              New because rewritten for DAL.
 * author:      Liam Fruzyna
 * date:        2022-04-28
 */

// keys used for storing table state in sessionStorage
const SESSION_TEAMS_KEY = 'pivot-teams'
const SESSION_COLUMNS_KEY = 'pivot-columns'
const SESSION_HIGHLIGHTS_KEY = 'pivot-highlights'

var keys = []
var columns = []
var dragging = null
var selected_teams = []
var highlighted_teams = []

var results_tab, sort_dropdown, picklist_filter, stat_filter

class Column
{
    constructor(key, stat='', descending=true)
    {
        this.key = key
        this.stat = stat
        this.descending = descending
        this.last_sort = Date.now()

        this.res = cfg.get_result_from_key(key)
        this.is_match_key = false
        this.by_option = false

        this.stat_dd = null
        this.ltgt_sel = null
        this.val_entry = null
        this.options_dd = null

        this.mean = null
        this.min = null
        this.max = null

        this.update_key(key)
    }

    /**
     * Builds a JSON object representing the basic parameters of the Column.
     * @returns An object representing the column in JSON.
     */
    to_object()
    {
        return {
            key: this.key,
            stat: this.stat,
            descending: this.descending,
            last_sort: this.last_sort,
            ltgt: this.ltgt_sel !== null ? this.ltgt_sel.selected_option : null,
            value: this.val_entry !== null ? parseFloat(this.val_entry.element.value) : null,
            option: this.options_dd !== null ? this.options_dd.element.value : null
        }
    }

    /**
     * Constructs a new Column using a given JSON object created from to_object.
     * @param {Object} obj JSON object from to_object
     * @returns The constructed Column
     */
    static from_object(obj)
    {
        let col = new Column(obj.key, obj.stat, obj.descending)
        col.last_sort = obj.last_sort
        // update filter values if provided
        if (obj.ltgt && col.ltgt_sel !== null)
        {
            col.ltgt_sel.value = obj.ltgt
        }
        if (obj.value !== null && col.val_entry !== null)
        {
            col.val_entry.value = obj.value
        }
        if (obj.option !== null && col.options_dd !== null)
        {
            col.options_dd.value = obj.option
        }
        return col
    }

    /**
     * Updates the key used in the Column.
     * @param {String} key Result key
     */
    update_key(key)
    {
        this.key = key
        this.is_match_key = cfg.get_match_keys().includes(this.key)
        this.res = cfg.get_result_from_key(key)
        this.update_stat(this.stat)
    }

    /**
     * Update the stat used in the Column.
     * @param {String} stat Stat name (lower case)
     */
    update_stat(stat)
    {
        this.by_option = this.res.value_type.endsWith('-option') && this.res.lower_options.includes(stat)
        this.stat = this.res.available_stats.includes(stat) || this.by_option ? stat : this.res.default_stat
        this.build_filters()
    }

    /**
     * Constructs the stat selection and filter inputs.
     */
    build_filters()
    {
        // build a stat/option dropdown for match stats
        if (this.is_match_key)
        {
            let stats = this.res.available_stats.map(s => capitalize(s))
            if (this.res.value_type.endsWith('option'))
            {
                stats = stats.concat(this.res.options)
            }
            let stat_index = stats.map(s => s.toLowerCase()).indexOf(this.stat)
            this.stat_dd = new WRDropdown('', stats, stats[stat_index])
            this.stat_dd.on_change = () => {
                this.update_stat(this.stat_dd.element.value.toLowerCase())
                this.stat_dd.value = this.stat
                build_table()
            }
            this.stat_dd.add_class('label')
            this.stat_dd.add_class('thin')
        }
        else
        {
            this.stat_dd = null
        }

        this.ltgt_sel = null
        this.val_entry = null
        this.options_dd = null
        // build a numeric value filter for numbers and options with options selected
        if (this.res.value_type === 'number' || this.by_option)
        {
            this.ltgt_sel = new WRSelect('', ['<', '>'], '>')
            this.ltgt_sel.on_change = () => {
                this.ltgt_sel.value = this.ltgt_sel.selected_option
                this.val_entry.value = this.val_entry.element.value
                build_table()
            }
            this.ltgt_sel.add_class('slim')
            this.ltgt_sel.add_class('thin')
            this.ltgt_sel.add_class('no_input_gap')

            this.val_entry = new WREntry('')
            this.val_entry.type = 'number'
            this.val_entry.add_class('slim')
            this.val_entry.add_class('filter_number')
            this.val_entry.add_class('no_input_gap')
        }
        // build a select filter for options
        else if (this.stat !== 'count')
        {
            let ops = this.res.value_type === 'boolean' ? ['Yes', 'No'] : this.res.options
            ops = [''].concat(ops)
            this.options_dd = new WRDropdown('', ops)
            this.options_dd.on_change = () => {
                this.options_dd.value = this.options_dd.element.value
                build_table()
            }
            this.options_dd.add_class('slim')
            this.options_dd.add_class('thin')
            this.options_dd.add_class('no_input_gap')
        }
    }

    /**
     * Toggles the sort direction. Starts with descending if not currently sorted.
     */
    toggle_sort()
    {
        if (this !== get_sort_column())
        {
            this.descending = true
        }
        else
        {
            this.descending = !this.descending
        }
        this.last_sort = Date.now()
    }

    /**
     * Shortens a given array of teams based on the Column's filter.
     * @param {Array} teams A list of teams to filter.
     * @returns A shortened list of team based on the column's filter.
     */
    filter_teams(teams)
    {
        // pull values from filter input(s)
        let greater_than = null
        let value = null
        if (this.ltgt_sel !== null && this.val_entry !== null)
        {
            greater_than = this.ltgt_sel.selected_index === 1
            value = parseFloat(this.val_entry.element.value)
        }
        else if (this.options_dd !== null && !this.res.lower_options.includes(this.stat))
        {
            value = this.options_dd.element.value
        }

        // determine if each team passes the filter
        let remove_teams = []
        for (let team of teams)
        {
            let pass = true
            if (greater_than !== null && (value || value === 0))
            {
                let val = dal.compute_stat(this.key, team, this.stat)
                pass = (greater_than && val >= value) || (!greater_than && val <= value)
            }
            else if (value)
            {
                pass = dal.compute_stat(this.key, team, this.stat, true) === value
            }

            if (!pass)
            {
                remove_teams.push(team)
            }
        }

        // remove each team that did not pass the filter
        for (let team of remove_teams)
        {
            teams.splice(teams.indexOf(team), 1)
        }
        return teams
    }

    /**
     * Computes summary stats for the column for the given teams.
     * @param {Array} filtered_teams List of filtered teams
     */
    compute_summary(filtered_teams)
    {
        if (filtered_teams.length === 0)
        {
            return
        }

        let values = []
        for (let team_num of filtered_teams)
        {
            values.push(dal.compute_stat(this.key, team_num, this.stat))
        }
        this.mean = values.reduce((a, b) => a + b) / values.length
        this.min = Math.min(...values)
        this.max = Math.max(...values)
    }

    /**
     * Generates a name for the column.
     */
    get name()
    {
        return `${capitalize(this.stat)} ${this.res.name}${!this.descending ? ' Reversed' : ''}`
    }
}

/**
 * Saves the current columns, selected teams, and highlighted teams to sessionStorage.
 */
function save_state()
{
    let json = JSON.stringify(columns.map(c => c.to_object()))
    sessionStorage.setItem(SESSION_COLUMNS_KEY, json)

    json = JSON.stringify(selected_teams)
    sessionStorage.setItem(SESSION_TEAMS_KEY, json)

    json = JSON.stringify(highlighted_teams)
    sessionStorage.setItem(SESSION_HIGHLIGHTS_KEY, json)
}

/**
 * Assembles the structure of the page and parses sessionStorage.
 */
function init_page()
{
    header_info.innerText = 'Table View'

    let picklists = [''].concat(Object.keys(dal.picklists))
    selected_teams = dal.team_numbers

    sort_dropdown = new WRDropdown('Sort By Picklist', picklists)
    sort_dropdown.on_change = build_table
    let picklist_button = new WRButton('Save to Picklist', save_picklist)
    let export_button = new WRButton('Export as Spreadsheet', export_csv)

    results_tab = document.createElement('table')
    let card = new WRCard([results_tab], true)
    preview.append(new WRPage('', [card, new WRColumn('', [sort_dropdown]),
                                   new WRColumn('', [picklist_button, export_button])]))

    // add pick list filter
    picklist_filter = add_dropdown_filter(picklists, filter_teams_by_picklist, false)
    let def_filter = cfg.analysis.favorites.length ? 'Favorites' : 'All'
    stat_filter = add_dropdown_filter(['Favorites', 'All', 'Match', 'Team'], filter_stats, true, def_filter)

    // add select button above secondary list
    add_button_filter('(De)Select All', toggle_select_all, false)

    // build lists
    keys = cfg.filter_keys(cfg.get_keys(), ['string', 'object'], true)
    enable_list()
    enable_list(false)
    // iterate through result keys
    let names = cfg.get_names(keys)
    for (let i in keys)
    {
        let op = new WROption(keys[i], names[i])
        op.style = 'font-size:10px'
        add_option(op)
    }

    // add second option list of teams
    for (let team of dal.team_numbers)
    {
        let op = new WRDescriptiveOption(team, team, dal.teams[team].name, false)
        add_option(op, false)
    }

    // load column info from session storage
    let json = sessionStorage.getItem(SESSION_COLUMNS_KEY)
    if (json)
    {
        columns = JSON.parse(json).map(c => Column.from_object(c))
        for (let col of columns)
        {
            let class_list = document.getElementById(`left_pit_option_${col.key}`).classList
            if (!class_list.contains('selected'))
            {
                class_list.add('selected')
            }
        }
    }
    json = sessionStorage.getItem(SESSION_TEAMS_KEY)
    if (json)
    {
        selected_teams = JSON.parse(json)
        for (let team of selected_teams)
        {
            document.getElementById(`right_pit_option_${team}`).classList.add('selected')
        }
    }
    json = sessionStorage.getItem(SESSION_HIGHLIGHTS_KEY)
    if (json)
    {
        highlighted_teams = JSON.parse(json)
    }

    build_table()
    filter_stats()
}

/**
 * Re-build the table and selected teams using the selected picklist.
 */
function filter_teams_by_picklist()
{
    let list = picklist_filter.element.value
    if (Object.keys(dal.picklists).includes(list))
    {
        filter_by(dal.picklists[list], false)
        selected_teams = dal.picklists[list]
    }
    else
    {
        select_all(false)
        selected_teams = dal.team_numbers
    }

    build_table()
}

/**
 * Update the list of available stats based on the dropdown filter.
 */
function filter_stats()
{
    let filter = stat_filter.element.value.toLowerCase()
    let favorites = cfg.analysis.favorites
    let team_keys = cfg.get_team_keys()
    let match_keys = cfg.get_match_keys()
    for (let k of keys)
    {
        let element = document.getElementById(`left_pit_option_${k}`)
        if (filter === 'all' || element.classList.contains('selected') ||
            (filter === 'team' && team_keys.includes(k)) ||
            (filter === 'match' && match_keys.includes(k)) ||
            (filter === 'favorites' && favorites.includes(k)))
        {
            element.style.display = 'block'
        }
        else
        {
            element.style.display = 'none'
        }
    }
}

/**
 * Handles a given result being clicked.
 * @param {String} key Selected result key
 */
function open_option(key)
{
    list_name = "Team Number"
    // select team button
    if (document.getElementById(`left_pit_option_${key}`).classList.contains('selected'))
    {
        document.getElementById(`left_pit_option_${key}`).classList.remove('selected')
        columns = columns.filter(c => c.key != key)
    }
    else
    {
        document.getElementById(`left_pit_option_${key}`).classList.add('selected')
        columns.push(new Column(key))
    }

    build_table()
}

/**
 * Handles a given result being right clicked.
 * @param {String} key Selected result key
 */
function alt_option(key)
{
    // if it doens't exist (somehow) open it normally
    if (!columns.some(c => c.key === key))
    {
        open_option(key)
    }
    // otherwise add a column
    else
    {
        columns.push(new Column(key))
        build_table()
    }
}

/**
 * Toggles whether all teams are selected.
 */
function toggle_select_all()
{
    let options = right_list.children
    for (let i = 0; i < options.length; ++i)
    {
        if (!options[i].classList.contains('selected'))
        {
            select_all(false)
            selected_teams = dal.team_numbers
            build_table()
            return
        }
    }

    deselect_all(false)
    selected_teams = []
    build_table()
}

/**
 * Handles a given team being right clicked.
 * @param {String} key Selected team number
 */
function open_secondary_option(key)
{
    let class_list = document.getElementById(`right_pit_option_${key}`).classList
    // select team button
    if (class_list.contains('selected'))
    {
        class_list.remove('selected')
        selected_teams.splice(selected_teams.indexOf(key), 1)
    }
    else
    {
        class_list.add('selected')
        selected_teams.push(key)
    }

    select_none()
    build_table()
}

/**
 * Determines which column (if any) was most recently sorted.
 * @returns The current column sorted by or false if team number
 */
function get_sort_column()
{
    let sorted = columns.toSorted((a, b) => b.last_sort - a.last_sort)
    for (let col of sorted)
    {
        if (col.last_sort > 0)
        {
            return col
        }
    }
    return false
}

/**
 * Clears all column to sort by team number.
 */
function clear_sort()
{
    for (let col of columns)
    {
        col.last_sort = 0
    }
    build_table()
}

/**
 * Gets a character to append to the column name indicating sort.
 * @param {Column} column 
 * @returns Character to append to column name
 */
function get_sort_indicator(column)
{
    if (get_sort_column() !== column)
    {
        return ''
    }
    else if (!column || !column.descending)
    {
        return ' &#9650'
    }
    else
    {
        return ' &#9660'
    }
}

/**
 * Sorts the currently selected teams based on column filters.
 * @returns The sorted array of teams
 */
function get_sorted_teams()
{
    let picklist_name = sort_dropdown.element.value
    let column = get_sort_column()

    // sort by selected picklist
    if (picklist_name)
    {
        if (picklist_name in dal.picklists)
        {
            let list = dal.picklists[picklist_name]
            selected_teams.sort((a,b) => {
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
    else if (column)
    {    
        let key = column.key
        let stat = column.stat
        let value_type = column.res.value_type
    
        // sort strings alphabetically
        if (value_type === 'string')
        {
            selected_teams.sort((a,b) => dal.compute_stat(key, a, stat).localeCompare(dal.compute_stat(key, b, stat)))
        }
        // sort selectables by
        else if (stat === 'total' && value_type === 'int-option')
        {
            selected_teams.sort((a,b) => {
                // total stats are stored as HTML string so some string manipulation is needed
                let a_val = dal.compute_stat(key, a, stat).split('<br>')[0].split(' ')[1]
                let b_val = dal.compute_stat(key, b, stat).split('<br>')[0].split(' ')[1]
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
            selected_teams.sort((a,b) => {
                let a_val = dal.compute_stat(key, a, stat)
                let b_val = dal.compute_stat(key, b, stat)
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

        // reverse order if requested
        if (!column.descending)
        {
            selected_teams.reverse()
        }
    }
    // otherwise maintain sort by team number
    else
    {
        selected_teams.sort((a, b) => a - b)
    }

    // move selected teams to the top
    selected_teams.sort((a, b) => {
        let highlight_a = highlighted_teams.includes(a)
        let highlight_b = highlighted_teams.includes(b)
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

    return selected_teams
}

/**
 * Builds the pivot table.
 */
function build_table()
{
    // sort teams based on parameters
    let sorted_teams = get_sorted_teams()

    // get list of picked teams to fade
    let picked_teams = []
    if (Object.keys(dal.picklists).includes('picked'))
    {
        picked_teams = dal.picklists.picked
    }

    // clear table
    results_tab.replaceChildren()

    // build table headers
    let keys_row = results_tab.insertRow()
    keys_row.classList.add('sticky_header')
    keys_row.insertCell()
    let team_header = create_element('th', 'team')
    team_header.ondragover = dragover_handler
    team_header.ondragenter = dragenter_handler
    team_header.ondrop = drop_handler
    team_header.onclick = clear_sort
    team_header.innerHTML = `Team Number${get_sort_indicator(false)}`
    keys_row.append(team_header)

    let filters_row = results_tab.insertRow()
    filters_row.insertCell()
    let filter_header = document.createElement('th')
    filter_header.innerText = 'Filter if'
    filters_row.append(filter_header)

    let totals_row = results_tab.insertRow()
    totals_row.insertCell()
    let total_header = document.createElement('th')
    total_header.innerText = 'All Teams'
    totals_row.append(total_header)

    let selected = get_sort_column()
    let filtered_teams = sorted_teams.toSpliced()
    // compute mean, min, and max of all stats
    for (let col of columns)
    {
        let key = col.key
        let stat = col.stat

        col.filter_teams(filtered_teams)

        // add key names
        let col_header = create_element('th', `header_i`)
        col_header.draggable = true
        col_header.ondragstart = (event) => dragstart_handler(event, col)
        col_header.ondragover = dragover_handler
        col_header.ondragenter = dragenter_handler
        col_header.ondrop = (event) => drop_handler(event, col)
        // reverse sort if selected
        col_header.onclick = (event) => {
            col.toggle_sort()
            build_table()
        }
        col_header.onauxclick = (event) => alt_option(key)
        col_header.oncontextmenu = (event) => false
        col_header.ontouchstart = (event) => touch_start()
        col_header.ontouchmove = (event) => touch_move()
        col_header.ontouchend = (event) => touch_end(`alt_option('${key}')`)
        keys_row.append(col_header)

        let unique = []
        for (let team of sorted_teams)
        {
            let mapped_val = dal.compute_stat(key, team, stat, true)
            if (mapped_val !== null && !unique.includes(mapped_val))
            {
                unique.push(mapped_val)
            }
        }

        // sort filter options
        if (col.res.value_type === 'number')
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

        if (col.stat_dd !== null)
        {
            col_header.append(col.stat_dd)
        }

        let col_key = document.createElement('span')
        col_key.innerHTML = `${col.res.name}${get_sort_indicator(col)}`
        col_header.append(col_key)

        // build dropdown for filter
        let filter_el = []

        if (col.ltgt_sel !== null && col.val_entry !== null)
        {
            filter_el.push(new WRColumn('', [col.ltgt_sel]), new WRColumn('', [col.val_entry]))
        }
        else if (col.options_dd !== null && !col.res.lower_options.includes(col.stat))
        {
            filter_el.push(col.options_dd)
        }

        // build cells
        filters_row.insertCell().append(...filter_el)

        totals_row.insertCell().innerHTML = dal.compute_stat(key, filtered_teams, stat.toLowerCase(), true)
    }

    for (let col of columns)
    {
        col.compute_summary(filtered_teams)
    }

    // build team rows
    for (let idx in filtered_teams)
    {
        let team = filtered_teams[idx]
        let row = results_tab.insertRow()
        row.insertCell().innerText = parseInt(idx) + 1
        let team_num = row.insertCell()
        team_num.innerText = team
        team_num.title = dal.teams[team].name
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
            build_table()
        }
        team_num.oncontextmenu = (event) => {
            toggle_highlighted_team(team)
            return false
        }
        team_num.ontouchstart = (event) => touch_start()
        team_num.ontouchmove = (event) => touch_move()
        team_num.ontouchend = (event) => touch_end(`toggle_highlighted_team('${team}')`)
        if (highlighted_teams.includes(team))
        {
            team_num.classList.add('highlighted')
        }
        if (picked_teams.includes(team))
        {
            row.classList.add('faded')
        }

        for (let col of columns)
        {
            let key = col.key
            let stat = col.stat
            let cell = row.insertCell()

            if (col.mean !== null)
            {
                // compute color
                let val = dal.compute_stat(key, team, stat)
                let min = col.min
                let max = col.max
                let mean = col.mean
                if (val !== null && !picked_teams.includes(team) && val !== mean && (stat !== 'total' || (col.res.value_type === 'int-option')))
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

                    if (col.res.negative === true || stat === 'stddev')
                    {
                        colors = [colors[1], colors[0], colors[2], colors[3]]
                    }
                    cell.style.backgroundColor = `rgba(${colors.join(',')})`
                }
            }

            cell.innerHTML = dal.compute_stat(key, team, stat, true)
        }
    }

    save_state()
}

/**
 * Toggles whether a given team is selected.
 * @param {String} team_num Team number to toggle
 */
function toggle_highlighted_team(team_num)
{
    if (highlighted_teams.includes(team_num))
    {
        highlighted_teams.splice(highlighted_teams.indexOf(team_num), 1)
    }
    else
    {
        highlighted_teams.push(team_num)
    }
    build_table()
}

/**
 * Saves the current list of team in order as a picklist.
 */
function save_picklist()
{
    // get selected keys on either side
    let filtered_teams = get_sorted_teams().toSpliced()

    // filter teams by selected
    for (let col of columns)
    {
        filtered_teams = col.filter_teams(filtered_teams)
    }

    // build picklist name
    let name = get_sort_column().name
    if (name === false)
    {
        name = 'Team Number'
    }
    while (dal.picklists.hasOwnProperty(name))
    {
        name += '+'
    }

    // save picklist
    dal.picklists[name] = filtered_teams
    dal.save_picklists()
    alert(`${name} Created`)
}

/**
 * Exports the current pivot table as a CSV file.
 */
function export_csv()
{
    let filtered_teams = get_sorted_teams().toSpliced()
    for (let col of columns)
    {
        col.filter_teams(filtered_teams)
    }

    // build team rows
    let table = [['Team'].concat(columns.map(c => c.name))]
    table = table.concat(filtered_teams.map(t => [t].concat(columns.map(c => dal.compute_stat(c.key, t, c.stat, true)))))

    // convert 2D array to CSV
    let csv = table.map(r => r.map(c => `"${c}"`).join(',')).join('\n')

    download_object('pivot-export.csv', csv)
}

/**
 * Handles a column getting picked up and stores it.
 * @param {Event} e Event
 * @param {Column} column Selected column
 */
function dragstart_handler(e, column)
{
    dragging = column
}

/**
 * Allows drop handler to work.
 * @param {Event} e Event
 */
function dragover_handler(e)
{
    e.preventDefault()
}

/**
 * Allows drop handler to work.
 * @param {Event} e Event
 */
function dragenter_handler(e)
{
    e.preventDefault()
}

/**
 * Handles the dragged column being released.
 * @param {Event} e Event
 * @param {Column} column Column that the held one is dropped on.
 */
function drop_handler(e, column=false)
{
    e.preventDefault()
    if (dragging !== null)
    {
        // determines where in order the column was dropped
        let old_index = columns.indexOf(dragging)
        let new_index = 0
        if (column)
        {
            new_index = columns.indexOf(column)
            let x = e.clientX - e.target.parentElement.getBoundingClientRect().left
            let middle = e.target.parentElement.offsetWidth / 2
            if (x > middle)
            {
                // TODO: with certain column this false positives
                ++new_index
            }
        }
        if (old_index < new_index)
        {
            --new_index
        }

        // rearrange the columns array to move the column
        columns.splice(old_index, 1)
        if (new_index === 0)
        {
            columns.unshift(dragging)
        }
        else if (new_index === columns.length)
        {
            columns.push(dragging)
        }
        else
        {
            columns = columns.slice(0, new_index).concat(dragging, ...columns.slice(new_index))
        }

        build_table()
    }
    dragging = null
}
