/**
 * file:        transfer.js
 * description: Contains data management functions for the index of the web app.
 * author:      Liam Fruzyna
 * date:        2021-05-24
 */

include('external/jszip.min')

/**
 * TBA Data Loading
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
 * Data Reset
 */

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
 * Import / Export
 */

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
        zh.import_file()
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
        zh.import_file(true)
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
        zh.import_file()
    }

    /**
     * Helper function that creates a zip handler to export configuration data.
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
     */
    static export_results(scout_mode=true)
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
     */
    static export_data()
    {
        let zh = new ZipHandler()
        zh.event_data = true
        zh.results = true
        zh.export_zip()
    }

    /**
     * Helper function that creates a zip handler to export (nearly) all data.
     */
    static export_all()
    {
        let zh = new ZipHandler()
        zh.event_data = true
        zh.scout_config = true
        zh.analysis_config = true
        zh.results = true
        zh.picklists = true
        zh.export_zip()
    }

    /**
     * Generates a Zip file name based on the configured files.
     */
    get zip_name()
    {
        // start name with user ID if available, then event ID
        let prefix = cfg.user.state.event_id
        if (cfg.user.state.user_id)
        {
            prefix = `${cfg.user.state.user_id}-${prefix}`
        }

        let options = [this.event_data, this.results !== false, this.picklists, this.scout_config, this.analysis_config, this.user_settings, this.user_list]
        let total = options.filter(Boolean).length
        let configs = this.event_data + this.scout_config + this.analysis_config + this.user_settings + this.user_list

        // choose a suffix based on what is being exported
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
        else if (total === 2 && this.event_data && this.results)
        {
            suffix = 'data'
        }
        else
        {
            suffix = 'export'
        }

        return `${prefix}-${suffix}.zip`
    }

    /**
     * Imports a file stored in the given cache at /import. Used for sharing zips to WildRank.
     * @param {String} cache_name Cache name
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
     * Prompts the user to select file(s) to import, then handles each file based on type.
     * @param {Boolean} select_multiple Whether to allow importing multiple files.
     * @param {Boolean} allow_json Whether to allow JSON files
     */
    import_file(select_multiple=false, allow_json=false)
    {
        let input = document.createElement('input')
        input.type = 'file'
        let mime_type = 'application/zip'
        if (allow_json)
        {
            mime_type += ',application/json'
        }
        input.accept = mime_type
        input.multiple = select_multiple
        input.addEventListener('change', this.handle_files.bind(this))
        input.click()
    }

    /**
     * Iterates over each selected file and attempts to import it.
     * @param {Event} event File import event
     */
    async handle_files(event)
    {
        for (let file of event.target.files)
        {
            if (file.name)
            {
                let error = file.name.endsWith('.zip') ? await this.import_zip(file) : this.import_settings(file)
                if (error && typeof error === 'string')
                {
                    alert(`${error}: ${file}`)
                }
            }
        }

        // reload config and data
        cfg.load_configs(() => {
            dal.load_data()
        })

        this.on_complete()
        alert('Import Complete')
    }

    /**
     * Attempts to import a given zip file.
     * @param {File} file ZIP file to import
     * @returns An error description or false
     */
    async import_zip(file)
    {
        const event_id = cfg.user.state.event_id
        if (file['name'] !== undefined && !file.name.includes(event_id))
        {
            if (!confirm(`Warning, zip does not contain "${event_id}" in the name! Continue?`))
            {
                return true
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

        if (files.length == 0)
        {
            return 'No files found!'
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
            let configs = [cfg.user, cfg.scout, cfg.analysis, cfg.user_list]
            let index = configs.map(c => c.name).indexOf(file_name)
            if (index >= 0)
            {
                console.log(`Importing ${file_name}`)
                configs[index].handle_config(JSON.parse(text))
                configs[index].store_config()
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
                let new_meta = JSON.parse(text).meta
                if (new_meta.result.event_id === event_id)
                {
                    let old_text = localStorage.getItem(file_name)
                    let old_json = JSON.parse(old_text)
                    if (text === old_text)
                    {
                        console.log(`Result ${file_name} already exists`)
                    }
                    else if (old_json !== null && new_meta.scouter.time < old_json.meta.scouter.time)
                    {
                        console.log(`Existing result of ${file_name} is ${old_json.meta.scouter.time - new_meta.scouter.time} newer`)
                    }
                    else
                    {
                        let write = true
                        let res_config_version = new_meta.scouter.config_version
                        let res_app_version = new_meta.scouter.app_version
                        if (!ignore_cfg && res_config_version !== scout_version)
                        {
                            if (confirm(`App version mismatch on ${file_name} (${res_config_version}), continue?`))
                            {
                                ignore_cfg = confirm(`Ignore all app version mismatches?`)
                            }
                            else
                            {
                                write = false
                            }
                        }
                        if (!ignore_app && res_app_version !== app_version)
                        {
                            if (confirm(`Config version mismatch on ${file_name} (${res_app_version}), continue?`))
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
        }

        return false
    }

    /**
     * Import a complete config JSON file.
     * @param {File} file Uploaded file
     * @returns An error description or false
     */
    import_settings(file)
    {
        let reader = new FileReaderSync()
        let text = reader.readAsText(file, 'UTF-8')

        if (file.name.startsWith(cfg.user.name))
        {
            console.log(`Importing ${file.name}`)
            cfg.user.handle_config(text)
        }
        else if (file.name.startsWith(cfg.scout.name))
        {
            console.log(`Importing ${file.name}`)
            cfg.scout.handle_config(text)
        }
        else if (file.name.startsWith(cfg.analysis.name))
        {
            console.log(`Importing ${file.name}`)
            cfg.analysis.handle_config(text)
        }
        else if (file.name.startsWith(cfg.user_list.name))
        {
            console.log(`Importing ${file.name}`)
            cfg.user_list.handle_config(text)
        }
        else
        {
            return` Unrecognized file ${text}`
        }

        return false
    }

    /**
     * Exports data from localStorage as a ZIP file.
     * @param {Number} op Export operation type, currently only 0, to file
     * @returns An error description or false
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
                (handler.picklists && file_name === `picklists-${event_id}`) ||
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
        else
        {
            alert('Invalid export type')
        }
    }
}