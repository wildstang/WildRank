/**
 * file:        setup.js
 * description: Guides the user through app setup.
 * author:      Liam Fruzyna
 * date:        2025-02-25
 */

include('transfer')
include('validate')

var event_id_el, user_id_el, position_el, theme_el

var scouter = true

/**
 * Initializes necessary variables and calls the first page setup.
 */
function init_page()
{
    // if an app version becomes available add it to the header
    cfg.on_app_version = () => {
        let header = document.getElementById('header_info')
        header.innerText = cfg.app_version
        header.onclick = () => window_open('index.html?page=about', '_blank')
    }

    step_setup()
}

/**
 * Builds the contents of the page. This is repeatedly called as progress is made.
 */
function step_setup()
{
    // use the event short name, if not available use the ID
    let event = dal.event && dal.event.short_name !== undefined ? dal.event.short_name : cfg.user.state.event_id

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
        new WRButton('Load from TBA', preload_event)
    ]))
    scout_config_valid = new WRStatusTile(cfg.scout.version)
    scout_config_valid.set_status(validate_all().length === 0 ? 1 : -1)
    scout_config_valid.on_click = () => window_open(build_url('config-debug'), '_self')
    status_col.add_input(new WRStack([
        scout_config_valid,
        new WRButton('Import Config', import_config)
    ]))
    theme_el = new WRSelect('', ['Light', 'Dark', 'Auto'])
    theme_el.on_change = switch_theme
    theme_el.value = cfg.user.state.theme
    status_col.add_input(theme_el)

    // button used to trigger a fresh start of the setup
    let reset = new WRButton('Restart Setup', restart_setup)
    reset.add_class('slim')

    // if an invalid event ID is provided prompt for it first
    if (cfg.user.state.event_id.length < 7)
    {
        event_id_el = new WREntry('Event ID')
        event_id_el.value = cfg.user.state.event_id
        setup_col.add_input(event_id_el)

        setup_col.add_input(new WRButton('Next', set_event_id))
    }
    // if an invalid user ID is provided prompt for it second, also add the event status column
    else if (cfg.user.state.user_id.length !== 6)
    {
        user_id_el = new WREntry('School ID', 111112)
        user_id_el.type = 'number'
        user_id_el.bounds = [100000, 999999]
        user_id_el.value = cfg.user.state.user_id
        user_id_el.on_text_change = () => cfg.user.state.user_id = user_id_el.element.value
        setup_col.add_input(user_id_el)

        setup_col.add_input(new WRButton('Next', set_user_id))
        setup_col.add_input(reset)

        columns.push(status_col)
    }
    // the final page continues to show event status and prompts for position and scouting type
    else if (scouter)
    {
        position_el = new WRDropdown(`${cfg.get_name()}'s Position`)
        let cfg_pos = cfg.get_position()
        if (cfg_pos >= 0 && cfg_pos < dal.alliance_size * 2)
        {
            let color = 'Red'
            let pos = cfg_pos
            if (pos > dal.alliance_size)
            {
                color = 'Blue'
                pos = pos - dal.alliance_size
            }
            position_el.add_option(`${color} ${pos}`)
        }
        else
        {
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
                if (cfg.user.state.position === i - 1)
                {
                    position_el.value = position_el.options[cfg.user.state.position]
                }
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
    if (id.length >= 7)
    {
        cfg.update_event_id(id, () => {
            dal = new DAL(id)
            dal.build_teams()
    
            step_setup()
        })

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
    cfg.user.state.event_id = ''
    cfg.user.state.user_id = ''
    cfg.user.state.position = -1
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
        cfg.user.state.user_id = id
        cfg.store_user_config()

        let name = cfg.get_name()
        if (cfg.is_admin())
        {
            name += ' (Admin)'
        }
        alert(`Welcome ${name}!`)

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

    let position = position_el.element.selectedIndex
    if (position >= 0 && ['matches', 'notes'].includes(mode))
    {
        cfg.user.state.position = position
        cfg.store_user_config()

        if (team_count && match_count)
        {
            cfg.set_role(mode)

            let scout_type = mode === 'notes' ? 'note' : 'match'
            window_open(build_url('matches', {[MODE_QUERY]: scout_type}), '_self')
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
            cfg.set_role(mode)

            window_open(build_url('pits'), '_self')
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
    if (role === 'admin' && !cfg.is_admin(cfg.user.state.user_id))
    {
        alert('Admin access required!')
    }
    else
    {
        cfg.set_role(role)

        window_open(build_url('home'), '_self')
    }
}

/**
 * Used by externel functions when new data is acquired. Reloads the DAL.
 */
function process_files()
{
    dal = new DAL(cfg.user.state.event_id)
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

/**
 * Callback when a new theme is chosen.
 */
function switch_theme()
{
    let theme = theme_el.selected_option.toLowerCase()
    if (theme != cfg.user.state.theme)
    {
        cfg.user.state.theme = theme
        cfg.store_user_config()
        apply_theme()
    }
}