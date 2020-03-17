/**
 * file:        inputs.js
 * description: Contains functions and HTML string for the various inputs of the web app.
 * author:      Liam Fruzyna
 * date:        2020-03-05
 */

// HTML template for a scouting page
const PAGE_FRAME = "\
    <div class=\"page\">\
        <h2 class=\"page_header\">NAME</h2>\
        COLUMNS\
    </div>"

// HTML template for a page column
const COLUMN_FRAME = "\
    <div class=\"column\">\
        <h3 class=\"column_header\">NAME</h3>\
        ITEMS\
    </div>"

// HTML template for a button
const BUTTON = "\
    <div class=\"wr_button\" onclick=\"ONCLICK\">\
        <label id=\"ID\">NAME</label>\
    </div>"

// HTML template for a checkbox
const CHECKBOX = "\
    <div class=\"wr_checkbox\" id=\"ID-container\" onclick=\"check('ID')\">\
        <input type=\"checkbox\" onclick=\"check('ID')\" id=\"ID\" name=\"ID\" CHECKED>\
        <label for=\"ID\" onclick=\"check('ID')\">NAME</label>\
    </div>"

// HTML template for a counter button
const COUNTER = "\
    <div class=\"wr_counter\" onclick=\"increment('ID', false)\" oncontextmenu=\"increment('ID', true); return false\">\
        <label class=\"wr_counter_count\" id=\"ID\">VALUE</label>\
        <label>NAME</label>\
    </div>"

// HTML template for a selection button
const SELECT = "\
    <h4 class=\"input_label\">NAME</h4>\
    <div class=\"wr_select\" id=\"ID\">\
        OPTIONS\
    </div>"

// HTML template for a selection option
const SELECT_OP = "\
    <span class=\"wr_select_option\" id=\"ID-INDEX\" onclick=\"select_option('ID', 'INDEX')\">\
        <label>NAME</label>\
    </span>"

// HTML template for a dropdown selector
const DROPDOWN = "\
    <h4 class=\"input_label\">NAME</h4>\
    <select class=\"wr_dropdown\" id=\"ID\">\
        OPTIONS\
    </select>"
    
// HTML template for a dropdown option
const DROPDOWN_OP = "<option class=\"wr_dropdown_op\" value=\"NAME\" SELECTED>NAME</option>"

// HTML template for a string textbox
const STR_ENTRY = "<h4 class=\"input_label\">NAME</h4>\
                   <input class=\"wr_string\" type=\"text\" id=\"ID\" value=\"VALUE\"><br>"

// HTML template for a number textbox
const NUM_ENTRY = "<h4 class=\"input_label\">NAME</h4>\
                   <input class=\"wr_number\" type=\"number\" id=\"ID\" value=\"VALUE\" BOUNDS><br>"

// HTML template for a text textbox
const TEXT_ENTRY = "<h4 class=\"input_label\">NAME</h4>\
                    <textarea class=\"wr_text\" id=\"ID\">VALUE</textarea><br>"

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