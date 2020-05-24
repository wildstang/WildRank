/**
 * file:        sides.js
 * description: Contains functions for the side-by-side comparison page of the web app.
 *              Primarily for building the interface from results.
 * author:      Liam Fruzyna
 * date:        2020-05-24
 */

const SORT_OPTIONS = ["Mean", "Median", "Mode", "Min", "Max"]

// HTML template for a result option
const RESULT_BLOCK = "\
    <div id=\"team_NUM\" class=\"pit_option\" onclick=\"open_team('NUM')\">\
        <span class=\"long_option_number\">TEXT</span>\
    </div>"

const CONTENTS = "<h2 id=\"value\"></h2>"
const BUTTONS = '' +
    "<h4 class=\"center_text\">Sort numeric values</h4>" +
    build_select("type_form", "", SORT_OPTIONS, "Mean", "collect_results(); select()") +
    build_checkbox("scale_max", "Scale to Maximums", false, "select()") +
    "<div class=\"wr_card\"><table id=\"compare_tab\"></table></div>"

const TEAM = "<div id=\"result_title\"><img id=\"avatar\" src=\"SRCA\"> <h2 class=\"result_name\">NAMEA</h2></div>\
              vs\
              <div id=\"result_title\"><img id=\"avatar\" src=\"SRCB\"> <h2 class=\"result_name\">NAMEB</h2></div>"

const COMPARISON = '<tr><td><span style="float:left; padding-right: 16px">AVAL</span>\
                            <span style="float:right; width:AWIDTHpx; height:20px; background-color:ACOLOR"></span></td>\
                        <th>ENTRY</th>\
                        <td><span style="float:right; padding-left: 16px">BVAL</span>\
                            <span style="float:left; width:BWIDTHpx; height:20px; background-color:BCOLOR"></span></td></tr>'

var keys = {}
var teams = {}
var maxs = []
var selectedA = ''
var selectedB = ''
var selecting = 'a'

/**
 * function:    avg_results
 * parameters:  results container, column to sum, type of ordering
 * returns:     average of all results
 * description: Average all the results for a given column.
 */
function avg_results(results, key, sort_type)
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
            switch (sort_type)
            {
                // median
                case 1:
                    return median(values)
                // mode
                case 2:
                    return mode(values)
                // min
                case 3:
                    return Math.min(... values)
                // max
                case 4:
                    return Math.max(... values)
                // mean
                case 0:
                default:
                    return mean(values)
            }
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

    keys = Object.keys(unsorted[Object.keys(unsorted)[0]]).filter(key => !["string", "text", "unknown"].includes(get_type(key)))
    // calculate max for each value
    keys.forEach(function (key, index)
    {
        maxs[key] = avg_results(unsorted, key, 4)
    })
    Object.keys(teams).forEach(function (team, index)
    {
        let team_results = get_team_results(unsorted, team.substr(1))
        keys.forEach(function (key, index)
        {
            teams[team][key] = avg_results(team_results, key, get_selected_option("type_form"))
        })
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
    document.getElementById("option_list").innerHTML = build_select('selecting', '', ['Left', 'Right'], 'Left', 'switch_selecting()')
    team_nums.sort(function (a, b) { return parseInt(a.substr(1)) - parseInt(b.substr(1)) })
    team_nums.forEach(function (team, index)
    {
        document.getElementById("option_list").innerHTML += RESULT_BLOCK.replace(/NUM/g, team)
                                                                        .replace(/TEXT/g, team.substr(1))
    })
}

/**
 * function:    switch_selecting
 * parameters:  none
 * returns:     none
 * description: Changes the team to be selecting.
 */
function switch_selecting()
{
    selecting = get_selected_option("selecting") == 0 ? 'a' : 'b'
}

/**
 * function:    select
 * parameters:  none
 * returns:     none
 * description: Responds to new key being selected by updating team order.
 */
function select()
{
    build_team_list()
    open_teams(selectedA, selectedB)
}

/**
 * function:    open_team
 * parameters:  team number
 * returns:     none
 * description: Updates a selected team.
 */
function open_team(team_num)
{
    if (selecting == 'a')
    {
        selectedA = team_num
    }
    else
    {
        selectedB = team_num
    }
    
    open_teams(selectedA, selectedB)
}

/**
 * function:    num2color
 * parameters:  color number
 * returns:     The color associated with the number
 * description: Converts 1/0/-1 to Green/Blue/Red.
 */
function num2color(num)
{
    switch (num)
    {
        case 1:
            return 'green'
        case 0:
            return 'blue'
        case -1:
            return 'red'
    }
}

/**
 * function:    open_teams
 * parameters:  team numbers
 * returns:     none
 * description: Updates the selected teams.
 */
function open_teams(team_numA, team_numB)
{
    selectedA = team_numA
    team_numA = selectedA.substr(1)
    selectedB = team_numB
    team_numB = selectedB.substr(1)

    // team details
    let details = TEAM.replace(/SRCA/g, get_avatar(team_numA, event_id.substr(0,4)))
                      .replace(/NAMEA/g, team_numA + " " + get_team_name(team_numA, event_id))
                      .replace(/SRCB/g, get_avatar(team_numB, event_id.substr(0,4)))
                      .replace(/NAMEB/g, team_numB + " " + get_team_name(team_numB, event_id))

    document.getElementById("value").innerHTML = details

    let compare = `<tr><th>${team_numA}</th><th></th><th>${team_numB}</th></tr>`
    keys.forEach(function (key, index)
    {
        let aVal = get_value(key, teams[selectedA][key])
        let bVal = get_value(key, teams[selectedB][key])
        let aColor = 0
        let bColor = 0
        let aWidth = 250
        let bWidth = 250
        let type = get_type(key)

        if (typeof teams[selectedA][key] == 'number' && type != 'select' && type != 'dropdown')
        {
            // color and scale bars according to proportion
            if (aVal > bVal)
            {
                aColor = 1
                bColor = -1
                bWidth *= bVal / aVal
            }
            else if (aVal < bVal)
            {
                aColor = -1
                bColor = 1
                aWidth *= aVal / bVal
            }
            else if (aVal == 0)
            {
                // if both values are 0, make bars short
                aWidth *= 0.1
                bWidth *= 0.1
            }

            if (document.getElementById('scale_max').checked)
            {
                // override scaling if there is a known maximum
                let options = get_options(key)
                if (typeof options !== 'undefined' && options.length == 2)
                {
                    scale_to = options[2]
                }
                else
                {
                    scale_to = maxs[key]
                }
                aWidth = 250 * (teams[selectedA][key] / scale_to)
                bWidth = 250 * (teams[selectedB][key] / scale_to)
            }
        }
        else if (typeof teams[selectedA][key] == 'boolean')
        {
            // colors Yes green and No red
            aColor = aVal == 'Yes' ? 1 : -1
            bColor = bVal == 'Yes' ? 1 : -1
        }
        // no bars for dropdowns
        else
        {
            aWidth = 0
            bWidth = 0
        }

        // invert colors if attribute is negativve
        if (is_negative(key))
        {
            aColor *= -1
            bColor *= -1
        }
        
        compare += COMPARISON.replace(/ENTRY/g, get_name(key))
                             .replace(/AVAL/g, aVal)
                             .replace(/AWIDTH/g, aWidth)
                             .replace(/ACOLOR/g, num2color(aColor))
                             .replace(/BVAL/g, bVal)
                             .replace(/BWIDTH/g, bWidth)
                             .replace(/BCOLOR/g, num2color(bColor))
    })

    document.getElementById("compare_tab").innerHTML = compare

    // select team on left
    Object.keys(teams).forEach(function (team, index)
    {
        if (document.getElementById("team_" + team).classList.contains("selected"))
        {
            document.getElementById("team_" + team).classList.remove("selected")
        }
    })
    document.getElementById("team_" + selectedA).classList.add("selected")
    document.getElementById("team_" + selectedB).classList.add("selected")
}

// read parameters from URL
const type = get_parameter(TYPE_COOKIE, TYPE_DEFAULT)
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const prefix = type + "-" + event_id + "-"

// when the page is finished loading
window.addEventListener('load', function() {
    load_config(type)
    let preview = document.getElementById("preview")
    preview.innerHTML = preview.innerHTML.replace(/BUTTONS/g, BUTTONS)

    if (collect_results() > 0)
    {
        preview.innerHTML = preview.innerHTML.replace(/CONTENTS/g, CONTENTS)
        selectedA = Object.keys(teams)[0]
        selectedB = Object.keys(teams)[1]
        select()
    }
    else
    {
        preview.innerHTML = preview.replace(/CONTENTS/g, "<h2>No Results Found</h2>")
                                   .replace(/BUTTONS/g, "")
    }
})