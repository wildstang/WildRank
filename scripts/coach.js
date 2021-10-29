/**
 * file:        coach.js
 * description: Contains functions for the driver coach view page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2021-09-03
 */

const FUNCTIONS = ['mean', 'median', 'mode', 'min', 'max']

// read parameters from URL
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const type = get_parameter(TYPE_COOKIE, TYPE_DEFAULT)
const prefix = `${type}-${event_id}-`
const year = event_id.substr(0,4)

var vals = [] 
var results = {}

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch simple event matches from localStorage. Initialize page contents.
 */
function init_page(contents_card, buttons_container)
{
    load_config(type, year)
    vals = get_config('coach_vals')
    Object.keys(localStorage).forEach(function (file)
    {
        // determine files which start with the desired type
        if (file.startsWith(prefix))
        {
            results[file] = JSON.parse(localStorage.getItem(file))
        }
    })

    let file_name = get_event_matches_name(event_id)
    if (localStorage.getItem(file_name) != null)
    {
        contents_card.innerHTML = `<h2>Match <span id="match_num">No Match Selected</span></h2>
                                    <h3 id="time"></h3>`
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
function build_options_list(matches)
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
            let scouted = 'not_scouted'
            if ((match.alliances.red.score && match.alliances.red.score >= 0) || is_match_scouted(event_id, number))
            {
                scouted = 'scouted'
                first = ''
            }
            else if (first == '')
            {
                first = number
            }

            document.getElementById('option_list').innerHTML += build_match_option(number, red_teams, blue_teams, scouted)
        }
    })
    if (first == '')
    {
        first = matches[0].match_number
    }

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
    }
    else if (predicted > 0)
    {
        time.innerHTML = `${unix_to_match_time(predicted)} (Projected)`
    }

    // reorganize teams into single object
    let match_teams = get_match_teams(match_num, event_id)

    // make row for match notes
    let reds = []
    let blues = []

    // make a row for each team
    Object.keys(match_teams).forEach(function (key)
    {
        // add team name and ranking data
        let team_num = match_teams[key]
        let alliance = key.slice(0, -1)
        let rank = ''
        let rankings = get_team_rankings(team_num, event_id)
        if (rankings)
        {
            rank = `#${rankings.rank} (${rankings.record.wins}-${rankings.record.losses}-${rankings.record.ties})`
        }

        // make a table of "coach_vals"
        let notes = '<table>'
        vals.forEach(function (v)
        {
            let stat = avg_results(get_team_results(results, team_num), v.key, FUNCTIONS.indexOf(v.function))
            notes += `<tr><td>${v.function.charAt(0).toUpperCase()}${v.function.substr(1)} ${get_name(v.key)}</td><td>${get_value(v.key, stat)}</td></tr>`
        })
        notes += '</table>'
        // add notes from notes mode, not sure if we want this
        Object.keys(localStorage).forEach(function (file)
        {
            if (file.startsWith(`${NOTE_MODE}-`))
            {
                let result = JSON.parse(localStorage.getItem(file))
                if (result.meta_team == team_num && result.meta_event_id == event_id)
                {
                    if (notes == '')
                    {
                        notes = ''
                    }
                    else {
                        notes += '<br>'
                    }
                    notes += result.notes
                }
            }
        })

        // add button and description to appropriate column
        let team_info = `<center>${team_num}<br>${get_team_name(team_num, event_id)}<br>${rank}</center>`
        if (alliance == 'red')
        {
            reds.push(build_card('', team_info))
            reds.push(build_card('', notes))
        }
        else
        {
            blues.push(build_card('', team_info))
            blues.push(build_card('', notes))
        }
    })

    // create columns and page
    document.getElementById('teams').innerHTML = build_page_frame('', [
        build_column_frame('', reds),
        build_column_frame('', blues)
    ])
}