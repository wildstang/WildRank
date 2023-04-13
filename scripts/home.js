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

// role based layouts
const CONFIGS = {
    'scout': {
        'Scout': ['matches']
    },
    'note': {
        'Notes': ['pits', 'notes']
    },
    'drive': {
        'Drive Team': ['import_results', 'coach', 'whiteboard', 'bracket']
    },
    'analysis': {
        'Teams': ['ranker', 'sides', 'multipicklists'],
        'Keys': ['pivot', 'distro', 'plot', 'scatter'],
        'Results': ['import_results', 'results', 'cycles', 'note-viewer', 'export_results'],
        'Overviews': ['teams', 'match-overview', 'users', 'progress', 'events']
    },
    'admin': {
        'Configuration': ['settings', 'config-generator', 'config-debug', 'export', 'export_config'],
        'Schedule': ['schedule-importer', 'event-generator', 'scouter-scheduler', 'random', 'open_extras'],
        'Reset': ['reset', 'reset_cache', 'reset_storage', 'reset_results', 'clear_events', 'reset_config']
    },
    'advanced': {
        'Management': ['settings', 'transfer-raw', 'progress', 'config-debug', 'cache', 'storage'],
        'Reset': ['reset_cache', 'reset_storage', 'reset_config']
    },
    'extras': {
        'Debug': ['misc/test'],
        'Team': ['misc/event-planner', 'misc/team-profile'],
        'Events': ['misc/match-counter', 'misc/district-counter', 'misc/international-counter', 'misc/score-counter', 'misc/revival-counter', 'misc/max-score'],
        'Game Specific': ['misc/2022-score-estimator', 'misc/2023-score-estimator', 'misc/2023-rp']
    }
}

// requirements for each button
const BUTTONS = {
    'bracket':              { name: 'Double Elims',             limits: ['event', 'admin'], configs: ['settings', 'coach'] },
    'cache':                { name: 'Cache Manager',            limits: [], configs: [] },
    'clear_events':         { name: 'Clear Other Events',       limits: ['admin'], configs: [] },
    'coach':                { name: 'Coach View',               limits: ['event', 'admin', 'results'], configs: ['settings', 'coach'] },
    'config-debug':         { name: 'Config Debugger',          limits: [], configs: [] },
    'config-generator':     { name: 'Config Builder',           limits: ['admin'], configs: [] },
    'cycles':               { name: 'Cycles',                   limits: ['event', 'admin', 'results'], configs: ['settings'] },
    'distro':               { name: 'Distributions',            limits: ['teams', 'admin', 'any'], configs: ['settings'] },
    'download_csv':         { name: 'Export Results as Sheet',  limits: ['event', 'admin', 'any'], configs: [] },
    'event-generator':      { name: 'Event Generator',          limits: ['admin'], configs: [] },
    'events':               { name: 'Other Events',             limits: ['teams', 'admin'], configs: [] },
    'export':               { name: 'Server Exporter',          limits: ['admin'], configs: [] },
    'export_results':       { name: 'Export All Results',       limits: ['admin'], configs: [] },
    'match-overview':       { name: 'Match Summaries',          limits: ['event', 'admin'], configs: ['settings'] },
    'matches':              { name: 'Scout',                    limits: ['event'], configs: [MATCH_MODE, 'settings'] },
    'multipicklists':       { name: 'Pick Lists',               limits: ['teams', 'admin'], configs: ['settings'] },
    'notes':                { name: 'Note Scout',               limits: ['teams'], configs: [NOTE_MODE, 'settings'] },
    'note-viewer':          { name: 'Note Viewer',              limits: ['event', 'admin', 'results'], configs: ['settings'] },
    'open_extras':          { name: 'Extras',                   limits: ['admin'], configs: [] },
    'pits':                 { name: 'Pit Scout',                limits: ['teams'], configs: [PIT_MODE, 'settings'] },
    'pivot':                { name: 'Pivot Table',              limits: ['teams', 'admin', 'any'], configs: ['settings'] },
    'plot':                 { name: 'Plotter',                  limits: ['event', 'admin', 'results'], configs: ['settings'] },
    'preload_event':        { name: 'Preload Event',            limits: [], configs: [] },
    'progress':             { name: 'Scouting Progress',        limits: ['teams'], configs: [] },
    'random':               { name: 'Random Result Generator',  limits: ['admin'], configs: ['settings'] },
    'ranker':               { name: 'Stat Builder',             limits: ['teams', 'admin', 'any'], configs: ['settings'] },
    'reset':                { name: 'Reset App',                limits: ['admin'], configs: [] },
    'reset_cache':          { name: 'Reset Cache',              limits: [], configs: [] },
    'reset_results':        { name: 'Reset Results',            limits: ['admin'], configs: [] },
    'reset_storage':        { name: 'Reset Storage',            limits: [], configs: [] },
    'reset_config':         { name: 'Reset Configuration',      limits: [], configs: [] },
    'results':              { name: 'Results',                  limits: ['event', 'admin', 'results'], configs: ['settings'] },
    'scatter':              { name: 'Scatter',                  limits: ['teams', 'admin', 'any'], configs: ['settings'] },
    'schedule-importer':    { name: 'Schedule Importer',        limits: ['admin'], configs: [] },
    'settings':             { name: 'Settings Editor',          limits: [], configs: ['settings'] },
    'sides':                { name: 'Side-by-Side',             limits: ['teams', 'admin', 'any'], configs: ['settings'] },
    'storage':              { name: 'Storage Manager',          limits: [], configs: [] },
    'teams':                { name: 'Team Profiles',            limits: ['teams', 'admin'], configs: ['settings'] },
    'transfer-raw':         { name: 'Transfer Raw Data',        limits: [], configs: [] },
    'import_results':       { name: 'Import All Results',       limits: [], configs: [] },
    'export_config':        { name: 'Export Config',            limits: [], configs: [] },
    'users':                { name: 'User Profiles',            limits: ['admin', 'any'], configs: [] },
    'whiteboard':           { name: 'Whiteboard',               limits: ['matches', 'admin'], configs: ['whiteboard', 'settings'] },
    'scouter-scheduler':    { name: 'Scouter Scheduler',        limits: ['admin'], configs: [] },
    'misc/match-counter':   { name: 'Match Counter',            limits: ['admin'], configs: [] },
    'misc/2022-score-estimator':    { name: '2022 Score Estimator',     limits: ['admin'], configs: [] },
    'misc/2023-rp':                 { name: '2023 RP Adjustment',       limits: ['admin'], configs: [] },
    'misc/2023-score-estimator':    { name: '2023 Score Estimator',     limits: ['admin'], configs: [] },
    'misc/district-counter':        { name: 'District Counter',         limits: ['admin'], configs: [] },
    'misc/event-planner':           { name: 'Event Planner',            limits: ['admin'], configs: [] },
    'misc/international-counter':   { name: 'International Counter',    limits: ['admin'], configs: [] },
    'misc/max-score':               { name: 'Max Score',                limits: ['admin'], configs: [] },
    'misc/score-counter':           { name: 'Score Counter',            limits: ['admin'], configs: [] },
    'misc/team-profile':            { name: 'Team Profile',             limits: ['admin'], configs: [] },
    'misc/revival-counter':         { name: 'Revival Counter',          limits: ['admin'], configs: [] },
    'misc/test':                    { name: 'Input Tester',             limits: ['admin'], configs: [] }
}

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    let role = get_parameter(ROLE_COOKIE, ROLE_DEFAULT)
    if (role === ROLE_DEFAULT || typeof role === 'undefined')
    {
        window.open('index.html?page=index', '_self')
        return
    }

    let title = role
    switch (role)
    {
        case 'scout':
            title = 'Scouter'
            break
        case 'note':
            title = 'Note Taker'
            break
        case 'drive':
            title = 'Drive Team'
            break
        case 'analysis':
            title = 'Analyst'
            break
        case 'advanced':
            title = 'Advanced'
            break
        case 'admin':
            title = 'Administrator'
            break
    }
    document.getElementById('header_info').innerHTML = title

    // redirect if there is only 1 option on the page
    let columns = CONFIGS[role]
    if (Object.keys(columns).length === 1)
    {
        let column = Object.values(columns)[0]
        if (column.length === 1)
        {
            return window_open(check_press(column[0]), '_self')
        }
    }

    // build core page
    let page = new PageFrame('page', '')
    for (let col of Object.keys(columns))
    {
        let column = new ColumnFrame(col, col)
        page.add_column(column)
        for (let key of columns[col])
        {
            let button = new Button(key, BUTTONS[key].name, `check_press('${key}', ${key})`)
            if (!key.includes('_') && col !== 'Reset')
            {
                button.link = `check_press('${key}')`
            }
            else if (key === 'open_extras')
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
    return Object.keys(dal.teams).length > 0
}

/**
 * function:    has_matches
 * parameters:  none
 * returns:     If the current event matches are loaded
 * description: Determines if the current event matches are loaded.
 */
function has_matches()
{
    return Object.keys(dal.matches).length > 0
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
    if (limits.includes('admin') && !cfg.is_admin(get_user()))
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
        if (!cfg.hasOwnProperty(config))
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
function check_press(id, on_press=open_page)
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
        return on_press(id)
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
    return get_cookie(EVENT_COOKIE, cfg.defaults.event_id)
}

/**
 * function:    get_user
 * parameters:  none
 * returns:     Currently entered user ID.
 * description: Returns text in user id box.
 */
function get_user()
{
    return get_cookie(USER_COOKIE, cfg.defaults.user_id)
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
 * function:    open_extras
 * parameters:  none
 * returns:     none
 * description: Open the extras home page.
 */
function open_extras()
{
    return build_url('index', {'page': 'home', 'role': 'extras'})
}

/**
 * function:    import_results
 * parameters:  none
 * returns:     none
 * description: Starts the zip import process for results.
 */
function import_results()
{
    let handler = new ZipHandler()
    handler.match     = true
    handler.note      = true
    handler.pit       = true
    handler.pictures  = true
    handler.picklists = true
    handler.import_zip_from_file()
}

/**
 * function:    export_results
 * parameters:  none
 * returns:     none
 * description: Starts the zip export process for results.
 */
function export_results()
{
    let handler = new ZipHandler()
    handler.match     = true
    handler.note      = true
    handler.pit       = true
    handler.pictures  = true
    handler.user = get_cookie(USER_COOKIE, USER_DEFAULT)
    handler.export_zip()
}

/**
 * function:    export_config
 * parameters:  none
 * returns:     none
 * description: Starts the zip export process for config.
 */
function export_config()
{
    let handler = new ZipHandler()
    handler.event       = true
    handler.config      = true
    handler.smart_stats = true
    handler.coach       = true
    handler.settings    = true
    handler.pictures    = true
    handler.user = get_cookie(USER_COOKIE, USER_DEFAULT)
    handler.export_zip()
}