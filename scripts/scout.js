/**
 * file:        pits.js
 * description: Contains functions for the scouting page of the web app.
 *              Primarily for building the interface from event and config data.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

// All possible input types
// TODO: implement text boxes
const valid_input_types = [
    "checkbox", // boolean checkbox
    "dropdown", // multiple dropdown options
    "select",   // multiple inline options
    "counter",  // incrementing button
    "number",   // numerical text entry
    "string",   // short text entry
    "text"      // extended text entry
]

// HTML template for a scouting page
const page_frame = "\
    <div class=\"wr_page\">\
        <h2 class=\"wr_page_header\">NAME</h2>\
        COLUMNS\
    </div>"

// HTML template for a page column
const column_frame = "\
    <div class=\"wr_column\">\
        <h3 class=\"wr_column_header\">NAME</h3>\
        ITEMS\
    </div>"

// HTML template for a button
const button = "\
    <div class=\"wr_button\" onclick=\"ONCLICK\">\
        <label id=\"ID\">NAME</label>\
    </div>"

// HTML template for a checkbox
const checkbox = "\
    <div class=\"wr_checkbox\" id=\"ID-container\" onclick=\"check('ID')\">\
        <input type=\"checkbox\" onclick=\"check('ID')\" id=\"ID\" name=\"ID\" CHECKED>\
        <label for=\"ID\" onclick=\"check('ID')\">NAME</label>\
    </div>"

// HTML template for a counter button
// TODO: implement counting down
const counter = "\
    <div class=\"wr_counter\" onclick=\"increment('ID', false)\" oncontextmenu=\"increment('ID', true); return false\">\
        <label class=\"wr_counter_count\" id=\"ID\">VALUE</label>\
        <label>NAME</label>\
    </div>"

// HTML template for a selection button
const select = "\
    <div class=\"wr_select\" id=\"ID\">\
        OPTIONS\
    </div>"

// HTML template for a selection option
const select_op = "\
    <span class=\"wr_select_option\" id=\"ID-INDEX\" onclick=\"select_option('ID', 'INDEX')\">\
        <label>NAME</label>\
    </span>"

// HTML template for a dropdown selector
const dropdown = "\
    <select class=\"wr_dropdown\" id=\"ID\">\
        OPTIONS\
    </select>"
    
// HTML template for a dropdown option
const dropdown_op = "<option class=\"wr_dropdown_op\" value=\"NAME\" SELECTED>NAME</option>"

// HTML template for a string textbox
const STR_ENTRY = "<input class=\"wr_string\" type=\"text\" id=\"ID\" value=\"VALUE\"><br>"

// HTML template for a number textbox
const NUM_ENTRY = "<input class=\"wr_number\" type=\"number\" id=\"ID\" value=\"VALUE\"><br>"

// HTML template for a text textbox
const TEXT_ENTRY = "<textarea class=\"wr_text\" id=\"ID\">VALUE</textarea><br>"

var config

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
 * function:    selectio_option
 * parameters:  ID of selection button and the selected option's index
 * returns:     none
 * description: Switches which option is selected on click.
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
    if (current > 0 || modifier > 0) {
        document.getElementById(id).innerHTML = parseInt(current) + modifier
    }
}

/** 
 * function:    build_page_from_config
 * parameters:  Mode from config to build
 * returns:     none
 * description: Builds the page from the config file and the given mode.
 */
function build_page_from_config(selected_mode)
{
    var select_ids = [];
    // iterate through each mode obj
    config.forEach(function (mode, index)
    {
        // determine if this is the desired mode
        if (mode.id == selected_mode)
        {
            // iterate through each page in the mode
            mode["pages"].forEach(function (page, index)
            {
                var page_name = page.name
                var page_id = page.id
                columns = ""
                // iterate through each column in the page
                page["columns"].forEach(function (column, index)
                {
                    var col_name = column.name
                    var col_id = column.id
                    items = ""
                    // iterate through input in the column
                    column["inputs"].forEach(function (input, index)
                    {
                        var name = input.name
                        var id = input.id
                        var type = input.type
                        var default_val = input.default

                        var item = ""
                        // build each input from its template
                        switch (type)
                        {
                            case "checkbox":
                                var checked = ""
                                if (default_val)
                                {
                                    checked = "checked"
                                    select_ids.push(id + "-container")
                                }
                                item = checkbox.replace(/CHECKED/g, checked)
                                break
                            case "counter":
                                item = counter.replace(/VALUE/g, default_val)

                                break
                            case "select":
                                options = ""
                                input["options"].forEach(function (option, index)
                                {
                                    op = select_op.replace(/NAME/g, option)
                                                  .replace(/INDEX/g, index)
                                    if (option == default_val)
                                    {
                                        select_ids.push(id + "-" + index)
                                    }
                                    options += op
                                })
                                item = select.replace(/OPTIONS/g, options)
                                break
                            case "dropdown":
                                options = ""
                                input["options"].forEach(function (option, index)
                                {
                                    var selected = ""
                                    if (option == default_val)
                                    {
                                        selected = "selected"
                                    }
                                    options += dropdown_op.replace(/NAME/g, option)
                                                            .replace(/SELECTED/g, selected)
                                })
                                item = dropdown.replace(/OPTIONS/g, options)
                                break
                            case "string":
                                item = STR_ENTRY.replace(/VALUE/g, default_val)
                                break
                            case "number":
                                item = NUM_ENTRY.replace(/VALUE/g, default_val)
                                break
                            case "text":
                                item = TEXT_ENTRY.replace(/VALUE/g, default_val)
                                break
                        }
                        items += item.replace(/ID/g, id).replace(/NAME/g, name)
                    })
                    columns += column_frame.replace(/ID/g, col_id)
                                           .replace(/NAME/g, col_name)
                                           .replace(/ITEMS/g, items)
                })
                document.body.innerHTML += page_frame.replace(/ID/g, page_id)
                                                     .replace(/NAME/g, page_name)
                                                     .replace(/COLUMNS/g, columns)
            })
        }
    })
    // replace placeholders in template and add to screen
    document.body.innerHTML += button.replace(/ID/g, "submit_" + selected_mode)
                                     .replace(/NAME/g, "Submit")
                                     .replace(/ONCLICK/g, "get_results_from_page('" + selected_mode + "')")

    // mark each selected box as such
    select_ids.forEach(function (id, index)
    {
        document.getElementById(id).classList.add("selected")
    })
}

/**
 * function:    get_results_from_page
 * parameters:  Mode from config in use
 * returns:     none
 * description: Accumulates the results from page into a new object.
 */
function get_results_from_page(selected_mode)
{
    results = {}
    config.forEach(function (mode, index)
    {
        if (mode.id == selected_mode)
        {
            mode["pages"].forEach(function (page, index)
            {
                page["columns"].forEach(function (column, index)
                {
                    column["inputs"].forEach(function (input, index)
                    {
                        var id = input.id
                        var type = input.type

                        var item = ""
                        switch (type)
                        {
                            case "checkbox":
                                results[id] = document.getElementById(id).checked
                                break
                            case "counter":
                                results[id] = parseInt(document.getElementById(id).innerHTML)
                                break
                            case "select":
                                results[id] = -1
                                let children = document.getElementById(id).getElementsByClassName("wr_select_option")
                                var i = 0;
                                for (let option of children)
                                {
                                    if (option.classList.contains("selected"))
                                    {
                                        results[id] = i
                                    }
                                    i++
                                }
                                break
                            case "dropdown":
                                results[id] = document.getElementById(id).selectedIndex
                                break
                            case "string":
                            case "number":
                            case "text":
                                results[id] = document.getElementById(id).value
                                break
                        }
                    })
                })
            })
        }
    })
    let file = ["pit", event_id, team_num].join("-")
    if (scout_mode == "match")
    {
        file = ["match", event_id, match_num, team_num].join("-")
    }
    localStorage.setItem(file, JSON.stringify(results));
    window.location.href = document.referrer
}

// read parameters from URL
var urlParams = new URLSearchParams(window.location.search)
const event_id = urlParams.get('event')
const scout_pos = urlParams.get('position')
const scout_mode = urlParams.get('mode')
const match_num = urlParams.get('match')
const team_num = urlParams.get('team')
const alliance_color = urlParams.get('alliance')

// request the scouting config from the server
fetch("config/scout-config.json")
    .then(response => {
        return response.json()
    })
    .then(data => {
        // set the team number in the header
        document.getElementById("team").innerHTML = team_num
        document.getElementById("team").style.color = alliance_color

        // build the page from config for the desired mode
        config = data
        if (scout_mode == 'match')
        {
            document.getElementById("match").innerHTML = match_num
            build_page_from_config("match")
        }
        else
        {
            document.getElementById("match").innerHTML = "Pit"
            build_page_from_config("pit")
        }
    })
    .catch(err => {
        console.log("Error config file")
    })