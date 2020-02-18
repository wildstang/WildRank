/**
 * wildrank.js
 * Builds the match UI and manages inputs.
 */

const valid_input_types = [
    "checkbox", // boolean checkbox
    "dropdown", // multiple dropdown options
    "select",   // multiple inline options
    "counter",  // incrementing button
    "number",   // numerical text entry
    "string",   // short text entry
    "text"      // extended text entry
]

const page_frame = "\
    <div class=\"wr_page\">\
        <h2>NAME</h3>\
        COLUMNS\
    </div>"

const column_frame = "\
    <div class=\"wr_column\">\
        <h3>NAME</h3>\
        ITEMS\
    </div>"

const button = "\
    <div class=\"wr_button\" onclick=\"ONCLICK\">\
        <label id=\"ID\">NAME</label>\
    </div>"

const checkbox = "\
    <div class=\"wr_checkbox\" id=\"ID-container\" onclick=\"check('ID')\">\
        <input type=\"checkbox\" onclick=\"check('ID')\" id=\"ID\" name=\"ID\" CHECKED>\
        <label for=\"ID\" onclick=\"check('ID')\">NAME</label>\
    </div>"

const counter = "\
    <div class=\"wr_counter\" onclick=\"increment('ID')\">\
        <label class=\"wr_counter_count\" id=\"ID\">VALUE</label>\
        <label>NAME</label>\
    </div>"

const select = "\
    <div class=\"wr_select\" id=\"ID\">\
        OPTIONS\
    </div>"

const select_op = "\
    <span class=\"wr_select_option\" id=\"ID-INDEX\" onclick=\"select_option('ID', 'INDEX')\">\
        <label>NAME</label>\
    </span>"

const dropdown = "\
    <div class=\"wr_dropdown\">\
        <select id=\"ID\">\
            OPTIONS\
        </select>\
    </div>"

const dropdown_op = "<option value=\"NAME\" SELECTED>NAME</option>"

var config

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

function select_option(id, index)
{
    let children = document.getElementById(id).getElementsByClassName("wr_select_option")
    for (let option of children)
    {
        option.classList.remove("selected")
    }
    document.getElementById(id + "-" + index).classList.add("selected")
}

function increment(id)
{
    let current = document.getElementById(id).innerHTML
    document.getElementById(id).innerHTML = parseInt(current) + 1
}

function build_page_from_config(config, selected_mode)
{
    var select_ids = [];
    config.forEach(function (mode, index)
    {
        if (mode.id == selected_mode)
        {
            mode["pages"].forEach(function (page, index)
            {
                var page_name = page.name
                var page_id = page.id
                columns = ""
                page["columns"].forEach(function (column, index)
                {
                    var col_name = column.name
                    var col_id = column.id
                    items = ""
                    column["inputs"].forEach(function (input, index)
                    {
                        var name = input.name
                        var id = input.id
                        var type = input.type
                        var default_val = input.default

                        var item = ""
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
                                    op = select_op.replace(/NAME/g, option).replace(/INDEX/g, index)
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
                                    options += dropdown_op.replace(/NAME/g, option).replace(/SELECTED/g, selected)
                                })
                                item = dropdown.replace(/OPTIONS/g, options)
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
    document.body.innerHTML += button.replace(/ID/g, "submit_" + selected_mode).replace(/NAME/g, "Submit").replace(/ONCLICK/g, "get_results_from_page('" + selected_mode + "')")

    select_ids.forEach(function (id, index)
    {
        document.getElementById(id).classList.add("selected")
    })
}

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
                        }
                    })
                })
            })
        }
    })
    let file = scout_mode + '-' + team_num
    if (scout_mode == 'match')
    {
        file = scout_mode + '-' + match_num + '-' + team_num
    }
    localStorage.setItem(file, JSON.stringify(results));
    window.history.back()
}

var urlParams = new URLSearchParams(window.location.search)
const scout_mode = urlParams.get('mode')
const match_num = urlParams.get('match')
const team_num = urlParams.get('team')
const alliance_color = urlParams.get('alliance')

fetch("config/scout-config.json")
    .then(response => {
        return response.json()
    })
    .then(data => {
        document.getElementById("team").innerHTML = team_num
        document.getElementById("team").style.color = alliance_color

        config = data
        if (scout_mode == 'match')
        {
            document.getElementById("match").innerHTML = match_num
            build_page_from_config(config, "match")
        }
        else
        {
            document.getElementById("match").innerHTML = "Pit"
            build_page_from_config(config, "pit")
        }
    })
    .catch(err => {
        console.log("Error config file")
    })