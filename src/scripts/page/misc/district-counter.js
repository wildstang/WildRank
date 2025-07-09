/**
 * file:        district-counter.js
 * description: Displays a table summarizing the number of district teams attending regionals in a given year.
 * author:      Liam Fruzyna
 * date:        2022-08-18
 */

// TBA event types
const REGIONAL = 0
const DISTRICT = 1

var summary, table

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    let year = new Entry('year', 'Year', cfg.year)
    year.type = 'number'
    let entry_col = new ColumnFrame('', '', [year])
    let run = new Button('run', 'Run', 'process_year()')
    let label = document.createElement('h4')
    label.className = 'input_label'
    label.innerHTML = '&nbsp;'
    let button_col = new ColumnFrame('', '', [label, run])
    let card_contents = document.createElement('span')
    summary = document.createElement('summary')
    table = document.createElement('table')
    table.style.textAlign = 'right'
    card_contents.append(summary, table)
    let card = new Card('card', card_contents)
    preview.append(new PageFrame('', '', [entry_col, button_col, card]).element)
}

/**
 * function:    process_year
 * parameters:  none
 * returns:     none
 * description: Counts the number of district teams at each regional.
 */
function process_year()
{
    let year = document.getElementById('year').value
    summary.innerText = 'Loading data....'

    table.insertRow().append(create_header('Regional'), create_header('Location'), create_header('Total Teams'), create_header('District Teams'), create_header('Percent District'))

    if (!TBA_KEY)
    {
        if (cfg.user.settings && cfg.user.settings.keys && cfg.user.settings.tba_key)
        {
            TBA_KEY = cfg.user.settings.tba_key
        }
        if (!TBA_KEY)
        {
            alert('No API key found for TBA!')
            return
        }
    }

    let district_teams = []
    let regionals = {}
    let processed = 0

    // fetch list of all events in the year
    fetch(`https://www.thebluealliance.com/api/v3/events/${year}/simple${build_query({[TBA_AUTH_KEY]: TBA_KEY})}`)
        .then(response => {
            if (response.status === 401) {
                alert('Invalid API Key Suspected')
            }
            return response.json()
        })
        .then(events => {
            let evs = events.filter(e => [REGIONAL, DISTRICT].includes(e.event_type))
            for (let event of evs)
            {
                // fetch list of teams in each event
                fetch(`https://www.thebluealliance.com/api/v3/event/${event.key}/teams/keys${build_query({[TBA_AUTH_KEY]: TBA_KEY})}`)
                    .then(response => {
                        if (response.status === 401) {
                            alert('Invalid API Key Suspected')
                        }
                        return response.json()
                    })
                    .then(teams => {
                        // store teams and location of regional
                        if (event.event_type === REGIONAL)
                        {
                            regionals[event.key] = {
                                teams: teams,
                                location: `${event.city}, ${event.state_prov}, ${event.country}`
                            }
                        }
                        // build list of unique district teams
                        else if (event.event_type === DISTRICT)
                        {
                            for (let team of teams)
                            {
                                if (!district_teams.includes(team))
                                {
                                    district_teams.push(team)
                                }
                            }
                            district_teams[event.key] = teams
                        }

                        // when all events have been processed
                        if (++processed === evs.length)
                        {
                            let unique_district_teams = []
                            let district_regionals = 0
                            let total_district_teams = 0
                            let total_regional_teams = 0
                            let keys = Object.keys(regionals).sort()
                            for (let event of keys)
                            {
                                // count district teams in regional
                                let district_count = 0
                                for (let team of regionals[event].teams)
                                {
                                    if (district_teams.includes(team))
                                    {
                                        district_count++
                                        if (!unique_district_teams.includes(team))
                                        {
                                            unique_district_teams.push(team)
                                        }
                                    }
                                }

                                // count number of regionals with district teams and add the regional to the table
                                if (district_count > 0)
                                {
                                    district_regionals++
                                    let row = table.insertRow()
                                    row.insertCell().innerText = event
                                    row.insertCell().innerText = regionals[event].location
                                    row.insertCell().innerText = regionals[event].teams.length
                                    row.insertCell().innerText = district_count
                                    row.insertCell().innerText = (100 * district_count / regionals[event].teams.length).toFixed(2)
                                }
                                
                                // add to totals of teams
                                total_district_teams += district_count
                                total_regional_teams += regionals[event].teams.length
                            }

                            // add summary info
                            let row = table.insertRow()
                            row.insertCell().innerText = 'Total'
                            row.insertCell()
                            row.insertCell().innerText = total_regional_teams
                            row.insertCell().innerText = total_district_teams
                            row.insertCell().innerText = (100 * total_district_teams / total_regional_teams).toFixed(2)
                            summary.innerHTML = `There were ${district_regionals} regionals that included teams from districts in ${year}.<br>${total_district_teams} spots at these regionals were filled by ${unique_district_teams.length} district teams (${(total_district_teams/unique_district_teams.length).toFixed(1)} regionals / team).`
                        }
                    })
                    .catch(err => {
                        console.log(`Error fetching ${event.event_key} teams, ${err}`)
                        processed++
                    })
            }
        })
        .catch(err => {
            console.log(`Error fetching ${year} events, ${err}`)
        })
}