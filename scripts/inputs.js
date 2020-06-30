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
function build_page_frame(page_name, columns, top_margin=true)
{
    let header = page_name.length > 0 ? `<h2 class="page_header">${page_name}</h2>` : ''
    return `<div class="page ${top_margin ? '' : 'no_top_margin'}">
            ${header}
            ${columns.join('')}
        </div>`
}

/**
 * function:    build_column_frame
 * parameters:  column name, array of items as strings
 * returns:     column object as a string
 * description: Builds the HTML string of a column object given its name and items.
 */
function build_column_frame(column_name, items)
{
    let header = column_name.length > 0 ? `<h2 class="column_header">${column_name}</h2>` : ''
    return `<div class="column">
            ${header}
            ${items.join('')}
        </div>`
}

/**
 * function:    build_button
 * parameters:  element id, name, javascript onclick response
 * returns:     wr_button as a string
 * description: Builds the HTML string of a button object.
 */
function build_button(id, name, onclick, onsecondary='')
{
    let oncontextmenu = onsecondary.length > 0 ? onsecondary + '; return false' : ''
    onsecondary = onsecondary.replace(/'/g, '\\\'')
    return `<div id="${id}-container" class="wr_button" onclick="${onclick}" oncontextmenu="${oncontextmenu}" onauxclick="${oncontextmenu}" ontouchstart="${touch_button(false)}" ontouchend="${touch_button(onsecondary)}">
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
 * parameters:  element id, name, default value
 * returns:     wr_counter as a string
 * description: Builds the HTML string of a counter object.
 */
function build_counter(id, name, value)
{
    return `<div class="wr_counter" onclick="increment('${id}', false)" oncontextmenu="increment('${id}', true); return false" ontouchstart="touch_button(false)" ontouchend="touch_button('increment(\\'${id}\\', true)')\">
            <label class="wr_counter_count" id="${id}">${value}</label>
            <label>${name}</label>
        </div>`
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
function build_dropdown(id, name, option_names, default_op='', onchange='')
{
    let label = name.length != 0 ? `<h4 class="input_label">${name}</h4>` : ''
    let options = ''
    option_names.forEach(function (op_name, index)
    {
        options += `<option class="wr_dropdown_op" value="${op_name}" ${op_name == default_op ? 'selected' : ''}>${op_name}</option>`
    })
    return `${label}<select class="wr_dropdown" id="${id}" onchange="${onchange}">${options}</select>`
}

/**
 * function:    build_str_entry
 * parameters:  element id, name, default value, input box type, on text change function
 * returns:     wr_string as a string
 * description: Builds the HTML string of a string object.
 */
function build_str_entry(id, name, value='', type='text', on_text_change='')
{
    let label = name.length > 0 ? `<h4 class="input_label">${name}</h4>` : ''
    return `${label}<input class="wr_string" type="${type}" id="${id}" value="${value}" onKeyUp="${on_text_change}">`
}

/**
 * function:    build_num_entry
 * parameters:  element id, name, default value, optional limits as [min, max], on text change function
 * returns:     wr_string for a number as a string
 * description: Builds the HTML string of a number object.
 */
function build_num_entry(id, name, value='', bounds=[], on_text_change='')
{
    let label = name.length > 0 ? `<h4 class="input_label">${name}</h4>` : ''
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
 * function:    build_card
 * parameters:  element id, contents
 * returns:     wr_card as a string
 * description: Builds the HTML string of a card object.
 */
function build_card(id, contents='')
{
    return `<div class="wr_card" id="${id}">${contents}</div>`
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
function build_option(option_id, selected='', option_name='')
{
    if (!option_name)
    {
        option_name = option_id
    }
    return `<div id="option_${option_id}" class="pit_option ${selected}" onclick="open_option('${option_id}')">
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
function increment(id, right)
{
    let current = document.getElementById(id).innerHTML
    let modifier = right ? -1 : 1
    if (current > 0 || modifier > 0)
    {
        document.getElementById(id).innerHTML = parseInt(current) + modifier
    }
}

/**
 * function:    get_selected_option
 * parameters:  ID of selected item
 * returns:     none
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