
const MATCH_BLOCK = "\
    <div class=\"wr_match\" onclick=\"open_match(MATCH_NUM)\">\
        <span class=\"wr_match_num\">QMATCH_NUM</span>\
        <span>\
            <div class=\"wr_teams blue\">BLUE_TEAMS</div>\
            <div class=\"wr_teams red\">RED_TEAMS</div>\
        </span>\
    </div>"

const API_KEY = ""

var matches;

function open_match(match_num)
{
    var team = ""
    matches.forEach(function (match, index) {
        let level = match.comp_level
        let number = match.match_number
        let red_teams = match.alliances.red.team_keys
        let blue_teams = match.alliances.blue.team_keys
        if (level == "qm" && number == match_num)
        {
            let selected = document.getElementById("position").selectedIndex
            if (selected > 2)
            {
                selected -= 3
                team = blue_teams[selected]
            }
            else
            {
                team = red_teams[selected]
            }
        }
    })
    console.log("Scouting: " + team)
}

function build_match_list()
{
    matches.forEach(function (match, index) {
        let level = match.comp_level
        let number = match.match_number
        let red_teams = match.alliances.red.team_keys
        let blue_teams = match.alliances.blue.team_keys
        if (level == "qm")
        {
            document.body.innerHTML += MATCH_BLOCK.replace(/MATCH_NUM/g, number).replace(/BLUE_TEAMS/g, blue_teams.join(" | ")).replace(/RED_TEAMS/g, red_teams.join(" | ")).replace(/frc/g, "")
        }
    })
}

function load_event()
{
    let event_id = document.getElementById("event_id").value
    let event_year = document.getElementById("event_year").value

    fetch("https://www.thebluealliance.com/api/v3/event/" + event_year + event_id + "/matches?X-TBA-Auth-Key=" + API_KEY)
        .then(response => {
            return response.json()
        })
        .then(data => {
            matches = data.sort(function (a, b) {
                return b.match_number < a.match_number ?  1
                     : b.match_number > a.match_number ? -1
                     : 0;
            });
            build_match_list()
        })
        .catch(err => {
            console.log("Error config file")
        })
}