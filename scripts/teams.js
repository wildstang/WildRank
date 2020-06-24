/**
 * file:        teams.js
 * description: Contains functions for the team overview page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-06-13
 */

// read parameters from URL
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch event teams from localStorage. Initialize page contents.
 */
function init_page(contents_card, buttons_container)
{
    let file_name = get_event_teams_name(event_id)
    if (localStorage.getItem(file_name) != null)
    {
        contents_card.innerHTML = `<img id="avatar">
                                    <h2><span id="team_num">No Team Selected</span> <span id="team_name"></span></h2>
                                    <h3 id="location"></h3>
                                    <h3 id="ranking"></h3>
                                    <img id="photo" alt="No image available">
                                    <div id="notes"></div>`
        buttons_container.innerHTML = '<div id="matches"></div>'
        
        build_options_list(JSON.parse(localStorage.getItem(file_name)))
    }
    else
    {
        contents_card.innerHTML = '<h2>No Team Data Found</h2>Please preload event'
    }
}

/**
 * function:    build_options_list
 * parameters:  teams
 * returns:     none
 * description: Completes left select team pane with teams from event data.
 */
function build_options_list(teams)
{
    let first = ''
    // iterate through team objs
    teams.forEach(function (team, index)
    {
        let number = team.team_number
        // determine if the team has already been scouted
        let scouted = 'not_scouted'
        if (first == '')
        {
            first = number
        }

        // replace placeholders in template and add to screen
        document.getElementById('option_list').innerHTML += build_option(number, scouted)
    })
    open_option(first)
    scroll_to('option_list', `option_${first}`)
}

/**
 * function:    open_option
 * parameters:  Selected team number
 * returns:     none
 * description: Completes right info pane for a given team number.
 */
function open_option(team_num)
{
    // select new option
    deselect_all()
    document.getElementById(`option_${team_num}`).classList.add('selected')

    // populate top
    document.getElementById('avatar').src = get_avatar(team_num, event_id.substr(0, 4))
    document.getElementById('team_num').innerHTML = team_num
    document.getElementById('team_name').innerHTML = get_team_name(team_num, event_id)
    document.getElementById('location').innerHTML = get_team_location(team_num, event_id)

    // populate ranking
    let rankings = get_team_rankings(team_num, event_id)
    if (rankings)
    {
        document.getElementById('ranking').innerHTML = `Rank: ${rankings.rank} (${rankings.record.wins}-${rankings.record.losses}-${rankings.record.ties})`
    }

    let notes = ''
    Object.keys(localStorage).forEach(function (file, index)
    {
        if (file.startsWith(`${NOTE_MODE}-`))
        {
            let result = JSON.parse(localStorage.getItem(file))
            if (result.meta_team == team_num && result.meta_event_id == event_id)
            {
                if (notes == '')
                {
                    notes = '<br><b>Notes:</b>'
                }
                notes += '<br>'
                notes += result.notes
            }
        }
    })
    document.getElementById('notes').innerHTML = notes

    // find robot photo
    use_cached_image(team_num, 'photo', '')

    // add pit row
    let result_file = get_pit_result(team_num, event_id)
    let pit_button = build_button(result_file, 'Scout Pit', `scout('${PIT_MODE}', '${team_num}', 'white')`)
    if (localStorage.getItem(result_file) != null)
    {
        pit_button = build_button(result_file, 'View Pit Results', `open_result('${result_file}')`)
    }
    let cards = []

    // add row for each match
    let file_name = get_event_matches_name(event_id)
    if (localStorage.getItem(file_name) != null)
    {
        matches = JSON.parse(localStorage.getItem(file_name))
        matches.forEach(function (match, index)
        {
            if (match.comp_level == 'qm')
            {
                // determine team's alliance (if any)
                let alliance = ''
                if (match.alliances.blue.team_keys.includes(`frc${team_num}`))
                {
                    alliance = 'blue'
                }
                else if (match.alliances.red.team_keys.includes(`frc${team_num}`))
                {
                    alliance = 'red'
                }

                // make match row
                if (alliance)
                {
                    // add time
                    let actual = match.actual_time
                    let predicted = match.predicted_time
                    let scheduled = match.time
                    let time = ''
                    if (actual > 0)
                    {
                        let winner = match.winning_alliance
                        let score = `<span class="red">${match.alliances.red.score}</span> - <span class="blue">${match.alliances.blue.score}</span>`
                        if (winner == 'blue')
                        {
                            score = `<span class="blue">${match.alliances.blue.score}</span> - <span class="red">${match.alliances.red.score}</span>`
                        }
                        let result = `<b>${winner == alliance ? 'W' : 'L'}</b><br>${score}`
                        time = `${unix_to_match_time(actual)}<br>${result}`
                    }
                    else if (predicted > 0)
                    {
                        time = `${unix_to_match_time(predicted)} (Projected)`
                    }
                    else if (scheduled > 0)
                    {
                        time = `${unix_to_match_time(scheduled)}`
                    }

                    let match_num = `<span class="${alliance}">${match.match_number}</span>`
                    // make match button
                    result_file = get_match_result(match.match_number, team_num, event_id)
                    result = build_button(result_file, `Scout Match ${match_num}`, `scout('${MATCH_MODE}', '${team_num}', '${alliance}', '${match.match_number}')`)
                    if (localStorage.getItem(result_file) != null)
                    {
                        result = build_button(result_file, `Match ${match_num} Results`, `open_result('${result_file}')`)
                    }
                    cards.push(result)
                    
                    cards.push(build_card('', `<center>${time}</center>`))
                }
            }
        })

        document.getElementById('matches').innerHTML = build_page_frame('', [
            pit_button,
            build_column_frame('', cards.splice(0, cards.length/2)),
            build_column_frame('', cards)
        ])
    }
}

/**
 * function:    open_result
 * parameters:  result file to open
 * returns:     none
 * description: Loads the result page for a button when pressed.
 */
function open_result(file)
{
    document.location.href = `/selection.html${build_query({'page': 'results', [EVENT_COOKIE]: get_cookie(EVENT_COOKIE, EVENT_DEFAULT), [TYPE_COOKIE]: file.split('-')[0], 'file': file})}`
}

/**
 * function:    scout
 * parameters:  scouting mode, team number, alliance color, match number
 * returns:     none
 * description: Loads the scouting page for a button when pressed.
 */
function scout(mode, team, alliance, match='')
{
    document.location.href = `/index.html${build_query({'page': 'scout', [TYPE_COOKIE]: mode, [EVENT_COOKIE]: get_cookie(EVENT_COOKIE, EVENT_DEFAULT), [POSITION_COOKIE]: get_cookie(POSITION_COOKIE, POSITION_DEFAULT), [USER_COOKIE]: get_cookie(USER_COOKIE, USER_DEFAULT), 'match': match, 'team': team, 'alliance': alliance})}`
}