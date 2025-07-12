/**
 * file:        international-counter.js
 * description: Displays a table summarizing the number of international teams attending regionals in a given year.
 * author:      Liam Fruzyna
 * date:        2022-08-21
 */

// TBA event types
const REGIONAL = 0
const TURKIYE = ['Türkiye', 'Turkiye', 'Turkey']

var summary, table, year_el

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    year_el = new WREntry('Year', cfg.year)
    year_el.type = 'number'
    let entry_col = new WRColumn('', [year_el])
    let run = new WRButton('Run', process_year)
    let label = document.createElement('h4')
    label.className = 'input_label'
    label.innerHTML = '&nbsp;'
    let button_col = new WRColumn('', [label, run])
    let card_contents = document.createElement('span')
    summary = document.createElement('summary')
    table = document.createElement('table')
    table.style.textAlign = 'right'
    card_contents.append(summary, table)
    let card = new WRCard(card_contents)
    preview.append(new WRPage('', [entry_col, button_col, card]))
}

/**
 * function:    process_year
 * parameters:  none
 * returns:     none
 * description: Counts the number of district teams at each regional.
 */
function process_year()
{
    let year = year_el.element.value
    summary.innerText = 'Loading data....'

    table.append(create_header_row(['Regional', 'Location', 'Total Teams', 'International Teams', 'Percent International']))

    // request the TBA key if it doesn't already exist
    let key_query = cfg.tba_query
    if (!key_query)
    {
        return
    }

    let regionals = {}
    let processed = 0

    // fetch list of all events in the year
    fetch(`https://www.thebluealliance.com/api/v3/events/${year}/simple${key_query}`)
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
                fetch(`https://www.thebluealliance.com/api/v3/event/${event.key}/teams/simple${key_query}`)
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
                            if (team.country !== event.country && !(TURKIYE.includes(team.country) && TURKIYE.includes(event.country)) && !(team.country === 'Chinese Taipei' && event.country === 'Taiwan'))
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
                            let keys = Object.keys(regionals)
                            for (let event of keys)
                            {
                                regionals[event].percent = (100 * regionals[event].international / regionals[event].teams).toFixed(2)
                            }
                            keys.sort((a,b) => regionals[b].percent - regionals[a].percent)

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