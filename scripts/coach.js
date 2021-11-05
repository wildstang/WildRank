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
    // load in config and results
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

    // build page
    let file_name = get_event_matches_name(event_id)
    if (localStorage.getItem(file_name) != null)
    {
        contents_card.innerHTML = `<h2>Match <span id="match_num">No Match Selected</span></h2>
                                    <h3 id="time"></h3>`

        // reorganize teams into single object
        let match_teams = get_match_teams(1, event_id)

        // make row for match notes
        let reds = []
        let blues = []

        // make a row for each team
        Object.keys(match_teams).forEach(function (key, i)
        {
            // add button and description to appropriate column
            if (key.slice(0, -1) == 'red')
            {
                reds.push(build_num_entry(`team_${i}`, '', '', [0, 10000], 'open_teams()'))
                reds.push(build_card(`team_${i}_details`, ''))
            }
            else
            {
                blues.push(build_num_entry(`team_${i}`, '', '', [0, 10000], 'open_teams()'))
                blues.push(build_card(`team_${i}_details`, ''))
            }
        })

        // build template
        buttons_container.innerHTML = build_checkbox('show_notes', 'Show Notes', false, `toggle_notes()`) +
            '<div id="teams">' +
            build_page_frame('', [
                build_column_frame('', reds),
                build_column_frame('', blues)
            ]) +'</div>'

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
    matches.sort((a, b) => a.time - b.time)
    // iterate through each match obj
    matches.forEach(function (match, index)
    {
        let number = match.match_number
        let red_teams = match.alliances.red.team_keys
        let blue_teams = match.alliances.blue.team_keys
        
        // grey out previously scouted matches/teams
        let scouted = 'not_scouted'
        let level = match.comp_level.replace('qm', '').toUpperCase()
        if ((match.alliances.red.score && match.alliances.red.score >= 0) || (is_match_scouted(event_id, number) && level == ''))
        {
            scouted = 'scouted'
            first = ''
        }
        else if (first == '')
        {
            first = number
        }
        if (level && level != 'F')
        {
            level += match.set_number
        }

        document.getElementById('option_list').innerHTML += build_match_option(`${level}${number}`, red_teams, blue_teams, scouted, `${level}${number}`)
    })
    // default to first match if no first was selected
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
    let match = parse_match(match_num, event_id)
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
    let match_teams = extract_match_teams(match)

    // make a row for each team
    Object.keys(match_teams).forEach(function (key, index)
    {
        document.getElementById(`team_${parseInt(index)}`).value = match_teams[key]
    })

    open_teams()
}

/**
 * function:    open_teams
 * parameters:  none
 * returns:     none
 * description: Completes right info pane for the current teams in the number entries.
 */
function open_teams()
{
    // reorganize teams into single object
    let match_teams = get_match_teams(1, event_id)

    // make a row for each team
    for (let index in Object.keys(match_teams))
    {
        let id = `team_${parseInt(index)}`

        // add team name and ranking data
        let team_num = document.getElementById(id).value
        let rank = ''
        let rankings = get_team_rankings(team_num, event_id)
        if (rankings)
        {
            rank = `#${rankings.rank} (${rankings.record.wins}-${rankings.record.losses}-${rankings.record.ties})`
        }

        // make a table of "coach_vals"
        let notes = `<center>${get_team_name(team_num, event_id)}<br>${rank}</center><br><table>`
        vals.forEach(function (v)
        {
            let stat = avg_results(get_team_results(results, team_num), v.key, FUNCTIONS.indexOf(v.function))
            notes += `<tr><th>${v.function.charAt(0).toUpperCase()}${v.function.substr(1)} ${get_name(v.key)}</th><td>${get_value(v.key, stat)}</td></tr>`
        })
        notes += '</table><div class="notes">'

        // add notes from notes mode, if box is checked
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
        notes += '</div>'

        document.getElementById(`${id}_details`).innerHTML = notes
    }

    toggle_notes()
}

/**
 * function:    toggle_notes
 * parameters:  none
 * returns:     none
 * description: Shows/hides the note blocks based on checkbox.
 */
function toggle_notes()
{
    for (let n of Array.from(document.getElementsByClassName('notes')))
    {
        n.style.display = document.getElementById('show_notes').checked ? 'block' : 'none'
    }
}