/**
 * file:        max-score.js
 * description: Displays a table summarizing the max combined score without fouls at each event.
 * author:      Liam Fruzyna
 * date:        2023-04-02
 */

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    let summary = '<div id="summary">Loading data....</div>'
    let table = '<table id="table" style="text-align: right"><tr><th>Event</th><th>Match</th><th>Red Alliance</th><th>Red Score</th><th>Blue Alliance</th><th>Blue Score</th><th>Combined Score</th></tr></table>'
    let card = new Card('card', summary + table)
    document.body.innerHTML += new PageFrame('', '', [card]).toString

    process_year(cfg.year)
}

/**
 * function:    process_year
 * parameters:  year to add to table
 * returns:     none
 * description: Counts the highest scores for the given year.
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

    fetch(`https://www.thebluealliance.com/api/v3/events/${year}${build_query({[TBA_AUTH_KEY]: TBA_KEY})}`)
        .then(response => {
            if (response.status === 401) {
                alert('Invalid API Key Suspected')
            }
            return response.json()
        })
        .then(events => {
            let maxes = []
            let count = 0
            for (let event of events)
            {
                fetch(`https://www.thebluealliance.com/api/v3/event/${event.key}/matches${build_query({[TBA_AUTH_KEY]: TBA_KEY})}`)
                    .then(response => {
                        if (response.status === 401) {
                            alert('Invalid API Key Suspected')
                        }
                        return response.json()
                    })
                    .then(matches => {
                        // find the highest score at the event
                        let max_event = 0
                        let max_match
                        for (let match of matches)
                        {
                            if (match.score_breakdown !== null)
                            {
                                let score = match.alliances.red.score + match.alliances.blue.score
                                score -= match.score_breakdown.red.foulPoints + match.score_breakdown.blue.foulPoints
                                if (score > max_event)
                                {
                                    max_event = score
                                    max_match = match
                                }
                            }
                        }

                        // add the match to the list
                        if (typeof max_match !== 'undefined')
                        {
                            maxes.push(max_match)
                        }

                        // wait for every event to be counted
                        if (++count === events.length)
                        {
                            let overall_max = 0
                            let max_event = ''
                            let table = ''
                            for (let match of maxes)
                            {
                                // find the match's event
                                let ev = events.filter(e => e.key == match.event_key)[0]

                                // search for the highest overall score
                                let score = match.alliances.red.score - match.score_breakdown.red.foulPoints + match.alliances.blue.score - match.score_breakdown.blue.foulPoints
                                if (score > overall_max)
                                {
                                    overall_max = score
                                    max_event = ev.name
                                }

                                // add a row to the table
                                table += `<tr><td>${ev.name}</td><td>${match.key.replace(`${match.event_key}_`, '')}</td><td>${match.alliances.red.team_keys.join('<br>').replaceAll('frc', '')}</td><td>${match.alliances.red.score - match.score_breakdown.red.foulPoints}</td><td>${match.alliances.blue.team_keys.join('<br>').replaceAll('frc', '')}</td><td>${match.alliances.red.score - match.score_breakdown.red.foulPoints}</td><td>${score}</td></td>`
                            }

                            // populate summary and table
                            document.getElementById('table').innerHTML += table
                            document.getElementById('summary').innerHTML = `The max score for ${year} is <b>${overall_max}</b> at ${max_event}.`
                        }
                    })
                    .catch(err => {
                        console.log(`Error fetching ${event.event_key} matches, ${err}`)
                    })
            }
        })
        .catch(err => {
            console.log(`Error fetching ${year} events, ${err}`)
        })
}
