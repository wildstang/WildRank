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

var user_id_el, event_id_el, scout_config_valid_el, config_valid_el, event_counter_el, result_counter_el, theme_el, position_el

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    let user_page = new WRPage('Scouter')
    let data_page = new WRPage('Status')

    let options = new WRColumn()
    user_page.add_column(options)

    user_id_el = new WREntry('School ID', 111112)
    user_id_el.on_text_change = check_id
    user_id_el.type = 'number'
    user_id_el.bounds = [100000, 999999]
    user_id_el.value = get_cookie(USER_COOKIE, cfg.defaults.user_id)
    user_id_el.description = ' '
    options.add_input(user_id_el)

    event_id_el = new WREntry('Event ID')
    event_id_el.show_status = true
    event_id_el.on_text_change = process_files
    event_id_el.value = get_cookie(EVENT_COOKIE, cfg.defaults.event_id)
    options.add_input(event_id_el)

    position_el = new WRDropdown('Position')
    for (let i = 1; i <= dal.alliance_size * 2; i++)
    {
        let color = 'Red'
        let pos = i
        if (i > dal.alliance_size)
        {
            color = 'Blue'
            pos = i - dal.alliance_size
        }
        position_el.add_option(`${color} ${pos}`)
    }
    position_el.value = position_el.options[get_cookie(POSITION_COOKIE, 0)]
    options.add_input(position_el)

    theme_el = new WRSelect('Theme', ['Light', 'Dark', 'Auto'])
    theme_el.on_change = switch_theme
    theme_el.columns = 3
    theme_el.value = get_cookie(THEME_COOKIE, THEME_DEFAULT)
    options.add_input(theme_el)

    let install_container = create_element('div', 'install-container')
    options.add_input(install_container)

    let roles = new WRColumn('Role')
    user_page.add_column(roles)

    let scout = new WRButton('Match Scout', () => check_press('scout'))
    roles.add_input(scout)

    let note = new WRButton('Pit / Note Scouter', () => check_press('note'))
    note.add_class('slim')
    roles.add_input(note)

    let drive = new WRButton('Drive Team', () => check_press('drive'))
    drive.add_class('slim')
    roles.add_input(drive)

    let analyst = new WRButton('Analyst', () => check_press('analysis'))
    analyst.add_class('slim')
    roles.add_input(analyst)

    let advanced = new WRButton('Advanced', () => check_press('advanced'))
    advanced.add_class('slim')
    roles.add_input(advanced)

    let admin = new WRButton('Administrator', () => check_press('admin'))
    admin.add_class('slim')
    roles.add_input(admin)

    let status = new WRColumn()
    data_page.add_column(status)

    let on_preload = () => {
        save_options()
        preload_event()
    }
    let on_import = () => {
        save_options()
        import_config()
    }
    let config_buttons = new WRMultiButton('Event Config', ['Preload', 'Import'], [on_preload, on_import])
    status.add_input(config_buttons)

    event_counter_el = new WRMultiNumber('', ['Teams', 'Matches'])
    status.add_input(event_counter_el)

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
                header.onclick = () => window_open(open_link('about'), '_blank')
                set_cookie(VERSION_COOKIE, version)
            }
        })
    }

    scout_config_valid_el = new WRStatusTile('Game Config')
    scout_config_valid_el.on_click = () => window_open(open_link('config-debug'), '_self')
    status.add_input(scout_config_valid_el)

    config_valid_el = new WRStatusTile('Settings')
    config_valid_el.on_click = () => window_open(open_link('config-debug'), '_self')
    status.add_input(config_valid_el)

    result_counter_el = new WRMultiNumber('Results', ['Pit', 'Match'])
    result_counter_el.on_click = () => window_open(open_link('progress'), '_self')
    status.add_input(result_counter_el)

    body.replaceChildren(user_page, data_page)

    // reset role when returning to homepage
    set_cookie(ROLE_COOKIE, ROLE_DEFAULT)

    check_id()
    apply_theme()
    process_files()

    // add install button if PWA is not installed
    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault()
        install = e
        let button = new WRButton(`Install ${cfg.settings.title}`, install_app)
        document.getElementById('install-container').replaceChildren(button)
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
    scout_config_valid_el.label_el.innerHTML = cfg.version
    event_counter_el.numbers[0].set_value(Object.keys(dal.teams).length)
    event_counter_el.numbers[1].set_value(Object.keys(dal.matches).length)
    result_counter_el.numbers[0].set_value(pits)
    result_counter_el.numbers[1].set_value(matches)

    // update statuses
    event_id_el.set_status(check_event())
    scout_config_valid_el.set_status(cfg.validate_game_configs())
    config_valid_el.set_status(cfg.validate_settings_configs())

    // rebuild position options
    position_el.options = []
    for (let i = 1; i <= dal.alliance_size * 2; i++)
    {
        let color = 'Red'
        let pos = i
        if (i > dal.alliance_size)
        {
            color = 'Blue'
            pos = i - dal.alliance_size
        }
        position_el.add_option(`${color} ${pos}`)
    }
    position_el.value = position_el.options[get_cookie(POSITION_COOKIE, 0)]
    position_el.element.replaceChildren(...position_el.option_elements)
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
        position_el.element.selectedIndex = pos
    }

    user_id_el.description_el.innerHTML = ''
    if (name !== id)
    {
        user_id_el.description_el.innerHTML += name + ' '
    }
    if (admin)
    {
        user_id_el.description_el.innerHTML += '(Admin)'
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
    let theme = theme_el.selected_option.toLowerCase()
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
    if (id === 'admin' && !cfg.is_admin(user))
    {
        return 'Missing admin privileges'
    }
    if ((id === 'drive' || id === 'scout') && !has_matches())
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
    }
    else
    {
        set_cookie(ROLE_COOKIE, id)
        let link = build_url('index', {'page': 'home', [ROLE_COOKIE]: id, [EVENT_COOKIE]: get_event(),
            [POSITION_COOKIE]: get_position(), [USER_COOKIE]: get_user()})
        window_open(link, '_self')
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
    return event_id_el.element.value.toLowerCase()
}

/**
 * function:    get_user
 * parameters:  none
 * returns:     Currently entered user ID.
 * description: Returns text in user id box.
 */
function get_user()
{
    return user_id_el.element.value
}

/**
 * function:    get_position
 * parameters:  none
 * returns:     Currently selected scouting position index.
 * description: Returns currently selected scouting position index.
 */
function get_position()
{
    return position_el.element.selectedIndex
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