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

const checkbox = "\
    <div class=\"wr_checkbox\" id=\"ID-container\" onclick=\"check('ID')\">\
        <input type=\"checkbox\" onclick=\"check('ID')\" id=\"ID\" name=\"ID\">\
        <label for=\"ID\" onclick=\"check('ID')\">NAME</label>\
    </div>"

const counter = "\
    <div class=\"wr_counter\" onclick=\"increment('ID')\">\
        <label class=\"wr_counter_count\" id=\"ID\">0</label>\
        <label>NAME</label>\
    </div>"

const select = "\
    <div class=\"wr_select\" id=\"ID\">\
        OPTIONS\
    </div>"

const select_op = "\
    <span class=\"wr_select_option\" id=\"ID-NAME\" onclick=\"select_option('ID', 'NAME')\">\
        <label>NAME</label>\
    </span>"

const dropdown = "\
    <div class=\"wr_dropdown\">\
        <select id=\"ID\">\
            OPTIONS\
        </select>\
    </div>"

const dropdown_op = "<option value=\"NAME\">NAME</option>"

function check(id)
{
    let checked = !document.getElementById(id).checked
    document.getElementById(id).checked = checked
    if (checked)
    {
        document.getElementById(id + "-container").style.backgroundColor = "blue"
    }
    else
    {
        document.getElementById(id + "-container").style.backgroundColor = "white"
    }
}

function select_option(id, name)
{
    let children = document.getElementById(id).getElementsByClassName("wr_select_option")
    for (let option of children)
    {
        option.style.backgroundColor = "white"
    }
    document.getElementById(id + "-" + name).style.backgroundColor = "blue"
}

function increment(id)
{
    let current = document.getElementById(id).innerHTML
    document.getElementById(id).innerHTML = parseInt(current) + 1
}

function build_config(config)
{
    config[1]["pages"][1]["columns"].forEach(function (column, index)
    {
        var col_name = column.name
        var col_id = column.id
        document.body.innerHTML += "<h3 id=\"" + col_id + "\">" + col_name + "</h3>"
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
                    item = checkbox
                    break
                case "counter":
                    item = counter
                    break
                case "select":
                    options = ""
                    input["options"].forEach(function (option, index)
                    {
                        options += select_op.replace(/NAME/g, option)
                    })
                    item = select.replace(/OPTIONS/g, options)
                    break
                case "dropdown":
                    options = ""
                    input["options"].forEach(function (option, index)
                    {
                        options += dropdown_op.replace(/NAME/g, option)
                    })
                    item = dropdown.replace(/OPTIONS/g, options)
                    break
            }
            item = item.replace(/ID/g, id).replace(/NAME/g, name)
            document.body.innerHTML += item
            console.log("Found " + type + " " + id + " called " + name)
        })
    })
}

fetch("default-config.json")
    .then(response => {
        return response.json()
    })
    .then(data => {
        var config = data
        build_config(config)
    })
    .catch(err => {
        console.log("Error config file")
    })