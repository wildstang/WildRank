/**
 * file:        config-generator.js
 * description: Helps a user generate a new config file.
 * author:      Liam Fruzyna
 * date:        2020-12-08
 */

include('input-builder')

const INPUTS = ['Multicounter', 'Checkbox', 'Counter', 'Select', 'Dropdown', 'Multiselect', 'Slider', 'Number', 'String', 'Text']

var config = Array(MODES.length).fill([])

const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

var mode_dd, page_dd, column_dd, type_dd, name_entry, builder
var preview, options

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    header_info.innerHTML = `Config Generator`
    load_config()
}

/** 
 * function:    build_page
 * parameters:  none
 * returns:     none
 * description: Builds the structure of the page.
 */
function build_page()
{
    let mode_names = MODES.map(m => capitalize(m) + ' Scouting')
    mode_dd = new WRDropdown('Mode:', mode_names)
    mode_dd.on_change = populate_dropdowns
    page_dd = new WRDropdown('Page:')
    page_dd.on_change = populate_dropdowns
    column_dd = new WRDropdown('Column:')
    column_dd.on_change = populate_dropdowns
    type_dd = new WRDropdown('Type:')
    type_dd.on_change = populate_options
    name_entry = new WREntry('Name:')
    name_entry.description = 'A brief description of the input visible to the user.'

    preview = document.createElement('span')
    options = document.createElement('div')
    body.replaceChildren(new WRPage('Add to...', [
            new WRColumn('', [mode_dd, page_dd, column_dd, type_dd]),
            new WRColumn('', [name_entry]),
            new WRColumn('', [options])
        ]),
        preview,
        new WRPage('', [
            new WRColumn('', [new WRButton('Reset Config', reset_config)]),
            new WRColumn('', [new WRButton('Download Config', download_config)]),
            new WRColumn('', [new WRButton('Upload Config', upload_config)]),
            new WRColumn('', [new WRButton('Apply Config', save_config)])
        ]))

    populate_dropdowns()
}

/** 
 * function:    populate_dropdowns
 * parameters:  none
 * returns:     none
 * description: Populates the dropdowns accordingly to other selections.
 */
function populate_dropdowns()
{
    // read dropdowns
    let mode = mode_dd.element.selectedIndex
    let page = page_dd.element
    let column = column_dd.element
    let type = type_dd.element

    // reset name and id
    name_entry.element.value = ''

    let new_page_dd = new WRDropdown('Page:', config[mode].map(p => p.name).concat(['New']), page.value)
    page.replaceChildren(...new_page_dd.option_elements)

    // set other dropdown value appropriately
    if (page.value == 'New')
    {
        column.replaceChildren()
        type.replaceChildren()
    }
    else
    {
        let new_column_dd = new WRDropdown('Column:', config[mode][page.selectedIndex].columns.map(c => c.name).concat(['New']), column.value)
        column.replaceChildren(...new_column_dd.option_elements)

        if (column.value == 'New')
        {
            type.replaceChildren()
        }
        else
        {
            let new_type_dd = new WRDropdown('Type:', INPUTS, type)
            type.replaceChildren(...new_type_dd.option_elements)
        }
    }

    populate_options()
    build_page_from_config()
}

function build_options_entry()
{
    let options = new WREntry('Options')
    options.input_id = 'new-element-options'
    options.description = 'A comma-separated list of selectable options, all spaces will be deleted.'
    return options
}

function build_default_entry(description, number_entry)
{
    let value = ''
    if (number_entry)
    {
        value = '0'
    }
    let def = new WREntry('Default', value)
    def.input_id = 'new-element-default'
    if (number_entry)
    {
        def.type = 'number'
    }
    def.description = description
    return def
}

/** 
 * function:    populate_options
 * parameters:  none
 * returns:     none
 * description: Populates the options accordingly to the dropdown selections.
 */
function populate_options()
{
    // read dropdowns
    let column = column_dd.element.value
    let type = type_dd.element.value

    // set options column appropriately
    let ops = new WRColumn()
    if (column == 'New')
    {
        let is_cycle = new WRCheckbox('Is Cycle')
        is_cycle.input_id = 'new-element-cycle'
        ops.add_input(is_cycle)
    }
    else
    {
        switch (type)
        {
            case 'Checkbox':
                builder = new CheckboxB()
                break
            case 'Slider':
                builder = new SliderB()
                break
            case 'Number':
                builder = new NumberB()
                break
            case 'Counter':
                builder = new CounterB()
                break
            case 'String':
                builder = new StringB()
                break
            case 'Text':
                builder = new TextB()
                break
            case 'Multicounter':
                builder = new MulticounterB()
                break
            case 'Select':
                builder = new SelectB()
                break
            case 'Multiselect':
                builder = new SelectB('multiselect')
                break
            case 'Dropdown':
                builder = new DropdownB()
                break
        }
    }
    let inputs = builder.build_inputs()
    for (let i of inputs)
    {
        ops.add_input(i)
    }
    ops.add_input(new WRButton('Add', create_element))
    options.replaceChildren(ops)
}

/**
 * function:    create_id_from_name
 * parameters:  parent id, name string
 * returns:     sanitized name
 * description: Sanitizes an input name so it can be used for the ID.
 */
function create_full_id_from_name(parent, name)
{
    let id = create_id_from_name(name)

    return `${parent}_${id}`
}

/**
 * function:    parse_list
 * parameters:  raw inputed list string
 * returns:     array of sanitized strings
 * description: Parses and sanatizes a comma separated list of strings.
 */
function parse_list(list)
{
    let items = list.split(',').map(s => s.trim())
    if (items.length === 1 && items[0] === '')
    {
        return []
    }
    return items
}

/** 
 * function:    create_element
 * parameters:  none
 * returns:     none
 * description: Adds an element to the config based on dropdowns and options.
 */
function create_element()
{
    // read dropdowns
    let mode = mode_dd.element.selectedIndex
    let page = page_dd.element
    let column = column_dd.element
    let type = type_dd.element.value

    // populate name and id
    let name = name_entry.element.value

    // make an identical copy of the config for backup
    let backup = JSON.parse(JSON.stringify(config))

    // populate rest of input object
    if (page.value == 'New')
    {
        let parent = MODES[mode]
        let input = {
            name: name,
            id: create_full_id_from_name(parent, name),
            columns: []
        }
        console.log(input)
        config[mode].push(input)
    }
    else if (column.value == 'New')
    {
        let parent = config[mode][page.selectedIndex].id
        let input = {
            name: name,
            id: create_full_id_from_name(parent, name),
            cycle: document.getElementById('new-element-cycle').checked,
            inputs: []
        }
        config[mode][page.selectedIndex].columns.push(input)
    }
    else
    {
        let input = builder.build_description()
        let parent = config[mode][page.selectedIndex].columns[column.selectedIndex].id
        input.name = name
        input.id = create_full_id_from_name(parent, name)
        console.log(input)
        config[mode][page.selectedIndex].columns[column.selectedIndex].inputs.push(input)
    }

    // preserve change for after populate_dropdowns
    let add_page = ''
    let add_col = ''
    if (page.value == 'New' && name !== '')
    {
        add_page = name
    }
    else if (column.value == 'New' && name !== '')
    {
        add_col = name
    }
    
    // remove change to config if invalid
    let result = Config.validate_mode_raw(config[mode])
    if (result.result)
    {
        // populate to add to dropdown
        populate_dropdowns()

        if (add_page !== '')
        {
            page.value = add_page
        }
        else if (add_col !== '')
        {
            column.value = add_col
        }

        // populate again to update preview and options
        populate_dropdowns()
    }
    else
    {
        alert(`Config invalid!${'id' in result ? ` (${result.id})` : ''}\n\n${result.description}`)
        config = backup
    }
}

/** 
 * function:    load_config
 * parameters:  none
 * returns:     none
 * description: Loads in the current config.
 */
function load_config()
{   
    config = MODES.map(m => cfg[m])
    build_page()
}

/** 
 * function:    save_config
 * parameters:  none
 * returns:     none
 * description: Saves the current config to local storage and uploads.
 */
function save_config()
{
    for (let i in MODES)
    {
        console.log(config[i])
        localStorage.setItem(`config-${cfg.year}-${MODES[i]}`, JSON.stringify(config[i]))
    }
    cfg.load_configs(2)

    alert('Scouting config updated')
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
        if (MODES.some(m => !newConfig.hasOwnProperty(m)))
        {
            alert('Invalid config!')
            return
        }
        newConfig = MODES.map(m => newConfig[m])
        let merge = confirm('Press ok to merge configs, cancel to overwrite')
        if (merge)
        {
            // TODO this merge code is horrific but it seems to work and Billy wants it fast
            for (let i in newConfig)
            {
                for (let mpage of newConfig[i])
                {
                    // merge in new page
                    let found = false
                    for (let cpage of config[i])
                    {
                        if (mpage.id == cpage.id)
                        {
                            found = true
                            break
                        }
                    }
                    if (!found)
                    {
                        config[i].push(mpage)
                    }
                    else
                    {
                        for (let mcol of mpage.columns)
                        {
                            for (let j in config[i])
                            {
                                if (config[i][j].id == mpage.id)
                                {
                                    // merge in new column
                                    let found = false
                                    for (let ccol of config[i][j].columns)
                                    {
                                        if (mcol.id == ccol.id)
                                        {
                                            found = true
                                            break
                                        }
                                    }
                                    if (!found)
                                    {
                                        config[i][j].columns.push(mcol)
                                    }
                                    else
                                    {
                                        for (let minput of mcol.inputs)
                                        {
                                            for (let l in config[i][j].columns)
                                            {
                                                if (config[i][j].columns[l].id == mcol.id)
                                                {
                                                    // merge in new input
                                                    found = false
                                                    for (let cinput of config[i][j].columns[l].inputs)
                                                    {
                                                        if (minput.id == cinput.id)
                                                        {
                                                            found = true
                                                            break
                                                        }
                                                    }
                                                    if (!found)
                                                    {
                                                        config[i][j].columns[l].inputs.push(minput)
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        else
        {
            config = newConfig
        }
        populate_dropdowns()
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
    let contents = {
        version: `${user_id}-${new Date().toISOString().split('T')[0]}`,
        smart_stats: cfg.smart_stats,
        coach: cfg.coach,
        whiteboard: cfg.whiteboard
    }
    for (let i in MODES)
    {
        contents[MODES[i]] = config[i]
    }
    let str = JSON.stringify(contents)

    let element = document.createElement('a')
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(str))
    element.setAttribute('download', `${cfg.year}-config.json`)

    element.style.display = 'none'
    body.appendChild(element)

    element.click()

    body.removeChild(element)
}

/** 
 * function:    build_page_from_config
 * parameters:  none
 * returns:     none
 * description: Builds the page from the config file and the given mode.
 */
function build_page_from_config()
{
    let mode = mode_dd.element.selectedIndex

    let select_ids = []
    let pages = []
    // iterate through each page in the mode
    for (let page of config[mode])
    {
        let selected_page = page_dd.element.value
        let page_name = page.name
        if (selected_page == page_name || selected_page == 'New' || selected_page == '')
        {
            let page_frame = new WRPage(page_name)
            pages.push(page_frame)
            if (selected_page != page_name)
            {
                let button = build_shift_buttons(page.id)
                button.add_class('page_color')
                page_frame.add_column(button)
            }
            // iterate through each column in the page
            for (let column of page.columns)
            {
                let selected_col = column_dd.element.value
                let col_name = column.name
                if (selected_col == col_name || selected_col == 'New' || selected_col == '')
                {
                    let cycle = column.cycle
                    let column_frame = new WRColumn(col_name)
                    column_frame.add_input(cycle ? 'cycle' : '')
                    page_frame.add_column(column_frame)
                    if (selected_col != col_name)
                    {
                        let button = build_shift_buttons(column.id)
                        button.add_class('column_color')
                        column_frame.add_input(button)
                    }
                    // iterate through input in the column
                    for (let input of column.inputs)
                    {
                        let item = build_input_from_config(input)
                        if (item)
                        {
                            column_frame.add_input(item)
                        }

                        let button = build_shift_buttons(input.id)
                        column_frame.add_input(button)
                    }
                    if (cycle)
                    {
                        column_frame.add_input(new WRCounter('Cycles', 0))
                        column_frame.input_id = `${column.id}_cycles`
                    }
                }
            }
        }
    }
    preview.replaceChildren(...pages.map(p => p))

    // mark each selected box as such
    for (let id of select_ids)
    {
        document.getElementById(id).classList.add('selected')
    }
}

/**
 * Builds a multibutton used to shift an element in the config.
 * 
 * @param {string} id ID of the related element.
 * @returns {MultiButton} MultiButton reference
 */
function build_shift_buttons(id)
{
    let button = new WRMultiButton('')
    button.add_option('◀', () => shift(id, 'up'))
    button.add_option('X', () => shift(id, 'rm'))
    button.add_option('▶', () => shift(id, 'down'))
    button.add_class('slim')
    button.columns = 3
    return button
}

/**
 * function:    shift
 * parameters:  input id, direction to shift
 * returns:     none
 * description: Responds to edit panel clicks by either shifting or removing the corresponding element.
 */
function shift(id, direction)
{
    // find list and position of id
    let list = []
    let i = -1
    for (let c of config)
    {
        for (let p in c)
        {
            let page = c[p]
            if (page.id == id)
            {
                list = c
                i = p
                break
            }
            for (let col in page.columns)
            {
                let column = page.columns[col]
                if (column.id == id)
                {
                    list = page.columns
                    i = col
                    break
                }
                for (let inp in column.inputs)
                {
                    let input = column.inputs[inp]
                    if (input.id == id)
                    {
                        list = column.inputs
                        i = inp
                        break
                    }
                }
            }
        }
    }
    i = parseInt(i)

    // swap or remove
    switch (direction)
    {
        case 'up':
        case 'left':
            if (i > 0)
            {
                [list[i-1], list[i]] = [list[i], list[i-1]]
            }
            break
        case 'down':
        case 'right':
            if (i < list.length - 1)
            {
                [list[i], list[i+1]] = [list[i+1], list[i]]
            }
            break
        case 'rm':
            list.splice(i, 1)
            break
    }

    // rebuild preview
    build_page_from_config()
}

/**
 * function:    reset_config
 * parameters:  none
 * returns:     none
 * description: Resets the config to the base config, then repopulates the page.
 */
function reset_config()
{
    config = Array(MODES.length).fill([])
    populate_dropdowns()
}