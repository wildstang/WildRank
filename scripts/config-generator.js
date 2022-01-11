/**
 * file:        config-generator.js
 * description: Helps a user generate a new config file.
 * author:      Liam Fruzyna
 * date:        2020-12-08
 */

const BASE_CONFIG = [
    {
        "name": "Pit Scouting",
        "id": "pit",
        "pages": []
    },
    {
        "name": "Match Scouting",
        "id": "match",
        "pages": []
    }
]

const MODES = ['Pit Scouting', 'Match Scouting']
const INPUTS = ['Multicounter', 'Checkbox', 'Counter', 'Select', 'Dropdown', 'Slider', 'Number', 'String', 'Text']

// read parameters from URL
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const year = event_id.substr(0,4)
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

var config = []

// load in validation code
let s = document.createElement('script')
s.src = `scripts/validation.js`
document.head.appendChild(s)

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    document.getElementById('header_info').innerHTML = `Config Generator`
    document.body.innerHTML += '<div id="add-item"></div>'
    load_config()
    build_page()
}

/** 
 * function:    build_page
 * parameters:  none
 * returns:     none
 * description: Builds the structure of the page.
 */
function build_page()
{
    document.getElementById('add-item').innerHTML = build_page_frame('Add to...', [
            build_column_frame('', [build_dropdown('new-element-mode', 'Mode:', MODES, default_op='', onchange='populate_dropdowns()'),
                                    build_dropdown('new-element-page', 'Page:', [], default_op='', onchange='populate_dropdowns()'),
                                    build_dropdown('new-element-column', 'Column:', [], default_op='', onchange='populate_dropdowns()'),
                                    build_dropdown('new-element-type', 'Type:', [], default_op='', onchange='populate_options()')]),
            build_column_frame('', [build_str_entry('new-element-name', 'Name:'),
                                    build_str_entry('new-element-id', 'ID:')]),
            build_column_frame('', ['<div id="options"></div>'])
        ]) +
        '<span id="preview"></span>' +
        build_page_frame('', [
            build_column_frame('', [build_button('new-element-reset', 'Reset Config', 'config = BASE_CONFIG; populate_dropdowns()')]),
            build_column_frame('', [build_button('new-element-download', 'Download Config', 'download_config()')]),
            build_column_frame('', [build_button('new-element-apply', 'Apply Config', 'save_config()')])
        ])

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
    let mode = document.getElementById('new-element-mode').selectedIndex
    let page = document.getElementById('new-element-page')
    let column = document.getElementById('new-element-column')
    let type = document.getElementById('new-element-type')

    // reset name and id
    document.getElementById('new-element-name').value = ''
    document.getElementById('new-element-id').value = ''
    
    page.innerHTML = config[mode].pages.map(p => build_dropdown_op(p.name, page.value)).join('') + build_dropdown_op('New', page.value)

    // set other dropdown value appropriately
    if (page.value == 'New')
    {
        column.innerHTML = ''
        type.innerHTML = ''
    }
    else
    {
        column.innerHTML = config[mode].pages[page.selectedIndex].columns.map(c => build_dropdown_op(c.name, column.value)).join('') + build_dropdown_op('New', column.value)

        if (column.value == 'New')
        {
            type.innerHTML = ''
        }
        else
        {
            type.innerHTML = INPUTS.map(i => build_dropdown_op(i, type)).join('')
        }
    }

    populate_options()
    build_page_from_config()
}

/** 
 * function:    populate_options
 * parameters:  none
 * returns:     none
 * description: Populates the options accordingly to the dropdown selections.
 */
function populate_options(changed='mode')
{
    // read dropdowns
    let page = document.getElementById('new-element-page').value
    let column = document.getElementById('new-element-column').value
    let type = document.getElementById('new-element-type').value
    let options = document.getElementById('options')

    // set options column appropriately
    let ops = ''
    if (page == 'New')
    {
        ops = build_str_entry('new-element-short', 'Short Name:')
    }
    else
    {
        if (column == 'New')
        {
            ops = build_checkbox('new-element-cycle', 'Is Cycle')
        }
        else
        {
            switch (type)
            {
                case 'Checkbox':
                    ops += build_checkbox('new-element-default', 'Default')
                    ops += build_checkbox('new-element-negative', 'Negative')
                    break
                case 'Slider':
                    ops += build_num_entry('new-element-incr', 'Increment')
                case 'Number':
                    ops += build_num_entry('new-element-min', 'Min')
                    ops += build_num_entry('new-element-max', 'Max')
                case 'Counter':
                    ops += build_num_entry('new-element-default', 'Default')
                    ops += build_checkbox('new-element-negative', 'Negative')
                    break
                case 'String':
                    ops += build_str_entry('new-element-default', 'Default')
                    break
                case 'Text':
                    ops += build_text_entry('new-element-default', 'Default')
                    break
                case 'Multicounter':
                    ops += build_str_entry('new-element-negative', 'Negative')
                case 'Select':
                case 'Dropdown':
                    ops += build_str_entry('new-element-options', 'Options')
                    ops += build_str_entry('new-element-default', 'Default')
                    break
            }
        }
    }
    options.innerHTML = ops + build_button('new-element-submit', 'Add', 'create_element()')
}

/** 
 * function:    create_element
 * parameters:  none
 * returns:     none
 * description: Adds an element to the config based on dropdowns and options.
 */
function create_element(changed='mode')
{
    // read dropdowns
    let mode = document.getElementById('new-element-mode').selectedIndex
    let page = document.getElementById('new-element-page')
    let column = document.getElementById('new-element-column')
    let type = document.getElementById('new-element-type').value

    // populate name and id
    let name = document.getElementById('new-element-name').value
    let id = document.getElementById('new-element-id').value
    let input = {
        name: name,
        id: id
    }

    // make an identical copy of the config for backup
    let backup = JSON.parse(JSON.stringify(config))

    // populate rest of input object
    if (page.value == 'New')
    {
        input.short = document.getElementById('new-element-short').value
        input.columns = []
        config[mode].pages.push(input)
    }
    else
    {
        if (column.value == 'New')
        {
            input.cycle = document.getElementById('new-element-cycle').checked
            input.inputs = []
            config[mode].pages[page.selectedIndex].columns.push(input)
        }
        else
        {
            input.type = type.toLowerCase()
            let ops = []
            switch (type)
            {
                case 'Checkbox':
                    input.default = document.getElementById('new-element-default').checked
                    input.negative = document.getElementById('new-element-negative').checked
                    break
                case 'Slider':
                    ops = [ parseInt(document.getElementById('new-element-incr').value) ]
                case 'Number':
                    ops = [ parseInt(document.getElementById('new-element-min').value), parseInt(document.getElementById('new-element-max').value) ].concat(ops)
                    input.options = ops
                case 'Counter':
                    input.default = parseInt(document.getElementById('new-element-default').value)
                    input.negative = document.getElementById('new-element-negative').checked
                    break
                case 'Multicounter':
                    input.negative = document.getElementById('new-element-negative').value.split(',').map(n => n.toLowerCase() === 'true')
                case 'Select':
                case 'Dropdown':
                    input.options = document.getElementById('new-element-options').value.split(',')
                case 'String':
                case 'Text':
                    input.default = document.getElementById('new-element-default').value
                    break
            }
            if (type == 'Multicounter')
            {
                input.default = parseInt(ops.default)
            }
            config[mode].pages[page.selectedIndex].columns[column.selectedIndex].inputs.push(input)
        }
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
    
    // restore old config if invalid
    if (validate_scout_config(config[0]) && validate_scout_config(config[1]))
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
        alert('Invalid change!')
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
    let pit = get_config(`${year}-pit`)
    let match = get_config(`${year}-match`)
    if (!file_exists(`${year}-pit`))
    {
        pit = {
            name: 'Pit Scouting',
            id: 'pit',
            pages: []
        }
    }
    if (!file_exists(`${year}-match`))
    {
        match = {
            name: 'Match Scouting',
            id: 'match',
            pages: []
        }
    }
    config = [pit, match]
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
    localStorage.setItem(`config-${year}-pit`, JSON.stringify(config[0]))
    localStorage.setItem(`config-${year}-match`, JSON.stringify(config[1]))

    // post string to server
    let addr = get_cookie(UPLOAD_COOKIE, UPLOAD_DEFAULT)
    if (check_server(addr))
    {
        let contents = {}
        contents[year] = config
        let upload = `scout-config.json|||${JSON.stringify(contents)}`
        fetch(addr, {method: 'POST', body: upload})
    }
    alert('Scouting config updated')
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
    contents[year] = config
    let str = JSON.stringify(contents)

    let element = document.createElement('a')
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(str))
    element.setAttribute('download', `scout-config.json`)

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    document.body.removeChild(element)
}

/** 
 * function:    build_page_from_config
 * parameters:  none
 * returns:     none
 * description: Builds the page from the config file and the given mode.
 */
function build_page_from_config()
{
    let mode = document.getElementById('new-element-mode').selectedIndex

    let select_ids = []
    let pages = []
    // iterate through each page in the mode
    for (let page of config[mode].pages)
    {
        let selected_page = document.getElementById('new-element-page').value
        let page_name = page.name
        if (selected_page == page_name || selected_page == 'New' || selected_page == '')
        {
            let columns = []
            if (selected_page != page_name)
            {
                columns.push(build_multi_button(`${page.id}_edit`, '', ['&#9664;', 'X', '&#9654;'], [`shift('${page.id}', 'up')`, `shift('${page.id}', 'rm')`, `shift('${page.id}', 'down')`], 'slim page_header'))
            }
            // iterate through each column in the page
            for (let column of page.columns)
            {
                let selected_col = document.getElementById('new-element-column').value
                let col_name = column.name
                if (selected_col == col_name || selected_col == 'New' || selected_col == '')
                {
                    let cycle = column.cycle
                    let items = []
                    if (selected_col != col_name)
                    {
                        items.push(build_multi_button(`${column.id}_edit`, '', ['&#9664;', 'X', '&#9654;'], [`shift('${column.id}', 'up')`, `shift('${column.id}', 'rm')`, `shift('${column.id}', 'down')`], 'slim column_header'))
                    }
                    // iterate through input in the column
                    for (let input of column.inputs)
                    {
                        let name = input.name
                        let id = input.id
                        let type = input.type
                        let default_val = input.default
                        let options = input['options']
        
                        let item = ''
                        // build each input from its template
                        switch (type)
                        {
                            case 'checkbox':
                                if (default_val)
                                {
                                    select_ids.push(`${id}-container`)
                                }
                                item = build_checkbox(id, name, default_val)
                                break
                            case 'counter':
                                item = build_counter(id, name, default_val)
                                break
                            case 'multicounter':
                                item = build_multi_counter(id, name, options, default_val)
                                break
                            case 'select':
                                item = build_select(id, name, options, default_val)
                                break
                            case 'dropdown':
                                item = build_dropdown(id, name, options, default_val)
                                break
                            case 'string':
                                item = build_str_entry(id, name, default_val)
                                break
                            case 'number':
                                item = build_num_entry(id, name, default_val, options)
                                break
                            case 'slider':
                                let step = 1
                                if (options.length >= 3)
                                {
                                    step = options[3]
                                }
                                item = build_slider(id, name, options[0], options[1], step, default_val)
                                break
                            case 'text':
                                item = build_text_entry(id, name, default_val)
                                break
                        }
                        items.push(item)
                        items.push(build_multi_button(`${id}_edit`, '', ['&#9650;', 'X', '&#9660;'], [`shift('${id}', 'up')`, `shift('${id}', 'rm')`, `shift('${id}', 'down')`], 'slim'))
                    }
                    if (cycle)
                    {
                        items.push(build_counter(`${column.id}_cycles`, 'Cycles', 0))
                    }
                    columns.push(build_column_frame(col_name, items, cycle ? 'cycle' : ''))
                }
            }
            pages.push(build_page_frame(page_name, columns))
        }
    }
    document.getElementById('preview').innerHTML = pages.join('')

    // mark each selected box as such
    for (let id of select_ids)
    {
        document.getElementById(id).classList.add('selected')
    }
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
        for (let p in c.pages)
        {
            let page = c.pages[p]
            if (page.id == id)
            {
                list = c.pages
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