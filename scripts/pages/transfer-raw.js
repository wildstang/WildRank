/**
 * file:        transfer-raw.js
 * description: Page for importing and exporting raw data using zip archives.
 * author:      Liam Fruzyna
 * date:        2022-01-19
 */

const start = Date.now()
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

var urlParams = new URLSearchParams(window.location.search)
const fromCache = urlParams.get('cache') === 'true'

var event_cb, config_cb, results_cb, smart_stats_cb, coach_cb, picklists_cb, pictures_cb, settings_cb, whiteboard_cb, avatars_cb
var server_entry, server_status, source_select, progress_el
var event_display, event_data_status, teams_display, matches_display, version_display, scout_config_status, settings_status, pit_res_display, match_res_display

include('transfer')

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
async function init_page()
{
    // set header
    header_info.innerText = 'Raw Data Zip Transfer'

    let page = new WRPage()
    let check_col = new WRColumn('Data to Transfer')
    page.add_column(check_col)

    event_cb = new WRCheckbox('Event Data')
    check_col.add_input(event_cb)
    config_cb = new WRCheckbox('Scouting Configs')
    check_col.add_input(config_cb)
    results_cb = new WRCheckbox('Results')
    check_col.add_input(results_cb)
    smart_stats_cb = new WRCheckbox('Smart Stats')
    check_col.add_input(smart_stats_cb)
    coach_cb = new WRCheckbox('Coach Config')
    check_col.add_input(coach_cb)
    picklists_cb = new WRCheckbox('Pick Lists')
    check_col.add_input(picklists_cb)
    pictures_cb = new WRCheckbox('Pictures')
    check_col.add_input(pictures_cb)
    settings_cb = new WRCheckbox('Settings')
    check_col.add_input(settings_cb)
    whiteboard_cb = new WRCheckbox('Whiteboard')
    check_col.add_input(whiteboard_cb)
    avatars_cb = new WRCheckbox('Avatars')
    check_col.add_input(avatars_cb)

    let option_col = new WRColumn('Transfer Options')
    page.add_column(option_col)

    server_entry = new WREntry('Server URL', parse_server_addr(document.location.href))
    option_col.add_input(server_entry)

    server_status = new WRStatusTile('Server')
    option_col.add_input(server_status)

    // get latest cache
    let r = false
    let current = 'default'
    if (typeof caches !== 'undefined')
    {
        let names = await caches.keys()
        if (names.length > 0)
        {
            current = names[0]
        }
        let cache = await caches.open(current)
        r = await cache.match('/import')
    }

    source_select = new WRSelect('Source', ['Local', 'Server'], 'Local')
    if (r)
    {
        source_select.columns = 3
        source_select.add_option('Cache')
        if (fromCache)
        {
            source_select.def = 'Cache'
        }
        source_select.description = '<div id="file_name">File shared with WildRank from OS. Use "Cache" to import from this archive.</div>'
    }
    option_col.add_input(source_select)

    let direction = new WRMultiButton('Direction')
    direction.add_option('Import', () => import_zip(current))
    direction.add_option('Export', export_zip)
    option_col.add_input(direction)

    progress_el = create_element('progress', 'progress', 'wr_progress')
    progress_el.value = 0
    progress_el.max = 100
    option_col.add_input(progress_el)

    let status_col = new WRColumn('Data Status')
    page.add_column(status_col)

    event_display = new WRNumber('Event', dal.event_id)
    status_col.add_input(event_display)

    event_data_status = new WRStatusTile('Event Data')
    status_col.add_input(event_data_status)

    teams_display = new WRNumber('Event Teams')
    status_col.add_input(teams_display)

    matches_display = new WRNumber('Event Matches')
    status_col.add_input(matches_display)

    version_display = new WRNumber('cfg')
    status_col.add_input(version_display)

    scout_config_status = new WRStatusTile('Game Config')
    status_col.add_input(scout_config_status)

    settings_status = new WRStatusTile('Settings')
    status_col.add_input(settings_status)

    pit_res_display = new WRNumber('Pit Results')
    status_col.add_input(pit_res_display)

    match_res_display = new WRNumber('Match Results')
    status_col.add_input(match_res_display)

    body.replaceChildren(page)
    process_files()
}


/**
 * function:    import_zip
 * parameters:  none
 * returns:     none
 * description: Starts the zip import process for selected types.
 */
async function import_zip(cache)
{
    let handler = new ZipHandler()
    handler.event       = event_cb.checked
    handler.match       = results_cb.checked
    handler.note        = results_cb.checked
    handler.pit         = results_cb.checked
    handler.config      = config_cb.checked
    handler.smart_stats = smart_stats_cb.checked
    handler.coach       = coach_cb.checked
    handler.settings    = settings_cb.checked
    handler.avatars     = avatars_cb.checked
    handler.picklists   = picklists_cb.checked
    handler.whiteboard  = whiteboard_cb.checked
    handler.pictures    = pictures_cb.checked
    handler.on_update   = update_progress
    handler.on_complete = process_files
    handler.server      = get_upload_addr()

    let op = source_select.selected_index
    if (op === 0)
    {
        handler.import_zip_from_file(true)
    }
    else if (op === 1)
    {
        handler.import_zip_from_server()
    }
    else if (op === 2)
    {
        handler.import_zip_from_cache(cache)
    }
}

/**
 * function:    export_zip
 * parameters:  none
 * returns:     none
 * description: Starts the zip export process for selected types.
 */
function export_zip()
{
    let handler = new ZipHandler()
    handler.event       = event_cb.checked
    handler.match       = results_cb.checked
    handler.note        = results_cb.checked
    handler.pit         = results_cb.checked
    handler.config      = config_cb.checked
    handler.smart_stats = smart_stats_cb.checked
    handler.coach       = coach_cb.checked
    handler.settings    = settings_cb.checked
    handler.avatars     = avatars_cb.checked
    handler.picklists   = picklists_cb.checked
    handler.whiteboard  = whiteboard_cb.checked
    handler.pictures    = pictures_cb.checked
    handler.on_update   = update_progress
    handler.on_complete = process_files
    handler.server      = get_upload_addr()
    handler.user        = user_id

    handler.export_zip(source_select.selected_index)
}

function update_progress(complete, total)
{
    if (progress_el !== null)
    {
        progress_el.innerHTML = `${complete}/${total}`
        progress_el.value = complete
        progress_el.max = total
    }
}

/**
 * function:    get_upload_addr
 * parameters:  none
 * returns:     Currently entered upload server url.
 * description: Returns text in upload addr textbox.
 */
function get_upload_addr()
{
    return parse_server_addr(server_entry.element.value)
}

/**
 * function:    process_files
 * parameters:  none
 * returns:     none
 * description: Counts files and displays numbers on screen
 */
function process_files()
{
    dal = new DAL(dal.event_id)
    dal.build_teams()

    // count results
    let matches = dal.get_results([], false).length
    let pits = dal.get_pits([], false).length

    // update counters
    version_display.set_value(cfg.version)
    teams_display.set_value(Object.keys(dal.teams).length)
    matches_display.set_value(Object.keys(dal.matches).length)
    pit_res_display.set_value(pits)
    match_res_display.set_value(matches)

    // update statuses
    event_data_status.set_status(check_event())
    server_status.set_status(check_server(get_upload_addr(), false))
    scout_config_status.set_status(cfg.validate_game_configs())
    settings_status.set_status(cfg.validate_settings_configs())
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