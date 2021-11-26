/**
 * file:        index.js
 * description: Contains functions for the index of the web app.
 *              Primarily for loading event data and transfering results.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

/**
 * PAGE INIT
 */

let s = document.createElement('script')
s.src = `scripts/transfer.js`
document.head.appendChild(s)
s = document.createElement('script')
s.src = `scripts/links.js`
document.head.appendChild(s)
s = document.createElement('script')
s.src = `scripts/validation.js`
document.head.appendChild(s)

// generate page
const PAGE_FRAME = build_page_frame('', [
    build_column_frame('Options', [
        build_str_entry('event_id', 'Event ID:', '', 'text', 'hide_buttons()'),
        build_dropdown('position', 'Position:', []),
        build_select('type_form', 'Mode:', ['Pit', 'Match', 'Note'], 'Match', 'hide_buttons()'),
        build_str_entry('upload_addr', 'Upload URL:', parse_server_addr(document.location.href), 'url'),
        build_num_entry('user_id', 'School ID:', '', [100000, 999999], 'hide_buttons()'),
        build_select('theme_switch', 'Theme:', ['Light', 'Dark'], 'Light', 'switch_theme()')
    ]),
    build_column_frame('Interactive', [
        build_link_button('scout', 'Scout', `check_press('scout', scout)`),
        build_link_button('open_ranker', 'Team Rankings', `check_press('open_ranker', open_ranker)`),
        build_link_button('open_sides', 'Side-by-Side', `check_press('open_sides', open_sides)`),
        build_link_button('open_picks', 'Pick Lists', `check_press('open_picks', open_picks)`),
        build_link_button('open_whiteboard', 'Whiteboard', `check_press('open_whiteboard', open_whiteboard)`),
        build_link_button('open_advanced', 'Advanced Stats', `check_press('open_advanced', open_advanced)`),
        build_link_button('open_pivot', 'Pivot Table', `check_press('open_pivot', open_pivot)`),
        build_link_button('open_distro', 'Distributions', `check_press('open_distro', open_distro)`),
    ]),
    build_column_frame('Data', [
        build_link_button('open_results', 'Results', `check_press('open_results', open_results)`),
        build_link_button('open_teams', 'Team Profiles', `check_press('open_teams', open_teams)`),
        build_link_button('open_matches', 'Match Summaries', `check_press('open_matches', open_matches)`),
        build_link_button('open_users', 'User Profiles', `check_press('open_users', open_users)`),
        build_link_button('open_coach', 'Coach View', `check_press('open_coach', open_coach)`),
    ]),
    build_column_frame('Transfer', [
        build_button('preload_event', 'Preload Event', `check_press('preload_event', preload_event)`),
        build_button('upload_all', 'Upload Results to Server', `check_press('upload_all', upload_all)`),
        build_button('import_all', 'Import Server Results', `check_press('import_all', import_all)`),
        build_button('export_zip', 'Export Raw Data', `check_press('export_zip', export_zip)`),
        build_button('import_zip', 'Import Raw Data', `check_press('import_zip', prompt_zip)`),
        build_button('download_csv', 'Export CSV Data', `check_press('download_csv', download_csv)`),
    ]),
    build_column_frame('Configuration', [
        build_link_button('open_config', 'Config Builder', `check_press('open_config', open_config)`),
        build_link_button('open_settings', 'Settings Editor', `check_press('open_settings', open_settings)`),
        build_link_button('open_random', 'Random Result Generator', `check_press('open_random', open_random)`),
        build_link_button('about', 'About', `'index.html?page=about'`),
        build_button('reset', 'Reset', `check_press('reset', reset)`),
    ]),
    build_column_frame('Status', [
        build_status_tile('server_type', 'POST Server'),
        build_status_tile('config_valid', 'Config'),
        build_status_tile('scout_config_valid', 'Scout Config'),
        build_card('status', '', limitWidth=true)
    ])
])

// requirements for each button
const BUTTONS = {
    'scout':            { limits: ['event-pit'], configs: ['type', 'settings'] },
    'open_ranker':      { limits: ['event', 'admin', 'results', 'no-notes'], configs: ['type', 'settings'] },
    'open_sides':       { limits: ['event', 'admin', 'results', 'no-notes'], configs: ['type', 'settings'] },
    'open_picks':       { limits: ['teams', 'admin'], configs: ['settings'] },
    'open_whiteboard':  { limits: ['matches', 'admin'], configs: ['whiteboard', 'settings'] },
    'open_advanced':    { limits: ['event', 'admin'], configs: ['settings'] },
    'open_results':     { limits: ['event-pit', 'admin', 'results'], configs: ['type', 'settings'] },
    'open_teams':       { limits: ['teams', 'admin'], configs: ['settings'] },
    'open_matches':     { limits: ['event', 'admin'], configs: ['settings'] },
    'open_users':       { limits: ['event-pit', 'admin', 'any'], configs: [] },
    'open_pivot':       { limits: ['event', 'admin', 'results', 'no-notes'], configs: ['type', 'settings'] },
    'open_distro':      { limits: ['event', 'admin', 'results', 'no-notes'], configs: ['type', 'settings'] },
    'open_coach':       { limits: ['event', 'admin', 'results'], configs: ['settings', 'coach-vals', 'type'] },
    'open_config':      { limits: ['admin'], configs: [] },
    'open_settings':    { limits: ['admin'], configs: ['settings'] },
    'open_random':      { limits: ['event-pit', 'admin'], configs: ['type', 'settings']},
    'preload_event':    { limits: [], configs: [] },
    'upload_all':       { limits: ['results'], configs: [] },
    'import_all':       { limits: ['admin'], configs: [] },
    'download_csv':     { limits: ['event', 'admin', 'any'], configs: [] },
    'export_zip':       { limits: ['event', 'admin'], configs: [] },
    'import_zip':       { limits: ['admin'], configs: [] },
    'reset':            { limits: ['admin'], configs: [] }
}

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    document.body.innerHTML += PAGE_FRAME
    let configs = Object.keys(localStorage).filter(file => file.startsWith('config-')).length
    if (configs >= 8)
    {
        on_config()
    }
    else
    {
        fetch_config(on_config)
    }
    process_files()
}

/**
 * function:    on_config
 * parameters:  none
 * returns:     none
 * description: Fetch defaults, populate inputs with defaults, and apply theme.
 */
function on_config()
{
    let defaults = get_config('defaults')
    document.getElementById('event_id').value = get_cookie(EVENT_COOKIE, defaults.event_id)
    document.getElementById('user_id').value = get_cookie(USER_COOKIE, defaults.user_id)
    document.getElementById('position').selectedIndex = get_cookie(POSITION_COOKIE, POSITION_DEFAULT)
    document.getElementById('upload_addr').selectedIndex = get_cookie(UPLOAD_COOKIE, defaults.upload_url)
    let type_cookie = get_cookie(TYPE_COOKIE, TYPE_DEFAULT)
    select_option('type_form', type_cookie == MATCH_MODE ? 1 : type_cookie == PIT_MODE ? 0 : 2)

    let theme = get_cookie(THEME_COOKIE, THEME_DEFAULT)
    select_option('theme_switch', theme == 'light' ? 0 : 1)
    apply_theme()
    hide_buttons()

    // update statuses
    set_status('server_type', check_server(get_upload_addr(), false))
    let year = get_event().substr(0, 4)
    set_status('scout_config_valid', validate_scout_config(get_config(`${year}-match`)) && validate_scout_config(get_config(`${year}-pit`)))
    set_status('config_valid', validate_settings_config(get_config('settings')) &&
        validate_settings_config(get_config('settings')) &&
        validate_defaults_config(get_config('defaults')) &&
        validate_coach_config(get_config('coach-vals'), year) &&
        validate_smart_config(get_config('smart-stats')) &&
        validate_wb_config(get_config('whiteboard')) &&
        validate_admin_config(get_config('admins')) &&
        validate_theme_config(get_config('theme')) &&
        validate_theme_config(get_config('dark-theme')))
}

/**
 * function:    hide_buttons
 * parameters:  none
 * returns:     none
 * description: Dims buttons if their functionality is not currently available to the user.
 */
function hide_buttons()
{
    count_teams()
    for (let id of Object.keys(BUTTONS))
    {
        let button = document.getElementById(`${id}-container`)
        if (is_blocked(id))
        {
            // dim the button if blocked
            button.classList.add('disabled')
        }
        else
        {
            // umdim otherwise
            button.classList.remove('disabled')
        }
    }
}

/**
 * HELPER FUNCTIONS
 */

/**
 * function:    count_teams
 * parameters:  none
 * returns:     none
 * description: Counts teams in competition format.
 */
function count_teams()
{
    let options = ''
    let teams = get_team_keys(get_event())
    for (let t of teams)
    {
        options += build_dropdown_op(t, '')
    }
    document.getElementById('position').innerHTML = options
}

/**
 * function:    process_files
 * parameters:  none
 * returns:     none
 * description: Counts files and displays numbers on screen
 */
function process_files()
{
    // get all files in localStorage
    let files = Object.keys(localStorage)
    let matches = 0
    let pits = 0
    let notes = 0
    let avatars = 0
    let images = 0
    let events = []
    let teams = []
    let rankings = []
    for (let file of files)
    {
        let parts = file.split('-')
        // determine files which start with the desired type
        if (parts[0] == 'matches')
        {
            events.push(parts[1])
        }
        else if (parts[0] == 'teams')
        {
            teams.push(parts[1])
        }
        else if (parts[0] == 'rankings')
        {
            rankings.push(parts[1])
        }
        else if (parts[0] == MATCH_MODE)
        {
            ++matches
        }
        else if (parts[0] == PIT_MODE)
        {
            ++pits
        }
        else if (parts[0] == NOTE_MODE)
        {
            ++notes
        }
        else if (parts[0] == 'image')
        {
            ++images
        }
        else if (parts[0] == 'avatar')
        {
            ++avatars
        }
    }
    status(`<table><tr><th>Results...</th></tr>
            <tr><td>Match<td></td><td>${matches}</td></tr>
            <tr><td>Pit<td></td><td>${pits}</td></tr>
            <tr><td>Image<td></td><td>${images}</td></tr>
            <tr><td>Note<td></td><td>${notes}</td></tr>
            <tr><th>Events...</th></tr>
            <tr><td>Match<td></td><td>${events.join(', ')}</td></tr>
            <tr><td>Team<td></td><td>${teams.join(', ')}</td></tr>
            <tr><td>Ranking<td></td><td>${rankings.join(', ')}</td></tr>
            <tr><td>Avatar<td></td><td>${avatars}</td></tr></table>`)
}

/**
 * function:    save_options
 * parameters:  none
 * returns:     none
 * description: Save some options to cookies.
 */
function save_options()
{
    set_cookie(EVENT_COOKIE, get_event())
    set_cookie(USER_COOKIE, get_user())
    set_cookie(POSITION_COOKIE, get_position())
    set_cookie(UPLOAD_COOKIE, get_upload_addr())
    set_cookie(TYPE_COOKIE, get_selected_type())
}

/**
 * function:    status
 * parameters:  string status, whether to follow with a new line
 * returns:     none
 * description: Log a string to both the status window and console.
 */
function status(status, newLine=true)
{
    document.getElementById('status').innerHTML += `${status}${newLine ? '<br>' : ''}`
    console.log(status.replace(/<br>/g, '\n'))
}

/**
 * function:    switch_theme
 * parameters:  none
 * returns:     none
 * description: Checks for a theme switch and updates.
 */
function switch_theme()
{
    let theme = get_selected_option('theme_switch') == 0 ? 'light' : 'dark'
    if (theme != get_cookie(THEME_COOKIE, THEME_DEFAULT))
    {
        set_cookie(THEME_COOKIE, theme)
        apply_theme()
    }
}

/**
 * function:    has_event
 * parameters:  none
 * returns:     If the current event is loaded
 * description: Determines if the current event is loaded.
 */
function has_event()
{
    return has_matches() && has_teams()
}


/**
 * function:    has_teams
 * parameters:  none
 * returns:     If the current event teams are loaded
 * description: Determines if the current event teams are loaded.
 */
 function has_teams()
 {
     let event = get_event()
     return file_exists(get_event_teams_name(event))
 }


 /**
  * function:    has_matches
  * parameters:  none
  * returns:     If the current event matches are loaded
  * description: Determines if the current event matches are loaded.
  */
  function has_matches()
  {
      let event = get_event()
      return file_exists(get_event_matches_name(event))
  }
 
/**
 * function:    is_blocked
 * parameters:  button container id
 * returns:     reason why button is blocked
 * description: Determines if a button should be blocked and explains why.
 */
function is_blocked(id)
{
    let type = get_selected_type()
    let event = get_event()
    let year = event.substr(0,4)
    let limits = BUTTONS[id].limits
    let configs = BUTTONS[id].configs

    // check each provided limiting parameter
    if (limits.includes('event-pit') && !has_event())
    {
        if (get_selected_type() != PIT_MODE || !has_teams())
        {
            return `Missing event data.`
        }
    }
    if (limits.includes('event') && !has_event())
    {
        return `Missing event data.`
    }
    if (limits.includes('teams') && !has_teams())
    {
        return `Missing team data.`
    }
    if (limits.includes('matches') && !has_matches())
    {
        return `Missing match data.`
    }
    if (limits.includes('admin') && !is_admin(get_user()))
    {
        return `Admin access required.`
    }
    if (limits.includes('no-notes') && type == NOTE_MODE)
    {
        return `Cannot rank notes.`
    }
    if (limits.includes('results') && !count_results(event, type))
    {
        return `No ${type} results found.`
    }
    if (limits.includes('any') && !count_results(event, PIT_MODE) && !count_results(event, MATCH_MODE) && !count_results(event, NOTE_MODE))
    {
        return `No results found.`
    }

    // check that all necessary configs are present
    for (let i = 0; i < configs.length; ++i)
    {
        let config = configs[i]
        if (config == 'type')
        {
            config = type
        }
        if (config != NOTE_MODE && !config_exists(config, year))
        {
            return `Missing ${config} configuration.`
        }
    }
    return false
}

/**
 * function:    check_press
 * parameters:  button container id, button press function
 * returns:     none
 * description: Attempts to operate a button press otherwise explains why not.
 */
function check_press(id, on_press)
{
    save_options()
    let blocked = is_blocked(id)
    if (blocked)
    {
        // warn the user if the button cannot be used
        alert(blocked)
        return ''
    }
    else
    {
        return on_press()
    }
}

/**
 * INPUT VALUE FUNCTIONS
 */

/**
 * function:    get_selected_type
 * parameters:  none
 * returns:     Currently selected scouting type.
 * description: Determines whether to use 'match' or 'pit' scouting based on the 'match' radio button.
 */
function get_selected_type()
{
    switch(get_selected_option('type_form'))
    {
        case 0:
            return PIT_MODE
        case 2:
            return NOTE_MODE
        case 1:
        default:
            return MATCH_MODE
    }
}

/**
 * function:    get_event
 * parameters:  none
 * returns:     Currently entered event ID.
 * description: Returns text in event id box.
 */
function get_event()
{
    return document.getElementById('event_id').value
}

/**
 * function:    get_user
 * parameters:  none
 * returns:     Currently entered user ID.
 * description: Returns text in user id box.
 */
function get_user()
{
    return document.getElementById('user_id').value
}

/**
 * function:    get_position
 * parameters:  none
 * returns:     Currently selected scouting position index.
 * description: Returns currently selected scouting position index.
 */
function get_position()
{
    return document.getElementById('position').selectedIndex
}

/**
 * function:    get_upload_addr
 * parameters:  none
 * returns:     Currently entered upload server url.
 * description: Returns text in upload addr textbox.
 */
function get_upload_addr()
{
    return document.getElementById('upload_addr').value
}