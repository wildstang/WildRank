/**
 * file:        config-generator.js
 * description: Helps a user generate a new config file.
 * author:      Liam Fruzyna
 * date:        2020-12-08
 */

var config = [
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

// read parameters from URL
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const year = event_id.substr(0,4)
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
    document.body.innerHTML += '<div id="config-preview"></div><div id="add-item"></div>'
    build_page()
}

/** 
 * function:    build_preview_from_config
 * parameters:  none
 * returns:     none
 * description: Builds the preview from the working config.
 */
function build_preview_from_config()
{
    document.getElementById('config-preview').innerHTML = ''
    let select_ids = []
    // iterate through each mode
    for (let c of config)
    {
        // iterate through each page in the mode
        for (let page of c.pages)
        {
            let page_name = page.name
            let pid = page.id
            columns = [build_multi_button(`${pid}_edit`, '', ['&#9664;', 'X', '&#9654;'], [`shift('${pid}', 0)`, `shift('${pid}', 1)`, `shift('${pid}', 2)`], 'slim')]
            // iterate through each column in the page
            for (let column of page.columns)
            {
                var col_name = column.name
                let cid = column.id
                items = [build_multi_button(`${cid}_edit`, '', ['&#9664;', 'X', '&#9654;'], [`shift('${cid}', 0)`, `shift('${cid}', 1)`, `shift('${cid}', 2)`], 'slim')]
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
                            let min = options[0]
                            let max = options[1]
                            let incr = 1
                            if (options.length > 2)
                            {
                                incr = options[2]
                            }
                            item = build_slider(id, name, min, max, incr, default_val)
                            break
                        case 'text':
                            item = build_text_entry(id, name, default_val)
                            break
                    }
                    items.push(item)
                    items.push(build_multi_button(`${id}_edit`, '', ['&#9650;', 'X', '&#9660;'], [`shift('${id}', 0)`, `shift('${id}', 1)`, `shift('${id}', 2)`], 'slim'))
                }
                columns.push(build_column_frame(col_name, items))
            }
            document.getElementById('config-preview').innerHTML += build_page_frame(page_name, columns)
            
        }
    }

    // mark each selected box as such
    for (let id of select_ids)
    {
        document.getElementById(id).classList.add('selected')
    }
}

/** 
 * function:    apply_shift_function
 * parameters:  id to shift, shift function, array of items, index to check
 * returns:     if id found
 * description: Applies the shift function to an id in a array, if there.
 */
function apply_shift_function(id, func, array, i)
{
    if (array[i].id == id)
    {
        // left/up
        if (func == 0 && i > 0)
        {
            [array[i-1], array[i]] = [array[i], array[i-1]]
        }
        // delete
        else if (func == 1)
        {
            array.splice(i, 1)
        }
        // right/down
        else if (func == 2 && i+1 < array.length)
        {
            [array[i], array[i+1]] = [array[i+1], array[i]]
        }
        return true
    }
    return false
}

/** 
 * function:    shift
 * parameters:  id to shift, shift function
 * returns:     none
 * description: Searches for id to apply shift function to.
 */
function shift(id, func)
{
    let found = false
    for (let i = 0; i < config.length; ++i)
    {
        let pages = config[i].pages
        for (let j = 0; j < pages.length; ++j)
        {
            found = apply_shift_function(id, func, pages, j)
            if (found) break
            let columns = pages[j].columns
            for (let k = 0; k < columns.length; ++k)
            {
                found = apply_shift_function(id, func, columns, k)
                if (found) break
                let inputs = columns[k].inputs
                for (let l = 0; l < inputs.length; ++l)
                {
                    found = apply_shift_function(id, func, inputs, l)
                    if (found) break
                }
                if (found) break
            }
            if (found) break
        }
        if (found) break
    }

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
    let modes = ['Pit', 'Match']
    let inputs = ['Button', 'Checkbox', 'Counter', 'Multi-Counter', 'Select', 'Dropdown', 'String', 'Number', 'Slider', 'Text']

    document.getElementById('add-item').innerHTML = build_page_frame('Add Item', [
            build_column_frame('', [build_dropdown('new-element-mode', 'Mode:', modes, default_op='', onchange='populate_dropdowns(`mode`)'),
                                    build_dropdown('new-element-level', 'Level:', [], default_op='', onchange='populate_dropdowns(`level`)')]),
            build_column_frame('', [build_dropdown('new-element-page', 'Page:', [], default_op='', onchange='populate_dropdowns(`page`)'),
                                    build_dropdown('new-element-column', 'Column:', [], default_op='', onchange='update_add_panel()')]),
            build_column_frame('', [build_dropdown('new-element-type', 'Type:', inputs, default_op='', onchange='update_add_panel()'),
                                    build_str_entry('new-element-name', 'Name:'),
                                    build_str_entry('new-element-id', 'ID:'),
                                    build_str_entry('new-element-short', 'Short Name:')]),
            build_column_frame('', [build_str_entry('new-element-options', 'Options:'),
                                    build_num_entry('new-element-min', 'Min:'),
                                    build_num_entry('new-element-max', 'Max:'),
                                    build_num_entry('new-element-step', 'Step:'),
                                    build_str_entry('new-element-default', 'Default:')]),
            build_column_frame('', [build_button('new-element-submit', 'Add', 'create_element()')])
        ]) + build_page_frame('Config', [
            build_column_frame('', [build_button('load-config', 'Load Current Config', 'load_config()')]),
            build_column_frame('', [build_str_entry('save-config-name', 'Config Name')]),
            build_column_frame('', [build_button('save-config', 'Save', 'save_config()')]),
            build_column_frame('', [build_button('apply-config', 'Apply', 'apply_config()')])
        ])

    populate_dropdowns()
    build_preview_from_config()
}

/** 
 * function:    populate_dropdowns
 * parameters:  triggering element change
 * returns:     none
 * description: Populates the dropdowns accordingly to other selections.
 */
function populate_dropdowns(changed='mode')
{
    let mode = document.getElementById('new-element-mode').selectedIndex
    let level = document.getElementById('new-element-level').selectedIndex
    let page = document.getElementById('new-element-page').selectedIndex
    let column = document.getElementById('new-element-column').selectedIndex
    
    switch (changed)
    {
        case 'mode':
            level = 0
            page = 0
            column = 0
            break
        case 'level':
            switch (level)
            {
                // item
                case 2:
                    page = 0
                // page
                case 0:
                    column = 0
                // column
                case 1:
                    break
            }
            break
        case 'page':
            column = 0
            break
    }

    let levels = ['Page']

    let pages = config[mode].pages.map(page => page.name)
    if (pages.length > 0)
    {
        levels.push('Column')
    }

    let columns = []
    if (config[mode].pages[page])
    {
        columns = config[mode].pages[page].columns.map(column => column.name)
        if (columns.length > 0)
        {
            levels.push('Item')
        }
    }

    let level_ops = ''
    let page_ops = ''
    let column_ops = ''

    switch (level)
    {
        // item
        case 2:
            column_ops = columns.map(name => build_dropdown_op(name, columns[column])).join('')
        // column
        case 1:
            page_ops = pages.map(name => build_dropdown_op(name, pages[page])).join('')
        // page
        case 0:
            level_ops = levels.map(name => build_dropdown_op(name, levels[level])).join('')
            break
    }

    document.getElementById('new-element-level').innerHTML = level_ops
    document.getElementById('new-element-page').innerHTML = page_ops
    document.getElementById('new-element-column').innerHTML = column_ops

    update_add_panel()
}

/** 
 * function:    create_element
 * parameters:  none
 * returns:     none
 * description: Adds a new element to the config based on current form.
 */
function create_element()
{
    let mode = document.getElementById('new-element-mode').selectedIndex
    let page = document.getElementById('new-element-page').selectedIndex
    let column = document.getElementById('new-element-column').selectedIndex
    let name = document.getElementById('new-element-name').value
    let id = name
    if (document.getElementById('new-element-id').value)
    {
        id = document.getElementById('new-element-id').value
    }
    id = id.toLowerCase().replace(' ', '_')
    let defalt = document.getElementById('new-element-default').value
    let short = document.getElementById('new-element-short').value
    if (short.length == 0)
    {
        short = name
    }
    let options = document.getElementById('new-element-options').value.split(',').map(option => option.trim())
    let min = document.getElementById('new-element-min').value
    let max = document.getElementById('new-element-max').value
    let step = document.getElementById('new-element-step').value
    switch (document.getElementById('new-element-level').selectedIndex)
    {
        // page
        case 0:
            config[mode].pages.push({
                "name": name,
                "short": short,
                "id": `${config[mode].id}_${id}`,
                "columns": []
            })
            break
        // column
        case 1:
            config[mode].pages[page].columns.push({
                "name": name,
                "id": `${config[mode].pages[page].id}_${id}`,
                "inputs": []
            })
            break
        // item
        case 2:
            let item = {
                "name": name,
                "id": `${config[mode].pages[page].columns[column].id}_${id}`
            }
            switch (document.getElementById('new-element-type').selectedIndex)
            {
                case 0:
                    item.type = 'button'
                    item.default = defalt
                    break
                case 1:
                    item.type = 'checkbox'
                    item.default = defalt == 'true'
                    break
                case 2:
                    item.type = 'counter'
                    if (defalt.length > 0)
                    {
                        item.default = parseInt(defalt)
                    }
                    else
                    {
                        item.default = 0
                    }
                    if (min && max)
                    {
                        item.options = [min, max]
                    }
                    else if (max)
                    {
                        item.options = [max]
                    }
                    break
                case 3:
                    item.type = 'multicounter'
                    if (defalt.length > 0)
                    {
                        item.default = parseInt(defalt)
                    }
                    else
                    {
                        item.default = 0
                    }
                    item.options = options
                    break
                case 4:
                    item.type = 'select'
                    item.default = defalt
                    item.options = options
                    break
                case 5:
                    item.type = 'dropdown'
                    item.default = defalt
                    item.options = options
                    break
                case 6:
                    item.type = 'string'
                    item.default = defalt
                    break
                case 7:
                    item.type = 'number'
                    if (defalt.length > 0)
                    {
                        item.default = parseInt(defalt)
                    }
                    else
                    {
                        item.default = 0
                    }
                    if (min && max)
                    {
                        item.options = [min, max]
                    }
                    else if (max)
                    {
                        item.options = [max]
                    }
                    break
                case 8:
                    item.type = 'slider'
                    if (defalt.length > 0)
                    {
                        item.default = parseInt(defalt)
                    }
                    else
                    {
                        item.default = 0
                    }
                    item.options = [min, max]
                    if (step)
                    {
                        item.options.push(step)
                    }
                    break
                case 9:
                    item.type = 'text'
                    item.default = defalt
                    break
            }
            config[mode].pages[page].columns[column].inputs.push(item)
            break
    }
    console.log(JSON.stringify(config))

    switch (document.getElementById('new-element-level').selectedIndex)
    {
        // page
        case 0:
            populate_dropdowns('level')
            break
        // column
        case 1:
            populate_dropdowns('page')
            break
    }
    build_preview_from_config()
}

/** 
 * function:    save_config
 * parameters:  none
 * returns:     none
 * description: Downloads the current config file.
 */
function save_config()
{
    let name = document.getElementById('save-config-name').value
    let str = JSON.stringify(config)

    let element = document.createElement('a')
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(str))
    element.setAttribute('download', `config-${name}.json`)

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    document.body.removeChild(element)
}

/** 
 * function:    apply_config
 * parameters:  none
 * returns:     none
 * description: Applys the current config.
 */
function apply_config()
{
    for (let cfg of config)
    {
        localStorage.setItem(`config-${year}-${cfg.id}`, JSON.stringify(cfg))
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
    config = [get_config(`${year}-pit`), get_config(`${year}-match`)]
    build_page()
    update_add_panel()
}

/** 
 * function:    set_elements_display
 * parameters:  elements to update, display state
 * returns:     none
 * description: Bulk sets the display style attribute of a list of IDs.
 */
function set_elements_display(elements, display)
{
    for (let e of elements)
    {
        document.getElementById(e).style.display = display
        document.getElementById(`${e}_label`).style.display = display
    }
}

/** 
 * function:    update_add_panel
 * parameters:  none
 * returns:     none
 * description: Hides and shows add item inputs as necessary.
 */
function update_add_panel()
{
    switch (document.getElementById('new-element-level').selectedIndex)
    {
        // page
        case 0:
            set_elements_display(['new-element-short'], 'block')
            set_elements_display(['new-element-page', 'new-element-column', 'new-element-type', 'new-element-default',
                                  'new-element-options', 'new-element-min', 'new-element-max', 'new-element-step'], 'none')
            break
        // column
        case 1:
            set_elements_display(['new-element-page'], 'block')
            set_elements_display(['new-element-column', 'new-element-type', 'new-element-default', 
                'new-element-short', 'new-element-options', 'new-element-min', 'new-element-max', 'new-element-step'], 'none')
            break
        // item
        case 2:
            set_elements_display(['new-element-page', 'new-element-column', 'new-element-type', 'new-element-default'], 'block')
            set_elements_display(['new-element-short', 'new-element-step'], 'none')

            switch (document.getElementById('new-element-type').selectedIndex)
            {
                // button
                case 0:
                // checkbox
                case 1:
                // string
                case 6:
                // text
                case 9:
                    set_elements_display(['new-element-options', 'new-element-min', 'new-element-max'], 'none')
                    break
                
                // slider
                case 8:
                    set_elements_display(['new-element-step'], 'block')
                // counter
                case 2:
                // number
                case 7:
                    set_elements_display(['new-element-options'], 'none')
                    set_elements_display(['new-element-min', 'new-element-max'], 'block')
                    break
                
                // multicounter
                case 3:
                // select
                case 4:
                // dropdown
                case 5:
                    set_elements_display(['new-element-options'], 'block')
                    set_elements_display(['new-element-min', 'new-element-max'], 'none')
                    break
            }
            break
    }

    let texts = ['new-element-name', 'new-element-id', 'new-element-default', 'new-element-short', 'new-element-options', 'new-element-min', 'new-element-max', 'new-element-step']
    for (let e of texts)
    {
        document.getElementById(e).value = ''
    }
}