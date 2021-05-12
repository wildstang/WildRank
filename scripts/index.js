/**
 * file:        index.js
 * description: Contains functions for the index of the web app.
 *              Primarily for loading event data and transfering results.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

/**
 * PAGE INIT
 */

// generate page
const PAGE_FRAME = build_page_frame('', [
    build_column_frame('Options', [
        build_str_entry('event_id', 'Event ID:', '', 'text', 'hide_buttons()'),
        build_dropdown('position', 'Position:', ['Red 1', 'Red 2', 'Red 3', 'Blue 1', 'Blue 2', 'Blue 3']),
        build_select('type_form', 'Mode:', ['Pit', 'Match', 'Note'], 'Match', 'hide_buttons()'),
        build_str_entry('upload_addr', 'Upload URL:', parse_server_addr(document.location.href), 'url'),
        build_num_entry('user_id', 'School ID:', '', [100000, 999999], 'hide_buttons()'),
        build_select('theme_switch', 'Theme:', ['Light', 'Dark'], 'Light', 'switch_theme()')
    ]),
    build_column_frame('Interactive', [
        build_link_button('scout', 'Scout', `check_press('scout', scout)`),
        build_link_button('open_ranker', 'Team Rankings', `check_press('open_ranker', open_ranker)`),
        build_link_button('open_sides', 'Side-by-Side', `check_press('open_sides', open_sides)`),
        build_link_button('open_picks', 'Pick Lists', `check_press('open_picks', open_picks)`),
        build_link_button('open_whiteboard', 'Whiteboard', `check_press('open_whiteboard', open_whiteboard)`),
    ]),
    build_column_frame('Data', [
        build_link_button('open_results', 'Results', `check_press('open_results', open_results)`),
        build_link_button('open_teams', 'Team Overview', `check_press('open_teams', open_teams)`),
        build_link_button('open_matches', 'Match Overview', `check_press('open_matches', open_matches)`),
        build_link_button('open_users', 'User Overview', `check_press('open_users', open_users)`),
        build_link_button('open_pivot', 'Pivot Table', `check_press('open_pivot', open_pivot)`),
    ]),
    build_column_frame('Transfer', [
        build_button('preload_event', 'Preload Event', `check_press('preload_event', preload_event)`),
        build_button('upload_all', 'Upload Results to Server', `check_press('upload_all', upload_all)`),
        build_button('import_all', 'Import Server Results', `check_press('import_all', import_all)`),
        build_button('export_zip', 'Export Raw Data', `check_press('export_zip', export_zip)`),
        build_button('import_zip', 'Import Raw Data', `check_press('import_zip', prompt_zip)`),
        build_button('download_csv', 'Export CSV Data', `check_press('download_csv', download_csv)`),
    ]),
    build_column_frame('Configuration', [
        build_link_button('open_config', 'Config Generator', `check_press('open_config', open_config)`),
        build_link_button('open_settings', 'Settings Editor', `check_press('open_settings', open_settings)`),
        build_link_button('about', 'About', `'/index.html?page=about'`),
        build_button('reset', 'Reset', `check_press('reset', reset)`),
    ]),
    build_column_frame('Status', [build_card('status')])
])

// requirements for each button
const BUTTONS = {
    'scout': { limits: ['event'], configs: ['type', 'settings'] },
    'open_ranker': { limits: ['event', 'admin', 'results', 'no-notes'], configs: ['type', 'settings'] },
    'open_sides': { limits: ['event', 'admin', 'results', 'no-notes'], configs: ['type', 'settings'] },
    'open_picks': { limits: ['event', 'admin'], configs: ['settings'] },
    'open_whiteboard': { limits: ['event', 'admin'], configs: ['whiteboard', 'settings'] },
    'open_results': { limits: ['event', 'admin', 'results'], configs: ['type', 'settings'] },
    'open_teams': { limits: ['event', 'admin'], configs: ['settings'] },
    'open_matches': { limits: ['event', 'admin'], configs: ['settings'] },
    'open_users': { limits: ['event', 'admin', 'any'], configs: [] },
    'open_pivot': { limits: ['event', 'admin', 'results'], configs: ['type', 'settings'] },
    'open_config': { limits: ['admin'], configs: [] },
    'open_settings': { limits: ['admin'], configs: ['settings'] },
    'preload_event': { limits: [], configs: [] },
    'upload_all': { limits: ['results'], configs: [] },
    'import_all': { limits: ['admin'], configs: [] },
    'download_csv': { limits: ['event', 'admin', 'any'], configs: [] },
    'export_zip': { limits: ['event', 'admin', 'any'], configs: [] },
    'import_zip': { limits: ['admin'], configs: [] },
    'reset': { limits: ['admin'], configs: [] }
}

// when the page is finished loading
window.addEventListener('load', function()
{
    document.body.innerHTML += PAGE_FRAME
    let configs = Object.keys(localStorage).filter(file => file.startsWith('config-')).length
    if (configs >= 8)
    {
        on_config()
    }
    else
    {
        fetch_config(on_config)
    }
    process_files()
})

/**
 * function:    on_config
 * parameters:  none
 * returns:     none
 * description: Fetch defaults, populate inputs with defaults, and apply theme.
 */
function on_config()
{
    let defaults = get_config('defaults')
    document.getElementById('event_id').value = get_cookie(EVENT_COOKIE, defaults.event_id)
    document.getElementById('user_id').value = get_cookie(USER_COOKIE, defaults.user_id)
    document.getElementById('position').selectedIndex = get_cookie(POSITION_COOKIE, POSITION_DEFAULT)
    document.getElementById('upload_addr').selectedIndex = get_cookie(UPLOAD_COOKIE, defaults.upload_url)
    let type_cookie = get_cookie(TYPE_COOKIE, TYPE_DEFAULT)
    select_option('type_form', type_cookie == MATCH_MODE ? 1 : type_cookie == PIT_MODE ? 0 : 2)

    let theme = get_cookie(THEME_COOKIE, THEME_DEFAULT)
    select_option('theme_switch', theme == 'light' ? 0 : 1)
    apply_theme()
    hide_buttons()
}

/**
 * function:    hide_buttons
 * parameters:  none
 * returns:     none
 * description: Dims buttons if their functionality is not currently available to the user.
 */
function hide_buttons()
{
    Object.keys(BUTTONS).forEach(function (id, index)
    {
        let button = document.getElementById(`${id}-container`)
        if (is_blocked(id))
        {
            // dim the button if blocked
            button.classList.add('disabled')
        }
        else
        {
            // umdim otherwise
            button.classList.remove('disabled')
        }
    })
}

/**
 * INTERACTIVE BUTTON RESPONSES
 */

/**
 * function:    scout
 * parameters:  none
 * returns:     none
 * description: Start the selected scouting mode.
 */
function scout()
{
    let type     = get_selected_type()
    let event    = get_event()
    let position = get_position()
    let user     = get_user()
    let query    = ''
    if (type === PIT_MODE)
    {
        query = {'page': 'pits', [EVENT_COOKIE]: event, [USER_COOKIE]: user}
    }
    else
    {
        query = {'page': 'matches', [TYPE_COOKIE]: type, [EVENT_COOKIE]: event, [POSITION_COOKIE]: position, [USER_COOKIE]: user}
    }
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
    return build_url('selection', {'page': 'ranker', [TYPE_COOKIE]: get_selected_type(), [EVENT_COOKIE]: get_event()})
}

/**
 * function:    open_sides
 * parameters:  none
 * returns:     none
 * description: Open the side-by-side comparison interface.
 */
function open_sides()
{
    return build_url('selection', {'page': 'sides', [TYPE_COOKIE]: get_selected_type(), [EVENT_COOKIE]: get_event()})
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
 * DATA BUTTON RESPONSES
 */

/**
 * function:    open_results
 * parameters:  none
 * returns:     none
 * description: Open the results of the selected scouting mode.
 */
function open_results()
{
    return build_url('selection', {'page': 'results', 'type': get_selected_type(), [EVENT_COOKIE]: get_event()})
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
    return build_url('selection', {'page': 'pivot', 'type': get_selected_type(), [EVENT_COOKIE]: get_event(), [USER_COOKIE]: get_user()})
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
 * TRANSFER BUTTON RESPONSES
 */

/**
 * function:    preload_event
 * parameters:  none
 * returns:     none
 * description: Fetch simple event matches and team from TBA.
 *              Store results in localStorage.
 */
function preload_event()
{
    // get event id from the text box
    let event_id = get_event()
    status('Requesting event data...')

    if (!API_KEY)
    {
        alert('No API key found for TBA!')
        status('No API key found for TBA!')
    }
    else
    {
        // fetch simple event matches
        fetch(`https://www.thebluealliance.com/api/v3/event/${event_id}/matches/simple${build_query({[TBA_KEY]: API_KEY})}`)
            .then(response => {
                if (response.status == 401) {
                    alert('Invalid API Key Suspected')
                }
                return response.json()
            })
            .then(data => {
                if (data.length > 0)
                {
                    // sort match objs by match number
                    let matches = data.sort(function (a, b)
                    {
                        return b.match_number < a.match_number ?  1
                                : b.match_number > a.match_number ? -1
                                : 0
                    })

                    // store matches as JSON string in matches-[event-id]
                    localStorage.setItem(get_event_matches_name(event_id), JSON.stringify(matches))
                    status(`${data.length} matches received`)
                    hide_buttons()
                }
                else
                {
                    status('No matches received!')
                }
            })
            .catch(err => {
                status('Error loading matches!')
                console.log(err)
            })

        // fetch simple event teams
        fetch(`https://www.thebluealliance.com/api/v3/event/${event_id}/teams/simple${build_query({[TBA_KEY]: API_KEY})}`)
            .then(response => {
                return response.json()
            })
            .then(data => {
                if (data.length > 0)
                {
                    // sort team objs by team number
                    let teams = data.sort(function (a, b)
                    {
                        return b.team_number < a.team_number ?  1
                                : b.team_number > a.team_number ? -1
                                : 0;
                    })
                    // store teams as JSON string in teams-[event_id]
                    localStorage.setItem(get_event_teams_name(event_id), JSON.stringify(teams))
                    status(`${data.length} teams received`)
                    hide_buttons()

                    // fetch team's avatar for whiteboard
                    var avatars = 0
                    var success = 0
                    teams.forEach(function (team, index)
                    {
                        let year = get_event().substr(0,4)
                        fetch(`https://www.thebluealliance.com/api/v3/team/frc${team.team_number}/media/${year}${build_query({[TBA_KEY]: API_KEY})}`)
                            .then(response => {
                                return response.json()
                            })
                            .then(data => {
                                localStorage.setItem(get_team_avatar_name(team.team_number, year), data[0].details.base64Image)
                                ++avatars
                                ++success
                                if (avatars == teams.length)
                                {
                                    status(`${success} avatars received`)
                                }
                            })
                            .catch(err =>
                            {
                                console.log(`Error loading avatar: ${err}!`)
                                ++avatars
                                if (avatars == teams.length)
                                {
                                    status(`${success} avatars received`)
                                }
                            })
                    })
                }
                else
                {
                    status('No teams received!')
                }
            })
            .catch(err => {
                status('Error loading teams!')
                console.log(err)
            })

        // fetch simple event teams
        fetch(`https://www.thebluealliance.com/api/v3/event/${event_id}/rankings${build_query({[TBA_KEY]: API_KEY})}`)
            .then(response => {
                return response.json()
            })
            .then(data => {
                if (data.hasOwnProperty('rankings'))
                {
                    data = data.rankings

                    // sort rankings objs by team number
                    let rankings = data.sort(function (a, b)
                    {
                        return b.rank < a.rank ?  1
                                : b.rank > a.rank ? -1
                                : 0;
                    })
                    // store rankings as JSON string in rankings-[event_id]
                    localStorage.setItem(get_event_rankings_name(event_id), JSON.stringify(rankings))
                    status(`${data.length} rankings received`)
                    hide_buttons()
                }
                else
                {
                    status('No rankings received!')
                }
            })
            .catch(err => {
                status('Error loading rankings!')
                console.log(err)
            })
    }
}

/**
 * function:    upload_all
 * parameters:  none
 * returns:     none
 * description: Uploads all files of the currently selected type via POST to the listed server.
 */
function upload_all()
{
    if (check_server(get_upload_addr()))
    {
        let type = get_selected_type()
        status(`Uploading ${type} results...`)
        // get all files in localStorage
        Object.keys(localStorage).forEach(function (file, index)
        {
            // determine files which start with the desired type
            if (file.startsWith(`${type}-`) || (type == 'pit' && file.startsWith(`image-${get_event()}-`)))
            {
                // TODO don't overwrite higher resolution images
                let content = localStorage.getItem(file)
                // append file name to data, separated by '|||'
                upload = `${file}|||${content}`
                status(`Posting ${file}`)
                // post string to server
                fetch(get_upload_addr(), {method: 'POST', body: upload})
            }
        })
    }
}

/**
 * function:    import_all
 * parameters:  none
 * returns:     none
 * description: Import results from the local /uploads file to localStorage.
 */
function import_all()
{
    if (check_server(document.location.href))
    {
        // determine appropriate request for selected mode
        let request = ''
        switch (get_selected_type())
        {
            case MATCH_MODE:
                request = 'getMatchResultNames'
                break
            case PIT_MODE:
                request = 'getPitResultNames'
                break
            case NOTE_MODE:
                request = 'getNoteNames'
                break
        }
    
        // request list of available results
        status('Requesting local result data...')
        fetch(request)
            .then(response => {
                return response.text()
            })
            .then(data => {
                // get requested results for current event
                console.log(data)
                let results = data.split(',').filter(function (r) {
                    return r.includes(get_event()) && localStorage.getItem(r.replace('.json', '')) === null
                })
                console.log(results)
                status(`${results.length} ${get_selected_type()} results found`)
                
                // request each desired result
                results.forEach(function (file, index)
                {
                    fetch(`${get_upload_addr()}/uploads/${file}`)
                        .then(response => {
                            return response.json()
                        })
                        .then(data => {
                            // save file
                            localStorage.setItem(file.replace('.json', ''), JSON.stringify(data))
                            status(`Got ${file}`)
                            hide_buttons()
                        })
                        .catch(err => {
                            status('Error requesting result')
                            console.log(err)
                        })
                })
            })
            .catch(err => {
                status('Error requesting results')
                console.log(err)
            })
    }
}

/**
 * function:    download_csv
 * parameters:  none
 * returns:     none
 * description: Export results to a CSV file and download.
 */
function download_csv()
{
    let event = get_event()
    let element = document.createElement('a')
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(export_spreadsheet(event)))
    element.setAttribute('download', `${get_user()}-${event}-export.csv`)

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    document.body.removeChild(element)
}

/**
 * function:    export_zip
 * paramters:   none
 * returns:     none
 * description: Creates and downloads a zip archive containing all localStorage files.
 */
function export_zip()
{
    let zip = JSZip()

    // determine which files to use
    let files = Object.keys(localStorage).filter(function(file)
    {
        if (!file.startsWith('avatar-') && file.includes(get_event()))
        {
            return true
        }
        return false
    })

    // add each file to the zip
    files.forEach(function(file) 
    {
        let name = file
        let base64 = false
        let data = localStorage.getItem(file)
        if (data.startsWith('data:image/png;base64,'))
        {
            name += '.png'
            base64 = true
            data = data.substr(data.indexOf(',') + 1)
        }
        else if (name.startsWith('avatar-'))
        {
            // JSZip doesn't seem to like avatars' base64
            name += '.b64'
            base64 = false
        }
        else
        {
            name += '.json'
        }
        zip.file(name, data, { base64: base64 })
    })

    // download zip
    zip.generateAsync({ type: 'base64' })
        .then(function(base64)
        {
            let event = get_event()
            let element = document.createElement('a')
            element.setAttribute('href', `data:application/zip;base64,${base64}`)
            element.setAttribute('download', `${get_user()}-${event}-export.zip`)
        
            element.style.display = 'none'
            document.body.appendChild(element)
        
            element.click()
        
            document.body.removeChild(element)
        })
}

/**
 * function:    import_zip
 * paramters:   none
 * returns:     none
 * description: Creates a file prompt to upload a zip of JSON results.
 */
function prompt_zip()
{
    var input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/zip'
    input.onchange = import_zip
    input.click()
}

/**
 * function:    import_zip
 * paramters:   none
 * returns:     none
 * description: Extracts a zip archive containing all JSON results.
 */
function import_zip(event)
{
    let file = event.target.files[0]
    
    // process each files details
    JSZip.loadAsync(file).then(function (zip) {
        Object.keys(zip.files).forEach(function (name) {
            let parts = name.split('.')
            let n = parts[0]
            let type = n.split('-')[0]

            // only import JSON files for the current event
            if (parts[1] == 'json' && n.includes(get_event()))
            {
                // get blob of files text
                zip.file(name).async('blob').then(function (content) {
                    content.text().then(function (text) {
                        // save to localStorage if result or event data is missing
                        if ((type == MATCH_MODE || type == PIT_MODE || type == NOTE_MODE || type == 'picklists') ||
                            (!has_event() && (type == 'rankings' || type == 'matches' || type == 'teams')))
                        {
                            localStorage.setItem(n, text)
                        }
                        hide_buttons()
                    })
                })
            }
        })
    })
}

/**
 * function:    reset
 * parameters:  none
 * returns:     none
 * description: Reset local storage.
 */
function reset()
{
    if (confirm('Delete all configuration, results, and other app data?'))
    {
        localStorage.clear()
        fetch_config(function() { location.reload() }, true)
    }
}

/**
 * HELPER FUNCTIONS
 */

/**
 * function:    process_files
 * parameters:  none
 * returns:     none
 * description: Counts files and displays numbers on screen
 */
function process_files()
{
    // get all files in localStorage
    let files = Object.keys(localStorage)
    let matches = 0
    let pits = 0
    let notes = 0
    let avatars = 0
    let images = 0
    let events = []
    let teams = []
    let rankings = []
    files.forEach(function (file, index)
    {
        let parts = file.split('-')
        // determine files which start with the desired type
        if (parts[0] == 'matches')
        {
            events.push(parts[1])
        }
        else if (parts[0] == 'teams')
        {
            teams.push(parts[1])
        }
        else if (parts[0] == 'rankings')
        {
            rankings.push(parts[1])
        }
        else if (parts[0] == MATCH_MODE)
        {
            ++matches
        }
        else if (parts[0] == PIT_MODE)
        {
            ++pits
        }
        else if (parts[0] == NOTE_MODE)
        {
            ++notes
        }
        else if (parts[0] == 'image')
        {
            ++images
        }
        else if (parts[0] == 'avatar')
        {
            ++avatars
        }
    })
    status(`<table><tr><th>Results...</th></tr>
            <tr><td>Match<td></td><td>${matches}</td></tr>
            <tr><td>Pit<td></td><td>${pits}</td></tr>
            <tr><td>Image<td></td><td>${images}</td></tr>
            <tr><td>Note<td></td><td>${notes}</td></tr>
            <tr><th>Events...</th></tr>
            <tr><td>Match<td></td><td>${events.join(', ')}</td></tr>
            <tr><td>Team<td></td><td>${teams.join(', ')}</td></tr>
            <tr><td>Ranking<td></td><td>${rankings.join(', ')}</td></tr>
            <tr><td>Avatar<td></td><td>${avatars}</td></tr></table>`)
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
    set_cookie(UPLOAD_COOKIE, get_upload_addr())
    set_cookie(TYPE_COOKIE, get_selected_type())
}

/**
 * function:    status
 * parameters:  string status
 * returns:     none
 * description: Log a string to both the status window and console.
 */
function status(status)
{
    document.getElementById('status').innerHTML += `${status}<br>`
    console.log(status.replace(/<br>/g, '\n'))
}

/**
 * function:    count_results
 * parameters:  event id, scouting type
 * returns:     number of results
 * description: Determines how many results of a given type and event exist.
 */
function count_results(event_id, type)
{
    let count = 0
    Object.keys(localStorage).forEach(function (file, index)
    {
        if (file.startsWith(`${type}-${event_id}-`))
        {
            ++count
        }
    })
    return count
}

/**
 * function:    export_spreadsheet
 * parameters:  event id
 * returns:     CSV string
 * description: Exports all results to a CSV file, which can be turned into a complex spreadsheet with a corresponding Python script.
 */
function export_spreadsheet(event_id)
{
    let combined = {}
    let keys = ['name', 'event', 'kind', 'match', 'team']
    Object.keys(localStorage).forEach(function (name, index)
    {
        let parts = name.split('-')
        let kind = parts[0]
        let event = parts[1]
        if (event == event_id)
        {
            let cont = true
            let result = {'name': name, 'event': event, 'kind': kind}
            // confirm valid result type
            switch (kind)
            {
                case MATCH_MODE:
                case NOTE_MODE:
                    result['match'] = parts[2]
                    result['team'] = parts[3]
                    break
                case PIT_MODE:
                    result['team'] = parts[2]
                    break
                default:
                    cont = false
                    break
            }

            if (cont)
            {
                // add object to combined
                let resultJSON = JSON.parse(localStorage.getItem(name))
                Object.keys(resultJSON).forEach(function (key, index)
                {
                    if (!keys.includes(key))
                    {
                        keys.push(key)
                    }
                    result[key] = resultJSON[key]
                })

                combined[name] = result
            }
        }
    })

    // build csv
    var lines = [keys.join()]
    Object.keys(combined).forEach(function (name, index)
    {
        let obj_keys = Object.keys(combined[name])
        let values = []
        keys.forEach(function (key, index)
        {
            if (obj_keys.includes(key))
            {
                values.push(combined[name][key])
            }
            else
            {
                values.push(NaN)
            }
        })
        lines.push(values.join())
    })
    return lines.join('\n').replace(/,NaN/g, ',')
}

/**
 * function:    parse_server_addr
 * parameters:  URL
 * returns:     The web server's address
 * description: Removes the path from the end of a URL.
 */
function parse_server_addr(addr)
{
    if (addr.indexOf('/', 8) > -1)
    {
        return addr.substr(0, addr.lastIndexOf('/'))
    }
    return addr
}

/**
 * function:    check_server
 * parameters:  Server address
 * returns:     If the server is the custom Python web server.
 * description: Determines if the server is the custom Python web server, if it is not alerts the user.
 */
function check_server(server)
{
    try
    {
        // send request to /about
        let check_addr = `${parse_server_addr(server)}/about`
        var req = new XMLHttpRequest()
        req.open('GET', check_addr, false)
        req.send(null)

        // confirm Python server
        if (req.responseText.includes('POST server'))
        {
            return true
        }
        else
        {
            console.log('Feature is only supported on Python server.')
            alert('This server does not support this feature!')
            return false
        }
    }
    catch (e)
    {
        console.log('Unable to communicate with this server.')
        alert('Unable to find a compatible server!')
        return false
    }
}

/**
 * function:    switch_theme
 * parameters:  none
 * returns:     none
 * description: Checks for a theme switch and updates.
 */
function switch_theme()
{
    let theme = get_selected_option('theme_switch') == 0 ? 'light' : 'dark'
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
    let event = get_event()
    return file_exists(get_event_matches_name(event)) && file_exists(get_event_teams_name(event))// && file_exists(get_event_rankings_name(event))
}

/**
 * function:    is_blocked
 * parameters:  button container id
 * returns:     reason why button is blocked
 * description: Determines if a button should be blocked and explains why.
 */
function is_blocked(id)
{
    let type = get_selected_type()
    let event = get_event()
    let year = event.substr(0,4)
    let limits = BUTTONS[id].limits
    let configs = BUTTONS[id].configs

    // check each provided limiting parameter
    if (limits.includes('event') && !has_event())
    {
        return `Missing event data.`
    }
    else if (limits.includes('admin') && !is_admin(get_user()))
    {
        return `Admin access required.`
    }
    else if (limits.includes('no-notes') && type == NOTE_MODE)
    {
        return `Cannot rank notes.`
    }
    else if (limits.includes('results') && !count_results(event, type))
    {
        return `No ${type} results found.`
    }
    else if (limits.includes('any') && !count_results(event, PIT_MODE) && !count_results(event, MATCH_MODE) && !count_results(event, NOTE_MODE))
    {
        return `No results found.`
    }
    else
    {
        // check that all necessary configs are present
        for (let i = 0; i < configs.length; ++i)
        {
            let config = configs[i]
            if (config == 'type')
            {
                config = type
            }
            if (config != NOTE_MODE && !config_exists(config, year))
            {
                return `Missing ${config} configuration.`
            }
        }
    }
    return false
}

/**
 * function:    check_press
 * parameters:  button container id, button press function
 * returns:     none
 * description: Attempts to operate a button press otherwise explains why not.
 */
function check_press(id, on_press)
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
        return on_press()
    }
}

/**
 * INPUT VALUE FUNCTIONS
 */

/**
 * function:    get_selected_type
 * parameters:  none
 * returns:     Currently selected scouting type.
 * description: Determines whether to use 'match' or 'pit' scouting based on the 'match' radio button.
 */
function get_selected_type()
{
    return get_selected_option('type_form') == 1 ? MATCH_MODE : get_selected_option('type_form') == 0 ? PIT_MODE : NOTE_MODE
}

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
    return document.getElementById('upload_addr').value
}