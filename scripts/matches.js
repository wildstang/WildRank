/**
 * file:        matches.js
 * description: Contains functions for the match selection page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

const OPEN_RESULT = build_button('open_result', 'View Results', `open_result('RESULT')`)
const EDIT_RESULT = build_button('edit_result', 'Edit Results', `start_scouting(true)`)

const CONTENTS = `<h2>Match: <span id="match_num">No Match Selected</span></h2>
                  <img id="avatar"><h2><span id="team_scouting">No Match Selected</span> <span id="team_name"></span></h2>
                  <img id="photo" alt="No image available">`
                              
const BUTTONS = `${build_button('scout_match', 'Scout Match!', 'start_scouting(false)')}<div id='view_result'></div>`

var matches

/**
 * function:    open_match
 * parameters:  Selected match number
 * returns:     none
 * description: Completes right info pane for a given match number.
 */
function open_match(match_num)
{
    var team = ''
    // iterate through each match obj
    matches.forEach(function (match, index) {
        let level = match.comp_level
        let number = match.match_number
        let red_teams = match.alliances.red.team_keys
        let blue_teams = match.alliances.blue.team_keys
        let match_div = document.getElementById(`match_${number}`)
        // find the desired qualifying match
        if (level == 'qm' && number == match_num)
        {
            let selected = scout_pos
            // select appropriate team for position
            if (selected < 0)
            {
                document.getElementById('team_scouting').style.color = get_theme()['foreground-text-color']
                document.getElementById('team_name').style.color = get_theme()['foreground-text-color']
            }
            else if (selected > 2)
            {
                // shift blue alliance indicies up
                selected -= 3
                team = blue_teams[selected]
                document.getElementById('team_scouting').style.color = get_theme()['blue-alliance-color']
                document.getElementById('team_name').style.color = get_theme()['blue-alliance-color']
            }
            else
            {
                team = red_teams[selected]
                document.getElementById('team_scouting').style.color = get_theme()['red-alliance-color']
                document.getElementById('team_name').style.color = get_theme()['red-alliance-color']
            }

            // select option
            match_div.classList.add('selected')

            // populate team text
            if (scout_pos < 0)
            {
                // remove single team elements
                document.getElementById('avatar').style = 'display: none'
                document.getElementById('photo').style = 'display: none'

                document.getElementById('team_scouting').innerHTML = ''
                red_teams.forEach(function (team, index)
                {
                    document.getElementById('team_scouting').innerHTML += team.substr(3) + ','
                })
                blue_teams.forEach(function (team, index)
                {
                    if (index != 0)
                    {
                        document.getElementById('team_scouting').innerHTML += ','
                    }
                    document.getElementById('team_scouting').innerHTML += team.substr(3)
                })
            }
            else
            {
                let team_num = team.substr(3)
                document.getElementById('avatar').src = get_avatar(team_num, event_id.substr(0, 4))
                document.getElementById('team_scouting').innerHTML = team_num
                document.getElementById('team_name').innerHTML = get_team_name(team_num, event_id)

                // find photo
                let photo = document.getElementById('photo')
                photo.setAttribute('onerror', `use_cached_image(${team_num}, "photo")`)
                let file = get_team_image_name(team_num, event_id)
                photo.setAttribute('src', `/uploads/${file}.png`)
            }
        }
        else if (level == 'qm' && match_div.classList.contains('selected'))
        {
            match_div.classList.remove('selected')
        }
    })
    // place match number and team to scout on pane
    document.getElementById('match_num').innerHTML = match_num

    if (document.getElementById('open_result_container') !== null)
    {
        document.getElementById('open_result_container').remove()
    }

    let file = get_match_result(match_num, team.substr(3), event_id)
    if (file_exists(file) && scout_pos >= 0)
    {
        document.getElementById('view_result').innerHTML = EDIT_RESULT.replace(/RESULT/g, file) + OPEN_RESULT.replace(/RESULT/g, file)
    }
    else if (notes_taken(match_num, event_id))
    {
        document.getElementById('view_result').innerHTML = EDIT_RESULT.replace(/RESULT/g, file)
    }
    else
    {
        document.getElementById('view_result').innerHTML = ''
    }
}

/**
 * function:    open_result
 * parameters:  file to open
 * returns:     none
 * description: Opens result page for selected match.
 */
function open_result(file)
{
    document.location.href = `selection.html${build_query({'page': 'results', [TYPE_COOKIE]: MATCH_MODE, [EVENT_COOKIE]: event_id, 'file': file})}`
}

/**
 * function:    start_scouting
 * parameters:  Edit existing results
 * returns:     none
 * description: Open scouting mode for the desired team and match in the current tab.
 */
function start_scouting(edit)
{
    let match_num = document.getElementById('match_num').innerHTML
    let team_num = document.getElementById('team_scouting').innerHTML
    let color = document.getElementById('team_scouting').style.color
    let mode = MATCH_MODE
    if (scout_pos < 0)
    {
        mode = NOTE_MODE
    }
    // build URL with parameters
    let query = ''
    if (mode == NOTE_MODE)
    {
        let teams = get_match_teams(match_num, event_id)
        query = build_query({[TYPE_COOKIE]: mode, 'match': match_num, 
            'red1': teams['red1'], 'red2': teams['red2'], 'red3': teams['red3'], 
            'blue1': teams['blue1'], 'blue2': teams['blue2'], 'blue3': teams['blue3'], 
            [EVENT_COOKIE]: event_id, [POSITION_COOKIE]: scout_pos, [USER_COOKIE]: user_id, 'edit': edit})
    }
    else
    {
        query = build_query({[TYPE_COOKIE]: mode, 'match': match_num, 'team': team_num, 'alliance': color, 
            [EVENT_COOKIE]: event_id, [POSITION_COOKIE]: scout_pos, [USER_COOKIE]: user_id, 'edit': edit})
    }
    window.open(`scout.html${query}`, '_self')
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
    matches.forEach(function (match, index) {
        let level = match.comp_level
        let number = match.match_number
        let red_teams = match.alliances.red.team_keys
        let blue_teams = match.alliances.blue.team_keys
        // only display qualifying matches
        if (level == 'qm')
        {
            // determine which team user is positioned to scout
            let team = ''
            if (scout_pos >= 3)
            {
                // adjust indicies for blue alliance
                team = blue_teams[scout_pos - 3]
            }
            else
            {
                team = red_teams[scout_pos]
            }
            if (scout_pos > -1)
            {
                team = team.substr(3)
            }

            // grey out previously scouted matches/teams
            scouted = 'not_scouted'
            if (scout_pos >= 0 && file_exists(get_match_result(number, team, event_id)))
            {
                first = ''
                scouted = 'scouted'
            }
            else if (scout_pos < 0 && notes_taken(number, event_id))
            {
                first = ''
                scouted = 'scouted'
            }
            else if (first == '')
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
const scout_pos = get_parameter(POSITION_COOKIE, POSITION_DEFAULT)
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

load_event()