/**
 * file:        config-generator.js
 * description: Helps a user generate a new config file.
 * author:      Liam Fruzyna
 * date:        2020-12-08
 */

include('input-builder')

const INPUTS = ['Multicounter', 'Checkbox', 'Counter', 'Select', 'Dropdown', 'Multiselect', 'Slider', 'Number', 'String', 'Text']

var mode_dd, page_dd, column_dd, type_dd, name_entry, builder, id_entry
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
    build_page()
}

/**
 * Builds the structure of the page.
 */
function build_page()
{
    mode_dd = new WRDropdown('Mode:')
    mode_dd.on_change = populate_dropdowns
    page_dd = new WRDropdown('Page:')
    page_dd.on_change = populate_dropdowns
    column_dd = new WRDropdown('Column:')
    column_dd.on_change = populate_dropdowns
    type_dd = new WRDropdown('Type:')
    type_dd.on_change = populate_options
    name_entry = new WREntry('Name:')
    name_entry.on_text_change = update_id
    name_entry.description = 'A brief description of the input visible to the user.'
    id_entry = new WREntry('ID:')
    id_entry.description = 'Unique identifier, automatically generated.'

    preview = document.createElement('span')
    options = document.createElement('div')
    body.replaceChildren(new WRPage('Add to...', [
            new WRColumn('', [mode_dd, page_dd, column_dd, type_dd]),
            new WRColumn('', [name_entry, id_entry]),
            new WRColumn('', [options])
        ]),
        preview,
        new WRPage('', [
            new WRColumn('', [new WRButton('Reset Config', load_config)]),
            new WRColumn('', [new WRButton('Download Config', download_config)]),
            new WRColumn('', [new WRButton('Upload Config', upload_config)]),
            new WRColumn('', [new WRButton('Apply Config', save_config)])
        ]))

    populate_dropdowns()
}

/**
 * Populates the left side dropdowns based on current seletions.
 */
function populate_dropdowns()
{
    name_entry.element.value = ''
    id_entry.element.value = ''

    let def_val = mode_dd.element.value === '' ? 'New' : mode_dd.element.value
    let new_mode_dd = new WRDropdown('Mode:', cfg.scout.configs.map(m => `${m.name} (${m.type})`).concat(['New']), def_val)
    mode_dd.element.replaceChildren(...new_mode_dd.option_elements)

    // read dropdowns
    let mode_idx = mode_dd.element.selectedIndex
    if (mode_idx === cfg.scouting_modes.length)
    {
        page_dd.element.replaceChildren()
        column_dd.element.replaceChildren()
        type_dd.element.replaceChildren()
    }
    else
    {
        let pages = cfg.scout.configs[mode_idx].pages
        let def_val = page_dd.element.value === '' ? 'New' : page_dd.element.value

        let new_page_dd = new WRDropdown('Page:', pages.map(p => p.name).concat(['New']), def_val)
        page_dd.element.replaceChildren(...new_page_dd.option_elements)

        let page_idx = page_dd.element.selectedIndex
        if (page_idx === pages.length)
        {
            column_dd.element.replaceChildren()
            type_dd.element.replaceChildren()
        }
        else
        {
            let columns = pages[page_idx].columns
            def_val = column_dd.element.value === '' ? 'New' : column_dd.element.value
        
            let new_column_dd = new WRDropdown('Column:', columns.map(c => c.name).concat(['New']), def_val)
            column_dd.element.replaceChildren(...new_column_dd.option_elements)
    
            let column_idx = column_dd.element.selectedIndex
            if (column_idx === columns.length)
            {
                type_dd.element.replaceChildren()
            }
            else
            {
                let new_type_dd = new WRDropdown('Type:', INPUTS, type_dd.element.value)
                type_dd.element.replaceChildren(...new_type_dd.option_elements)
            }
        }
    }

    populate_options()
    build_page_from_config()
}

/**
 * Populates right side options based on selected dropdowns.
 */
function populate_options()
{
    // read dropdowns
    let mode = mode_dd.element.value
    let page = page_dd.element.value
    let column = column_dd.element.value
    let type = type_dd.element.value

    // set options column appropriately
    let ops = new WRColumn()
    if (mode === 'New')
    {
        builder = new ModeB()
    }
    else if (page === 'New')
    {
        builder = null
    }
    else if (column === 'New')
    {
        builder = new ColumnB()
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
                builder = new MultiselectB()
                break
            case 'Dropdown':
                builder = new DropdownB()
                break
        }
    }
    if (builder !== null)
    {
        let inputs = builder.build_inputs()
        for (let i of inputs)
        {
            ops.add_input(i)
        }
    }
    ops.add_input(new WRButton('Add', build_element))
    options.replaceChildren(ops)
}

/**
 * Updates the ID entry by processing what is currently in the name entry.
 */
function update_id()
{
    let name = name_entry.element.value
    id_entry.element.value = create_id_from_name(name)
}

/**
 * Generates an ID for an element using its id and parent's ID.
 * @param {String} parent Parent element's ID
 * @param {String} id New elements id
 * @returns New ID for the element
 */
function create_full_id(parent, id)
{
    id = create_id_from_name(id)
    return `${parent}_${id}`
}

/**
 * Adds a new element to the config based on the current selection.
 */
function build_element()
{
    // read dropdowns
    let mode_idx = mode_dd.element.selectedIndex
    let page_idx = page_dd.element.selectedIndex
    let column_idx = column_dd.element.selectedIndex
    let id = id_entry.element.value

    // populate name and id
    let name = name_entry.element.value
    let new_mode = ''
    let new_page = ''
    let new_column = ''

    // populate rest of input object
    if (mode_idx === cfg.scouting_modes.length)
    {
        let input = builder.build_description()
        input.name = name
        input.id = create_id_from_name(name)
        input.pages = []
        cfg.scout.configs.push(input)
        new_mode = name
    }
    else
    {
        let mode = cfg.scout.configs[mode_idx]
        if (page_idx === mode.pages.length)
        {
            let input = {
                name: name,
                id: create_full_id(mode.id, id),
                columns: []
            }
            mode.pages.push(input)
            new_page = name
        }
        else
        {
            let page = mode.pages[page_idx]
            if (column_idx === page.columns.length)
            {
                let input = builder.build_description()
                input.name = name
                input.id = create_full_id(page.id, id)
                input.inputs = []
                page.columns.push(input)
                new_column = name
            }
            else
            {
                let column = page.columns[column_idx]
                let input = builder.build_description()
                input.name = name
                input.id = create_full_id(column.id, id)

                let tests = ScoutConfig.validate_mode(cfg.scout.configs[mode_idx], false).filter(t => t !== true)
                if (tests.length > 0)
                {
                    alert('Invalid config!\n\n' + tests.join('\n\n'))
                }
                else
                {
                    column.inputs.push(input)
                }
            }
        }
    }

    // update the dropdowns to have any newly added elements
    populate_dropdowns()

    // select the newly added mode, page, or column
    if (new_mode.length > 0)
    {
        mode_dd.element.value = new_mode
    }
    else if (new_page.length > 0)
    {
        page_dd.element.value = new_page
    }
    else if (new_column.length > 0)
    {
        column_dd.element.value = new_column
    }

    // populate again to update preview and options
    populate_dropdowns()
}

/**
 * Resets the config to that stored in localStorage.
 */
function load_config()
{
    cfg.scout.load()
    build_page()
}

/**
 * Save the config to localStorage.
 */
function save_config()
{
    let tests = cfg.scout.configs.map(m => ScoutConfig.validate_mode(m, false)).flat(2).filter(t => t !== true)
    if (tests.length > 0)
    {
        alert('Invalid config!\n\n' + tests.join('\n\n'))
        return
    }

    cfg.scout.version = `${cfg.user.state.user_id}-${new Date().toISOString().split('T')[0]}`
    cfg.scout.store_config()
    alert('Scouting config updated')
}

/**
 * Prompt the user to upload a config from JSON file.
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
 * Handles a uploaded file and imports it's contents.
 * @param {Event} event File upload event
 */
function import_config(event)
{
    let file = event.target.files[0]
    let reader = new FileReader()
    reader.readAsText(file, 'UTF-8')
    reader.onload = readerEvent => {
        let text = readerEvent.target.result
        if (ScoutConfig.validate(user_config))
        {
            cfg.scout.handle_config(text)
            alert('Imported config')
        }
        else
        {
            alert('Invalid config')
        }
        populate_dropdowns()
    }
}

/**
 * Downloads the current user config as a JSON file.
 */
function download_config()
{
    let tests = cfg.scout.configs.map(m => ScoutConfig.validate_mode(m, false)).flat(2).filter(t => t !== true)
    if (tests.length > 0)
    {
        alert('Invalid config!\n\n' + tests.join('\n\n'))
        return
    }

    cfg.scout.version = `${cfg.user.state.user_id}-${new Date().toISOString().split('T')[0]}`

    let element = document.createElement('a')
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(cfg.scout.as_string))
    element.setAttribute('download', `${cfg.year}-config.json`)

    element.style.display = 'none'
    body.appendChild(element)

    element.click()

    body.removeChild(element)
}

/**
 * Builds the config page using the working scout config.
 */
function build_page_from_config()
{
    let mode_idx = mode_dd.element.selectedIndex
    if (mode_idx === cfg.scout.configs.length)
    {
        preview.replaceChildren()
        return
    }

    let select_ids = []
    let pages = []
    // iterate through each page in the mode
    for (let page of cfg.scout.configs[mode_idx].pages)
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