/**
 * file:        pits.js
 * description: Contains functions for the pit selection page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

// read parameters from URL
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

var team = ''
var generate = ''

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch event teams from localStorage. Initialize page contents.
 */
function init_page(contents_card, buttons_container)
{
    let first = populate_teams(false, true)
    if (first)
    {
        contents_card.innerHTML = `<img id="avatar" onclick="generate='random'" ontouchstart="touch_button(false)" ontouchend="touch_button('generate=\\'random\\', true)')"> <h2><span id="team_num">No Team Selected</span> <span id="team_name"></span></h2>`
        buttons_container.innerHTML = `${build_link_button('scout_pit', 'Scout Pit!', 'start_scouting(false)')}
                                        <div id="view_result"></div>`
        
        open_option(first)
    }
    else
    {
        contents_card.innerHTML = '<h2>No Team Data Found</h2>Please preload event'
    }
}

/**
 * function:    open_option
 * parameters:  Selected team number
 * returns:     none
 * description: Completes right info pane for a given team number.
 */
function open_option(team_num)
{
    deselect_all()

    // fill team info
    team = team_num
    document.getElementById('avatar').src = get_avatar(team_num, event_id.substr(0, 4))
    document.getElementById('team_num').innerHTML = team_num
    document.getElementById('team_name').innerHTML = get_team_name(team_num, event_id)
    document.getElementById(`option_${team_num}`).classList.add('selected')

    if (document.getElementById('open_result_container') !== null)
    {
        document.getElementById('open_result_container').remove()
    }
    
    // show edit/view result buttons
    let file = get_pit_result(team_num, event_id)
    let result_buttons = document.getElementById('view_result')
    if (file_exists(file))
    {
        result_buttons.innerHTML = build_link_button('edit_result', 'Edit Results', `start_scouting(true)`) + 
            build_link_button('open_result', 'View Results', `open_result('${file}')`)
    }
    else
    {
        result_buttons.innerHTML = ''
    }
}

/**
 * function:    open_result
 * parameters:  file to open
 * returns:     none
 * description: Opens result page for selected team.
 */
function open_result(file)
{
    return build_url('selection', {'page': 'results', [TYPE_COOKIE]: PIT_MODE, [EVENT_COOKIE]: event_id, 'file': file})
}

/**
 * function:    start_scouting
 * parameters:  Edit existing results
 * returns:     none
 * description: Open scouting mode for the desired team in the current tab.
 */
function start_scouting(edit)
{
    let team_num = document.getElementById('team_num').innerHTML
    return build_url('index', {'page': 'scout', [TYPE_COOKIE]: PIT_MODE, 'team': team_num, 'alliance': 'white', [EVENT_COOKIE]: event_id, [POSITION_COOKIE]: 0, [USER_COOKIE]: user_id, 'edit': edit, 'generate': generate })
}