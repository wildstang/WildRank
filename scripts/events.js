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
    let contents = document.createElement('span')
    let summary = document.createElement('div')
    summary.innerText = 'Loading data...'
    let table = document.createElement('table')
    table.style.textAlign = 'left'
    contents.append(summary, table)

    let header = table.insertRow()
    header.append(create_header('Event'), create_header('Key'), create_header('Start Date'), create_header('Team Count'), create_header('Teams'))

    let card = new Card('card', contents)
    document.body.append(new PageFrame('', '', [card]).element)

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
                        let event_keys = Object.keys(events)
                        let received = 0
                        for (let e of event_keys)
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
                                                            events[e].teams[team].award = 'winner'
                                                        }
                                                        else
                                                        {
                                                            events[e].teams[team].award = 'finalist'
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
                                                        events[e].teams[team].award = 'ei'
                                                    }
                                                }
                                        }
                                    }

                                    if (++received == event_keys.length)
                                    {
                                        console.log(events)
                                        // sort events by date then teams
                                        event_keys.sort((a, b) => Object.keys(events[b].teams).length - Object.keys(events[a].teams).length)
                                        event_keys.sort((a, b) => new Date(events[a].start) - new Date(events[b].start))

                                        // add each event to the table
                                        for (let r of event_keys)
                                        {
                                            let event = events[r]
                                            let team_keys = Object.keys(event.teams)
                                            let row = table.insertRow()
                                            if (dal.event_id.endsWith(r))
                                            {
                                                summary.innerText = `Of the ${team_keys.length} teams attending the ${event.name}...`
                                                row.style.backgroundColor = 'gray'
                                                // only show first event teams for current event
                                                team_keys = firsts
                                            }
                                            // sort teams and add row
                                            team_keys.sort((a, b) => parseInt(a) - parseInt(b))
                                            row.insertCell().innerText = event.name
                                            row.insertCell().innerText = r
                                            row.insertCell().innerText = event.start.replaceAll(`${cfg.year}-`, '')
                                            row.insertCell().innerText = team_keys.length
                                            let teams = row.insertCell()
                                            for (let t of team_keys)
                                            {
                                                let span = document.createElement('span')
                                                if (event.teams[t].award === 'winner')
                                                {
                                                    span.style.backgroundColor = '#0f4bcb'
                                                    span.style.color = '#ffffff'
                                                }
                                                else if (event.teams[t].award === 'finalist')
                                                {
                                                    span.style.backgroundColor = '#ff4136'
                                                    span.style.color = '#ffffff'
                                                }
                                                else if (event.teams[t].award === 'ei')
                                                {
                                                    span.style.backgroundColor = '#c0c0c0'
                                                    span.style.color = '#000000'
                                                }
                                                span.innerText = `${t}${event.teams[t].label}`
                                                teams.append(span)
                                                if (team_keys.indexOf(t) !== team_keys.length - 1)
                                                {
                                                    teams.append(', ')
                                                }
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
        summary.innerText = 'No teams found'
    }
}