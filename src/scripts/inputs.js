/**
 * file:        inputs.js
 * description: Contains functions to interface with scouting configs and their inputs.
 * author:      Liam Fruzyna
 * date:        2024-01-15
 */

/**
 * Builds a single element from a given input config.
 * 
 * @param {object} input Input scouting configuration
 * @param {*} default_override Value to override the input default, used in edit.
 * @returns {Input} Input reference
 */
function build_input_from_config(input, scout_type, team='', default_override='')
{
    let type = input.type
    let id = input.id
    if (scout_type === 'match-alliance')
    {
        id += `-${team}`
    }
    let name = input.name
    let options = input.options
    let default_val = default_override ? default_override : input.default
    let images = input.images ? input.images.map(i => `/assets/${i}`) : []

    let item
    // build each input from its template
    switch (type)
    {
        case 'checkbox':
            item = new WRCheckbox(name, default_val)
            break
        case 'counter':
            item = new WRCounter(name, default_val)
            break
        case 'dropdown':
            item = new WRDropdown(name, options, default_val)
            break
        case 'multicounter':
            item = new WRMultiCounter(name, options, default_val)
            item.vertical = input.vertical
            break
        case 'multiselect':
            item = new WRMultiSelect(name, options, default_val, images)
            item.vertical = input.vertical
            break
        case 'number':
            item = new WREntry(name, default_val)
            item.type = 'number'
            item.bounds = input.options
            break
        case 'select':
            item = new WRSelect(name, options, default_val, images)
            item.vertical = input.vertical
            if (input.colors)
            {
                item.colors = input.colors
            }
            break
        case 'slider':
            item = new WRSlider(name, default_val)
            item.bounds = input.options
            break
        case 'string':
            item = new WREntry(name, default_val)
            break
        case 'text':
            item = new WRExtended(name, default_val)
            break
        case 'timer':
            item = new WRTimer(name)
            break
    }

    item.input_id = id

    return item
}

/**
 * Builds a ColumnFrame from a given column scouting configuration.
 * 
 * @param {object} column Column scouting configuration.
 * @param {string} scout_type Scouting mode type, used to determine when to replace keywords.
 * @param {string} team Team number to replace keywords with.
 * @param {Object} result Result object from the BaseResult.
 * @returns {ColumnFrame} ColumnFrame reference
 */
function build_column_from_config(column, scout_type, team='', result=null)
{
    let col_name = column.name
    if (scout_type === 'match-alliance')
    {
        col_name = col_name.replace('TEAM', team)
    }
    let col_frame = new WRColumn(col_name)
    // TODO: explore doing this intelligently
    if (column.id === 'match_auto_auto')
    {
        col_frame.max = 3
    }

    // iterate through input in the column
    for (let input of column.inputs)
    {
        let default_val = result !== null ? result[input.id] : input.default

        // map results to defaults in edit mode
        if (result !== null)
        {
            let type = input.type
            if (type === 'dropdown' || type === 'select')
            {
                default_val = input.options[default_val]
            }
            else if (type === 'multicounter' || type === 'multiselect')
            {
                default_val = input.options.map(function (op)
                {
                    let name = `${input.id}_${create_id_from_name(op)}`
                    return result[name]
                })
            }
        }

        // build input and add to column
        let item = build_input_from_config(input, scout_type, team, default_val)
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
 */
function set_input_value(input, value)
{
    let options = input.options
    let id = input.id

    switch (input.type)
    {
        case 'checkbox':
            document.getElementById(id).checked = value
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
                let op_id = `${id}_${create_id_from_name(options[i])}`
                document.getElementById(op_id).innerHTML = value[i]
            }
            break
        case 'multiselect':
            let mchildren = document.getElementById(id).getElementsByClassName('wr_select_option')
            for (let i = 0; i < mchildren.length; i++)
            {
                mchildren[i].classList.remove('selected')
                if (value[i])
                {
                    mchildren[i].classList.add('selected')
                }
            }
            break
        case 'number':
        case 'string':
        case 'text':
            document.getElementById(id).value = value.trim()
            break
        case 'select':
            let children = document.getElementById(id).getElementsByClassName('wr_select_option')
            for (let i = 0; i < children.length; i++)
            {
                children[i].classList.remove('selected')
                if (i === value)
                {
                    children[i].classList.add('selected')
                }
            }
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
 * @param {string} scout_type Scouting mode type, used to determine when to replace keywords.
 * @param {string} team Team number to replace keywords with.
 * @returns Value currently entered in input.
 */
function get_result_from_input(input, scout_type, team='')
{
    let id = input.id
    let el_id = id
    if (scout_type === 'match-alliance')
    {
        el_id += `-${team}`
    }
    console.log(id)
    let options = input.options

    let result = {}
    switch (input.type)
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
                let name = `${id}_${create_id_from_name(options[i])}`
                let html_id = `${el_id}_${create_id_from_name(options[i])}`
                result[name] = parseInt(document.getElementById(html_id).innerHTML)
            }
            break
        case 'multiselect':
            let selected = []
            let m_children = document.getElementById(el_id).getElementsByClassName('wr_select_option')
            for (let i in Object.keys(m_children))
            {
                if (m_children[i].classList.contains('selected'))
                {
                    selected.push(i)
                }
            }

            for (let i in options)
            {
                let name = `${id}_${create_id_from_name(options[i])}`
                result[name] = selected.includes(i)
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
                    result[id] = parseInt(i)
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
 * @param {string} scout_type Scouting mode type, used to determine when to replace keywords.
 * @param {string} team Team number to replace keywords with.
 * @returns {object} Map of IDs to results.
 */
function get_results_from_column(column, scout_type, team='')
{
    let results = {}
    // iterate through input in the column
    for (let input of column.inputs)
    {
        results = Object.assign(results, get_result_from_input(input, scout_type, team))
    }

    return results
}

/**
 * Determines if any disallowed defaults have changed.
 * 
 * @param {object} column Scouting configuration column
 * @param {string} scout_type Scouting mode type, used to determine when to replace keywords.
 * @param {string} team Team number to replace keywords with.
 * @returns False, if column passed, otherwise first failing input ID.
 */
function check_column(column, scout_type, team='')
{
    for (let input of column.inputs)
    {
        if (!input.disallow_default)
        {
            continue
        }

        let id = input.id
        let options = input.options
        let def = input.default

        let value = get_result_from_input(input, scout_type, team)
        switch (input.type)
        {
            case 'multicounter':
                def = Array(options.length).fill(def)
            case 'multiselect':
                for (let i in options)
                {
                    let name = `${id}_${create_id_from_name(options[i])}`
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
 * Determines if a cycle has been changed.
 * 
 * @param {object} column Scouting configuration column
 * @returns False, if column passed, otherwise first failing input ID.
 */
function check_cycle(column)
{
    for (let input of column.inputs)
    {
        let id = input.id
        let options = input.options
        let def = input.default

        let value = get_result_from_input(input)
        switch (input.type)
        {
            case 'multicounter':
                def = Array(options.length).fill(def)
            case 'multiselect':
                for (let i in options)
                {
                    let name = `${id}_${create_id_from_name(options[i])}`
                    if (value[name] !== def[i])
                    {
                        return name
                    }
                }
                break
            case 'select':
            case 'dropdown':
                def = options.indexOf(def)
            default:
                if (value[id] !== def)
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
    let options = input.options

    switch (input.type)
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