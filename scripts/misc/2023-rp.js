/**
 * file:        2023-rp.js
 * description: Recalculates event ranking points based on rule changes made 2023-04-11.
 * author:      Liam Fruzyna
 * date:        2023-04-11
 */

let summary, table

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    let event = new Entry('event', 'Event ID', event_id)
    let entry_col = new ColumnFrame('', '', [event])
    let run = new Button('run', 'Run', 'process_event()')
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
 * function:    process_event
 * parameters:  none
 * returns:     none
 * description: Counts and recalculates ranking points.
 */
function process_event()
{
    let event_id = document.getElementById('event').value
    summary.innerText = 'Loading data....'

    table.insertRow().append(create_header('Team'), create_header('Original Rank'), create_header('Original RPs'), create_header('New Rank'), create_header('New RPs'), create_header('Total Points'))

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

    fetch(`https://www.thebluealliance.com/api/v3/event/${event_id}/matches${build_query({[TBA_AUTH_KEY]: TBA_KEY})}`)
        .then(response => {
            if (response.status == 401) {
                alert('Invalid API Key Suspected')
            }
            return response.json()
        })
        .then(data => {
            if (data.length > 0)
            {
                let og_team_rank = {}
                let new_team_rank = {}
                let points = {}
                for (let match of data)
                {
                    if (match.comp_level === 'qm')
                    {
                        let red_og_rp = count_rp(match, 'red', 5)
                        let red_new_rp = count_rp(match, 'red', 6)
                        if (red_og_rp !== match.score_breakdown.red.rp)
                        {
                            console.log('Red RP mismatch', match.key, red_og_rp, match.score_breakdown.red.rp, match)
                        }
                        for (let team of match.alliances.red.team_keys)
                        {
                            if (!(team in og_team_rank))
                            {
                                og_team_rank[team] = 0
                                new_team_rank[team] = 0
                                points[team] = 0
                            }
                            og_team_rank[team] += red_og_rp
                            new_team_rank[team] += red_new_rp
                            points[team] += match.score_breakdown.red.totalPoints - match.score_breakdown.red.foulPoints
                        }
    
                        let blue_og_rp = count_rp(match, 'blue', 5)
                        let blue_new_rp = count_rp(match, 'blue', 6)
                        if (blue_og_rp !== match.score_breakdown.blue.rp)
                        {
                            console.log('Blue RP mismatch', match.key, blue_og_rp, match.score_breakdown.blue.rp, match)
                        }
                        for (let team of match.alliances.blue.team_keys)
                        {
                            if (!(team in og_team_rank))
                            {
                                og_team_rank[team] = 0
                                new_team_rank[team] = 0
                                points[team] = 0
                            }
                            og_team_rank[team] += blue_og_rp
                            new_team_rank[team] += blue_new_rp
                            points[team] += match.score_breakdown.blue.totalPoints - match.score_breakdown.blue.foulPoints
                        }
                    }
                }

                let og_teams = Object.keys(og_team_rank)
                og_teams.sort((a, b) => og_team_rank[b] - og_team_rank[a])
                let new_teams = Object.keys(og_team_rank)
                new_teams.sort((a, b) => new_team_rank[b] - new_team_rank[a])
                for (let team of og_teams)
                {
                    let og_rank = og_teams.indexOf(team) + 1
                    let new_rank = new_teams.indexOf(team) + 1
                    let row = table.insertRow()
                    row.insertCell().innerText = team.substring(3)
                    row.insertCell().innerText = og_rank
                    row.insertCell().innerText = og_team_rank[team]
                    row.insertCell().innerText = new_rank
                    row.insertCell().innerText = new_team_rank[team]
                    row.insertCell().innerText = points[team]
                }
                let header = document.createElement('h2')
                header.innerText = event_id
                summary.replaceChildren(header, 'Note: tie breakers not accounted for in rankings.')
            }
            else
            {
                alert('No matches received!')
            }
        })
        .catch(err => {
            alert('Error loading matches!')
            console.log(err)
        })
}

/**
 * function:    process_event
 * parameters:  match object, alliance name, link rp threshold
 * returns:     number of rp
 * description: Counts and recalculates ranking points.
 */
function count_rp(match, alliance, link_threshold)
{
    let rp = 0
    // win 2 rp
    if (match.winning_alliance === alliance)
    {
        rp += 2
    }
    // tie 1 rp
    else if (match.winning_alliance === '')
    {
        rp += 1
    }

    // 26 cs points 1 rp
    if (match.score_breakdown[alliance].autoChargeStationPoints + match.score_breakdown[alliance].endGameChargeStationPoints >= 26)
    {
        rp += 1
    }

    // reduce link threshold by 1 if both teams got coop
    if (match.score_breakdown.red.coopertitionCriteriaMet &&
        match.score_breakdown.blue.coopertitionCriteriaMet)
    {
        link_threshold -= 1
    }

    // link threshold 1 rp
    if (match.score_breakdown[alliance].links.length >= link_threshold)
    {
        rp += 1
    }

    return rp
}