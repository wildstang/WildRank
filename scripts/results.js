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

const CONTENTS = "<div id=\"result_title\"><img id=\"avatar\"> <h2 id=\"result_name\"></h2></div><table id=\"results_tab\"></table>"
const BUTTON = ""

var teams

var results = {}

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

    let parts = name.split("-")
    let team = parseInt(parts[parts.length - 1])
    document.getElementById("avatar").src = get_avatar(team, event_id.substr(0, 4))
    document.getElementById("result_name").innerHTML = team + " " + get_team_name(team, event_id)

    let table = "<tr><th>Entry</th>"
    scouter_results = get_scouter_results(results, results[name]["meta_scouter_id"])
    if (name.startsWith("match"))
    {
        let match = parseInt(parts[parts.length - 2])
        document.getElementById("result_name").innerHTML += ", Match: " + match
        team_results = get_team_results(results, team)
        match_results = get_match_results(results, match)
        table += "<th>Match Value</th><th>Team Average</th><th>Match Average</th>"
    }
    else
    {
        table += "<th>Value</th>"
    }
    table += "<th>Event Average</th><th>Scouter Average</th></tr>\
              <tr><th>Total Results</th><td>1</td>"

    if (name.startsWith("match"))
    {
        table += "<td>" + Object.keys(team_results).length + "</td><td>" + Object.keys(match_results).length + "</td>"
    }
    table += "<td>" + Object.keys(results).length + "</td><td>" + Object.keys(scouter_results).length + "</td></tr>"

    let result = results[name]
    let entries = Object.keys(result)
    entries.forEach(function (entry, index)
    {
        let val = result[entry]
        table += "<tr><th id=\"" + entry + "\" onclick=\"sort_results('" + entry + "'); build_result_list()\">" + get_name(entry) + "</th><td class=\"result_cell\">" + get_value(entry, val) + "</td>"
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
            return mode(values)
        // don't attempt to use strings
        case "string":
        case "text":
            return "---"
            // compute average for numbers
        case "counter":
        case "number":
        default:
            return mean(values)
    }
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
    document.getElementById("option_list").innerHTML = ""
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
        scroll_to("option_list", "result_" + first)
    }
}

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

    let num_results = Object.keys(unsorted).length
    if (num_results == 0)
    {
        return 0
    }

    // sort results
    Object.keys(unsorted).sort().forEach(function (key) {
        results[key] = unsorted[key];
    })

    return num_results
}

/**
 * function:    sort_results
 * parameters:  key name to sort by
 * returns:     none
 * description: Sorts the results by a given key.
 */
function sort_results(sort_by)
{
    let unsorted = results
    results = {}
    
    // sort by given key
    Object.keys(unsorted).sort(function (a, b) {
        return unsorted[b][sort_by] < unsorted[a][sort_by] ? -1
                : unsorted[b][sort_by] > unsorted[a][sort_by] ? 1
                : 0
    }).forEach(function (key) {
        results[key] = unsorted[key]
    })
}

// read parameters from URL
const type = get_parameter(TYPE_COOKIE, TYPE_DEFAULT)
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const prefix = type + "-" + event_id + "-"
var urlParams = new URLSearchParams(window.location.search)
const selected = urlParams.get("file")

// when the page is finished loading
window.addEventListener('load', function() {
    load_config(type)
    if (collect_results() > 0)
    {
        document.getElementById("preview").innerHTML = document.getElementById("preview").innerHTML.replace(/CONTENTS/g, CONTENTS)
        document.getElementById("preview").innerHTML = document.getElementById("preview").innerHTML.replace(/BUTTONS/g, BUTTON)
        build_result_list()
    }
    else
    {
        document.getElementById("preview").innerHTML = document.getElementById("preview").innerHTML.replace(/CONTENTS/g, "<h2>No Results Found</h2>")
        document.getElementById("preview").innerHTML = document.getElementById("preview").innerHTML.replace(/BUTTONS/g, "")
    }
})