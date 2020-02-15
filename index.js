const API_KEY = ""

function load_event()
{
    let event_id = document.getElementById("event_id").value

    fetch("https://www.thebluealliance.com/api/v3/event/" + event_id + "/matches/simple?X-TBA-Auth-Key=" + API_KEY)
        .then(response => {
            return response.json()
        })
        .then(data => {
            console.log("Got matches")
            matches = data.sort(function (a, b) {
                return b.match_number < a.match_number ?  1
                        : b.match_number > a.match_number ? -1
                        : 0;
            });
            localStorage.setItem("matches-" + event_id, JSON.stringify(matches))
        })
        .catch(err => {
            console.log("Error loading matches: " + err)
        })

    fetch("https://www.thebluealliance.com/api/v3/event/" + event_id + "/teams/simple?X-TBA-Auth-Key=" + API_KEY)
        .then(response => {
            return response.json()
        })
        .then(data => {
            console.log("Got teams")
            teams = data.sort(function (a, b) {
                return b.team_number < a.team_number ?  1
                        : b.team_number > a.team_number ? -1
                        : 0;
            });
            localStorage.setItem("teams-" + event_id, JSON.stringify(teams))
        })
        .catch(err => {
            console.log("Error loading teams: " + err)
        })
}