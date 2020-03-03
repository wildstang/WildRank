/**
 * file:        index.js
 * description: Contains functions for the index of the web app.
 *              Primarily for loading event data and transfering results.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

var qrcode

/**
 * function:    select_option
 * parameters:  ID of the selector, index of the newly selected option
 * returns:     none
 * description: Select a given option in a selector.
 */
function select_option(id, index)
{
    let children = document.getElementById(id).getElementsByClassName("wr_select_option")
    for (let option of children)
    {
        option.classList.remove("selected")
    }
    document.getElementById(id + "-" + index).classList.add("selected")
}

/**
 * function:    get_selected_option
 * parameters:  ID of selected item
 * returns:     none
 * description: Returns the selected index of the given select.
 */
function get_selected_option(id)
{
    let children = document.getElementById(id).getElementsByClassName("wr_select_option")
    let i = 0
    for (let option of children)
    {
        if (option.classList.contains("selected"))
        {
            return i
        }
        ++i
    }
    return -1
}

/**
 * function:    scout
 * parameters:  none
 * returns:     none
 * description: Start the selected scouting mode.
 */
function scout()
{
    saveOptions()
    let event = get_event()
    let position = document.getElementById("position").selectedIndex
    if (get_type() == "match")
    {
        document.location.href = "matches.html?event=" + event + "&position=" + position + "&user=" + get_user()
    }
    else
    {
        document.location.href = "pits.html?event=" + event + "&user=" + get_user()
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
    saveOptions()
    document.location.href = "results.html?type=" + get_type() + "&event=" + get_event()
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
    saveOptions()
    // get event id from the text box
    let event_id = get_event()
    let status = document.getElementById("status")
    status.innerHTML += "Requesting event data...<br>"
    console.log("Requesting event data...")

    // fetch simple event matches
    fetch("https://www.thebluealliance.com/api/v3/event/" + event_id + "/matches/simple?X-TBA-Auth-Key=" + API_KEY)
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
    fetch("https://www.thebluealliance.com/api/v3/event/" + event_id + "/teams/simple?X-TBA-Auth-Key=" + API_KEY)
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
                });

                // store teams as JSON string in teams-[event_id]
                localStorage.setItem("teams-" + event_id, JSON.stringify(teams))
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
 * function:    upload_all
 * parameters:  none
 * returns:     none
 * description: Uploads all files of the currently selected type via POST to localhost.
 */
function upload_all()
{
    saveOptions()
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
            upload = file + "|||[" + localStorage.getItem(file) + "]"
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
    saveOptions()
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
 * function:    merge_results
 * parameters:  none
 * returns:     Combined object of all files of a type
 * description: Combines all files of the currently selected type into a single CSV file.
 */
function merge_results(header)
{
    let type = get_type()
    // get all files in localStorage
    let files = Object.keys(localStorage)
    let combo = ""
    files.forEach(function (file, index)
    {
        let parts = file.split("-")
        // determine files which start with the desired type
        if (parts[0] == type)
        {
            let results = JSON.parse(localStorage.getItem(file))
            // assumes all files are formatted the same
            if (header)
            {
                start = "team,"
                if (type == "match")
                {
                    start = "match,team,"
                }
                combo += start + Object.keys(results).join(",")
                header = false
            }
            start = parts[2]
            if (type == "match")
            {
                start += "," + parts[3]
            }
            combo += start + "," + Object.values(results).join(",")
                
            // add as a field to the object named by the file name
            combo[file] = localStorage.getItem(file)
        }
    })
    return combo
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
    saveOptions()
    // remove any existing QR codes
    qrcode.clear()
    // build and place a QR code for the JSON string of the requested results
    qrcode.makeCode(merge_results(false))
}

function saveOptions()
{
    setCookie("event_id", get_event())
    setCookie("user_id", get_user())
}

function setCookie(cname, cvalue)
{
    var d = new Date();
    d.setTime(d.getTime() + (7*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname, deflt)
{
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++)
    {
        var c = ca[i];
        while (c.charAt(0) == ' ')
        {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0)
        {
            return c.substring(name.length, c.length);
        }
    }
    return deflt;
}

// when the page is finished loading
window.addEventListener('load', function() {
    // initialize the QR code canvas
    qrcode = new QRCode(document.getElementById("qrcode"), {width:512, height:512})
    document.getElementById("event_id").value = getCookie("event_id", "2020ilch")
    document.getElementById("user_id").value = getCookie("user_id", "120001")
})

// display status on page load
window.addEventListener('load', process_files)