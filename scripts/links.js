/**
 * file:        new-links.js
 * description: Contains link opening functions for the index of the web app.
 * author:      Liam Fruzyna
 * date:        2022-09-26
 */

var BLANK_PAGES = {
    'config-generator': ['event', 'user'],
    'custom-match': ['event'],
    'edit-coach': ['event'],
    'edit-stats': ['event'],
    settings: ['event', 'user'],
    random: ['event', 'user'],
    'event-generator': ['event'],
    'schedule-importer': ['event'],
    'transfer-raw': ['event', 'user'],
    progress: ['event'],
    events: ['event'],
    cache: [],
    storage: [],
    about: [],
    export: ['event'],
    'config-debug': ['event'],
    bracket: ['event', 'user'],
    scout: ['event', 'user', 'position'],
    note: ['event', 'user', 'position'],
        // type
        // match
        // team
        // alliance
        // edit
    'note-viewer': ['event'],
    'scouter-scheduler': [],
    'misc/2022-score-estimator': [],
    'misc/2023-rp': [],
    'misc/2023-score-estimator': [],
    'misc/match-counter': [],
    'misc/score-counter': [],
    'misc/revival-counter': [],
    'misc/team-profile': [],
    'misc/test': [],
    'misc/district-counter': ['year'],
    'misc/international-counter': ['year'],
    'misc/event-planner': ['year'],
    'misc/max-score': ['year'],
    'misc/top-partners': []
}

var SELECTION_PAGES = {
    matches: ['event', 'user', 'position', MATCH_MODE],
    notes: ['event', 'user', 'position', NOTE_MODE],
    pits: ['event', 'user', 'position', PIT_MODE],
    ranker: ['event'],
    sides: ['event'],
    multipicklists: ['event'],
    whiteboard: ['event'],
    cycles: ['event'],
    teams: ['event', 'user'],
    'match-overview': ['event', 'user'],
    users: ['event', 'user'],
    pivot: ['event', 'user'],
    distro: ['event', 'user'],
    plot: ['event', 'user'],
    scatter: ['event', 'user'],
    coach: ['event', 'user'],
    results: ['event'], // file
    cycles: ['event'] // file
}

function open_page(page, params={})
{
    let file = ''
    let requirements = []
    if (page in BLANK_PAGES)
    {
        file = 'index'
        requirements = BLANK_PAGES[page]
    }
    else if (page in SELECTION_PAGES)
    {
        file = 'selection'
        requirements = SELECTION_PAGES[page]
        if (page === 'notes')
        {
            page = 'matches'
        }
    }
    else
    {
        return ''
    }
    params.page = page

    for (let p of requirements)
    {
        let home = false
        let index = false
        if (window.location.pathname.includes('page=home'))
        {
            home = true
        }
        else if (window.location.pathname.includes('page=index'))
        {
            index = true
        }
        switch (p)
        {
            case 'event':
                if (index)
                {
                    params[EVENT_COOKIE] = document.getElementById('event_id').value
                }
                else if (home)
                {
                    params[EVENT_COOKIE] = get_cookie(EVENT_COOKIE, cfg.defaults.event_id)
                }
                else
                {
                    params[EVENT_COOKIE] = dal.event_id
                }
                break
            case 'position':
                if (index)
                {
                    params[POSITION_COOKIE] = document.getElementById('position').value
                }
                else
                {
                    params[POSITION_COOKIE] = get_cookie(POSITION_COOKIE, POSITION_DEFAULT)
                }
                break
            case 'user':
                if (index)
                {
                    params[USER_COOKIE] = document.getElementById('user_id').value
                }
                else
                {
                    params[USER_COOKIE] = get_cookie(USER_COOKIE, cfg.defaults.user_id)
                }
                break
            case 'year':
                params.year = cfg.year
                break
            case MATCH_MODE:
            case NOTE_MODE:
            case PIT_MODE:
                params.type = p
                break
        }
    }
    return build_url(file, params)
}

/**
 * function:    sign_out
 * parameters:  none
 * returns:     none
 * description: Return to the role selection (index) page.
 */
function sign_out()
{
    set_cookie(ROLE_COOKIE, ROLE_DEFAULT)
    return 'index.html'
}

/**
 * keyboard shortcuts
 */
document.onkeydown = function (e)
{
    let page = ''
    if (e.altKey && e.key === 's')
    {
        page = open_page('matches')
    }
    else if (e.altKey && e.key === 't')
    {
        page = open_page('pits')
    }
    else if (e.altKey && e.key === 'c')
    {
        page = open_page('coach')
    }
    else if (e.altKey && e.key === 'r')
    {
        page = open_page('results')
    }
    else if (e.altKey && e.key === 'p')
    {
        page = open_page('pivot')
    }
    else if (e.altKey && e.key === 'l')
    {
        page = open_page('picklists')
    }

    if (page !== '')
    {
        window_open(page, '_self')
    }
    else if (e.altKey && e.key === 'd')
    {
        if (get_cookie(THEME_COOKIE, THEME_DEFAULT) === 'dark')
        {
            set_cookie(THEME_COOKIE, THEME_DEFAULT)
        }
        else
        {
            set_cookie(THEME_COOKIE, 'dark')
        }
        apply_theme()
    }
    else
    {
        return
    }
    return false
}