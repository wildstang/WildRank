/**
 * file:        validation.js
 * description: Contains functions for validating configurations.
 * author:      Liam Fruzyna
 * date:        2021-11-05
 */

/**
 * function:    has_keys
 * parameters:  object, required keys
 * returns:     true if object has all keys
 * description: Determines if a given object has a set of keys.
 */
function has_keys(obj, keys)
{
    for (let key of keys)
    {
        if (!obj || !obj.hasOwnProperty(key))
        {
            console.log('missing', key)
            return false
        }
    }
    return true
}

/**
 * function:    is_in
 * parameters:  value, valid options
 * returns:     true if value is in valid options
 * description: Determines if a given value is a valid option.
 */
function is_in(val, options)
{
    for (let op of options)
    {
        if (val == op)
        {
            return true
        }
    }
    return false
}

/**
 * function:    validate_settings_config
 * parameters:  settings config
 * returns:     true if valid
 * description: Determines if a given settings config is valid.
 */
function validate_settings_config(config)
{
    if (!has_keys(config, ['title', 'time_format', 'use_images']))
    {
        console.log('missing key')
        return false
    }
    return true
}

/**
 * function:    validate_defaults_config
 * parameters:  defaults config
 * returns:     true if valid
 * description: Determines if a given defaults config is valid.
 */
function validate_defaults_config(config)
{
    if (!has_keys(config, ['event_id', 'upload_url', 'user_id']))
    {
        console.log('missing key')
        return false
    }
    return true
}

/**
 * function:    validate_coach_config
 * parameters:  coach config
 * returns:     true if valid
 * description: Determines if a given coach config is valid.
 */
function validate_coach_config(config)
{
    if (!Array.isArray(config))
    {
        console.log('invalid format')
        return false
    }
    for (let obj of config)
    {
        if (!has_keys(obj, ['function', 'key']))
        {
            console.log('missing key')
            return false
        }
        if (!is_in(obj.function, ['mean', 'median', 'mode', 'min', 'max']))
        {
            console.log('invalid function')
            return false
        }
        // TODO check that key is valid from match scouting config
    }
    return true
}

/**
 * function:    validate_wb_config
 * parameters:  wb config
 * returns:     true if valid
 * description: Determines if a given wb config is valid.
 */
function validate_wb_config(config)
{
    if (!Array.isArray(config))
    {
        console.log('invalid format')
        return false
    }
    for (let obj of config)
    {
        if (!has_keys(obj, ['year', 'red_1', 'red_2', 'red_3', 'blue_1', 'blue_2', 'blue_3',
            'game_pieces', 'draw_color', 'field_width', 'field_height', 'magnet_size', 'line_width',
            'horizontal_margin', 'vertical_margin', 'field_height_ft', 'field_height_px']))
        {
            console.log('missing key')
            return false
        }
        for (let t of ['red_1', 'red_2', 'red_3', 'blue_1', 'blue_2', 'blue_3'])
        {
            if (!has_keys(obj[t], ['x', 'y', 'color']))
            {
                console.log('missing key')
                return false
            }
        }
        if (!Array.isArray(obj.game_pieces))
        {
            console.log('invalid format')
            return false
        }
        for (let gp of obj.game_pieces)
        {
            if (!has_keys(gp, ['name', 'image']))
            {
                console.log('missing key')
                return false
            }
        }
    }
    return true
}

/**
 * function:    validate_admin_config
 * parameters:  admin config
 * returns:     true if valid
 * description: Determines if a given admin config is valid.
 */
function validate_admin_config(config)
{
    if (!Array.isArray(config))
    {
        console.log('invalid format')
        return false
    }
    return true
}

/**
 * function:    validate_theme_config
 * parameters:  theme config
 * returns:     true if valid
 * description: Determines if a given theme config is valid.
 */
function validate_theme_config(config)
{
    if (!has_keys(config, ['primary-color', 'primary-text-color', 'secondary-color', 'secondary-text-color', 'background-color',
        'background-text-color', 'foreground-color', 'foreground-text-color', 'disabled-color', 'disabled-text-color',
        'active-color', 'active-text-color', 'hover-color', 'hover-text-color', 'border-color', 'inactive-color',
        'inactive-text-color', 'red-alliance-color', 'blue-alliance-color', 'green-alliance-color', 'alt-table-color', 'font']))
    {
        console.log('missing key')
        return false
    }
    return true
}

/**
 * function:    validate_config
 * parameters:  scouting config mode
 * returns:     true if valid
 * description: Determines if a given scouting config mode is valid.
 */
function validate_scout_config(mode)
{
    if (!has_keys(mode, ['name', 'id', 'pages']))
    {
        console.log('missing mode key')
        return false
    }
    if (!is_in(mode.id, ['pit', 'match']))
    {
        console.log('invalid mode id')
        return false
    }
    for (let page of mode.pages)
    {
        if (!has_keys(page, ['name', 'short', 'id', 'columns']))
        {
            console.log('missing page key')
            return false
        }
        for (let column of page.columns)
        {
            if (!has_keys(column, ['name', 'id', 'inputs']))
            {
                console.log('missing column key')
                return false
            }
            for (let input of column.inputs)
            {
                if (!has_keys(input, ['name', 'id', 'type', 'default']))
                {
                    console.log('missing input key')
                    return false
                }
                if (column.cycle && !is_in(input.type, ['select', 'dropdown', 'multicounter']))
                {
                    console.log('invalid cycle item')
                    return false
                }
                if (!is_in(input.type, ['checkbox', 'dropdown', 'select', 'number', 'string', 'slider', 'text', 'counter', 'multicounter', 'sum', 'total', 'ratio']))
                {
                    console.log('invalid input type')
                    return false
                }
                if (is_in(input.type, ['dropdown', 'select', 'slider', 'multicounter', 'sum', 'total', 'ratio']) && !input.hasOwnProperty('options'))
                {
                    console.log('missing input options')
                    return false
                }
            }
        }
    }
    return true
}