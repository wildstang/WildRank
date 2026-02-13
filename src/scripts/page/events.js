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
    header_info.innerText = 'Other Events'

    let contents = document.createElement('span')
    let summary = document.createElement('div')
    summary.innerText = 'Loading data...'
    let table = document.createElement('table')
    table.style.textAlign = 'left'
    contents.append(summary, table)

    table.append(create_header_row(['Key', 'Event', 'Start Date', 'Team Count', 'Teams']))

    let card = new WRCard(contents)

    let key = document.createElement('table')
    let row = key.insertRow()
    let cell = row.insertCell()
    cell.innerText = 'Event Winner'
    cell.style.backgroundColor = '#0f4bcb'
    cell.style.color = '#FFFFFF'
    cell = row.insertCell()
    cell.innerText = 'Event Finalist'
    cell.style.backgroundColor = '#ff4136'
    cell.style.color = '#FFFFFF'
    cell = row.insertCell()
    cell.innerText = 'Impact Winner'
    cell.style.backgroundColor = '#ffbf00'
    cell = row.insertCell()
    cell.innerText = 'EI Winner'
    cell.style.backgroundColor = '#c0c0c0'
    cell = row.insertCell()
    cell.innerText = 'Only Event'
    cell.style.backgroundColor = '#008000'
    cell.style.color = '#FFFFFF'
    preview.append(new WRPage('', [new WRCard(key), card]))

    let teams = dal.team_numbers
    if (teams.length > 0)
    {
        let firsts = []
        let events = {}
        let team_count = 0
        let team_events = {}

        let key_query = cfg.tba_query
        if (!key_query)
        {
            return
        }

        for (let team of teams)
        {
            fetch(`https://www.thebluealliance.com/api/v3/team/frc${team}/events/${cfg.year}/simple${key_query}`)
                .then(response => {
                    if (response.status == 401) {
                        alert('Invalid API Key Suspected')
                    }
                    return response.json()
                })
                .then(data => {
                    team_events[team] = data.map(d => d.event_code)
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
                            fetch(`https://www.thebluealliance.com/api/v3/event/${cfg.year}${e}/awards${key_query}`)
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
                                                    let team = award.recipient_list[i].team_key.substring(3)
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
                                            case 0:
                                            case 9:
                                                // impact and ei
                                                for (let i in award.recipient_list)
                                                {
                                                    let team = award.recipient_list[i].team_key.substring(3)
                                                    if (Object.keys(events[e].teams).includes(team) && events[e].teams[team].award == '')
                                                    {
                                                        if (award.award_type == 0)
                                                        {
                                                            events[e].teams[team].award = 'impact'
                                                        }
                                                        else if (award.award_type == 9)
                                                        {
                                                            events[e].teams[team].award = 'ei'
                                                        }
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
                                            row.insertCell().innerText = r
                                            row.insertCell().append(create_header(event.name))
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
                                                else if (event.teams[t].award === 'impact')
                                                {
                                                    span.style.backgroundColor = '#ffbf00'
                                                    span.style.color = '#000000'
                                                }
                                                else if (event.teams[t].award === 'ei')
                                                {
                                                    span.style.backgroundColor = '#c0c0c0'
                                                    span.style.color = '#000000'
                                                }
                                                else if (team_events[t].length == 1)
                                                {
                                                    span.style.backgroundColor = '#008000'
                                                    span.style.color = '#ffffff'
                                                }
                                                span.innerText = `${t}${event.teams[t].label}`
                                                span.title = dal.teams[t].name
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