/**
 * file:        match-counter.js
 * description: Displays a table summarizing the number of matches each year.
 * author:      Liam Fruzyna
 * date:        2022-05-19
 */

// TBA event types
const REGIONAL = 0
const DISTRICT = 1
const DISTRICT_CMP = 2
const CMP_DIVISION = 3
const CMP_FINALS = 4
const DISTRICT_CMP_DIVISION = 5
const FOC = 6
// ignored event types
const REMOTE = 7
const OFFSEASON = 99
const PRESEASON = 100
const UNLABLED = -1

// first year to count
const FIRST_YEAR = 2002

var summary, table

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    let card_contents = document.createElement('span')
    summary = document.createElement('summary')
    table = document.createElement('table')
    table.style.textAlign = 'right'
    card_contents.append(summary, table)
    let card = new Card('card', card_contents)
    preview.append(new PageFrame('', '', [card]).element)
    table.append(create_header_row(['Year', 'Matches', 'Regional Matches', 'District Matches', 'District Champs Matches', 'Champs Matches']))

    process_year(FIRST_YEAR)
}

// total matches across all years
var total = 0

/**
 * function:    process_year
 * parameters:  year to add to table
 * returns:     none
 * description: Counts the number of matches in a given year.
 */
function process_year(year)
{
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

    fetch(`https://www.thebluealliance.com/api/v3/events/${year}/simple${build_query({[TBA_AUTH_KEY]: TBA_KEY})}`)
        .then(response => {
            if (response.status === 401) {
                alert('Invalid API Key Suspected')
            }
            return response.json()
        })
        .then(events => {
            let counts = [0, 0, 0, 0, 0, 0, 0]
            let processed = 0
            for (let event of events)
            {
                // only use some event types
                if (event.event_type >= REGIONAL && event.event_type <= FOC)
                {
                    fetch(`https://www.thebluealliance.com/api/v3/event/${event.key}/matches/simple${build_query({[TBA_AUTH_KEY]: TBA_KEY})}`)
                        .then(response => {
                            if (response.status === 401) {
                                alert('Invalid API Key Suspected')
                            }
                            return response.json()
                        })
                        .then(matches => {
                            // count all matches at event
                            counts[event.event_type] += matches.length

                            // if all events are processed
                            if (++processed === events.length)
                            {
                                // total up matches
                                let annual_total = counts.reduce((a, b) => a + b)
                                total += annual_total
                                // add to page
                                let row = table.insertRow()
                                row.insertCell().innerText = year
                                row.insertCell().innerText = annual_total
                                row.insertCell().innerText = counts[REGIONAL]
                                row.insertCell().innerText = counts[DISTRICT]
                                row.insertCell().innerText = counts[DISTRICT_CMP_DIVISION] + counts[DISTRICT_CMP]
                                row.insertCell().innerText = counts[CMP_DIVISION] + counts[CMP_FINALS] + counts[FOC]
                                // count next year
                                if (year < cfg.year)
                                {
                                    process_year(++year)
                                }
                                // label as complete
                                else
                                {
                                    summary.innerHTML = `From ${FIRST_YEAR} through ${cfg.year} ${total} FRC matches were completed.<br>This data includes all matches not categorized as REMOTE, OFFSEASON, PRESEASON, or UNLABELED.`
                                }
                            }
                        })
                        .catch(err => {
                            console.log(`Error fetching ${event.event_key} matches, ${err}`)
                        })
                }
                else
                {
                    processed++
                }
            }
        })
        .catch(err => {
            console.log(`Error fetching ${year} events, ${err}`)
        })
}