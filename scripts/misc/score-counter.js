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

var summary, type_tab, week_tab

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    let card_container = document.createElement('span')
    summary = document.createElement('div')
    summary.innerText = 'Loading data...'
    type_tab = document.createElement('table')
    type_tab.style.textAlign = 'right'
    type_tab.insertRow().append(create_header('Year'), create_header('Matches'), create_header('Average'), create_header('Winning'), create_header('Losing'), create_header('Share'), create_header('Regional'), create_header('District'), create_header('Dist Champ'), create_header('Champ Div'), create_header('Champ Final'), create_header('Dist Champ Div'))
    week_tab = document.createElement('table')
    week_tab.style.textAlign = 'right'
    week_tab.insertRow().append(create_header('Year'), create_header('Week 0'), create_header('Week 1'), create_header('Week 2'), create_header('Week 3'), create_header('Week 4'), create_header('Week 5'), create_header('Week 6'), create_header('Week 7'), create_header('Week 8'), create_header('Championship'), create_header('Offseason'))
    card_container.append(summary, type_tab, week_tab)
    let card = new Card('card', card_container)
    let select = new Select('stat', 'Stat', STAT_OPTIONS)
    select.on_change = 'show_stat()'
    document.body.append(new PageFrame('', '', [card, select]).element)

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
                                let row = type_tab.insertRow()
                                row.append(create_header(year))
                                row.insertCell().innerText = scores.length / 2
                                row.insertCell().innerHTML = build_stats_cell(scores)
                                row.insertCell().innerHTML = build_stats_cell(winners)
                                row.insertCell().innerText = losing.toFixed(0)
                                row.insertCell().innerText = winner_share
                                for (let cell of event_cells)
                                {
                                    row.insertCell().innerHTML = cell
                                }

                                let names = Object.keys(weeks)
                                let cells = names.map(w => build_stats_cell(weeks[w]))
                                row = week_tab.insertRow()
                                row.append(create_header(year))
                                for (let cell of cells)
                                {
                                    row.insertCell().innerHTML = cell
                                }
                                
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

function build_stats_cell(values)
{
    if (values.length === 0)
    {
        return ''
    }

    let avg = mean(values).toFixed(0)
    let dev = std_dev(values).toFixed(0)
    let min = Math.min(...values)
    let max = Math.max(...values)
    let med = median(values)
    let mod = mode(values)
    let tot = values.reduce((a,b) => a + b, 0)
    return `<span class="Mean">${avg}</span>
        <span class="StdDev" style="display: none">${dev}</span>
        <span class="Min" style="display: none">${min}</span>
        <span class="Max" style="display: none">${max}</span>
        <span class="Median" style="display: none">${med}</span>
        <span class="Mode" style="display: none">${mod}</span>
        <span class="Total" style="display: none">${tot}</span>`
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