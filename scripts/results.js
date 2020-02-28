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

var teams;

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

    let table = "<table><tr><th>Entry</th>"
    if (name.startsWith("match"))
    {
        let parts = name.split("-")
        let team = parseInt(parts[parts.length - 1])
        let match = parseInt(parts[parts.length - 2])
        team_results = get_team_results(team)
        match_results = get_match_results(match)
        table += "<th>Match Value</th><th>Team Average</th><th>Match Average</th><th>Event Average</th>"
    }
    else
    {
        table += "<th>Value</th>"
    }
    table += "</tr>"

    let result = results[name]
    let names = Object.keys(result)
    names.forEach(function (name, index)
    {
        table += "<tr><th>" + name + "</th><td>" + result[name] + "</td>"
        if (typeof team_results !== 'undefined')
        {
            table += "<td>" + avg_results(team_results, name).toFixed(2) + "</td>"
        }
        if (typeof match_results !== 'undefined')
        {
            table += "<td>" + avg_results(match_results, name).toFixed(2) + "</td>"
        }
        if (name.startsWith("match"))
        {
            table += "<td>" + avg_results(results, name).toFixed(2) + "</td>"
        }
        table += "</tr>"
    })
    table += "</table>"
    document.getElementById("results").innerHTML = table
}

/**
 * function:    avg_results
 * parameter:   results container, column to sum
 * returns:     average of all results
 * description: Average all the results for a given column.
 */
function avg_results(results, column)
{
    let sum = 0
    let names = Object.keys(results)
    names.forEach(function (name, index)
    {
        let value = results[name][column]
        if (typeof value === 'boolean')
        {
            if (value)
            {
                ++sum
            }
        }
        else if (typeof value === 'number')
        {
            sum += value
        }
        else
        {
            ++sum
        }
    })
    return sum / names.length
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
    open_result(first)
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
    let files = Object.keys(localStorage)
    files.forEach(function (file, index)
    {
        // determine files which start with the desired type
        if (file.startsWith(prefix))
        {
            results[file] = JSON.parse(localStorage.getItem(file))
        }
    })
    build_result_list()
}

// read parameters from URL
var urlParams = new URLSearchParams(window.location.search)
const event_id = urlParams.get('event')
const type = urlParams.get('type')
const prefix = type + "-" + event_id + "-"

// load event data on page load
window.addEventListener('load', collect_results)