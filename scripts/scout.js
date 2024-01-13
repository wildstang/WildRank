/**
 * file:        scout.js
 * description: Page for collecting scouting data during matches.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

const start = Date.now()

var cycles = {}
var alliances = {}

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

    let match_box = document.createElement('span')
    let team_box = document.createElement('span')
    document.getElementById('header_info').append(match_box, ' - Scouting: ', team_box)

    // build the page from config for the desired mode
    switch (scout_mode)
    {
        case PIT_MODE:
            match_box.innerText = 'Pit'
            team_box.innerText = team_num
            team_box.style.color = 'white'
            break
        case MATCH_MODE:
            let pos = 1 + parseInt(scout_pos)
            if (pos > dal.alliance_size)
            {
                pos -= dal.alliance_size
            }
            match_box.innerText = dal.get_match_value(match_num, 'match_name')
            team_box.innerText = `${team_num} (${pos})`
            team_box.style.color = alliance_color
            team_box.style.backgroundColor = 'rgba(0, 0, 0, 0.33)'
            team_box.style.boxShadow = '0 0 4px 4px rgba(0, 0, 0, 0.33)'

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
    let view_start = Math.ceil(carousel.scrollLeft)
    if (view_start >= final_page && document.getElementById('submit') === null)
    {
        let submit = new Button('submit', 'Submit', 'get_results_from_page()')
        document.getElementById('submit_container').append(submit.element)
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
    let body = document.createElement('div')
    body.id = 'scouting-carousel'
    body.className = 'scouting-carousel'
    body.onscroll = check_for_last_page
    for (let page of cfg[scout_mode])
    {
        let page_frame = new PageFrame(page.id, page.name)
        // iterate through each column in the page
        for (let column of page.columns)
        {
            let cycle = column.cycle
            let col_frame = build_column_from_config(column, scout_mode, select_ids, edit, match_num, team_num, alliance_color, alliances)
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
        body.append(page_frame.element)
    }

    let unsure = new Checkbox('unsure', `Unsure of Results`)
    let submit = document.createElement('span')
    submit.id = 'submit_container'
    let page_options = new PageFrame('', '', [new ColumnFrame('', '', [unsure]), new ColumnFrame('', '', [submit])])
    document.getElementById('body').replaceChildren(body, page_options.element)
    check_for_last_page()

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
    let cycle_num = parseInt(document.getElementById(cycles_id).innerHTML)
    let saved_cycles = cycles[cycle].length

    let existing_result = {}
    let cycle_result = {}
    let new_cycle = true
    if (cycle_num < saved_cycles)
    {
        new_cycle = false
        existing_result = cycles[cycle][cycle_num]
    }

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
                            }
                            Select.select_option(id, new_cycle ? ops.indexOf(def) : existing_result[id])
                            break
                        case 'multiselect':
                            for (let i in ops)
                            {
                                let name = `${id}_${ops[i].toLowerCase().split().join('_')}`
                                if (!decrement)
                                {
                                    cycle_result[name] = MultiSelect.get_selected_options(id).includes(parseInt(i))
                                }
                                MultiSelect.reset_selection(id, i)
                                if (new_cycle ? def[i] : existing_result[name])
                                {
                                    MultiSelect.select_option(id, i)
                                }
                            }
                            break
                        case 'dropdown':
                            if (!decrement)
                            {
                                cycle_result[id] = document.getElementById(id).selectedIndex
                            }
                            document.getElementById(id).selectedIndex = new_cycle ? ops.indexOf(def) : existing_result[id]
                            break
                        case 'multicounter':
                            for (let op of ops)
                            {
                                let op_id = `${id}_${op.toLowerCase().split().join('_')}`
                                if (!decrement)
                                {
                                    cycle_result[op_id] = parseInt(document.getElementById(`${op_id}-value`).innerHTML)
                                }
                                document.getElementById(`${op_id}-value`).innerHTML = new_cycle ? def : existing_result[op_id]
                            }
                            break
                        case 'checkbox':
                            if (!decrement)
                            {
                                cycle_result[id] = document.getElementById(id).checked
                            }
                            document.getElementById(id).checked = new_cycle ? def : existing_result[id]

                            // highlight checkbox
                            if (document.getElementById(id).checked)
                            {
                                document.getElementById(`${id}-container`).classList.add('selected')
                            }
                            else
                            {
                                document.getElementById(`${id}-container`).classList.remove('selected')
                            }
                            break
                        case 'counter':
                            if (!decrement)
                            {
                                cycle_result[id] = parseInt(document.getElementById(id).innerHTML)
                            }
                            document.getElementById(id).innerHTML = new_cycle ? def : existing_result[id]
                            break
                        case 'slider':
                            if (!decrement)
                            {
                                cycle_result[id] = parseInt(document.getElementById(id).value)
                            }
                            Slider.set_slider(id, new_cycle ? def : existing_result[id])
                            break
                        case 'number':
                            if (!decrement)
                            {
                                cycle_result[id] = parseInt(document.getElementById(id).value)
                            }
                            document.getElementById(id).value = new_cycle ? def : existing_result[id]
                            break
                        case 'timer':
                            if (!decrement)
                            {
                                cycle_result[id] = parseFloat(document.getElementById(id).innerHTML)
                            }
                            document.getElementById(id).innerHTML = new_cycle ? def : existing_result[id]
                            break
                        case 'string':
                        case 'text':
                            if (!decrement)
                            {
                                cycle_result[id] = document.getElementById(id).value
                            }
                            document.getElementById(id).value = new_cycle ? def : existing_result[id]
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
    if (new_cycle)
    {
        cycles[cycle].push(cycle_result)
    }
    else if (!decrement)
    {
        cycles[cycle][cycle_num-1] = cycle_result
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
                            if (Select.get_selected_option(id) != ops.indexOf(def) && ops.indexOf(def) >= 0)
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
                        case 'checkbox':
                            if (document.getElementById(id).checked != def)
                            {
                                return id
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
        document.getElementById(cid).style['background-color'] = '#FFF2A8'
        let container = document.getElementById(`${cid}_container`)
        if (container !== null)
        {
            container.style['background-color'] = '#FFF2A8'
        }
        if (confirm(`There are unsaved cycles (${cid})! Do you want to return?`))
        {
            return
        }
    }
    let iid = check_results()
    if (iid)
    {
        document.getElementById(iid).style['background-color'] = '#FAA0A0'
        let container = document.getElementById(`${iid}_container`)
        if (container !== null)
        {
            container.style['background-color'] = '#FAA0A0'
        }
        alert(`There are unchanged defaults! (${iid})`)
        return
    }
    
    results = {}

    // scouter metadata
    results['meta_scouter_id'] = parseInt(user_id)
    results['meta_scout_time'] = Math.round(start / 1000)
    results['meta_scouting_duration'] = (Date.now() - start) / 1000
    results['meta_config_version'] = cfg.version
    if (scout_mode === MATCH_MODE)
    {
        results['meta_unsure'] = document.getElementById('unsure').checked
    }
    else if (scout_mode === PIT_MODE)
    {
        results['meta_pit_unsure'] = document.getElementById('unsure').checked
    }

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
        results['meta_ignore'] = false
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
                let cs = cycles[column.id]
                let val = cs.length - parseInt(document.getElementById(`${column.id}_cycles-value`).innerHTML)
                if (val > 0)
                {
                    if (!confirm(`Are you sure you want to dispose of ${val} cycles (${column.id})`))
                    {
                        return
                    }
                    cs.splice(-val, val)
                }
                results[column.id] = cs
            }
            else
            {
                Object.assign(results, get_results_from_column(column, scout_mode, '', '', alliances))
            }
        }
    }

    if (!confirm('Are you sure you want to submit?'))
    {
        return
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
 * function:    check_results
 * parameters:  none
 * returns:     name of default value that has not changes
 * description: Checks if all required values have changed from default.
 */
function check_results()
{
    // get each result
    for (let page of cfg[scout_mode])
    {
        for (let column of page.columns)
        {
            let ret = check_column(column, scout_mode)
            if (ret)
            {
                return ret
            }
        }
    }

    return false
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
                        let options = input.options
    
                        switch (type)
                        {
                            case 'checkbox':
                                c[id] = random_bool()
                                break
                            case 'counter':
                                c[id] = random_int()
                                break
                            case 'multicounter':
                                for (let op of options)
                                {
                                    let name = `${id}_${op.toLowerCase().split().join('_')}`
                                    c[name] = random_int()
                                }
                                break
                            case 'select':
                                c[id] = random_int(0, options.length - 1)
                                break
                            case 'multiselect':
                                c[id] = random_int(0, options.length - 1)
                                break
                            case 'dropdown':
                                c[id] = random_int(0, options.length - 1)
                                break
                            case 'number':
                            case 'slider':
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
                                c[id] = random_int(min, max)
                                break
                            case 'string':
                                c[id] = "Random result"
                                break
                            case 'text':
                                c[id] = "This result was randomly generated"
                                break
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
                        case 'slider':
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