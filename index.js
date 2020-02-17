var qrcode

function load_event()
{
    console.log("Loading event data...")
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

function get_type()
{
    return document.getElementById("type").checked ? "match" : "pit"
}

function upload_all()
{
    let type = get_type()
    let files = Object.keys(localStorage)
    files.forEach(function (file, index)
    {
        if (file.startsWith(type + "-"))
        {
            upload = file + "|||" + localStorage.getItem(file)
            console.log("posting " + file)
            fetch('localhost', {method: "POST", body: upload})
        }
    })
}

function merge_results()
{
    let type = get_type()
    let files = Object.keys(localStorage)
    let combo = {}
    files.forEach(function (file, index)
    {
        if (file.startsWith(type + "-"))
        {
            combo[file] = localStorage.getItem(file)
        }
    })
    return combo
}

function build_qr(type)
{
    qrcode.clear()
    qrcode.makeCode(JSON.stringify(merge_results(type)))
}

window.addEventListener('load', function() {
    qrcode = new QRCode(document.getElementById("qrcode"), {width:512, height:512})
})