/**
 * file:        config-generator.js
 * description: Helps a user generate a new config file.
 * author:      Liam Fruzyna
 * date:        2020-12-08
 */

const INPUTS = ['Multicounter', 'Checkbox', 'Counter', 'Select', 'Dropdown', 'Multiselect', 'Slider', 'Number', 'String', 'Text']

var config = Array(MODES.length).fill([])

const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

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
}

/** 
 * function:    build_page
 * parameters:  none
 * returns:     none
 * description: Builds the structure of the page.
 */
function build_page()
{
    let mode_names = MODES.map(m => m.charAt(0).toUpperCase() + m.substring(1) + ' Scouting')
    let mode = new Dropdown('new-element-mode', 'Mode:', mode_names)
    mode.on_change = 'populate_dropdowns()'
    let page = new Dropdown('new-element-page', 'Page:')
    page.on_change = 'populate_dropdowns()'
    let column = new Dropdown('new-element-column', 'Column:')
    column.on_change = 'populate_dropdowns()'
    let type = new Dropdown('new-element-type', 'Type:')
    type.on_change = 'populate_options()'
    let name = new Entry('new-element-name', 'Name:')
    name.description = 'A brief description of the input visible to the user.'

    document.getElementById('add-item').innerHTML = new PageFrame('', 'Add to...', [
            new ColumnFrame('', '', [mode, page, column, type]),
            new ColumnFrame('', '', [name]),
            new ColumnFrame('', '', ['<div id="options"></div>'])
        ]).toString +
        '<span id="preview"></span>' +
        new PageFrame('', '', [
            new ColumnFrame('', '', [new Button('new-element-reset', 'Reset Config', 'reset_config()')]),
            new ColumnFrame('', '', [new Button('new-element-download', 'Download Config', 'download_config()')]),
            new ColumnFrame('', '', [new Button('new-element-upload', 'Upload Config', 'upload_config()')]),
            new ColumnFrame('', '', [new Button('new-element-apply', 'Apply Config', 'save_config()')])
        ]).toString

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

    let page_dd = new Dropdown('new-element-page', 'Page:', config[mode].map(p => p.name).concat(['New']), page.value)
    page.innerHTML = page_dd.html_options

    // set other dropdown value appropriately
    if (page.value == 'New')
    {
        column.innerHTML = ''
        type.innerHTML = ''
    }
    else
    {
        let column_dd = new Dropdown('new-element-column', 'Column:', config[mode][page.selectedIndex].columns.map(c => c.name).concat(['New']), column.value)
        column.innerHTML = column_dd.html_options

        if (column.value == 'New')
        {
            type.innerHTML = ''
        }
        else
        {
            let type_dd = new Dropdown('new-element-type', 'Type:', INPUTS, type)
            type.innerHTML = type_dd.html_options
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
function populate_options()
{
    // read dropdowns
    let page = document.getElementById('new-element-page').value
    let column = document.getElementById('new-element-column').value
    let type = document.getElementById('new-element-type').value
    let options = document.getElementById('options')

    // set options column appropriately
    let ops = new ColumnFrame()
    if (column == 'New')
    {
        ops.add_input(new Checkbox('new-element-cycle', 'Is Cycle'))
    }
    else
    {
        let colors
        switch (type)
        {
            case 'Checkbox':
                ops.add_input(new Checkbox('new-element-default', 'Default'))
                ops.add_input(new Checkbox('new-element-negative', 'Negative'))
                ops.add_input(new Checkbox('new-element-no-default', 'Disallow Default'))
                break
            case 'Slider':
                let incr = new Entry('new-element-incr', 'Increment', '1')
                incr.type = 'number'
                incr.description = 'The size of a single step.'
                ops.add_input(incr)
            case 'Number':
                let min = new Entry('new-element-min', 'Min', '0')
                min.type = 'number'
                min.description = 'The minimum allowed value.'
                ops.add_input(min)
                let max = new Entry('new-element-max', 'Max', '10')
                max.type = 'number'
                max.description = 'The maximum allowed value.'
                ops.add_input(max)
            case 'Counter':
                let def = new Entry('new-element-default', 'Default', '0')
                def.type = 'number'
                def.description = 'The default value displayed in the box.'
                ops.add_input(def)
                ops.add_input(new Checkbox('new-element-negative', 'Negative'))
                ops.add_input(new Checkbox('new-element-no-default', 'Disallow Default'))
                break
            case 'String':
                let defs = new Entry('new-element-default', 'Default', '')
                defs.description = 'The default text displayed in the box, must not be empty.'
                ops.add_input(defs)
                ops.add_input(new Checkbox('new-element-no-default', 'Disallow Default'))
                break
            case 'Text':
                let defe = new Extended('new-element-default', 'Default', '')
                defe.description = 'The default text displayed in the box, must not be empty.'
                ops.add_input(defe)
                ops.add_input(new Checkbox('new-element-no-default', 'Disallow Default'))
                break
            case 'Multicounter':
                let neg = new Entry('new-element-negative', 'Negative')
                neg.description = 'A comma-separated list of true/false values for each counter.'
                ops.add_input(neg)
                let mops = new Entry('new-element-options', 'Options')
                mops.description = 'A comma-separated list of selectable options, all spaces will be deleted.'
                ops.add_input(mops)
                let defm = new Entry('new-element-default', 'Default', '0')
                defm.type = 'number'
                defm.description = 'The single default value for all counters.'
                ops.add_input(defm)
                ops.add_input(new Checkbox('new-element-no-default', 'Disallow Default'))
                break
            case 'Select':
            case 'Multiselect':
                colors = new Entry('new-element-colors', 'Colors')
                colors.description = 'A comma-separated list of html colors, one for each option, all spaces will be deleted.'
            case 'Dropdown':
                let sops = new Entry('new-element-options', 'Options')
                sops.description = 'A comma-separated list of selectable options, all spaces will be deleted.'
                ops.add_input(sops)
                if (typeof colors !== 'undefined')
                {
                    ops.add_input(colors)
                }
                let defo = new Entry('new-element-default', 'Default', '')
                defo.description = 'The default selected option, must exactly match that option.'
                ops.add_input(defo)
                ops.add_input(new Checkbox('new-element-no-default', 'Disallow Default'))
                break
        }
    }
    ops.add_input(new Button('new-element-submit', 'Add', 'create_element()'))
    options.innerHTML = ops.toString
}

/**
 * function:    create_id_from_name
 * parameters:  parent id, name string
 * returns:     sanitized name
 * description: Sanitizes an input name so it can be used for the ID.
 */
function create_id_from_name(parent, name)
{
    let id = name.toLowerCase()
                 .replaceAll(/\(.*\)/g, '') // remove parenthesis
                 .replaceAll(/[- ]/g, '_')  // replace spaces and hyphens with underscores
                 .replaceAll(/__+/g, '_')   // prevent repeated underscores
                 .replaceAll(/\W+/g, '')    // remove any non-alphanumeric or underscore character

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
    return list.split(',').map(s => s.trim())
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
    let mode = document.getElementById('new-element-mode').selectedIndex
    let page = document.getElementById('new-element-page')
    let column = document.getElementById('new-element-column')
    let type = document.getElementById('new-element-type').value

    // populate name and id
    let name = document.getElementById('new-element-name').value
    let input = {
        name: name
    }

    // make an identical copy of the config for backup
    let backup = JSON.parse(JSON.stringify(config))

    // populate rest of input object
    if (page.value == 'New')
    {
        let parent = MODES[mode]
        input.id = create_id_from_name(parent, name)
        input.columns = []
        config[mode].push(input)
    }
    else
    {
        if (column.value == 'New')
        {
            let parent = config[mode][page.selectedIndex].id
            input.id = create_id_from_name(parent, name)
            input.cycle = document.getElementById('new-element-cycle').checked
            input.inputs = []
            config[mode][page.selectedIndex].columns.push(input)
        }
        else
        {
            let parent = config[mode][page.selectedIndex].columns[column.selectedIndex].id
            input.id = create_id_from_name(parent, name)
            input.type = type.toLowerCase()
            if (document.getElementById('new-element-no-default').checked)
            {
                input.disallow_default = true
            }
            let ops = []
            switch (type)
            {
                case 'Checkbox':
                    input.default = document.getElementById('new-element-default').checked
                    input.negative = document.getElementById('new-element-negative').checked
                    break
                case 'Slider':
                    let incr = document.getElementById('new-element-incr').value
                    if (incr === '')
                    {
                        incr = '1'
                    }
                    ops = [ parseInt(incr) ]
                case 'Number':
                    let min = document.getElementById('new-element-min').value
                    let max = document.getElementById('new-element-max').value
                    if (min === '')
                    {
                        min = '0'
                    }
                    if (max === '')
                    {
                        max = '10'
                    }
                    ops = [ parseInt(min), parseInt(max) ].concat(ops)
                    input.options = ops
                case 'Counter':
                    let def = document.getElementById('new-element-default').value
                    if (def === '')
                    {
                        def = '0'
                    }
                    input.default = parseInt(def)
                    input.negative = document.getElementById('new-element-negative').checked
                    break
                case 'Multicounter':
                    input.negative = parse_list(document.getElementById('new-element-negative').value).map(n => n.toLowerCase() === 'true')
                case 'Select':
                case 'Multiselect':
                    if (type !== 'Multicounter')
                    {
                        input.colors = parse_list(document.getElementById('new-element-colors').value)
                    }
                case 'Dropdown':
                    input.options = parse_list(document.getElementById('new-element-options').value)
                case 'String':
                case 'Text':
                    input.default = document.getElementById('new-element-default').value
            }
            if (type == 'Multicounter')
            {
                if (input.default == '')
                {
                    input.default = '0'
                }
                input.default = parseInt(input.default)
            }
            if ((type == 'String' || type == 'Text') && input.default === '')
            {
                input.default = 'N/A'
            }
            config[mode][page.selectedIndex].columns[column.selectedIndex].inputs.push(input)
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
    
    // remove change to config if invalid
    if (Config.validate_mode_raw(config[0]) && Config.validate_mode_raw(config[1]))
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
    for (let page of config[mode])
    {
        let selected_page = document.getElementById('new-element-page').value
        let page_name = page.name
        if (selected_page == page_name || selected_page == 'New' || selected_page == '')
        {
            let page_frame = new PageFrame('', page_name)
            pages.push(page_frame)
            if (selected_page != page_name)
            {
                let button = new MultiButton(`${page.id}_edit`, '')
                button.add_option('&#9664;', `shift('${page.id}', 'up')`)
                button.add_option('X', `shift('${page.id}', 'rm')`)
                button.add_option('&#9654;', `shift('${page.id}', 'down')`)
                button.add_class('slim page_color')
                button.columns = 3
                page_frame.add_column(button)
            }
            // iterate through each column in the page
            for (let column of page.columns)
            {
                let selected_col = document.getElementById('new-element-column').value
                let col_name = column.name
                if (selected_col == col_name || selected_col == 'New' || selected_col == '')
                {
                    let cycle = column.cycle
                    let column_frame = new ColumnFrame('', col_name)
                    column_frame.add_input(cycle ? 'cycle' : '')
                    page_frame.add_column(column_frame)
                    if (selected_col != col_name)
                    {
                        let button = new MultiButton(`${column.id}_edit`, '')
                        button.add_option('&#9664;', `shift('${column.id}', 'up')`)
                        button.add_option('X', `shift('${column.id}', 'rm')`)
                        button.add_option('&#9654;', `shift('${column.id}', 'down')`)
                        button.add_class('slim column_color')
                        button.columns = 3
                        column_frame.add_input(button)
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
                                item = new Checkbox(id, name, default_val)
                                break
                            case 'counter':
                                item = new Counter(id, name, default_val)
                                break
                            case 'multicounter':
                                item = new MultiCounter(id, name, options, default_val)
                                break
                            case 'select':
                                item = new Select(id, name, options, default_val)
                                item.vertical = input.vertical
                                break
                            case 'multiselect':
                                let dval = ''
                                if (typeof dval === 'string')
                                {
                                    dval = default_val
                                }
                                else if (dval instanceof Array)
                                {
                                    davl = default_val.split(',')
                                }
                                item = new MultiSelect(id, name, options, dval)
                                item.vertical = input.vertical
                                break
                            case 'dropdown':
                                item = new Dropdown(id, name, options, default_val)
                                break
                            case 'string':
                                item = new Entry(id, name, default_val)
                                break
                            case 'number':
                                item = new Entry(id, name, default_val)
                                item.type = 'number'
                                item.bounds = options
                                break
                            case 'slider':
                                item = new Slider(id, name, default_val)
                                item.bounds = options
                                break
                            case 'text':
                                item = new Extended(id, name, default_val)
                                break
                        }
                        column_frame.add_input(item)
                        
                        let button = new MultiButton(`${id}_edit`, '')
                        button.add_option('&#9650;', `shift('${id}', 'up')`)
                        button.add_option('X', `shift('${id}', 'rm')`)
                        button.add_option('&#9660;', `shift('${id}', 'down')`)
                        button.add_class('slim')
                        button.columns = 3
                        column_frame.add_input(button)
                    }
                    if (cycle)
                    {
                        column_frame.add_input(new Counter(`${column.id}_cycles`, 'Cycles', 0))
                    }
                }
            }
        }
    }
    document.getElementById('preview').innerHTML = pages.map(p => p.toString).join('')

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
    config = [[], []]
    populate_dropdowns()
}