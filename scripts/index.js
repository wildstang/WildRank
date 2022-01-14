/**
 * file:        index.js
 * description: The index of the app. Primarily for choosing the user's role then moving to home.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

/**
 * PAGE INIT
 */

let s = document.createElement('script')
s.src = `scripts/validation.js`
document.head.appendChild(s)
s = document.createElement('script')
s.src = `scripts/transfer.js`
document.head.appendChild(s)

// generate page
const PAGE_FRAME = build_page_frame('', [
    build_column_frame('Options', [
        build_str_entry('event_id', 'Event ID:', '', 'text', 'process_files()'),
        build_dropdown('position', 'Position:', []),
        build_num_entry('user_id', 'School ID:', '', [100000, 999999]),
        build_select('theme_switch', 'Theme:', ['Light', 'Dark'], 'Light', 'switch_theme()')
    ]),
    build_column_frame('Role', [
        build_link_button('scout', 'Scouter', `check_press('scout')`),
        build_link_button('note', 'Note Taker', `check_press('note')`),
        build_link_button('drive', 'Drive Team', `check_press('drive')`),
        build_link_button('analysis', 'Analyst', `check_press('analysis')`),
        build_link_button('admin', 'Administrator', `check_press('admin')`)
    ]),
    build_column_frame('Status', [
        build_button('preload_event', 'Preload Event', `preload_event()`),
        build_button('import_zip', 'Import Raw Data', `import_zip()`),
        build_status_tile('server_type', 'POST Server'),
        build_status_tile('config_valid', 'Config'),
        build_status_tile('scout_config_valid', 'Scout Config')
    ]),
    build_column_frame('Data', [
        build_counter('teams', 'Event Teams', 0, 'increment("teams", false)', 'increment("teams", true)'),
        build_counter('matches', 'Event Matches', 0, 'increment("matches", false)', 'increment("matches", true)'),
        build_counter('pit_results', 'Pit Results', 0, 'increment("pit_results", false)', 'increment("pit_results", true)'),
        build_counter('match_results', 'Match Results', 0, 'increment("match_results", false)', 'increment("match_results", true)'),
        build_link_button('about', 'About WildRank', `open_about()`)
    ])
])

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
    if (configs >= 10)
    {
        on_config()
    }
    else
    {
        fetch_config(on_config)
    }
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

    let theme = get_cookie(THEME_COOKIE, THEME_DEFAULT)
    select_option('theme_switch', theme == 'light' ? 0 : 1)
    apply_theme()
    process_files()

    // update statuses
    set_status('server_type', check_server(get_upload_addr(), false))
    let year = get_event().substr(0, 4)
    set_status('scout_config_valid', validate_scout_config(get_config(`${year}-match`)) && validate_scout_config(get_config(`${year}-pit`)))
    set_status('config_valid', validate_settings_config(get_config('settings')) &&
        validate_settings_config(get_config('settings')) &&
        validate_defaults_config(get_config('defaults')) &&
        validate_coach_config(get_config('coach-vals')) &&
        validate_smart_config(get_config('smart-stats')) &&
        validate_wb_config(get_config('whiteboard')) &&
        validate_admin_config(get_config('admins')) &&
        validate_theme_config(get_config('theme')) &&
        validate_theme_config(get_config('dark-theme')))
}

/**
 * HELPER FUNCTIONS
 */

/**
 * function:    process_files
 * parameters:  none
 * returns:     none
 * description: Counts files and displays numbers on screen
 */
function process_files()
{
    count_teams()

    // get all files in localStorage
    let files = Object.keys(localStorage)
    let teams = 0
    let matches = 0
    let pit_results = 0
    let match_results = 0
    let event = get_event()

    if (file_exists(`matches-${event}`))
    {
        matches = JSON.parse(localStorage.getItem(`matches-${event}`)).length
    }
    if (file_exists(`teams-${event}`))
    {
        teams = JSON.parse(localStorage.getItem(`teams-${event}`)).length
    }
    for (let file of files)
    {
        let parts = file.split('-')
        if (parts[1] == event)
        {
            if (parts[0] == MATCH_MODE)
            {
                match_results++
            }
            else if (parts[0] == PIT_MODE)
            {
                pit_results++
            }
        }
    }

    document.getElementById('teams').innerHTML = teams
    document.getElementById('matches').innerHTML = matches
    document.getElementById('pit_results').innerHTML = pit_results
    document.getElementById('match_results').innerHTML = match_results
}

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
    if (id != 'scout' && !is_admin(get_user()))
    {
        return 'Missing admin privileges'
    }
    if (id != 'admin' && !has_teams())
    {
        return 'Missing event data'
    }
    return false
}

/**
 * function:    check_press
 * parameters:  button container id
 * returns:     none
 * description: Attempts to operate a button press otherwise explains why not.
 */
function check_press(id)
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
        set_cookie(ROLE_COOKIE, id)
        return build_url('index', {'page': 'home', [ROLE_COOKIE]: id, [EVENT_COOKIE]: get_event(), [POSITION_COOKIE]: get_position(), [USER_COOKIE]: get_user()})
    }
}

/**
 * function:    open_about
 * parameters:  none
 * returns:     none
 * description: Open the about page.
 */
function open_about()
{
    console.log('about')
    return build_url('index', {'page': 'about'})
}

/**
 * INPUT VALUE FUNCTIONS
 */

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
    return parse_server_addr(document.location.href)
}