/**
 * file:        scout.js
 * description: Contains functions for the scouting page of the web app.
 *              Primarily for building the interface from event and config data.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

const start = Date.now()

var cycles = {}

/** 
 * function:    build_page_from_config
 * parameters:  none
 * returns:     none
 * description: Builds the page from the config file and the given mode.
 */
function build_page_from_config()
{
    var select_ids = []
    // iterate through each page in the mode
    config.pages.forEach(function (page, index)
    {
        var page_name = page.name
        columns = []
        // iterate through each column in the page
        page['columns'].forEach(function (column, index)
        {
            var col_name = column.name
            let cycle = column.cycle
            let cycle_ops = {}
            items = []
            // iterate through input in the column
            column['inputs'].forEach(function (input, index)
            {
                var name = input.name
                var id = input.id
                var type = input.type
                var default_val = input.default
                let options = input['options']
                if (edit)
                {
                    default_val = results[id]
                    if (type == 'dropdown' || type == 'select')
                    {
                        default_val = input['options'][default_val]
                    }
                    else if (type == 'multicounter')
                    {
                        default_val = input.options.map(function (op)
                        {
                            let name = `${id}_${op.toLowerCase().split().join('_')}`
                            return results[name]
                        })
                    }
                }

                // add the current input layer to the cycles
                if (cycle && (type == 'select' || type == 'dropdown' || type == 'multicounter'))
                {
                    let new_cops = {}
                    for (let op of options)
                    {
                        if (Object.keys(cycle_ops).length == 0)
                        {
                            new_cops[`${column.id}_${op.toLowerCase().split().join('_')}`] =
                            {
                                name: `${column.name} ${op}`,
                                total: 0,
                                values: []
                            }
                        }
                        for (let cop of Object.keys(cycle_ops))
                        {
                            new_cops[`${cop}_${op.toLowerCase().split().join('_')}`] =
                            {
                                name: `${cycle_ops[cop].name} ${op}`,
                                total: 0,
                                values: []
                            }
                        }
                    }
                    cycle_ops = new_cops
                }

                var item = ''
                // build each input from its template
                switch (type)
                {
                    case 'checkbox':
                        if (default_val)
                        {
                            select_ids.push(`${id}-container`)
                        }
                        item = build_checkbox(id, name, default_val)
                        break
                    case 'counter':
                        let onincrement = ''
                        if (cycle)
                        {
                            // TODO parameter for increment/decrement
                            onincrement = `update_cycle('${column.id}')`
                        }
                        item = build_counter(id, name, default_val, onincrement)
                        break
                    case 'multicounter':
                        item = build_multi_counter(id, name, options, default_val)
                        break
                    case 'select':
                        item = build_select(id, name, options, default_val)
                        break
                    case 'dropdown':
                        item = build_dropdown(id, name, options, default_val)
                        break
                    case 'string':
                        item = build_str_entry(id, name, default_val)
                        break
                    case 'number':
                        item = build_num_entry(id, name, default_val, options)
                        break
                    case 'slider':
                        let step = 1
                        if (options.length >= 3)
                        {
                            step = options[3]
                        }
                        item = build_slider(id, name, options[0], options[1], step, default_val)
                        break
                    case 'text':
                        item = build_text_entry(id, name, default_val)
                        break
                }
                items.push(item)
            })
            columns.push(build_column_frame(col_name, items, cycle ? 'cycle' : ''))
            if (cycle)
            {
                cycle_ops[`${column.id}_cycles`] =
                {
                    name: `${column.name} Cycles`,
                    total: 0
                }
                cycles[column.id] = cycle_ops

                if (edit)
                {
                    for (let key of Object.keys(cycles[column.id]))
                    {
                        cycles[column.id][key].total = results[id]
                        cycles[column.id][key].values = results[`${key}_temporal`]
                        // TODO populate items
                    }
                }
            }
        })
        document.body.innerHTML += build_page_frame(page_name, columns)
        
    })
    // replace placeholders in template and add to screen
    document.body.innerHTML += build_button(`submit_${scout_mode}`, 'Submit', 'get_results_from_page()')

    // mark each selected box as such
    select_ids.forEach(function (id, index)
    {
        document.getElementById(id).classList.add('selected')
    })
}

/** 
 * function:    update_cycle
 * parameters:  cycle name
 * returns:     none
 * description: Saves the current cycles and moves on to the next.
 */
function update_cycle(cycle)
{
    config.pages.forEach(function (page)
    {
        // iterate through each column in the page
        page['columns'].forEach(function (column)
        {
            if (column.id == cycle)
            {
                let cycle_id = column.id
                column['inputs'].forEach(function (input)
                {
                    let type = input.type
                    if (type == 'multicounter' || type == 'select' || type == 'dropdown')
                    {
                        let id = input.id
                        let ops = input.options

                        let op = ''
                        switch (type)
                        {
                            case 'select':
                                let children = document.getElementById(id).getElementsByClassName('wr_select_option')
                                let i = 0
                                for (let option of children)
                                {
                                    if (option.classList.contains('selected'))
                                    {
                                        op = ops[i]
                                        break
                                    }
                                    i++
                                }
                                break
                            case 'dropdown':
                                op = ops[document.getElementById(id).selectedIndex]
                                break
                            // assumes multicounter is after all selects and dropdowns
                            case 'multicounter':
                                ops.forEach(function (op) {
                                    let op_id = `${id}_${op.toLowerCase().split().join('_')}`
                                    let result_id = `${cycle_id}_${op.toLowerCase().split().join('_')}`
                                    let val = parseInt(document.getElementById(`${op_id}-value`).innerHTML)
                                    // TODO handle going backwards
                                    cycles[cycle][result_id].values.push(val)
                                    cycles[cycle][result_id].total += val
                                    document.getElementById(`${op_id}-value`).innerHTML = input.default
                                })
                                break
                            // assumes cycles counter is the last item
                            case 'counter':
                                let val = parseInt(document.getElementById(id).innerHTML)
                                let last = cycles[cycle][`${column.id}_cycles`].total
                                if (val > last)
                                {
                                    cycles[cycle][`${column.id}_cycles`].total = val
                                }
                                else
                                {
                                    // TODO repopulate items
                                }
                                break
                        }
                        // adds current select/dropdown selection to cycle id and name
                        cycle_id += `_${op.toLowerCase()}`
                    }
                })
            }
        })
    })
}

/**
 * function:    get_results_from_page
 * parameters:  none
 * returns:     none
 * description: Accumulates the results from the page into a new object.
 */
function get_results_from_page()
{
    results = {}

    // scouter metadata
    results['meta_scouter_id'] = parseInt(user_id)
    results['meta_scout_time'] = Math.round(start / 1000)
    results['meta_scouting_duration'] = (Date.now() - start) / 1000

    // scouting metadata
    results['meta_scout_mode'] = scout_mode
    results['meta_position'] = parseInt(scout_pos)
    results['meta_event_id'] = event_id

    // match metadata
    if (scout_mode != PIT_MODE)
    {
        results['meta_match'] = parseInt(match_num)
    }
    results['meta_team'] = parseInt(team_num)

    // get each result
    config.pages.forEach(function (page, index)
    {
        page['columns'].forEach(function (column, index)
        {
            // check if its a cycle column
            if (column.cycle)
            {
                let cycle = cycles[column.id]
                for (let key of Object.keys(cycle))
                {
                    results[key] = cycle[key].total
                    results[`${key}_temporal`] = cycle[key].values
                }
            }
            else
            {
                column['inputs'].forEach(function (input, index)
                {
                    let id = input.id
                    let type = input.type
                    let options = input.options

                    switch (type)
                    {
                        case 'checkbox':
                            results[id] = document.getElementById(id).checked
                            break
                        case 'counter':
                            results[id] = parseInt(document.getElementById(id).innerHTML)
                            break
                        case 'multicounter':
                            options.forEach(function (op) {
                                let name = `${id}_${op.toLowerCase().split().join('_')}`
                                results[name] = parseInt(document.getElementById(`${name}-value`).innerHTML)
                            })
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
                        case 'dropdown':
                            results[id] = document.getElementById(id).selectedIndex
                            break
                        case 'number':
                            results[id] = parseInt(document.getElementById(id).value)
                            break
                        case 'slider':
                            results[id] = document.getElementById(id).value
                            break
                        case 'string':
                        case 'text':
                            results[id] = document.getElementById(id).value
                            break
                        // "smart" values use other values not inputs
                        // must be listed after dependencies in scout-config
                        case 'sum':
                            let total = 0
                            options.forEach(k => total += results[k])
                            results[id] = total
                            break
                        case 'total':
                            results[id] = results[options[0]] / (results[options[0]] + results[options[1]])
                            break
                        case 'ratio':
                            results[id] = results[options[0]] / results[options[1]]
                            break
                    }
                })
            }
        })
    })

    // get result name
    let file = get_pit_result(team_num, event_id)
    if (scout_mode == MATCH_MODE)
    {
        file = get_match_result(match_num, team_num, event_id)
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

// read parameters from URL
const scout_pos = get_parameter(POSITION_COOKIE, POSITION_DEFAULT)
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const year = event_id.substr(0,4)
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)
const scout_mode = get_parameter(TYPE_COOKIE, TYPE_DEFAULT)

var urlParams = new URLSearchParams(window.location.search)
const match_num = urlParams.get('match')
const team_num = urlParams.get('team')
const alliance_color = urlParams.get('alliance')
const generate = urlParams.get('generate')
var edit = urlParams.get('edit') == 'true'
var results = {}

load_config(scout_mode, year)
window.addEventListener('load', function()
{
    if (edit)
    {
        let file = ''
        switch (scout_mode)
        {
            case MATCH_MODE:
                file = get_match_result(match_num, team_num, event_id)
                break
            case PIT_MODE:
                file = get_pit_result(team_num, event_id)
                break
        }
        edit = file_exists(file)
        if (edit)
        {
            results = JSON.parse(localStorage.getItem(file))
        }
        else
        {
            console.log(`Existing result, ${file}, could not be found`)
        }
    }

    // build the page from config for the desired mode
    switch (scout_mode)
    {
        case PIT_MODE:
            document.getElementById('header_info').innerHTML = `Match: <span id="match">Pit</span> - Scouting: <span id="team" style="color: white">${team_num}</span>`
            break
        case MATCH_MODE:
            document.getElementById('header_info').innerHTML = `Match: <span id="match">${match_num}</span> - Scouting: <span id="team" style="color: ${alliance_color}">${team_num}</span>`
            break
    }
    ws(team_num)
    build_page_from_config(scout_mode)
    if (generate == 'random')
    {
        generate_results()
    }
})

/**
 * function:    generate_results
 * parameters:  none
 * returns:     none
 * description: Populates the page with randomly generated results.
 */
function generate_results()
{
    config.pages.forEach(function (page, index)
    {
        page['columns'].forEach(function (column, index)
        {
            column['inputs'].forEach(function (input, index)
            {
                var id = input.id
                var type = input.type
                var options = input.options

                // TODO handle cycles
                switch (type)
                {
                    case 'checkbox':
                        document.getElementById(id).checked = random_bool()
                        break
                    case 'counter':
                        document.getElementById(id).innerHTML = random_int()
                        break
                    case 'multicounter':
                        options.forEach(function (op) {
                            let name = `${id}_${op.toLowerCase().split().join('_')}`
                            document.getElementById(`${name}-value`).innerHTML = random_int()
                        })
                        break
                    case 'select':
                        select_option(id, random_int(0, options.length - 1))
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
            })
        })
    })
}