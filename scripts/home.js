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
        'Qualitative': ['ranker', 'multipicklists', 'note-viewer'],
        'Quantitative': ['pivot', 'results', 'plot', 'open_moralysis'],
        'Results': ['import_results', 'progress', 'export_results']
    },
    'moralysis': {
        'Teams': ['ranker', 'sides', 'multipicklists'],
        'Keys': ['pivot', 'distro', 'plot', 'scatter'],
        'Results': ['import_results', 'results', 'cycles', 'note-viewer', 'export_results'],
        'Overviews': ['teams', 'match-overview', 'users', 'progress', 'events']
    },
    'admin': {
        'Admin': ['reset', 'config-generator', 'export', 'random']
    },
    'advanced': {
        'Configuration': ['settings', 'config-debug', 'export_config'],
        'Schedule': ['schedule-importer', 'event-generator', 'scouter-scheduler', 'open_extras'],
        'Management': ['transfer-raw', 'progress', 'cache', 'storage'],
        'Reset': ['reset_config', 'reset_cache', 'reset_storage', 'reset_results', 'clear_events', 'reset_event']
    },
    'extras': {
        'Debug': ['misc/test'],
        'Team': ['misc/event-planner', 'misc/team-profile', 'misc/top-partners'],
        'Events': ['misc/match-counter', 'misc/district-counter', 'misc/international-counter', 'misc/score-counter', 'misc/revival-counter', 'misc/max-score', 'misc/verde'],
        'Game Specific': ['misc/2022-score-estimator', 'misc/2023-score-estimator', 'misc/2023-rp']
    }
}

// requirements for each button
const BUTTONS = {
    'bracket':              { name: 'Double Elims',             limits: ['event'], configs: ['settings', 'coach'] },
    'cache':                { name: 'Cache Manager',            limits: [], configs: [] },
    'clear_events':         { name: 'Clear Other Events',       limits: [], configs: [] },
    'coach':                { name: 'Coach View',               limits: ['event', 'results'], configs: ['settings', 'coach'] },
    'config-debug':         { name: 'Config Debugger',          limits: [], configs: [] },
    'config-generator':     { name: 'Config Builder',           limits: ['admin'], configs: [] },
    'cycles':               { name: 'Cycles',                   limits: ['event', 'results'], configs: ['settings'] },
    'distro':               { name: 'Distributions',            limits: ['teams', 'any'], configs: ['settings'] },
    'download_csv':         { name: 'Export Results as Sheet',  limits: ['event', 'any'], configs: [] },
    'event-generator':      { name: 'Event Generator',          limits: [], configs: [] },
    'events':               { name: 'Other Events',             limits: ['teams'], configs: [] },
    'export':               { name: 'Server Exporter',          limits: ['admin'], configs: [] },
    'export_results':       { name: 'Export All Results',       limits: [], configs: [] },
    'match-overview':       { name: 'Match Summaries',          limits: ['event'], configs: ['settings'] },
    'matches':              { name: 'Scout',                    limits: ['event'], configs: [MATCH_MODE, 'settings'] },
    'multipicklists':       { name: 'Pick Lists',               limits: ['teams'], configs: ['settings'] },
    'notes':                { name: 'Note Scout',               limits: ['teams'], configs: [NOTE_MODE, 'settings'] },
    'note-viewer':          { name: 'Note Viewer',              limits: ['event', 'results'], configs: ['settings'] },
    'open_extras':          { name: 'Extras',                   limits: [], configs: [] },
    'open_moralysis':       { name: 'More',                     limits: [], configs: [] },
    'pits':                 { name: 'Pit Scout',                limits: ['teams'], configs: [PIT_MODE, 'settings'] },
    'pivot':                { name: 'Pivot Table',              limits: ['teams', 'any'], configs: ['settings'] },
    'plot':                 { name: 'Plotter',                  limits: ['event', 'results'], configs: ['settings'] },
    'preload_event':        { name: 'Preload Event',            limits: [], configs: [] },
    'progress':             { name: 'Scouting Progress',        limits: ['teams'], configs: [] },
    'random':               { name: 'Random Result Generator',  limits: ['admin'], configs: ['settings'] },
    'ranker':               { name: 'Stat Builder',             limits: ['teams', 'any'], configs: ['settings'] },
    'reset':                { name: 'Reset App',                limits: ['admin'], configs: [] },
    'reset_cache':          { name: 'Reset Cache',              limits: [], configs: [] },
    'reset_results':        { name: 'Reset Results',            limits: [], configs: [] },
    'reset_storage':        { name: 'Reset Storage',            limits: [], configs: [] },
    'reset_config':         { name: 'Reset Configuration',      limits: [], configs: [] },
    'reset_event':          { name: 'Reset Event',              limits: [], configs: [] },
    'results':              { name: 'Raw Results',              limits: ['event', 'results'], configs: ['settings'] },
    'scatter':              { name: 'Scatter',                  limits: ['teams', 'any'], configs: ['settings'] },
    'schedule-importer':    { name: 'Schedule Importer',        limits: [], configs: [] },
    'settings':             { name: 'Settings Editor',          limits: [], configs: ['settings'] },
    'sides':                { name: 'Side-by-Side',             limits: ['teams', 'any'], configs: ['settings'] },
    'storage':              { name: 'Storage Manager',          limits: [], configs: [] },
    'teams':                { name: 'Team Profiles',            limits: ['teams'], configs: ['settings'] },
    'transfer-raw':         { name: 'Transfer Raw Data',        limits: [], configs: [] },
    'import_results':       { name: 'Import All Results',       limits: [], configs: [] },
    'export_config':        { name: 'Export Config',            limits: [], configs: [] },
    'users':                { name: 'User Profiles',            limits: ['admin', 'any'], configs: [] },
    'whiteboard':           { name: 'Whiteboard',               limits: ['matches'], configs: ['whiteboard', 'settings'] },
    'scouter-scheduler':    { name: 'Scouter Scheduler',        limits: [], configs: [] },
    'misc/match-counter':   { name: 'Match Counter',            limits: [], configs: [] },
    'misc/2022-score-estimator':    { name: '2022 Score Estimator',     limits: [], configs: [] },
    'misc/2023-rp':                 { name: '2023 RP Adjustment',       limits: [], configs: [] },
    'misc/2023-score-estimator':    { name: '2023 Score Estimator',     limits: [], configs: [] },
    'misc/district-counter':        { name: 'District Counter',         limits: [], configs: [] },
    'misc/event-planner':           { name: 'Event Planner',            limits: [], configs: [] },
    'misc/international-counter':   { name: 'International Counter',    limits: [], configs: [] },
    'misc/max-score':               { name: 'Max Score',                limits: [], configs: [] },
    'misc/revival-counter':         { name: 'Revival Counter',          limits: [], configs: [] },
    'misc/score-counter':           { name: 'Score Counter',            limits: [], configs: [] },
    'misc/team-profile':            { name: 'Team Profile',             limits: [], configs: [] },
    'misc/test':                    { name: 'Input Tester',             limits: [], configs: [] },
    'misc/top-partners':            { name: 'Top Partners',             limits: [], configs: [] },
    'misc/verde':                   { name: 'VerdeRank',                limits: [, 'teams'], configs: [] }
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
        case 'extras':
            title = 'Extras'
            break
        case 'moralysis':
            title = 'More Analysis'
            break
    }
    header_info.innerHTML = title

    // redirect if there is only 1 option on the page
    let columns = CONFIGS[role]
    if (Object.keys(columns).length === 1)
    {
        let column = Object.values(columns)[0]
        if (column.length === 1)
        {
            return window_open(open_page(column[0]), '_self')
        }
    }

    // build core page
    let page = new WRPage()
    for (let col of Object.keys(columns))
    {
        let column = new WRColumn(col)
        page.add_column(column)
        for (let key of columns[col])
        {
            let button
            if (is_blocked(key))
            {
                button = new WRButton(BUTTONS[key].name, () => alert(is_blocked(key)))
            }
            else if (!key.includes('_') && key !== 'reset')
            {
                button = new WRLinkButton(BUTTONS[key].name, open_page(key))
            }
            else if (key.startsWith('open_'))
            {
                button = new WRLinkButton(BUTTONS[key].name, eval(`${key}()`))
            }
            else
            {
                button = new WRButton(BUTTONS[key].name, () => eval(`${key}()`))
            }
            column.add_input(button)
        }
    }

    // build sign out button
    let sign_out_page = new WRPage()
    let column = new WRColumn()
    sign_out_page.add_column(column)
    let sign_out_button = new WRLinkButton('Sign Out', sign_out())
    column.add_input(sign_out_button)

    body.replaceChildren(page, sign_out_page)
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
 * function:    open_moralysis
 * parameters:  none
 * returns:     none
 * description: Open the extras home page.
 */
function open_moralysis()
{
    return build_url('index', {'page': 'home', 'role': 'moralysis'})
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
    handler.import_zip_from_file(true)
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