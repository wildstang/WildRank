/**
 * file:        inputs.js
 * description: Contains functions and HTML string for the various inputs of the web app.
 * author:      Liam Fruzyna
 * date:        2020-03-05
 */

/**
 * function:    build_page_frame
 * parameters:  page name, array of columns as strings, if to add top margin
 * returns:     page object as a string
 * description: Builds the HTML string of a page object given its name and columns.
 */
function build_page_frame(page_name, columns, top_margin=true, id='')
{
    if (id)
    {
        id = `id="${id}"`
    }
    let header = page_name.length > 0 ? `<h2 class="page_header">${page_name}</h2>` : ''
    return `<div ${id} class="page ${top_margin ? '' : 'no_top_margin'}">
            ${header}
            ${columns.join('')}
        </div>`
}

/**
 * function:    build_column_frame
 * parameters:  column name, array of items as strings, additional header css classes
 * returns:     column object as a string
 * description: Builds the HTML string of a column object given its name and items.
 */
function build_column_frame(column_name, items, additional_classes='')
{
    let header = column_name.length > 0 ? `<h2 class="column_header ${additional_classes}">${column_name}</h2>` : ''
    return `<div class="column">
            ${header}
            ${items.join('')}
        </div>`
}

/**
 * function:    build_button
 * parameters:  element id, name, javascript onclick response, additional css classes
 * returns:     wr_button as a string
 * description: Builds the HTML string of a button object.
 */
function build_button(id, name, onclick, onsecondary='', additional_classes='')
{
    let oncontextmenu = onsecondary.length > 0 ? onsecondary + '; return false' : ''
    onsecondary = onsecondary.replace(/'/g, '\\\'')
    /*
     * Notes for handling clicks:
     * onauxclick handles both button 2 and 3 clicks
     * oncontextmenu handles only 2, need to be false to hide menu reguardless of onauxclick
     * holding on some devices (Android) can activate contextmenu/aux and on touch start
     * I'm not sure what the return value means and if it is needed in onauxclick 
     */
    return `<div id="${id}-container" class="wr_button ${additional_classes}" onclick="${onclick}" oncontextmenu="return false" onauxclick="${oncontextmenu}; return false" ontouchstart="touch_button(false)" ontouchend="touch_button('${onsecondary}')">
            <label id="${id}">${name}</label>
        </div>`
}

/**
 * function:    build_link_button
 * parameters:  element id, name, link, url pre-check function
 * returns:     wr_button as a string
 * description: Builds the HTML string of a button object for a link.
 */
function build_link_button(id, name, url)
{
    return build_button(id, name, `window_open(${url}, '_self')`, `window_open(${url}, '_blank')`)
}

/**
 * function:    build_checkbox
 * parameters:  element id, name, default checked state, javascript onclick response
 * returns:     wr_checkbox as a string
 * description: Builds the HTML string of a checkbox object.
 */
function build_checkbox(id, name, checked=false, onclick='')
{
    return `<div id="${id}-container" class="wr_checkbox" onclick="check('${id}'); ${onclick}">
            <input type="checkbox" onclick="check('${id}'); ${onclick}" id="${id}" name="${name}" ${checked ? 'checked' : ''}>
            <label for="${id}" onclick="check('${id}')">${name}</label>
        </div>`
}

/**
 * function:    build_counter
 * parameters:  element id, name, default value, js to call on increment
 * returns:     wr_counter as a string
 * description: Builds the HTML string of a counter object.
 */
function build_counter(id, name, value, onincrement='', ondecrement='')
{
    onincrement = onincrement.replace(/'/g, '\\\'')
    ondecrement = ondecrement.replace(/'/g, '\\\'')
    return `<div class="wr_counter" onclick="increment('${id}', false, '${onincrement}')" oncontextmenu="return false" onauxclick="increment('${id}', true, '${ondecrement}'); return false" ontouchstart="touch_button(false)" ontouchend="touch_button('increment(\\'${id}\\', true, '${ondecrement}')')\">
            <label class="wr_counter_count" id="${id}">${value}</label>
            <label>${name}</label>
        </div>`
}

/**
 * function:    build_multi_counter
 * parameters:  element id, name, option strings, default values
 * returns:     wr_multi_counter as a string
 * description: Builds the HTML string of a multi counter object and its options.
 */
function build_multi_counter(id, name, option_names, values)
{
    let label = name.length != 0 ? `<h4 class="input_label">${name}</h4>` : ''
    let options = ''
    option_names.forEach(function (op_name, i)
    {
        let dval = values
        if (Array.isArray(values))
        {
            dval = values[i]
        }
        let name = `${id}_${op_name.toLowerCase().split().join('_')}`
        options += `<span class="wr_select_option" id="${name}" onclick="increment('${name}-value', false)" oncontextmenu="return false" onauxclick="increment('${name}-value', true); return false" ontouchstart="touch_button(false)" ontouchend="touch_button('increment(\\'${name}-value\\', true)')\">
                <label class="wr_counter_count" id="${name}-value">${dval}</label> ${op_name}
            </span>`
    })
    return `${label}<div class="wr_select" id="${id}">${options}</div>`
}

/**
 * function:    build_multi_button
 * parameters:  element id, name, option strings, javascript onclick responses, additional css classes
 * returns:     wr_select as a string
 * description: Builds the HTML string of a multi button object and its options.
 */
function build_multi_button(id, name, option_names, onclicks, additional_classes='', onsecondarys=[])
{
    let label = name.length != 0 ? `<h4 class="input_label">${name}</h4>` : ''
    let options = ''
    option_names.forEach(function (op_name, index)
    {
        options += `<span class="wr_select_option ${additional_classes}" id="${id}-${index}" onclick="${onclicks[index]}" oncontextmenu="return false" onauxclick="${onsecondarys[index]}; return false" ontouchstart="touch_button(false)" ontouchend="touch_button('${onsecondarys[index]}')">
                <label>${op_name}</label>
            </span>`
    })
    return `${label}<div class="wr_select ${additional_classes}" id="${id}">${options}</div>`
}

/**
 * function:    build_select
 * parameters:  element id, name, option strings, default option, javascript onclick response
 * returns:     wr_select as a string
 * description: Builds the HTML string of a select object and its options.
 */
function build_select(id, name, option_names, default_op, onclick='')
{
    let label = name.length != 0 ? `<h4 class="input_label">${name}</h4>` : ''
    let options = ''
    option_names.forEach(function (op_name, index)
    {
        options += `<span class="wr_select_option ${op_name == default_op ? 'selected' : ''}" id="${id}-${index}" onclick="select_option('${id}', '${index}'); ${onclick}">
                <label>${op_name}</label>
            </span>`
    })
    return `${label}<div class="wr_select" id="${id}">${options}</div>`
}

/**
 * function:    build_dropdown
 * parameters:  element id, name, option strings, default option, javascript onchange response
 * returns:     wr_dropdown as a string
 * description: Builds the HTML string of a dropdown object and its options.
 */
function build_dropdown(id, name, option_names, default_op='', onchange='', classes='')
{
    let label = name.length != 0 ? `<h4 class="input_label" id="${id}_label">${name}</h4>` : ''
    let options = ''
    option_names.forEach(function (op_name, index)
    {
        options += build_dropdown_op(op_name, default_op)
    })
    return `${label}<select class="wr_dropdown ${classes}" id="${id}" onchange="${onchange}">${options}</select>`
}

/**
 * function:    build_dropdown_op
 * parameters:  name, default option
 * returns:     wr_dropdown_op as a string
 * description: Builds the HTML string of a dropdown option object.
 */
function build_dropdown_op(op_name, default_op='')
{
    return `<option class="wr_dropdown_op" value="${op_name}" ${op_name == default_op ? 'selected' : ''}>${op_name}</option>`
}

/**
 * function:    build_str_entry
 * parameters:  element id, name, default value, input box type, on text change function
 * returns:     wr_string as a string
 * description: Builds the HTML string of a string object.
 */
function build_str_entry(id, name, value='', type='text', on_text_change='')
{
    let label = name.length > 0 ? `<h4 class="input_label" id="${id}_label">${name}</h4>` : ''
    return `${label}<input class="wr_string" type="${type}" id="${id}" value="${value}" onKeyUp="${on_text_change}">`
}

/**
 * function:    build_color_entry
 * parameters:  element id, name, default color
 * returns:     wr_color as a string
 * description: Builds the HTML string of a color object.
 */
function build_color_entry(id, name, color='')
{
    let label = name.length > 0 ? `<h4 class="input_label" id="${id}_label">${name}</h4>` : ''
    return `${label}<div class="wr_color"><input class="color_text" type="text" id="${id}" value="${color}" onKeyUp="update_color('${id}')"><span class="color_box" id="${id}_color" style="background-color: ${color}"></span></div>`
}

/**
 * function:    build_status_tile
 * parameters:  element id, name, default color
 * returns:     wr_color as a string
 * description: Builds the HTML string of a color object.
 */
function build_status_tile(id, name, color='')
{
    return `<div class="wr_status"><label class="status_text">${name}</label><span class="color_box" id="${id}" style="background-color: ${color}"></span></div>`
}

/**
 * function:    build_num_entry
 * parameters:  element id, name, default value, optional limits as [min, max], on text change function
 * returns:     wr_string for a number as a string
 * description: Builds the HTML string of a number object.
 */
function build_num_entry(id, name, value='', bounds=[], on_text_change='')
{
    let label = name.length > 0 ? `<h4 class="input_label" id="${id}_label">${name}</h4>` : ''
    let bounds_str = `${bounds.length > 0 ? `min="${bounds[0]}"` : ''} ${bounds.length > 1 ? `max="${bounds[1]}"` : ''}`
    return `${label}<input class="wr_string" type="number" id="${id}" value="${value}" onKeyUp="${on_text_change}" ${bounds_str}>`
}

/**
 * function:    build_text_entry
 * parameters:  element id, name, default value
 * returns:     wr_text as a string
 * description: Builds the HTML string of a text object.
 */
function build_text_entry(id, name, value='')
{
    let label = name.length > 0 ? `<h4 class="input_label">${name}</h4>` : ''
    return `${label}<textarea class="wr_text" id="${id}">${value}</textarea>`
}

/**
 * function:    build_slider
 * parameters:  element id, name, min value, max value, increment, starting value
 * returns:     wr_slider as a string
 * description: Builds the HTML string of a slider object.
 */
function build_slider(id, name, min, max, incr, start, oninput='')
{
    let label = name.length > 0 ? `<h4 class="input_label">${name} - <span id="${id}_value">${start}</span></h4>` : ''
    return `${label}<div id="${id}_container" class="wr_slider"><input type="range" min="${min}" max="${max}" step="${incr}" value="${start}" id="${id}" class="wr_slider_range" oninput="update_slider_text('${id}'); ${oninput}"></div>`
}

/**
 * function:    build_card
 * parameters:  element id, contents
 * returns:     wr_card as a string
 * description: Builds the HTML string of a card object.
 */
function build_card(id, contents='', limitWidth=false)
{
    return `<div class="wr_card" id="${id}"${limitWidth ? ' style="width: calc(var(--input-width) - 2*var(--input-padding));"' : ''}>${contents}</div><br>`
}

/**
 * function:    build_match_option
 * parameters:  match id, list of red teams, list of blue teams, selected class string, match name
 * returns:     match option as a string
 * description: Builds the HTML string of a match option object.
 */
function build_match_option(match_id, red_teams, blue_teams, selected='', match_name='')
{
    if (!match_name)
    {
        match_name = `Q${match_id}`
    }
    let red_str = red_teams.join(' ').replace(/frc/g, '')
    let blue_str = blue_teams.join(' ').replace(/frc/g, '')
    return `<div id="match_${match_id}" class="match_option ${selected}" onclick="open_match('${match_id}')">
                <span class="option_number">${match_name}</span>
                <span>
                    <div class="alliance red">${red_str}</div>
                    <div class="alliance blue">${blue_str}</div>
                </span>
            </div>`
}

/**
 * function:    build_option
 * parameters:  option id, selected class string, option name
 * returns:     option as a string
 * description: Builds the HTML string of a option object.
 */
function build_option(option_id, selected='', option_name='', style='', primary_list=true)
{
    if (!option_name)
    {
        option_name = option_id
    }
    // use modified id and function if secondary list
    let id = `option_${option_id}`
    let on_click = `open_option('${option_id}')`
    if (!primary_list)
    {
        id = `soption_${option_id}`
        on_click = `open_secondary_option('${option_id}')`
    }
    return `<div id="${id}" class="pit_option ${selected}" onclick="${on_click}" style="${style}">
                <span class="long_option_number">${option_name}</span>
            </div>`
}

var last_touch = 0

/**
 * function:    check
 * parameters:  ID of checkbox button
 * returns:     none
 * description: Toggles a checkbox when clicked on.
 */
function check(id)
{
    let checked = !document.getElementById(id).checked
    document.getElementById(id).checked = checked
    if (checked)
    {
        document.getElementById(`${id}-container`).classList.add('selected')
    }
    else
    {
        document.getElementById(`${id}-container`).classList.remove('selected')
    }
}

/**
 * function:    touch_button
 * parameters:  secondary click function
 * returns:     none
 * description: Respond to touch screen event on button.
 */
function touch_button(secondary)
{
    if (secondary !== false)
    {
        if (Date.now() - last_touch > 500)
        {
            eval(secondary)
        }
    }
    else
    {
        last_touch = Date.now()
    }
}

/**
 * function:    increment
 * parameters:  ID of counter button, whether it was a right click
 * returns:     none
 * description: Increases the value of the counter on click, descreases on right.
 */
function increment(id, right, onincrement='')
{
    let current = document.getElementById(id).innerHTML
    let modifier = right ? -1 : 1
    if (current > 0 || modifier > 0)
    {
        document.getElementById(id).innerHTML = parseInt(current) + modifier
    }
    if (onincrement)
    {
        eval(onincrement)
    }
}

/**
 * function:    get_selected_option
 * parameters:  ID of selected item
 * returns:     index of selected option
 * description: Returns the selected index of the given select.
 */
function get_selected_option(id)
{
    let children = document.getElementById(id).getElementsByClassName('wr_select_option')
    let i = 0
    for (let option of children)
    {
        if (option.classList.contains('selected'))
        {
            return i
        }
        ++i
    }
    return -1
}

/**
 * function:    select_option
 * parameters:  ID of the selector, index of the newly selected option
 * returns:     none
 * description: Select a given option in a selector.
 */
function select_option(id, index)
{
    let children = document.getElementById(id).getElementsByClassName('wr_select_option')
    for (let option of children)
    {
        option.classList.remove('selected')
    }
    document.getElementById(`${id}-${index}`).classList.add('selected')
}

/**
 * function:    update_color
 * parameters:  element id
 * returns:     none
 * description: Updates the color box base on color text.
 */
function update_color(id)
{
    let color = document.getElementById(id).value
    if (color.startsWith('#') && color.length == 7)
    {
        document.getElementById(`${id}_color`).style.backgroundColor = color
    }
}

/**
 * function:    set_status
 * parameters:  element id, boolean status
 * returns:     none
 * description: Updates the color box with the provided color.
 */
function set_status(id, status)
{
    document.getElementById(id).style.backgroundColor = status ? 'green' : 'red'
}

/**
 * function:    set_slider
 * parameters:  slider id, value
 * returns:     none
 * description: Set the text and position of a slider.
 */
function set_slider(id, value)
{
    document.getElementById(id).value = value
    update_slider_text(id)
}

/**
 * function:    update_slider_text
 * parameters:  slider id
 * returns:     none
 * description: Update the text for a slider.
 */
function update_slider_text(id)
{
    document.getElementById(`${id}_value`).innerHTML = document.getElementById(id).value
}

/**
 * function:    set_slider_max
 * parameters:  slider id, max
 * returns:     none
 * description: Set the maximum value of a slider.
 */
function set_slider_max(id, max)
{
    document.getElementById(id).max = max
}