/**
 * file:        index.js
 * description: Contains functions for the index of the web app.
 *              Primarily for loading event data and transfering results.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

var qrcode

/**
 * function:    scout
 * parameters:  none
 * returns:     none
 * description: Start the selected scouting mode.
 */
function scout()
{
    save_options()
    let event = get_event()
    let position = get_position()
    let user = get_user()
    if (get_type() == "match")
    {
        if (localStorage.getItem("matches-" + event) != null)
        {
            document.location.href = "selection.html" + build_query({"page": "matches", [EVENT_COOKIE]: event, [POSITION_COOKIE]: position, [USER_COOKIE]: user})
        }
        else
        {
            alert("No matches found! Please preload data.")
        }
    }
    else
    {
        if (localStorage.getItem("teams-" + event) != null)
        {
            document.location.href = "selection.html" + build_query({"page": "pits", [EVENT_COOKIE]: event, [USER_COOKIE]: user})
        }
        else
        {
            alert("No teams found! Please preload data.")
        }
    }
}

/**
 * function:    open_results
 * parameters:  none
 * returns:     none
 * description: Open the results of the selected scouting mode.
 */
function open_results()
{
    save_options()
    let type = get_type()
    let event = get_event()

    let count = 0
    Object.keys(localStorage).forEach(function (file, index)
    {
        if (file.startsWith(type + "-" + event + "-"))
        {
            ++count
        }
    })
    
    if (count > 0)
    {
        document.location.href = "selection.html" + build_query({"page": "results", "type": type, [EVENT_COOKIE]: event})
    }
    else
    {
        alert("No results found!")
    }
}

/**
 * function:    open_whiteboard
 * parameters:  none
 * returns:     none
 * description: Open the virtual whiteboard.
 */
function open_whiteboard()
{
    save_options()
    document.location.href = "selection.html" + build_query({"page": "whiteboard", [EVENT_COOKIE]: get_event()})
}

/**
 * function:    load_event
 * parameters:  none
 * returns:     none
 * description: Fetch simple event matches and team from TBA.
 *              Store results in localStorage.
 */
function load_event()
{
    save_options()
    // get event id from the text box
    let event_id = get_event()
    let status = document.getElementById("status")
    status.innerHTML += "Requesting event data...<br>"
    console.log("Requesting event data...")

    // fetch simple event matches
    fetch("https://www.thebluealliance.com/api/v3/event/" + event_id + "/matches/simple" + build_query({"X-TBA-Auth-Key": API_KEY}))
        .then(response => {
            return response.json()
        })
        .then(data => {
            if (data.length > 0) {
                status.innerHTML += "got (" + data.length + ") matches<br>"
                console.log("got (" + data.length + ") matches")

                // sort match objs by match number
                matches = data.sort(function (a, b) {
                    return b.match_number < a.match_number ?  1
                            : b.match_number > a.match_number ? -1
                            : 0
                })

                // store matches as JSON string in matches-[event-id]
                localStorage.setItem("matches-" + event_id, JSON.stringify(matches))
            }
            else {
                status.innerHTML += "no matches received<br>"
            }
        })
        .catch(err => {
            console.log("error loading matches: " + err)
            status.innerHTML += "error loading matches<br>"
        })

    // fetch simple event teams
    fetch("https://www.thebluealliance.com/api/v3/event/" + event_id + "/teams/simple" + build_query({"X-TBA-Auth-Key": API_KEY}))
        .then(response => {
            return response.json()
        })
        .then(data => {
            if (data.length > 0) {
                status.innerHTML += "got (" + data.length + ") teams<br>"
                console.log("got (" + data.length + ") teams")

                // sort team objs by team number
                teams = data.sort(function (a, b) {
                    return b.team_number < a.team_number ?  1
                            : b.team_number > a.team_number ? -1
                            : 0;
                })
                // store teams as JSON string in teams-[event_id]
                localStorage.setItem("teams-" + event_id, JSON.stringify(teams))

                // fetch team's avatar for whiteboard
                teams.forEach(function (team, index)
                {
                    let year = get_event().substr(0,4)
                    fetch("https://www.thebluealliance.com/api/v3/team/frc" + team.team_number + "/media/" + year + build_query({"X-TBA-Auth-Key": API_KEY}))
                        .then(response => {
                            return response.json()
                        })
                        .then(data => {
                            localStorage.setItem("image-" + year + "-" + team.team_number, data[0].details.base64Image)
                        })
                        .catch(err => {
                        })
                })
            }
            else {
                status.innerHTML += "no teams received<br>"
            }
        })
        .catch(err => {
            console.log("error loading teams: " + err)
            status.innerHTML += "error loading teams<br>"
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
    return get_selected_option("type_form") ? "match" : "pit"
}

/**
 * function:    get_event
 * parameters:  none
 * returns:     Currently entered event ID.
 * description: Returns text in event id box.
 */
function get_event()
{
    return document.getElementById("event_id").value
}

/**
 * function:    get_user
 * parameters:  none
 * returns:     Currently entered user ID.
 * description: Returns text in user id box.
 */
function get_user()
{
    return document.getElementById("user_id").value
}

/**
 * function:    get_position
 * parameters:  none
 * returns:     Currently selected scouting position index.
 * description: Returns currently selected scouting position index.
 */
function get_position()
{
    return document.getElementById("position").selectedIndex
}

/**
 * function:    get_upload_addr
 * parameters:  none
 * returns:     Currently entered upload server url.
 * description: Returns text in upload addr textbox.
 */
function get_upload_addr()
{
    return document.getElementById("position").selectedIndex
}

/**
 * function:    upload_all
 * parameters:  none
 * returns:     none
 * description: Uploads all files of the currently selected type via POST to localhost.
 */
function upload_all()
{
    save_options()
    let type = get_type()
    let status = document.getElementById("status")
    status.innerHTML += "Uploading " + type + " results...<br>"
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
            status.innerHTML += "posting " + file + "<br>"
            // post string to server
            fetch(document.getElementById("upload_addr").value, {method: "POST", body: upload})
        }
    })
}

/**
 * function:    import_all
 * parameters:  none
 * returns:     none
 * description: Import results from the local /uploads file to localStorage.
 */
function import_all()
{
    save_options()
    // determine appropriate request for selected mode
    let request = ""
    if (get_type() == "match")
    {
        request = "getMatchResultNames"
    }
    else
    {
        request = "getPitResultNames"
    }

    // request list of available results
    let status = document.getElementById("status")
    status.innerHTML += "Requesting local result data...<br>"
    console.log("Requesting result data...")
    fetch(request)
        .then(response => {
            return response.text()
        })
        .then(data => {
            // get requested results for current event
            let results = data.split(",").filter(function (r) {
                return r.includes(get_event()) && localStorage.getItem(r.replace('.json', '')) === null
            })
            status.innerHTML += results.length + " " + get_type() + " results found<br>"

            // request each desired result
            results.forEach(function (file, index)
            {
                fetch('uploads/' + file)
                    .then(response => {
                        return response.json()
                    })
                    .then(data => {
                        // save file
                        localStorage.setItem(file.replace('.json', ''), JSON.stringify(data))
                        status.innerHTML += "got " + file + "<br>"
                        console.log("got " + file)
                    })
                    .catch(err => {
                        console.log("error requesting result: " + err)
                        status.innerHTML += "error requesting result<br>"
                    })
            })

        })
        .catch(err => {
            console.log("error requesting results: " + err)
            status.innerHTML += "error requesting results<br>"
        })
}

/**
 * function:    process_files
 * parameters:  none
 * returns:     none
 * description: Counts files and displays numbers on screen
 */
function process_files()
{
    let type = get_type()
    // get all files in localStorage
    let files = Object.keys(localStorage)
    let combo = {}
    let matches = 0
    let pits = 0
    let events = []
    let teams = []
    files.forEach(function (file, index)
    {
        let parts = file.split("-")
        // determine files which start with the desired type
        if (parts[0] == "matches")
        {
            events.push(parts[1])
        }
        else if (parts[0] == "teams")
        {
            teams.push(parts[1])
        }
        else if (parts[0] == "match")
        {
            ++matches
        }
        else if (parts[0] == "pit")
        {
            ++pits
        }
    })
    document.getElementById("status").innerHTML += "Found...<br>" +
                                                    matches + " scouted matches<br>" +
                                                    pits + " scouted pits<br>" +
                                                    "Match Events: " + events.join(", ") + "<br>" +
                                                    "Team Events: " + teams.join(", ") + "<br>"
}

/**
 * function:    build_qr
 * parameters:  The desired type to build a QR code of.
 * returns:     none
 * description: Builds a QR code which represents the combined results of the requested type as a JSON string.
 */
function build_qr()
{
    save_options()
    // remove any existing QR codes
    qrcode.clear()
    // build and place a QR code for the JSON string of the requested results
    qrcode.makeCode(merge_results(false))
}

/**
 * function:    save_options
 * parameters:  none
 * returns:     none
 * description: Save some options to cookies.
 */
function save_options()
{
    set_cookie(EVENT_COOKIE, get_event())
    set_cookie(USER_COOKIE, get_user())
    set_cookie(POSITION_COOKIE, get_position())
    set_cookie(UPLOAD_COOKIE, get_upload_addr())
    set_cookie(TYPE_COOKIE, get_type())
}

// when the page is finished loading
window.addEventListener('load', function() {
    // initialize the QR code canvas
    qrcode = new QRCode(document.getElementById("qrcode"), {width:512, height:512})
    document.getElementById("event_id").value = get_cookie(EVENT_COOKIE, EVENT_DEFAULT)
    document.getElementById("user_id").value = get_cookie(USER_COOKIE, USER_DEFAULT)
    document.getElementById("position").selectedIndex = get_cookie(POSITION_COOKIE, POSITION_DEFAULT)
    document.getElementById("upload_addr").selectedIndex = get_cookie(UPLOAD_COOKIE, UPLOAD_DEFAULT)
    select_option("type_form", get_cookie(TYPE_COOKIE, TYPE_DEFAULT)=="match" ? 1 : 2)
    process_files()
})