/**
 * file:        index.js
 * description: Contains functions for the index of the web app.
 *              Primarily for loading event data and transfering results.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

fetch_config(fill_defaults)

// when the page is finished loading
window.addEventListener('load', function() {
    let type_cookie = get_cookie(TYPE_COOKIE, TYPE_DEFAULT)
    select_option("type_form", type_cookie == "match" ? 1 : type_cookie == "pit" ? 2 : 3)
    process_files()
})

/**
 * function:    fill_defaults
 * parameters:  none
 * returns:     none
 * description: Fetch defaults and populate inputs with defaults.
 */
function fill_defaults()
{
    let defaults = get_defaults()
    document.getElementById("event_id").value = get_cookie(EVENT_COOKIE, defaults.event_id)
    document.getElementById("user_id").value = get_cookie(USER_COOKIE, defaults.user_id)
    document.getElementById("position").selectedIndex = get_cookie(POSITION_COOKIE, POSITION_DEFAULT)
    document.getElementById("upload_addr").selectedIndex = get_cookie(UPLOAD_COOKIE, defaults.upload_url)
}

/**
 * BUTTON RESPONSES
 */

/**
 * function:    scout
 * parameters:  none
 * returns:     none
 * description: Start the selected scouting mode.
 */
function scout()
{
    save_options()
    let type = get_selected_type()
    if (config_exists(type))
    {
        let event    = get_event()
        let position = get_position()
        let user     = get_user()
        if (type === "match")
        {
            if (file_exists(get_event_matches_name(event)))
            {
                document.location.href = "selection.html" + build_query({"page": "matches", [EVENT_COOKIE]: event, [POSITION_COOKIE]: position, [USER_COOKIE]: user})
            }
            else
            {
                alert("No matches found! Please preload data.")
            }
        }
        else if (type === "pit")
        {
            if (file_exists(get_event_teams_name(event)))
            {
                document.location.href = "selection.html" + build_query({"page": "pits", [EVENT_COOKIE]: event, [USER_COOKIE]: user})
            }
            else
            {
                alert("No teams found! Please preload data.")
            }
        }
        else if (type === "notes")
        {
            if (file_exists(get_event_teams_name(event)))
            {
                document.location.href = "selection.html" + build_query({"page": "matches", [EVENT_COOKIE]: event, [POSITION_COOKIE]: -1, [USER_COOKIE]: user})
            }
            else
            {
                alert("No teams found! Please preload data.")
            }
        }
    }
    else
    {
        alert("No config found for mode: " + type)
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
    let type = get_selected_type()
    if (config_exists(type))
    {
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
    else
    {
        alert("No config found for mode: " + type)
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
    let event = get_event()
    if (file_exists(get_event_teams_name(event)))
    {
        document.location.href = "selection.html" + build_query({"page": "whiteboard", [EVENT_COOKIE]: event})
    }
    else
    {
        alert("No teams found for event")
    }
}

/**
 * function:    open_ranker
 * parameters:  none
 * returns:     none
 * description: Open the team ranker interface.
 */
function open_ranker()
{
    save_options()
    let type = get_selected_type()
    if (type == "notes")
    {
        alert("You can't rank notes...")
    }
    else if (config_exists(type))
    {
        document.location.href = "selection.html" + build_query({"page": "ranker", [TYPE_COOKIE]: type, [EVENT_COOKIE]: get_event()})
    }
    else
    {
        alert("No config found for mode: " + type)
    }
}

/**
 * function:    open_picks
 * parameters:  none
 * returns:     none
 * description: Open the pick list interface.
 */
function open_picks()
{
    save_options()
    let event = get_event()
    if (file_exists(get_event_teams_name(event)))
    {
        document.location.href = "selection.html" + build_query({"page": "picklists", [EVENT_COOKIE]: event})
    }
    else
    {
        alert("No teams found for event")
    }
}

/**
 * function:    preload_event
 * parameters:  none
 * returns:     none
 * description: Fetch simple event matches and team from TBA.
 *              Store results in localStorage.
 */
function preload_event()
{
    save_options()

    // get event id from the text box
    let event_id = get_event()
    status("Requesting event data...")

    // fetch simple event matches
    fetch("https://www.thebluealliance.com/api/v3/event/" + event_id + "/matches/simple" + build_query({[TBA_KEY]: API_KEY}))
        .then(response => {
            return response.json()
        })
        .then(data => {
            if (data.length > 0)
            {
                status("got (" + data.length + ") matches")

                // sort match objs by match number
                matches = data.sort(function (a, b)
                {
                    return b.match_number < a.match_number ?  1
                            : b.match_number > a.match_number ? -1
                            : 0
                })

                // store matches as JSON string in matches-[event-id]
                localStorage.setItem(get_event_matches_name(event_id), JSON.stringify(matches))
            }
            else
            {
                status("no matches received")
            }
        })
        .catch(err => {
            status("error loading matches")
            console.log(err)
        })

    // fetch simple event teams
    fetch("https://www.thebluealliance.com/api/v3/event/" + event_id + "/teams/simple" + build_query({[TBA_KEY]: API_KEY}))
        .then(response => {
            return response.json()
        })
        .then(data => {
            if (data.length > 0)
            {
                status("got (" + data.length + ") teams")

                // sort team objs by team number
                teams = data.sort(function (a, b)
                {
                    return b.team_number < a.team_number ?  1
                            : b.team_number > a.team_number ? -1
                            : 0;
                })
                // store teams as JSON string in teams-[event_id]
                localStorage.setItem(get_event_teams_name(event_id), JSON.stringify(teams))

                // fetch team's avatar for whiteboard
                teams.forEach(function (team, index)
                {
                    let year = get_event().substr(0,4)
                    fetch("https://www.thebluealliance.com/api/v3/team/frc" + team.team_number + "/media/" + year + build_query({[TBA_KEY]: API_KEY}))
                        .then(response => {
                            return response.json()
                        })
                        .then(data => {
                            localStorage.setItem(get_team_avatar_name(team.team_number, year), data[0].details.base64Image)
                        })
                        .catch(err => {
                            console.log("error loading avatar: " + err)
                        })
                })
            }
            else {
                status("no teams received")
            }
        })
        .catch(err => {
            status("error loading teams")
            console.log(err)
        })
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
    let type = get_selected_type()
    status("Uploading " + type + " results...")
    // get all files in localStorage
    Object.keys(localStorage).forEach(function (file, index)
    {
        // determine files which start with the desired type
        if (file.startsWith(type + "-"))
        {
            // append file name to data, separated by "|||"
            upload = file + "|||" + localStorage.getItem(file)
            status("posting " + file)
            // post string to server
            fetch(get_upload_addr(), {method: "POST", body: upload})
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

    var req = new XMLHttpRequest();
    req.open('GET', document.location, false)
    req.send(null)
    if (req.getAllResponseHeaders().toLowerCase().includes("python"))
    {
        // determine appropriate request for selected mode
        let request = ""
        if (get_selected_type() == "match")
        {
            request = "getMatchResultNames"
        }
        else
        {
            request = "getPitResultNames"
        }
    
        // request list of available results
        status("Requesting local result data...")
        fetch(request)
            .then(response => {
                return response.text()
            })
            .then(data => {
                // get requested results for current event
                let results = data.split(",").filter(function (r) {
                    return r.includes(get_event()) && localStorage.getItem(r.replace('.json', '')) === null
                })
                status(results.length + " " + get_selected_type() + " results found")
                
                // request each desired result
                results.forEach(function (file, index)
                {
                    fetch(get_upload_addr() + '/uploads/' + file)
                        .then(response => {
                            return response.json()
                        })
                        .then(data => {
                            // save file
                            localStorage.setItem(file.replace('.json', ''), JSON.stringify(data))
                            status("got " + file)
                        })
                        .catch(err => {
                            status("error requesting result")
                            console.log(err)
                        })
                })
    
            })
            .catch(err => {
                status("error requesting results")
                console.log(err)
            })
    }
    else
    {
        console.log("Import results is only supported on Python server.")
        alert("This server cannot do import results!")
    }
}

/**
 * HELPER FUNCTIONS
 */

/**
 * function:    process_files
 * parameters:  none
 * returns:     none
 * description: Counts files and displays numbers on screen
 */
function process_files()
{
    // get all files in localStorage
    let files = Object.keys(localStorage)
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
    status("Found...<br>" +
           matches + " scouted matches<br>" +
           pits + " scouted pits<br>" +
           "Match Events: " + events.join(", ") + "<br>" +
           "Team Events: " + teams.join(", "))
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
    set_cookie(TYPE_COOKIE, get_selected_type())
}

/**
 * function:    status
 * parameters:  string status
 * returns:     none
 * description: Log a string to both the status window and console.
 */
function status(status)
{
    document.getElementById("status").innerHTML += status + "<br>"
    console.log(status)
}

/**
 * INPUT VALUE FUNCTIONS
 */

/**
 * function:    get_selected_type
 * parameters:  none
 * returns:     Currently selected scouting type.
 * description: Determines whether to use "match" or "pit" scouting based on the "match" radio button.
 */
function get_selected_type()
{
    return get_selected_option("type_form") == 1 ? "match" : get_selected_option("type_form") == 0 ? "pit" : "notes"
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
    return document.getElementById("upload_addr").value
}