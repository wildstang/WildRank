/**
 * file:        config.js
 * description: Contains functions for managing config files, particularly scouting.
 * author:      Liam Fruzyna
 * date:        2020-03-15
 */

var config

/**
 * function:    fetch_config
 * parameters:  function to call on config load, force reload
 * returns:     none
 * description: Fetch the configuration and saves to local storage.
 */
function fetch_config(onConfig, force=false)
{
    let init = {}
    if (force)
    {
        let headers = new Headers()
        headers.append('pragma', 'no-cache')
        headers.append('cache-control', 'no-cache')
        init = {
            method: 'GET',
            headers: headers
        }
    }
    fetch('config/scout-config.json', init)
        .then(response => {
            return response.json()
        })
        .then(data => {
            data.forEach(function (mode, index)
            {
                localStorage.setItem(`config-${mode.id}`, JSON.stringify(mode))
            })
        })
        .catch(err => {
            console.log(`Error config file, ${err}`)
        })
    fetch('config/config.json', init)
        .then(response => {
            return response.json()
        })
        .then(data => {
            Object.keys(data).forEach(function (section, index)
            {
                localStorage.setItem(`config-${section}`, JSON.stringify(data[section]))
            })
            if (typeof onConfig === 'function')
            {
                onConfig()
            }
        })
        .catch(err => {
            console.log(`Error config file, ${err}`)
        })
}

/**
 * function:    load_config
 * parameters:  scouting mode
 * returns:     none
 * description: Set the config to the desired mode.
 */
function load_config(mode)
{
    config = JSON.parse(localStorage.getItem(`config-${mode}`))
}

/**
 * function:    get_config
 * parameters:  config name
 * returns:     reads config object
 * description: Gets the given config object from localStorage.
 */
function get_config(name)
{
    return JSON.parse(localStorage.getItem(`config-${name}`))
}

/**
 * function:    exists
 * parameters:  scouting mode
 * returns:     none
 * description: Returns true if the config exists for the given mode.
 */
function config_exists(mode)
{
    return localStorage.getItem(`config-${mode}`) !== null
}

/**
 * function:    get_type
 * parameters:  name of result
 * returns:     type of input
 * description: Determines the type of input that created the given result.
 */
function get_type(key)
{
    var type = 'unknown'
    config.pages.forEach(function (page, index)
    {
        page['columns'].forEach(function (column, index)
        {
            column['inputs'].forEach(function (input, index)
            {
                if (input.id == key)
                {
                    type = input.type
                }
            })
        })
    })
    return type
}

/**
 * function:    get_options
 * parameters:  name of input
 * returns:     options for input
 * description: Determines the options for a given input.
 */
function get_options(key)
{
    var options = []
    config.pages.forEach(function (page, index)
    {
        page['columns'].forEach(function (column, index)
        {
            column['inputs'].forEach(function (input, index)
            {
                if (input.id == key)
                {
                    options = input.options
                }
            })
        })
    })
    return options
}

/**
 * function:    is_negative
 * parameters:  name of input
 * returns:     if the input is negative
 * description: Determines if the input should be regarded as a negative trait.
 */
function is_negative(key)
{
    var negative = false
    config.pages.forEach(function (page, index)
    {
        page['columns'].forEach(function (column, index)
        {
            column['inputs'].forEach(function (input, index)
            {
                if (key == input.id && input.negative == true)
                {
                    negative = true
                }
            })
        })
    })
    return negative
}

/**
 * function:    get_name
 * parameters:  name of result, if to check for duplicate name
 * returns:     name of input
 * description: Determines the name of input that created the given result.
 */
function get_name(key, check_duplicates=true)
{
    let name = key
    let type = ''

    // find name from key
    config.pages.forEach(function (page, index)
    {
        page['columns'].forEach(function (column, index)
        {
            column['inputs'].forEach(function (input, index)
            {
                if (input.id == key)
                {
                    name = input.name
                    type = page.short
                }
            })
        })
    })

    // check for duplicates and append page short to name
    if (check_duplicates)
    {
        config.pages.forEach(function (page, index)
        {
            page['columns'].forEach(function (column, index)
            {
                column['inputs'].forEach(function (input, index)
                {
                    if (input.id != key && input.name == name)
                    {
                        name = `(${type}) ${name}`
                    }
                })
            })
        })
    }

    // format key name if no name was found
    if (name == key)
    {
        let words = key.split('_')
        words.forEach(function (word, index)
        {
            words[index] = word.substr(0, 1).toUpperCase() + word.substr(1)
        })
        name = words.join(' ')
    }
    return name
}

/**
 * function:    get_value
 * parameters:  name of result, raw value stored
 * returns:     human readable result value
 * description: Translates less human readable results to more.
 */
function get_value(key, value)
{
    switch (get_type(key))
    {
        case 'select':
        case 'dropdown':
            let option = ''
            config.pages.forEach(function (page, index)
            {
                page['columns'].forEach(function (column, index)
                {
                    column['inputs'].forEach(function (input, index)
                    {
                        if (input.id == key)
                        {
                            option = input.options[value]
                        }
                    })
                })
            })
            return option
        case 'checkbox':
            if (typeof value === 'string')
            {
                value = value == 'true'
            }
            return value ? 'Yes' : 'No'
        case 'string':
        case 'text':
            return value
        case 'number':
        case 'counter':
        default:
            if (typeof value === 'number' && !key.startsWith('meta')) return value.toFixed(2)
            else return value
    }
}

/**
 * function:    get_theme
 * parameters:  none
 * returns:     Current theme JSON object.
 * description: Fetches the current theme as a JSON object.
 */
function get_theme()
{
    // read theme from config
    let theme = get_config('theme')
    if (get_cookie(THEME_COOKIE, THEME_DEFAULT) == 'dark')
    {
        theme = get_config('dark-theme')
    }
    return theme
}

/**
 * function:    apply_theme
 * parameters:  none
 * returns:     none
 * description: Applys the current theme to page.
 */
function apply_theme()
{
    // read title from config
    let title = get_config('title')
    if (typeof title !== 'undefined')
    {
        document.title = title
        document.getElementById('title').innerHTML = title
    }

    let theme = get_theme()
    if (typeof theme !== 'undefined')
    {
        Object.keys(theme).forEach(function (key, index)
        {
            document.documentElement.style.setProperty(`--${key}`, theme[key])
        })
    }
}

window.addEventListener('load', function()
{
    apply_theme()
})