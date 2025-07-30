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
    let key_query = cfg.tba_query
    if (!key_query)
    {
        return
    }

    passes = []
    fails = []
    api_endpoint = `https://www.thebluealliance.com/api/v3`
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
 * Attempts to find an event ID in a given file name.
 * @param {String} file_name File name
 * @returns Event ID or empty string
 */
function find_event_id(file_name)
{
    let words = file_name.substring(0, file_name.indexOf('.')).split('-')
    for (let word of words)
    {
        if (word.length > 5 && word.length < 10)
        {
            let year = parseInt(word.substring(0, 4))
            if (!isNaN(year) && year > 2000 && year < 2100)
            {
                return word
            }
        }
    }
    return ''
}

/**
 * Import / Export
 */

/**
 * Helper function that creates an Exporter to export configuration data.
 * @return An Exporter instance
 */
function build_export_setup()
{
    let e = new Exporter()
    e.event_data = true
    e.scout_config = true
    e.analysis_config = true
    return e
}

/**
 * Helper function that creates an Exporter to export a given mode of results.
 * @return An Exporter instance
 */
function build_export_results(scout_mode=true)
{
    let e = new Exporter()
    if (scout_mode)
    {
        e.results = scout_mode
    }
    return e
}

/**
 * Helper function that creates an Exporter to export results and event data.
 * @return An Exporter instance
 */
function build_export_data()
{
    let e = new Exporter()
    e.event_data = true
    e.results = true
    return e
}

/**
 * Helper function that creates an Exporter to export (nearly) all data.
 * @return An Exporter instance
 */
function build_export_all()
{
    let e = new Exporter()
    e.event_data = true
    e.scout_config = true
    e.analysis_config = true
    e.results = true
    e.picklists = true
    return e
}

class BaseTransfer
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
    }

    /**
     * Builds a description of what the BaseTransfer will import.
     * @returns Description of the BaseTransfer
     */
    get description()
    {
        let bools = [this.event_data, this.scout_config, this.analysis_config, this.results, this.picklists, this.user_list, this.user_settings]
        let names = ['event data', 'scouting config', 'analysis config', 'results', 'picklists', 'users', 'settings']
        let selected_names = names.filter((_, i) => bools[i])
        if (selected_names.length > 1)
        {
            if (selected_names.length > 2)
            {
                selected_names = selected_names.map((n, i) => {
                    if (n === 'results' && typeof this.results === 'string')
                    {
                        n = `${this.results} results`
                    }
                    if (i < selected_names.length - 1)
                    {
                        n += ','
                    }
                    return n
                })
            }
            selected_names.splice(selected_names.length - 1, 0, 'and')
        }
        return capitalize(selected_names.join(' '))
    }

    /**
     * Builds a button to start the transfer process.
     * @param {String} label Button label
     * @param {Function} action Function to call on press
     * @returns A WRButton which calls step_import
     */
    _build_button(label, action)
    {
        let button = new WRButton(label, action)
        button.element.title = this.description
        button.add_class('transfer')
        return button
    }
}

class Exporter extends BaseTransfer
{
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
     * Exports data from localStorage as a ZIP file.
     */
    export_zip()
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
                    (handler.results === true || result.meta.result.scout_mode === handler.results)
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
        zip.generateAsync({ type: 'blob' }).then(this.download_blob.bind(this))
    }

    /**
     * Starts a download of the given blob.
     * @param {Blob} blob Blob to download
     */
    download_blob(blob)
    {
        let element = document.createElement('a')
        element.href = window.URL.createObjectURL(blob)
        element.download = this.zip_name

        element.style.display = 'none'
        document.body.appendChild(element)

        element.click()

        document.body.removeChild(element)
    }

    /**
     * Builds a button to start the export process.
     * @param {String} label Button label
     * @returns A WRButton which calls export_zip
     */
    build_button(label)
    {
        return this._build_button(label, this.export_zip.bind(this))
    }
}

/**
 * Helper function that creates a Importer to import a picklist JSON file.
 * @param {Function} on_complete Function to call when loading is complete
 * @return An Importer instance
 */
function build_import_picklist(on_complete=() => {})
{
    let i = new Importer()
    i.picklists = true
    i.allow_json = true
    i.on_complete = on_complete
    return i
}

/**
 * Helper function that creates an Importer for configs and event data.
 * @param {Function} on_complete Function to call when loading is complete
 * @return An Importer instance
 */
function build_import_setup(on_complete=() => {})
{
    let i = new Importer()
    i.event_data = true
    i.scout_config = true
    i.analysis_config = true
    i.allow_json = true
    i.on_complete = on_complete
    return i
}

/**
 * Helper function that creates an Importer for results only.
 * @param {Function} on_complete Function to call when loading is complete
 * @return An Importer instance
 */
function build_import_results(on_complete=() => {})
{
    let i = new Importer()
    i.results = true
    i.select_multiple = true
    i.on_complete = on_complete
    return i
}

/**
 * Helper function that creates an Importer for results and event data.
 * @param {Function} on_complete Function to call when loading is complete
 * @return An Importer instance
 */
function build_import_data(on_complete=() => {})
{
    let i = new Importer()
    i.event_data = true
    i.results = true
    i.on_complete = on_complete
    return i
}

/**
 * Helper function that creates an Importer for configs, results, and event data.
 * @param {Function} on_complete Function to call when loading is complete
 * @param {Boolean} ignore_versions Whether to completely ignore app/config versions
 * @return An Importer instance
 */
function build_import_all(on_complete=() => {}, ignore_versions=false)
{
    let i = new Importer()
    i.event_data = true
    i.scout_config = true
    i.analysis_config = true
    i.results = true
    i.on_complete = on_complete
    i.ignore_versions = ignore_versions
    return i
}

/**
 * Imports a file stored in the given cache at /import. Used for sharing zips to WildRank.
 * @param {Response} cache_res Cache response
 */
function import_zip_from_cache(cache_res)
{
    if (cache_res)
    {
        let i = new Importer()
        i.event_data = true
        i.scout_config = true
        i.analysis_config = true
        i.results = true
        i.picklists = true
        i.selected_files = []
        i.handle_blob(cache_res.blob())
    }
    else
    {
        alert('No cached file available!')
    }
}

class Importer extends BaseTransfer
{
    constructor()
    {
        super()

        // options
        this.select_multiple = false
        this.allow_json = false
        this.on_complete = () => {}
        this.ignore_versions = false
        this.ignore_app = false
        this.ignore_cfg = false

        // state
        this.selected_files = null
        this.current_file = null
        this.zip_files = null
        this.current_name = null
        this.event_id = null
    }

    /**
     * Formats a message for prettier logs.
     * @param {String} message Message to log
     */
    log(message)
    {
        let header = '[IMPORT]'
        console.log(`${header} ${message}`)
    }

    /**
     * Prompts the user to select one or many files.
     * Importer.select_multiple allows multiple files to be selected.
     * Importer.allow_json allows JSON files to be selected in addition to zip files.
     */
    prompt_for_file()
    {
        this.ignore_app = this.ignore_versions
        this.ignore_cfg = this.ignore_versions

        this.log('No files, prompting user')
        let input = document.createElement('input')
        input.type = 'file'
        let mime_type = 'application/zip'
        if (this.allow_json)
        {
            mime_type += ',application/json'
        }
        input.accept = mime_type
        input.multiple = this.select_multiple
        input.addEventListener('change', this.handle_selected_files.bind(this))
        input.click()
    }

    /**
     * Handles newly selected files from the user, stores into an array and steps import.
     * @param {Event} event Event from file selector.
     */
    handle_selected_files(event)
    {
        this.selected_files = Array.from(event.target.files)
        if (this.selected_files.length)
        {
            this.step_import()
        }
    }

    /**
     * Determines what kind of file the selected file is, then begins reading its contents.
     */
    open_selected_file()
    {
        let cfg_event_id = cfg.user.state.event_id
        let name = this.current_file.name
        this.log(`Processing ${name}`)
        if (name.endsWith('.zip'))
        {
            if (this.event_id === null)
            {
                this.event_id = find_event_id(name)
                this.log(`Found zip from ${this.event_id}`)
            }

            if (this.event_id === '')
            {
                alert(`No event ID found in ${name}`)
            }
            else if (this.event_id !== cfg_event_id)
            {
                this.update_event_id()
            }
            else if (this.zip_files === null)
            {
                this.log('Opening zip')
                JSZip.loadAsync(this.current_file).then(this.handle_zip.bind(this))
            }
        }
        else if (name.endsWith('.json'))
        {
            this.log('Found JSON')
            this.current_file = name
            this.handle_blob(this.current_file)
            this.step_import()
        }
        else
        {
            alert(`Invalid file extension in ${name}`)
        }
    }

    /**
     * Asks the user if they want to update the event ID to that from the zip.
     */
    update_event_id()
    {
        if (confirm(`Switch event to ${this.event_id}?`))
        {
            cfg.update_event_id(this.event_id, this.step_import.bind(this))
        }
    }

    /**
     * Gets the list of files from the zip archive, then steps import.
     * @param {*} zip Newly loaded Zip file
     */
    handle_zip(zip)
    {
        this.current_file = null
        this.zip_files = zip.files
        this.step_import()
    }

    /**
     * Removes the first file from the zip archive and begins processing it.
     * If the archive is empty, steps import to the next file.
     */
    shift_file_from_zip()
    {
        let names = Object.keys(this.zip_files)
        if (names.length)
        {
            this.log(`${names.length} zip files remaining`)
            let name = names[0]

            // remove directories in path
            if (name.includes('/'))
            {
                name = name.substring(name.lastIndexOf('/') + 1)
            }
            if (name.includes('\\'))
            {
                name = name.substring(name.lastIndexOf('\\') + 1)
            }

            // skip directories
            if (!name.endsWith('/'))
            {
                this.current_name = name
                var data = this.zip_files[this.current_name]
                delete this.zip_files[this.current_name]
                data.async('blob').then(this.handle_blob.bind(this))
            }
            else
            {
                this.step_import()
            }
        }
        else
        {
            this.log('Zip empty, advancing file')
            this.zip_files = null
            this.event_id = null
            this.step_import()
        }
    }

    /**
     * Opens the given blob as a text file.
     * @param {Blob} blob The next blob to open.
     */
    handle_blob(blob)
    {
        this.log(`Opening ${this.current_name}`)
        blob.text().then(this.handle_file.bind(this))
    }

    /**
     * Imports the current file from its text contents, then steps import.
     * @param {String} text Text contents of the current file
     */
    handle_file(text)
    {
        this.log(`Reading ${this.current_name}`)
        let file_name = this.current_name.substring(0, this.current_name.indexOf('.'))

        this.import_config(file_name, text)
        this.import_event_data(file_name, text)
        this.import_result(file_name, text)

        this.step_import()
    }

    /**
     * Determine whether to import the given file as a config file, then import it.
     * @param {String} file_name Name of importing file (without extension or path)
     * @param {String} text File text contents
     * @returns Whether the file was imported
     */
    import_config(file_name, text)
    {
        let allowed = [this.user_settings, this.scout_config, this.analysis_config, this.user_list]
        let configs = [cfg.user, cfg.scout, cfg.analysis, cfg.user_list]
        let index = configs.map(c => c.name).indexOf(file_name)
        if (index >= 0 && allowed[index])
        {
            this.log(`Importing ${file_name} to config`)
            configs[index].handle_config(JSON.parse(text))
            configs[index].store_config()
        }
    }

    /**
     * Determine whether to import the given file as event data, then import it into localStorage.
     * @param {String} file_name Name of importing file (without extension or path)
     * @param {String} text File text contents
     * @returns Whether the file was imported
     */
    import_event_data(file_name, text)
    {
        if ((this.event_data && file_name.startsWith(`avatar-${cfg.year}-`)) ||
            (this.picklists && file_name === dal.picklist_file) ||
            (this.event_data && [`event-${this.event_id}`, `matches-${this.event_id}`,
            `rankings-${this.event_id}`, `teams-${this.event_id}`].includes(file_name)))
        {
            this.log(`Importing ${file_name} to localStorage`)
            localStorage.setItem(file_name, text)
            return true
        }
        return false
    }

    /**
     * Determine whether to import the given file as a result, then import it.
     * @param {String} file_name Name of importing file (without extension or path)
     * @param {String} text File text contents
     * @returns Whether the file was imported
     */
    import_result(file_name, text)
    {
        if (this.results && file_name.startsWith('result-'))
        {
            let new_meta = JSON.parse(text).meta

            // skip results belonging to the wrong event
            let valid_mode = this.results === true || new_meta.result.scout_mode === this.results
            if (valid_mode && new_meta.result.event_id === this.event_id)
            {
                // skip results that are already imported
                let old_text = localStorage.getItem(file_name)
                if (text === old_text)
                {
                    this.log(`Match result ${file_name} already exists`)
                    return
                }
                // skip results that have an updated version already imported
                let old_json = JSON.parse(old_text)
                if (old_json !== null && new_meta.scouter.time < old_json.meta.scouter.time)
                {
                    this.log(`Existing result of ${file_name} is ${old_json.meta.scouter.time - new_meta.scouter.time} newer`)
                    return
                }

                // ask to skip results that don't have a matching config version number
                let res_config_version = new_meta.scouter.config_version
                if (!this.ignore_cfg && res_config_version !== cfg.scout.version)
                {
                    if (!confirm(`App version mismatch on ${file_name} (${res_config_version}), continue?`))
                    {
                        return
                    }
                    this.ignore_cfg = confirm(`Ignore all app version mismatches?`)
                }

                // ask to skip results that don't have a matching app version number
                let res_app_version = new_meta.scouter.app_version
                if (!this.ignore_app && res_app_version !== cfg.app_version)
                {
                    if (!confirm(`Config version mismatch on ${file_name} (${res_app_version}), continue?`))
                    {
                        return
                    }
                    this.ignore_app = confirm(`Ignore all config version mismatches?`)
                }

                this.log(`Importing ${file_name} as result`)
                localStorage.setItem(file_name, text)
            }
        }
    }

    /**
     * Calls on_complete then announces the import is complete to the user.
     */
    complete_import()
    {
        this.log('Import complete, reloading cfg and dal and calling import complete')
        cfg.load_configs(() => {
            dal.load_data()
            this.on_complete()
            alert('Import Complete')
        })
    }

    /**
     * Used to advance the import process from one step to the next.
     */
    step_import()
    {
        if (this.zip_files !== null)
        {
            this.shift_file_from_zip()
        }
        else if (this.current_file)
        {
            this.open_selected_file()
        }
        else if (this.selected_files === null)
        {
            this.prompt_for_file()
        }
        else if (this.selected_files.length)
        {
            this.log(`${this.selected_files.length} selected files remaining`)
            this.current_file = this.selected_files.shift()
            this.step_import()
        }
        else
        {
            this.complete_import()
        }
    }

    /**
     * Builds a button to start the import process.
     * @param {String} label Button label
     * @returns A WRButton which calls step_import
     */
    build_button(label)
    {
        return this._build_button(label, this.step_import.bind(this))
    }
}