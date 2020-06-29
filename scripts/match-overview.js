/**
 * file:        matches-overview.js
 * description: Contains functions for the match overview selection page of the web app.
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
 * description: Fetch simple event matches from localStorage. Initialize page contents.
 */
function init_page(contents_card, buttons_container)
{
    let file_name = get_event_matches_name(event_id)
    if (localStorage.getItem(file_name) != null)
    {
        contents_card.innerHTML = `<h2>Match <span id="match_num">No Match Selected</span></h2>
                                    <h3 id="time"></h3>
                                    <h3 id="result"></h3>`
        buttons_container.innerHTML = '<div id="teams"></div>'

        build_options_list(JSON.parse(localStorage.getItem(file_name)))
    }
    else
    {
        contents_card.innerHTML = '<h2>No Match Data Found</h2>Please preload event'
    }
}

/**
 * function:    build_options_list
 * parameters:  matches
 * returns:     none
 * description: Completes left select match pane with matches from event data.
 */
function build_options_list(matches,)
{
    let first = ''
    // iterate through each match obj
    matches.forEach(function (match, index)
    {
        let number = match.match_number
        let red_teams = match.alliances.red.team_keys
        let blue_teams = match.alliances.blue.team_keys
        
        // only display qualifying matches
        if (match.comp_level == 'qm')
        {
            // grey out previously scouted matches/teams
            scouted = 'not_scouted'
            if (first == '')
            {
                first = number
            }

            document.getElementById('option_list').innerHTML += build_match_option(number, red_teams, blue_teams, scouted)
        }
    })
    open_match(first)
    scroll_to('option_list', `match_${first}`)
}

/**
 * function:    open_match
 * parameters:  Selected match number
 * returns:     none
 * description: Completes right info pane for a given match number.
 */
function open_match(match_num)
{
    deselect_all()
    
    // select option
    document.getElementById(`match_${match_num}`).classList.add('selected')

    // place match number and team to scout on pane
    document.getElementById('match_num').innerHTML = match_num

    // place match time
    let match = get_match(match_num, event_id)
    let actual = match.actual_time
    let predicted = match.predicted_time
    let time = document.getElementById('time')
    if (actual > 0)
    {
        time.innerHTML = unix_to_match_time(actual)
        
        let red_score = match.alliances.red.score
        let blue_score = match.alliances.blue.score
        let score = `<span class="red">${red_score}</span> - <span class="blue">${blue_score}</span>`
        if (match.winning_alliance == 'blue')
        {
            score = `<span class="blue">${blue_score}</span> - <span class="red">${red_score}</span>`
        }
        document.getElementById('result').innerHTML = score
    }
    else if (predicted > 0)
    {
        time.innerHTML = `${unix_to_match_time(predicted)} (Projected)`
    }

    // reorganize teams into single object
    let match_teams = get_match_teams(match_num, event_id)
    let teams = {
        [match_teams['red1']]: 'red',
        [match_teams['red2']]: 'red',
        [match_teams['red3']]: 'red',
        [match_teams['blue1']]: 'blue',
        [match_teams['blue2']]: 'blue',
        [match_teams['blue3']]: 'blue',
    }

    // make row for match notes
    let note_button = build_link_button('note_button', 'Take Match Notes', `notes('${match_num}', ${notes_taken(match_num, event_id)})`)
    let reds = []
    let blues = []

    // make a row for each team
    Object.keys(teams).forEach(function (team_num, index)
    {
        let alliance = teams[team_num]
        let rank = ''
        let rankings = get_team_rankings(team_num, event_id)
        if (rankings)
        {
            rank = `#${rankings.rank} (${rankings.record.wins}-${rankings.record.losses}-${rankings.record.ties})`
        }
        let team = `<span class="${alliance}">${team_num}</span>`
        
        // build button to either scout or result
        let result_file = get_match_result(match_num, team_num, event_id)
        let button = build_link_button(result_file, `Scout ${team}`, `scout('${MATCH_MODE}', '${team_num}', '${alliance}', '${match_num}')`)
        if (localStorage.getItem(result_file) != null)
        {
            button = build_link_button(result_file, `${team} Results`, `open_result('${result_file}')`)
        }

        // add button and description to appropriate column
        let team_info = `<center>${get_team_name(team_num, event_id)}<br>${rank}</center>`
        if (alliance == 'red')
        {
            reds.push(button)
            reds.push(build_card('', team_info))
        }
        else
        {
            blues.push(button)
            blues.push(build_card('', team_info))
        }
    })

    // create columns and page
    document.getElementById('teams').innerHTML = build_page_frame('', [
        note_button,
        build_column_frame('', reds),
        build_column_frame('', blues)
    ])
}

/**
 * function:    open_result
 * parameters:  result file to open
 * returns:     none
 * description: Loads the result page for a button when pressed.
 */
function open_result(file)
{
    return build_url('selection', {'page': 'results', [EVENT_COOKIE]: get_cookie(EVENT_COOKIE, EVENT_DEFAULT), [TYPE_COOKIE]: file.split('-')[0], 'file': file})
}

/**
 * function:    scout
 * parameters:  scouting mode, team number, alliance color, match number
 * returns:     none
 * description: Loads the scouting page for a button when pressed.
 */
function scout(mode, team, alliance, match, edit=false)
{
    return build_url('index', {'page': 'scout', [TYPE_COOKIE]: mode, [EVENT_COOKIE]: get_cookie(EVENT_COOKIE, EVENT_DEFAULT), [POSITION_COOKIE]: get_cookie(POSITION_COOKIE, POSITION_DEFAULT), [USER_COOKIE]: get_cookie(USER_COOKIE, USER_DEFAULT), 'match': match, 'team': team, 'alliance': alliance, 'edit': edit})
}

/**
 * function:    notes
 * parameters:  match number
 * returns:     none
 * description: Loads the note taking page for a button when pressed.
 */
function notes(match, edit=false)
{
    let teams = get_match_teams(match, event_id)
    return build_url('index', {'page': NOTE_MODE, [EVENT_COOKIE]: get_cookie(EVENT_COOKIE, EVENT_DEFAULT), [USER_COOKIE]: get_cookie(USER_COOKIE, USER_DEFAULT), 'match': match, 'edit': edit,
        'red1': teams['red1'], 'red2': teams['red2'], 'red3': teams['red3'], 'blue1': teams['blue1'], 'blue2': teams['blue2'], 'blue3': teams['blue3']})
}