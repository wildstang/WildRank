/**
 * file:        setup.js
 * description: Guides the user through app setup.
 * author:      Liam Fruzyna
 * date:        2025-02-25
 */

include('transfer')

var event_id_el, user_id_el, position_el, theme_el, user_type_el, role_options

/**
 * Initializes necessary variables and calls the first page setup.
 */
function init_page()
{
    // if an app version becomes available add it to the header
    cfg.on_app_version = () => {
        let header = document.getElementById('header_info')
        header.innerText = cfg.app_version
        header.onclick = () => window_open('index.html?page=about', true)
    }

    step_setup()
}

/**
 * Builds the contents of the page. This is repeatedly called as progress is made.
 */
function step_setup()
{
    // the primary column for performing setup
    let setup_col = new WRColumn()
    let columns = [setup_col]

    // count the number of teams and matches for the event
    let team_count = Object.keys(dal.teams).length
    let match_count = Object.keys(dal.matches).length

    // build a second column for viewing status info on the event and pulling in new configs
    let status_col = new WRColumn('Status', [])
    let event_config = new WRStatusTile(dal.event_name)
    event_config.set_status((team_count > 0 ? 1 : 0) + (match_count > 0 ? 1 : 0) - 1)
    scout_config_valid = new WRStatusTile(cfg.scout.version)
    scout_config_valid.set_status(cfg.validate() ? 1 : -1)
    scout_config_valid.on_click = () => window_open(build_url('config-debug'))
    status_col.add_input(new WRStack([
        event_config,
        scout_config_valid,
        new WRButton('Import Config', () => ZipHandler.import_setup(step_setup))
    ]))
    theme_el = new WRSelect('', ['Light', 'Dark', 'Auto'])
    theme_el.on_change = switch_theme
    theme_el.value = cfg.user.state.theme
    status_col.add_input(theme_el)

    // button used to trigger a fresh start of the setup
    let reset = new WRButton('Restart Setup', restart_setup)
    reset.add_class('slim')

    let update_type = false
    // if an invalid event ID is provided prompt for it first
    if (cfg.user.state.event_id.length < 7)
    {
        event_id_el = new WREntry('Event ID')
        event_id_el.value = cfg.user.state.event_id
        setup_col.add_input(event_id_el)

        setup_col.add_input(new WRButton('Next', set_event_id))
    }
    // the final page continues to show event status and prompts for position and scouting type
    else
    {
        let default_type = cfg.is_admin() ? 'View' : 'Scout'
        user_type_el = new WRSelect('', ['Scout', 'View', 'Adv'], default_type)
        user_type_el.input_id = 'broad-role'
        user_type_el.add_class('slim')
        user_type_el.on_click = update_user_type
        setup_col.add_input(user_type_el)

        role_options = document.createElement('div')
        setup_col.add_input(role_options)
        setup_col.add_input(reset)
        columns.push(status_col)

        update_type = true
    }

    let page = new WRPage('')
    for (let col of columns)
    {
        page.add_column(col)
    }
    preview.replaceChildren(page)

    if (update_type)
    {
        update_user_type()
    }
}

/**
 * Populates the setup column based on which user type is selected.
 */
function update_user_type()
{
    if (user_type_el.selected_option === 'Scout')
    {
        // if an invalid user ID is provided prompt for it second, also add the event status column
        if (cfg.user.state.user_id.length !== 6)
        {
            user_id_el = new WREntry('School ID', 111112)
            user_id_el.type = 'number'
            user_id_el.bounds = [100000, 999999]
            user_id_el.value = cfg.user.state.user_id
            user_id_el.on_text_change = () => cfg.user.state.user_id = user_id_el.element.value
            role_options.replaceChildren(user_id_el, new WRButton('Next', set_user_id))
        }
        else
        {
            position_el = new WRDropdown(`${cfg.get_name()}'s Position`)
            let cfg_pos = cfg.get_position()
            if (cfg_pos >= 0 && cfg_pos < 6)
            {
                position_el.add_option(position_to_name(pos))
            }
            else
            {
                let positions = get_position_names()
                for (let pos of positions)
                {
                    position_el.add_option(pos)
                    if (positions[cfg.user.state.position] === pos)
                    {
                        position_el.value = position_el.options[cfg.user.state.position]
                    }
                }
            }

            // build stack of buttons to scout
            let modes = cfg.scouting_modes
            let primary_scout = new WRButton(`${cfg.get_scout_config(modes[0]).name} Scout`, () => scout(modes[0]))
            let other_scout = new WRMultiButton('')
            other_scout.add_class('slim')
            for (let mode of modes.splice(1))
            {
                let name = cfg.get_scout_config(mode).name
                other_scout.add_option(name, () => scout(mode), () => scout(mode, true))
            }

            role_options.replaceChildren(position_el, new WRStack([primary_scout, other_scout]))
        }
    }
    else if (user_type_el.selected_option === 'View')
    {
        let role_buttons = new WRMultiButton('')
        role_buttons.add_option('Analyst', () => open_role('analysis'))
        role_buttons.add_option('Coach', () => open_role('drive'))
        role_buttons.add_option('Technician', () => open_role('tech'))
        role_buttons.add_option('Dashboard', () => open_role('dash'))
        role_options.replaceChildren(role_buttons)
    }
    else
    {
        let role_buttons = new WRMultiButton('')
        role_buttons.add_option('Event Prep', () => open_role('prep'))
        role_buttons.add_option('Debug', () => open_role('debug'))
        role_buttons.add_option('Danger Zone', () => open_role('danger'))
        role_buttons.add_option('Extras', () => open_role('extras'))
        role_options.replaceChildren(role_buttons)
    }
}

/**
 * Callback for when the event ID is set. Stores it if valid and reloads the config.
 */
function set_event_id()
{
    let id = event_id_el.element.value
    if (id.length >= 7)
    {
        cfg.update_event_id(id, process_files)

    }
    else
    {
        alert('Invalid event ID')
    }
}

/**
 * Callback for when the restart button is clicked. Clears all inputs.
 */
function restart_setup()
{
    cfg.user.state.event_id = ''
    cfg.user.state.user_id = ''
    cfg.user.state.position = -1
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
        cfg.user.store_config()

        let name = cfg.get_name()
        if (cfg.is_admin())
        {
            name += ' (Admin)'
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
function scout(mode, right_click)
{
    let team_count = Object.keys(dal.teams).length
    let match_count = Object.keys(dal.matches).length

    let team_modes = cfg.team_scouting_modes
    let match_modes = cfg.match_scouting_modes

    let position = position_el.element.selectedIndex
    if (position >= 0 && match_modes.includes(mode))
    {
        cfg.user.state.position = position
        cfg.user.store_config()

        if (team_count && match_count)
        {
            cfg.set_role(mode)
            window_open(build_url('matches', {[MODE_QUERY]: mode}), right_click)
        }
        else
        {
            alert('No matches available!')
        }
    }
    else if (team_modes.includes(mode))
    {
        if (team_count)
        {
            cfg.set_role(mode)
            window_open(build_url('pits', {[MODE_QUERY]: mode}), right_click)
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
 * Opens the home page for the given role.
 * @param {String} role Role name to open.
 */
function open_role(role)
{
    cfg.set_role(role)
    window_open(build_url('home'))
}

/**
 * Used by externel functions when new data is acquired. Reloads the DAL.
 */
function process_files()
{
    dal = new Data(cfg.user.state.event_id)
    dal.load_data()
    step_setup()
}

/**
 * Override the WildRank link to handle moralysis and extras pages.
 * @param {Boolean} right 
 */
function home(right=false)
{
    step_setup()
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
        cfg.user.store_config()
        apply_theme()
    }
}