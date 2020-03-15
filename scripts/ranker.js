/**
 * file:        ranker.js
 * description: Contains functions for the team ranking page of the web app.
 *              Primarily for building the interface from results.
 * author:      Liam Fruzyna
 * date:        2020-03-13
 */

// HTML template for a result option
const RESULT_BLOCK = "\
    <div id=\"team_NUM\" class=\"pit_option\" onclick=\"open_team('NUM')\">\
        <span class=\"long_option_number\">TEXT</span>\
    </div>"

const CONTENTS = "<h2 id=\"value\"></h2>"
const BUTTON = "\
    <h4 class=\"input_label\">NAME</h4>\
    <select class=\"wr_dropdown\" id=\"key_selector\" onchange=\"select()\">\
    </select>"
    
const DROPDOWN_OP = "<option class=\"wr_dropdown_op\" value=\"NAME\">NAME</option>"

var keys = {}
var teams = {}
var totals = []
var config
var selected = ""

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
 * parameters:  results to filter, team number
 * returns:     list of results for team
 * description: Get all results for the current team.
 */
function get_team_results(results, team)
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
 * function:    collect_results
 * parameters:  none
 * returns:     none
 * description: Collects all desired results from file, then add to screen.
 */
function collect_results()
{
    let unsorted = {}
    Object.keys(localStorage).forEach(function (file, index)
    {
        // determine files which start with the desired type
        if (file.startsWith(prefix))
        {
            let parts = file.split("-")
            let team = parts[parts.length - 1]
            if (!Object.keys(teams).includes(team))
            {
                teams["#" + team] = {}
            }
            unsorted[file] = JSON.parse(localStorage.getItem(file))
        }
    })

    let num_results = Object.keys(unsorted).length
    if (num_results == 0)
    {
        return 0
    }

    keys = Object.keys(unsorted[Object.keys(unsorted)[0]])
    Object.keys(teams).forEach(function (team, index)
    {
        let team_results = get_team_results(unsorted, team.substr(1))
        keys.forEach(function (key, index)
        {
            teams[team][key] = avg_results(team_results, key)
        })
    })
    keys.forEach(function (key, index)
    {
        totals[key] = avg_results(unsorted, key)
    })

    return num_results
}

/**
 * function:    build_team_list
 * parameters:  none
 * returns:     none
 * description: Completes left select result pane with results.
 */
function build_team_list()
{
    let team_nums = Object.keys(teams)
    document.getElementById("option_list").innerHTML = ""
    team_nums.forEach(function (team, index)
    {
        document.getElementById("option_list").innerHTML += RESULT_BLOCK.replace(/NUM/g, team)
                                                                        .replace(/TEXT/g, (index+1) + ": " + team.substr(1) + " - " + teams[team][keys[document.getElementById("key_selector").selectedIndex]])
    })
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
 * function:    get_name
 * parameters:  name of result
 * returns:     name of input
 * description: Determines the name of input that created the given result.
 */
function get_name(key)
{
    var name = key.replace(/_/g, " ")
    config.pages.forEach(function (page, index)
    {
        page["columns"].forEach(function (column, index)
        {
            column["inputs"].forEach(function (input, index)
            {
                if (input.id == key)
                {
                    name = input.name
                }
            })
        })
    })
    return name
}

/**
 * function:    sort_teams
 * parameters:  key index to sort by
 * returns:     none
 * description: Sorts the teams by a given key.
 */
function sort_teams(index)
{
    let sort_by = keys[index]
    let unsorted = teams
    teams = {}
    
    // sort by given key
    Object.keys(unsorted).sort(function (a, b) {
        return unsorted[b][sort_by] < unsorted[a][sort_by] ? -1
                : unsorted[b][sort_by] > unsorted[a][sort_by] ? 1
                : 0
    }).forEach(function (key) {
        teams[key] = unsorted[key]
    })
}

/**
 * function:    select
 * parameters:  none
 * returns:     none
 * description: Responds to new key being selected by updating team order.
 */
function select()
{
    let select = document.getElementById("key_selector")
    sort_teams(select.selectedIndex)
    document.getElementById("value").innerHTML = select.value + ": " + teams[selected][keys[select.selectedIndex]] + "<br>"
    let val = totals[keys[select.selectedIndex]]
    if (typeof val === "number")
    {
        val = val.toFixed(2)
    }
    document.getElementById("value").innerHTML += "Average: " + val
    build_team_list()
}

/**
 * function:    open_team
 * parameters:  team number
 * returns:     none
 * description: Updates the selected team.
 */
function open_team(team_num)
{
    selected = team_num
    let select = document.getElementById("key_selector")
    document.getElementById("value").innerHTML = select.value + ": " + teams[selected][keys[select.selectedIndex]] + "<br>"
    document.getElementById("value").innerHTML += "Average: " + totals[keys[select.selectedIndex]].toFixed(2)

    document.getElementById("team_" + team_num).classList.add("selected")
    Object.keys(teams).forEach(function (team, index)
    {
        if (document.getElementById("team_" + team).classList.contains("selected"))
        {
            document.getElementById("team_" + team).classList.remove("selected")
        }
    })
}

/**
 * function:    fill_dropdown
 * parameters:  none
 * returns:     none
 * description: Populates key selection dropdown with all key names.
 */
function fill_dropdown()
{
    let options = ""
    keys.forEach(function (key, index)
    {
        options += DROPDOWN_OP.replace(/NAME/g, get_name(key))
    })
    document.getElementById("key_selector").innerHTML = options
}

// read parameters from URL
const type = get_parameter(TYPE_COOKIE, TYPE_DEFAULT)
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const prefix = type + "-" + event_id + "-"

// get the appropriate configuration for the results
fetch("config/scout-config.json")
    .then(response => {
        return response.json()
    })
    .then(data => {
        data.forEach(function (mode, index)
        {
            if (mode.id == type)
            {
                config = data[index]
            }
        })

        if (collect_results() > 0)
        {
            document.getElementById("preview").innerHTML = document.getElementById("preview").innerHTML.replace(/CONTENTS/g, CONTENTS)
            document.getElementById("preview").innerHTML = document.getElementById("preview").innerHTML.replace(/BUTTONS/g, BUTTON)
            fill_dropdown()
            selected = Object.keys(teams)[0]
            select()
        }
        else
        {
            document.getElementById("preview").innerHTML = document.getElementById("preview").innerHTML.replace(/CONTENTS/g, "<h2>No Results Found</h2>")
            document.getElementById("preview").innerHTML = document.getElementById("preview").innerHTML.replace(/BUTTONS/g, "")
        }
    })
    .catch(err => {
        console.log("Error config file")
    })