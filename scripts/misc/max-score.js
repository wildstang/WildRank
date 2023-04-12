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
    let year = new Entry('year', 'Year', cfg.year)
    year.type = 'number'
    let entry_col = new ColumnFrame('', '', [year])
    let run = new Button('run', 'Run', 'process_year()')
    let button_col = new ColumnFrame('', '', ['<h4 class="input_label">&nbsp;</h4>', run])
    let card = new Card('card', '<div id="summary"></div><table id="table" style="text-align: right"></table>')
    document.body.innerHTML += new PageFrame('', '', [entry_col, button_col, card]).toString
}

/**
 * function:    process_year
 * parameters:  none
 * returns:     none
 * description: Counts the highest scores for the given year.
 */
function process_year()
{
    let year = document.getElementById('year').value
    document.getElementById('summary').innerHTML = 'Loading data....'
    document.getElementById('table').innerHTML = '<tr><th>Event</th><th>Match</th><th>Red Alliance</th><th>Red Score</th><th>Blue Alliance</th><th>Blue Score</th><th>Combined Score</th></tr>'

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
                        let max_match
                        for (let match of matches)
                        {
                            if (match.score_breakdown !== null)
                            {
                                match.score = match.alliances.red.score + match.alliances.blue.score
                                match.score -= match.score_breakdown.red.foulPoints + match.score_breakdown.blue.foulPoints
                                if (typeof max_match === 'undefined' || match.score > max_match.score)
                                {
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
                            // sort maxes and find highest
                            maxes.sort((a, b) => b.score - a.score)
                            let highest = maxes[0]
                            let highest_ev = events.filter(e => e.key == highest.event_key)[0]

                            // create an HTML table of scores
                            let table = ''
                            for (let match of maxes)
                            {
                                let ev = events.filter(e => e.key == match.event_key)[0]
                                let match_key = match.key.replace(`${match.event_key}_`, '')
                                let red_teams = match.alliances.red.team_keys.join('<br>').replaceAll('frc', '')
                                let red_share = match.alliances.red.score - match.score_breakdown.red.foulPoints
                                let blue_teams = match.alliances.blue.team_keys.join('<br>').replaceAll('frc', '')
                                let blue_share = match.alliances.blue.score - match.score_breakdown.blue.foulPoints
                                table += `<tr><td>${ev.name}</td><td>${match_key}</td><td>${red_teams}</td><td>${red_share}</td><td>${blue_teams}</td><td>${blue_share}</td><td>${match.score}</td></td>`
                            }

                            // populate summary and table
                            document.getElementById('table').innerHTML += table
                            document.getElementById('summary').innerHTML = `The max score for ${year} is <b>${highest.score}</b> at ${highest_ev.name}.`
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
