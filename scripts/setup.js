/**
 * file:        setup.js
 * description: Guides the user through app setup.
 * author:      Liam Fruzyna
 * date:        2025-02-25
 */

include('transfer')

var event_id_el, user_id_el, position_el

var user_id = ''
var position = -1
var scouter = true

/**
 * Initializes necessary variables and calls the first page setup.
 */
function init_page()
{
    user_id = get_cookie(USER_COOKIE, '')
    position = get_cookie(POSITION_COOKIE, -1)

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
                header.onclick = () => window_open('index.html?page=about', '_blank')
                set_cookie(VERSION_COOKIE, version)
            }
        })
    }

    step_setup()

    document.addEventListener("keyup", event => {
        if(event.key !== "Enter")
        {
            return
        }
        if (event_id_el !== null)
        {
            set_event_id()
            event.preventDefault()
        }
        else if (user_id_el !== null)
        {
            set_user_id()
            event.preventDefault()
        }
    })
}

/**
 * Builds the contents of the page. This is repeatedly called as progress is made.
 */
function step_setup()
{
    delete event_id_el
    delete user_id_el

    // use the event short name, if not available use the ID
    let event = dal.event && dal.event.short_name !== undefined ? dal.event.short_name : event_id

    // the primary column for performing setup
    let setup_col = new WRColumn('Setup')
    let columns = [setup_col]

    // count the number of teams and matches for the event
    let team_count = Object.keys(dal.teams).length
    let match_count = Object.keys(dal.matches).length

    // build a second column for viewing status info on the event and pulling in new configs
    let status_col = new WRColumn('Status', [])
    let event_config = new WRStatusTile(event)
    event_config.set_status((team_count > 0 ? 1 : 0) + (match_count > 0 ? 1 : 0) - 1)
    status_col.add_input(new WRStack([
        event_config,
        new WRMultiNumber('', ['Team', 'Match'], [team_count, match_count]),
        new WRButton('Load from TBA', preload_event)
    ]))
    scout_config_valid = new WRStatusTile(cfg.version)
    scout_config_valid.set_status(cfg.validate_game_configs())
    scout_config_valid.on_click = () => window_open(build_url('index', {'page': 'config-debug'}), '_self')
    status_col.add_input(new WRStack([
        scout_config_valid,
        new WRButton('Import Config', import_config)
    ]))

    // button used to trigger a fresh start of the setup
    let reset = new WRButton('Restart Setup', restart_setup)
    reset.add_class('slim')

    // if an invalid event ID is provided prompt for it first
    if (event_id.length < 7)
    {
        event_id_el = new WREntry('Event ID')
        event_id_el.value = event_id
        setup_col.add_input(event_id_el)

        setup_col.add_input(new WRButton('Next', set_event_id))
    }
    // if an invalid user ID is provided prompt for it second, also add the event status column
    else if (user_id.length !== 6)
    {
        user_id_el = new WREntry('School ID', 111112)
        user_id_el.type = 'number'
        user_id_el.bounds = [100000, 999999]
        user_id_el.value = user_id
        user_id_el.on_text_change = () => user_id = user_id_el.element.value
        setup_col.add_input(user_id_el)

        setup_col.add_input(new WRButton('Next', set_user_id))
        setup_col.add_input(reset)

        columns.push(status_col)
    }
    // the final page continues to show event status and prompts for position and scouting type
    else if (scouter)
    {
        position_el = new WRDropdown(`${cfg.get_name(user_id)}'s Position`)
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
            if (position == i - 1)
            {
                position_el.value = position_el.options[position]
            }
        }
        setup_col.add_input(position_el)

        let match_scout = new WRButton('Match Scout', () => scout('matches'))
        let other_scout = new WRMultiButton('', ['Pit', 'Alliance'], [() => scout('pits'), () => scout('notes')])
        other_scout.add_class('slim')
        setup_col.add_input(new WRStack([match_scout, other_scout]))

        let roles = new WRButton('Other Roles', other_roles)
        roles.add_class('slim')
        setup_col.add_input(roles)

        status_col.add_input(reset)

        columns.push(status_col)
    }
    else
    {
        setup_col.add_input(new WRButton('Drive Team', () => open_role('drive')))
        setup_col.add_input(new WRButton('Analyst', () => open_role('analysis')))
        setup_col.add_input(new WRButton('Advanced', () => open_role('advanced')))

        let admin = new WRButton('Administrator', () => open_role('admin'))
        admin.add_class('slim')
        setup_col.add_input(admin)

        setup_col.add_input(new WRSpacer())
        let back = new WRButton('Back', home)
        back.add_class('slim')
        setup_col.add_input(back)

        status_col.add_input(reset)

        columns.push(status_col)
    }

    let page = new WRPage('')
    for (let col of columns)
    {
        page.add_column(col)
    }
    body.replaceChildren(page)
}

/**
 * Callback for when the event ID is set. Stores it if valid and reloads the config.
 */
function set_event_id()
{
    let id = event_id_el.element.value
    if (id.length >= 8)
    {
        event_id = id
        set_cookie(EVENT_COOKIE, event_id)

        let year = event_id.substring(0, 4)
        cfg = new Config(year)
        cfg.load_configs()
        dal = new DAL(event_id)
        dal.build_teams()

        step_setup()
    }
    else
    {
        alert('Invalid event ID')
    }
}

/**
 * Callback for when the import button is clicked. Starts the ZipHandler.
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
    handler.on_complete = step_setup
    handler.server      = parse_server_addr(document.location.href)
    handler.import_zip_from_file(false, true)
}

/**
 * Callback for when the restart button is clicked. Clears all inputs.
 */
function restart_setup()
{
    event_id = ''
    user_id = ''
    position = -1
    scouter = true
    step_setup()
}

/**
 * Callback for when the user ID is set. Stores it if valid.
 */
function set_user_id()
{
    let id = user_id_el.element.value
    if (id.length === 6)
    {
        user_id = id
        set_cookie(USER_COOKIE, user_id)

        let name = cfg.get_name(id)
        if (cfg.is_admin(id))
        {
            name += ' (Admin)'
        }
        if (name !== cfg.get_name())
        {
            alert(`Welcome ${name}!`)
        }

        step_setup()
    }
    else
    {
        alert('Invalid user ID')
    }
}

/**
 * Callback for when the scout buttons are pressed. Reads in the position and goes to the appropriate selection page.
 */
function scout(mode)
{
    let team_count = Object.keys(dal.teams).length
    let match_count = Object.keys(dal.matches).length

    position = position_el.element.selectedIndex
    if (position >= 0 && ['matches', 'notes'].includes(mode))
    {
        set_cookie(POSITION_COOKIE, position)
        if (team_count && match_count)
        {
            let scout_type = mode === 'notes' ? 'note' : 'match'
            let params = {
                'page': 'matches', [ROLE_COOKIE]: mode, [EVENT_COOKIE]: event_id,
                [POSITION_COOKIE]: position, [USER_COOKIE]: user_id, [TYPE_COOKIE]: scout_type
            }

            set_cookie(ROLE_COOKIE, mode)
            window_open(build_url('selection', params), '_self')
        }
        else
        {
            alert('No matches available!')
        }
    }
    else if (mode === 'pits')
    {
        if (team_count)
        {
            let params = {
                'page': 'pits', [ROLE_COOKIE]: mode, [EVENT_COOKIE]: event_id,
                [POSITION_COOKIE]: position, [USER_COOKIE]: user_id, [TYPE_COOKIE]: 'pit'
            }

            set_cookie(ROLE_COOKIE, mode)
            window_open(build_url('selection', params), '_self')
        }
        else
        {
            alert('No teams available!')
        }
    }
    else if (!(team_count && match_count))
    {
        alert('No matches available!')
    }
    else
    {
        alert('Select a position!')
    }
}

/**
 * Callback when other roles button is selected.
 */
function other_roles()
{
    scouter = false
    step_setup()
}

/**
 * Opens the home page for the given role.
 * @param {String} role Role name to open.
 */
function open_role(role)
{
    if (role === 'admin' && !cfg.is_admin(user_id))
    {
        alert('Admin access required!')
    }
    else
    {
        set_cookie(ROLE_COOKIE, mode)
        window_open(build_url('index', {'page': 'home', [ROLE_COOKIE]: role}), '_self')
    }
}

/**
 * Used by external functions to get the current event ID.
 */
function get_event()
{
    return event_id
}

/**
 * Used by externel functions when new data is acquired. Reloads the DAL.
 */
function process_files()
{
    dal = new DAL(event_id)
    dal.build_teams()

    step_setup()
}

/**
 * Override the WildRank link to handle moralysis and extras pages.
 * @param {Boolean} right 
 */
function home(right=false)
{
    if (!scouter)
    {
        scouter = true
        step_setup()
    }
}