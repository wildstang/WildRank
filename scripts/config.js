/**
 * file:        config.js
 * description: Contains config object for importing and accessing config files.
 * author:      Liam Fruzyna
 * date:        2025-03-16
 */

/**
 * Loads a JSON config file from the server and passes the contents as an object to the given callback.
 * Uses cache mode "reload" to force a cache reload on every request.
 * @param {String} name Config name (use one of the above constants).
 * @param {Function} on_received Function to call when valid JSON is received.
 * @param {String} year Config year to load if loading a game config.
 */
function load_config(name, on_received, year='')
{
    let path = year ? `/config/${year}` : '/config'
    fetch(`${path}/${name}.json`, { cache: "reload" })
        .then(response => {
            return response.json()
        })
        .then(on_received)
}

//
// Validation Helpers
//

/**
 * Validates that a given object has a given key and a corresponding int.
 * @param {String} name Name describing the object
 * @param {Object} obj Object in question
 * @param {String} key Key that should reference an int
 * @param {Array} options Set of values the int may be, or any int if empty
 * @returns true if passes, descriptive string if error
 */
function has_int(name, obj, key, options=[])
{
    if (!(obj.hasOwnProperty(key) && Number.isInteger(obj[key]) && (options.length === 0 || options.includes(obj[key]))))
    {
        let warning = `${name} missing valid int key, ${key}`
        if (options.length)
        {
            warning += `, valid values: ${options.join(', ')}`
        }
        console.log(warning)
        return warning
    }
    return true
}

/**
 * Validates that a given object has a given key and a corresponding boolean.
 * @param {String} name Name describing the object
 * @param {Object} obj Object in question
 * @param {String} key Key that should reference a boolean
 * @returns true if passes, descriptive string if error
 */
function has_bool(name, obj, key)
{
    if (!(obj.hasOwnProperty(key) && typeof obj[key] === 'boolean'))
    {
        let warning = `${name} missing valid boolean key, ${key}`
        console.log(warning)
        return warning
    }
    return true
}

/**
 * Validates that a given object has a given key and a corresponding string.
 * @param {String} name Name describing the object
 * @param {Object} obj Object in question
 * @param {String} key Key that should reference an string
 * @param {Array} options Set of values the string may be, or any string if empty
 * @returns true if passes, descriptive string if error
 */
function has_string(name, obj, key, options=[])
{
    if (!(obj.hasOwnProperty(key) && typeof obj[key] === 'string' && (options.length === 0 || options.includes(obj[key]))))
    {
        let warning = `${name} missing valid string key, ${key}`
        if (options.length)
        {
            warning += `, valid values: ${options.join(', ')}`
        }
        console.log(warning)
        return warning
    }
    return true
}

/**
 * Validates that a given object has a given key and a corresponding array.
 * @param {String} name Name describing the object
 * @param {Object} obj Object in question
 * @param {String} key Key that should reference an string
 * @param {String} type Type that the array's values should be
 * @returns true if passes, descriptive string if error
 */
function has_array(name, obj, key, type)
{
    if (!(obj.hasOwnProperty(key) && Array.isArray(obj[key])))
    {
        let warning = `${name} missing valid array key, ${key}`
        console.log(warning)
        return warning
    }
    for (let val of obj[key])
    {
        if (typeof val !== type)
        {
            let warning = `${name} contains invalid ${type}, ${val}`
            console.log(warning)
            return warning
        }
    }
    return true
}

/**
 * Validates that a given object has a given key and a corresponding object.
 * @param {String} name Name describing the object
 * @param {Object} obj Object in question
 * @param {String} key Key that should reference an object
 * @returns true if passes, descriptive string if error
 */
function has_object(name, obj, key)
{
    if (!(obj.hasOwnProperty(key) && typeof obj[key] === 'object'))
    {
        let warning = `${name} missing valid object key, ${key}`
        console.log(warning)
        return warning
    }
    return true
}

//
// Config Objects
//

class UserConfig
{
    BASE_NAME = 'user-config'
    VALID_TIME_FORMATS = [12, 24]
    VALID_FONT_SIZES = ['xx-small', 'x-small', 'small', 'medium', 'large', 'x-large', 'xx-large']
    VALID_THEMES = ['light', 'dark', 'auto']

    constructor()
    {
        this.loaded = false
        this.name = this.BASE_NAME

        this.version = null
        this.settings = {
            team_number: null,
            time_format: null,
            use_team_color: null,
            use_offline: null,
            auto_hide_right: null,
            tba_key: null,
            server_key: null,
            font_size: null
        }
        this.state = {
            event_id: null,
            user_id: null,
            position: null,
            theme: null,
            role: null
        }
    }

    /**
     * Load in the user config, first from localStorage, then from server/cache. Triggers handle_config.
     */
    load()
    {
        let user_config = localStorage.getItem(this.name)
        if (user_config !== null)
        {
            this.handle_config(JSON.parse(user_config))
            if (this.loaded)
            {
                return
            }
        }

        console.log(`${this.name} does not exist, pulling from server/cache`)
        load_config(this.BASE_NAME, this.handle_config.bind(this))
    }

    /**
     * Handles a given user config object, runs validation, and applies contents to class.
     * @param {Object} user_config User config as raw object
     */
    handle_config(user_config)
    {
        if (UserConfig.validate(user_config))
        {
            this.version = user_config.version
            this.settings = user_config.settings
            this.state = user_config.state
            this.loaded = true
        }
    }

    /**
     * Validates a given user config object.
     * @param {Object} user_config User config as raw object
     * @param {Boolean} summarize Whether a boolean or list of tests should be returned
     * @returns If summarize, a boolean, otherwise a list of trues and failure cases for each test.
     */
    static validate(user_config, summarize=true)
    {
        let tests = [
            has_string(UserConfig.BASE_NAME, user_config, 'version'),
            has_object(UserConfig.BASE_NAME, user_config, 'settings'),
            has_object(UserConfig.BASE_NAME, user_config, 'state')
        ]
        if (tests[1] === true)
        {
            tests.push(has_int(UserConfig.BASE_NAME, user_config.settings, 'team_number'),
                has_int(UserConfig.BASE_NAME, user_config.settings, 'time_format', UserConfig.VALID_TIME_FORMATS),
                has_bool(UserConfig.BASE_NAME, user_config.settings, 'use_team_color'),
                has_bool(UserConfig.BASE_NAME, user_config.settings, 'use_offline'),
                has_bool(UserConfig.BASE_NAME, user_config.settings, 'auto_hide_right'),
                has_string(UserConfig.BASE_NAME, user_config.settings, 'tba_key'),
                has_string(UserConfig.BASE_NAME, user_config.settings, 'server_key'),
                has_string(UserConfig.BASE_NAME, user_config.settings, 'font_size', UserConfig.VALID_FONT_SIZES)
            )
        }
        if (tests[2] === true)
        {
            tests.push(has_string(UserConfig.BASE_NAME, user_config.state, 'event_id'),
                has_string(UserConfig.BASE_NAME, user_config.state, 'user_id'),
                has_int(UserConfig.BASE_NAME, user_config.state, 'position', [-1, 0, 1, 2, 3, 4, 5]),
                has_string(UserConfig.BASE_NAME, user_config.state, 'theme', UserConfig.VALID_THEMES),
                has_string(UserConfig.BASE_NAME, user_config.state, 'role')
            )
        }

        if (summarize)
        {
            return tests.every(b => b === true)
        }
        else
        {
            return tests
        }
    }

    /**
     * Validates the current user config object.
     * @param {Boolean} summarize Whether a boolean or list of tests should be returned
     * @returns If summarize, a boolean, otherwise a list of trues and failure cases for each test.
     */
    validate(summarize=true)
    {
        return UserConfig.validate(this, summarize)
    }

    /**
     * Returns the object as a JSON string.
     */
    get as_string()
    {
        return JSON.stringify({
            version: this.version,
            settings: this.settings,
            state: this.state
        })
    }

    /**
     * Stores the config into localStorage.
     */
    store_config()
    {
        if (this.loaded)
        {
            localStorage.setItem(this.name, this.as_string)
        }
        else
        {
            console.log('No loaded user config to store')
        }
    }
}

class UserList
{
    BASE_NAME = 'user-list'

    constructor()
    {
        this.loaded = false
        this.name = this.BASE_NAME

        this.users = {}
    }

    /**
     * Load in the user list, first from localStorage, then from server/cache. Triggers handle_config.
     */
    load()
    {
        let user_list = localStorage.getItem(this.name)
        if (user_list === null)
        {
            console.log(`${this.name} does not exist, pulling from server/cache`)
            fetch(`/config/${this.name}.csv`, { cache: "reload" })
                .then(response => {
                    return response.text()
                })
                .then(this.handle_config.bind(this))
                .catch(err => {
                    console.log(`Error fetching ${this.name} config, ${err}`)
                })
        }
        else
        {
            this.handle_config(user_list)
        }
    }

    /**
     * Handles a given user list string, runs validation, and applies contents to class.
     * @param {String} user_list User config as raw object
     */
    handle_config(user_list)
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
        this.loaded = true
    }

    /**
     * Returns the object as a CSV string.
     */
    get as_string()
    {
        // convert users object to a CSV
        let user_list = ''
        for (let key in this.users)
        {
            user_list += `${key},${this.users[key].name},${this.users[key].admin},${this.users[key].position}\n`
        }
        return user_list
    }

    /**
     * Stores the list into localStorage.
     */
    store_config()
    {
        if (this.loaded)
        {
            localStorage.setItem(this.name, this.as_string)
        }
        else
        {
            console.log('No loaded user config to store')
        }
    }
}

class AppConfig
{
    BASE_NAME = 'app-config'

    constructor()
    {
        this.loaded = false
        this.name = this.BASE_NAME

        this.version = null
        this.config = {
            title: null
        }
        this.defaults = {
            event_id: null,
            user_id: null
        }
        this.theme = {}
        this.dark_theme = {}
    }

    /**
     * Load in the app config from server/cache. Triggers handle_config.
     */
    load()
    {
        load_config(this.BASE_NAME, this.handle_config.bind(this))
    }

    /**
     * Handles a given app config object, runs validation, and applies contents to class.
     * @param {Object} app_config App config as raw object
     */
    handle_config(app_config)
    {
        if (AppConfig.validate(app_config))
        {
            this.version = app_config.version
            this.config = app_config.config
            this.defaults = app_config.defaults
            this.theme = app_config.theme
            this.dark_theme = app_config.dark_theme
            this.loaded = true
        }
    }

    /**
     * Validates a given app config object.
     * @param {Object} app_config App config as raw object
     * @param {Boolean} summarize Whether a boolean or list of tests should be returned
     * @returns If summarize, a boolean, otherwise a list of trues and failure cases for each test.
     */
    static validate(app_config, summarize=true)
    {
        let tests = [
            has_string(AppConfig.BASE_NAME, app_config, 'version'),
            has_object(AppConfig.BASE_NAME, app_config, 'config'),
            has_object(AppConfig.BASE_NAME, app_config, 'defaults'),
            has_object(AppConfig.BASE_NAME, app_config, 'theme'),
            has_object(AppConfig.BASE_NAME, app_config, 'dark_theme')
        ]
        if (tests[1] === true)
        {
            tests.push(has_string(AppConfig.BASE_NAME, app_config.config, 'title'))
        }
        if (tests[2] === true)
        {
            tests.push(has_string(AppConfig.BASE_NAME, app_config.defaults, 'event_id'),
                has_int(AppConfig.BASE_NAME, app_config.defaults, 'user_id'))
        }

        if (summarize)
        {
            return tests.every(b => b === true)
        }
        else
        {
            return tests
        }
    }

    /**
     * Validates the current app config object.
     * @param {Boolean} summarize Whether a boolean or list of tests should be returned
     * @returns If summarize, a boolean, otherwise a list of trues and failure cases for each test.
     */
    validate(summarize=true)
    {
        return AppConfig.validate(this, summarize)
    }
}

class GameConfig
{
    BASE_NAME = 'game-config'

    constructor(year)
    {
        this.year = year
        this.loaded = false

        this.version = null
        this.whiteboard = {
            red_color: null,
            red_xs: null,
            red_ys: null,
            blue_color: null,
            blue_xs: null,
            blue_ys: null,
            draw_color: null,
            gp_names: null,
            gp_images: null,
            field_width: null,
            field_height: null,
            magnet_size: null,
            line_width: null,
            horizontal_margin: null,
            vertical_margin: null,
            field_height_ft: null,
            field_height_px: null
        }
    }

    get name() { return `${this.year}-${this.BASE_NAME}` }

    /**
     * Load in the game config, from server/cache. Triggers handle_config.
     */
    load()
    {
        load_config(this.BASE_NAME, this.handle_config.bind(this), this.year)
    }

    /**
     * Handles a given game config object, runs validation, and applies contents to class.
     * @param {Object} game_config Game config as raw object
     */
    handle_config(game_config)
    {
        if (GameConfig.validate(game_config))
        {
            this.version = game_config.version
            this.whiteboard = game_config.whiteboard
            this.loaded = true
        }
    }

    /**
     * Validates a given game config object.
     * @param {Object} game_config Game config as raw object
     * @param {Boolean} summarize Whether a boolean or list of tests should be returned
     * @returns If summarize, a boolean, otherwise a list of trues and failure cases for each test.
     */
    static validate(game_config, summarize=true)
    {
        let tests = [
            has_string(GameConfig.BASE_NAME, game_config, 'version'),
            has_object(GameConfig.BASE_NAME, game_config, 'whiteboard')
        ]
        if (tests[1] === true)
        {
            tests.push(has_string(GameConfig.BASE_NAME, game_config.whiteboard, 'red_color'),
                has_array(GameConfig.BASE_NAME, game_config.whiteboard, 'red_xs', 'number'),
                has_array(GameConfig.BASE_NAME, game_config.whiteboard, 'red_ys', 'number'),
                has_string(GameConfig.BASE_NAME, game_config.whiteboard, 'blue_color'),
                has_array(GameConfig.BASE_NAME, game_config.whiteboard, 'blue_xs', 'number'),
                has_array(GameConfig.BASE_NAME, game_config.whiteboard, 'blue_ys', 'number'),
                has_string(GameConfig.BASE_NAME, game_config.whiteboard, 'draw_color'),
                has_array(GameConfig.BASE_NAME, game_config.whiteboard, 'gp_names', 'string'),
                has_array(GameConfig.BASE_NAME, game_config.whiteboard, 'gp_images', 'string'),
                has_int(GameConfig.BASE_NAME, game_config.whiteboard, 'field_width'),
                has_int(GameConfig.BASE_NAME, game_config.whiteboard, 'field_height'),
                has_int(GameConfig.BASE_NAME, game_config.whiteboard, 'magnet_size'),
                has_int(GameConfig.BASE_NAME, game_config.whiteboard, 'line_width'),
                has_int(GameConfig.BASE_NAME, game_config.whiteboard, 'horizontal_margin'),
                has_int(GameConfig.BASE_NAME, game_config.whiteboard, 'vertical_margin'),
                has_int(GameConfig.BASE_NAME, game_config.whiteboard, 'field_height_ft'),
                has_int(GameConfig.BASE_NAME, game_config.whiteboard, 'field_height_px')
            )
        }

        if (summarize)
        {
            return tests.every(b => b === true)
        }
        else
        {
            return tests
        }
    }

    /**
     * Validates the current game config object.
     * @param {Boolean} summarize Whether a boolean or list of tests should be returned
     * @returns If summarize, a boolean, otherwise a list of trues and failure cases for each test.
     */
    validate(summarize=true)
    {
        return GameConfig.validate(this, summarize)
    }
}

class AnalysisConfig
{
    BASE_NAME = 'analysis-config'

    constructor(year)
    {
        this.year = year
        this.loaded = false

        this.version = null
        this.fms_breakdown_results = []
        this.fms_ranking_results = []
        this.smart_results = []
        this.coach = []
        this.favorites = []
    }

    get name() { return `${this.year}-${this.BASE_NAME}` }

    /**
     * Load in the analysis config, first from localStorage, then from server/cache. Triggers handle_config.
     */
    load()
    {
        let analysis_config = localStorage.getItem(this.name)
        if (analysis_config !== null)
        {
            this.handle_config(JSON.parse(analysis_config))
            if (this.loaded)
            {
                return
            }
        }

        console.log(`${this.name} does not exist, pulling from server/cache`)
        load_config(this.BASE_NAME, this.handle_config.bind(this), this.year)
    }

    /**
     * Handles a given analysis config object, runs validation, and applies contents to class.
     * @param {Object} analysis_config Analysis config as raw object
     */
    handle_config(analysis_config)
    {
        if (AnalysisConfig.validate(analysis_config))
        {
            this.version = analysis_config.version
            this.fms_breakdown_results = analysis_config.fms_breakdown_results.map(s => Result.from_object(s)[0])
            this.fms_ranking_results = analysis_config.fms_ranking_results.map(s => Result.from_object(s)[0])
            this.smart_results = analysis_config.smart_results.map(s => Result.from_object(s)[0])
            this.coach = analysis_config.coach
            this.favorites = analysis_config.favorites
            this.loaded = true
        }
    }

    /**
     * Validates a given analysis config object.
     * @param {Object} analysis_config Analysis config as raw object
     * @param {Boolean} summarize Whether a boolean or list of tests should be returned
     * @returns If summarize, a boolean, otherwise a list of trues and failure cases for each test.
     */
    static validate(analysis_config, summarize=true)
    {
        let tests = [
            has_string(AnalysisConfig.BASE_NAME, analysis_config, 'version'),
            has_array(AnalysisConfig.BASE_NAME, analysis_config, 'fms_breakdown_results', 'object'),
            has_array(AnalysisConfig.BASE_NAME, analysis_config, 'fms_ranking_results', 'object'),
            has_array(AnalysisConfig.BASE_NAME, analysis_config, 'smart_results', 'object'),
            has_array(AnalysisConfig.BASE_NAME, analysis_config, 'coach', 'object'),
            has_array(AnalysisConfig.BASE_NAME, analysis_config, 'favorites', 'string')
        ]
        if (tests[1] === true)
        {
            tests.push(...analysis_config.coach.map(s => AnalysisConfig.validate_coach(s, false)).flat())
        }
        if (tests[2] === true)
        {
            tests.push(...analysis_config.fms_breakdown_results.map(s => Result.validate(s, 'fms', false)).flat())
        }
        if (tests[3] === true)
        {
            tests.push(...analysis_config.fms_ranking_results.map(s => Result.validate(s, 'fms', false)).flat())
        }
        if (tests[4] === true)
        {
            tests.push(...analysis_config.smart_results.map(s => Result.validate(s, 'smart', false)).flat())
        }

        if (summarize)
        {
            return tests.every(b => b === true)
        }
        else
        {
            return tests
        }
    }

    /**
     * Validates the current analysis config object.
     * @param {Boolean} summarize Whether a boolean or list of tests should be returned
     * @returns If summarize, a boolean, otherwise a list of trues and failure cases for each test.
     */
    validate(summarize=true)
    {
        return AnalysisConfig.validate(this, summarize)
    }

    /**
     * Returns the object as a JSON string.
     */
    get as_string()
    {
        return JSON.stringify({
            version: this.version,
            fms_breakdown_results: this.fms_breakdown_results,
            fms_ranking_results: this.fms_ranking_results,
            smart_results: this.smart_results,
            coach: this.coach,
            favorites: this.favorites
        })
    }

    /**
     * Stores the config into localStorage.
     */
    store_config()
    {
        if (this.loaded)
        {
            localStorage.setItem(this.name, this.as_string)
        }
        else
        {
            console.log('No loaded analysis config to store')
        }
    }

    /**
     * Validates a given coach stat config.
     * @param {Object} obj A single coach stat config
     * @param {Boolean} summarize Whether a boolean or list of tests should be returned
     * @returns If summarize, a boolean, otherwise a list of trues and failure cases for each test.
     */
    static validate_coach(obj, summarize=true)
    {
        let funcs = ['mean', 'median', 'mode', 'min', 'max', 'total', 'stddev']
        let tests = [has_string('coach', obj, 'function', funcs), has_string('coach', obj, 'key')]
        if (summarize)
        {
            return tests.every(b => b === true)
        }
        else
        {
            return tests
        }
    }
}

class ScoutConfig
{
    BASE_NAME = 'scout-config'

    constructor(year)
    {
        this.year = year
        this.loaded = false

        this.version = null
        this.configs = []

        this.team_results = []
        this.match_results = []
    }

    get name() { return `${this.year}-${this.BASE_NAME}` }

    /**
     * Load in the scout config, first from localStorage, then from server/cache. Triggers handle_config.
     */
    load()
    {
        let user_config = localStorage.getItem(this.name)
        if (user_config !== null)
        {
            this.handle_config(JSON.parse(user_config))
            if (this.loaded)
            {
                return
            }
        }

        console.log(`${this.name} does not exist, pulling from server/cache`)
        load_config(this.BASE_NAME, this.handle_config.bind(this), this.year)
    }

    /**
     * Handles a given scout config object, runs validation, and applies contents to class.
     * @param {Object} scout_config Scout config as raw object
     */
    handle_config(user_config)
    {
        if (ScoutConfig.validate(user_config))
        {
            this.version = user_config.version
            this.configs = user_config.configs
            this.team_results = [].concat(...user_config.configs.filter(m => m.type === 'team').map(m => ScoutConfig.build_results(m)))
            this.match_results = [].concat(...user_config.configs.filter(m => m.type.startsWith('match')).map(m => ScoutConfig.build_results(m)))
            this.loaded = true
        }
    }

    /**
     * Validates a given scout config object.
     * @param {Object} scout_config Scout config as raw object
     * @param {Boolean} summarize Whether a boolean or list of tests should be returned
     * @returns If summarize, a boolean, otherwise a list of trues and failure cases for each test.
     */
    static validate(user_config, summarize=true)
    {
        let tests = [
            has_string(ScoutConfig.BASE_NAME, user_config, 'version'),
            has_array(ScoutConfig.BASE_NAME, user_config, 'configs', 'object')
        ]
        if (tests[1] === true)
        {
            tests.push(...user_config.configs.map(m => ScoutConfig.validate_mode(m, false)).flat(2))
        }

        if (summarize)
        {
            return tests.every(b => b === true)
        }
        else
        {
            return tests
        }
    }

    /**
     * Validates the current analysis config object.
     * @param {Boolean} summarize Whether a boolean or list of tests should be returned
     * @returns If summarize, a boolean, otherwise a list of trues and failure cases for each test.
     */
    validate(summarize=true)
    {
        return ScoutConfig.validate(this, summarize)
    }

    /**
     * Returns the object as a JSON string.
     */
    get as_string()
    {
        return JSON.stringify({
            version: this.version,
            configs: this.configs
        })
    }

    /**
     * Stores the config into localStorage.
     */
    store_config()
    {
        if (this.loaded)
        {
            localStorage.setItem(this.name, this.as_string)
        }
        else
        {
            console.log('No loaded scout config to store')
        }
    }

    /**
     * Validates a given scout mode config.
     * @param {Object} obj A single scout mode config
     * @param {Boolean} summarize Whether a boolean or list of tests should be returned
     * @returns If summarize, a boolean, otherwise a list of trues and failure cases for each test.
     */
    static validate_mode(obj, summarize=true)
    {
        let tag = obj.hasOwnProperty('id') ? obj.id : 'scout mode'
        let tests = [
            has_string(tag, obj, 'id'),
            has_string(tag, obj, 'name'),
            has_string(tag, obj, 'type', ['team', 'match-team', 'match-alliance', 'match']),
            has_array(tag, obj, 'pages', 'object')
        ]

        let ids = []
        if (obj.hasOwnProperty('id'))
        {
            ids.push(obj.id)
        }
        if (obj.hasOwnProperty('pages'))
        {
            tests.push(obj.pages.length > 0 ? true : `No pages found for ${tag}`)
            for (let page of obj.pages)
            {
                tag = page.hasOwnProperty('id') ? page.id : tag
                tests.push(has_string(tag, page, 'id'),
                    has_string(tag, page, 'name'),
                    has_array(tag, page, 'columns', 'object'))

                if (page.hasOwnProperty('id'))
                {
                    tests.push(ids.includes(page.id) ? `Repeat ID ${page.id}` : true)
                    ids.push(page.id)
                }
                if (page.hasOwnProperty('columns'))
                {
                    tests.push(page.columns.length > 0 ? true : `No columns found for ${tag}`)
                    for (let column of page.columns)
                    {
                        tag = column.hasOwnProperty('id') ? column.id : tag
                        tests.push(has_string(tag, column, 'id'),
                            has_string(tag, column, 'name'),
                            has_bool(tag, column, 'cycle'),
                            has_array(tag, column, 'inputs', 'object'))

                        if (column.hasOwnProperty('id'))
                        {
                            tests.push(ids.includes(column.id) ? `Repeat ID ${column.id}` : true)
                            ids.push(column.id)
                        }
                        if (column.hasOwnProperty('pages'))
                        {
                            tests.push(column.inputs.length > 0 ? true : `No inputs found for ${tag}`)
                            for (let input of column.inputs)
                            {
                                tests.push(Result.validate(input, 'input', false))
                                if (input.hasOwnProperty('id'))
                                {
                                    tests.push(ids.includes(input.id) ? `Repeat ID ${input.id}` : true)
                                    ids.push(input.id)
                                }
                            }
                        }
                    }
                }
            }
        }

        if (summarize)
        {
            return tests.every(b => b === true)
        }
        else
        {
            return tests
        }
    }

    static build_results(obj)
    {
        let inputs = []
        for (let page of obj.pages)
        {
            for (let column of page.columns)
            {
                if (column.cycle)
                {
                    column.type = 'cycle'
                    inputs.push(...Result.from_object(column))
                }
                else
                {
                    for (let input of column.inputs)
                    {
                        inputs.push(...Result.from_object(input))
                    }
                }
            }
        }

        return inputs
    }
}

class Result
{
    VALID_INPUTS = ['checkbox', 'counter', 'dropdown', 'multicounter', 'multiselect', 'number', 'select', 'slider', 'string',
        'text', 'timer']
    VALID_FMS = ['filter', 'map', 'math', 'max', 'min', 'where', 'wrank']
    VALID_SMARTS = ['boolean', 'int', 'state', 'yes_no']

    /**
     * Validates a given result config object.
     * @param {Object} obj Scouting input, FMS result, or smart result raw config object.
     * @param {Boolean} summarize Whether a boolean or list of tests should be returned
     * @returns If summarize, a boolean, otherwise a list of trues and failure cases for each test.
     */
    static validate(obj, result_type, summarize=true)
    {
        let tag = obj.hasOwnProperty('id') ? obj.id : 'input'
        let tests = [
            has_string(tag, obj, 'id'),
            has_string(tag, obj, 'name')
        ]

        // validate type based on type of result
        if (result_type === 'input')
        {
            tests.push(has_string(tag, obj, 'type', Result.VALID_INPUTS))
        }
        else if (result_type === 'fms')
        {
            tests.push(has_string(tag, obj, 'type', Result.VALID_FMS))
        }
        else if (result_type === 'smart')
        {
            tests.push(has_string(tag, obj, 'type', Result.VALID_SMARTS))
        }

        if (tests[2] === true)
        {
            switch(obj.type)
            {
                case 'checkbox':
                    tests.push(has_bool(tag, obj, 'default'),
                        has_bool(tag, obj, 'disallow_default'))
                case 'boolean':
                case 'yes_no':
                    tests.push(has_bool(tag, obj, 'negative'))
                    break

                case 'counter':
                case 'number':
                case 'slider':
                    tests.push(has_int(tag, obj, 'default'),
                        has_bool(tag, obj, 'disallow_default'),
                        has_array(tag, obj, 'options', 'number'))
                case 'int':
                    tests.push(has_bool(tag, obj, 'negative'))
                    break

                case 'filter':
                    tests.push(has_string(tag, obj, 'result'),
                        has_string(tag, obj, 'filter'),
                        has_int(tag, obj, 'compare_type', [0, 1, 2, 3, 4, 5]),
                        obj.hasOwnProperty('value'),
                        has_bool(tag, obj, 'negative'))
                    break

                case 'map':
                    tests.push(has_string(tag, obj, 'result'),
                        has_array(tag, obj, 'values', 'number'),
                        has_bool(tag, obj, 'negative'))
                    break

                case 'math':
                    tests.push(has_string(tag, obj, 'math'),
                        has_bool(tag, obj, 'negative'))
                    break

                case 'max':
                case 'min':
                    tests.push(has_array(tag, obj, 'results', 'string'))
                    break

                case 'multicounter':
                    tests.push(has_array(tag, obj, 'options', 'string'),
                        has_array(tag, obj, 'negative', 'boolean'),
                        has_int(tag, obj, 'default'),
                        has_bool(tag, obj, 'disallow_default'))
                    break

                case 'multiselect':
                    let ms_has_vertical = has_bool(tag, obj, 'vertical')
                    if (!obj.hasOwnProperty('vertical'))
                    {
                        obj.vertical = false
                        ms_has_vertical = true
                    }
                    tests.push(has_array(tag, obj, 'options', 'string'),
                        has_array(tag, obj, 'default', 'boolean'),
                        has_bool(tag, obj, 'disallow_default'),
                        ms_has_vertical)
                    break

                case 'select':
                    let has_images = has_array(tag, obj, 'images', 'string')
                    if (!obj.hasOwnProperty('images'))
                    {
                        obj.images = []
                        has_images = true
                    }
                    let has_colors = has_array(tag, obj, 'colors', 'string')
                    if (!obj.hasOwnProperty('colors'))
                    {
                        obj.colors = []
                        has_colors = true
                    }
                    let has_vertical = has_bool(tag, obj, 'vertical')
                    if (!obj.hasOwnProperty('vertical'))
                    {
                        obj.vertical = false
                        has_vertical = true
                    }
                    tests.push(has_images, has_colors, has_vertical)
                    break
                case 'dropdown':
                    tests.push(has_string(tag, obj, 'default'),
                        has_bool(tag, obj, 'disallow_default'))
                case 'state':
                    tests.push(has_array(tag, obj, 'options', 'string'))
                    break

                case 'string':
                case 'text':
                    tests.push(has_string(tag, obj, 'default'),
                        has_bool(tag, obj, 'disallow_default'))
                    break

                case 'timer':
                    tests.push(has_bool(tag, obj, 'disallow_default'))
                    break

                case 'where':
                    tests.push(has_string(tag, obj, 'cycle'),
                        has_array(tag, obj, 'conditions', 'object'))
                    break

                case 'wrank':
                    tests.push(has_string(tag, obj, 'result'),
                        has_bool(tag, obj, 'negative'))
                    break
            }
        }

        if (summarize)
        {
            return tests.every(b => b === true)
        }
        else
        {
            return tests
        }
    }

    /**
     * Validates the current result config object.
     * @param {Boolean} summarize Whether a boolean or list of tests should be returned
     * @returns If summarize, a boolean, otherwise a list of trues and failure cases for each test.
     */
    validate(summarize=true)
    {
        return Result.validate(this, summarize)
    }

    /**
     * Creates a new instance of result (or multiple if a multi-input) based on the given config object.
     * @param {Object} obj Scouting input, FMS result, or smart result raw config object.
     * @returns A new instance of Result populated by the given objects attributes.
     */
    static from_object(obj)
    {
        if (obj.type.startsWith('multi'))
        {
            return obj.options.map(op => {
                let instance = Object.assign(new Result(), {
                    id: `${obj.id}_${create_id_from_name(op)}`,
                    name: `${obj.name} ${op}`,
                    default: obj.default,
                    disallow_default: obj.disallow_default
                })
                if (obj.type === 'multicounter')
                {
                    instance.type = 'counter'
                    instance.options = []
                    instance.negative = obj.negative[obj.options.indexOf(op)]
                }
                else if (obj.type === 'multiselect')
                {
                    instance.type = 'checkbox'
                }
                return instance
            })
        }
        else
        {
            return [Object.assign(new Result(), obj)]
        }
    }

    /**
     * Determines whether a result is a result, fms, or smart result based on its type.
     */
    get kind()
    {
        if (['checkbox', 'cycle', 'counter', 'dropdown', 'number', 'select', 'slider', 'string', 'text', 'timer'].includes(this.type))
        {
            return 'result'
        }
        else if (['boolean', 'int', 'state', 'yes_no'].includes(this.type))
        {
            return 'fms'
        }
        else if (['filter', 'map', 'math', 'max', 'min', 'where', 'wrank'].includes(this.type))
        {
            return 'smart'
        }
        return 'unknown'
    }

    /**
     * Returns an array of available statistical measures available for the given result.
     */
    get available_stats()
    {
        if (['boolean', 'checkbox', 'counter', 'filter', 'int', 'map', 'math', 'number',
            'slider', 'timer', 'where', 'wrank', 'yes_no'].includes(this.type))
        {
            return ['max', 'mean', 'median', 'mid', 'min', 'mode', 'stddev', 'sum']
        }
        else if (['dropdown', 'max', 'min', 'select', 'state'])
        {
            return ['count', 'mode']
        }
        else
        {
            return []
        }
    }

    /**
     * Computes a stat from a given set of results.
     */
    compute_stat(results, stat='')
    {
        if (results.length === 0)
        {
            return null
        }

        switch(this.type)
        {
            case 'yes_no':
            case 'boolean':
            case 'checkbox':
                results = results.map(r => r ? 1 : 0)
            case 'counter':
            case 'filter':
            case 'int':
            case 'map':
            case 'math':
            case 'number':
            case 'slider':
            case 'timer':
            case 'where':
            case 'wrank':
                if (!stat)
                {
                    stat = 'mean'
                }
                switch (stat)
                {
                    case 'max':
                        return Math.max(...results)
                    case 'mean':
                        return results.reduce((sum, v) => sum + v) / results.length
                    case 'median':
                        let sorted = results.sort()
                        if (sorted.length % 2 === 0)
                        {
                            const mid = sorted.length / 2
                            return (sorted[mid] + sorted[mid - 1]) / 2
                        }
                        else
                        {
                            return sorted[Math.floor(sorted.length / 2)]
                        }
                    case 'mid':
                        return (Math.min(...results) + Math.max(...results)) / 2
                    case 'min':
                        return Math.min(...results)
                    case 'mode':
                        let max = results[0]
                        let counts = {}
                        for (let val of results)
                        {
                            if (!Object.keys(counts).includes(val.toString()))
                            {
                                counts[val] = 0
                            }
                            if (++counts[val] > counts[max])
                            {
                                max = val
                            }
                        }
                        return max
                    case 'stddev':
                        if (results.length == 0)
                        {
                            return 0
                        }
                        let mean = results.reduce((sum, v) => sum + v) / results.length
                        return Math.sqrt(results.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / results.length)
                    case 'sum':
                        return results.reduce((sum, v) => sum + v)
                    default:
                        console.log(`Unrecognized mode ${stat}, returning null`)
                }

            case 'cycle':
            case 'string':
            case 'text':
                return '---'

            case 'dropdown':
            case 'select':
            case 'max':
            case 'min':
            case 'state':
                let max = results[0]
                let counts = {}
                for (let val of results)
                {
                    if (!Object.keys(counts).includes(val))
                    {
                        counts[val] = 0
                    }
                    if (++counts[val] > counts[max])
                    {
                        max = val
                    }
                }
                if (!stat || stat === 'mode')
                {
                    return max
                }
                else if (stat === 'count')
                {
                    let options = ['min', 'max'].includes(this.type) ? this.results : this.options
                    return options.sort((a, b) => {
                        let a_count = a in counts ? counts[a] : 0
                        let b_count = b in counts ? counts[a] : 0
                        return b_count - a_count
                    }).map(op => `${op}: ${op in counts ? counts[op] : 0}`).join('\n')
                }
                else
                {
                    console.log(`Unrecognized mode ${stat}, returning null`)
                }
        }
        return null
    }

    /**
     * Computes the current smart result based on the given result, or all results if no result is given.
     * @param {BaseResult} result Match or team result or null
     * @returns The smart result value.
     */
    compute_smart_result(result, teams='all')
    {
        teams = parse_team_list(teams)

        const get_value = (key) => {
            return result !== null ? result.get_value(key) : dal.compute_stat(key, teams)
        }
        switch(this.type)
        {
            case 'filter':
                let filter_val = get_value(this.filter)
                if (filter_val !== null)
                {
                    let passes = false
                    switch (this.compare_type)
                    {
                        case 0:
                            passes = filter_val > this.value
                            break
                        case 1:
                            passes = filter_val >= this.value
                            break
                        case 2:
                            passes = filter_val === this.value
                            break
                        case 3:
                            passes = filter_val !== this.value
                            break
                        case 4:
                            passes = filter_val <= this.value
                            break
                        case 5:
                            passes = filter_val < this.value
                            break
                    }
                    if (passes)
                    {
                        return get_value(this.result)
                    }
                }
                break

            case 'map':
                let map_val = get_value(this.result)
                if (map_val !== null)
                {
                    let result = cfg.get_result_from_key(this.result)
                    let value_type = result.value_type
                    if (value_type === 'str-option')
                    {
                        return this.values[result.options.indexOf(map_val)]
                    }
                    else if (value_type === 'boolean')
                    {
                        return this.values[map_val ? 0 : 1]
                    }
                    else if (value_type === 'int-option')
                    {
                        return this.values[map_val]
                    }
                }
                break

            case 'math':
                let math_fn = this.math
                let team_keys = cfg.get_team_keys()
                let match_keys = cfg.get_match_keys()
                let keys = math_fn.match(/(result|fms|smart)\.[a-zA-Z0-9_]+/g)
                if (keys)
                {
                    for (let k of keys)
                    {
                        if (match_keys.includes(k))
                        {
                            let val = get_value(k)
                            if (val === null)
                            {
                                return null
                            }
                            math_fn = math_fn.replace(k, val)
                        }
                        else if (team_keys.includes(k))
                        {
                            let val = result !== null ? dal.compute_stat(k, result.team_num) : dal.compute_stat(k, teams)
                            if (val === null)
                            {
                                return null
                            }
                            math_fn = math_fn.replace(k, val)
                        }
                    }
                }
                if (math_fn.trim().length === 0)
                {
                    return null
                }
                try
                {
                    let res = eval(math_fn)
                    return res
                }
                catch (err)
                {
                    return null
                }

            case 'max':
            case 'min':
                let m_values = this.results.map(s => get_value(s))
                let extreme = this.type === 'max' ? Math.max(...m_values) : Math.min(...m_values)
                let extreme_id = this.results[m_values.indexOf(extreme)]
                if (extreme_id)
                {
                    return cfg.get_result_from_key(extreme_id).name
                }
                break

            case 'where':
                let count = 0
                let denominator = 0
                let calc_percent = typeof this.denominator !== 'undefined'
                let count_result = typeof this.result === 'undefined' || !this.result
                let cycles = get_value(this.cycle)
                if (cycles !== null)
                {
                    for (let cycle of cycles)
                    {
                        if (typeof cycle === 'undefined')
                        {
                            break
                        }
    
                        let passed = true
                        for (let key of Object.keys(this.conditions))
                        {
                            if (cycle.hasOwnProperty(key))
                            {
                                if (cycle[key] !== this.conditions[key])
                                {
                                    passed = false
                                }
                            }
                        }
                        if (passed)
                        {
                            if (count_result)
                            {
                                count++
                            }
                            else if (cycle.hasOwnProperty(this.result))
                            {
                                count += cycle[this.result]
                            }
                            if (calc_percent && cycle.hasOwnProperty(this.denominator))
                            {
                                denominator += cycle[this.denominator]
                            }
                        }
                    }

                    // store smart result
                    if (calc_percent)
                    {
                        let percent = count / (count + denominator)
                        if (isNaN(percent))
                        {
                            return 0
                        }
                        return percent
                    }
                    else
                    {
                        return count
                    }
                }
                break

            case 'wrank':
                /**
                 * This result is a special case, but I am building it to be as flexible as possible.
                 * To calculate Thee WildRank we first need to compute a ranking offset for each match.
                 * That is the average partner ranking minus the expected partner ranking.
                 * Then we add that difference to the team's ranking for the current match to get the weight rank.
                 * When these rated ranks are averaged we get the WildRank.
                 * Technically this smart result mode can be used with any numeric result, however,
                 * if that result isn't a number 1 -> alliance_size it will likely produce meaningless values.
                 */
                let partners = []
                let red_teams = dal.matches[result.match_key].red_alliance
                let blue_teams = dal.matches[result.match_key].blue_alliance
                if (red_teams.includes(result.team_num))
                {
                    partners = red_teams.filter(t => t != result.team_num)
                }
                else
                {
                    partners = blue_teams.filter(t => t != result.team_num)
                }

                // sum each partner's event average
                let total_partner_rank = 0
                for (let team_num of partners)
                {
                    total_partner_rank += dal.compute_stat(stat.result, team_num, 'mean')
                }

                // calculate the weighted result
                let num_partners = 2
                let expected_partner_rank = (num_partners / 2 + 1) * num_partners
                let partner_weight = total_partner_rank - expected_partner_rank
                let match_rank = get_value(this.result)
                if (match_rank !== null)
                {
                    return match_rank + partner_weight
                }
                break

        }
        return null
    }

    /**
     * Cleans a given value based on the result type to make it more human readable.
     */
    clean_value(value)
    {
        switch(this.value_type)
        {
            case 'boolean':
                return value ? 'Yes' : 'No'

            case 'int-option':
                return this.options[value]

            case 'number':
                return value.toFixed(2)

            case 'object':
            case 'string':
            case 'str-option':
                return value
        }
        return value
    }

    /**
     * Determines the corresponding data type to the current type.
     */
    get value_type()
    {
        if (['yes_no', 'boolean', 'checkbox'].includes(this.type))
        {
            return 'boolean'
        }
        else if (['counter', 'filter', 'int', 'map', 'math', 'number', 'slider', 'timer', 'where', 'wrank'].includes(this.type))
        {
            return 'number'
        }
        else if (['string', 'text'].includes(this.type))
        {
            return 'string'
        }
        else if (['dropdown', 'select'].includes(this.type))
        {
            return 'int-option'
        }
        else if (['max', 'min', 'state'].includes(this.type))
        {
            return 'str-option'
        }
        else if (this.type === 'cycle')
        {
            return 'object'
        }
        return ''
    }

    /**
     * Creates a full ID using both the kind and the ID.
     */
    get full_id()
    {
        return `${this.kind}.${this.id}`
    }

    /**
     * Determines if the result is a smart result using only team results.
     */
    get is_team_smart_result()
    {
        const team_keys = cfg.scout.team_results.map(s => s.full_id)
        const smart_result_keys = cfg.analysis.smart_results.map(s => s.full_id)
        const is_team_smart_result = key => team_keys.includes(key) || (smart_result_keys.includes(key) && cfg.get_result_from_key(key).is_team_smart_result)
        switch(this.type)
        {
            case 'map':
            case 'wrank':
                return is_team_smart_result(this.result)
            case 'math':
                let keys = this.math.match(/[a-z]+\.[a-z0-9_]+/g)
                keys = keys === null ? [] : keys
                return keys.every(s => is_team_smart_result(s))
            case 'max':
            case 'min':
                return this.results.every(s => is_team_smart_result(s))
            case 'where':
                return team_keys.includes(this.cycle)
        }
        return false
    }

    /**
     * Whether the given smart result type needs to be recomputed when calculating a stat across matches.
     */
    get recompute()
    {
        return ['math', 'max', 'min', 'where'].includes(this.type)
    }
}

class Config
{
    constructor()
    {
        this._app_version = ''
        this._on_app_version = () => {}

        this.app = new AppConfig()
        this.user = new UserConfig()
        this.user_list = new UserList()

        this.scout = new ScoutConfig()
        this.analysis = new AnalysisConfig()
        this.game = new GameConfig()
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
        let theme_name = this.user.state.theme.toLowerCase()
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
            return this.app.dark_theme
        }
        else
        {
            return this.app.theme
        }
    }

    /**
     * Returns the current TBA key. If one is not configured, helps the user get one.
     */
    get tba_key()
    {
        if (this.user.settings && this.user.settings.tba_key)
        {
            return this.user.settings.tba_key
        }
        else
        {
            if (confirm('No API key found for TBA! Do you want to open TBA?'))
            {
                window_open('https://www.thebluealliance.com/account#submissions-accepted-count-row', true)
                let key = prompt('Enter your TBA key:')
                if (key)
                {
                    this.user.settings.tba_key = key
                    this.user.store_config()
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
            return this.app.config.title
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
     * A list of match scouting mode IDs.
     */
    get match_scouting_modes()
    {
        if (this.scout.configs)
        {
            return this.scout.configs.filter(m => m.type.startsWith('match')).map(m => m.id)
        }
        return []
    }

    /**
     * A list of team scouting mode IDs.
     */
    get team_scouting_modes()
    {
        if (this.scout.configs)
        {
            return this.scout.configs.filter(m => m.type.startsWith('team')).map(m => m.id)
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
        console.log(`Unable to find scouting mode ${mode}`)
        return {}
    }

    /**
     * Fetches the Result for the given key.
     * @param {String} key Full key/ID of the desired result.
     * @returns Result object corresponding to the key.
     */
    get_result_from_key(key)
    {
        let level = key.substring(0, key.indexOf('.'))
        let sub_key = key.substring(level.length + 1)
        switch (level)
        {
            case 'result':
                for (let result of this.scout.match_results)
                {
                    if (result.id === sub_key)
                    {
                        return result
                    }
                }
                for (let result of this.scout.team_results)
                {
                    if (result.id === sub_key)
                    {
                        return result
                    }
                }
                break
            case 'fms':
                for (let result of this.analysis.fms_breakdown_results)
                {
                    if (result.id === sub_key)
                    {
                        return result
                    }
                }
                for (let result of this.analysis.fms_ranking_results)
                {
                    if (result.id === sub_key)
                    {
                        return result
                    }
                }
                break
            case 'smart':
                for (let result of this.analysis.smart_results)
                {
                    if (result.id === sub_key)
                    {
                        return result
                    }
                }
                break
            default:
                console.log(`Unrecognized result type, ${level}`)
        }
        return null
    }

    /**
     * Gets an array of all match keys.
     * @param {Boolean} results Whether to get result keys.
     * @param {Boolean} fms Whether to get FMS keys.
     * @param {Boolean} smart Whether to get smart result keys.
     * @returns An array of keys.
     */
    get_match_keys(results=true, fms=true, smart=true)
    {
        let keys = []
        if (results)
        {
            keys.push(...this.scout.match_results.map(s => s.full_id))
        }
        if (fms)
        {
            keys.push(...this.analysis.fms_breakdown_results.map(s => s.full_id))
        }
        if (smart)
        {
            keys.push(...this.analysis.smart_results.filter(s => !s.is_team_smart_result).map(s => s.full_id))
        }
        return keys
    }

    /**
     * Gets an array of all team keys.
     * @param {Boolean} results Whether to get result keys.
     * @param {Boolean} fms Whether to get FMS keys.
     * @param {Boolean} smart Whether to get smart result keys.
     * @returns An array of keys.
     */
    get_team_keys(results=true, fms=true, smart=true)
    {
        let keys = []
        if (results)
        {
            keys.push(...this.scout.team_results.map(s => s.full_id))
        }
        if (fms)
        {
            keys.push(...this.analysis.fms_ranking_results.map(s => s.full_id))
        }
        if (smart)
        {
            keys.push(...this.analysis.smart_results.filter(s => s.is_team_smart_result).map(s => s.full_id))
        }
        return keys
    }

    /**
     * Gets an array of all keys.
     * @param {Boolean} results Whether to get result keys.
     * @param {Boolean} fms Whether to get FMS keys.
     * @param {Boolean} smart Whether to get smart result keys.
     * @returns An array of keys.
     */
    get_keys(results=true, fms=true, smart=true)
    {
        return this.get_team_keys(results, fms, smart).concat(this.get_match_keys(results, fms, smart))
    }

    /**
     * Filters a given Array of keys by the given allowed value types.
     * @param {Array} keys Array of keys
     * @param {Array} allowed_values Array of allowed value types
     * @returns Filtered version of keys
     */
    filter_keys(keys, allowed_values)
    {
        return keys.filter(k => allowed_values.includes(this.get_result_from_key(k).value_type))
    }

    /**
     * Converts a list of keys to a list of Result names.
     * @param {Array} keys Array of keys
     * @returns Array of names
     */
    get_names(keys)
    {
        return keys.map(k => cfg.get_result_from_key(k).name)
    }

    //
    // User Functions
    //

    /**
     * Fetches the user list from UserList
     */
    get users()
    {
        return this.user_list.users
    }

    /**
     * Finds the name of a user from their ID number.
     * 
     * @param {String} user_id User ID number
     * @returns The name of the requested user or "Unknown User".
     */
    get_name(user_id='', id_fallback=false)
    {
        if (!user_id)
        {
            user_id = this.user.state.user_id
        }
        if (typeof user_id !== 'string')
        {
            user_id = user_id.toString()
        }

        if (Object.keys(this.users).includes(user_id))
        {
            return this.users[user_id].name
        }
        else if (id_fallback)
        {
            return user_id
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
     * Sets the role and stores the config.
     */
    set_role(role)
    {
        this.user.state.role = role
        this.user.store_config()
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
        this.user.store_config()

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
        this.user.store_config()
        this.scout.store_config()
        this.analysis.store_config()
        this.user_list.store_config()
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
    load_configs(on_complete=() => {})
    {
        this.app.load()
        this.user.load()
        this.user_list.load()

        new Promise((resolve, reject) => {
            const start = performance.now()
            const loop = () => {
                if (this.app.loaded && this.user.loaded && this.user_list.loaded)
                {
                    resolve()
                }
                else if (performance.now() > start + 1000)
                {
                    reject()
                }
                else
                {
                    setTimeout(loop, 10)
                }
            }
            loop()
        }).then(() => {
            this.user.store_config()
            this.user_list.store_config()

            if (this.year)
            {
                console.log(`base configs loaded, requesting ${this.year} game configs`)
                this.load_game_configs(on_complete)
            }
            else
            {
                console.log(`base configs loaded, no year, skipping game configs`)
                on_complete()
            }
        }, () => {
            console.log('timeout loading base configs')
            on_complete()
        })
    }

    /**
     * Triggers configuration loading sequence for only the game configs.
     * 
     * @param {Function} on_complete Function to call when loading is complete.
     */
    load_game_configs(on_complete=() => {})
    {
        this.scout.year = this.year
        this.scout.load()

        this.analysis.year = this.year
        this.analysis.load()

        this.game.year = this.year
        this.game.load()

        new Promise((resolve, reject) => {
            const start = performance.now()
            const loop = () => {
                if (this.scout.loaded && this.analysis.loaded && this.game.loaded)
                {
                    resolve()
                }
                else if (performance.now() > start + 1000)
                {
                    reject()
                }
                else
                {
                    setTimeout(loop, 10)
                }
            }
            loop()
        }).then(() => {
            this.scout.store_config()
            this.analysis.store_config()

            console.log('game configs loaded, loading complete')
            on_complete()
        }, () => {
            console.log('timeout loading game configs')
            on_complete()
        })
    }

    /**
     * Validates a given Config object and all its configs.
     * @param {Object} obj Config object
     * @param {Boolean} summarize Whether a boolean or list of tests should be returned
     * @returns If summarize, a boolean, otherwise a list of trues and failure cases for each test.
     */
    static validate(obj, summarize=true)
    {
        let tests = []
        for (let c of [obj.app, obj.user, obj.game, obj.scout, obj.analysis])
        {
            tests.push(c.loaded ? true : `${c.name} has not been loaded`)
            if (c.loaded)
            {
                let t = c.validate(false)
                tests.push(...t)
            }
        }

        if (summarize)
        {
            return tests.every(b => b === true)
        }
        else
        {
            return tests
        }
    }

    /**
     * Validates the current Config object and all its configs.
     * @param {Boolean} summarize Whether a boolean or list of tests should be returned
     * @returns If summarize, a boolean, otherwise a list of trues and failure cases for each test.
     */
    validate(summarize=true)
    {
        return Config.validate(this, summarize)
    }
}