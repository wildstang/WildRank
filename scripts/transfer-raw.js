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

var progress_el

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

    let page = new PageFrame()
    let check_col = new ColumnFrame('', 'Data to Transfer')
    page.add_column(check_col)

    check_col.add_input(new Checkbox('event', 'Event Data'))
    check_col.add_input(new Checkbox('config', 'Scouting Configs'))
    check_col.add_input(new Checkbox('results', 'Results'))
    check_col.add_input(new Checkbox('smart-stats', 'Smart Stats'))
    check_col.add_input(new Checkbox('coach', 'Coach Config'))
    check_col.add_input(new Checkbox('picklists', 'Pick Lists'))
    check_col.add_input(new Checkbox('pictures', 'Pictures'))
    check_col.add_input(new Checkbox('settings', 'Settings'))
    check_col.add_input(new Checkbox('whiteboard', 'Whiteboard'))
    check_col.add_input(new Checkbox('avatars', 'Avatars'))

    let option_col = new ColumnFrame('', 'Transfer Options')
    page.add_column(option_col)

    let server = new Entry('server', 'Server URL', parse_server_addr(document.location.href))
    option_col.add_input(server)

    let server_type = new StatusTile('server_type', 'Server')
    option_col.add_input(server_type)

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

    let method = new Select('method', 'Source', ['Local', 'Server'], 'Local')
    if (r)
    {
        method.columns = 3
        method.add_option('Cache')
        if (fromCache)
        {
            method.def = 'Cache'
        }
        method.description = '<div id="file_name">File shared with WildRank from OS. Use "Cache" to import from this archive.</div>'
    }
    option_col.add_input(method)

    let direction = new MultiButton('direction', 'Direction')
    direction.add_option('Import', `import_zip('${current}')`)
    direction.add_option('Export', 'export_zip()')
    option_col.add_input(direction)

    progress_el = create_element('progress', 'progress', 'wr_progress')
    progress_el.value = 0
    progress_el.max = 100
    option_col.add_input(progress_el)

    let status_col = new ColumnFrame('', 'Data Status')
    page.add_column(status_col)

    let event = new Number('event_id', 'Event', dal.event_id)
    status_col.add_input(event)

    let event_data = new StatusTile('event_data', 'Event Data')
    status_col.add_input(event_data)

    let teams = new Number('teams', 'Event Teams')
    status_col.add_input(teams)

    let matches = new Number('matches', 'Event Matches')
    status_col.add_input(matches)

    let version = new Number('config_version', 'cfg')
    status_col.add_input(version)

    let scout_config_valid = new StatusTile('scout_config_valid', 'Game Config')
    status_col.add_input(scout_config_valid)

    let config_valid = new StatusTile('config_valid', 'Settings')
    status_col.add_input(config_valid)

    let pit_results = new Number('pit_results', 'Pit Results')
    status_col.add_input(pit_results)

    let match_results = new Number('match_results', 'Match Results')
    status_col.add_input(match_results)

    body.replaceChildren(page.element)
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
    handler.event       = document.getElementById('event').checked
    handler.match       = document.getElementById('results').checked
    handler.note        = document.getElementById('results').checked
    handler.pit         = document.getElementById('results').checked
    handler.config      = document.getElementById('config').checked
    handler.smart_stats = document.getElementById('smart-stats').checked
    handler.coach       = document.getElementById('coach').checked
    handler.settings    = document.getElementById('settings').checked
    handler.avatars     = document.getElementById('avatars').checked
    handler.picklists   = document.getElementById('picklists').checked
    handler.whiteboard  = document.getElementById('whiteboard').checked
    handler.pictures    = document.getElementById('pictures').checked
    handler.on_update   = update_progress
    handler.on_complete = process_files
    handler.server      = get_upload_addr()

    let op = Select.get_selected_option('method')
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
    handler.event       = document.getElementById('event').checked
    handler.match       = document.getElementById('results').checked
    handler.note        = document.getElementById('results').checked
    handler.pit         = document.getElementById('results').checked
    handler.config      = document.getElementById('config').checked
    handler.smart_stats = document.getElementById('smart-stats').checked
    handler.coach       = document.getElementById('coach').checked
    handler.settings    = document.getElementById('settings').checked
    handler.avatars     = document.getElementById('avatars').checked
    handler.picklists   = document.getElementById('picklists').checked
    handler.whiteboard  = document.getElementById('whiteboard').checked
    handler.pictures    = document.getElementById('pictures').checked
    handler.on_update   = update_progress
    handler.on_complete = process_files
    handler.server      = get_upload_addr()
    handler.user        = user_id

    handler.export_zip(Select.get_selected_option('method'))
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
    return parse_server_addr(document.getElementById('server').value)
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