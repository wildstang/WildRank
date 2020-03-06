/**
 * file:        results.js
 * description: Contains functions for the result selection page of the web app.
 *              Primarily for building the interface from results.
 * author:      Liam Fruzyna
 * date:        2020-02-26
 */

// HTML template for a result option
const RESULT_BLOCK = "\
    <div id=\"result_NAME\" class=\"pit_option\" onclick=\"open_result('NAME')\">\
        <span class=\"long_option_number\">TEXT</span>\
    </div>"

var teams
var config

/**
 * function:    open_result
 * parameters:  Selected result name
 * returns:     none
 * description: Completes right info pane for a given result.
 */
function open_result(name)
{
    document.getElementById("result_" + name).classList.add("selected")
    let files = Object.keys(results)
    files.forEach(function (file, index)
    {
        // determine files which start with the desired type
        if (file.startsWith(prefix) && file != name && document.getElementById("result_" + file).classList.contains("selected"))
        {
            document.getElementById("result_" + file).classList.remove("selected")
        }
    })

    let table = "<tr><th>Entry</th>"
    scouter_results = get_scouter_results(results[name]["meta_scouter_id"])
    if (name.startsWith("match"))
    {
        let parts = name.split("-")
        let team = parseInt(parts[parts.length - 1])
        let match = parseInt(parts[parts.length - 2])
        team_results = get_team_results(team)
        match_results = get_match_results(match)
        table += "<th>Match Value</th><th>Team Average</th><th>Match Average</th>"
    }
    else
    {
        table += "<th>Value</th>"
    }
    table += "<th>Event Average</th><th>Scouter Average</th></tr>"

    let result = results[name]
    let entries = Object.keys(result)
    entries.forEach(function (entry, index)
    {
        let val = result[entry]
        let type = get_type(entry)
        table += "<tr><th id=\"" + entry + "\">" + entry + "</th><td class=\"result_cell\">" + get_value(entry, val) + "</td>"
        if (typeof team_results !== 'undefined')
        {
            table += make_cell(team_results, entry, val)
        }
        if (typeof match_results !== 'undefined')
        {
            table += make_cell(match_results, entry, val)
        }
        table += make_cell(results, entry, val)
        table += make_cell(scouter_results, entry, val)
        table += "</tr>"
    })
    document.getElementById("results_tab").innerHTML = table
}

/**
 * function:    make_cell
 * parameters:  results to source from, entry to use, base value
 * returns:     formatted table cell
 * description: Produce a table cell and color appropriately.
 */
function make_cell(results, entry, base)
{
    let color = ""
    let val = avg_results(results, entry)
    if (typeof base === "number" && !entry.startsWith("meta"))
    {
        let delta = base - val
        let prop = Math.abs(delta / base)
        if (delta > 0.01)
        {
            if (val === 0)
            {
                prop = 1
            }
            color = " style=\"background-color: rgba(0,255,0," + prop + ")\""
        }
        else if (delta < -0.01)
        {
            if (base === 0)
            {
                prop = 1
            }
            color = " style=\"background-color: rgba(255,0,0," + prop + ")\""
        }
    }
    
    return "<td class=\"result_cell\"" + color + ">" + get_value(entry, val) + "</td>"
}

/**
 * function:    avg_results
 * parameters:  results container, column to sum
 * returns:     average of all results
 * description: Average all the results for a given column.
 */
function avg_results(results, key)
{
    let values = []
    Object.keys(results).forEach(function (name, index)
    {
        values.push(results[name][key])
    })
    switch (get_type(key))
    {
        // compute mode for non-numerics
        case "checkbox":
        case "select":
        case "dropdown":
        case "unknown":
            let counts = {}
            let maxVal = values[0]
            values.forEach(function (val, index)
            {
                // increase count of value if it exists already
                if (Object.keys(counts).includes(val)) counts[val]++
                // start count of value if it has not been added yet
                else counts[val] = 1

                // if this was a most frequent increase the max count
                if (counts[val] > counts[maxVal]) maxVal = val
            })
            return maxVal
        // compute average for numbers
        case "string":
        case "text":
            return "---"
        case "counter":
        case "number":
        default:
            return values.reduce((a, b) => a + b, 0) / values.length
    }
    return 0
}

/**
 * function:    get_team_results
 * parameters:  team number
 * returns:     list of results for team
 * description: Get all results for the current team.
 */
function get_team_results(team)
{
    let files = Object.keys(results)
    let team_results = {}
    files.forEach(function (file, index)
    {
        let parts = file.split("-")
        let number = parseInt(parts[parts.length - 1])
        // determine files which start with the desired type
        if (file.startsWith(prefix) && number == team)
        {
            team_results[file] = results[file]
        }
    })
    return team_results
}

/**
 * function:    get_match_results
 * parameters:  match number
 * returns:     list of results for match
 * description: Get all results for the current match.
 */
function get_match_results(match)
{
    let files = Object.keys(results)
    let match_results = {}
    files.forEach(function (file, index)
    {
        let parts = file.split("-")
        let number = parseInt(parts[parts.length - 2])
        // determine files which start with the desired type
        if (file.startsWith(prefix) && number == match)
        {
            match_results[file] = results[file]
        }
    })
    return match_results
}

/**
 * function:    get_scouter_results
 * parameters:  scouter id
 * returns:     list of results from a scouter
 * description: Get all results from the given scouter.
 */
function get_scouter_results(user)
{
    let files = Object.keys(results)
    let user_results = {}
    files.forEach(function (file, index)
    {
        let parts = file.split("-")
        let id = results[file]["meta_scouter_id"]
        // determine files which start with the desired type
        if (file.startsWith(prefix) && id == user)
        {
            user_results[file] = results[file]
        }
    })
    return user_results
}

/**
 * function:    build_team_list
 * parameters:  none
 * returns:     none
 * description: Completes left select result pane with results.
 */
function build_result_list()
{
    let files = Object.keys(results)
    let first = ""
    files.forEach(function (file, index)
    {
        // determine files which start with the desired type
        if (file.startsWith(prefix))
        {
            if (first == "")
            {
                first = file
            }
            let label = file.substr(prefix.length).replace("-", ": ")
            document.getElementById("option_list").innerHTML += RESULT_BLOCK.replace(/NAME/g, file)
                                                                            .replace(/TEXT/g, label)
        }
    })
    if (selected !== null)
    {
        first = selected
    }
    if (first != "")
    {
        open_result(first)
    }
}

var results = {}

/**
 * function:    collect_results
 * parameters:  none
 * returns:     none
 * description: Collects all desired results from file, then add to screen.
 */
function collect_results()
{
    let unsorted = {}
    let files = Object.keys(localStorage)
    files.forEach(function (file, index)
    {
        // determine files which start with the desired type
        if (file.startsWith(prefix))
        {
            unsorted[file] = JSON.parse(localStorage.getItem(file))
        }
    })

    // sort
    Object.keys(unsorted).sort().forEach(function(key) {
        results[key] = unsorted[key];
    })

    build_result_list()
}

/**
 * function:    get_type
 * parameters:  name of result
 * returns:     type of input
 * description: Determines the type of input that created the given result.
 */
function get_type(key)
{
    var type = "unknown"
    config.pages.forEach(function (page, index)
    {
        page["columns"].forEach(function (column, index)
        {
            column["inputs"].forEach(function (input, index)
            {
                if (input.id == key)
                {
                    type = input.type
                }
            })
        })
    })
    return type
}

/**
 * function:    get_value
 * parameters:  name of result, raw value stored
 * returns:     human readable result value
 * description: Translates less human readable results to more.
 */
function get_value(key, value)
{
    switch (get_type(key))
    {
        case "select":
        case "dropdown":
            let option = ""
            config.pages.forEach(function (page, index)
            {
                page["columns"].forEach(function (column, index)
                {
                    column["inputs"].forEach(function (input, index)
                    {
                        if (input.id == key)
                        {
                            option = input.options[value]
                        }
                    })
                })
            })
            return option
        case "checkbox":
            return value ? "Yes" : "No"
        case "string":
        case "text":
            return value
        case "number":
        case "counter":
        default:
            if (typeof value === "number" && !key.startsWith("meta")) return value.toFixed(2)
            else return value
    }
}

// read parameters from URL
const type = get_parameter(TYPE_COOKIE, TYPE_DEFAULT)
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const prefix = type + "-" + event_id + "-"
var urlParams = new URLSearchParams(window.location.search)
const selected = urlParams.get('file')

// get the appropriate configuration for the results
fetch("config/scout-config.json")
    .then(response => {
        return response.json()
    })
    .then(data => {
        // build the page from config for the desired mode
        data.forEach(function (mode, index)
        {
            if (mode.id == type)
            {
                config = data[index]
            }
        })
        collect_results()
    })
    .catch(err => {
        console.log("Error config file")
    })