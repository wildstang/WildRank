/**
 * file:        settings.js
 * description: Settings editor page.
 * author:      Liam Fruzyna
 * date:        2020-12-11
 *              2022-01-20
 */

const FUNCTIONS = ['Mean', 'Median', 'Mode', 'Min', 'Max', 'Total']

const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const year = event_id.substr(0,4)

var meta = {}
var keys = []

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    document.getElementById('header_info').innerHTML = `Settings`
    document.body.innerHTML += '<div id="body"></div>' + build_page_frame('', [
        build_column_frame('', [build_button('', 'Download', 'download_config()')]),
        build_column_frame('', [build_button('', 'Upload', 'upload_config()')]),
        build_column_frame('', [build_button('', 'Apply', 'apply_config()')])
    ])

    // load in keys
    meta = get_result_meta(MATCH_MODE, year)
    keys = get_keys(meta)

    build_page()
}

/**
 * function:    build_page
 * parameters:  none
 * returns:     none
 * description: Builds the settings interface.
 */
function build_page()
{
    document.getElementById('body').innerHTML = ''
    
    if (file_exists('config-settings'))
    {
        document.getElementById('body').innerHTML += build_page_frame('General', [build_column('settings')])
    }
    if (file_exists('config-defaults'))
    {
        document.getElementById('body').innerHTML += build_page_frame('Defaults', [build_column('defaults')])
    }
    if (file_exists('config-admins'))
    {
        let config = get_config('admins')
        document.getElementById('body').innerHTML += build_page_frame('Admins', [build_column_frame('', [build_text_entry('admins', 'ID List', config.join(', '))])])
    }
    if (file_exists('config-coach-vals'))
    {
        let configs = get_config('coach-vals')
        if (Object.keys(configs).includes(year))
        {
            let names = keys.map(k => meta[k].name)
            let config = configs[year]
            let inputs = []
            let ckeys = Object.keys(config)
            for (let i in ckeys)
            {
                let key = ckeys[i]
                let val = config[key]
                let name = val.key.length > 0 ? meta[val.key].name : ''
                if (keys.includes(val.key) || val.key == '')
                {
                    let func = val.function
                    func = func.substr(0, 1).toUpperCase() + func.substr(1)
                    inputs.push(build_select(`fn_${i}`, 'Function', FUNCTIONS, func))
                    inputs.push(build_dropdown(`key_${i}`, 'Key', [''].concat(names), name))
                }
            }
            inputs.push(build_button('add_coach', 'New Value', 'add_coach()'))
            document.getElementById('body').innerHTML += build_page_frame('Coach Values', [build_column_frame('', inputs)])
        }
    }
    if (file_exists('config-smart-stats'))
    {
        let configs = get_config('smart-stats')
        if (Object.keys(configs).includes(year))
        {
            let config = configs[year]
            let buttons = []
            for (let stat of config)
            {
                buttons.push(build_button(stat.id, `Remove "${stat.name}"`, `remove_smart_stat('${stat.id}')`))
            }
            document.getElementById('body').innerHTML += build_page_frame('Smart Stats', [build_column_frame('', buttons)])
        }
    }
}

/**
 * function:    build_column
 * parameters:  config name
 * returns:     none
 * description: Builds a column for a generic array based config.
 */
function build_column(file)
{
    let config = get_config(file)
    let inputs = []
    let keys = Object.keys(config)
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
    }
    return build_column_frame('', inputs)
}

/**
 * function:    add_coach
 * parameters:  none
 * returns:     none
 * description: Adds an empty coach value to the config.
 */
function add_coach()
{
    let config = build_coach_config()
    config[year].push({ function: 'mean', key: '' })
    localStorage.setItem('config-coach-vals', JSON.stringify(config))

    build_page()
}

/**
 * function:    remove_smart_stat
 * parameters:  stat id
 * returns:     none
 * description: Removes a smart stat from the current config by id.
 */
function remove_smart_stat(id)
{
    let config = get_config('smart-stats')
    config[year] = config[year].filter(s => s.id != id)
    localStorage.setItem('config-smart-stats', JSON.stringify(config))

    build_page()
}

/**
 * function:    apply_config
 * parameters:  none
 * returns:     none
 * description: Saves all the changes on the screen.
 */
function apply_config()
{
    if (file_exists('config-settings'))
    {
        localStorage.setItem('config-settings', build_config('settings'))
    }
    if (file_exists('config-defaults'))
    {
        localStorage.setItem('config-defaults', build_config('defaults'))
    }
    if (file_exists('config-admins'))
    {
        let admins = document.getElementById('admins').value.replaceAll(' ', '').split(',').map(a => parseInt(a))
        localStorage.setItem('config-admins', JSON.stringify(admins))
    }
    if (file_exists('config-coach-vals'))
    {
        let configs = build_coach_config()
        localStorage.setItem('config-coach-vals', JSON.stringify(configs))
    }

    build_page()
    alert('Settings Applied')
}

/**
 * function:    build_coach_config
 * parameters:  none
 * returns:     coach config
 * description: Builds a coach config object.
 */
function build_coach_config()
{
    let configs = get_config('coach-vals')
    if (Object.keys(configs).includes(year))
    {
        let config = []
        for (let i in configs[year])
        {
            let func = get_selected_option(`fn_${i}`)
            let idx = document.getElementById(`key_${i}`).selectedIndex
            if (idx > 0)
            {
                config.push({
                    function: FUNCTIONS[func].toLowerCase(),
                    key: keys[idx-1]
                })
            }
        }
        configs[year] = config
    }
    else
    {
        configs[year] = []
    }
    return configs
}

/**
 * function:    build_config
 * parameters:  config name
 * returns:     none
 * description: Builds a config string for a generic array-based config.
 */
function build_config(file)
{
    let config = get_config(file)
    let keys = Object.keys(config)
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
    }
    return JSON.stringify(config)
}

/**
 * function:    upload_config
 * paramters:   none
 * returns:     none
 * description: Creates a file prompt to upload a JSON file.
 */
function upload_config()
{
    var input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = import_config
    input.click()
}

/**
 * function:    import_config
 * paramters:   response containing JSON file
 * returns:     none
 * description: Loads in a config file to the editor.
 */
function import_config(event)
{
    let file = event.target.files[0]
    let reader = new FileReader()
    reader.readAsText(file, 'UTF-8')
    reader.onload = readerEvent => {
        let newConfig = JSON.parse(readerEvent.target.result)
        for (let key of Object.keys(newConfig))
        {
            localStorage.setItem(`config-${key}`, JSON.stringify(newConfig[key]))
        }
        build_page()
    }
}

/**
 * function:    download_config
 * parameters:  none
 * returns:     none
 * description: Downloads the current config to file.
 */
function download_config()
{
    let contents = {}
    let files = Object.keys(localStorage)
    for (let file of files)
    {
        if (file.startsWith('config-') && !file.startsWith('config-2'))
        {
            contents[file.substr(7)] = JSON.parse(localStorage.getItem(file))
        }
    }
    let str = JSON.stringify(contents)

    let element = document.createElement('a')
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(str))
    element.setAttribute('download', `config.json`)

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    document.body.removeChild(element)
}