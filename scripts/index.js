/**
 * file:        index.js
 * description: The index of the app. Primarily for choosing the user's role then moving to home.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

/**
 * PAGE INIT
 */

include('transfer')

var install

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    let page = new PageFrame('index', '')

    let options = new ColumnFrame('options', 'Options')
    page.add_column(options)

    let event_id = new Entry('event_id', 'Event ID')
    event_id.on_text_change = 'process_files()'
    event_id.def = get_cookie(EVENT_COOKIE, cfg.defaults.event_id)
    options.add_input(event_id)

    let position = new Dropdown('position', 'Position')
    for (let i = 1; i <= dal.alliance_size * 2; i++)
    {
        let color = 'Red'
        let pos = i
        if (i > dal.alliance_size)
        {
            color = 'Blue'
            pos = i - dal.alliance_size
        }
        position.add_option(`${color} ${pos}`)
    }
    options.add_input(position)

    let user_id = new Entry('user_id', 'School ID', 111112)
    user_id.type = 'number'
    user_id.bounds = [100000, 999999]
    user_id.def = get_cookie(USER_COOKIE, cfg.defaults.user_id)
    options.add_input(user_id)

    let theme = new Select('theme_switch', 'Theme')
    theme.onclick = 'switch_theme()'
    theme.add_option('Light')
    theme.add_option('Dark')
    theme.def = get_cookie(THEME_COOKIE, THEME_DEFAULT)
    options.add_input(theme)

    let roles = new ColumnFrame('roles', 'Role')
    page.add_column(roles)

    let scout = new Button('scout', 'Scouter')
    scout.link = `check_press('scout')`
    roles.add_input(scout)

    let note = new Button('note', 'Note Taker')
    note.link = `check_press('note')`
    roles.add_input(note)

    let drive = new Button('drive', 'Drive Team')
    drive.link = `check_press('drive')`
    roles.add_input(drive)

    let analyst = new Button('analyst', 'Analyst')
    analyst.link = `check_press('analysis')`
    roles.add_input(analyst)

    let admin = new Button('admin', 'Administrator')
    admin.link = `check_press('admin')`
    roles.add_input(admin)

    let status = new ColumnFrame('status', 'Status')
    page.add_column(status)

    let preload = new Button('preload_event', 'Preload Event', `save_options(); preload_event()`)
    status.add_input(preload)

    let transfer = new Button('transfer', 'Transfer Raw Data')
    transfer.link = `open_transfer()`
    status.add_input(transfer)

    let server = new StatusTile('server_type', 'Server Available')
    status.add_input(server)

    let event_data = new StatusTile('event_data', 'Event Data')
    status.add_input(event_data)

    let scout_config_valid = new StatusTile('scout_config_valid', 'Game Config')
    status.add_input(scout_config_valid)

    let config_valid = new StatusTile('config_valid', 'Settings')
    status.add_input(config_valid)

    let data = new ColumnFrame('data', 'Data')
    page.add_column(data)

    let version = new Counter('config_version', 'cfg')
    version.onincrement = 'increment("", false)'
    version.ondecrement = 'increment("", true)'
    data.add_input(version)

    let teams = new Counter('teams', 'Event Teams')
    teams.onincrement = 'increment("", false)'
    teams.ondecrement = 'increment("", true)'
    data.add_input(teams)

    let matches = new Counter('matches', 'Event Matches')
    matches.onincrement = 'increment("", false)'
    matches.ondecrement = 'increment("", true)'
    data.add_input(matches)

    let pit_results = new Counter('pit_results', 'Pit Results')
    pit_results.onincrement = 'increment("", false)'
    pit_results.ondecrement = 'increment("", true)'
    data.add_input(pit_results)

    let match_results = new Counter('match_results', 'Match Results')
    match_results.onincrement = 'increment("", false)'
    match_results.ondecrement = 'increment("", true)'
    data.add_input(match_results)

    let about = new Button('about', 'About WildRank')
    about.link = `open_about()`
    data.add_input(about)
    
    data.add_input('<div id="install-container"></div>')

    document.body.innerHTML += page.toString

    apply_theme()
    process_files()

    // add install button if PWA is not installed
    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault()
        install = e
        let button = new Button('install', 'Install WildRank', 'install_app()')
        document.getElementById('install-container').innerHTML = button.toString
    })
}

/**
 * HELPER FUNCTIONS
 */

/**
 * function:    install_app
 * parameters:  none
 * returns:     none
 * description: Triggers the PWA install prompt.
 */
function install_app()
{
    if (typeof install !== 'undefined')
    {
        install.prompt()
    }
}

/**
 * function:    process_files
 * parameters:  none
 * returns:     none
 * description: Counts files and displays numbers on screen
 */
function process_files()
{
    let event = get_event()
    dal = new DAL(event)
    dal.build_teams()

    // count results
    let matches = dal.get_results([], false).length
    let pits = dal.get_pits([], false).length

    // update counters
    document.getElementById('config_version').innerHTML = cfg.version
    document.getElementById('teams').innerHTML = Object.keys(dal.teams).length
    document.getElementById('matches').innerHTML = Object.keys(dal.matches).length
    document.getElementById('pit_results').innerHTML = pits
    document.getElementById('match_results').innerHTML = matches

    // update statuses
    StatusTile.set_status('event_data', check_event())
    StatusTile.set_status('server_type', check_server(get_upload_addr(), false))
    StatusTile.set_status('scout_config_valid', cfg.validate_game_configs())
    StatusTile.set_status('config_valid', cfg.validate_settings_configs())

    // rebuild position options
    let position = new Dropdown('position', 'Position')
    for (let i = 1; i <= dal.alliance_size * 2; i++)
    {
        let color = 'Red'
        let pos = i
        if (i > dal.alliance_size)
        {
            color = 'Blue'
            pos = i - dal.alliance_size
        }
        position.add_option(`${color} ${pos}`)
    }
    document.getElementById('position').innerHTML = position.html_options
}

/**
 * function:    check_event
 * parameters:  none
 * returns:     none
 * description: Confirms event data exists for the current event.
 */
function check_event()
{
    let teams = Object.keys(dal.teams).length > 0
    let matches = Object.keys(dal.matches).length > 0
    if (teams && matches)
    {
        return 1
    }
    else if (teams || matches)
    {
        return 0
    }
    else
    {
        return -1
    }
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
    let theme = Select.get_selected_option('theme_switch') == 0 ? 'light' : 'dark'
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
    let user = get_user()
    if (user.length < 6 || user === '111112')
    {
        return 'Please set your school id'
    }
    if (id != 'scout' && !cfg.users.admins.includes(parseInt(user)))
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