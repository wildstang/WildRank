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
    let user_page = new PageFrame('scouter', 'Scouter')
    let data_page = new PageFrame('data', 'Status')

    let options = new ColumnFrame('options', '')
    user_page.add_column(options)

    let user_id = new Entry('user_id', 'School ID', 111112)
    user_id.on_text_change = 'check_id()'
    user_id.type = 'number'
    user_id.bounds = [100000, 999999]
    user_id.value = get_cookie(USER_COOKIE, cfg.defaults.user_id)
    user_id.description = ' '
    options.add_input(user_id)

    let event_id = new Entry('event_id', 'Event ID')
    event_id.show_status = true
    event_id.on_text_change = 'process_files()'
    event_id.value = get_cookie(EVENT_COOKIE, cfg.defaults.event_id)
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
    position.value = position.options[get_cookie(POSITION_COOKIE, 0)]
    options.add_input(position)

    let theme = new Select('theme_switch', 'Theme', ['Light', 'Dark', 'Auto'])
    theme.on_change = 'switch_theme()'
    theme.columns = 3
    theme.value = get_cookie(THEME_COOKIE, THEME_DEFAULT)
    options.add_input(theme)

    let install_container = create_element('div', 'install-container')
    options.add_input(install_container)

    let roles = new ColumnFrame('roles', 'Role')
    user_page.add_column(roles)

    let scout = new Button('scout', 'Match Scout')
    scout.link = `check_press('scout')`
    roles.add_input(scout)

    let note = new Button('note', 'Pit / Note Scouter')
    note.link = `check_press('note')`
    note.add_class('slim')
    roles.add_input(note)

    let drive = new Button('drive', 'Drive Team')
    drive.link = `check_press('drive')`
    drive.add_class('slim')
    roles.add_input(drive)

    let analyst = new Button('analyst', 'Analyst')
    analyst.link = `check_press('analysis')`
    analyst.add_class('slim')
    roles.add_input(analyst)

    let advanced = new Button('advanced', 'Advanced')
    advanced.link = `check_press('advanced')`
    advanced.add_class('slim')
    roles.add_input(advanced)

    let admin = new Button('admin', 'Administrator')
    admin.link = `check_press('admin')`
    admin.add_class('slim')
    roles.add_input(admin)

    let status = new ColumnFrame('status', '')
    data_page.add_column(status)

    let config_buttons = new MultiButton('config_buttons', 'Event Config', ['Preload', 'Import'], ['save_options(); preload_event()', 'save_options(); import_config()'])
    status.add_input(config_buttons)

    let event_counter = new MultiNumber('event_counter', '', ['Teams', 'Matches'])
    status.add_input(event_counter)

    // display a version box only if caching is enabled
    if ('serviceWorker' in navigator && get_cookie(OFFLINE_COOKIE, OFFLINE_DEFAULT) === 'on' && navigator.serviceWorker.controller != null)
    {
        // request the current version from the serviceWorker
        navigator.serviceWorker.controller.postMessage({msg: 'get_version'})
        navigator.serviceWorker.addEventListener('message', e => {
            if (e.data.msg === 'version')
            {
                let version = e.data.version.replace('wildrank-', '')
                let header = document.getElementById('header_info')
                header.innerText = version
                header.onclick = event => window_open(open_link('about'), '_blank')
                set_cookie(VERSION_COOKIE, version)
            }
        })
    }

    let scout_config_valid = new StatusTile('scout_config_valid', 'Game Config')
    scout_config_valid.on_click = `window_open(open_link('config-debug'), '_self')`
    status.add_input(scout_config_valid)

    let config_valid = new StatusTile('config_valid', 'Settings')
    config_valid.on_click = `window_open(open_link('config-debug'), '_self')`
    status.add_input(config_valid)

    let result_counter = new MultiNumber('result_counter', 'Results', ['Pit', 'Match'])
    result_counter.on_click = `window_open(open_link('progress'), '_self')`
    status.add_input(result_counter)

    body.replaceChildren(user_page.element, data_page.element)

    // reset role when returning to homepage
    set_cookie(ROLE_COOKIE, ROLE_DEFAULT)

    check_id()
    apply_theme()
    process_files()

    // add install button if PWA is not installed
    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault()
        install = e
        let button = new Button('install', `Install ${cfg.settings.title}`, 'install_app()')
        document.getElementById('install-container').replaceChildren(button.element)
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
    document.getElementById('scout_config_valid-label').innerHTML = cfg.version
    document.getElementById('event_counter_teams-value').innerHTML = Object.keys(dal.teams).length
    document.getElementById('event_counter_matches-value').innerHTML = Object.keys(dal.matches).length
    document.getElementById('result_counter_pit-value').innerHTML = pits
    document.getElementById('result_counter_match-value').innerHTML = matches

    // update statuses
    Entry.set_status('event_id_color', check_event())
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
    position.value = position.options[get_cookie(POSITION_COOKIE, 0)]
    document.getElementById('position').replaceChildren(...position.option_elements)
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
 * function:    check_id
 * parameters:  none
 * returns:     none
 * description: Checks to see if the user has a preset scouting position.
 */
function check_id()
{
    let id = get_user()
    let pos = cfg.get_position(id)
    let name = cfg.get_name(id)
    let admin = cfg.is_admin(id)

    if (pos > -1)
    {
        document.getElementById('position').selectedIndex = pos
    }

    document.getElementById('user_id_desc').innerHTML = ''
    if (name !== id)
    {
        document.getElementById('user_id_desc').innerHTML += name + ' '
    }
    if (admin)
    {
        document.getElementById('user_id_desc').innerHTML += '(Admin)'
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
    let theme = 'auto'
    switch (Select.get_selected_option('theme_switch'))
    {
        case 0:
            theme = 'light'
            break
        case 1:
            theme = 'dark'
            break
        case 2:
        default:
            theme = 'auto'
    }
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
    if ((id === 'drive' || id === 'analysis' || id === 'admin') && !cfg.is_admin(user))
    {
        return 'Missing admin privileges'
    }
    if (id === 'scout' && !has_matches())
    {
        return 'Missing match data'
    }
    if (id !== 'admin' && id !== 'advanced' && !has_teams())
    {
        return 'Missing event data'
    }
    return false
}

/**
 * function:    open_link
 * parameters:  page
 * returns:     none
 * description: Saves options then creates link for page.
 */
function open_link(page)
{
    save_options()
    return open_page(page)
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
 * function:    import_config
 * parameters:  none
 * returns:     none
 * description: Starts the zip import process for configs and pictures.
 */
function import_config()
{
    let handler = new ZipHandler()
    handler.event       = true
    handler.config      = true
    handler.smart_stats = true
    handler.coach       = true
    handler.settings    = true
    handler.pictures    = true
    handler.always_overwrite = true
    handler.on_complete = process_files
    handler.server      = get_upload_addr()
    handler.import_zip_from_file(false, true)
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
    return document.getElementById('event_id').value.toLowerCase()
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