/**
 * file:        home.js
 * description: The primary home page for users. Dynamically built based on the user's role.
 * author:      Liam Fruzyna
 * date:        2021-12-18
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

// role based layouts
const CONFIGS = {
    'scout': {
        'Scout': ['scout'],
        'Transfer': ['upload_url', 'upload_all', 'import_all', 'open_transfer', 'download_csv']
    },
    'note': {
        'Notes': ['pit_scout', 'note_scout'],
        'Transfer': ['upload_url', 'upload_all', 'import_all', 'open_transfer', 'download_csv']
    },
    'drive': {
        'Drive Team': ['open_coach', 'open_whiteboard'],
        'Transfer': ['upload_url', 'upload_all', 'import_all', 'open_transfer', 'download_csv']
    },
    'analysis': {
        'Teams': ['type_form', 'open_ranker', 'open_sides', 'open_picks', 'open_whiteboard', 'open_advanced'],
        'Keys': ['open_pivot', 'open_distro', 'open_plot'],
        'Data': ['open_results', 'open_teams', 'open_matches', 'open_users', 'open_coach'],
        'Transfer': ['upload_url', 'upload_all', 'import_all', 'open_transfer', 'download_csv']
    },
    'admin': {
        'Admin': ['open_config', 'open_settings', 'open_event_gen', 'open_random'],
        'Transfer': ['reset']
    }
}

// requirements for each button
const BUTTONS = {
    'scout':            { name: 'Scout',             limits: ['event'], configs: [MATCH_MODE, 'settings'] },
    'pit_scout':        { name: 'Pit Scout',         limits: ['teams'], configs: [PIT_MODE, 'settings'] },
    'note_scout':       { name: 'Note Scout',        limits: ['event'], configs: [NOTE_MODE, 'settings'] },
    'open_ranker':      { name: 'Team Rankings',     limits: ['event', 'admin', 'results', 'no-notes'], configs: ['type', 'settings'] },
    'open_sides':       { name: 'Side-by-Side',      limits: ['event', 'admin', 'results', 'no-notes'], configs: ['type', 'settings'] },
    'open_picks':       { name: 'Pick Lists',        limits: ['teams', 'admin'], configs: ['settings'] },
    'open_whiteboard':  { name: 'Whiteboard',        limits: ['matches', 'admin'], configs: ['whiteboard', 'settings'] },
    'open_advanced':    { name: 'Advanced',          limits: ['event', 'admin'], configs: ['settings'] },
    'open_results':     { name: 'Results',           limits: ['event-pit', 'admin', 'results'], configs: ['type', 'settings'] },
    'open_teams':       { name: 'Team Profiles',     limits: ['teams', 'admin'], configs: ['settings'] },
    'open_matches':     { name: 'Match Summaries',   limits: ['event', 'admin'], configs: ['settings'] },
    'open_users':       { name: 'User Profiles',     limits: ['event-pit', 'admin', 'any'], configs: [] },
    'open_pivot':       { name: 'Pivot Table',       limits: ['event', 'admin', 'results', 'no-notes'], configs: ['type', 'settings'] },
    'open_distro':      { name: 'Distributions',     limits: ['event', 'admin', 'results', 'no-notes'], configs: ['type', 'settings'] },
    'open_plot':        { name: 'Plotter',           limits: ['event', 'admin', 'results'], configs: ['type', 'settings'] },
    'open_coach':       { name: 'Coach View',        limits: ['event', 'admin', 'results'], configs: ['settings', 'coach-vals', 'type'] },
    'open_config':      { name: 'Config Builder',    limits: ['admin'], configs: [] },
    'open_settings':    { name: 'Settings Editor',   limits: ['admin'], configs: ['settings'] },
    'preload_event':    { name: 'Preload Event',     limits: [], configs: [] },
    'open_transfer':    { name: 'Transfer Raw Data', limits: ['event', 'admin'], configs: [] },
    'reset':            { name: 'Reset App',         limits: ['admin'], configs: [] },
    'open_event_gen':   { name: 'Event Generator',   limits: ['admin'], configs: [] },
    'open_random':      { name: 'Random Result Generator',  limits: ['event-pit', 'admin'], configs: ['type', 'settings'] },
    'upload_all':       { name: 'Upload Results to Server', limits: ['results'], configs: [] },
    'import_all':       { name: 'Import Server Results',    limits: ['admin'], configs: [] },
    'download_csv':     { name: 'Export Results as Sheet',  limits: ['event', 'admin', 'any'], configs: [] }
}

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    let columns = CONFIGS[get_cookie(ROLE_COOKIE, ROLE_DEFAULT)]
    let page_contents = []
    for (let col of Object.keys(columns))
    {
        let col_contents = []
        for (let key of columns[col])
        {
            if (key == 'upload_url')
            {
                col_contents.push(build_str_entry('upload_addr', 'Upload URL:', parse_server_addr(document.location.href), 'url'))
            }
            else if (key == 'type_form')
            {
                col_contents.push(build_select('type_form', 'Mode:', ['Pit', 'Match', 'Note'], 'Match'))
            }
            else if (col == 'Transfer' && !key.startsWith('open_'))
            {
                col_contents.push(build_button(key, BUTTONS[key].name, `check_press('${key}', ${key})`))
            }
            else
            {
                col_contents.push(build_link_button(key, BUTTONS[key].name, `check_press('${key}', ${key})`))
            }
        }
        page_contents.push(build_column_frame(col, col_contents))
    }
    document.body.innerHTML += build_page_frame('', page_contents)
        + build_page_frame('', [build_column_frame('', [build_link_button('sign_out', 'Sign Out', 'sign_out()')])])
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
    if (document.getElementById('upload_addr'))
    {
        let defaults = get_config('defaults')
        document.getElementById('upload_addr').value = get_cookie(UPLOAD_COOKIE, defaults.upload_url)
    }
    else if (document.getElementById('type_form'))
    {
        let type_cookie = get_cookie(TYPE_COOKIE, TYPE_DEFAULT)
        select_option('type_form', type_cookie == MATCH_MODE ? 1 : type_cookie == PIT_MODE ? 0 : 2)
    }

    hide_buttons()
}

/**
 * function:    hide_buttons
 * parameters:  none
 * returns:     none
 * description: Dims buttons if their functionality is not currently available to the user.
 */
function hide_buttons()
{
    let columns = CONFIGS[get_cookie(ROLE_COOKIE, ROLE_DEFAULT)]
    for (let col of Object.keys(columns))
    {
        for (let id of columns[col])
        {
            if (id != 'upload_url' && id != 'type_form')
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
    }
}

/**
 * HELPER FUNCTIONS
 */

/**
 * function:    save_options
 * parameters:  none
 * returns:     none
 * description: Save some options to cookies.
 */
function save_options()
{
    if (document.getElementById('upload_addr'))
    {
        set_cookie(UPLOAD_COOKIE, get_upload_addr())
    }
    if (document.getElementById('type_form'))
    {
        set_cookie(TYPE_COOKIE, get_selected_type())
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
    if (document.getElementById('type_form'))
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
    else
    {
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
    let defaults = get_config('defaults')
    return get_cookie(EVENT_COOKIE, defaults.event_id)
}

/**
 * function:    get_user
 * parameters:  none
 * returns:     Currently entered user ID.
 * description: Returns text in user id box.
 */
function get_user()
{
    let defaults = get_config('defaults')
    return get_cookie(USER_COOKIE, defaults.user_id)
}

/**
 * function:    get_position
 * parameters:  none
 * returns:     Currently selected scouting position index.
 * description: Returns currently selected scouting position index.
 */
function get_position()
{
    return get_cookie(POSITION_COOKIE, POSITION_DEFAULT)
}

/**
 * function:    get_upload_addr
 * parameters:  none
 * returns:     Currently entered upload server url.
 * description: Returns text in upload addr textbox.
 */
function get_upload_addr()
{
    if (document.getElementById('upload_addr'))
    {
        return document.getElementById('upload_addr').value
    }
    else
    {
        let defaults = get_config('defaults')
        return get_cookie(UPLOAD_COOKIE, defaults.upload_url)
    }
}