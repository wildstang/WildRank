/**
 * file:        matches.js
 * description: Contains functions for the match selection page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

// HTML template for a match option
const MATCH_BLOCK = "\
    <div id=\"match_MATCH_NUM\" class=\"match_option CLASS\" onclick=\"open_match(MATCH_NUM)\">\
        <span class=\"option_number\">QMATCH_NUM</span>\
        <span>\
            <div class=\"alliance red\">RED_TEAMS</div>\
            <div class=\"alliance blue\">BLUE_TEAMS</div>\
        </span>\
    </div>"

const OPEN_RESULT = build_button("open_result", "View Results", "open_result('RESULT')")

const CONTENTS = "<h2>Match Number: <span id=\"match_num\">No Match Selected</span></h2>\
                  <h2>Scouting: <span id=\"team_scouting\">No Match Selected</span></h2>"
                              
const BUTTONS = build_button("scout_match", "Scout Match!", "start_scouting()")

var matches

/**
 * function:    open_match
 * parameters:  Selected match number
 * returns:     none
 * description: Completes right info pane for a given match number.
 */
function open_match(match_num)
{
    var team = ""
    // iterate through each match obj
    matches.forEach(function (match, index) {
        let level = match.comp_level
        let number = match.match_number
        let red_teams = match.alliances.red.team_keys
        let blue_teams = match.alliances.blue.team_keys
        let match_div = document.getElementById("match_" + number)
        // find the desired qualifying match
        if (level == "qm" && number == match_num)
        {
            let selected = scout_pos
            // select appropriate team for position
            if (selected < 0)
            {
                document.getElementById("team_scouting").style.color = 'black'
            }
            else if (selected > 2)
            {
                // shift blue alliance indicies up
                selected -= 3
                team = blue_teams[selected]
                document.getElementById("team_scouting").style.color = 'blue'
            }
            else
            {
                team = red_teams[selected]
                document.getElementById("team_scouting").style.color = 'red'
            }

            // select option
            match_div.classList.add("selected")

            // populate team text
            if (scout_pos < 0)
            {
                document.getElementById("team_scouting").innerHTML = ""
                red_teams.forEach(function (team, index)
                {
                    document.getElementById("team_scouting").innerHTML += team.substr(3) + ","
                })
                blue_teams.forEach(function (team, index)
                {
                    if (index != 0)
                    {
                        document.getElementById("team_scouting").innerHTML += ","
                    }
                    document.getElementById("team_scouting").innerHTML += team.substr(3)
                })
            }
            else
            {
                document.getElementById("team_scouting").innerHTML = team.substr(3)
            }
        }
        else if (level == "qm" && match_div.classList.contains("selected"))
        {
            match_div.classList.remove("selected")
        }
    })
    // place match number and team to scout on pane
    document.getElementById("match_num").innerHTML = match_num

    if (document.getElementById("open_result_container") !== null)
    {
        document.getElementById("open_result_container").remove()
    }

    let file = get_match_result(match_num, team.substr(3), event_id)
    if (file_exists(file))
    {
        document.getElementById("preview").innerHTML += OPEN_RESULT.replace(/RESULT/g, file)
    }
}

/**
 * function:    open_result
 * parameters:  file to open
 * returns:     none
 * description: Opens result page for selected match.
 */
function open_result(file)
{
    document.location.href = "selection.html" + build_query({"page": "results", [TYPE_COOKIE]: "match", [EVENT_COOKIE]: event_id, "file": file})
}

/**
 * function:    start_scouting
 * parameters:  none
 * returns:     none
 * description: Open scouting mode for the desired team and match in the current tab.
 */
function start_scouting()
{
    let match_num = document.getElementById("match_num").innerHTML
    let team_num = document.getElementById("team_scouting").innerHTML
    let color = document.getElementById("team_scouting").style.color
    let mode = MATCH_MODE
    if (scout_pos < 0)
    {
        mode = NOTE_MODE
    }
    // build URL with parameters
    window.open("scout.html" + build_query({[TYPE_COOKIE]: mode, "match": match_num, "team": team_num, "alliance": color, [EVENT_COOKIE]: event_id, [POSITION_COOKIE]: scout_pos, [USER_COOKIE]: user_id}), "_self")
}

/**
 * function:    build_match_list
 * parameters:  none
 * returns:     none
 * description: Completes left select match pane with matches from event data.
 */
function build_match_list()
{
    let first = ""
    // iterate through each match obj
    matches.forEach(function (match, index) {
        let level = match.comp_level
        let number = match.match_number
        let red_teams = match.alliances.red.team_keys
        let blue_teams = match.alliances.blue.team_keys
        // only display qualifying matches
        if (level == "qm")
        {
            // determine which team user is positioned to scout
            let team = ""
            if (scout_pos >= 3)
            {
                // adjust indicies for blue alliance
                team = blue_teams[scout_pos - 3]
            }
            else
            {
                team = red_teams[scout_pos]
            }
            if (scout_pos > -1)
            {
                team = team.substr(3)
            }

            // grey out previously scouted matches/teams
            scouted = "not_scouted"
            if (scout_pos > -1 && file_exists(get_match_result(number, team, event_id)))
            {
                first = ""
                scouted = "scouted"
            }
            else if (scout_pos < 0 && file_exists(get_notes(number, event_id)))
            {
                first = ""
                scouted = "scouted"
            }
            else if (first == "")
            {
                first = number
            }

            // replace placeholders in template and add to screen
            document.getElementById("option_list").innerHTML += MATCH_BLOCK.replace(/MATCH_NUM/g, number)
                                                                           .replace(/BLUE_TEAMS/g, blue_teams.join(" | "))
                                                                           .replace(/RED_TEAMS/g, red_teams.join(" | "))
                                                                           .replace(/frc/g, "")
                                                                           .replace(/CLASS/g, scouted)
        }
    })
    open_match(first)
    scroll_to("option_list", "match_" + first)
}

/**
 * function:    load_event
 * parameters:  none
 * returns:     none
 * description: Fetch simple event matches and from localStorage.
 *              Build match list on load completion.
 */
function load_event()
{
    let file_name = get_event_matches_name(event_id)
    let preview = document.getElementById("preview")

    if (localStorage.getItem(file_name) != null)
    {
        preview.innerHTML = preview.innerHTML.replace(/CONTENTS/g, CONTENTS)
                                             .replace(/BUTTONS/g, BUTTONS)

        matches = JSON.parse(localStorage.getItem(file_name))
        build_match_list()
    }
    else
    {
        preview.innerHTML = preview.replace(/CONTENTS/g, "<h2>No Match Data Found</h2>Please preload event")
                                   .replace(/BUTTONS/g, "")
    }
}

// read parameters from URL
const scout_pos = get_parameter(POSITION_COOKIE, POSITION_DEFAULT)
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

load_event()