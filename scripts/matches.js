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

const OPEN_RESULT = "\
    <div class=\"wr_button\" id=\"open_result\" onclick=\"open_result('RESULT')\">\
        <label>View Results</label>\
    </div>"

const CONTENTS = "<h2>Match Number: <span id=\"match_num\">No Match Selected</span></h2>\
                  <h2>Scouting: <span id=\"team_scouting\">No Match Selected</span></h2>"
const BUTTON = "<div class=\"wr_button\" onclick=\"start_scouting()\">\
                    <label>Scout Match!</label>\
                </div>"

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
        // find the desired qualifying match
        if (level == "qm" && number == match_num)
        {
            let selected = scout_pos
            // select appropriate team for position
            if (selected > 2)
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
            document.getElementById("match_" + number).classList.add("selected")
        }
        else if (level == "qm" && document.getElementById("match_" + number).classList.contains("selected"))
        {
            document.getElementById("match_" + number).classList.remove("selected")
        }
    })
    // place match number and team to scout on pane
    document.getElementById("match_num").innerHTML = match_num
    document.getElementById("team_scouting").innerHTML = team.substr(3)

    if (document.getElementById("open_result") !== null)
    {
        document.getElementById("open_result").remove()
    }

    let file = "match-" + event_id + "-" + match_num + "-" + team.substr(3)
    if (localStorage.getItem(file) !== null)
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
    // build URL with parameters
    window.open("scout.html" + build_query({[TYPE_COOKIE]: "match", "match": match_num, "team": team_num, "alliance": color, [EVENT_COOKIE]: event_id, [POSITION_COOKIE]: scout_pos, [USER_COOKIE]: user_id}), "_self")
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
            team = team.substr(3)

            // grey out previously scouted matches/teams
            scouted = "not_scouted"
            if (localStorage.getItem(["match", event_id, number, team].join("-")) != null)
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
    let file_name = "matches-" + event_id

    if (localStorage.getItem(file_name) != null)
    {
        document.getElementById("preview").innerHTML = document.getElementById("preview").innerHTML.replace(/CONTENTS/g, CONTENTS)
        document.getElementById("preview").innerHTML = document.getElementById("preview").innerHTML.replace(/BUTTONS/g, BUTTON)

        matches = JSON.parse(localStorage.getItem(file_name))
        build_match_list()
    }
    else
    {
        document.getElementById("preview").innerHTML = document.getElementById("preview").innerHTML.replace(/CONTENTS/g, "<h2>No Match Data Found</h2>Please preload event")
        document.getElementById("preview").innerHTML = document.getElementById("preview").innerHTML.replace(/BUTTONS/g, "")
    }
}

// read parameters from URL
const scout_pos = get_parameter(POSITION_COOKIE, POSITION_DEFAULT)
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

load_event()