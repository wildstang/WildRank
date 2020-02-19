/**
 * file:        index.js
 * description: Contains functions for the index of the web app.
 *              Primarily for loading event data and transfering results.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

var qrcode

/**
 * function:    load_event
 * parameters:  none
 * returns:     none
 * description: Fetch simple event matches and team from TBA.
 *              Store results in localStorage.
 */
function load_event()
{
    // get event id from the text box
    let event_id = document.getElementById("event_id").value
    console.log("Requesting event data...")

    // fetch simple event matches
    fetch("https://www.thebluealliance.com/api/v3/event/" + event_id + "/matches/simple?X-TBA-Auth-Key=" + API_KEY)
        .then(response => {
            return response.json()
        })
        .then(data => {
            console.log("Got matches")
            // sort match objs by match number
            matches = data.sort(function (a, b) {
                return b.match_number < a.match_number ?  1
                        : b.match_number > a.match_number ? -1
                        : 0;
            });

            // store matches as JSON string in matches-[event-id]
            localStorage.setItem("matches-" + event_id, JSON.stringify(matches))
        })
        .catch(err => {
            console.log("Error loading matches: " + err)
        })

    // fetch simple event teams
    fetch("https://www.thebluealliance.com/api/v3/event/" + event_id + "/teams/simple?X-TBA-Auth-Key=" + API_KEY)
        .then(response => {
            return response.json()
        })
        .then(data => {
            console.log("Got teams")
            // sort team objs by team number
            teams = data.sort(function (a, b) {
                return b.team_number < a.team_number ?  1
                        : b.team_number > a.team_number ? -1
                        : 0;
            });

            // store teams as JSON string in teams-[event_id]
            localStorage.setItem("teams-" + event_id, JSON.stringify(teams))
        })
        .catch(err => {
            console.log("Error loading teams: " + err)
        })
}

/**
 * function:    get_type
 * parameters:  none
 * returns:     Currently selected scouting type.
 * description: Determines whether to use "match" or "pit" scouting based on the "match" radio button.
 */
function get_type()
{
    return document.getElementById("type").checked ? "match" : "pit"
}

/**
 * function:    upload_all
 * parameters:  none
 * returns:     none
 * description: Uploads all files of the currently selected type via POST to localhost.
 * TODO:        This will likely need to be configurable as it is design for uploading to a remote server.
 */
function upload_all()
{
    let type = get_type()
    // get all files in localStorage
    let files = Object.keys(localStorage)
    files.forEach(function (file, index)
    {
        // determine files which start with the desired type
        if (file.startsWith(type + "-"))
        {
            // append file name to data, separated by "|||"
            upload = file + "|||" + localStorage.getItem(file)
            console.log("posting " + file)
            // post string to server
            fetch('localhost', {method: "POST", body: upload})
        }
    })
}

/**
 * function:    merge_results
 * parameters:  none
 * returns:     Combined object of all files of a type
 * description: Combines all files of the currently selected type into a single JSON object.
 */
function merge_results()
{
    let type = get_type()
    // get all files in localStorage
    let files = Object.keys(localStorage)
    let combo = {}
    files.forEach(function (file, index)
    {
        // determine files which start with the desired type
        if (file.startsWith(type + "-"))
        {
            // add as a field to the object named by the file name
            combo[file] = localStorage.getItem(file)
        }
    })
    return combo
}

/**
 * function:    build_qr
 * parameters:  The desired type to build a QR code of.
 * returns:     none
 * description: Builds a QR code which represents the combined results of the requested type as a JSON string.
 */
function build_qr(type)
{
    // remove any existing QR codes
    qrcode.clear()
    // build and place a QR code for the JSON string of the requested results
    qrcode.makeCode(JSON.stringify(merge_results(type)))
}

// when the page is finished loading
window.addEventListener('load', function() {
    // initialize the QR code canvas
    qrcode = new QRCode(document.getElementById("qrcode"), {width:512, height:512})
})