/**
 * file:        settings.js
 * description: Settings editor page.
 * author:      Liam Fruzyna
 * date:        2020-12-11
 */

const FUNCTIONS = ['Mean', 'Median', 'Mode', 'Min', 'Max']
const CONFIG_NAMES = ['config-settings', 'config-defaults', 'config-admins', 'config-coach-vals', 'config-whiteboard']
const MISSING_CONFIGS = ['config-theme', 'config-dark-theme', 'config-smart-stats']

const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const year = event_id.substr(0,4)

var meta = {}

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    document.getElementById('header_info').innerHTML = `Settings`
    document.body.innerHTML += '<div id="body"></div>'
    meta = get_result_meta(MATCH_MODE, year)
    build_page()
}

/** 
 * function:    build_column
 * parameters:  config file name, existing config
 * returns:     column frame
 * description: Builds a column frame with a settings config.
 */
function build_column(file, config)
{
    let inputs = []
    let keys = Object.keys(config)
    let input_keys = Object.keys(meta).map(k => meta[k].name)
    for (let index in keys)
    {
        let key = keys[index]
        let name = `${key.replace(/_/g, ' ').replace(/-/g, ' ')}:`
        let val = config[key]
        let id = `${file}-${key}`
        if (key == 'time_format')
        {
            inputs.push(build_select(id, name, ['12', '24'], val.toString()))
        }
        else if (typeof val == 'boolean')
        {
            inputs.push(build_select(id, name, ['true', 'false'], val.toString()))
        }
        else if (typeof val == 'number')
        {
            inputs.push(build_num_entry(id, name, val))
        }
        else if (typeof val == 'string')
        {
            if (key.endsWith('color') || (val.length > 0 && val.startsWith('#')))
            {
                inputs.push(build_color_entry(id, name, val))
            }
            else
            {
                inputs.push(build_str_entry(id, name, val))
            }
        }
        else if (file == 'config-coach-vals')
        {
            let func = val.function
            func = func.substr(0, 1).toUpperCase() + func.substr(1)
            inputs.push(build_select(`${id}_fn_${index}`, 'Function', FUNCTIONS, func))
            inputs.push(build_dropdown(`${id}_key_${index}`, 'Key', input_keys, meta[val.key].name))
        }
    }
    if (file == 'config-coach-vals')
    {
        inputs.push(build_button('add_coach', 'New Value', 'add_coach()'))
    }
    return build_column_frame(file.replace('config-', '').replace(/-/g, ' '), inputs)
}

/** 
 * function:    build_page
 * parameters:  none
 * returns:     none
 * description: Builds the structure of the page.
 */
function build_page()
{
    let columns = []
    for (let file of CONFIG_NAMES)
    {
        if (file_exists(file))
        {
            let config = JSON.parse(localStorage.getItem(file))
            if (Array.isArray(config))
            {
                if (config.length > 0 && typeof config[0] == 'object' && Object.keys(config[0]).includes('year'))
                {
                    config = config.filter(c => c.year == year)[0]
                    delete config.year
                    columns.push(build_column(file, config))
                }
                else if (config.length > 0 && typeof config[0] == 'object' && Object.keys(config[0]).includes('function'))
                {
                    columns.push(build_column(file, config))
                }
                else if (config.length > 0 && typeof config[0] != 'object')
                {
                    columns.push(build_column_frame(file.replace('config-', '').replace(/-/g, ' '),
                        [build_text_entry(file, '', config.join(','))]))
                }
            }
            else
            {
                columns.push(build_column(file, config))
            }
        }
    }
    document.getElementById('body').innerHTML = build_page_frame('', columns) + build_page_frame('Save', [
        build_column_frame('', [build_button('reset-config', 'Reset Changes', 'build_page()')]),
        build_column_frame('', [build_button('save-config', 'Download Config', 'save_config()')]),
        build_column_frame('', [build_button('apply-config', 'Apply Config', 'apply_config()')])
    ])
}

/** 
 * function:    add_coach
 * parameters:  none
 * returns:     none
 * description: Adds a new slot for a coach value.
 */
function add_coach()
{
    let coach = get_config('coach-vals')
    coach.push({
        function: 'Mean',
        key: ''
    })
    localStorage.setItem('config-coach-vals', JSON.stringify(coach))
    build_page()
}

/** 
 * function:    save_config
 * parameters:  none
 * returns:     none
 * description: Downloads the current config file.
 */
function save_config()
{
    let name = 'config.json'
    let str = JSON.stringify(build_config_obj(true))

    let element = document.createElement('a')
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(str))
    element.setAttribute('download', name)

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    document.body.removeChild(element)
}

/** 
 * function:    apply_config
 * parameters:  none
 * returns:     none
 * description: Applys the current settings to the config.
 */
function apply_config()
{
    let configs = build_config_obj()
    for (let key of Object.keys(configs))
    {
        localStorage.setItem(`config-${key}`, JSON.stringify(configs[key]))
    }

    // post string to server
    configs = build_config_obj(true)
    let addr = get_cookie(UPLOAD_COOKIE, UPLOAD_DEFAULT)
    if (check_server(addr))
    {
        let upload = `config.json|||${JSON.stringify(configs)}`
        fetch(addr, {method: 'POST', body: upload})
    }
    
    alert('Settings updated')
    
    location.reload()
}

/** 
 * function:    update_config
 * parameters:  config file name, existing config
 * returns:     updated config object
 * description: Updates the provided config object with input from screen.
 */
function update_config(file, config)
{
    let keys = Object.keys(config)
    let input_keys = Object.keys(meta)
    for (let index in keys)
    {
        let key = keys[index]
        let id = `${file}-${key}`
        if (document.getElementById(id))
        {
            let val = config[key]
            let new_val = ''
            if (key == 'time_format')
            {
                new_val = get_selected_option(id) == 0 ? 12 : 24
            }
            else if (typeof val == 'boolean')
            {
                new_val = get_selected_option(id) == 0
            }
            else if (typeof val == 'number')
            {
                new_val = parseInt(document.getElementById(id).value)
            }
            else if (typeof val == 'string')
            {
                new_val = document.getElementById(id).value
            }
            config[key] = new_val
        }
        else if (file == 'config-coach-vals')
        {
            config[index] = {
                function: FUNCTIONS[get_selected_option(`${id}_fn_${index}`)].toLowerCase(),
                key: input_keys[document.getElementById(`${id}_key_${index}`).selectedIndex]
            }
        }
    }
    return config
}

/** 
 * function:    build_config_obj
 * parameters:  include missing
 * returns:     config object
 * description: Builds a single object to hold all configs.
 */
function build_config_obj(missing=false)
{
    let configs = {}
    let names = CONFIG_NAMES
    for (let file of names)
    {
        let config = JSON.parse(localStorage.getItem(file))
        if (Array.isArray(config))
        {
            if (config.length > 0 && typeof config[0] == 'object' && Object.keys(config[0]).includes('year'))
            {
                for (let c of config)
                {
                    if (c.year == year)
                    {
                        c = update_config(file, c)
                    }
                }
                configs[file.replace('config-', '')] = config
            }
            else if (config.length > 0 && typeof config[0] == 'object' && Object.keys(config[0]).includes('function'))
            {
                configs[file.replace('config-', '')] = update_config(file, config)
            }
            else if (config.length > 0 && typeof config[0] != 'object')
            {
                let vals = document.getElementById(file).value.split(',').map(val => val.trim())
                if (config.length > 0 && typeof config[0] == 'number')
                {
                    vals = vals.map(val => parseInt(val))
                }
                configs[file.replace('config-', '')] = vals
            }
        }
        else
        {
            configs[file.replace('config-', '')] = update_config(file, config)
        }
    }
    if (missing)
    {
        for (let file of MISSING_CONFIGS)
        {
            configs[file.replace('config-', '')] = JSON.parse(localStorage.getItem(file))
        }
    }
    return configs
}