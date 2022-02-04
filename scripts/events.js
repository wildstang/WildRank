/**
 * file:        event.js
 * description: Displays summary event data for other events attended by current events teams.
 * author:      Liam Fruzyna
 * date:        2022-02-03
 */

// read parameters from URL
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)

const year = event_id.substr(0,4)
const start = Date.now()

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    document.body.innerHTML += build_page_frame('', [build_card('', '<div id="summary">Loading data....</div><table id="table" style="text-align: left"><tr><th>Event</th><th>Key</th><th>Start Date</th><th>Team Count</th><th>Teams</th></tr></table>')])
    let file_name = get_event_teams_name(event_id)
    if (localStorage.getItem(file_name) != null)
    {
        let events = {}
        let team_count = 0
        let teams = JSON.parse(localStorage.getItem(file_name))
        for (let team of teams)
        {
            fetch(`https://www.thebluealliance.com/api/v3/team/${team.key}/events/${year}/simple${build_query({[TBA_KEY]: API_KEY})}`)
                .then(response => {
                    if (response.status == 401) {
                        alert('Invalid API Key Suspected')
                    }
                    return response.json()
                })
                .then(data => {
                    // get teams' event codes and add team to a map
                    let team_events = data.map(e => e.event_code)
                    for (let e of team_events)
                    {
                        if (!Object.keys(events).includes(e))
                        {
                            events[e] = { teams: [team.team_number] }
                        }
                        else
                        {
                            events[e].teams.push(team.team_number)
                        }
                    }

                    // if all team events have been collected get event data
                    if (++team_count == teams.length)
                    {
                        let keys = Object.keys(events)
                        let received = 0
                        for (let e of keys)
                        {
                            fetch(`https://www.thebluealliance.com/api/v3/event/${year}${e}/simple${build_query({[TBA_KEY]: API_KEY})}`)
                                .then(response => {
                                    if (response.status == 401)
                                    {
                                        alert('Invalid API Key Suspected')
                                    }
                                    return response.json()
                                })
                                .then(data => {
                                    // data event metadata to object
                                    events[e].name = data.name
                                    events[e].start = data.start_date

                                    if (++received == keys.length)
                                    {
                                        // sort events by date then teams
                                        keys.sort((a, b) => events[b].teams.length - events[a].teams.length)
                                        keys.sort((a, b) => new Date(events[a].start) - new Date(events[b].start))

                                        // add each event to the table
                                        for (let r of keys)
                                        {
                                            let event = events[r]
                                            if (!event_id.endsWith(r))
                                            {
                                                // sort teams and add row
                                                event.teams.sort((a, b) => parseInt(a) - parseInt(b))
                                                document.getElementById('table').innerHTML += `<tr><td>${event.name}</td><td>${year}${r}</td><td>${event.start.replaceAll('2022-', '')}</td><td>${event.teams.length}</td><td>${event.teams.join(', ')}</td></tr>`
                                            }
                                            else
                                            {
                                                // add simple row for current event and update summary
                                                document.getElementById('table').innerHTML += `<tr style="background-color: gray"><td>${event.name}</td><td>${event_id}</td><td>${event.start.replaceAll('2022-', '')}</td><td>${event.teams.length}</td><td></td></tr>`
                                                document.getElementById('summary').innerHTML = `Of the ${event.teams.length} teams attending the ${event.name}...`
                                            }
                                        }
                                    }
                                })
                                .catch(err => {
                                    console.log(`Error fetching team, ${err}`)
                                })
                        }
                    }
                })
                .catch(err => {
                    console.log(`Error fetching team, ${err}`)
                })
        }
    }
}