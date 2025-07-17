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
    'matches': {
        'Scout': ['matches']
    },
    'pits': {
        'Notes': ['pits']
    },
    'drive': {
        'Coach': ['coach']
    },
    'tech': {
        'Technician': ['misc/2025-score-calculator']
    },
    'dash': {
        'Dashboard': ['dashboard']
    },
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
        'Event Prep': ['config-generator', 'events', 'event-generator']
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
        'Team': ['misc/event-planner', 'misc/team-profile', 'misc/top-partners', 'misc/sponsor-counter', 'misc/revival-counter', 'misc/socials'],
        'Events': ['misc/match-counter', 'misc/district-counter', 'misc/international-counter', 'misc/score-counter', 'misc/max-score', 'misc/verde'],
        'Game Specific': ['misc/2025-score-calculator']
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
    'misc/match-counter':   { name: 'Match Counter',            limits: [] },
    'misc/2025-score-calculator':   { name: '2025 Score Calculator',    limits: [] },
    'misc/district-counter':        { name: 'District Counter',         limits: [] },
    'misc/event-planner':           { name: 'Event Planner',            limits: [] },
    'misc/international-counter':   { name: 'International Counter',    limits: [] },
    'misc/max-score':               { name: 'Max Score',                limits: [] },
    'misc/revival-counter':         { name: 'Revival Counter',          limits: [] },
    'misc/score-counter':           { name: 'Score Counter',            limits: [] },
    'misc/socials':                 { name: 'Socials',                  limits: [] },
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
    else
    {
        sign_out()
    }
}

/**
 * Populates the page with either a given role or a stored role.
 * @param {string} role Selected role
 */
function open_role(role)
{
    let title = role
    if (role in TITLES)
    {
        title = TITLES[role]
    }

    if (title === role)
    {
        if (role === 'open_moralysis')
        {
            role = 'moralysis'
            title = 'More Analysis'
        }
        else if (role === 'open_extras')
        {
            role = 'extras'
            title = 'Extras'
        }
        else
        {
            sign_out()
        }
    }
    else
    {
        cfg.user.state.role = role
        cfg.user.store_config()
    }
    header_info.innerText = title
    role_page = role

    // redirect if there is only 1 option on the page
    let columns = CONFIGS[role]
    if (Object.keys(columns).length === 1)
    {
        let column = Object.values(columns)[0]
        if (column.length === 1)
        {
            window_open(build_url(column[0]))
            return
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
                button = new WRButton(BUTTONS[key].name, () => open_role(key))
            }
            else if (key === 'import_results')
            {
                button = new WRButton(BUTTONS[key].name, ZipHandler.import_results)
            }
            else if (key === 'export_results')
            {
                // NOTE: call is wrapped so that the event doesn't override the default parameter
                button = new WRButton(BUTTONS[key].name, () => ZipHandler.export_results())
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
    let sign_out_button = new WRButton('Sign Out', sign_out)
    sign_out_button.add_class('danger')
    column.add_input(sign_out_button)

    preview.replaceChildren(page, sign_out_page)
}

/**
 * HELPER FUNCTIONS
 */

/**
 * Clears the role and opens the role selector.
 */
function sign_out()
{
    cfg.set_role('')
    window_open(build_url('setup'))
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
    return has_teams() && Object.keys(dal.matches).length > 0
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
    let role = cfg.user.state.role
    if (role_page !== role)
    {
        open_role(role)
    }
    else
    {
        window_open(build_url('setup'), right)
    }
}