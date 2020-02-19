/**
 * file:        results.js
 * description: Contains functions for the results page of the web app.
 *              Primarily for building the interface from result data.
 * author:      Liam Fruzyna
 * date:        2020-02-16
 */

// read parameters from URL
var urlParams = new URLSearchParams(window.location.search)
const type = urlParams.get('type')

// load result data on page load
window.addEventListener('load', function () {
    headers = true
    // search all files for results
    let files = Object.keys(localStorage)
    files.forEach(function (file, index)
    {
        // only use files for the desired type
        if (file.startsWith(type + "-"))
        {
            // add headers the first time around
            if (headers)
            {
                add_results_row(file, true)
                headers = false
            }
            add_results_row(file)
        }
    })
})

/**
 * function:    add_results_row
 * parameters:  File to get results from, whether or not to use header
 * returns:     none
 * description: Adds a row to the results table and optionally a header from a results file.
 */
function add_results_row(file, header=false)
{
    // parse JSON from file
    let = results = JSON.parse(localStorage.getItem(file))
    let row_str = "<tr>"
    
    // add file name column
    if (header)
    {
        row_str += "<td>file</td>"
    }
    else
    {
        row_str += "<td>" + file + "</td>"
    }
    
    // add all JSON keys as columns
    for (var key of Object.keys(results))
    {
        if (header)
        {
            row_str += "<td>" + key + "</ts>"
        }
        else
        {
            row_str += "<td>" + results[key] + "</td>"
        }
    }

    row_str += "</tr>"
    // add to page
    document.getElementById("results_tab").innerHTML += row_str
}