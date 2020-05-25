/**
 * file:        pits.js
 * description: Contains functions for the pit selection page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

// HTML template for a team option
const TEAM_BLOCK = "\
    <div id=\"team_TEAM_NUM\" class=\"pit_option CLASS\" onclick=\"open_team(TEAM_NUM)\">\
        <span class=\"long_option_number\">TEAM_NUM</span>\
    </div>"

const OPEN_RESULT = build_button("open_result", "View Results", "open_result('RESULT')")

const CONTENTS = "<h2>Team: <span id=\"team_num\">No Match Selected</span></h2>"
    
const BUTTONS = `${build_button('scout_pit', 'Scout Pit!', 'start_scouting()')}<div id="view_result"></div>`

var teams

/**
 * function:    open_team
 * parameters:  Selected team number
 * returns:     none
 * description: Completes right info pane for a given team number.
 */
function open_team(team_num)
{
    document.getElementById("team_num").innerHTML = team_num
    document.getElementById("team_" + team_num).classList.add("selected")
    teams.forEach(function (team, index) {
        let number = team.team_number
        if (number != team_num && document.getElementById("team_" + number).classList.contains("selected"))
        {
            document.getElementById("team_" + number).classList.remove("selected")
        }
    })

    if (document.getElementById("open_result_container") !== null)
    {
        document.getElementById("open_result_container").remove()
    }
    
    let file = get_pit_result(team_num, event_id)
    if (file_exists(file))
    {
        document.getElementById('view_result').innerHTML = OPEN_RESULT.replace(/RESULT/g, file)
    }
    else
    {
        document.getElementById('view_result').innerHTML = ''
    }
}

/**
 * function:    open_result
 * parameters:  file to open
 * returns:     none
 * description: Opens result page for selected team.
 */
function open_result(file)
{
    document.location.href = "selection.html" + build_query({"page": "results", [TYPE_COOKIE]: PIT_MODE, [EVENT_COOKIE]: event_id, "file": file})
}

/**
 * function:    start_scouting
 * parameters:  none
 * returns:     none
 * description: Open scouting mode for the desired team in the current tab.
 */
function start_scouting()
{
    let team_num = document.getElementById("team_num").innerHTML
    window.open("scout.html" + build_query({[TYPE_COOKIE]: PIT_MODE, "team": team_num, "alliance": "white", [EVENT_COOKIE]: event_id, [POSITION_COOKIE]: 0, [USER_COOKIE]: user_id}), "_self")
}

/**
 * function:    build_team_list
 * parameters:  none
 * returns:     none
 * description: Completes left select team pane with teams from event data.
 */
function build_team_list()
{
    let first = ""
    // iterate through team objs
    teams.forEach(function (team, index) {
        let number = team.team_number
        // determine if the team has already been scouted
        let scouted = "not_scouted"
        if (file_exists(get_pit_result(number, event_id)))
        {
            first = ""
            scouted = "scouted"
        }
        else if (first == "")
        {
            first = number
        }

        // replace placeholders in template and add to screen
        document.getElementById("option_list").innerHTML += TEAM_BLOCK.replace(/TEAM_NUM/g, number)
                                                                      .replace(/CLASS/g, scouted)
    })
    open_team(first)
    scroll_to("option_list", "team_" + first)
}

/**
 * function:    load_event
 * parameters:  none
 * returns:     none
 * description: Fetch simple event teams and from localStorage.
 *              Build team list on load completion.
 */
function load_event()
{
    let file_name = get_event_teams_name(event_id)
    let preview = document.getElementById("preview")

    if (localStorage.getItem(file_name) != null)
    {
        preview.innerHTML = preview.innerHTML.replace(/CONTENTS/g, CONTENTS)
                                             .replace(/BUTTONS/g, BUTTONS)
        
        teams = JSON.parse(localStorage.getItem(file_name))
        build_team_list()
    }
    else
    {
        preview.innerHTML = preview.innerHTML.replace(/CONTENTS/g, "<h2>No Team Data Found</h2>Please preload event")
                                             .replace(/BUTTONS/g, "")
    }
}

// read parameters from URL
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

// load event data on page load
load_event()