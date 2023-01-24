/**
 * file:        scout.js
 * description: Page for collecting scouting data during matches.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

const start = Date.now()

var cycles = {}

// read parameters from URL
const scout_pos = get_parameter(POSITION_COOKIE, POSITION_DEFAULT)
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)
const scout_mode = get_parameter(TYPE_COOKIE, TYPE_DEFAULT)

var urlParams = new URLSearchParams(window.location.search)
const match_num = urlParams.get('match')
const team_num = urlParams.get('team')
const alliance_color = urlParams.get('alliance')
const generate = urlParams.get('generate')
var edit = urlParams.get('edit') == 'true'

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    // check if result exists to be edited
    if (edit)
    {
        switch (scout_mode)
        {
            case MATCH_MODE:
                edit = dal.is_match_scouted(match_num, team_num)
                break
            case PIT_MODE:
                edit = dal.is_pit_scouted(team_num)
                break
            default:
                console.log('Invalid mode')
                edit = false
                break
        }
        if (!edit)
        {
            console.log(`Existing result, could not be found`)
        }
    }

    // build the page from config for the desired mode
    switch (scout_mode)
    {
        case PIT_MODE:
            document.getElementById('header_info').innerHTML = `Match: <span id="match">Pit</span> - Scouting: <span id="team" style="color: white">${team_num}</span>`
            break
        case MATCH_MODE:
            let pos = 1 + parseInt(scout_pos)
            if (pos > dal.alliance_size)
            {
                pos -= dal.alliance_size
            }
            document.getElementById('header_info').innerHTML = `Match: <span id="match">${dal.get_match_value(match_num, 'match_name')}</span> - Scouting: <span id="team" style="color: ${alliance_color}">${team_num} (${pos})</span>`

            alliances = dal.build_relative_alliances(team_num, match_num)
            break
    }
    ws(team_num)
    build_page_from_config()
    if ((generate === 'random' && cfg.settings.allow_random) || generate === 'force')
    {
        generate_results()
    }
}

/**
 * function:    check_for_last_page
 * parameters:  none
 * returns:     none
 * description: If on the last page, add the submit button.
 */
function check_for_last_page()
{
    let carousel = document.getElementById('scouting-carousel')
    let final_page = carousel.clientWidth * (cfg[scout_mode].length - 1)
    if (carousel.scrollLeft >= final_page && document.getElementById('submit') === null)
    {
        let submit = new Button('submit', 'Submit', 'get_results_from_page()')
        document.getElementById('submit_container').innerHTML = submit.toString
    }
}

/**
 * function:    build_page_from_config
 * parameters:  none
 * returns:     none
 * description: Builds the page from the config file and the given mode.
 */
function build_page_from_config()
{
    let select_ids = []
    // iterate through each page in the mode
    let body = '<div id="scouting-carousel" class="scouting-carousel" onscroll="check_for_last_page()">'
    for (let page of cfg[scout_mode])
    {
        let page_frame = new PageFrame(page.id, page.name)
        // iterate through each column in the page
        for (let column of page.columns)
        {
            let cycle = column.cycle
            let col_frame = new ColumnFrame(column.id, column.name)
            // iterate through input in the column
            for (let input of column.inputs)
            {
                var name = input.name
                var id = input.id
                var type = input.type
                var default_val = input.default
                let options = input['options']

                // map results to defaults in edit mode
                if (edit && scout_mode === MATCH_MODE)
                {
                    default_val = dal.get_result_value(team_num, match_num, id)
                    if (type === 'dropdown' || type === 'select')
                    {
                        default_val = input['options'][default_val]
                    }
                    else if (type === 'multicounter' || type === 'multiselect')
                    {
                        default_val = input.options.map(function (op)
                        {
                            let name = `${id}_${op.toLowerCase().split().join('_')}`
                            return dal.get_result_value(team_num, match_num, name)
                        })
                    }
                }
                else if (edit && scout_mode === PIT_MODE)
                {
                    default_val = dal.get_value(team_num, `pit.${id}`)
                    if (type == 'dropdown' || type == 'select')
                    {
                        default_val = input['options'][default_val]
                    }
                    else if (type == 'multicounter' || type === 'multiselect')
                    {
                        default_val = input.options.map(function (op)
                        {
                            let name = `${id}_${op.toLowerCase().split().join('_')}`
                            return dal.get_value(team_num, `pit.${name}`)
                        })
                    }
                }

                // replace opponentsX with the team's opponent team numbers
                if (options instanceof Array && options.length > 0)
                {
                    options = options.map(op => dal.fill_team_numbers(op, alliances))
                }
                name = dal.fill_team_numbers(name, alliances)

                let item
                // build each input from its template
                switch (type)
                {
                    case 'checkbox':
                        if (default_val)
                        {
                            select_ids.push(`${id}-container`)
                        }
                        item = new Checkbox(id, name, default_val)
                        break
                    case 'counter':
                        item = new Counter(id, name, default_val)
                        break
                    case 'multicounter':
                        item = new MultiCounter(id, name, options, default_val)
                        break
                    case 'select':
                        item = new Select(id, name, options, default_val)
                        item.vertical = input.vertical
                        break
                    case 'multiselect':
                        let def = []
                        if (default_val instanceof Array)
                        {
                            for (let i in default_val)
                            {
                                if (default_val[i])
                                {
                                    def.push(options[parseInt(i)])
                                }
                            }
                        }
                        else if (default_val)
                        {
                            default_val.split(',')
                        }
                        item = new MultiSelect(id, name, options, def)
                        item.vertical = input.vertical
                        break
                    case 'dropdown':
                        item = new Dropdown(id, name, options, default_val)
                        break
                    case 'string':
                        item = new Entry(id, name, default_val)
                        break
                    case 'number':
                        item = new Entry(id, name, default_val)
                        item.type = 'number'
                        item.bounds = options
                        break
                    case 'slider':
                        item = new Slider(id, name, default_val)
                        item.bounds = options
                        break
                    case 'text':
                        item = new Extended(id, name, default_val)
                        break
                }
                col_frame.add_input(item)
            }
            if (cycle)
            {
                // create cycle counter, call update_cycle() on change
                let cycler = new Cycler(`${column.id}_cycles`, 'Cycles')
                if (cycle)
                {
                    cycler.on_increment = `update_cycle('${column.id}', false)`
                    cycler.on_decrement = `update_cycle('${column.id}', true)`
                }
                col_frame.add_input(cycler)

                // create and populate (if editing) cycle arrays
                if (edit)
                {
                    cycles[column.id] = dal.get_result_value(team_num, match_num, column.id)
                }
                else
                {
                    cycles[column.id] = []
                }
                col_frame.add_class('cycle')
            }
            page_frame.add_column(col_frame)
        }
        body += page_frame.toString  
    }
    body += '</div>'
    let unsure = new Checkbox('unsure', `Unsure of Results`)
    let page_frame = new PageFrame('', '', [new ColumnFrame('', '', [unsure]), new ColumnFrame('', '', ['<span id="submit_container"></span>'])])
    document.body.innerHTML += body + page_frame.toString

    // mark each selected box as such
    for (let id of select_ids)
    {
        document.getElementById(id).classList.add('selected')
    }

    // populate first cycles into inputs
    if (edit)
    {
        for (let cycle of Object.keys(cycles))
        {
            update_cycle(cycle, cycles[cycle].length > 0)
        }
    }
}

/**
 * function:    update_cycle
 * parameters:  cycle name, if cycle was decremented
 * returns:     none
 * description: Saves the current cycles and moves on to the next.
 */
function update_cycle(cycle, decrement)
{
    // get selected and total number of cycles
    let cycles_id = `${cycle}_cycles-value`
    let val = parseInt(document.getElementById(cycles_id).innerHTML)
    let last = cycles[cycle].length

    let cycle_result = {}

    // iterate through each column in the page
    for (let page of cfg[scout_mode])
    {
        // iterate through each column in the page
        for (let column of page.columns)
        {
            if (column.id == cycle)
            {
                // populate/save each input in the cycle
                for (let input of column.inputs)
                {
                    // only multicounter, select, and dropdown are supported in cycles
                    let type = input.type
                    let id = input.id
                    let ops = input.options
                    let def = input.default

                    switch (type)
                    {
                        case 'select':
                            if (!decrement)
                            {
                                cycle_result[id] = Select.get_selected_option(id)
                                let op = ops.indexOf(def)
                                if (op >= 0)
                                {
                                    Select.select_option(id, op)
                                }
                            }
                            if (val < last)
                            {
                                Select.select_option(id, cycles[cycle][val][id])
                            }
                            break
                        case 'dropdown':
                            if (!decrement)
                            {
                                cycle_result[id] = document.getElementById(id).selectedIndex
                                let op = ops.indexOf(def)
                                if (op >= 0)
                                {
                                    document.getElementById(id).selectedIndex = op
                                }
                            }
                            if (val < last)
                            {
                                document.getElementById(id).selectedIndex = cycles[cycle][val][id]
                            }
                            break
                        case 'multicounter':
                            for (let op of ops)
                            {
                                let op_id = `${id}_${op.toLowerCase().split().join('_')}`
                                if (!decrement)
                                {
                                    cycle_result[op_id] = parseInt(document.getElementById(`${op_id}-value`).innerHTML)
                                    document.getElementById(`${op_id}-value`).innerHTML = def
                                }
                                if (val < last)
                                {
                                    document.getElementById(`${op_id}-value`).innerHTML = cycles[cycle][val][op_id]
                                }
                            }
                            break
                        case 'counter':
                            if (!decrement)
                            {
                                cycle_result[id] = parseInt(document.getElementById(`${id}`).innerHTML)
                                document.getElementById(`${id}`).innerHTML = def
                            }
                            if (val < last)
                            {
                                document.getElementById(`${id}`).innerHTML = cycles[cycle][val][id]
                            }
                            break
                        default:
                            // do nothing, no other inputs allowed
                            break
                    }
                }
            }
        }
    }

    // store cycle in appropriate position
    if (val > last)
    {
        cycles[cycle].push(cycle_result)
    }
    else if (!decrement)
    {
        cycles[cycle][val-1] = cycle_result
    }
}

/**
 * function:    check_cycles
 * parameters:  none
 * returns:     False is all cycles are saved, unsaved id otherwise.
 * description: Determines if any cycles are unfinished.
 */
function check_cycles()
{
    // iterate through each column in the page
    for (let page of cfg[scout_mode])
    {
        // iterate through each column in the page
        for (let column of page.columns)
        {
            if (column.cycle == true)
            {
                // populate/save each input in the cycle
                for (let input of column.inputs)
                {
                    // only multicounter, select, and dropdown are supported in cycles
                    let type = input.type
                    let id = input.id
                    let ops = input.options
                    let def = input.default

                    switch (type)
                    {
                        case 'select':
                            if (Select.get_selected_option(id) != ops.indexOf(def))
                            {
                                return id
                            }
                            break
                        case 'dropdown':
                            if (document.getElementById(id).value != def)
                            {
                                return id
                            }
                            break
                        case 'multicounter':
                            for (let op of ops)
                            {
                                let op_id = `${id}_${op.toLowerCase().split().join('_')}`
                                if (document.getElementById(`${op_id}-value`).innerHTML != def)
                                {
                                    return id
                                }
                            }
                            break
                        case 'counter':
                            if (document.getElementById(id).innerHTML != def)
                            {
                                return id
                            }
                            break
                        default:
                            // do nothing, no other inputs allowed
                            break
                    }
                }
            }
        }
    }
    return false
}

/**
 * function:    get_results_from_page
 * parameters:  none
 * returns:     none
 * description: Accumulates the results from the page into a new object.
 */
function get_results_from_page()
{
    let cid = check_cycles()
    if (cid)
    {
        if (confirm(`There are unsaved cycles (${cid})! Do you want to return?`))
        {
            return
        }
    }
    if (!confirm('Are you sure you want to submit?'))
    {
        return
    }
    
    results = {}

    // scouter metadata
    results['meta_scouter_id'] = parseInt(user_id)
    results['meta_scout_time'] = Math.round(start / 1000)
    results['meta_scouting_duration'] = (Date.now() - start) / 1000
    results['meta_unsure'] = document.getElementById('unsure').checked

    // scouting metadata
    results['meta_scout_mode'] = scout_mode
    results['meta_position'] = parseInt(scout_pos)
    results['meta_event_id'] = event_id

    // match metadata
    if (scout_mode != PIT_MODE)
    {
        results['meta_match_key'] = match_num
        results['meta_comp_level'] = dal.get_match_value(match_num, 'comp_level')
        results['meta_set_number'] = parseInt(dal.get_match_value(match_num, 'set_number'))
        results['meta_match'] = parseInt(dal.get_match_value(match_num, 'match_number'))
        results['meta_alliance'] = alliance_color
    }
    results['meta_team'] = parseInt(team_num)

    // get each result
    for (let page of cfg[scout_mode])
    {
        for (let column of page.columns)
        {
            // check if its a cycle column
            if (column.cycle)
            {
                results[column.id] = cycles[column.id]
            }
            else
            {
                for (let input of column.inputs)
                {
                    let id = input.id
                    let type = input.type
                    let options = input.options

                    // replace opponentsX with the team's opponent team numbers
                    let op_ids = options
                    if (options instanceof Array && options.length > 0)
                    {
                        op_ids = options.map(op => dal.fill_team_numbers(op, alliances))
                    }

                    switch (type)
                    {
                        case 'checkbox':
                            results[id] = document.getElementById(id).checked
                            break
                        case 'counter':
                            results[id] = parseInt(document.getElementById(id).innerHTML)
                            break
                        case 'multicounter':
                            for (let i in options)
                            {
                                let name = `${id}_${options[i].toLowerCase().split().join('_')}`
                                let html_id = `${id}_${op_ids[i].toLowerCase().split().join('_')}`
                                results[name] = parseInt(document.getElementById(`${html_id}-value`).innerHTML)
                            }
                            break
                        case 'select':
                            results[id] = -1
                            let children = document.getElementById(id).getElementsByClassName('wr_select_option')
                            let i = 0
                            for (let option of children)
                            {
                                if (option.classList.contains('selected'))
                                {
                                    results[id] = i
                                }
                                i++
                            }
                            break
                        case 'multiselect':
                            for (let i in options)
                            {
                                let name = `${id}_${options[i].toLowerCase().split().join('_')}`
                                results[name] = MultiSelect.get_selected_options(id).includes(parseInt(i))
                            }
                            break
                        case 'dropdown':
                            results[id] = document.getElementById(id).selectedIndex
                            break
                        case 'number':
                            results[id] = parseInt(document.getElementById(id).value)
                            break
                        case 'slider':
                            results[id] = parseInt(document.getElementById(id).value)
                            break
                        case 'string':
                        case 'text':
                            results[id] = document.getElementById(id).value
                            break
                    }
                }
            }
        }
    }

    // get result name
    let file = `pit-${event_id}-${team_num}`
    if (scout_mode === MATCH_MODE)
    {
        file = `match-${match_num}-${team_num}`
    }
    localStorage.setItem(file, JSON.stringify(results))
    
    if (scout_mode === PIT_MODE)
    {
        query = {'page': 'pits', [EVENT_COOKIE]: event_id, [USER_COOKIE]: user_id}
    }
    else
    {
        query = {'page': 'matches', [TYPE_COOKIE]: MATCH_MODE, [EVENT_COOKIE]: event_id, [POSITION_COOKIE]: scout_pos, [USER_COOKIE]: user_id}
    }
    window.location.href = build_url('selection', query)
}

/**
 * function:    generate_results
 * parameters:  none
 * returns:     none
 * description: Populates the page with randomly generated results.
 */
function generate_results()
{
    for (let page of cfg[scout_mode])
    {
        for (let column of page.columns)
        {
            // check if its a cycle column
            if (column.cycle)
            {
                let cycle = []
                let num_cycles = random_int()
                for (let i = 0; i < num_cycles; ++i)
                {
                    let c = {}
                    for (let input of column.inputs)
                    {
                        let id = input.id
                        let type = input.type
                        let ops = input.options

                        if (type == 'multicounter')
                        {
                            for (let op of ops)
                            {
                                c[`${id}_${op.toLowerCase().split().join('_')}`] = random_int()
                            }
                        }
                        else if (type == 'counter')
                        {
                            c[id] = random_int()
                        }
                        else
                        {
                            c[id] = random_int(0, ops.length-1)
                        }
                    }
                    cycle.push(c)
                }
                cycles[column.id] = cycle
                update_cycle(column.id, true)
            }
            else
            {
                for (let input of column.inputs)
                {
                    var id = input.id
                    var type = input.type
                    var options = input.options
    
                    switch (type)
                    {
                        case 'checkbox':
                            document.getElementById(id).checked = random_bool()
                            break
                        case 'counter':
                            document.getElementById(id).innerHTML = random_int()
                            break
                        case 'multicounter':
                            for (let op of options)
                            {
                                let name = `${id}_${op.toLowerCase().split().join('_')}`
                                document.getElementById(`${name}-value`).innerHTML = random_int()
                            }
                            break
                        case 'select':
                            Select.select_option(id, random_int(0, options.length - 1))
                            break
                        case 'multiselect':
                            MultiSelect.select_option(id, random_int(0, options.length - 1))
                            break
                        case 'dropdown':
                            document.getElementById(id).selectedIndex = random_int(0, options.length - 1)
                            break
                        case 'number':
                        case 'silder':
                            let min = 0
                            let max = 10
                            if (options.length == 2)
                            {
                                min = options[0]
                                max = options[1]
                            }
                            else if (options.length == 1)
                            {
                                max = options[0]
                            }
                            document.getElementById(id).value = random_int(min, max)
                            break
                        case 'string':
                            document.getElementById(id).value = "Random result"
                            break
                        case 'text':
                            document.getElementById(id).value = "This result was randomly generated"
                            break
                    }
                }
            }
        }
    }
}