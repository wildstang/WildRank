/**
 * file:        international-counter.js
 * description: Displays a table summarizing the number of international teams attending regionals in a given year.
 * author:      Liam Fruzyna
 * date:        2022-08-21
 */

// TBA event types
const REGIONAL = 0

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    let card = new Card('card', '<div id="summary">Loading data....</div><table id="table" style="text-align: right"><tr><th>Regional</th><th>Location</th><th>Total Teams</th><th>International Teams</th><th>Percent International</th></tr></table>')
    document.body.innerHTML += new PageFrame('', '', [card]).toString

    // read year from URL or use current year
    let urlParams = new URLSearchParams(window.location.search)
    let year = urlParams.get('year')
    if (year === null)
    {
        year = cfg.year
    }
    process_year(year)
}

/**
 * function:    process_year
 * parameters:  year to build the table for
 * returns:     none
 * description: Counts the number of district teams at each regional.
 */
function process_year(year)
{
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
                            if (team.country !== event.country)
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
                                document.getElementById('table').innerHTML += `<tr><td>${event}</td><td>${regionals[event].location}</td><td>${regionals[event].teams}</td><td>${international}</td><td>${(100*international/regionals[event].teams).toFixed(2)}</td></tr>`
                            }

                            // add summary info
                            document.getElementById('summary').innerHTML = `There were ${keys.length} regionals featuring ${total} total international teams in ${year}.`
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