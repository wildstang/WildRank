const TEAM_BLOCK = "\
    <div class=\"wr_team CLASS\" onclick=\"open_team(TEAM_NUM)\">\
        <span class=\"wr_team_num\">TEAM_NUM</span>\
    </div>"

var teams;

function open_team(team_num)
{
    document.getElementById("team_num").innerHTML = team_num
}

function start_scouting()
{
    let team_num = document.getElementById("team_num").innerHTML
    window.open("scout.html?mode=pit&team=" + team_num + "&alliance=black", "_self")
}

function build_team_list()
{
    teams.forEach(function (team, index) {
        let number = team.team_number
        let scouted = "not_scouted"
        if (localStorage.getItem("pit-" + number) != null) {
            scouted = "scouted"
        }
        document.getElementById("wr_team_select").innerHTML += TEAM_BLOCK.replace(/TEAM_NUM/g, number).replace(/CLASS/g, scouted)
    })
}

function load_event()
{
    let file_name = "teams-" + event_id

    if (localStorage.getItem(file_name) != null)
    {
        teams = JSON.parse(localStorage.getItem(file_name))
        build_team_list()
    }
}

var urlParams = new URLSearchParams(window.location.search)
const event_id = urlParams.get('event')

window.addEventListener('load', load_event)