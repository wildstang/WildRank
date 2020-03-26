/**
 * file:        ranker.js
 * description: Contains functions for the team ranking page of the web app.
 *              Primarily for building the interface from results.
 * author:      Liam Fruzyna
 * date:        2020-03-13
 */

const SORT_OPTIONS = ["Mean", "Median", "Mode", "Min", "Max"]

// HTML template for a result option
const RESULT_BLOCK = "\
    <div id=\"team_NUM\" class=\"pit_option\" onclick=\"open_team('NUM')\">\
        <span class=\"long_option_number\">TEXT</span>\
    </div>"

const CONTENTS = "<h2 id=\"value\"></h2>"
const BUTTONS = "\
    <h4 class=\"center_text\">Sort by key</h4>" +
    build_dropdown("key_selector", "", [], "", "select()") + " " +
    build_dropdown("key_selector_method", "", ["only", "vs", "out of"], "", "select()") + " " +
    build_dropdown("key_selector_against", "", [], "", "select()") + "<br>" +
    "<h4 class=\"center_text\">Sort numeric values</h4>" +
    build_select("type_form", "", SORT_OPTIONS, "Mean", "collect_results(); select()") +
    build_checkbox("reverse", "Reverse Order", false, "select()") +
    build_button("save", "Save to Pick List", "save_pick_list()")
    
// HTML template for a dropdown option
const DROPDOWN_OP = "<option class=\"wr_dropdown_op\" value=\"NAME\" SELECTED>NAME</option>"

const TEAM = "<div id=\"result_title\"><img id=\"avatar\" src=\"SRC\"> <h2 class=\"result_name\">TEXT</h2></div>"

var keys = {}
var teams = {}
var totals = []
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
            return mode(values)
        // don't attempt to use strings
        case "string":
        case "text":
            return "---"
        // compute average for numbers
        case "counter":
        case "number":
        default:
            switch (get_selected_option("type_form"))
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
 * function:    count_options
 * parameters:  results container, column to sum
 * returns:     count of individual options
 * description: Count all the options for a given column.
 */
function count_options(results, key)
{
    let counts = {}
    switch (get_type(key))
    {
        // compute mode for non-numerics
        case "select":
        case "dropdown":
        case "checkbox":
            Object.keys(results).forEach(function (name, index)
            {
                if (Object.keys(results[name]).includes(key))
                {
                    let val = results[name][key]
                    // increase count of value if it exists already
                    if (Object.keys(counts).includes(val.toString())) counts[val]++
                    // start count of value if it has not been added yet
                    else counts[val] = 1
                }
            })
    }
    return counts
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
    keys.forEach(function (key, index)
    {
        totals[key] = avg_results(unsorted, key)
        totals[key + "_options"] = count_options(unsorted, key)
    })
    Object.keys(teams).forEach(function (team, index)
    {
        let team_results = get_team_results(unsorted, team.substr(1))
        keys.forEach(function (key, index)
        {
            teams[team][key] = avg_results(team_results, key)
        })
    })

    return num_results
}

/**
 * function:    save_pick_list
 * parameters:  none
 * returns:     none
 * description: Saves the current team rankings into a pick list, named by the sorting order.
 */
function save_pick_list()
{
    let lists = JSON.parse(localStorage.getItem(get_event_pick_lists_name(event_id)))
    let name = SORT_OPTIONS[get_selected_option("type_form")] + " of " + document.getElementById("key_selector").value
    let against = document.getElementById("key_selector_against").value
    switch (document.getElementById("key_selector_method").selectedIndex)
    {
        // single stat
        case 0:
            break
        // vs
        case 1:
            name += " vs " + against
            break
        // out of
        case 2:
            name += " out of " + against
            break
    }
    if (document.getElementById("reverse").checked)
    {
        name += " Reversed"
    }

    if (lists == null)
    {
        lists = {}
    }
    lists[name] = []
    Object.keys(teams).forEach(function (team, index)
    {
        lists[name].push(team.substr(1))
    })

    // save to localStorage and open
    localStorage.setItem(get_event_pick_lists_name(event_id), JSON.stringify(lists))
    document.location.href = "selection.html" + build_query({"page": "picklists", [EVENT_COOKIE]: event_id})
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
        let select = document.getElementById("key_selector")
        let against = document.getElementById("key_selector_against")
        let val = get_value(keys[select.selectedIndex], calc_prop(teams[team][keys[select.selectedIndex]],
                                                                  teams[team][keys[against.selectedIndex]],
                                                                  document.getElementById("key_selector_method").selectedIndex))
        document.getElementById("option_list").innerHTML += RESULT_BLOCK.replace(/NUM/g, team)
                                                                        .replace(/TEXT/g, (index+1) + ": " + team.substr(1) + " - " + val)
    })
}

/**
 * function:    sort_teams
 * parameters:  key index to sort by
 * returns:     none
 * description: Sorts the teams by a given key.
 */
function sort_teams(index, method_index, against_index)
{
    let sort_by = keys[index]
    let sort_by_against = keys[against_index]
    let unsorted = teams
    teams = {}
    
    // sort by given key
    Object.keys(unsorted).sort(function (a, b) {
        let a_val = unsorted[a][sort_by]
        let b_val = unsorted[b][sort_by]
        let a_against_val = unsorted[a][sort_by_against]
        let b_against_val = unsorted[b][sort_by_against]
        a_val = calc_prop(a_val, a_against_val, method_index)
        b_val = calc_prop(b_val, b_against_val, method_index)
        let reverse = document.getElementById("reverse").checked
        if (is_negative(sort_by) ? !reverse : reverse) // Exclusive OR
        {
            let old = a_val
            a_val = b_val
            b_val = old
        }
        return b_val < a_val ? -1
                : b_val > a_val ? 1
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
    sort_teams(document.getElementById("key_selector").selectedIndex,
               document.getElementById("key_selector_method").selectedIndex,
               document.getElementById("key_selector_against").selectedIndex)
    build_team_list()
    open_team(selected)
    
    // force mode selected if non-numeric
    let select = document.getElementById("key_selector")
    switch (get_type(keys[select.selectedIndex]))
    {
        // compute mode for non-numerics
        case "checkbox":
        case "select":
        case "dropdown":
        case "unknown":
            select_option("type_form", 2)
    }
}

/**
 * function:    calc_prop
 * parameters:  first value, second value, selected method index
 * returns:     calculated proportion
 * description: Calculate the proportion between the two provided values with the given method.
 */
function calc_prop(val, against_val, method)
{
    if (method == 1 && val != 0)
    {
        val /= val + against_val
    }
    else if (method == 2 && val != 0 && against_val != 0)
    {
        val /= against_val
    }
    return val
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
    team_num = selected.substr(1)
    let select = document.getElementById("key_selector")
    let against = document.getElementById("key_selector_against")
    let method = document.getElementById("key_selector_method").selectedIndex
    let val = teams[selected][keys[select.selectedIndex]]
    let against_val = teams[selected][keys[against.selectedIndex]]
    let key = keys[select.selectedIndex]
    let against_key = keys[against.selectedIndex]
    let overall = totals[keys[select.selectedIndex]]
    let against_overall = totals[keys[against.selectedIndex]]
    let options = totals[keys[select.selectedIndex] + "_options"]
    let against_options = totals[keys[against.selectedIndex] + "_options"]

    // team details
    let details = TEAM.replace(/SRC/g, get_avatar(team_num, event_id.substr(0,4)))
                      .replace(/TEXT/g, team_num + " " + get_team_name(team_num, event_id))
    details += get_name(key) + ": " + get_value(key, val) + "<br>"

    // overall stats
    details += "Overall: " + get_value(key, overall) + "<br>"
    if (options !== {})
    {
        Object.keys(options).forEach(function (option, index)
        {
            details += get_value(key, option) + ": " + options[option] + "<br>"
        })
    }

    // against stats
    if (method != 0)
    {
        document.getElementById("key_selector_against").style.display = "inline-block"
        details += get_name(against_key) + ": " + get_value(against_key, against_val) + "<br>"
    }
    else
    {
        document.getElementById("key_selector_against").style.display = "none"
    }

    // against overall stats
    if (method != 0)
    {
        details += "Overall: " + get_value(against_key, against_overall) + "<br>"
        if (against_options !== {})
        {
            Object.keys(against_options).forEach(function (option, index)
            {
                details += get_value(key, option) + ": " + against_options[option] + "<br>"
            })
        }
        details += "Proportion: " + get_value(key, calc_prop(val, against_val, method))
    }

    document.getElementById("value").innerHTML = details

    // select team on left
    Object.keys(teams).forEach(function (team, index)
    {
        if (document.getElementById("team_" + team).classList.contains("selected"))
        {
            document.getElementById("team_" + team).classList.remove("selected")
        }
    })
    document.getElementById("team_" + selected).classList.add("selected")
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
    document.getElementById("key_selector_against").innerHTML = options
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
        fill_dropdown()
        selected = Object.keys(teams)[0]
        select()
    }
    else
    {
        preview.innerHTML = preview.replace(/CONTENTS/g, "<h2>No Results Found</h2>")
                                   .replace(/BUTTONS/g, "")
    }
})