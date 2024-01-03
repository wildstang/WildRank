/**
 * file:        international-counter.js
 * description: Displays a table summarizing the number of international teams attending regionals in a given year.
 * author:      Liam Fruzyna
 * date:        2022-08-21
 */

// TBA event types
const REGIONAL = 0
const TURKIYE = ['Türkiye', 'Turkiye', 'Turkey']

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
    document.body.append(new PageFrame('', '', [entry_col, button_col, card]).element)
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

    table.insertRow().append(create_header('Regional'), create_header('Location'), create_header('Total Teams'), create_header('International Teams'), create_header('Percent International'))

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
            let regional_events = events.filter(e => e.event_type === REGIONAL && e.key !== '2022zhha')
            for (let event of regional_events)
            {
                // fetch list of teams in each event
                fetch(`https://www.thebluealliance.com/api/v3/event/${event.key}/teams/simple${build_query({[TBA_AUTH_KEY]: TBA_KEY})}`)
                    .then(response => {
                        if (response.status === 401) {
                            alert('Invalid API Key Suspected')
                        }
                        return response.json()
                    })
                    .then(teams => {
                        // find events featuring international teams and count
                        for (let team of teams)
                        {
                            // turkiye has 3 different spellings and that was messing up the data
                            if (team.country !== event.country && !(TURKIYE.includes(team.country) && TURKIYE.includes(event.country)))
                            {
                                if (!regionals.hasOwnProperty(event.key))
                                {
                                    regionals[event.key] = {
                                        location: `${event.city}, ${event.state_prov}, ${event.country}`,
                                        teams: teams.length,
                                        international: 0
                                    }
                                }
                                regionals[event.key].international++
                            }
                        }

                        // when all events have been processed
                        if (++processed === regional_events.length)
                        {
                            let keys = Object.keys(regionals).sort()
                            let total = 0
                            for (let event of keys)
                            {
                                let international = regionals[event].international
                                total += international
                                let row = table.insertRow()
                                row.insertCell().innerText = event
                                row.insertCell().innerText = regionals[event].location
                                row.insertCell().innerText = regionals[event].teams
                                row.insertCell().innerText = international
                                row.insertCell().innerText = (100 * international / regionals[event].teams).toFixed(2)
                            }

                            // add summary info
                            summary.innerText = `There were ${keys.length} regionals featuring ${total} total international teams in ${year}.`
                        }
                    })
                    .catch(err => {
                        console.log(`Error fetching ${event.event_key} teams, ${err}`)
                    })
            }
        })
        .catch(err => {
            console.log(`Error fetching ${year} events, ${err}`)
        })
}