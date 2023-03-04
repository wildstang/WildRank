/**
 * file:        event.js
 * description: Displays summary event data for other events attended by current events teams.
 * author:      Liam Fruzyna
 * date:        2022-02-03
 */


/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    let card = new Card('card', '<div id="summary">Loading data....</div><table id="table" style="text-align: left"><tr><th>Event</th><th>Key</th><th>Start Date</th><th>Team Count</th><th>Teams</th></tr></table>')
    document.body.innerHTML += new PageFrame('', '', [card]).toString

    let teams = Object.keys(dal.teams)
    if (teams.length > 0)
    {
        let firsts = []
        let events = {}
        let team_count = 0

        if (!TBA_KEY)
        {
            let file = cfg.keys
            if (file != null)
            {
                if (cfg.keys.hasOwnProperty('tba'))
                {
                    TBA_KEY = cfg.keys.tba
                }
            }
            if (!TBA_KEY)
            {
                alert('No API key found for TBA!')
                return
            }
        }
        
        for (let team of teams)
        {
            fetch(`https://www.thebluealliance.com/api/v3/team/frc${team}/events/${cfg.year}/simple${build_query({[TBA_AUTH_KEY]: TBA_KEY})}`)
                .then(response => {
                    if (response.status == 401) {
                        alert('Invalid API Key Suspected')
                    }
                    return response.json()
                })
                .then(data => {
                    let earliest = ''
                    for (let d of data)
                    {
                        let e = d.event_code
                        if (!Object.keys(events).includes(e))
                        {
                            events[e] = { teams: {} }
                            events[e].name = d.name
                            events[e].start = d.start_date
                        }
                        events[e].teams[team] = {
                            award: '',
                            label: ''
                        }
                        if (earliest === '' || new Date(events[earliest].start) > new Date(d.start_date))
                        {
                            earliest = e
                        }
                    }

                    // add team to list if the current event is their first
                    if (dal.event_id.endsWith(earliest))
                    {
                        firsts.push(team)
                    }

                    // if all team events have been collected get event data
                    if (++team_count == Object.keys(teams).length)
                    {
                        let keys = Object.keys(events)
                        let received = 0
                        for (let e of keys)
                        {
                            fetch(`https://www.thebluealliance.com/api/v3/event/${cfg.year}${e}/awards${build_query({[TBA_AUTH_KEY]: TBA_KEY})}`)
                                .then(response => {
                                    if (response.status == 401)
                                    {
                                        alert('Invalid API Key Suspected')
                                    }
                                    return response.json()
                                })
                                .then(data => {
                                    for (let award of data)
                                    {
                                        switch (award.award_type)
                                        {
                                            case 1:
                                            case 2:
                                                // winner and finalist
                                                for (let i in award.recipient_list)
                                                {
                                                    let team = award.recipient_list[i].team_key.substr(3)
                                                    if (Object.keys(events[e].teams).includes(team) && events[e].teams[team].award == '')
                                                    {
                                                        if (award.award_type == 1)
                                                        {
                                                            events[e].teams[team].award = 'background-color: #0f4bcb; color: #ffffff'
                                                        }
                                                        else
                                                        {
                                                            events[e].teams[team].award = 'background-color: #ff4136; color: #ffffff'
                                                        }
                                                        switch (parseInt(i))
                                                        {
                                                            case 0:
                                                                events[e].teams[team].label = '(C)'
                                                                break
                                                            case 1:
                                                            case 2:
                                                            case 3:
                                                                events[e].teams[team].label = `(${i})`
                                                                break
                                                        }
                                                    }
                                                }
                                                break
                                            case 9:
                                                // ei
                                                for (let i in award.recipient_list)
                                                {
                                                    let team = award.recipient_list[i].team_key.substr(3)
                                                    if (Object.keys(events[e].teams).includes(team) && events[e].teams[team].award == '')
                                                    {
                                                        events[e].teams[team].award = 'background-color: #c0c0c0; color: #000000'
                                                    }
                                                }
                                        }
                                    }

                                    if (++received == keys.length)
                                    {
                                        console.log(events)
                                        // sort events by date then teams
                                        keys.sort((a, b) => Object.keys(events[b].teams).length - Object.keys(events[a].teams).length)
                                        keys.sort((a, b) => new Date(events[a].start) - new Date(events[b].start))

                                        // add each event to the table
                                        for (let r of keys)
                                        {
                                            let event = events[r]
                                            let keys = Object.keys(event.teams)
                                            if (!dal.event_id.endsWith(r))
                                            {
                                                // sort teams and add row
                                                keys.sort((a, b) => parseInt(a) - parseInt(b))
                                                let teams = keys.map(t => `<span style="${event.teams[t].award}">${t}${event.teams[t].label}</span>`).join(', ')
                                                document.getElementById('table').innerHTML += `<tr><td>${event.name}</td><td>${cfg.year}${r}</td><td>${event.start.replaceAll(`${cfg.year}-`, '')}</td><td>${keys.length}</td><td>${teams}</td></tr>`
                                            }
                                            else
                                            {
                                                // add simple row for current event and update summary
                                                firsts.sort((a, b) => parseInt(a) - parseInt(b))
                                                let teams = firsts.join(', ')
                                                document.getElementById('table').innerHTML += `<tr style="background-color: gray"><td>${event.name}</td><td>${dal.event_id}</td><td>${event.start.replaceAll(`${cfg.year}-`, '')}</td><td>${keys.length}</td><td>${teams}</td></tr>`
                                                document.getElementById('summary').innerHTML = `Of the ${keys.length} teams attending the ${event.name}...`
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
    else
    {
        document.getElementById('summary').innerHTML = 'No teams found'
    }
}