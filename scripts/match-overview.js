/**
 * file:        matches-overview.js
 * description: Contains functions for the match overview selection page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-06-13
 */

const CONTENTS = `<h2>Match <span id="match_num">No Match Selected</span></h2>
                  <h3 id="time"></h3>`
                              
const BUTTONS = `<div id="teams"></div>`

var matches

/**
 * function:    open_match
 * parameters:  Selected match number
 * returns:     none
 * description: Completes right info pane for a given match number.
 */
function open_match(match_num)
{
    // iterate through each match obj
    matches.forEach(function (match, index)
    {
        let level = match.comp_level
        let number = match.match_number
        let red_teams = match.alliances.red.team_keys
        let blue_teams = match.alliances.blue.team_keys
        let match_div = document.getElementById(`match_${number}`)

        // find the desired qualifying match
        if (level == 'qm' && number == match_num)
        {
            // reorganize teams into single object
            let teams = {}
            red_teams.forEach(function (team, index)
            {
                let team_num = team.replace('frc', '')
                teams[team_num] = 'red'
            })
            blue_teams.forEach(function (team, index)
            {
                let team_num = team.replace('frc', '')
                teams[team_num] = 'blue'
            })

            // make row for match notes
            let result_file = get_notes(match_num, event_id)
            let note_button = build_button(result_file, 'Take Match Notes', `scout('${NOTE_MODE}', '${Object.keys(teams).join(',')}', 'white', '${match.match_number}')`)
            if (localStorage.getItem(result_file) != null)
            {
                note_button = build_button(result_file, 'View Match Notes', `scout('${NOTE_MODE}', '${Object.keys(teams).join(',')}', 'white', '${match.match_number}', true)`)
            }
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
                
                result_file = get_match_result(match_num, team_num, event_id)
                let button = build_button(result_file, `Scout ${team}`, `scout('${MATCH_MODE}', '${team_num}', '${alliance}', '${match.match_number}')`)
                if (localStorage.getItem(result_file) != null)
                {
                    button = build_button(result_file, `${team} Results`, `open_result('${result_file}')`)
                }

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
            document.getElementById('teams').innerHTML = build_page_frame('', [
                note_button,
                build_column_frame('', reds),
                build_column_frame('', blues)
            ])

            // place match time
            let actual = match.actual_time
            let predicted = match.predicted_time
            if (actual > 0)
            {
                document.getElementById('time').innerHTML = unix_to_match_time(actual)
            }
            else if (predicted > 0)
            {
                document.getElementById('time').innerHTML = `${unix_to_match_time(predicted)} (Projected)`
            }

            // place match number and team to scout on pane
            document.getElementById('match_num').innerHTML = match_num

            // select option
            match_div.classList.add('selected')
        }
        else if (level == 'qm' && match_div.classList.contains('selected'))
        {
            match_div.classList.remove('selected')
        }
    })
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
function scout(mode, team, alliance, match, edit=false)
{
    document.location.href = `/scout.html${build_query({[TYPE_COOKIE]: mode, [EVENT_COOKIE]: get_cookie(EVENT_COOKIE, EVENT_DEFAULT), [POSITION_COOKIE]: get_cookie(POSITION_COOKIE, POSITION_DEFAULT), [USER_COOKIE]: get_cookie(USER_COOKIE, USER_DEFAULT), 'match': match, 'team': team, 'alliance': alliance, 'edit': edit})}`
}

/**
 * function:    build_match_list
 * parameters:  none
 * returns:     none
 * description: Completes left select match pane with matches from event data.
 */
function build_match_list()
{
    let first = ''
    // iterate through each match obj
    matches.forEach(function (match, index)
    {
        let level = match.comp_level
        let number = match.match_number
        let red_teams = match.alliances.red.team_keys
        let blue_teams = match.alliances.blue.team_keys
        
        // only display qualifying matches
        if (level == 'qm')
        {
            // grey out previously scouted matches/teams
            scouted = 'not_scouted'
            if (first == '')
            {
                first = number
            }

            // replace placeholders in template and add to screen
            document.getElementById('option_list').innerHTML += build_match_option(number, red_teams, blue_teams, scouted)
        }
    })
    open_match(first)
    scroll_to('option_list', `match_${first}`)
}

/**
 * function:    load_event
 * parameters:  none
 * returns:     none
 * description: Fetch simple event matches and from localStorage.
 *              Build match list on load completion.
 */
function load_event()
{
    let file_name = get_event_matches_name(event_id)
    let preview = document.getElementById('preview')

    if (localStorage.getItem(file_name) != null)
    {
        preview.innerHTML = preview.innerHTML.replace(/CONTENTS/g, CONTENTS)
                                             .replace(/BUTTONS/g, BUTTONS)

        matches = JSON.parse(localStorage.getItem(file_name))
        build_match_list()
    }
    else
    {
        preview.innerHTML = preview.replace(/CONTENTS/g, '<h2>No Match Data Found</h2>Please preload event')
                                   .replace(/BUTTONS/g, '')
    }
}

// read parameters from URL
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

load_event()