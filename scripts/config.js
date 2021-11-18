/**
 * file:        config.js
 * description: Contains functions for managing config files, particularly scouting.
 * author:      Liam Fruzyna
 * date:        2020-03-15
 */

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
 * function:    get_scout_config
 * parameters:  scouting mode, year
 * returns:     requested scout config
 * description: Get the scout config for a given mode and year.
 */
function get_scout_config(mode, year)
{
    return get_config(`${year}-${mode}`)
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
 * function:    get_result_meta
 * parameters:  year, scouting mode
 * returns:     key, metadata pairs
 * description: Builds an object of scouting result keys and their metadata.
 */
function get_result_meta(year, mode)
{
    let results = {}
    // go over each input in config
    let config = get_scout_config(year, mode)
    for (let page of config.pages)
    {
        for (let column of page.columns)
        {
            // add the cycle column as an input
            let cycle = column.cycle
            if (cycle)
            {
                results[column.id] = {
                    name: column.name,
                    type: 'cycle',
                    negative: false,
                    options: [],
                    options_index: [],
                    cycle: cycle
                }
            }
            for (let input of column.inputs)
            {
                let id = input.id
                let name = input.name
                let type = input.type
                let ops = input.options
                let neg = input.negative

                // make sure no values are missing / empty
                if (typeof neg === 'undefined')
                {
                    if (type == 'select' || type == 'dropdown' || type == 'multicounter')
                    {
                        neg = new Array(ops.length).fill(false)
                    }
                    else
                    {
                        neg = false
                    }
                }
                if (type == 'checkbox')
                {
                    ops = [false, true]
                }
                if (typeof ops === 'undefined')
                {
                    ops = []
                }

                // add each counter in a multicounter
                if (type == 'multicounter')
                {
                    for (let i in ops)
                    {
                        results[`${id}_${ops[i].toLowerCase()}`] = {
                            name: `${name} ${ops[i]}`,
                            type: 'counter',
                            negative: neg[i],
                            options: [],
                            options_index: [],
                            cycle: cycle
                        }
                    }
                }
                else
                {
                    results[id] = {
                        name: name,
                        type: type,
                        negative: neg,
                        options: ops,
                        options_index: Object.keys(ops),
                        cycle: cycle
                    }
                }
            }
        }
    }
    return results
}

/**
 * function:    get_result_meta
 * parameters:  year, scouting mode
 * returns:     key, metadata pairs
 * description: Builds an object of scouting result keys and their metadata.
 */
function get_keys(meta)
{
    return Object.keys(meta).filter(k => !meta[k].cycle)
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
 * function:    get_value
 * parameters:  result meta data, name of result, raw value stored, format with html
 * returns:     human readable result value
 * description: Translates less human readable results to more.
 */
function get_value(meta, key, value, html=true)
{
    // if an object is passed assume its a set of counts
    if (typeof value === 'object' && !Array.isArray(value) && value !== null)
    {
        let total = Object.values(value).reduce((a, b) => a + b)
        if (html)
        {
            return '<table>' + Object.keys(value).map(v => `<tr><th>${get_value(meta, key, v)}</th><td>${(100*value[v]/total).toFixed(2)}%</td></tr>`).join('') + '</table>'
        }
        else
        {
            let vals = {}
            Object.keys(value).forEach(v => vals[get_value(meta, key, v)] = (100*value[v]/total).toFixed(0))
            return vals
        }
    }
    switch (meta[key].type)
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
                text += `<tr><th>${meta[key].name}</th>`
                for (let cycle of value)
                {
                    text += `<td>${get_value(meta, key, cycle[key])}</td>` 
                }
                text += '</tr>'
            }
            text += '</table>'
            return text
        case 'select':
        case 'dropdown':
            return meta[key].options[value]
        case 'checkbox':
            if (typeof value === 'string')
            {
                value = value.toLowerCase() == 'true' || value == 1
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