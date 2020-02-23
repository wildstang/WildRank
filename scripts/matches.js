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
            <div class=\"alliance blue\">BLUE_TEAMS</div>\
            <div class=\"alliance red\">RED_TEAMS</div>\
        </span>\
    </div>"

var matches;

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
    window.open("scout.html?mode=match&match=" + match_num + "&team=" + team_num + "&alliance=" + color + "&event=" + event_id + "&position=" + scout_pos, "_self")
}

/**
 * function:    build_match_list
 * parameters:  none
 * returns:     none
 * description: Completes left select match pane with matches from event data.
 */
function build_match_list()
{
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
                scouted = "scouted"
            }

            // replace placeholders in template and add to screen
            document.getElementById("option_list").innerHTML += MATCH_BLOCK.replace(/MATCH_NUM/g, number)
                                                                               .replace(/BLUE_TEAMS/g, blue_teams.join(" | "))
                                                                               .replace(/RED_TEAMS/g, red_teams.join(" | "))
                                                                               .replace(/frc/g, "")
                                                                               .replace(/CLASS/g, scouted)
        }
    })
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
        matches = JSON.parse(localStorage.getItem(file_name))
        build_match_list()
    }
}

// read parameters from URL
var urlParams = new URLSearchParams(window.location.search)
const scout_pos = urlParams.get('position')
const event_id = urlParams.get('event')

// load event data on page load
window.addEventListener('load', load_event)