/**
 * file:        score-counter.js
 * description: Displays a table summarizing the average score each year.
 * author:      Liam Fruzyna
 * date:        2022-08-19
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

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    let summary = '<div id="summary">Loading data....</div>'
    let typetab = '<table id="table" style="text-align: right"><tr><th>Year</th><th>Matches</th><th>Average</th><th>Winning</th><th>Losing</th><th>Share</th><th>Regional</th><th>District</th><th>Dist Champ</th><th>Champ Div</th><th>Champ Final</th><th>Dist Champ Div</th></tr></table>'
    let weektab = '<table id="week_table" style="text-align: right"><tr><th>Year</th><th>Week 0</th><th>Week 1</th><th>Week 2</th><th>Week 3</th><th>Week 4</th><th>Week 5</th><th>Week 6</th><th>Week 7</th><th>Week 8</th><th>Championship</th><th>Offseason</th></tr></table>'
    let card = new Card('card', summary + typetab + weektab)
    document.body.innerHTML += new PageFrame('', '', [card]).toString

    process_year(FIRST_YEAR)
}

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
            let count = 0
            let points = 0
            let winning_points = 0
            let processed = 0
            let event_points = [0, 0, 0, 0, 0, 0]
            let event_count = [0, 0, 0, 0, 0, 0]
            let weeks = {
                'Week 0': [],
                'Week 1': [],
                'Week 2': [],
                'Week 3': [],
                'Week 4': [],
                'Week 5': [],
                'Week 6': [],
                'Week 7': [],
                'Week 8': [],
                'Championship': [],
                'Offseason': [],
            }
            for (let event of events)
            {
                let type = event.event_type
                // only use some event types
                if (type >= REGIONAL && type <= FOC)
                {
                    if (type === FOC)
                    {
                        type = CMP_FINALS
                    }
                    fetch(`https://www.thebluealliance.com/api/v3/event/${event.key}/matches/simple${build_query({[TBA_AUTH_KEY]: TBA_KEY})}`)
                        .then(response => {
                            if (response.status === 401) {
                                alert('Invalid API Key Suspected')
                            }
                            return response.json()
                        })
                        .then(matches => {
                            let week = event.week
                            if (event.event_type === PRESEASON)
                            {
                                week = 'Week 0'
                            }
                            else if (event.event_type === OFFSEASON)
                            {
                                week = 'Offseason'
                            }
                            else if (event.event_type == CMP_DIVISION || event.event_type == CMP_FINALS || event.event_type == FOC)
                            {
                                week = 'Championship'
                            }
                            else
                            {
                                week = `Week ${parseInt(week) + 1}`
                            }
                            if (!weeks.hasOwnProperty(week))
                            {
                                weeks[week] = []
                            }

                            count += matches.length
                            event_count[type] += matches.length
                            for (let match of matches)
                            {
                                let total_score = match.alliances.blue.score + match.alliances.red.score
                                points += total_score
                                let winner = match.winning_alliance
                                if (!match.winning_alliance)
                                {
                                    winner = 'red'
                                }
                                winning_points += match.alliances[winner].score
                                event_points[type] += total_score
                                weeks[week].push(match.alliances.red.score)
                                weeks[week].push(match.alliances.blue.score)
                            }

                            // if all events are processed
                            if (++processed === events.length)
                            {
                                total += count
                                let event_cells = ''
                                for (let type in event_points)
                                {
                                    event_cells += `<td>${average(event_points[type] / 2, event_count[type])}</td>`
                                }

                                // add to page
                                let winning = average(winning_points, count)
                                let losing = average(points - winning_points, count)
                                let winner_share = (100 * winning_points / points).toFixed(0)
                                if (winner_share === 'NaN')
                                {
                                    winner_share = ''
                                }
                                else
                                {
                                    winner_share += '%'
                                }
                                document.getElementById('table').innerHTML += `<tr><th>${year}</th><td>${count}</td><td>${average(points / 2, count)}</td><td>${winning}</td><td>${losing}</td><td>${winner_share}</td>${event_cells}</tr>`

                                let names = Object.keys(weeks)
                                let cells = names.map(function (w)
                                {
                                    let avg = mean(weeks[w]).toFixed(0)
                                    let dev = std_dev(weeks[w]).toFixed(0)
                                    if (avg === '0' && dev === '0')
                                    {
                                        return '<td></td>'
                                    }
                                    return `<td>${avg} (${dev})</td>`
                                })
                                document.getElementById('week_table').innerHTML += `<tr><th>${year}</th>` + cells.join('') + '</tr>'
                                
                                // count next year
                                if (year < cfg.year)
                                {
                                    process_year(++year)
                                }
                                // label as complete
                                else
                                {
                                    document.getElementById('summary').innerHTML = `From ${FIRST_YEAR} through ${cfg.year} ${total} FRC matches were completed.<br>This data includes all matches not categorized as REMOTE, OFFSEASON, PRESEASON, or UNLABELED.`
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

/**
 * function:    average
 * parameters:  total points, number of matches
 * returns:     round average score or empty string
 * description: Calculates average score, rounded. If 0 matches returns empty string.
 */
function average(points, matches)
{
    if (matches > 0)
    {
        return (points / matches).toFixed(0)
    }
    return ''
}