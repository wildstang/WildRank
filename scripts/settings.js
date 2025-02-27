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
    header_info.innerHTML = `Settings`

    options_el = document.createElement('div')
    let page = new WRPage('', [options_el,
        new WRColumn('', [new WRButton('Download', download_config)]),
        new WRColumn('', [new WRButton('Upload', upload_config)]),
        new WRColumn('', [new WRButton('Apply', apply_config)])
    ])
    
    body.replaceChildren(page)

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
    let page = new WRPage('', [
        build_column('General', 'settings'),
        build_column('Defaults', 'defaults'),
        build_column('Users', 'users'),
        build_column('Keys', 'keys'),
        //build_column('Theme', 'theme'),
        //build_column('Dark Theme', 'dark_theme')
    ])

    options_el.replaceChildren(page)
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
    let column = new WRColumn(cfg_name)
    let keys = Object.keys(config)
    for (let index in keys)
    {
        let key = keys[index]
        let name = `${key.replace(/_/g, ' ').replace(/-/g, ' ')}`
        let val = config[key]
        let id = `${file}-${key}`
        if (key === 'time_format')
        {
            let select = new WRSelect(name, ['12', '24'], val.toString())
            select.input_id = id
            column.add_input(select)
        }
        else if (typeof val === 'boolean')
        {
            let select = new WRSelect(name, ['true', 'false'], val.toString())
            select.input_id = id
            column.add_input(select)
        }
        else if (typeof val === 'number')
        {
            let entry = new WREntry(name, val)
            entry.input_id = id
            entry.type = 'number'
            column.add_input(entry)
        }
        else if (typeof val === 'string')
        {
            if (key.endsWith('color') || (val.length > 0 && val.startsWith('#')))
            {
                let entry = new WREntry(name, val)
                entry.input_id = id
                entry.show_color = true
                column.add_input(entry)
            }
            else if (key === 'font-size')
            {
                let entry = new WRDropdown(name, ['xx-small', 'x-small', 'small', 'medium', 'large', 'x-large', 'xx-large'], val)
                entry.input_id = id
                column.add_input(entry)
            }
            else if (val.length > 32)
            {
                let entry = new WRExtended(name, val)
                entry.input_id = id
                column.add_input(entry)
            }
            else
            {
                let entry = new WREntry(name, val)
                entry.input_id = id
                column.add_input(entry)
            }
            if (key === 'tba' && val === '')
            {
                let button = new WRLinkButton('Get an API Key', 'https://www.thebluealliance.com/account#submissions-accepted-count-row', true)
                button.add_class('slim')
                column.add_input(button)
            }
        }
        else if (file === 'users')
        {
            let entry = new WRExtended('raw user config', JSON.stringify(config, null, 2))
            entry.input_id = file
            column.add_input(entry)
            let upload = new WRButton('Upload Scouters', upload_scouters)
            upload.add_class('slim')
            column.add_input(upload)
            break
        }
        else if (Array.isArray(val))
        {
            let entry = new WRExtended(name, val.join(', '))
            entry.input_id = id
            column.add_input(entry)
        }
        else
        {
            let entry = new WRExtended(name, JSON.stringify(val, null, 2))
            entry.input_id = id
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
    //localStorage.setItem('config-theme', build_config('theme'))
    //localStorage.setItem('config-dark-theme', build_config('dark_theme'))

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
        let el = document.getElementById(id)
        if (el)
        {
            let val = config[key]
            let new_val = val
            if (key === 'time_format')
            {
                new_val = WRSelect.get_selected_index(el) == 0 ? 12 : 24
            }
            else if (typeof val === 'boolean')
            {
                new_val = WRSelect.get_selected_index(el) == 0
            }
            else if (typeof val === 'number')
            {
                new_val = parseInt(el.value)
            }
            else if (typeof val === 'string')
            {
                new_val = el.value
            }
            else if (Array.isArray(val))
            {
                new_val = el.value.split(',').map(v => parseInt(v.trim()))
            }
            else
            {
                new_val = JSON.parse(el.value)
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
 * Opens a prompt to select a CSV file to upload, then imports the scouter info from the file.
 */
function upload_scouters()
{
    let input = document.createElement('input')
    input.type = 'file'
    input.accept = 'document/csv'
    input.addEventListener('change', import_scouters)
    input.click()
}

/**
 * Handles a file upload event by importing a CSV file of scouters.
 * The file expects data in the format ID,Name,Admin (blank == false),Position (Integer).
 * Admin and position are optional; no headers are expected.
 * 
 * @param {Event} event File upload change event
 */
function import_scouters(event)
{
    let file = event.target.files[0]
    let reader = new FileReader()
    reader.readAsText(file, 'UTF-8')
    reader.onload = readerEvent => {
        let lines = readerEvent.target.result.split('\n')
        let scouters = {}
        for (let line of lines)
        {
            let parts = line.split(',')
            if (parts.length >= 2)
            {
                scouters[parts[0]] = {
                    name: parts[1],
                    admin: parts.length >= 3 && parts[2].length > 0
                }
                if (parts.length >= 4)
                {
                    scouters[parts[0]][position] = parseInt(parts[3])
                }
            }
        }
        document.getElementById('users').value = JSON.stringify(scouters)
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
    body.appendChild(element)

    element.click()

    body.removeChild(element)
}