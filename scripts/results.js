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
    let files = Object.keys(localStorage)
    files.forEach(function (file, index)
    {
        // determine files which start with the desired type
        if (file.startsWith(prefix) && file != name && document.getElementById("result_" + file).classList.contains("selected"))
        {
            document.getElementById("result_" + file).classList.remove("selected")
        }
    })

    let result = JSON.parse(localStorage.getItem(name))
    let names = Object.keys(result)
    let table = "<table>"
    names.forEach(function (name, index)
    {
        table += "<tr><th>" + name + "</th><td>" + result[name] + "</td></tr>"
    })
    table += "</table>"
    document.getElementById("results").innerHTML = table
}

/**
 * function:    build_team_list
 * parameters:  none
 * returns:     none
 * description: Completes left select result pane with results.
 */
function build_result_list()
{
    let files = Object.keys(localStorage)
    files.forEach(function (file, index)
    {
        // determine files which start with the desired type
        if (file.startsWith(prefix))
        {
            let label = file.substr(prefix.length).replace("-", ": ")
            document.getElementById("option_list").innerHTML += RESULT_BLOCK.replace(/NAME/g, file)
                                                                            .replace(/TEXT/g, label)
        }
    })
}

// read parameters from URL
var urlParams = new URLSearchParams(window.location.search)
const event_id = urlParams.get('event')
const type = urlParams.get('type')
const prefix = type + "-" + event_id + "-"

// load event data on page load
window.addEventListener('load', build_result_list)