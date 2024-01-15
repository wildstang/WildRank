/**
 * file:        inputs.js
 * description: Contains functions to interface with scouting configs and their inputs.
 * author:      Liam Fruzyna
 * date:        2024-01-15
 */

/**
 * Fills team numbers into a given name and set of options.
 * 
 * @param {string} scout_mode Scouting mode, only applies to MATCH mode.
 * @param {string} name Input name to check for keywords.
 * @param {array} options Options to check for keywords.
 * @param {object} alliances Map of alliance keys to team numbers.
 */
function fill_team_numbers(scout_mode, name, options, alliances)
{
    if (scout_mode === MATCH_MODE && alliances && Object.keys(alliances).length > 0)
    {
        // replace opponentsX with the team's opponent team numbers
        if (options instanceof Array && options.length > 0)
        {
            options = options.map(op => dal.fill_team_numbers(op, alliances))
        }
        if (name)
        {
            name = dal.fill_team_numbers(name, alliances)
        }
    }
}

/**
 * Fills a team number and alliance color into a given ID.
 * 
 * @param {string} scout_mode Scouting mode, only applies to MATCH mode.
 * @param {string} id Input ID to check for keywords.
 * @param {string} team Team number to replace keywords with.
 * @param {string} alliance_color Alliance color to replace keywords with.
 */
function replace_id_keywords(scout_mode, id, team, alliance_color)
{
    if (scout_mode === NOTE_MODE)
    {
        if (team)
        {
            id = id.replace('_team_', `_${team}_`)
        }
        if (alliance_color)
        {
            id = id.replace('_alliance_', `_${alliance_color}_`)
        }
    }
}

/**
 * Builds a single element from a given input config.
 * 
 * @param {object} input Input scouting configuration
 * @param {*} default_override Value to override the input default, used in edit.
 * @param {string} scout_mode Scouting mode, used to determine when to replace keywords.
 * @param {string} team Team number to replace keywords with.
 * @param {string} alliance_color Alliance color to replace keywords with.
 * @param {object} alliances Map of alliance keys to team numbers.
 * @returns {Input} Input reference
 */
function build_input_from_config(input, default_override='', scout_mode='', team='', alliance_color='', alliances={})
{
    let name = input.name
    let id = input.id
    let type = input.type
    let default_val = default_override ? default_override : input.default
    let options = input['options']

    fill_team_numbers(scout_mode, alliances, name, options)
    replace_id_keywords(scout_mode, team, alliance_color, id)

    let item
    // build each input from its template
    switch (type)
    {
        case 'checkbox':
            item = new Checkbox(id, name, default_val)
            break
        case 'counter':
            item = new Counter(id, name, default_val)
            break
        case 'dropdown':
            item = new Dropdown(id, name, options, default_val)
            break
        case 'multicounter':
            item = new MultiCounter(id, name, options, default_val)
            break
        case 'multiselect':
            item = new MultiSelect(id, name, options, default_val)
            item.vertical = input.vertical
            break
        case 'number':
            item = new Entry(id, name, default_val)
            item.type = 'number'
            item.bounds = options
            break
        case 'select':
            item = new Select(id, name, options, default_val)
            item.vertical = input.vertical
            break
        case 'slider':
            item = new Slider(id, name, default_val)
            item.bounds = options
            break
        case 'string':
            item = new Entry(id, name, default_val)
            break
        case 'text':
            item = new Extended(id, name, default_val)
            break
        case 'timer':
            item = new Timer(id, name)
            break
    }

    // allow selects to be colored, must be manually entered in config file
    if (type.includes('select'))
    {
        if (input.hasOwnProperty('colors') && input.colors.length === options.length)
        {
            let sheet = window.document.styleSheets[1]
            for (let i in options)
            {
                sheet.insertRule(`#${id}-${i}.selected { background-color: ${input.colors[i]} }`, sheet.cssRules.length)
            }
        }
    }

    return item
}

/**
 * Builds a ColumnFrame from a given column scouting configuration.
 * 
 * @param {object} column Column scouting configuration.
 * @param {string} scout_mode Scouting mode, used to determine when to replace keywords.
 * @param {bool} fill_results Whether to replace default values with the results from a match.
 * @param {string} match Match key to pull results from.
 * @param {string} team Team number to replace keywords with.
 * @param {string} alliance_color Alliance color to replace keywords with.
 * @param {object} alliances Map of alliance keys to team numbers.
 * @returns {ColumnFrame} ColumnFrame reference
 */
function build_column_from_config(column, scout_mode, fill_results=false, match='', team='', alliance_color='', alliances={})
{
    let col_name = column.name
    if (scout_mode === NOTE_MODE)
    {
        col_name = col_name.replace('TEAM', team).replace('ALLIANCE', alliance_color)
    }
    let col_frame = new ColumnFrame(column.id, col_name)
    // TODO: explore doing this intelligently
    if (column.id === 'match_auto_auto')
    {
        col_frame.max = 3
    }

    // iterate through input in the column
    for (let input of column.inputs)
    {
        let default_val = input.default

        // map results to defaults in edit mode
        if (fill_results)
        {
            let id = input.id
            let type = input.type
            switch (scout_mode)
            {
                case MATCH_MODE:
                case NOTE_MODE:
                    default_val = dal.get_result_value(team, match, id)
                    if (type === 'dropdown' || type === 'select')
                    {
                        default_val = input['options'][default_val]
                    }
                    else if (type === 'multicounter' || type === 'multiselect')
                    {
                        default_val = input.options.map(function (op)
                        {
                            let name = `${id}_${op.toLowerCase().split().join('_')}`
                            return dal.get_result_value(team, match, name)
                        })
                    }
                    break
                case PIT_MODE:
                    default_val = dal.get_value(team, `pit.${id}`)
                    if (type == 'dropdown' || type == 'select')
                    {
                        default_val = input['options'][default_val]
                    }
                    else if (type == 'multicounter' || type === 'multiselect')
                    {
                        default_val = input.options.map(function (op)
                        {
                            let name = `${id}_${op.toLowerCase().split().join('_')}`
                            return dal.get_value(team, `pit.${name}`)
                        })
                    }
                    break
            }
        }

        let item = build_input_from_config(input, default_val, scout_mode, team, alliance_color, alliances)
        if (item)
        {
            col_frame.add_input(item)
        }
    }

    return col_frame
}

/**
 * Updates a given input to a given value.
 * 
 * @param {object} input Input scouting configuration
 * @param {*} value New value
 * @param {string} scout_mode Scouting mode
 * @param {string} team Team number to replace keywords with.
 * @param {string} alliance_color Alliance color to replace keywords with.
 */
function set_input_value(input, value, scout_mode='', team='', alliance_color='')
{
    let id = input.id
    let type = input.type
    let options = input.options

    replace_id_keywords(scout_mode, team, alliance_color, id)

    switch (type)
    {
        case 'checkbox':
            document.getElementById(id).checked = value

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
            document.getElementById(id).innerHTML = value
            break
        case 'dropdown':
            document.getElementById(id).selectedIndex = value
            break
        case 'multicounter':
            if (!Array.isArray(value))
            {
                value = options.map(_ => value)
            }
            for (let i in options)
            {
                let op_id = `${id}_${options[i].toLowerCase().split().join('_')}`
                document.getElementById(`${op_id}-value`).innerHTML = value[i]
            }
            break
        case 'multiselect':
            for (let i in options)
            {
                MultiSelect.reset_selection(id, i)
                if (value[i])
                {
                    MultiSelect.select_option(id, i)
                }
            }
            break
        case 'number':
        case 'string':
        case 'text':
            document.getElementById(id).value = value
            break
        case 'select':
            Select.select_option(id, value)
            break
        case 'slider':
            Slider.set_slider(id, value)
            break
    }
}

/**
 * Fetch the value from a given input.
 * 
 * @param {object} input Scouting configuration input
 * @param {string} scout_mode Scouting mode
 * @param {string} team Team number to replace keywords with.
 * @param {string} alliance_color Alliance color to replace keywords with.
 * @param {object} alliances Map of alliance keys to team numbers.
 * @returns Value currently entered in input.
 */
function get_result_from_input(input, scout_mode, team='', alliance_color='', alliances={})
{
    let id = input.id
    let el_id = id
    let type = input.type
    let options = input.options

    // replace opponentsX with the team's opponent team numbers
    let op_ids = options
    fill_team_numbers(scout_mode, alliances, '', op_ids)
    replace_id_keywords(scout_mode, team, alliance_color, el_id)

    let result = {}
    switch (type)
    {
        case 'checkbox':
            result[id] = document.getElementById(el_id).checked
            break
        case 'counter':
            result[id] = parseInt(document.getElementById(el_id).innerHTML)
            break
        case 'dropdown':
            result[id] = document.getElementById(el_id).selectedIndex
            break
        case 'multicounter':
            for (let i in options)
            {
                let name = `${id}_${options[i].toLowerCase().split().join('_')}`
                let html_id = `${el_id}_${op_ids[i].toLowerCase().split().join('_')}`
                result[name] = parseInt(document.getElementById(`${html_id}-value`).innerHTML)
            }
            break
        case 'multiselect':
            for (let i in options)
            {
                let name = `${id}_${options[i].toLowerCase().split().join('_')}`
                result[name] = MultiSelect.get_selected_options(el_id).includes(parseInt(i))
            }
            break
        case 'number':
        case 'slider':
            result[id] = parseInt(document.getElementById(el_id).value)
            break
        case 'select':
            result[id] = -1
            let children = document.getElementById(el_id).getElementsByClassName('wr_select_option')
            for (let i in Object.keys(children))
            {
                if (children[i].classList.contains('selected'))
                {
                    result[id] = i
                }
            }
            break
        case 'string':
        case 'text':
            result[id] = document.getElementById(el_id).value
            break
        case 'timer':
            result[id] = parseFloat(document.getElementById(el_id).innerHTML)
            break
    }
    return result
}

/**
 * Accumulates the results from a column into a new object.
 * 
 * @param {object} column Scouting configuration column
 * @param {string} scout_mode Scouting mode
 * @param {string} team Team number to replace keywords with.
 * @param {string} alliance_color Alliance color to replace keywords with.
 * @param {object} alliances Map of alliance keys to team numbers.
 * @returns {object} Map of IDs to results.
 */
function get_results_from_column(column, scout_mode, team='', alliance_color='', alliances={})
{
    let results = {}
    // iterate through input in the column
    for (let input of column.inputs)
    {
        results = Object.assign(results, get_result_from_input(input, scout_mode, team, alliance_color, alliances))
    }

    return results
}

/**
 * Determines if any disallowed defaults have changed.
 * 
 * @param {object} column Scouting configuration column
 * @param {string} scout_mode Scouting mode
 * @param {string} team Team number to replace keywords with.
 * @param {string} alliance_color Alliance color to replace keywords with.
 * @param {object} alliances Map of alliance keys to team numbers.
 * @returns False, if column passed, otherwise first failing column ID.
 */
function check_column(column, scout_mode, team='', alliance_color='', alliances={})
{
    for (let input of column.inputs)
    {
        if (!input.disallow_default)
        {
            continue
        }

        let id = input.id
        let type = input.type
        let options = input.options
        let def = input.default

        let value = get_result_from_input(input, scout_mode, team, alliance_color, alliances)
        switch (type)
        {
            case 'multicounter':
                def = Array(options.length).fill(def)
            case 'multiselect':
                for (let i in options)
                {
                    let name = `${id}_${options[i].toLowerCase().split().join('_')}`
                    if (value[name] === def[i])
                    {
                        return id
                    }
                }
                break
            case 'select':
                def = options.indexOf(def)
            default:
                if (value[id] === def)
                {
                    return id
                }
        }
    }

    return false
}

/**
 * Generates a result for a given input.
 * 
 * @param {object} input Scouting configuration input
 * @returns Random value corresponding to the input.
 */
function generate_result_for_input(input)
{
    let type = input.type
    let options = input.options

    switch (type)
    {
        case 'checkbox':
            return random_bool()
        case 'counter':
            return random_int()
        case 'dropdown':
        case 'select':
            return random_int(0, options.length - 1)
        case 'multicounter':
            return options.map(_ => random_int())
        case 'multiselect':
            return options.map(_ => random_bool())
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
            return random_int(min, max)
        case 'string':
            return "Random result"
        case 'text':
            return "This result was randomly generated"
        case 'timer':
            return random_float()
    }
}