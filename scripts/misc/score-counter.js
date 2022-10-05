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

// stat options
const STAT_OPTIONS = ['Mean', 'Median', 'Mode', 'StdDev', 'Min', 'Max', 'Total']

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
    let select = new Select('stat', 'Stat', STAT_OPTIONS)
    select.on_change = 'show_stat()'
    document.body.innerHTML += new PageFrame('', '', [card, select]).toString

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
            let processed = 0
            let scores = []
            let winners = []
            let types = {
                [REGIONAL]: [],
                [DISTRICT]: [],
                [DISTRICT_CMP_DIVISION]: [],
                [DISTRICT_CMP]: [],
                [CMP_DIVISION]: [],
                [CMP_FINALS]: []
            }
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
                if (type >= REGIONAL)
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

                            for (let match of matches)
                            {
                                let match_scores = [match.alliances.red.score, match.alliances.blue.score]
                                scores.push.apply(scores, match_scores)
                                if (type in types)
                                {
                                    types[type].push.apply(types[type], match_scores)
                                }
                                weeks[week].push.apply(weeks[week], match_scores)

                                let winner = match.winning_alliance
                                if (!match.winning_alliance)
                                {
                                    winner = 'red'
                                }
                                winners.push(match.alliances[winner].score)
                            }

                            // if all events are processed
                            if (++processed === events.length)
                            {
                                total += scores.length
                                let event_cells = Object.values(types).map(t => build_stats_cell(t))

                                // add to page
                                let points = mean(scores)
                                let winning = mean(winners)
                                let losing = (points * 2) - winning
                                let winner_share = (100 * winning / (points * 2)).toFixed(0)
                                if (winner_share === 'NaN')
                                {
                                    winner_share = ''
                                }
                                else
                                {
                                    winner_share += '%'
                                }
                                document.getElementById('table').innerHTML += `<tr><th>${year}</th><td>${scores.length/2}</td>${build_stats_cell(scores)}
                                    ${build_stats_cell(winners)}<td>${losing.toFixed(0)}</td><td>${winner_share}</td>${event_cells.join('')}</tr>`

                                let names = Object.keys(weeks)
                                let cells = names.map(w => build_stats_cell(weeks[w]))
                                document.getElementById('week_table').innerHTML += `<tr><th>${year}</th>${cells.join('')}</tr>`
                                
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

function build_stats_cell(values)
{
    if (values.length === 0)
    {
        return '<td></td>'
    }

    let avg = mean(values).toFixed(0)
    let dev = std_dev(values).toFixed(0)
    let min = Math.min(...values)
    let max = Math.max(...values)
    let med = median(values)
    let mod = mode(values)
    let tot = values.reduce((a,b) => a + b, 0)
    return `<td><span class="Mean">${avg}</span>
        <span class="StdDev" style="display: none">${dev}</span>
        <span class="Min" style="display: none">${min}</span>
        <span class="Max" style="display: none">${max}</span>
        <span class="Median" style="display: none">${med}</span>
        <span class="Mode" style="display: none">${mod}</span>
        <span class="Total" style="display: none">${tot}</span>
    </td>`
}

function show_stat()
{
    let selection = Select.get_selected_option('stat')

    for (let op in STAT_OPTIONS)
    {
        let elements = document.getElementsByClassName(STAT_OPTIONS[op])
        for (let e of elements)
        {
            if (op == selection)
            {
                e.style.display = 'inline'
            }
            else
            {
                e.style.display = 'none'
            }
        }
    }
}