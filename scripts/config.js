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

    // force reload config if requested
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

    // fetch scouting modes config
    fetch('config/scout-config.json', init)
        .then(response => {
            return response.json()
        })
        .then(data => {
            let years = Object.keys(data)
            for (let i = 0; i < years.length; ++i)
            {
                Object.values(data)[i].forEach(function (mode, index)
                {
                    localStorage.setItem(`config-${years[i]}-${mode.id}`, JSON.stringify(mode))
                })
            }
        })
        .catch(err => {
            console.log(`Error config file, ${err}`)
        })

    // fetch general config
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
 * parameters:  scouting mode, year
 * returns:     none
 * description: Set the config to the desired mode.
 */
function load_config(mode, year)
{
    config = get_config(`${year}-${mode}`)
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
 * parameters:  scouting mode, year
 * returns:     none
 * description: Returns true if the config exists for the given mode.
 */
function config_exists(mode, year)
{
    return localStorage.getItem(`config-${year}-${mode}`) !== null || localStorage.getItem(`config-${mode}`) !== null
}

/**
 * function:    get_wb_config
 * parameters:  year
 * returns:     whiteboard config
 * description: Fetches the desired year's config for the whiteboard.
 */
function get_wb_config(year)
{
    let wbs = get_config('whiteboard')
    for (var i = 0; i < wbs.length; ++i)
    {
        if (wbs[i].year == year)
        {
            return wbs[i]
        }
    }
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
            if (key == column.id)
            {
                type = 'cycle'
            }
            column['inputs'].forEach(function (input, index)
            {
                if (input.id == key)
                {
                    type = input.type
                }
                else if (key.startsWith(input.id))
                {
                    type = input.type
                    if (column.cycle && (type == 'select' || type == 'dropdown'))
                    {
                        type = 'counter'
                    }
                }
            })
        })
    })
    return type
}

/**
 * function:    get_keys
 * parameters:  none
 * returns:     list of all keys in scouting mode
 * description: Generates a list of all keys in the current scouting mode.
 */
function get_keys()
{
    let keys = []
    for (let page of config.pages)
    {
        for (let column of page.columns)
        {
            // check if its a cycle column
            if (column.cycle)
            {
                keys.push(`${column.id}_cycles`)
                
                for (let input of column.inputs)
                {
                    input.options.forEach(function (op, i) {
                        let id = `${input.id}_${op.toLowerCase().split().join('_')}`
                        keys.push(id)
                    })
                }
            }
            else
            {
                for (let input of column.inputs)
                {
                    if (input.type == 'multicounter')
                    {
                        for (let option of input.options)
                        {
                            keys.push(`${input.id}_${option.toLowerCase()}`)
                        }
                    }
                    else
                    {
                        keys.push(input.id)
                    }
                }
            }
        }
    }
    return keys
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
 * function:    get_options_index
 * parameters:  name of input, input type
 * returns:     options for input
 * description: Determines the options (indexes) for a given input.
 */
function get_options_index(key, type)
{
    let ops = get_options(key)
    if (type == 'checkbox')
    {
        ops = [true, false]
    }
    else
    {
        ops = ops.map((_, i) => i)
    }
    return ops
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
    config.pages.forEach(function (page)
    {
        page['columns'].forEach(function (column)
        {
            column['inputs'].forEach(function (input)
            {
                if (key == input.id && input.negative)
                {
                    negative = true
                }
                else if (input.type == 'multicounter' && key.startsWith(input.id) && 'negative' in input)
                {
                    let option = key.replace(input.id, '').substr(1)
                    input.options.forEach(function (o, i)
                    {
                        if (o.toLowerCase() == option && input.negative[i])
                        {
                            negative = true
                        }
                    })
                }
            })
        })
    })
    return negative
}

/**
 * function:    is_admin
 * parameters:  user id
 * returns:     if the user is an admin
 * description: Determines if a given user is an admin in the config file.
 */
function is_admin(user_id)
{
    let admins = get_config('admins')
    return admins.length == 0 || admins.includes(parseInt(user_id))
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
            if (key == column.id)
            {
                name = column.name
                type = page.short
            }
            else if (key == `${column.id}_cycles`)
            {
                name = `${column.name} Cycles`
                type = page.short
            }
            column['inputs'].forEach(function (input, index)
            {
                if (input.id == key)
                {
                    name = input.name
                    type = page.short
                }
                // handle multicounter and cycles
                else if (key.startsWith(input.id))
                {
                    let input_words = input.id.split('_')
                    let option_words = key.split('_')
                    option_words.splice(0, input_words.length)
                    option_words.forEach(function (word, index)
                    {
                        option_words[index] = word.substr(0, 1).toUpperCase() + word.substr(1)
                    })
                    name = `${input.name} ${option_words.join(' ')}`
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
                    if ((input.id != key && input.name == name) ||
                        (name.startsWith(input.name) && page.short != type))
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
    // if an object is passed assume its a set of counts
    if (typeof value === 'object' && !Array.isArray(value) && value !== null)
    {
        let total = Object.values(value).reduce((a, b) => a + b)
        return '<table>' + Object.keys(value).map(v => `<tr><th>${get_value(key, v)}</th><td>${(100*value[v]/total).toFixed(2)}%</td></tr>`).join('') + '</table>'
    }
    switch (get_type(key))
    {
        case 'cycle':
            if (value == '---')
            {
                return '---'
            }
            if (value.length == 0)
            {
                return ''
            }
            let text = '<table>'
            for (let key of Object.keys(value[0]))
            {
                text += `<tr><th>${get_name(key)}</th>`
                for (let cycle of value)
                {
                    text += `<td>${get_value(key, cycle[key])}</td>` 
                }
                text += '</tr>'
            }
            text += '</table>'
            return text
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
                value = value == 'true' || value == 1
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
    let title = get_config('settings').title
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

// apply theme on every page load
window.addEventListener('load', function()
{
    apply_theme()
})