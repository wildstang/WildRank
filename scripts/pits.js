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

const OPEN_RESULT = "\
    <div class=\"wr_button\" id=\"open_result\" onclick=\"open_result('RESULT')\">\
        <label>View Results</label>\
    </div>"

var teams

/**
 * function:    open_team
 * parameters:  Selected team number
 * returns:     none
 * description: Completes right info pane for a given team number.
 */
function open_team(team_num)
{
    if (document.getElementById("open_result") !== null)
    {
        document.getElementById("open_result").remove()
    }
    document.getElementById("team_num").innerHTML = team_num
    document.getElementById("team_" + team_num).classList.add("selected")
    teams.forEach(function (team, index) {
        let number = team.team_number
        if (number != team_num && document.getElementById("team_" + number).classList.contains("selected"))
        {
            document.getElementById("team_" + number).classList.remove("selected")
        }
    })

    let file = "pit-" + event_id + "-" + team_num
    if (localStorage.getItem(file) !== null)
    {
        document.getElementById("preview").innerHTML += OPEN_RESULT.replace(/RESULT/g, file)
    }
}

function open_result(file)
{
    document.location.href = "/results.html?type=pit&event=" + event_id + "&file=" + file
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
    window.open("scout.html?mode=pit&team=" + team_num + "&alliance=white&position=0&event=" + event_id + "&user=" + user_id, "_self")
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
        if (localStorage.getItem(["pit", event_id, number].join("-")) != null)
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
    let file_name = "teams-" + event_id

    if (localStorage.getItem(file_name) != null)
    {
        teams = JSON.parse(localStorage.getItem(file_name))
        build_team_list()
    }
}

// read parameters from URL
var urlParams = new URLSearchParams(window.location.search)
const event_id = urlParams.get('event')
const user_id = urlParams.get('user')

// load event data on page load
window.addEventListener('load', load_event)