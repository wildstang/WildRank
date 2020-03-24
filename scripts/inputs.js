/**
 * file:        inputs.js
 * description: Contains functions and HTML string for the various inputs of the web app.
 * author:      Liam Fruzyna
 * date:        2020-03-05
 */

/**
 * function:    build_page_frame
 * parameters:  page name, array of columns as strings
 * returns:     page object as a string
 * description: Builds the HTML string of a page object given its name and columns.
 */
function build_page_frame(page_name, columns)
{
    let html_str = "<div class=\"page\">"
    if (page_name.length > 0)
    {
        html_str += "<h2 class=\"page_header\">" + page_name + "</h2>"
    }
    html_str += columns.join("")
    html_str += "</div>"
    return html_str
}

/**
 * function:    build_column_frame
 * parameters:  column name, array of items as strings
 * returns:     column object as a string
 * description: Builds the HTML string of a column object given its name and items.
 */
function build_column_frame(column_name, items)
{
    let html_str = "<div class=\"column\">"
    if (column_name.length > 0)
    {
        html_str += "<h2 class=\"column_header\">" + column_name + "</h2>"
    }
    html_str += items.join("")
    html_str += "</div>"
    return html_str
}

/**
 * function:    build_button
 * parameters:  element id, name, javascript onclick response
 * returns:     wr_button as a string
 * description: Builds the HTML string of a button object.
 */
function build_button(id, name, onclick, onsecondary="")
{
    let oncontextmenu = ""
    if (onsecondary.length > 0)
    {
        oncontextmenu = onsecondary + "; return false"
    }
    onsecondary = onsecondary.replace(/'/g, "\\'")
    let html_str = "<div id=\"" + id + "-container\" class=\"wr_button\" onclick=\"" + onclick + "\" oncontextmenu=\"" + oncontextmenu + "\" ontouchstart=\"touch_button(false)\" ontouchend=\"touch_button('" + onsecondary + "')\">"
    html_str += "<label id=\"" + id + "\">" + name + "</label>"
    html_str += "</div>"
    return html_str
}

/**
 * function:    build_checkbox
 * parameters:  element id, name, default checked state, javascript onclick response
 * returns:     wr_checkbox as a string
 * description: Builds the HTML string of a checkbox object.
 */
function build_checkbox(id, name, checked=false, onclick="")
{
    let html_str = "<div id=\"" + id + "-container\" class=\"wr_checkbox\" onclick=\"check('" + id + "'); " + onclick + "\">"
    let checked_str = ""
    if (checked)
    {
        checked_str = " checked"
    }
    html_str += "<input type=\"checkbox\" onclick=\"check('" + id + "'); " + onclick + "\" id=\"" + id + "\" name=\"" + name + "\"" + checked_str + ">"
    html_str += "<label for=\"" + id + "\" onclick=\"check('" + id + "')\">" + name + "</label>"
    html_str += "</div>"
    return html_str
}

/**
 * function:    build_counter
 * parameters:  element id, name, default value
 * returns:     wr_counter as a string
 * description: Builds the HTML string of a counter object.
 */
function build_counter(id, name, value)
{
    let html_str = "<div class=\"wr_counter\" onclick=\"increment('" + id + "', false)\" oncontextmenu=\"increment('" + id + "', true); return false\" ontouchstart=\"touch_button(false)\" ontouchend=\"touch_button('increment(\\'" + id + "\\', true)')\">"
    html_str += "<label class=\"wr_counter_count\" id=\"" + id + "\">" + value + "</label>"
    html_str += "<label>" + name + "</label>"
    html_str += "</div>"
    return html_str
}

/**
 * function:    build_select
 * parameters:  element id, name, option strings, default option, javascript onclick response
 * returns:     wr_select as a string
 * description: Builds the HTML string of a select object and its options.
 */
function build_select(id, name, option_names, default_op, onclick="")
{
    let html_str = ""
    if (name.length != 0)
    {
        html_str + "<h4 class=\"input_label\">" + name + "</h4>"
    }
    html_str += "<div class=\"wr_select\" id=\"" + id + "\">"
    option_names.forEach(function (op_name, index)
    {
        let selected = ""
        if (op_name == default_op)
        {
            selected = " selected"
        }
        html_str += "<span class=\"wr_select_option" + selected + "\" id=\"" + id + "-" + index + "\" onclick=\"select_option('" + id + "', '" + index + "'); " + onclick + "\">"
        html_str += "<label>" + op_name + "</label>"
        html_str += "</span>"
    })
    html_str += "</div>"
    return html_str
}

/**
 * function:    build_dropdown
 * parameters:  element id, name, option strings, default option, javascript onchange response
 * returns:     wr_dropdown as a string
 * description: Builds the HTML string of a dropdown object and its options.
 */
function build_dropdown(id, name, option_names, default_op="", onchange="")
{
    let html_str = ""
    if (name.length != 0)
    {
        html_str + "<h4 class=\"input_label\">" + name + "</h4>"
    }
    html_str += "<select class=\"wr_dropdown\" id=\"" + id + "\" onchange=\"" + onchange + "\">"
    option_names.forEach(function (op_name, index)
    {
        let selected = ""
        if (op_name == default_op)
        {
            selected = " selected"
        }
        html_str += "<option class=\"wr_dropdown_op\" value=\"" + op_name + "\"" + selected + ">" + op_name + "</option>"
    })
    html_str += "</select>"
    return html_str
}

/**
 * function:    build_str_entry
 * parameters:  element id, name, default value, input box type
 * returns:     wr_string as a string
 * description: Builds the HTML string of a string object.
 */
function build_str_entry(id, name, value="", type="text")
{
    let html_str = ""
    if (name.length != 0)
    {
        html_str + "<h4 class=\"input_label\">" + name + "</h4>"
    }
    html_str += "<input class=\"wr_string\" type=\"" + type + "\" id=\"" + id + "\" value=\"" + value + "\"><br>"
    return html_str
}

/**
 * function:    build_num_entry
 * parameters:  element id, name, default value, optional limits as [min, max]
 * returns:     wr_string for a number as a string
 * description: Builds the HTML string of a number object.
 */
function build_num_entry(id, name, value="", bounds=[])
{
    let html_str = ""
    if (name.length != 0)
    {
        html_str + "<h4 class=\"input_label\">" + name + "</h4>"
    }
    let bounds_str = ""
    if (bounds.length > 0)
    {
        bounds_str = " min=\"" + bounds[0] + "\""
        if (bounds.length > 1)
        {
            bounds_str += " max=\"" + bounds[1] + "\""
        }
    }
    html_str += "<input class=\"wr_string\" type=\"number\" id=\"" + id + "\" value=\"" + value + "\"" + bounds_str + "><br>"
    return html_str
}

/**
 * function:    build_text_entry
 * parameters:  element id, name, default value
 * returns:     wr_text as a string
 * description: Builds the HTML string of a text object.
 */
function build_text_entry(id, name, value="")
{
    let html_str = ""
    if (name.length != 0)
    {
        html_str + "<h4 class=\"input_label\">" + name + "</h4>"
    }
    html_str += "<textarea class=\"wr_text\" id=\"" + id + "\">" + value + "</textarea><br>"
    return html_str
}

/**
 * function:    build_card
 * parameters:  element id, contents
 * returns:     wr_card as a string
 * description: Builds the HTML string of a card object.
 */
function build_card(id, contents="")
{
    let html_str = "<div class=\"wr_card\" id=\"" + id + "\">" + contents + "</div>"
    return html_str
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
        document.getElementById(id + "-container").classList.add("selected")
    }
    else
    {
        document.getElementById(id + "-container").classList.remove("selected")
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
    let children = document.getElementById(id).getElementsByClassName("wr_select_option")
    let i = 0
    for (let option of children)
    {
        if (option.classList.contains("selected"))
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
    let children = document.getElementById(id).getElementsByClassName("wr_select_option")
    for (let option of children)
    {
        option.classList.remove("selected")
    }
    document.getElementById(id + "-" + index).classList.add("selected")
}