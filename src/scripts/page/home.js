/**
 * file:        home.js
 * description: The primary home page for users. Dynamically built based on the user's role.
 * author:      Liam Fruzyna
 * date:        2021-12-18
 */

/**
 * PAGE INIT
 */

var cache_import = get_parameter('cache_import', '')

// role based layouts
// TODO: consider importing everything from analysis
const CONFIGS = {
    'analysis': {
        'Results': ['import_results', 'result_count', 'open_moralysis'],
        'Qualitative': ['ranker', 'multipicklists', 'note-viewer'],
        'Quantitative': ['pivot', 'results', 'plot']
    },
    'moralysis': {
        'Teams': ['ranker', 'multipicklists'],
        'Keys': ['pivot', 'plot', 'scatter'],
        'Results': ['import_results', 'results', 'cycles', 'note-viewer', 'export_results'],
        'Overviews': ['teams', 'match-overview', 'users', 'dashboard']
    },
    'prep': {
        'Event Prep': ['config-generator', 'events', 'misc/socials', 'event-generator'],
        'Edit Values': ['edit-coach', 'edit-favorites', 'edit-fms']
    },
    'debug': {
        'Config': ['settings', 'config-debug'],
        'App': ['storage', 'cache', 'misc/test']
    },
    'danger': {
        'Reset': ['reset', 'reset_config', 'reset_cache', 'reset_storage', 'reset_results', 'clear_events', 'reset_event'],
        'Other': ['random']
    },
    'extras': {
        'App': ['bracket', 'whiteboard', 'export'],
        'Team': ['misc/event-planner', 'misc/team-profile', 'misc/top-partners', 'misc/sponsor-counter', 'misc/revival-counter'],
        'Events': ['misc/match-counter', 'misc/district-counter', 'misc/international-counter', 'misc/score-counter', 'misc/max-score', 'misc/verde', 'misc/live'],
        'Game Specific': ['misc/2025-score-calculator', 'misc/2025-audit']
    }
}

const TITLES = {
    'analysis': 'Analyst',
    'moralysis': 'More Analysis',
    'prep': 'Event Prep',
    'debug': 'Debug',
    'danger': 'Danger Zone',
    'extras': 'Extras'
}

// requirements for each button
const BUTTONS = {
    'bracket':              { name: 'Double Elims',             limits: ['matches'] },
    'cache':                { name: 'Cache Manager',            limits: [] },
    'clear_events':         { name: 'Clear Other Events',       limits: [] },
    'coach':                { name: 'Coach View',               limits: ['matches'] },
    'config-debug':         { name: 'Config Debugger',          limits: [] },
    'config-generator':     { name: 'Config Builder',           limits: ['admin'] },
    'cycles':               { name: 'Cycles',                   limits: ['matches', 'results'] },
    'dashboard':            { name: 'Dashboard',                limits: [''] },
    'edit-coach':           { name: 'Edit Coach Values',        limits: [''] },
    'edit-favorites':       { name: 'Edit Favorites',           limits: [''] },
    'edit-fms':             { name: 'Edit FMS Results',         limits: ['matches'] },
    'event-generator':      { name: 'Event Generator',          limits: [] },
    'events':               { name: 'Other Events',             limits: ['teams'] },
    'export':               { name: 'Server Exporter',          limits: ['admin'] },
    'export_results':       { name: 'Export All Results',       limits: [] },
    'match-overview':       { name: 'Match Summaries',          limits: ['matches'] },
    'matches':              { name: 'Scout',                    limits: ['matches'] },
    'multipicklists':       { name: 'Pick Lists',               limits: ['teams'] },
    'note-viewer':          { name: 'Note Viewer',              limits: ['teams', 'any'] },
    'open_extras':          { name: 'Extras',                   limits: [] },
    'open_moralysis':       { name: 'More',                     limits: [] },
    'pits':                 { name: 'Pit Scout',                limits: ['teams'] },
    'pivot':                { name: 'Pivot Table',              limits: ['teams', 'any'] },
    'plot':                 { name: 'Plotter',                  limits: ['matches', 'results'] },
    'preload_event':        { name: 'Preload Event',            limits: [] },
    'random':               { name: 'Random Result Generator',  limits: ['admin', 'teams'] },
    'ranker':               { name: 'Stat Builder',             limits: ['teams', 'any'] },
    'reset':                { name: 'Reset App',                limits: ['admin'] },
    'reset_cache':          { name: 'Reset Cache',              limits: [] },
    'reset_results':        { name: 'Reset Results',            limits: [] },
    'reset_storage':        { name: 'Reset Storage',            limits: [] },
    'reset_config':         { name: 'Reset Configuration',      limits: [] },
    'reset_event':          { name: 'Reset Event',              limits: [] },
    'results':              { name: 'Raw Results',              limits: ['matches', 'results'] },
    'scatter':              { name: 'Scatter',                  limits: ['teams', 'any'] },
    'settings':             { name: 'Settings Editor',          limits: [] },
    'storage':              { name: 'Storage Manager',          limits: [] },
    'teams':                { name: 'Team Profiles',            limits: ['teams'] },
    'import_results':       { name: 'Import All Results',       limits: [] },
    'export_config':        { name: 'Export Config',            limits: [] },
    'users':                { name: 'User Profiles',            limits: ['admin'] },
    'whiteboard':           { name: 'Whiteboard',               limits: ['matches'] },
    'misc/match-counter':           { name: 'Match Counter',            limits: [] },
    'misc/2025-audit':              { name: '2025 Audit',               limits: [] },
    'misc/2025-score-calculator':   { name: '2025 Score Calculator',    limits: [] },
    'misc/district-counter':        { name: 'District Counter',         limits: [] },
    'misc/event-planner':           { name: 'Event Planner',            limits: [] },
    'misc/international-counter':   { name: 'International Counter',    limits: [] },
    'misc/live':                    { name: 'Live Event Tracker',       limits: [] },
    'misc/max-score':               { name: 'Max Score',                limits: [] },
    'misc/revival-counter':         { name: 'Revival Counter',          limits: [] },
    'misc/score-counter':           { name: 'Score Counter',            limits: [] },
    'misc/socials':                 { name: 'Social Handles',           limits: [] },
    'misc/sponsor-counter':         { name: 'Sponsor Counter',          limits: [] },
    'misc/team-profile':            { name: 'Team Profile',             limits: [] },
    'misc/test':                    { name: 'Input Tester',             limits: [] },
    'misc/top-partners':            { name: 'Top Partners',             limits: [] },
    'misc/verde':                   { name: 'VerdeRank',                limits: ['teams'] }
}

var role_page = ''

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    if (cfg.user.state.role)
    {
        open_role(cfg.user.state.role)
    }

    // display a button to import from cache
    if (caches !== undefined && cache_import)
    {
        check_cache()
    }
    else if (cfg.user.state.role === '')
    {
        home()
    }
}

/**
 * Attempts to import a zip from the cache.
 */
async function check_cache()
{
    let names = await caches.keys()
    let current = names.length > 0 ? names[0] : 'default'
    let cache = await caches.open(current)
    let cache_res = await cache.match('/import')
    if (cache_res)
    {
        let import_button = new WRButton(`Import ${cache_import}?`, () => import_zip_from_cache(cache_res))
        import_button.add_class('advance')
        let page = new WRPage('', [new WRColumn('', [import_button])])
        preview.insertBefore(page, preview.firstChild)
        cache_import = ''
    }
}

/**
 * Populates the page with either a given role or a stored role.
 * @param {string} role Selected role
 */
function open_role(role)
{
    header_info.innerText = TITLES[role]
    role_page = role

    // build core page
    let page = new WRPage()
    let columns = CONFIGS[role]
    for (let col of Object.keys(columns))
    {
        let column = new WRColumn(col)
        page.add_column(column)
        for (let key of columns[col])
        {
            let button
            if (key === 'result_count')
            {
                button = new WRMultiNumber('', ['T', 'M'], [dal.count_team_results(), dal.count_match_results()])
                button.on_click = () => window_open(build_url('dashboard'))
            }
            else if (is_blocked(key))
            {
                button = new WRButton(BUTTONS[key].name, () => alert(is_blocked(key)))
            }
            else if (!key.includes('_') && key !== 'reset')
            {
                button = new WRLinkButton(BUTTONS[key].name, build_url(key))
            }
            else if (key.startsWith('open_'))
            {
                button = new WRButton(BUTTONS[key].name, () => open_role(key.substring(5)))
            }
            else if (key === 'import_results')
            {
                button = new WRButton(BUTTONS[key].name, import_results)
                button.add_class('transfer')
            }
            else if (key === 'export_results')
            {
                // NOTE: call is wrapped so that the event doesn't override the default parameter
                button = new WRButton(BUTTONS[key].name, export_results)
                button.add_class('transfer')
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
    let sign_out_button = new WRButton('Sign Out', home)
    sign_out_button.add_class('danger')
    column.add_input(sign_out_button)

    preview.replaceChildren(page, sign_out_page)
}

/**
 * HELPER FUNCTIONS
 */

/**
 * function:    has_teams
 * parameters:  none
 * returns:     If the current event teams are loaded
 * description: Determines if the current event teams are loaded.
 */
function has_teams()
{
    return dal.team_numbers.length > 0
}

/**
 * function:    has_matches
 * parameters:  none
 * returns:     If the current event matches are loaded
 * description: Determines if the current event matches are loaded.
 */
function has_matches()
{
    return has_teams() && dal.match_keys.length > 0
}
 
/**
 * function:    is_blocked
 * parameters:  button container id
 * returns:     reason why button is blocked
 * description: Determines if a button should be blocked and explains why.
 */
function is_blocked(id)
{
    let limits = BUTTONS[id].limits
    let configs = BUTTONS[id].configs

    // count results
    let matches = dal.count_match_results()
    let teams = dal.count_team_results()
    // check each provided limiting parameter
    if (limits.includes('teams') && !has_teams())
    {
        return `Missing team data.`
    }
    if (limits.includes('matches') && !has_matches())
    {
        return `Missing match data.`
    }
    if (limits.includes('admin') && !cfg.is_admin())
    {
        return `Admin access required.`
    }
    if (limits.includes('results') && matches === 0)
    {
        return `No results found.`
    }
    if (limits.includes('any') && teams === 0 && matches === 0)
    {
        return `No results found.`
    }
    return false
}

/**
 * Override the WildRank link to handle moralysis and extras pages.
 * @param {Boolean} right 
 */
function home(right=false)
{
    if (role_page === cfg.user.state.role)
    {
        cfg.set_role('')
        window_open(build_url('setup'), right)
    }
    else
    {
        open_role(cfg.user.state.role)
    }
}