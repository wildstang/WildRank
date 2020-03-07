/**
 * file:        pits.js
 * description: Contains functions for the scouting page of the web app.
 *              Primarily for building the interface from event and config data.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

const start = Date.now()
var config

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
                                if (Object.keys(input).includes("options") && input.options.length == 2)
                                {
                                    item = item.replace(/BOUNDS/g, "min=\"" + input.options[0] + "\" max=\"" + input.options[1] + "\"")
                                }
                                else
                                {
                                    item = item.replace(/BOUNDS/g, "")
                                }
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
    results["meta_scouting_duration"] = (Date.now() - start) / 1000
    results["meta_scouter_id"] = parseInt(user_id)
    results["meta_scout_mode"] = selected_mode
    if (selected_mode == "match")
    {
        results["meta_match"] = parseInt(match_num)
        results["meta_position"] = parseInt(scout_pos)
    }
    results["meta_team"] = parseInt(team_num)
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
                            case "number":
                                results[id] = parseInt(document.getElementById(id).value)
                                break
                            case "string":
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
const scout_pos = get_parameter(POSITION_COOKIE, POSITION_DEFAULT)
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)
const scout_mode = get_parameter(TYPE_COOKIE, TYPE_DEFAULT)

var urlParams = new URLSearchParams(window.location.search)
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