/**
 * file:        settings.js
 * description: Settings editor page.
 * author:      Liam Fruzyna
 * date:        2025-03-23
 */

/**
 * Construct page.
 */
function init_page()
{
    header_info.innerHTML = `Settings`

    let page = new WRPage('', build_columns('General').concat([
        new WRColumn('', [new WRButton('Download', download_config),
            new WRButton('Upload', upload_config),
            new WRButton('Apply', apply_config)])])
    )

    body.replaceChildren(page)
}

/**
 * Builds the columns representing the available settings.
 * @param {String} col_name Name of the column.
 * @returns An array of columns.
 */
function build_columns(cfg_name)
{
    let entries = []
    let selects = []
    let config = cfg.user.settings
    let keys = Object.keys(config)
    for (let index in keys)
    {
        let key = keys[index]
        let val = config[keys[index]]
        let input = build_setting(key, val)
        if (input instanceof WRSelect)
        {
            selects.push(input)
        }
        else
        {
            entries.push(input)
            if (key === 'tba_key' && val === '')
            {
                let button = new WRLinkButton('Get an API Key', 'https://www.thebluealliance.com/account#submissions-accepted-count-row', true)
                button.add_class('slim')
                entries.push(button)
            }
        }
    }

    return [new WRColumn(cfg_name, entries), new WRColumn(cfg_name, selects)]
}

/**
 * Builds an input for a setting using a given key and value.
 * @param {String} key Key of the input to create.
 * @param {String} val Value to populate the input with.
 * @returns The constructed WRInput.
 */
function build_setting(key, val)
{
    let name = `${key.replace(/_/g, ' ').replace(/-/g, ' ')}`
    if (key === 'time_format')
    {
        let select = new WRSelect(name, ['12', '24'], val.toString())
        select.input_id = key
        return select
    }
    else if (typeof val === 'boolean')
    {
        let select = new WRSelect(name, ['true', 'false'], val.toString())
        select.input_id = key
        return select
    }
    else if (typeof val === 'number')
    {
        let entry = new WREntry(name, val)
        entry.input_id = key
        entry.type = 'number'
        return entry
    }
    else if (typeof val === 'string')
    {
        if (key.endsWith('color') || (val.length > 0 && val.startsWith('#')))
        {
            let entry = new WREntry(name, val)
            entry.input_id = key
            entry.show_color = true
            return entry
        }
        else if (key === 'font-size')
        {
            let entry = new WRDropdown(name, ['xx-small', 'x-small', 'small', 'medium', 'large', 'x-large', 'xx-large'], val)
            entry.input_id = key
            return entry
        }
        else if (val.length > 32)
        {
            let entry = new WRExtended(name, val)
            entry.input_id = key
            return entry
        }
        else
        {
            let entry = new WREntry(name, val)
            entry.input_id = key
            return entry
        }
    }
    else if (Array.isArray(val))
    {
        let entry = new WRExtended(name, val.join(', '))
        entry.input_id = key
        return entry
    }
    else
    {
        let entry = new WRExtended(name, JSON.stringify(val, null, 2))
        entry.input_id = key
        return entry
    }
}

/**
 * Handles a click on the apply button, pulls the values from the inputs and writes the config.
 */
function apply_config()
{
    update_config()
    cfg.store_configs()
    alert('Settings Applied')
}

/**
 * Updates the user config using value from the inputs.
 */
function update_config()
{
    let keys = Object.keys(cfg.user.settings)
    for (let index in keys)
    {
        let key = keys[index]
        let el = document.getElementById(key)
        if (el)
        {
            let val = cfg.user.settings[key]
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
            cfg.user.settings[key] = new_val
        }
    }
}

/**
 * Handles a click on the upload button, opens an upload prompt.
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
 * Handles a file upload and pulls the values into the Config.
 * @param {Event} event Event containing the uploaded file.
 */
function import_config(event)
{
    let file = event.target.files[0]
    let reader = new FileReader()
    reader.readAsText(file, 'UTF-8')
    reader.onload = readerEvent => {
        cfg.user = JSON.parse(readerEvent.target.result)
        init_page()
    }
}

/**
 * Builds and downloads a file using the current config.
 */
function download_config()
{
    update_config()
    let str = JSON.stringify(cfg.user)

    let element = document.createElement('a')
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(str))
    element.setAttribute('download', `user-config.json`)

    element.style.display = 'none'
    body.appendChild(element)

    element.click()

    body.removeChild(element)
}