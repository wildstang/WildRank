/**
 * file:        transfer.js
 * description: Contains data management functions for the index of the web app.
 * author:      Liam Fruzyna
 * date:        2021-05-24
 */

include('external/jszip.min')

/**
 * BUTTON RESPONSES
 */

// global properties for handling preloaded data
var passes, fails, api_endpoint, key_query, on_preload

/**
 * Preloads data from TBA and images from the server.
 * @param {Function} on_complete Optional function to call when preloading is complete
 */
function preload_event(on_complete=null)
{
    // get event id from the text box
    let event_id = cfg.user.state.event_id

    // request the TBA key if it doesn't already exist
    let key = cfg.tba_key
    if (!key)
    {
        alert('TBA key required to preload')
        return
    }

    passes = []
    fails = []
    api_endpoint = `https://www.thebluealliance.com/api/v3`
    key_query = `?${TBA_AUTH_KEY}=${key}`
    on_preload = on_complete

    // fetch simple event matches
    fetch(`${api_endpoint}/event/${event_id}/matches${key_query}`)
        .then(response => response.json())
        .then(handle_matches)
        .then(count_data)
        .catch(err => {
            count_data('matches-false')
            console.error(err)
        })

    // fetch simple event teams
    fetch(`${api_endpoint}/event/${event_id}/teams/simple${key_query}`)
        .then(response => response.json())
        .then(handle_teams)
        .then(count_data)
        .catch(err => {
            count_data('teams-false')
            console.error(err)
        })

    // fetch event rankings
    fetch(`${api_endpoint}/event/${event_id}/rankings${key_query}`)
        .then(response => response.json())
        .then(handle_rankings)
        .then(count_data)
        .catch(err => {
            count_data('rankings-false')
            console.error(err)
        })

    // fetch event data
    fetch(`${api_endpoint}/event/${event_id}${key_query}`)
        .then(response => response.json())
        .then(handle_event)
        .then(count_data)
        .catch(err => {
            count_data('event-false')
            console.error(err)
        })

    // fetch list of server pictures
    let server = parse_server_addr(document.location.href)
    fetch(`${server}/listPics`)
        .then(response => response.json())
        .then(handle_photos)
        .catch(err => console.error(err))
}

/**
 * Counts a result and whether it passed or failed, calls on_preload if all are complete.
 * @param {String} result Result formatted type-pass
 */
function count_data(result)
{
    // parse result string
    let parts = result.split('-')
    let mode = parts[0]
    let pass = parts[1] === 'true'
    if (pass)
    {
        passes.push(mode)
    }
    else
    {
        fails.push(mode)
    }
    console.log(mode, pass)

    // alert when complete
    if (passes.length + fails.length === 4)
    {
        if (fails.length === 0)
        {
            alert('Event pulled!')
        }
        else
        {
            alert(`Failed to pull ${fails.join(', ')}`)
        }

        if (on_preload !== null)
        {
            on_preload()
        }
    }
}

/**
 * Handles matches after fetching from TBA.
 * @param {Array} matches Raw array of matches
 * @returns Description of completion
 */
function handle_matches(matches)
{
    if (matches.length > 0)
    {
        // sort match objs by match number
        matches = matches.sort(function (a, b)
        {
            return b.match_number < a.match_number ? 1
                    : b.match_number > a.match_number ? -1
                    : 0
        })

        // store matches as JSON string in matches-[event-id]
        localStorage.setItem(`matches-${cfg.user.state.event_id}`, JSON.stringify(matches))
        return 'matches-true'
    }
    return 'matches-false'
}

/**
 * Handles teams after fetching from TBA.
 * @param {Array} teams Raw array of teams
 * @returns Description of completion
 */
function handle_teams(teams)
{
    if (teams.length > 0)
    {
        // sort team objs by team number
        teams = teams.sort(function (a, b)
        {
            return b.team_number < a.team_number ? 1
                : b.team_number > a.team_number ? -1
                    : 0;
        })
        // store teams as JSON string in teams-[event_id]
        localStorage.setItem(`teams-${cfg.user.state.event_id}`, JSON.stringify(teams))

        // fetch team's avatar for whiteboard
        for (let team of teams)
        {
            let year = cfg.year
            fetch(`${api_endpoint}/team/frc${team.team_number}/media/${year}${key_query}`)
                .then(response => response.json())
                .then(handle_media)
                .catch(err => console.error(err))
        }
        return 'teams-true'
    }
    return 'teams-false'
}

/**
 * Handles media after fetching from TBA.
 * @param {Array} media Raw array of media
 * @param {Number} team_num Team number
 */
function handle_media(media, team_num)
{
    for (let m of media)
    {
        switch (m.type)
        {
            case 'avatar':
                localStorage.setItem(`avatar-${cfg.year}-${team_num}`, m.details.base64Image)
                break
            case 'cdphotothread':
            case 'imgur':
            // NOTE: instagram does things weird
            //case 'instagram-image':
            case 'onshape':
                // TODO: handle pictures
                //dal.add_photo(team.team_number, m.direct_url)
                break
        }
    }
}

/**
 * Handles rankings after fetching from TBA.
 * @param {Array} data Raw array of rankings
 * @returns Description of completion
 */
function handle_rankings(data)
{
    if (data && data.hasOwnProperty('rankings') && data.rankings.length > 0)
    {
        // sort rankings objs by team number
        let rankings = data.rankings.sort(function (a, b)
        {
            return b.rank < a.rank ? 1
                    : b.rank > a.rank ? -1
                    : 0;
        })

        // store rankings as JSON string in rankings-[event_id]
        localStorage.setItem(`rankings-${cfg.user.state.event_id}`, JSON.stringify(rankings))
        return 'rankings-true'
    }
    return 'rankings-false'
}

/**
 * Handles event data after fetching from TBA.
 * @param {Object} event Raw event data object
 * @returns Description of completion
 */
function handle_event(event)
{
    if (event)
    {
        // store event as JSON string
        localStorage.setItem(`event-${cfg.user.state.event_id}`, JSON.stringify(event))
        return 'event-true'
    }
    return 'event-false'
}

/**
 * Handles photos are fetching from TBA.
 * @param {Array} photos Raw array of photos
 */
function handle_photos(photos)
{
    // add each picture to config
    let teams = Object.keys(photos)
    for (let team of teams)
    {
        let team_pics = photos[team]
        for (let i in team_pics)
        {
            // TODO: handle pictures
            //dal.add_photo(team, `${server}/uploads/${team_pics[i]}`, i === 0)
        }
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
    let event = cfg.user.state.event_id
    let element = document.createElement('a')
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(export_spreadsheet(event)))
    element.setAttribute('download', `${get_user()}-${event}-export.csv`)

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    document.body.removeChild(element)
}


/**
 * Prompts the user to delete all data in localStorage and cache.
 */
async function reset()
{
    if (confirm('Delete all configuration, results, and other app data?'))
    {
        // clear storage
        localStorage.clear()

        // clear offline pages
        if (typeof caches !== 'undefined')
        {
            let keys = await caches.keys()
            for (let key of keys)
            {
                caches.delete(key)
            }
        }

        window_open('/')
    }
}

/**
 * Prompts the user to delete all data in cache.
 */
async function reset_cache()
{
    if (typeof caches !== 'undefined')
    {
        if (confirm('Delete all cache data?'))
        {
            let keys = await caches.keys()
            for (let key of keys)
            {
                caches.delete(key)
            }

            window_open('/')
        }
    }
    else
    {
        alert('Caches not available via this connection. (Must be encrypted or localhost)')
    }
}

/**
 * Prompts the user to delete all data in localStorage.
 */
function reset_storage()
{
    if (confirm('Delete all configuration and results?'))
    {
        // clear storage
        localStorage.clear()

        window_open('/')
    }
}

/**
 * Prompts the user to delete all results from localStorage.
 */
function reset_results()
{
    if (confirm('Delete all results?'))
    {
        // remove all match and pit results
        let files = Object.keys(localStorage).filter(f => f.startsWith(`result-`))
        for (let file of files)
        {
            localStorage.removeItem(file)
        }
    }
}

/**
 * Remove all WR config files from both localStorage and cache.
 */
async function reset_config()
{
    if (confirm('Reset all settings and configuration?'))
    {
        if (typeof caches !== 'undefined')
        {
            // search all caches for "-config.json" files and delete them
            let keys = await caches.keys()
            for (let key of keys)
            {
                let cache = await caches.open(key)
                let files = await cache.keys()
                for (let file of files)
                {
                    if (file.url.endsWith('-config.json') || file.url === `${USER_LIST}.csv`)
                    {
                        cache.delete(file)
                    }
                }
            }
        }

        // search localStorage for "config-20" files and delete them plus "config-users"
        let files = Object.keys(localStorage).filter(f => f.endsWith('-config') || f === USER_LIST)
        for (let file of files)
        {
            localStorage.removeItem(file)
        }

        window_open('/')
    }
}

/**
 * Reset all data from TBA for other events.
 */
function clear_events()
{
    if (confirm('Delete all configuration and results for other events?'))
    {
        // remove all files for other event ids
        let event_id = dal.event_id
        let files = Object.keys(localStorage).filter(f => !f.includes(event_id))
        for (let file of files)
        {
            if (file.startsWith('event-') || file.startsWith('matches-') || file.startsWith('picklists-') ||
                file.startsWith('rankings-') || file.startsWith('teams-') ||
                (file.startsWith('result-') && JSON.parse(localStorage.getItem(file)).meta.result.event_id !== event_id))
            {
                localStorage.removeItem(file)
            }
        }

        window_open('/')
    }
}

/**
 * Reset all data from TBA for the current event.
 */
function reset_event()
{
    let event_id = dal.event_id
    if (confirm(`Delete all configuration and results for ${event_id}?`))
    {
        // remove all files containing uother event ids
        let files = Object.keys(localStorage)
        for (let file of files)
        {
            if (file.includes(event_id) ||
                (file.startsWith('result-') && JSON.parse(localStorage.getItem(file)).meta.result.event_id === event_id))
            {
                localStorage.removeItem(file)
            }
        }

        window_open('/')
    }
}

/**
 * HELPER FUNCTIONS
 */

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
    let files = Object.keys(localStorage)
    for (let name of files)
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
                let results = Object.keys(resultJSON)
                for (let key of results)
                {
                    let val = resultJSON[key]
                    // look for cycles (arrays of objects)
                    if (typeof val === 'object' && Array.isArray(val))
                    {
                        for (let i in val)
                        {
                            let v = val[i]
                            if (typeof v === 'object')
                            {
                                for (let j in v)
                                {
                                    // add each cycle-value as its own column
                                    let k = `${key}-${j}-${i}`
                                    if (!keys.includes(k))
                                    {
                                        keys.push(k)
                                    }
                                    result[k] = v[j]
                                }
                            }
                        }
                    }
                    else
                    {
                        if (!keys.includes(key))
                        {
                            keys.push(key)
                        }
                        result[key] = val
                    }
                }
                combined[name] = result
            }
        }
    }

    // build csv
    let lines = [keys.join()]
    let results = Object.keys(combined)
    for (let name of results)
    {
        let obj_keys = Object.keys(combined[name])
        let values = []
        for (let key of keys)
        {
            if (obj_keys.includes(key))
            {
                let val = combined[name][key]
                if (typeof val === 'string')
                {
                    values.push(`"${val}"`)
                }
                else
                {
                    values.push(val)
                }
            }
            else
            {
                values.push(NaN)
            }
        }
        lines.push(values.join())
    }
    return lines.join('\n').replace(/,NaN/g, ',')
}

class ZipHandler
{
    constructor()
    {
        this.event = false
        this.match = false
        this.pit = false
        this.note = false
        this.config = false
        this.smart_stats = false
        this.coach = false
        this.settings = false
        this.avatars = false
        this.picklists = false
        this.whiteboard = false
        this.pictures = false
        this.always_overwrite = false
        this.on_update = this.do_nothing
        this.on_complete = this.do_nothing
        this.server = ''
        this.user = ''
    }

    do_nothing(a='', b='') {}

    /**
     * function:    get_zip_name
     * paramters:   none
     * returns:     zip file name
     * description: Generates a zip name.
     */
    get_zip_name()
    {
        // start name with user ID if available
        let name = ''
        if (cfg.user.state.user_id)
        {
            name = `${cfg.user.state.user_id}-`
        }

        // add event ID
        name += cfg.user.state.event_id

        // add a suffix based on what is exported
        let suffix = ''
        let results = this.match || this.pit || this.note
        let config = this.event || this.config || this.smart_stats || this.coach || this.settings || this.avatars || this.whiteboard
        if ((results || this.pictures) && !config)
        {
            if (this.match && !this.pit && !this.note && !this.pictures)
            {
                suffix = 'matches'
            }
            else if (this.note && !this.match && !this.pit && !this.pictures)
            {
                suffix = 'notes'
            }
            else if (this.pictures && !this.match && !this.pit && !this.note)
            {
                suffix = 'pictures'
            }
            else if ((this.pit || this.pictures) && !this.match && !this.note)
            {
                suffix = 'pits'
            }
            else
            {
                suffix = 'results'
            }
        }
        else if (config && !results)
        {
            suffix = 'config'
        }
        else if (!config && !results && this.picklists)
        {
            suffix = 'picklists'
        }
        else
        {
            suffix = 'export'
        }

        return `${name}-${suffix}.zip`
    }

    /**
     * function:    import_zip_from_file
     * paramters:   none
     * returns:     none
     * description: Creates a file prompt to upload a zip of JSON results.
     */
    import_zip_from_file(select_multiple=false, allow_csv=false)
    {
        let input = document.createElement('input')
        input.type = 'file'
        let mime_type = 'application/zip'
        if (allow_csv)
        {
            mime_type += ',application/json'
        }
        input.accept = mime_type
        input.multiple = select_multiple
        let handler = this
        input.addEventListener('change', async function (event)
        {
            for (let file of event.target.files)
            {
                if (file.name)
                {
                    if (file.name.endsWith('.zip'))
                    {
                        // import zips one at a time
                        // TODO: remove this when imports take into account multiple zips
                        await handler.import_zip(file)
                    }
                    else if (file.name.endsWith('.json'))
                    {
                        handler.import_settings(file)
                    }
                }
            }
        })
        input.click()
    }

    /**
     * function:    import_zip_from_server
     * paramters:   none
     * returns:     none
     * description: Request a zip of JSON results from the server.
     */
    import_zip_from_server()
    {
        if (check_server(this.server))
        {
            fetch(`${this.server}/getZip`)
                .then(transfer => {
                    return transfer.blob();
                })
                .then(bytes => {
                    this.import_zip(bytes)
                })
                .catch(err => {
                    alert('Error requesting results')
                    console.log(err)
                })
        }
    }

    /**
     * function:    import_zip_from_cache
     * paramters:   cache name
     * returns:     none
     * description: Import a zip stored in CacheStorage.
     */
    async import_zip_from_cache(cache_name)
    {
        let cache = await caches.open(cache_name)
        let r = await cache.match('/import')
        if (r)
        {
            this.import_zip(r.blob())
            cache.delete('/import')
        }
        else
        {
            alert('No cached file available!')
        }
    }

    /**
     * function:    import_zip
     * paramters:   response containing zip file
     * returns:     none
     * description: Extracts a zip archive containing all JSON results.
     */
    async import_zip(file)
    {
        if (file['name'] !== undefined && !file.name.includes(dal.event_id))
        {
            if (!confirm(`Warning, zip does not contain "${dal.event_id}" in the name! Continue?`))
            {
                return
            }
        }

        // process each files details
        let zip = await JSZip.loadAsync(file)
        let files = Object.keys(zip.files)
        let complete = 0
        let ignore_app = false
        let ignore_cfg = false

        if (files.length == 0)
        {
            alert('No files found!')
        }

        for (let name of files)
        {
            // get name used in localStorage
            let n = name.substring(0, name.indexOf('.'))
            if (n.includes('/'))
            {
                n = n.substring(n.lastIndexOf('/') + 1)
            }
            if (n.includes('\\'))
            {
                n = n.substring(n.lastIndexOf('\\') + 1)
            }

            // skip directories
            if (!name.endsWith('/'))
            {
                // get blob of file
                let content = await zip.file(name).async('blob')
                // import pictures to cache
                if (name.endsWith('.jpg') || name.endsWith('.png'))
                {
                    if (this.pictures)
                    {
                        // adjust url
                        let url = name.replace('https:/', 'https://').replace('http:/', 'http://')
                        if (!url.startsWith('http'))
                        {
                            let server = this.server
                            if (!server.endsWith('/'))
                            {
                                server += '/'
                            }
                            url = server + url
                            let team = url.substring(url.lastIndexOf('/')+1, url.lastIndexOf('-'))
                            dal.add_photo(team, url)

                            if (typeof caches !== 'undefined')
                            {
                                cache_file(url, content)
                            }
                        }
                    }
                }
                else if (name.endsWith('.json'))
                {
                    // import everything else as strings to localStorage
                    // determine which files to use
                    if ((n.includes(dal.event_id) &&
                        ((this.event && (n.startsWith('teams-') || n.startsWith('matches-') || n.startsWith('rankings-'))) ||
                        (this.match && n.startsWith(`${MATCH_MODE}-`) ||
                        (this.pit && n.startsWith(`${PIT_MODE}-`) ||
                        (this.note && n.startsWith(`${NOTE_MODE}-`)))))) ||
                        (this.config && (MODES.some(m => n === `config-${cfg.year}-${m}`) || n === `config-${cfg.year}-version`)) ||
                        (this.smart_stats && n === `config-${cfg.year}-smart_stats`) ||
                        (this.coach && n === `config-${cfg.year}-coach`) ||
                        (this.settings && n.startsWith('config-') && !n.startsWith(`config-${cfg.year}`)) ||
                        (this.picklists && n.startsWith('picklists-')) ||
                        (this.whiteboard && n === `config-${cfg.year}-whiteboard`))
                    {
                        let text = await content.text()
                        let write = true
                        let existing = localStorage.getItem(n)
                        let new_json = JSON.parse(text)
                        let existing_json = JSON.parse(existing)

                        // prompt if file should be overriden
                        if (existing !== null)
                        {
                            if (existing !== text)
                            {
                                let extra = ''
                                if (n.startsWith(`${PIT_MODE}-`) || n.startsWith(`${MATCH_MODE}-`))
                                {
                                    extra = ` New result is ${new_json.meta_scout_time - existing_json.meta_scout_time}s newer.`
                                }
                                else if (n.startsWith(`${NOTE_MODE}-`))
                                {
                                    extra = ` New result is ${new_json.meta_note_scout_time - existing_json.meta_note_scout_time}s newer.`
                                }
                                write = this.always_overwrite || confirm(`"${n}" already exists, overwrite?${extra}`)
                            }
                            else
                            {
                                write = false
                            }
                        }

                        // ignore and alert if a result file name doesn't match its metadata
                        if (write && (n.startsWith(`${PIT_MODE}-`) || n.startsWith(`${MATCH_MODE}-`) || n.startsWith(`${NOTE_MODE}-`)))
                        {
                            let parts = n.split('-')
                            let name_team = parseInt(parts[2])
                            let result_team = parseInt(new_json.meta_team)
                            if (name_team !== result_team)
                            {
                                alert(`Team number mismatch on ${n}`)
                                write = false
                            }

                            if (!n.startsWith(`${PIT_MODE}-`))
                            {
                                let meta_match = new_json.meta_match_key
                                if (parts[1] !== meta_match)
                                {
                                    alert(`Match key mismatch on ${n}`)
                                    write = false
                                }
                            }

                            // warn if reported config version does not match
                            let version_key = `config-${cfg.year}-version`
                            let version = files.includes(`${version_key}.json`) ? JSON.parse(localStorage.getItem(version_key)) : cfg.version
                            if (!ignore_cfg && write && new_json.hasOwnProperty('meta_config_version') && new_json.meta_config_version !== version)
                            {
                                write = confirm(`Config version mismatch on ${n}, continue?`)
                                if (write)
                                {
                                    ignore_cfg = confirm(`Ignore all config version mismatches?`)
                                }
                            }

                            // warn if reported app version does not match
                            version = get_cookie(VERSION_COOKIE, VERSION_DEFAULT)
                            if (!ignore_app && write && version !== VERSION_DEFAULT && 'meta_app_version' in new_json && new_json.meta_app_version !== version)
                            {
                                write = confirm(`App version mismatch on ${n}, continue?`)
                                if (write)
                                {
                                    ignore_app = confirm(`Ignore all app version mismatches?`)
                                }
                            }
                        }

                        if (write)
                        {
                            console.log(`Importing ${n}`)
                            localStorage.setItem(n, text)
                        }
                    }
                    else if (this.avatars && n.startsWith('avatar-'))
                    {
                        let text = await content.text()
                        let write = true
                        let existing = localStorage.getItem(n)

                        // prompt if file should be overriden
                        if (existing !== null)
                        {
                            if (existing !== text)
                            {
                                write = true
                            }
                            else
                            {
                                write = false
                            }
                        }

                        if (write)
                        {
                            console.log(`Importing ${n}`)
                            localStorage.setItem(n, text)
                        }
                    }
                }
            }

            // update progress bar
            this.on_update(++complete, files.length)
        }

        alert('Import Complete')
        cfg.load_configs(() => {
            dal = new DAL(cfg.user.state.event_id)
        dal.build_teams()
        this.on_complete()
        })
    }

    /**
     * function:    export_zip
     * paramters:   none
     * returns:     none
     * description: Creates and downloads a zip archive containing all localStorage files.
     */
    async export_zip(op=0)
    {
        let zip = JSZip()

        // determine which files to use
        let handler = this
        let files = Object.keys(localStorage).filter(function(file)
        {
            return (file.includes(dal.event_id) &&
                ((handler.event && (file.startsWith('teams-') || file.startsWith('matches-') || file.startsWith('rankings-'))) ||
                (handler.match && file.startsWith(`${MATCH_MODE}-`)) ||
                (handler.pit && file.startsWith(`${PIT_MODE}-`)) ||
                (handler.note && file.startsWith(`${NOTE_MODE}-`)))) ||
                (handler.config && (MODES.some(m => file === `config-${cfg.year}-${m}`) || file === `config-${cfg.year}-version`)) ||
                (handler.smart_stats && file === `config-${cfg.year}-smart_stats`) ||
                (handler.coach && file === `config-${cfg.year}-coach`) ||
                (handler.settings && file.startsWith('config-') && !file.startsWith(`config-${cfg.year}`)) ||
                (handler.avatars && file.startsWith('avatar-')) ||
                (handler.picklists && file.startsWith('picklists-')) ||
                (handler.whiteboard && file === `config-${cfg.year}-whiteboard`)
        })
        let num_uploads = files.length

        // add each file to the zip
        for (let i in files)
        {
            let file = files[i]
            let name = file + '.json'
            let base64 = false
            let data = localStorage.getItem(file)
            if (file.startsWith('avatar-'))
            {
                name = `avatars/${name}`
            }
            zip.file(name, data, { base64: base64 })

            // update progress bar
            this.on_update(i, files.length + 1)
        }

        // export pictures from cache
        if (typeof caches !== 'undefined')
        {
            let names = await caches.keys()
            if (names.length > 0 && this.pictures)
            {
                let cache = await caches.open(names[0])
                let keys = await cache.keys()
                
                // add each file in the cache to the table
                for (let key of keys)
                {
                    // add up all bytes in file
                    let response = await cache.match(key)

                    // create row
                    let file = response.url
                    if (file === '')
                    {
                        file = key.url
                    }

                    // check for pictures and don't put in directory if belonging to server (like server does)
                    if ((file.endsWith('.jpg') || file.endsWith('.png')) && !file.startsWith(`${this.server}/assets/`))
                    {
                        // put locally captured pictures in a cache directory
                        if (file.startsWith(`${this.server}/uploads/`))
                        {
                            file = file.replace(`${this.server}/uploads/`, 'cache/')
                        }
                        zip.file(file.replace('://', '/').replace(':', '.'), response.blob())
                        num_uploads++
                    }
                }
            }
        }

        // download zip
        let blob = await zip.generateAsync({ type: 'blob' })
        if (op === 0)
        {
            let element = document.createElement('a')
            element.href = window.URL.createObjectURL(blob)
            element.download = this.get_zip_name()

            element.style.display = 'none'
            document.body.appendChild(element)

            element.click()

            document.body.removeChild(element)
        }
        else if (op === 1) // upload
        {
            if (check_server(this.server) && cfg.user.settings)
            {                    
                // post string to server
                let formData = new FormData()
                formData.append('upload', blob)
                fetch(`${this.server}/?password=${cfg.user.settings.server_key}`, {method: 'POST', body: formData})
                    .then(response => response.json())
                    .then(result => {
                        if (result.success && result.count === num_uploads)
                        {
                            alert('Upload successful!')
                        }
                        else if (result.count === -1)
                        {
                            alert('Incorrect password!')
                        }
                        else if (result.count === -2)
                        {
                            alert('Failed to extract archive!')
                        }
                        else
                        {
                            alert('Unknown server error!')
                        }
                    })
                    .catch(e => {
                        alert('Error uploading!')
                        console.error(e)
                    })
            }
        }
        else if (op === 2)
        {
            alert('Invalid export type')
        }

        // update progress bar for zip complete
        this.on_update(files.length + 1, files.length + 1)
    }

    /**
     * Import a complete config JSON file.
     * 
     * @param {File} file Uploaded file
     */
    import_settings(file)
    {
        let reader = new FileReader()
        reader.readAsText(file, 'UTF-8')
        reader.onload = readerEvent => {
            let jstring = readerEvent.target.result
            if (file.name.endsWith('-config.json'))
            {
                let newConfig = JSON.parse(jstring)
                let keys = Object.keys(newConfig)
                for (let key of keys)
                {
                    let name = MODES.includes(key) ? `config-${cfg.year}-${key}` : `config-${key}`
                    localStorage.setItem(name, JSON.stringify(newConfig[key]))
                }
            }
            else
            {
                let name = file.name.substring(0, file.name.indexOf('.'))
                localStorage.setItem(name, jstring)
            }

            cfg.load_configs(0)
            alert('Import Complete')
            this.on_complete()
        }
    }
}