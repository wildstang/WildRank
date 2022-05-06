/**
 * file:        home.js
 * description: The primary home page for users. Dynamically built based on the user's role.
 * author:      Liam Fruzyna
 * date:        2021-12-18
 */

/**
 * PAGE INIT
 */

include('transfer')
include('links')

// role based layouts
const CONFIGS = {
    'scout': {
        'Scout': ['scout'],
        'Transfer': ['open_transfer', 'download_csv']
    },
    'note': {
        'Notes': ['pit_scout', 'note_scout'],
        'Transfer': ['open_transfer', 'download_csv']
    },
    'drive': {
        'Drive Team': ['open_coach', 'open_whiteboard'],
        'Transfer': ['open_transfer', 'download_csv']
    },
    'analysis': {
        'Teams': ['open_ranker', 'open_sides', 'open_picks', 'open_whiteboard', 'open_advanced'],
        'Keys': ['open_pivot', 'open_distro', 'open_plot'],
        'Data': ['open_results', 'open_teams', 'open_matches', 'open_users', 'open_progress', 'open_coach'],
        'Transfer': ['open_transfer', 'download_csv', 'open_events']
    },
    'admin': {
        'Admin': ['open_config', 'open_settings', 'open_event_gen', 'open_random'],
        'Reset': ['reset', 'reset_storage', 'reset_results', 'clear_events']
    }
}

// requirements for each button
const BUTTONS = {
    'scout':            { name: 'Scout',             limits: ['event'], configs: [MATCH_MODE, 'settings'] },
    'pit_scout':        { name: 'Pit Scout',         limits: ['teams'], configs: [PIT_MODE, 'settings'] },
    'note_scout':       { name: 'Note Scout',        limits: ['event'], configs: [NOTE_MODE, 'settings'] },
    'open_ranker':      { name: 'Team Rankings',     limits: ['event', 'admin', 'results'], configs: ['settings'] },
    'open_sides':       { name: 'Side-by-Side',      limits: ['event', 'admin', 'results'], configs: ['settings'] },
    'open_picks':       { name: 'Pick Lists',        limits: ['teams', 'admin'], configs: ['settings'] },
    'open_whiteboard':  { name: 'Whiteboard',        limits: ['matches', 'admin'], configs: ['whiteboard', 'settings'] },
    'open_advanced':    { name: 'Advanced',          limits: ['event', 'admin'], configs: ['settings'] },
    'open_results':     { name: 'Results',           limits: ['admin', 'results'], configs: ['settings'] },
    'open_teams':       { name: 'Team Profiles',     limits: ['teams', 'admin'], configs: ['settings'] },
    'open_matches':     { name: 'Match Summaries',   limits: ['event', 'admin'], configs: ['settings'] },
    'open_users':       { name: 'User Profiles',     limits: ['admin', 'any'], configs: [] },
    'open_pivot':       { name: 'Pivot Table',       limits: ['event', 'admin', 'results'], configs: ['settings'] },
    'open_distro':      { name: 'Distributions',     limits: ['event', 'admin', 'results'], configs: ['settings'] },
    'open_plot':        { name: 'Plotter',           limits: ['event', 'admin', 'results'], configs: ['settings'] },
    'open_coach':       { name: 'Coach View',        limits: ['event', 'admin', 'results'], configs: ['settings', 'coach-vals'] },
    'open_config':      { name: 'Config Builder',    limits: ['admin'], configs: [] },
    'open_settings':    { name: 'Settings Editor',   limits: ['admin'], configs: ['settings'] },
    'preload_event':    { name: 'Preload Event',     limits: [], configs: [] },
    'open_transfer':    { name: 'Transfer Raw Data', limits: ['event'], configs: [] },
    'open_progress':    { name: 'Scouting Progress', limits: ['teams', 'admin'], configs: [] },
    'open_events':      { name: 'Other Events',      limits: ['teams', 'admin'], configs: [] },
    'reset':            { name: 'Reset App',         limits: ['admin'], configs: [] },
    'reset_storage':    { name: 'Reset Storage',     limits: ['admin'], configs: [] },
    'reset_results':    { name: 'Reset Results',     limits: ['admin'], configs: [] },
    'clear_events':     { name: 'Clear Other Events',limits: ['admin'], configs: [] },
    'open_event_gen':   { name: 'Event Generator',   limits: ['admin'], configs: [] },
    'open_random':      { name: 'Random Result Generator',  limits: ['admin'], configs: ['settings'] },
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
    let role = get_cookie(ROLE_COOKIE, ROLE_DEFAULT)
    if (role == ROLE_DEFAULT)
    {
        window.open('index.html?page=index', '_self')
        return
    }

    // build core page
    let columns = CONFIGS[role]
    let page = new PageFrame('page', '')
    for (let col of Object.keys(columns))
    {
        let column = new ColumnFrame(col, col)
        page.add_column(column)
        for (let key of columns[col])
        {
            let button = new Button(key, BUTTONS[key].name, `check_press('${key}', ${key})`)
            if (col !== 'Transfer' || key.startsWith('open_'))
            {
                button.link = `check_press('${key}', ${key})`
            }
            column.add_input(button)
        }
    }

    // build sign out button
    let sign_out_page = new PageFrame('sign_out_page', '')
    let column = new ColumnFrame('sign_out_col', '')
    sign_out_page.add_column(column)
    let sign_out = new Button('sign_out', 'Sign Out')
    sign_out.link = 'sign_out()'
    column.add_input(sign_out)

    document.body.innerHTML += page.toString + sign_out_page.toString
}

/**
 * function:    on_config
 * parameters:  none
 * returns:     none
 * description: Fetch defaults, populate inputs with defaults, and apply theme.
 */
function on_config()
{
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

/**
 * HELPER FUNCTIONS
 */

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
    let event = get_event()
    let year = event.substr(0,4)
    let limits = BUTTONS[id].limits
    let configs = BUTTONS[id].configs

    // count results
    let matches = dal.get_results([], false).length
    let pits = dal.get_pits([], false).length

    // check each provided limiting parameter
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
    if (limits.includes('results') && matches === 0)
    {
        return `No results found.`
    }
    if (limits.includes('any') && pits === 0 && matches === 0)
    {
        return `No results found.`
    }

    // check that all necessary configs are present
    for (let i = 0; i < configs.length; ++i)
    {
        let config = configs[i]
        if (!config_exists(config, year))
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