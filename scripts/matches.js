/**
 * file:        matches.js
 * description: Contains functions for the match selection page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

// read parameters from URL
const scout_pos = get_parameter(POSITION_COOKIE, POSITION_DEFAULT)
const scout_mode = get_parameter(TYPE_COOKIE, TYPE_DEFAULT)
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
        let avatar = ''
        let image = ''
        let button_txt = 'Take Match Notes'
        if (scout_mode == MATCH_MODE)
        {
            avatar = '<img id="avatar">'
            image = '<img id="photo" alt="No image available">'
            button_txt = 'Scout Match'
        }
        contents_card.innerHTML = `<h2>Match: <span id="match_num">No Match Selected</span></h2>
                                    ${avatar}
                                    <h2><span id="team_scouting">No Match Selected</span> <span id="team_name"></span></h2>
                                    ${image}`
        
        buttons_container.innerHTML = `${build_button('scout_match', button_txt, 'start_scouting(false)')}
                                        <div id='view_result'></div>`

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
    matches.forEach(function (match, index) {
        let number = match.match_number
        let red_teams = match.alliances.red.team_keys
        let blue_teams = match.alliances.blue.team_keys
        // only display qualifying matches
        if (match.comp_level == 'qm')
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
            if (scout_mode == MATCH_MODE)
            {
                team = team.substr(3)
            }

            // grey out previously scouted matches/teams
            scouted = 'not_scouted'
            if (scout_mode == MATCH_MODE && file_exists(get_match_result(number, team, event_id)))
            {
                first = ''
                scouted = 'scouted'
            }
            else if (scout_mode == NOTE_MODE && notes_taken(number, event_id))
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
 * function:    open_match
 * parameters:  match number
 * returns:     none
 * description: Completes right info pane for a given match number.
 */
function open_match(match_num)
{
    // clear previous selection
    deselect_all()
    if (document.getElementById('open_result_container') !== null)
    {
        document.getElementById('open_result_container').remove()
    }
    
    let team = ''
    let color = ''
    let selected = scout_pos

    let match = get_match(match_num, event_id)
    let red_teams = match.alliances.red.team_keys
    let blue_teams = match.alliances.blue.team_keys

    let number_span = document.getElementById('team_scouting')
    let name_span = document.getElementById('team_name')
    let result_buttons = document.getElementById('view_result')

    // select option
    document.getElementById(`match_${match_num}`).classList.add('selected')

    // place match number and team to scout on card
    document.getElementById('match_num').innerHTML = match_num

    // select appropriate team and color for position
    if (scout_mode == NOTE_MODE)
    {
        color = get_theme()['foreground-text-color']
    }
    else if (selected > 2)
    {
        // shift blue alliance indicies up
        selected -= 3
        team = blue_teams[selected]
        color = get_theme()['blue-alliance-color']
    }
    else
    {
        team = red_teams[selected]
        color = get_theme()['red-alliance-color']
    }
    number_span.style.color = color
    name_span.style.color = color

    // clear old buttons
    result_buttons.innerHTML = ''

    // populate team text
    if (scout_mode == NOTE_MODE)
    {
        number_span.innerHTML = Object.values(get_match_teams(match_num, event_id)).join(', ')
        
        // create edit button
        if (notes_taken(match_num, event_id))
        {
            result_buttons.innerHTML = build_button('scout_match', 'Edit Notes', 'start_scouting(true)')
        }
    }
    else
    {
        // populate team info
        let team_num = team.substr(3)
        document.getElementById('avatar').src = get_avatar(team_num, event_id.substr(0, 4))
        number_span.innerHTML = team_num
        name_span.innerHTML = get_team_name(team_num, event_id)

        // find photo
        use_cached_image(team_num, 'photo', '')
        
        // create result buttons
        let file = get_match_result(match_num, team.substr(3), event_id)
        if (file_exists(file))
        {
            result_buttons.innerHTML = build_button('open_result', 'View Results', `open_result('${file}')`) + 
                build_button('edit_result', 'Edit Results', `start_scouting(true)`)
        }
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
    document.location.href = build_url('selection', {'page': 'results', [TYPE_COOKIE]: MATCH_MODE, [EVENT_COOKIE]: event_id, 'file': file})
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
    // build URL with parameters
    let query = ''
    if (scout_mode == NOTE_MODE)
    {
        let teams = get_match_teams(match_num, event_id)
        query = {'page': NOTE_MODE, 'match': match_num, 
            'red1': teams['red1'], 'red2': teams['red2'], 'red3': teams['red3'], 
            'blue1': teams['blue1'], 'blue2': teams['blue2'], 'blue3': teams['blue3'], 
            [EVENT_COOKIE]: event_id, [USER_COOKIE]: user_id, 'edit': edit}
    }
    else
    {
        let team_num = document.getElementById('team_scouting').innerHTML
        let color = document.getElementById('team_scouting').style.color
        query = {'page': 'scout', 'match': match_num, 'team': team_num, 'alliance': color, 
            [EVENT_COOKIE]: event_id, [USER_COOKIE]: user_id, [TYPE_COOKIE]: scout_mode, [POSITION_COOKIE]: scout_pos, 'edit': edit}
    }
    window.location.href = build_url('index', query)
}