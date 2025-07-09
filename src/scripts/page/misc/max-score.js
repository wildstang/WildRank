/**
 * file:        max-score.js
 * description: Displays a table summarizing the max combined score without fouls at each event.
 * author:      Liam Fruzyna
 * date:        2023-04-02
 */

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
 * description: Counts the highest scores for the given year.
 */
function process_year()
{
    let year = document.getElementById('year').value
    summary.innerHTML = 'Loading data....'

    table.append(create_header_row(['Event', 'Match', 'Red Alliance', 'Red Score', 'Blue Alliance', 'Blue Score', 'Combined Score']))

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
                            for (let match of maxes)
                            {
                                let ev = events.filter(e => e.key == match.event_key)[0]
                                let match_key = match.key.replace(`${match.event_key}_`, '')
                                let red_teams = match.alliances.red.team_keys.join('<br>').replaceAll('frc', '')
                                let red_share = match.alliances.red.score - match.score_breakdown.red.foulPoints
                                let blue_teams = match.alliances.blue.team_keys.join('<br>').replaceAll('frc', '')
                                let blue_share = match.alliances.blue.score - match.score_breakdown.blue.foulPoints

                                let row = table.insertRow()
                                row.insertCell().innerText = ev.name
                                row.insertCell().innerText = match_key
                                row.insertCell().innerHTML = red_teams
                                row.insertCell().innerText = red_share
                                row.insertCell().innerHTML = blue_teams
                                row.insertCell().innerText = blue_share
                                row.insertCell().innerText = match.score
                            }

                            // populate summary and table
                            summary.innerHTML = `The max score for ${year} is <b>${highest.score}</b> at ${highest_ev.name}.`
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
