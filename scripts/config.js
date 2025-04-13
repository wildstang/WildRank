/**
 * file:        config.js
 * description: Contains config object for importing and accessing config files.
 * author:      Liam Fruzyna
 * date:        2025-03-16
 */

APP_CONFIG = 'app-config'
USER_CONFIG = 'user-config'
USER_LIST = 'user-list'
BASE_SCOUT_CONFIG = 'scout-config'
BASE_ANALYSIS_CONFIG = 'analysis-config'
GAME_CONFIG = 'game-config'

/**
 * Loads a JSON config file from the server and passes the contents as an object to the given callback.
 * 
 * @param {String} name Config name (use one of the above constants).
 * @param {Function} on_received Function to call when valid JSON is received.
 * @param {String} year Config year to load if loading a game config.
 */
function load_config(name, on_received, year='')
{
    let path = year ? `/config/${year}` : '/config'
    fetch(`${path}/${name}.json`)
        .then(response => {
            return response.json()
        })
        .then(on_received)
}

class Config
{
    constructor()
    {
        this._app_version = ''
        this._on_app_version = () => {}

        this.app = {}
        this.user = {}
        this.users = {}

        this.scout = {}
        this.analysis = {}
        this.game = {}

        this.configs_loaded = 0
        this.expected_configs = 0
    }

    /**
     * The current app version from the serviceWorker.
     */
    get app_version()
    {
        return this._app_version
    }

    /**
     * Sets the app version number and calls the callback.
     */
    set app_version(version)
    {
        this._app_version = version
        this._on_app_version()
    }

    /**
     * Sets a callback for when the app version is set. Calls it if it is already set.
     */
    set on_app_version(func)
    {
        this._on_app_version = func
        if (this._app_version)
        {
            func()
        }
    }

    /**
     * The year for the current event, or zero if no event exists.
     */
    get year()
    {
        if (this.user.state && this.user.state.event_id)
        {
            return parseInt(this.user.state.event_id.substring(0, 4))
        }
        return 0
    }

    /**
     * The currently selected theme, selected from the OS configuration if auto is selected.
     */
    get theme()
    {
        // determine selected theme from config and system if auto is selected
        let theme_name = cfg.user.state.theme.toLowerCase()
        if (theme_name === 'auto')
        {
            theme_name = 'light'
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
            {
                theme_name = 'dark'
            }
        }

        // return the corresponding theme config
        if (theme_name === 'dark')
        {
            return cfg.app.dark_theme
        }
        else
        {
            return cfg.app.theme
        }
    }

    /**
     * Returns the current TBA key. If one is not configured, helps the user get one.
     */
    get tba_key()
    {
        if (cfg.user.settings && cfg.user.settings.tba_key)
        {
            return cfg.user.settings.tba_key
        }
        else
        {
            if (confirm('No API key found for TBA! Do you want to open TBA?'))
            {
                window_open('https://www.thebluealliance.com/account#submissions-accepted-count-row', '_blank')
                let key = prompt('Enter your TBA key:')
                if (key)
                {
                    cfg.user.settings.tba_key = key
                    this.store_user_config()
                }
                return key
            }
            else
            {
                return ''
            }
        }
    }

    /**
     * The title of the application, or WildRank if that configuration isn't available.
     */
    get title()
    {
        if (this.app.config && this.app.config.title)
        {
            return cfg.app.config.title
        }
        return 'WildRank'
    }

    /**
     * A list of all available scouting mode IDs.
     */
    get scouting_modes()
    {
        if (this.scout.configs)
        {
            return this.scout.configs.map(m => m.id)
        }
        return []
    }

    /**
     * Finds a scouting mode using a given ID.
     * 
     * @param {String} mode Scouting mode id
     * @returns The requested scouting mode configuration or an empty object if a match couldn't be found.
     */
    get_scout_config(mode)
    {
        if (this.scout.configs)
        {
            for (let c of this.scout.configs)
            {
                if (c.id === mode)
                {
                    return c
                }
            }
        }
        return {}
    }

    //
    // User Functions
    //

    /**
     * Finds the name of a user from their ID number.
     * 
     * @param {String} user_id User ID number
     * @returns The name of the requested user or "Unknown User".
     */
    get_name(user_id='')
    {
        if (!user_id)
        {
            user_id = this.user.state.user_id
        }
        if (Object.keys(this.users).includes(user_id))
        {
            return this.users[user_id].name
        }
        return 'Unknown User'
    }

    /**
     * Determines if a user is an admin from their ID number.
     * 
     * @param {String} user_id User ID number
     * @returns The name admin status of a user.
     */
    is_admin(user_id='')
    {
        if (!user_id)
        {
            user_id = this.user.state.user_id
        }
        if (Object.keys(this.users).includes(user_id))
        {
            return this.users[user_id].admin
        }
        return false
    }

    /**
     * Finds a user's position from their ID number.
     * 
     * @param {String} user_id User ID number
     * @returns The position index of a user or -1.
     */
    get_position(user_id='')
    {
        if (!user_id)
        {
            user_id = this.user.state.user_id
        }
        if (Object.keys(this.users).includes(user_id))
        {
            return this.users[user_id].position
        }
        return -1
    }

    /**
     * Determines the current scouters selected position, enforcing position set in user-list.
     * 
     * @returns The current scouter's selected position.
     */
    get_selected_position()
    {
        let pos = -1
        let user_id = this.user.state.user_id
        if (Object.keys(this.users).includes(user_id))
        {
            pos = this.users[user_id].position
        }
        if (pos < 0)
        {
            pos = this.user.state.position
        }
        return pos
    }

    //
    // Config Storage Functions
    //

    /**
     * Builds the scout config name for localStorage using the current year.
     */
    get SCOUT_CONFIG()
    {
        return `${this.year}-${BASE_SCOUT_CONFIG}`
    }

    /**
     * Builds the analysis config name for localStorage using the current year.
     */
    get ANALYSIS_CONFIG()
    {
        return `${this.year}-${BASE_ANALYSIS_CONFIG}`
    }

    /**
     * Saves the current user config to localStorage.
     */
    store_user_config()
    {
        localStorage.setItem(USER_CONFIG, JSON.stringify(this.user))
    }

    /**
     * Sets the role and stores the config.
     */
    set_role(role)
    {
        cfg.user.state.role = role
        cfg.store_user_config()
    }

    /**
     * Saves the current scout config to localStorage.
     */
    store_scout_config()
    {
        localStorage.setItem(this.SCOUT_CONFIG, JSON.stringify(this.scout))
    }

    /**
     * Saves the current analysis config to localStorage.
     */
    store_analysis_config()
    {
        localStorage.setItem(this.ANALYSIS_CONFIG, JSON.stringify(this.analysis))
    }

    /**
     * Saves the current user list to localStorage.
     */
    store_user_list()
    {
        // convert users object to a CSV
        let user_list = ''
        for (let key in this.users)
        {
            user_list += `${key},${this.users[key].name},${this.users[key].admin},${this.users[key].position}\n`
        }
        localStorage.setItem(USER_LIST, user_list)
    }

    /**
     * Updates the event ID, saves the configuration, and reloads the game configs if the year changed.
     * 
     * @param {String} event_id Event ID
     * @param {Function} on_complete Function to call when loading is complete.
     * @returns Whether the year changed, used to trigger DAL updates.
     */
    update_event_id(event_id, on_complete=() => console.log('Game config reloaded'))
    {
        let old_year = this.year
        this.user.state.event_id = event_id
        this.store_user_config()

        // load in new game configs if the year has changed
        if (this.year !== old_year)
        {
            this.load_game_configs(on_complete)
            return true
        }
        return false
    }

    /**
     * Saves all user-modifiable configs to localStorage.
     */
    store_configs()
    {
        if (Object.keys(this.user).length)
        {
            this.store_user_config()
        }
        if (Object.keys(this.scout).length)
        {
            this.store_scout_config()
        }
        if (Object.keys(this.analysis).length)
        {
            this.store_analysis_config()
        }
        if (Object.keys(this.users).length)
        {
            this.store_user_list()
        }
    }

    //
    // Config Loading Function (in sequence)
    //

    /**
     * Triggers configuration loading sequence.
     * 
     * @param {Function} on_complete Function to call when loading is complete.
     * @param {Boolean} game_config Whether to load game configs.
     */
    load_configs(on_complete=() => console.log('Config loaded'))
    {
        this.configs_loaded = 0
        this.expected_configs = 3
        this.on_complete = on_complete
        this.load_app_config()
        this.load_user_config()
        this.load_user_list()
    }

    /**
     * Triggers configuration loading sequence for only the game configs.
     * 
     * @param {Function} on_complete Function to call when loading is complete.
     */
    load_game_configs(on_complete=() => console.log('Game config loaded'))
    {
        this.configs_loaded = 0
        this.expected_configs = 0
        this.on_complete = on_complete
        this.add_game_configs()
    }

    /**
     * Triggers configuration loading sequence for only the game configs.
     */
    add_game_configs()
    {
        this.expected_configs += 3
        this.load_scout_config()
        this.load_analysis_config()
        this.load_game_config()
    }

    /**
     * Helper function to count a config as loaded and perform actions on completion.
     */
    tally_config()
    {
        if (++this.configs_loaded === this.expected_configs)
        {
            this.store_configs()
            this.on_complete()
            this.expected_configs = 0
            this.configs_loaded = 0
        }
        else if (this.expected_configs === 0)
        {
            this.store_configs()
        }
    }

    /**
     * Triggers loading the app config from server/cache.
     */
    load_app_config()
    {
        load_config(APP_CONFIG, this.handle_app_config.bind(this))
    }

    /**
     * Handles successfully loaded in app config, then steps to loading user config.
     * 
     * @param {Object} app_config Loaded app config.
     */
    handle_app_config(app_config)
    {
        this.app = app_config
        this.tally_config()
    }

    /**
     * Attempts to load the user config from localStorage, if unavailable, triggers load from server/cache.
     */
    load_user_config()
    {
        let user_config = localStorage.getItem(USER_CONFIG)
        if (user_config === null)
        {
            console.log('user-config does not exist, pulling from server/cache')
            load_config(USER_CONFIG, this.handle_user_config.bind(this))
        }
        else
        {
            this.handle_user_config(JSON.parse(user_config))
        }
    }

    /**
     * Handles successfully loaded in user config, then steps to loading user list.
     * 
     * @param {Object} user_config Loaded user config.
     */
    handle_user_config(user_config)
    {
        this.user = user_config
        if (this.year)
        {
            this.add_game_configs()
        }
        this.tally_config()
    }

    /**
     * Attempts to load the user list from localStorage, if unavailable, triggers load from server/cache.
     */
    load_user_list()
    {
        let user_list = localStorage.getItem(USER_LIST)
        if (user_list === null)
        {
            console.log('user-list does not exist, pulling from server/cache')
            fetch(`/config/${USER_LIST}.csv`)
                .then(response => {
                    return response.text()
                })
                .then(this.handle_user_list.bind(this))
                .catch(err => {
                    console.log(`Error fetching ${USER_LIST} config, ${err}`)
                })
        }
        else
        {
            this.handle_user_list(user_list)
        }
    }

    /**
     * Handles successfully loaded in user list, then steps to loading game configs, if enabled.
     * 
     * @param {Object} user_list Loaded user list.
     */
    handle_user_list(user_list)
    {
        this.users = {}
        for (let row of user_list.split('\n'))
        {
            let cells = row.split(',')
            if (cells.length >= 2)
            {
                let admin = cells.length >= 3 ? cells[2].toLowerCase() === 'true' : false
                let position = cells.length >= 4 ? parseInt(cells[3]) : -1
                this.users[cells[0]] = {
                    "name": cells[1],
                    "admin": admin,
                    "position": position
                }
            }
        }

        this.tally_config()
    }

    /**
     * Attempts to load the scout config from localStorage, if unavailable, triggers load from server/cache.
     */
    load_scout_config()
    {
        let scout_config = localStorage.getItem(this.SCOUT_CONFIG)
        if (scout_config === null)
        {
            console.log(`${this.SCOUT_CONFIG} does not exist, pulling from server/cache`)
            load_config(BASE_SCOUT_CONFIG, this.handle_scout_config.bind(this), this.year)
        }
        else
        {
            this.handle_scout_config(JSON.parse(scout_config))
        }
    }

    /**
     * Handles successfully loaded in scout config, then steps to loading analysis config.
     * 
     * @param {Object} scout_config Loaded scout config.
     */
    handle_scout_config(scout_config)
    {
        this.scout = scout_config
        this.tally_config()
    }

    /**
     * Attempts to load the analysis config from localStorage, if unavailable, triggers load from server/cache.
     */
    load_analysis_config()
    {
        let analysis_config = localStorage.getItem(this.ANALYSIS_CONFIG)
        if (analysis_config === null)
        {
            console.log(`${this.ANALYSIS_CONFIG} does not exist, pulling from server/cache`)
            load_config(BASE_ANALYSIS_CONFIG, this.handle_analysis_config.bind(this), this.year)
        }
        else
        {
            this.handle_analysis_config(JSON.parse(analysis_config))
        }
    }

    /**
     * Handles successfully loaded in analysis config, then steps to loading game config.
     * 
     * @param {Object} analysis_config Loaded analysis config.
     */
    handle_analysis_config(analysis_config)
    {
        this.analysis = analysis_config
        this.tally_config()
    }

    /**
     * Triggers loading the game config from server/cache.
     */
    load_game_config()
    {
        load_config(GAME_CONFIG, this.handle_game_config.bind(this), this.year)
    }

    /**
     * Handles successfully loaded in game config, then triggers the completion callback.
     * 
     * @param {Object} game_config Loaded game config.
     */
    handle_game_config(game_config)
    {
        this.game = game_config
        this.tally_config()
    }
}