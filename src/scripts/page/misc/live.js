/**
 * file:        live.js
 * description: Displays live match info and rankings for the current event
 * author:      Liam Fruzyna
 * date:        2025-04-17
 */

var past_matches_card, next_matches_card, rankings_card
var api_endpoint = `https://www.thebluealliance.com/api/v3`
var key_query = ''
var teams = {}

/**
 * Populates the page with 3 cards, ensures there is an API key, and starts pulling data.
 */
function init_page()
{
    header_info.innerText = 'Live'

    past_matches_card = new WRCard('')
    next_matches_card = new WRCard('')
    rankings_card = new WRCard('')

    preview.append(new WRPage('', [new WRColumn('Last 5 Matches', [past_matches_card]),
                                   new WRColumn('Next 5 Matches', [next_matches_card]),
                                   new WRColumn('Top 15', [rankings_card])]))

    // request the TBA key if it doesn't already exist
    key_query = cfg.tba_query
    if (!key_query)
    {
        return
    }

    // fetch simple event teams
    fetch(`https://www.thebluealliance.com/api/v3/event/${dal.event_id}/teams/simple${key_query}`)
        .then(response => {
            return response.json()
        })
        .then(data => {
            if (data.length > 0)
            {
                // convert team list to dictionary
                for (let team of data)
                {
                    teams[team.team_number] = team
                }

                update_matches()
                update_rankings()
                setInterval(update_matches, 60000)
                setInterval(update_rankings, 60000)
            }
        })
        .catch(err => {
            console.log(err)
        })
}

/**
 * Pulls matches from TBA, then populate the last and next matches cards with 5 matches respectively.
 */
function update_matches()
{
    // fetch simple event matches
    fetch(`${api_endpoint}/event/${dal.event_id}/matches${key_query}`)
        .then(response => {
            if (response.status == 401) {
                alert('Invalid API Key Suspected')
            }
            return response.json()
        })
        .then(data => {
            // ensure there are matches available
            if (data.length > 0)
            {
                // fetch event rankings
                let date = new Date()
                let time = document.createElement('small')
                time.innerText = `Updated: ${date.toTimeString().split(' ')[0]}`

                // sort match objs by match number
                let matches = data.filter(m => m.comp_level === 'qm').sort(function (a, b)
                {
                    return b.match_number < a.match_number ? 1
                            : b.match_number > a.match_number ? -1
                            : 0
                })

                // filter matches by complete and upcoming, based on whether there is a result posted time
                let complete = matches.filter(m => m.post_result_time)
                let upcoming = matches.filter(m => !m.post_result_time)

                // create an entry for the last 5 complete matches
                let elements = []
                for (let match of complete.slice(Math.max(complete.length - 5, 0)))
                {
                    // match number header
                    let match_num = document.createElement('h3')
                    match_num.innerText = `Match ${match.match_number} `
                    match_num.style.display = 'inline'
                    elements.push(match_num)

                    // first available youtube video
                    for (let vid of match.videos)
                    {
                        if (vid.type === 'youtube')
                        {
                            let video = document.createElement('a')
                            video.innerText = 'YouTube Video'
                            video.href = `https://www.youtube.com/watch?v=${match.videos[0].key}`
                            elements.push(video)
                            break
                        }
                    }

                    // table of teams and scores
                    let table = document.createElement('table')
                    elements.push(table)

                    // build a row for the blue alliance and score, color blue if winner
                    let blue_row = table.insertRow()
                    if (match.winning_alliance === 'blue')
                    {
                        blue_row.style.color = 'blue'
                    }
                    for (let team_key of match.alliances.blue.team_keys)
                    {
                        add_team_to_cell(blue_row.insertCell(), team_key)
                    }
                    blue_row.append(create_header(match.alliances.blue.score))

                    // build a row for the red alliance and score, color red if winner
                    let red_row = table.insertRow()
                    if (match.winning_alliance === 'red')
                    {
                        red_row.style.color = 'red'
                    }
                    for (let team_key of match.alliances.red.team_keys)
                    {
                        add_team_to_cell(red_row.insertCell(), team_key)
                    }
                    red_row.append(create_header(match.alliances.red.score))
                    elements.push(document.createElement('br'))
                }
                past_matches_card.text_el.replaceChildren(...elements)

                // create an entry for the first 5 upcoming matches
                elements = []
                for (let match of upcoming.slice(0, Math.min(5, upcoming.length)))
                {
                    // match number header
                    let match_num = document.createElement('h3')
                    match_num.innerText = `Match ${match.match_number} `
                    match_num.style.display = 'inline'
                    elements.push(match_num)

                    // color green if the configured team
                    let teams = match.alliances.blue.team_keys.concat(match.alliances.red.team_keys).map(t => team_key_to_number(t))
                    if (teams.includes(cfg.user.settings.team_number))
                    {
                        match_num.style.color = 'green'
                    }

                    // predicted match time from TBA
                    let match_time = document.createElement('span')
                    match_time.innerText = new Date(match.predicted_time * 1000).toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'})
                    elements.push(match_time)

                    // table of teams
                    let table = document.createElement('table')
                    elements.push(table)

                    // build a row for the blue alliance and color blue
                    let blue_row = table.insertRow()
                    blue_row.style.color = 'blue'
                    for (let team_key of match.alliances.blue.team_keys)
                    {
                        add_team_to_cell(blue_row.insertCell(), team_key)
                    }

                    // build a row for the red alliance and color red
                    let red_row = table.insertRow()
                    red_row.style.color = 'red'
                    for (let team_key of match.alliances.red.team_keys)
                    {
                        add_team_to_cell(red_row.insertCell(), team_key)
                    }
                    elements.push(document.createElement('br'))
                }
                elements.push(time)
                next_matches_card.text_el.replaceChildren(...elements)
            }
        })
        .catch(err => {
            console.log(err)
        })
}

/**
 * Pulls rankings from TBA, then populate card with the top 15.
 */
function update_rankings()
{
    // fetch event rankings
    fetch(`${api_endpoint}/event/${dal.event_id}/rankings${key_query}`)
        .then(response => {
            return response.json()
        })
        .then(data => {
            // wait until there are rankings
            if (data && data.hasOwnProperty('rankings') && data.rankings.length >= 15)
            {
                // create a small text with the current time
                let date = new Date()
                let time = document.createElement('small')
                time.innerText = `Updated: ${date.toTimeString().split(' ')[0]}`

                // sort rankings objs by team number
                let rankings = data.rankings.sort(function (a, b)
                {
                    return b.rank < a.rank ? 1
                            : b.rank > a.rank ? -1
                            : 0;
                })

                // build a table containing the top 15 teams
                let table = document.createElement('table')
                table.append(create_header_row(['Rank', 'Team #', 'Avg RP', 'Avg Coop', 'Avg Match', 'Matches']))
                for (let team of rankings.slice(0, 15))
                {
                    row = table.insertRow()
                    row.insertCell().innerText = team.rank
                    let team_cell = add_team_to_cell(create_header(''), team.team_key)
                    if (team_key_to_number(team.team_key) === cfg.user.settings.team_number)
                    {
                        team_cell.style.color = 'green'
                    }
                    row.append(team_cell)
                    row.insertCell().innerText = team.sort_orders[0].toFixed(2)
                    row.insertCell().innerText = team.sort_orders[1].toFixed(2)
                    row.insertCell().innerText = team.sort_orders[2].toFixed(1)
                    row.insertCell().innerText = team.matches_played
                }
                rankings_card.text_el.replaceChildren(table, time)
            }
        })
        .catch(err => {
            console.log(err)
        })
}

/**
 * Converts a team key from TBA to the team number.
 * @param {String} team_key Team key in format frcXXXX
 * @returns Team number
 */
function team_key_to_number(team_key)
{
    return parseInt(team_key.substring(3))
}

/**
 * Adds a team number and name to a given cell.
 * @param {HTMLTableCellElement} cell Table cell to add team to
 * @param {String} team_key Team key in format frcXXXX
 * @returns Given table cell
 */
function add_team_to_cell(cell, team_key)
{
    let team_num = team_key_to_number(team_key)
    cell.innerText = team_num
    cell.title = teams[team_num].nickname
    return cell
}