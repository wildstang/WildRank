const MATCH_BLOCK = "\
    <div class=\"wr_match CLASS\" onclick=\"open_match(MATCH_NUM)\">\
        <span class=\"wr_match_num\">QMATCH_NUM</span>\
        <span>\
            <div class=\"wr_teams blue\">BLUE_TEAMS</div>\
            <div class=\"wr_teams red\">RED_TEAMS</div>\
        </span>\
    </div>"

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
            let selected = scout_pos
            if (selected > 2)
            {
                selected -= 3
                team = blue_teams[selected]
                document.getElementById("team_scouting").style.color = 'blue'
            }
            else
            {
                team = red_teams[selected]
                document.getElementById("team_scouting").style.color = 'red'
            }
        }
    })
    document.getElementById("match_num").innerHTML = match_num
    document.getElementById("team_scouting").innerHTML = team.substr(3)
}

function start_scouting()
{
    let match_num = document.getElementById("match_num").innerHTML
    let team_num = document.getElementById("team_scouting").innerHTML
    let color = document.getElementById("team_scouting").style.color
    window.open("scout.html?mode=match&match=" + match_num + "&team=" + team_num + "&alliance=" + color, "_self")
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
            let team = ""
            if (scout_pos >= 3)
            {
                team = blue_teams[scout_pos - 3]
            }
            else
            {
                team = red_teams[scout_pos]
            }
            team = team.substr(3)
            scouted = "not_scouted"
            if (localStorage.getItem("match-" + number + '-' + team) != null) {
                scouted = "scouted"
            }
            document.getElementById("wr_match_select").innerHTML += MATCH_BLOCK.replace(/MATCH_NUM/g, number).replace(/BLUE_TEAMS/g, blue_teams.join(" | ")).replace(/RED_TEAMS/g, red_teams.join(" | ")).replace(/frc/g, "").replace(/CLASS/g, scouted)
        }
    })
}

function load_event()
{
    let file_name = "matches-" + event_id

    if (localStorage.getItem(file_name) != null)
    {
        matches = JSON.parse(localStorage.getItem(file_name))
        build_match_list()
    }
}

var urlParams = new URLSearchParams(window.location.search)
const scout_pos = urlParams.get('position')
const event_id = urlParams.get('event')

window.addEventListener('load', load_event)