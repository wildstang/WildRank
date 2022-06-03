/**
 * file:        links.js
 * description: Contains link opening functions for the index of the web app.
 * author:      Liam Fruzyna
 * date:        2021-05-24
 */

/**
 * function:    scout
 * parameters:  none
 * returns:     none
 * description: Start match scouting mode.
 */
function scout()
{
    let query = {'page': 'matches', [TYPE_COOKIE]: MATCH_MODE, [EVENT_COOKIE]: get_event(), [POSITION_COOKIE]: get_position(), [USER_COOKIE]: get_user()}
    return build_url('selection', query)
}

/**
 * function:    pit_scout
 * parameters:  none
 * returns:     none
 * description: Start pit scouting mode.
 */
function pit_scout()
{
    let query = {'page': 'pits', [TYPE_COOKIE]: PIT_MODE, [EVENT_COOKIE]: get_event(), [POSITION_COOKIE]: get_position(), [USER_COOKIE]: get_user()}
    return build_url('selection', query)
}

/**
 * function:    open_ranker
 * parameters:  none
 * returns:     none
 * description: Open the team ranker interface.
 */
function open_ranker()
{
    return build_url('selection', {'page': 'ranker', [EVENT_COOKIE]: get_event()})
}

/**
 * function:    open_sides
 * parameters:  none
 * returns:     none
 * description: Open the side-by-side comparison interface.
 */
function open_sides()
{
    return build_url('selection', {'page': 'sides', [EVENT_COOKIE]: get_event()})
}

/**
 * function:    open_picks
 * parameters:  none
 * returns:     none
 * description: Open the pick list interface.
 */
function open_picks()
{
    return build_url('selection', {'page': 'picklists', [EVENT_COOKIE]: get_event()})
}

/**
 * function:    open_whiteboard
 * parameters:  none
 * returns:     none
 * description: Open the virtual whiteboard.
 */
function open_whiteboard()
{
    return build_url('selection', {'page': 'whiteboard', [EVENT_COOKIE]: get_event()})
}

/**
 * function:    open_advanced
 * parameters:  none
 * returns:     none
 * description: Open the advanced stats page.
 */
function open_advanced()
{
    return build_url('selection', {'page': 'advanced', [EVENT_COOKIE]: get_event()})
}

/**
 * function:    open_results
 * parameters:  none
 * returns:     none
 * description: Open the results of the selected scouting mode.
 */
function open_results()
{
    return build_url('selection', {'page': 'results', [EVENT_COOKIE]: get_event()})
}

/**
 * function:    open_teams
 * parameters:  none
 * returns:     none
 * description: Open the team overview.
 */
function open_teams()
{
    return build_url('selection', {'page': 'teams', [EVENT_COOKIE]: get_event(), [USER_COOKIE]: get_user()})
}

/**
 * function:    open_matches
 * parameters:  none
 * returns:     none
 * description: Open the match overview.
 */
function open_matches()
{
    return build_url('selection', {'page': 'match-overview', [EVENT_COOKIE]: get_event(), [USER_COOKIE]: get_user()})
}

/**
 * function:    open_users
 * parameters:  none
 * returns:     none
 * description: Open the user overview.
 */
function open_users()
{
    return build_url('selection', {'page': 'users', [EVENT_COOKIE]: get_event(), [USER_COOKIE]: get_user()})
}

/**
 * function:    open_pivot
 * parameters:  none
 * returns:     none
 * description: Open the pivot table page.
 */
function open_pivot()
{
    return build_url('selection', {'page': 'pivot', [EVENT_COOKIE]: get_event(), [USER_COOKIE]: get_user()})
}

/**
 * function:    open_distro
 * parameters:  none
 * returns:     none
 * description: Open the distribution plot page.
 */
function open_distro()
{
    return build_url('selection', {'page': 'distro', [EVENT_COOKIE]: get_event(), [USER_COOKIE]: get_user()})
}

/**
 * function:    open_plot
 * parameters:  none
 * returns:     none
 * description: Open the plot page.
 */
function open_plot()
{
    return build_url('selection', {'page': 'plot', [EVENT_COOKIE]: get_event(), [USER_COOKIE]: get_user()})
}

/**
 * function:    open_config
 * parameters:  none
 * returns:     none
 * description: Open the config generator.
 */
function open_config()
{
    return build_url('index', {'page': 'config-generator', [EVENT_COOKIE]: get_event(), [USER_COOKIE]: get_user()})
}

/**
 * function:    open_coach
 * parameters:  none
 * returns:     none
 * description: Open the drive coach view page.
 */
function open_coach()
{
    return build_url('selection', {'page': 'coach', [EVENT_COOKIE]: get_event(), [USER_COOKIE]: get_user()})
}

/**
 * function:    open_settings
 * parameters:  none
 * returns:     none
 * description: Open the settings editor.
 */
function open_settings()
{
    return build_url('index', {'page': 'settings', [EVENT_COOKIE]: get_event(), [USER_COOKIE]: get_user()})
}

/**
 * function:    open_random
 * parameters:  none
 * returns:     none
 * description: Open the generate random results page.
 */
function open_random()
{
    return build_url('index', {'page': 'random', [EVENT_COOKIE]: get_event(), [POSITION_COOKIE]: get_position(), [USER_COOKIE]: get_user()})
}

/**
 * function:    open_event_gen
 * parameters:  none
 * returns:     none
 * description: Open the generate random results page.
 */
function open_event_gen()
{
    return build_url('index', {'page': 'event-generator', [EVENT_COOKIE]: get_event()})
}

/**
 * function:    open_transfer
 * parameters:  none
 * returns:     none
 * description: Open the raw data transfer page.
 */
function open_transfer()
{
    return build_url('index', {'page': 'transfer-raw', [EVENT_COOKIE]: get_event(), [USER_COOKIE]: get_user()})
}

/**
 * function:    open_progress
 * parameters:  none
 * returns:     none
 * description: Open the scouting progress page.
 */
function open_progress()
{
    return build_url('index', {'page': 'progress', [EVENT_COOKIE]: get_event()})
}

/**
 * function:    open_events
 * parameters:  none
 * returns:     none
 * description: Open the events page.
 */
function open_events()
{
    return build_url('index', {'page': 'events', [EVENT_COOKIE]: get_event()})
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
 * function:    open_about
 * parameters:  none
 * returns:     none
 * description: Open the about page.
 */
function open_about()
{
    return build_url('index', {'page': 'about'})
}

/**
 * function:    open_result
 * parameters:  match key, team number
 * returns:     none
 * description: Loads the result page for a button when pressed.
 */
function open_result(match_key, team_num)
{
    return build_url('selection', {'page': 'results', [EVENT_COOKIE]: dal.event_id, 'file': `${match_key}-${team_num}`})
}

/**
 * function:    scout
 * parameters:  scouting mode, match key, team number, alliance color
 * returns:     none
 * description: Loads the scouting page for a button when pressed.
 */
function start_scout(scouting_mode, match_key, team_num, alliance, edit=false)
{
    return build_url('index', {'page': 'scout', [TYPE_COOKIE]: scouting_mode, [EVENT_COOKIE]: dal.event_id, [POSITION_COOKIE]: get_cookie(POSITION_COOKIE, POSITION_DEFAULT), [USER_COOKIE]: get_cookie(USER_COOKIE, USER_DEFAULT), 'match': match_key, 'team': team_num, 'alliance': alliance, 'edit': edit})
}