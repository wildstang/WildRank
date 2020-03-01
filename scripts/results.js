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
    if (name.startsWith("match"))
    {
        let parts = name.split("-")
        let team = parseInt(parts[parts.length - 1])
        let match = parseInt(parts[parts.length - 2])
        team_results = get_team_results(team)
        match_results = get_match_results(match)
        scouter_results = get_scouter_results(results[name]["meta_scouter_id"])
        table += "<th>Match Value</th><th>Team Average</th><th>Match Average</th><th>Event Average</th><th>Scouter Average</th>"
    }
    else
    {
        table += "<th>Value</th>"
    }
    table += "</tr>"

    let result = results[name]
    let entries = Object.keys(result)
    entries.forEach(function (entry, index)
    {
        let val = result[entry]
        table += "<tr><th id=\"" + entry + "\">" + entry + "</th><td>" + val + "</td>"
        if (typeof team_results !== 'undefined')
        {
            table += make_cell(team_results, entry, val)
        }
        if (typeof match_results !== 'undefined')
        {
            table += make_cell(match_results, entry, val)
        }
        if (name.startsWith("match"))
        {
            table += make_cell(results, entry, val)
        }
        if (typeof scouter_results !== 'undefined')
        {
            table += make_cell(scouter_results, entry, val)
        }
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
    let val = avg_results(results, entry)
    let delta = base - val
    let prop = Math.abs(delta / base)
    let color = ""
    if (delta > 0.01)
    {
        color = "rgba(0,255,0," + prop + ")"
    }
    else if (delta < -0.01)
    {
        color = "rgba(255,0,0," + prop + ")"
    }
    return "<td style=\"background-color: " + color + "\">" + val.toFixed(2) + "</td>"
}

/**
 * function:    avg_results
 * parameters:  results container, column to sum
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
        else if (typeof value === 'string')
        {
            sum += value.length
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

// read parameters from URL
var urlParams = new URLSearchParams(window.location.search)
const event_id = urlParams.get('event')
const type = urlParams.get('type')
const prefix = type + "-" + event_id + "-"
const selected = urlParams.get('file')

// load event data on page load
window.addEventListener('load', collect_results)