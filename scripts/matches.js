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
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

var generate = ''

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch simple event matches from localStorage. Initialize page contents.
 */
function init_page(contents_card, buttons_container)
{
    let first = populate_matches(false)
    if (first)
    {
        let avatar = ''
        let button_txt = 'Take Match Notes'
        if (scout_mode == MATCH_MODE)
        {
            avatar = `<img id="avatar" onclick="generate='random'" ontouchstart="touch_button(false)" ontouchend="touch_button('generate=\\'random\\', true)')">`
            button_txt = 'Scout Match'
        }

        let format = get_teams_format(event_id)
        let alliance = 'Red'
        let pos = 1 + parseInt(scout_pos)
        if (pos >= format.red)
        {
            alliance = 'Blue'
            pos -= format.red
        }
        contents_card.innerHTML = `<h2>Match: <span id="match_num">No Match Selected</span></h2>
                                    Scouting: ${alliance} ${pos}<br><br>
                                    ${avatar}
                                    <h2><span id="team_scouting">No Match Selected</span> <span id="team_name"></span></h2>`
        
        buttons_container.innerHTML = build_link_button('scout_match', button_txt, 'start_scouting(false)') +
                                        '<div id="view_result"></div>'

        open_match(first)
    }
    else
    {
        contents_card.innerHTML = '<h2>No Match Data Found</h2>Please preload event'
    }
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
    let teams = red_teams.concat(match.alliances.blue.team_keys)

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
    else
    {
        team = teams[selected]
        if (selected >= red_teams.length)
        {
            color = get_theme()['blue-alliance-color']
        }
        else
        {
            color = get_theme()['red-alliance-color']
        }
    }
    number_span.style.color = color
    name_span.style.color = color

    // clear old buttons
    result_buttons.innerHTML = ''

    // populate team text
    let team_num = team.substr(3)
    if (scout_mode == NOTE_MODE)
    {
        number_span.innerHTML = Object.values(extract_match_teams(match)).join(', ')
        
        // create edit button
        if (notes_taken(match_num, event_id) && can_edit(get_note(team_num, match_num, event_id)))
        {
            result_buttons.innerHTML = build_link_button('scout_match', 'Edit Notes', 'start_scouting(true)')
        }
    }
    else
    {
        // populate team info
        document.getElementById('avatar').src = get_avatar(team_num, event_id.substr(0, 4))
        number_span.innerHTML = team_num
        name_span.innerHTML = get_team_name(team_num, event_id)
        
        // create result buttons
        let file = get_match_result(match_num, team.substr(3), event_id)
        if (file_exists(file) && can_edit(file))
        {
            result_buttons.innerHTML = build_link_button('open_result', 'View Results', `open_result('${file}')`) + 
                build_link_button('edit_result', 'Edit Results', `start_scouting(true)`)
        }
    }
}

/**
 * function:    can_edit
 * parameters:  file to open
 * returns:     true if the user has permission to edit the file
 * description: Determines if the user has permissions to edit the file.
 */
function can_edit(file)
{
    return JSON.parse(localStorage.getItem(file)).meta_scouter_id == user_id || is_admin(user_id)
}

/**
 * function:    open_result
 * parameters:  file to open
 * returns:     none
 * description: Opens result page for selected match.
 */
function open_result(file)
{
    return build_url('selection', {'page': 'results', [TYPE_COOKIE]: MATCH_MODE, [EVENT_COOKIE]: event_id, 'file': file})
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
            [EVENT_COOKIE]: event_id, [USER_COOKIE]: user_id, 'edit': edit}

        let keys = Object.keys(teams)
        for (let team of keys)
        {
            query[team] = teams[team]
        }
    }
    else
    {
        let team_num = document.getElementById('team_scouting').innerHTML
        let color = document.getElementById('team_scouting').style.color
        query = {'page': 'scout', 'match': match_num, 'team': team_num, 'alliance': color, 
            [EVENT_COOKIE]: event_id, [USER_COOKIE]: user_id, [TYPE_COOKIE]: scout_mode, [POSITION_COOKIE]: scout_pos, 'edit': edit, 'generate': generate}
    }
    return build_url('index', query)
}