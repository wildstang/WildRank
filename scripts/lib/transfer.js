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
                    if (file.url.endsWith('-config.json') || file.url === `${cfg.user_list.name}.csv`)
                    {
                        cache.delete(file)
                    }
                }
            }
        }

        // search localStorage for "config-20" files and delete them plus "config-users"
        let files = Object.keys(localStorage).filter(f => f.endsWith('-config') || f === cfg.user_list.name)
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
        // DAL
        this.event_data = false
        this.results = false
        this.picklists = false

        // Config
        this.scout_config = false
        this.analysis_config = false
        this.user_settings = false
        this.user_list = false

        // options
        this.on_update = this.do_nothing
        this.on_complete = this.do_nothing
    }

    do_nothing(a='', b='') {}

    /**
     * Helper function that creates a zip handler to import configuration data.
     * @param {Function} on_complete Function to call when loading is complete.
     */
    static import_setup(on_complete=this.do_nothing)
    {
        let zh = new ZipHandler()
        zh.event_data = true
        zh.scout_config = true
        zh.analysis_config = true
        zh.on_complete = on_complete
        zh.import_zip_from_file()
    }

    /**
     * Helper function that creates a zip handler to import all results.
     * @param {Function} on_complete Function to call when loading is complete.
     */
    static import_results(on_complete=this.do_nothing)
    {
        let zh = new ZipHandler()
        zh.results = true
        zh.on_complete = on_complete
        zh.import_zip_from_file(true)
    }

    /**
     * Helper function that creates a zip handler to import results and event data.
     * @param {Function} on_complete Function to call when loading is complete.
     */
    static import_data(on_complete=this.do_nothing)
    {
        let zh = new ZipHandler()
        zh.event_data = true
        zh.results = true
        zh.on_complete = on_complete
        zh.import_zip_from_file()
    }

    /**
     * Helper function that creates a zip handler to export configuration data.
     * @param {Function} on_complete Function to call when loading is complete.
     */
    static export_setup()
    {
        let zh = new ZipHandler()
        zh.event_data = true
        zh.scout_config = true
        zh.analysis_config = true
        zh.export_zip()
    }

    /**
     * Helper function that creates a zip handler to export a given mode of results.
     * @param {Function} on_complete Function to call when loading is complete.
     */
    static export_results(scout_mode='')
    {
        let zh = new ZipHandler()
        if (scout_mode)
        {
            zh.results = scout_mode
        }
        zh.export_zip()
    }

    /**
     * Helper function that creates a zip handler to export results and event data.
     * @param {Function} on_complete Function to call when loading is complete.
     */
    static export_data()
    {
        let zh = new ZipHandler()
        zh.event_data = true
        zh.results = true
        zh.export_zip()
    }

    /**
     * Generates a Zip file name based on the configured files.
     */
    get zip_name()
    {
        // start name with user ID if available
        let name = ''
        if (cfg.user.state.user_id)
        {
            name = `${cfg.user.state.user_id}-`
        }

        // add event ID
        name += cfg.user.state.event_id

        let options = [this.event_data, this.results, this.picklists, this.scout_config, this.analysis_config, this.user_settings, this.user_list]
        let total = options.filter(Boolean).length
        let configs = this.event_data + this.scout_config + this.analysis_config + this.user_settings + this.user_list

        let suffix
        if (total === 1)
        {
            if (typeof this.results === 'string')
            {
                suffix = this.results
            }
            else
            {
                let names = ['event', 'results', 'picklists', 'scout', 'analysis', 'settings', 'users']
                suffix = names[options.indexOf(true)]
            }
        }
        else if (configs === total)
        {
            suffix = 'configs'
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
                    else
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
        const event_id = cfg.user.state.event_id
        if (file['name'] !== undefined && !file.name.includes(event_id))
        {
            if (!confirm(`Warning, zip does not contain "${event_id}" in the name! Continue?`))
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
        let app_version = cfg.app_version
        let scout_version = cfg.scout.version

        let total_files = files.length
        if (total_files == 0)
        {
            alert('No files found!')
        }

        for (let name of files)
        {
            // get name used in localStorage
            let file_name = name.substring(0, name.indexOf('.'))
            if (file_name.includes('/'))
            {
                file_name = file_name.substring(file_name.lastIndexOf('/') + 1)
            }
            if (file_name.includes('\\'))
            {
                file_name = file_name.substring(file_name.lastIndexOf('\\') + 1)
            }

            // skip directories
            if (name.endsWith('/'))
            {
                complete++
                continue
            }

            // get blob of file
            let content = await zip.file(name).async('blob')

            let text = await content.text()
            if (file_name === cfg.user.name)
            {
                console.log(`Importing ${file_name}`)
                cfg.user.handle_config(text)
                cfg.user.store_config()
            }
            else if (file_name === cfg.scout.name)
            {
                console.log(`Importing ${file_name}`)
                cfg.scout.handle_config(text)
                cfg.scout.store_config()
            }
            else if (file_name === cfg.analysis.name)
            {
                console.log(`Importing ${file_name}`)
                cfg.analysis.handle_config(text)
                cfg.analysis.store_config()
            }
            else if (file_name === cfg.user_list.name)
            {
                console.log(`Importing ${file_name}`)
                cfg.user_list.handle_config(text)
                cfg.user_list.store_config()
            }
            else if ((this.event_data && file_name.startsWith(`avatar-${cfg.year}-`)) ||
                (this.picklists && file_name === dal.picklist_file) ||
                (this.event_data && [`event-${event_id}`, `matches-${event_id}`,
                `rankings-${event_id}`, `teams-${event_id}`].includes(file_name)))
            {
                console.log(`Importing ${file_name}`)
                localStorage.setItem(file_name, text)
            }
            else if (this.results === true && file_name.startsWith('result-'))
            {
                let new_json = JSON.parse(text)

                if (new_json.meta.result.event_id === event_id)
                {
                    let old_json = JSON.parse(localStorage.getItem(file_name))
                    if (old_json === null || new_json.meta.scouter.time > old_json.meta.scouter.time)
                    {
                        let write = true
                        if (!ignore_cfg && new_json.meta.scouter.meta_config_version !== scout_version)
                        {
                            if (confirm(`App version mismatch on ${file_name}, continue?`))
                            {
                                ignore_cfg = confirm(`Ignore all app version mismatches?`)
                            }
                            else
                            {
                                write = false
                            }
                        }
                        if (!ignore_app && new_json.meta.scouter.meta_app_version !== app_version)
                        {
                            if (confirm(`Config version mismatch on ${file_name}, continue?`))
                            {
                                ignore_app = confirm(`Ignore all config version mismatches?`)
                            }
                            else
                            {
                                write = false
                            }
                        }
                        if (write)
                        {
                            console.log(`Importing ${file_name}`)
                            localStorage.setItem(file_name, text)
                        }
                    }
                }
            }

            // update progress bar
            this.on_update(++complete, total_files)
        }

        dal = new Data(event_id)
        dal.load_data()
        this.on_complete()
        alert('Import Complete')
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
        const event_id = cfg.user.state.event_id

        // determine which files to use
        let handler = this
        let files = Object.keys(localStorage).filter(function(file_name)
        {
            if (handler.results && file_name.startsWith('result-'))
            {
                let result = JSON.parse(localStorage.getItem(file_name))
                return result.meta.result.event_id === event_id &&
                    (handler.results === true || result.meta.result.scout_mode === scout_mode)
            }
            return ((handler.event_data && [`event-${event_id}`, `matches-${event_id}`,
                    `rankings-${event_id}`, `teams-${event_id}`].includes(file_name)) ||
                (handler.picklists && file_name.startsWith('picklists-')) ||
                (handler.scout_config && file_name === cfg.scout.name) ||
                (handler.analysis_config && file_name === cfg.analysis.name) ||
                (handler.user_settings && file_name === cfg.user.name) ||
                (handler.user_list && file_name === cfg.user_list.name ||
                (handler.event_data && file_name.startsWith(`avatar-${cfg.year}-`))))
        })

        let num_uploads = files.length
        if (num_uploads === 0)
        {
            alert('No data to export')
            return
        }

        // add each file to the zip
        for (let i in files)
        {
            let file = files[i]
            let name = file + (file === cfg.user_list.name ? '.csv' : '.json')
            let base64 = false
            let data = localStorage.getItem(file)
            if (file.startsWith('avatar-'))
            {
                name = `avatars/${file}`
            }
            zip.file(name, data, { base64: base64 })

            // update progress bar
            this.on_update(i, files.length + 1)
        }

        // download zip
        let blob = await zip.generateAsync({ type: 'blob' })
        if (op === 0)
        {
            let element = document.createElement('a')
            element.href = window.URL.createObjectURL(blob)
            element.download = this.zip_name

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
        else
        {
            alert('Invalid export type')
        }

        // update progress bar for zip complete
        this.on_update(files.length + 1, files.length + 1)
    }

    /**
     * Import a complete config JSON file.
     * @param {File} file Uploaded file
     */
    import_settings(file)
    {
        let reader = new FileReader()
        reader.readAsText(file, 'UTF-8')
        reader.onload = readerEvent => {
            let alert_text = 'Import Complete'

            let text = readerEvent.target.result
            if (file.name.startsWith(cfg.user.name))
            {
                cfg.user.handle_config(text)
            }
            else if (file.name.startsWith(cfg.scout.name))
            {
                cfg.scout.handle_config(text)
            }
            else if (file.name.startsWith(cfg.analysis.name))
            {
                cfg.analysis.handle_config(text)
            }
            else if (file.name.startsWith(cfg.user_list.name))
            {
                cfg.user_list.handle_config(text)
            }
            else
            {
                alert_text = `Unrecognized file ${text}`
            }

            alert(alert_text)
            this.on_complete()
        }
    }
}