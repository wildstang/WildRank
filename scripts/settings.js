/**
 * file:        settings.js
 * description: Settings editor page.
 * author:      Liam Fruzyna
 * date:        2020-12-11
 *              2022-01-20
 */

var options_el

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    document.getElementById('header_info').innerHTML = `Settings`

    options_el = document.createElement('div')
    let page = new PageFrame('', '', [options_el,
        new ColumnFrame('', '', [new Button('', 'Download', 'download_config()')]),
        new ColumnFrame('', '', [new Button('', 'Upload', 'upload_config()')]),
        new ColumnFrame('', '', [new Button('', 'Apply', 'apply_config()')])
    ])
    
    document.getElementById('body').replaceChildren(page.element)

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
    let page = new PageFrame('', '', [
        build_column('General', 'settings'),
        build_column('Defaults', 'defaults'),
        build_column('Users', 'users'),
        build_column('Keys', 'keys'),
        build_column('Theme', 'theme'),
        build_column('Dark Theme', 'dark_theme')
    ])

    options_el.replaceChildren(page.element)
}

/**
 * function:    build_column
 * parameters:  column name, config name
 * returns:     none
 * description: Builds a column for a generic array based config.
 */
function build_column(cfg_name, file)
{
    let config = cfg[file]
    let column = new ColumnFrame(`${file}-column`, cfg_name)
    let keys = Object.keys(config)
    for (let index in keys)
    {
        let key = keys[index]
        let name = `${key.replace(/_/g, ' ').replace(/-/g, ' ')}`
        let val = config[key]
        let id = `${file}-${key}`
        if (key === 'time_format')
        {
            let select = new Select(id, name, ['12', '24'], val.toString())
            column.add_input(select)
        }
        else if (typeof val === 'boolean')
        {
            let select = new Select(id, name, ['true', 'false'], val.toString())
            column.add_input(select)
        }
        else if (typeof val === 'number')
        {
            let entry = new Entry(id, name, val)
            entry.type = 'number'
            column.add_input(entry)
        }
        else if (typeof val === 'string')
        {
            if (key.endsWith('color') || (val.length > 0 && val.startsWith('#')))
            {
                let entry = new Entry(id, name, val)
                entry.show_color = true
                column.add_input(entry)
            }
            else if (key === 'font-size')
            {
                let entry = new Dropdown(id, name, ['xx-small', 'x-small', 'small', 'medium', 'large', 'x-large', 'xx-large'], val)
                column.add_input(entry)
            }
            else if (val.length > 32)
            {
                let entry = new Extended(id, name, val)
                column.add_input(entry)
            }
            else
            {
                let entry = new Entry(id, name, val)
                column.add_input(entry)
            }
            if (key === 'tba' && val === '')
            {
                let button = new Button('tba_link', 'Get an API Key')
                button.external_link = 'https://www.thebluealliance.com/account#submissions-accepted-count-row'
                column.add_input(button)
            }
        }
        else if (file === 'users')
        {
            let entry = new Extended(file, 'raw user config', JSON.stringify(config, null, 2))
            column.add_input(entry)
            break
        }
        else if (Array.isArray(val))
        {
            let entry = new Extended(id, name, val.join(', '))
            column.add_input(entry)
        }
        else
        {
            let entry = new Extended(id, name, JSON.stringify(val, null, 2))
            column.add_input(entry)
        }
    }
    return column
}

/**
 * function:    apply_config
 * parameters:  none
 * returns:     none
 * description: Saves all the changes on the screen.
 */
function apply_config()
{
    localStorage.setItem('config-settings', build_config('settings'))
    localStorage.setItem('config-defaults', build_config('defaults'))
    localStorage.setItem('config-users', build_config('users'))
    localStorage.setItem('config-keys', build_config('keys'))
    localStorage.setItem('config-theme', build_config('theme'))
    localStorage.setItem('config-dark-theme', build_config('dark_theme'))

    cfg.load_configs(0, build_page)
    alert('Settings Applied')
}

/**
 * function:    build_config
 * parameters:  config name
 * returns:     none
 * description: Builds a config string for a generic array-based config.
 */
function build_config(file)
{
    let config = cfg[file]
    let keys = Object.keys(config)
    for (let index in keys)
    {
        let key = keys[index]
        let id = `${file}-${key}`
        if (document.getElementById(id))
        {
            let val = config[key]
            let new_val = val
            if (key === 'time_format')
            {
                new_val = Select.get_selected_option(id) == 0 ? 12 : 24
            }
            else if (typeof val === 'boolean')
            {
                new_val = Select.get_selected_option(id) == 0
            }
            else if (typeof val === 'number')
            {
                new_val = parseInt(document.getElementById(id).value)
            }
            else if (typeof val === 'string')
            {
                new_val = document.getElementById(id).value
            }
            else if (Array.isArray(val))
            {
                new_val = document.getElementById(id).value.split(',').map(v => parseInt(v.trim()))
            }
            else
            {
                new_val = JSON.parse(document.getElementById(id).value)
            }
            config[key] = new_val
        }
        else if (document.getElementById(file))
        {
            config = JSON.parse(document.getElementById(file).value)
            break
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
        let keys = Object.keys(newConfig)
        for (let key of keys)
        {
            localStorage.setItem(`config-${key}`, JSON.stringify(newConfig[key]))
        }
        cfg.load_configs(0, build_page)
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
            contents[file.substring(7)] = JSON.parse(localStorage.getItem(file))
        }
    }
    let str = JSON.stringify(contents)

    let element = document.createElement('a')
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(str))
    element.setAttribute('download', `settings-config.json`)

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    document.body.removeChild(element)
}