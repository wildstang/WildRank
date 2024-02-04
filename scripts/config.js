/**
 * file:        config.js
 * description: Contains config object for importing and accessing config files.
 * author:      Liam Fruzyna
 * date:        2022-05-01
 */

class Config
{
    constructor(year='')
    {
        this.year = year

        // build empty settings data structures
        this.keys = {}
        this.defaults = {}
        this.theme = {}
        this.dark_theme = {}
        this.users = {}
        this.settings = {}

        // build empty game data structures
        for (let mode of MODES)
        {
            // pit, match, note
            this[mode] = []
        }
        this.smart_stats = []
        this.coach = []
        this.whiteboard = []
        this.version = 'none'
    }

    /**
     * function:    load_configs
     * parameters:  fetch configs on failure
     * returns:     none
     * description: Loads configs in from localStorage.
     */
    load_configs(fetch_on_fail=0, on_load='')
    {
        // load in settings configs
        this.keys = this.load_config('keys')
        this.defaults = this.load_config('defaults')
        this.theme = this.load_config('theme')
        this.dark_theme = this.load_config('dark-theme')
        this.users = this.load_config('users')
        this.settings = this.load_config('settings')

        // if any failed to load re-fetch them
        if (fetch_on_fail < 1 && (this.keys === false || this.defaults === false || this.theme === false ||
            this.dark_theme === false || this.users === false || this.settings === false))
        {
            this.fetch_settings_config(true, on_load)
            return
        }

        // if no year has been set, pull from config default
        if (this.year === '' && typeof this.defaults.event_id !== 'undefined')
        {
            this.year = this.defaults.event_id.substring(0, 4)
        }

        // load in game configs
        for (let mode of MODES)
        {
            this[mode] = this.load_config(`${this.year}-${mode}`)
        }
        this.smart_stats = this.load_config(`${this.year}-smart_stats`)
        this.coach = this.load_config(`${this.year}-coach`)
        this.whiteboard = this.load_config(`${this.year}-whiteboard`)
        this.version = this.load_config(`${this.year}-version`)

        // if any failed to load re-fetch them
        if (fetch_on_fail < 2 && (MODES.some(m => this[m] === false) || this.smart_stats === false ||
            this.coach === false || this.whiteboard === false) && this.year !== '')
        {
            this.fetch_game_config(true, on_load)
            return
        }
        else if (MODES.every(m => this[m] === false) && this.smart_stats === false &&
            this.coach === false && this.whiteboard === false)
        {
            // if the game config was never found, fill in with empty config so the page loads
            for (let mode of MODES)
            {
                this[mode] = []
            }
            this.smart_stats = []
            this.coach = []
            this.whiteboard = {}
            this.version = 'NO-CONFIG-FOUND'
        }

        if (on_load !== '')
        {
            on_load()
        }
    }

    /**
     * function:    load_config
     * parameters:  config name
     * returns:     none
     * description: Loads a single config in from localStorage.
     */
    load_config(name)
    {
        let file = localStorage.getItem(`config-${name}`)
        if (file !== null)
        {
            return JSON.parse(file)
        }
        return false
    }

    /**
     * function:    fetch_settings_config
     * parameters:  override cache
     * returns:     none
     * description: Pulls the settings config file from server into localStorage.
     */
    fetch_settings_config(force=false, on_load='')
    {
        console.log('Fetching settings config')

        // force reload config if requested
        let init = {}
        if (force)
        {
            let headers = new Headers()
            headers.append('pragma', 'no-cache')
            headers.append('cache-control', 'no-cache')
            init = {
                method: 'GET',
                headers: headers
            }
        }
    
        // fetch general config
        fetch('/config/settings-config.json', init)
            .then(response => {
                return response.json()
            })
            .then(data => {
                let keys = Object.keys(data)
                for (let section of keys)
                {
                    localStorage.setItem(`config-${section}`, JSON.stringify(data[section]))
                }
                this.load_configs(1, on_load)
            })
            .catch(err => {
                console.log(`Error fetching settings config file, ${err}`)
            })
    }

    /**
     * function:    fetch_game_config
     * parameters:  override cache
     * returns:     none
     * description: Pulls the game config file from server into localStorage.
     */
    fetch_game_config(force=false, on_load='')
    {
        console.log('Fetching game config')

        // force reload config if requested
        let init = {}
        if (force)
        {
            let headers = new Headers()
            headers.append('pragma', 'no-cache')
            headers.append('cache-control', 'no-cache')
            init = {
                method: 'GET',
                headers: headers
            }
        }
    
        // fetch game config
        fetch(`/config/${this.year}-config.json`, init)
            .then(response => {
                return response.json()
            })
            .then(data => {
                let keys = Object.keys(data)
                for (let section of keys)
                {
                    localStorage.setItem(`config-${this.year}-${section}`, JSON.stringify(data[section]))
                }
                this.load_configs(2, on_load)
            })
            .catch(err => {
                console.log(`Error fetching ${this.year} config file, ${err}`)
                this.load_configs(2, on_load)
            })
    }

    /**
     * function:    is_admin
     * parameters:  user id
     * returns:     if the user is an admin
     * description: Returns whether the user is an administrator.
     */
    is_admin(id)
    {
        return cfg.users.hasOwnProperty(id) && cfg.users[id].hasOwnProperty('admin') && cfg.users[id].admin
    }

    /**
     * function:    get_name
     * parameters:  user id, return "Unknown User"
     * returns:     the users name or id number
     * description: Returns a users name or ID number if name is not provided.
     */
    get_name(id, allow_unknown=true)
    {
        if (cfg.users.hasOwnProperty(id))
        {
            if (cfg.users[id].hasOwnProperty('name'))
            {
                return cfg.users[id].name
            }
        }
        if (allow_unknown)
        {
            return 'Unknown User'
        }
        else
        {
            return id
        }
    }

    /**
     * function:    get_position
     * parameters:  user id
     * returns:     the users scouting position
     * description: Returns the users scouting position
     */
    get_position(id)
    {
        if (cfg.users.hasOwnProperty(id) && cfg.users[id].hasOwnProperty('position'))
        {
            return cfg.users[id].position
        }
        return -1
    }

    /**
     * Validates all settings configuration sections.
     * 
     * @returns {boolean} Whether all sections are valid.
     */
    validate_settings_configs()
    {
        return [this.validate_theme('theme'), this.validate_theme('dark_theme'), this.validate_keys('keys'),
            this.validate_users('users'), this.validate_defaults('defaults'), this.validate_settings('settings')].every(r => r.result)
    }

    /**
     * Handles a validation result. Prints any errors to the console, then builds a result object using the arguments.
     * 
     * @param {boolean} result Whether the validation passed.
     * @param {string} description Reason why the validation failed, ignored if passed.
     * @param {string} id An identifier associated with the failure.
     * @returns {object} An object containing the result, description, and id.
     */
    static return_description(result, description='', id='')
    {
        if (result)
        {
            description = ''
        }
        else if (description !== '')
        {
            console.log(description)
        }

        let res = {
            'result': result,
            'description': description
        }
        if (id !== '')
        {
            res.id = id
        }
        return res
    }

    /**
     * Builds a passing validation result.
     * 
     * @returns {object} A validation result
     */
    static return_pass()
    {
        return Config.return_description(true)
    }

    /**
     * Builds a failing validation result.
     * 
     * @param {string} description Reason why the validation failed, ignored if passed.
     * @param {string} id An identifier associated with the failure.
     * @returns {object} A validation result
     */
    static return_fail(description, id='')
    {
        return Config.return_description(false, description, id)
    }

    /**
     * Validates a theme configuration section.
     * 
     * @param {object} config Theme config name 
     * @returns {object} Validation result
     */
    validate_theme(config)
    {
        let c = this[config]
        if (typeof c === 'object')
        {
            return Config.return_pass()
        }
        return Config.return_fail(`should be an object, but found ${typeof c}`)
    }

    /**
     * Validates a keys configuration section.
     * 
     * @param {object} config Keys config name 
     * @returns {object} Validation result
     */
    validate_keys(config)
    {
        let c = this[config]
        if (typeof c === 'object')
        {
            return Config.check_properties(c, {'tba': 'string', 'server': 'string'}, '', false)
        }
        return Config.return_fail(`should be an object, but found ${typeof c}`)
    }

    /**
     * Validates a users configuration section.
     * 
     * @param {object} config Users config name 
     * @returns {object} Validation result
     */
    validate_users(config)
    {
        let c = this[config]
        if (typeof c === 'object')
        {
            return Config.return_pass()
        }
        return Config.return_description(typeof c !== 'object', `should be an object, but found ${typeof c}`)
    }

    /**
     * Validates a defaults configuration section.
     * 
     * @param {object} config Defaults config name 
     * @returns {object} Validation result
     */
    validate_defaults(config)
    {
        let c = this[config]
        if (typeof c === 'object')
        {
            return Config.check_properties(c, {'event_id': 'string', 'upload_url': 'string', 'user_id': 'number'})
        }
        return Config.return_fail(`should be an object, but found ${typeof c}`)
    }

    /**
     * Validates a settings configuration section.
     * 
     * @param {object} config Settings config name 
     * @returns {object} Validation result
     */
    validate_settings(config)
    {
        let c = this[config]
        if (typeof c === 'object')
        {
            return Config.check_properties(c, {'title': 'string', 'team_number': 'number', 'time_format': 'number',
                                               'use_images': 'boolean', 'use_team_color': 'boolean', 'use_offline': 'boolean'})
        }
        return Config.return_fail(`should be an object, but found ${typeof c}`)
    }

    /**
     * Validates all game configuration sections.
     * 
     * @returns {boolean} Whether all sections are valid.
     */
    validate_game_configs()
    {
        return [this.validate_version('version'), this.validate_coach('coach'), this.validate_whiteboard('whiteboard'),
            this.validate_smart_stats('smart_stats')].every(r => r.result) && MODES.every(m => this.validate_mode(m).result)
    }

    /**
     * Validates a version configuration section.
     * 
     * @param {object} config Version config name 
     * @returns {object} Validation result
     */
    validate_version(config)
    {
        let c = this[config]
        if (typeof c !== 'string')
        {
            return Config.return_fail(`should be a string, but found ${typeof c}`)
        }
        return Config.return_pass()
    }

    /**
     * Validates a coach configuration section.
     * 
     * @param {object} config Coach config name 
     * @returns {object} Validation result
     */
    validate_coach(config)
    {
        let c = this[config]
        if (Array.isArray(c))
        {
            let keys = dal.get_keys()
            for (let coach of c)
            {
                let result = Config.check_properties(coach, {'function': 'string', 'key': 'string'}, coach.key)
                if (!result.result)
                {
                    return result
                }
                if (!['mean', 'median', 'mode', 'min', 'max', 'total'].includes(coach.function))
                {
                    return Config.return_fail(`invalid function ${coach.function}`, coach.key)
                }
                if (!keys.includes(coach.key))
                {
                    return Config.return_fail(`key ${coach.key} does not exist`, coach.key)
                }
            }
            return Config.return_pass()
        }
        return Config.return_fail(`should be an array`)
    }

    /**
     * Validates a whiteboard configuration section.
     * 
     * @param {object} config Whiteboard config name 
     * @returns {object} Validation result
     */
    validate_whiteboard(config)
    {
        let c = this[config]
        if (typeof c === 'object')
        {
            if (!c.hasOwnProperty('game_pieces'))
            {
                return Config.return_fail(`missing property game_pieces`)
            }
            if (!Array.isArray(c.game_pieces))
            {
                return Config.return_fail(`property game_pieces should be an array`)
            }
            return Config.check_properties(c, {'draw_color': 'string', 'field_height': 'number', 'field_height_ft': 'number', 'field_height_px': 'number',
                'field_width': 'number', 'horizontal_margin': 'number', 'line_width': 'number', 'magnet_size': 'number', 'vertical_margin': 'number',
                'blue_0': 'object', 'blue_1': 'object', 'blue_2': 'object', 'red_0': 'object', 'red_1': 'object', 'red_2': 'object'})
        }
        return Config.return_fail(`should be an object, but found ${typeof c}`)
    }

    /**
     * Validates a smart stats configuration section.
     * 
     * @param {object} config Smart stats config name 
     * @returns {object} Validation result
     */
    validate_smart_stats(config)
    {
        let numeric_keys = dal.get_result_keys(false, ['number', 'counter', 'slider'])

        let c = this[config]
        if (Array.isArray(c))
        {
            for (let stat of c)
            {
                let result = Config.check_properties(stat, {'id': 'string', 'type': 'string', 'name': 'string', 'negative': 'boolean'}, stat.id)
                if (!result.result)
                {
                    return result
                }
                switch (stat.type)
                {
                    case 'min':
                    case 'max':
                    case 'sum':
                        result = Config.check_array(stat, 'keys', 'string', 0, true, numeric_keys.map(k => k.split('.')[1]))
                        if (!result.result)
                        {
                            return result
                        }
                        break

                    case 'percent':
                    case 'ratio':
                        result = Config.check_properties(stat, {'numerator': 'string', 'denominator': 'string'}, stat.id)
                        if (!result.result)
                        {
                            return result
                        }
                        // confirm the numerator and denominator are valid numeric keys
                        if (!numeric_keys.includes(`results.${stat.numerator}`))
                        {
                            return Config.return_fail(`unexpected value "${stat.numerator}" in numerator`, stat.id)
                        }
                        if (!numeric_keys.includes(`results.${stat.denominator}`))
                        {
                            return Config.return_fail(`unexpected value "${stat.denominator}" in denominator`, stat.id)
                        }
                        break

                    case 'where':
                        result = Config.check_properties(stat, {'cycle': 'string', 'conditions': 'object'}, stat.id)
                        if (!result.result)
                        {
                            return result
                        }
                        result = Config.check_properties(stat, {'sum': 'string', 'denominator': 'string'}, stat.id)
                        if (!result.result)
                        {
                            return result
                        }
                        // check cycle keys
                        let cycles = dal.get_result_keys(true, ['cycle'])//.map(c => dal.meta[c].name)
                        if (!cycles.includes(`results.${stat.cycle}`))
                        {
                            return Config.return_fail(`cycle "${stat.cycle}" for where does not exist`, stat.id)
                        }
                        // check condition select keys
                        let selects = dal.get_result_keys(stat.cycle, ['dropdown', 'select', 'checkbox'])
                        let conditions = Object.keys(stat.conditions)
                        for (let key of conditions)
                        {
                            let id = `results.${key}`
                            if (!selects.includes(id))
                            {
                                return Config.return_fail(`condition ${key} for where does not exist`, stat.id)
                            }
                            // get list of valid options
                            let options = [true, false]
                            if (dal.meta[id].type !== 'checkbox')
                            {
                                options = dal.meta[`results.${key}`].options
                            }
                            // determine if condition value is in the options
                            if (!options.includes(stat.conditions[key]))
                            {
                                return Config.return_fail(`condition ${key} does not have option ${stat.conditions[key]} for where`, stat.id)
                            }
                        }
                        // check values of optional keys, sum and denominator
                        let counters = dal.get_result_keys(stat.cycle, ['counter'])
                        if ('sum' in stat && !counters.includes(`results.${stat.sum}`))
                        {
                            return Config.return_fail(`unexpected value "${stat.sum}" in sum`, stat.id)
                        }
                        if ('denominator' in stat && !counters.includes(`results.${stat.denominator}`))
                        {
                            return Config.return_fail(`unexpected value "${stat.denominator}" in denominator`, stat.id)
                        }
                        break

                    case 'math':
                        result = Config.check_properties(stat, {'math': 'string', 'pit': 'boolean'}, stat.id)
                        if (!result.result)
                        {
                            return result
                        }
                        // not doing any detailed checking on math stats because they are so complex
                        break

                    case 'filter':
                        result = Config.check_properties(stat, {'key': 'string', 'filter': 'string', 'compare_type': 'number'}, stat.id)
                        if (!result.result)
                        {
                            return result
                        }
                        // value could be on of many types based on the key
                        if (!stat.hasOwnProperty('value'))
                        {
                            return Config.return_fail(`stat missing property value`, stat.id)
                        }
                        // confirm the key and filter are valid keys
                        let keys = dal.get_result_keys(false, ['number', 'counter', 'slider', 'checkbox', 'select', 'dropdown'])
                        if (!keys.includes(`results.${stat.key}`))
                        {
                            return Config.return_fail(`unexpected value "${v}" in key`, stat.id)
                        }
                        if (!keys.includes(`results.${stat.filter}`))
                        {
                            return Config.return_fail(`unexpected value "${v}" in filter`, stat.id)
                        }
                        break

                    case 'wrank':
                        result = Config.check_properties(stat, {'stat': 'string'}, stat.id)
                        if (!result.result)
                        {
                            return result
                        }
                        if (!numeric_keys.includes(`results.${stat.stat}`))
                        {
                            return Config.return_fail(`unexpected value "${stat.stat}" in stat`, stat.id)
                        }
                        break

                    case 'map':
                        result = Config.check_properties(stat, {'stat': 'string', 'pit': 'boolean'}, stat.id)
                        if (!result.result)
                        {
                            return result
                        }
                        result = Config.check_array(stat, 'values', 'number', 0, true)
                        if (!result.result)
                        {
                            return result
                        }
                        // confirm the stat is a valid select key
                        let select_keys = dal.get_keys(true, true, false, false, ['select', 'dropdown'], false).map(k => k.split('.')[1])
                        if (!select_keys.includes(stat.stat))
                        {
                            return Config.return_fail(`unexpected value "${stat.stat}" in stat`, stat.id)
                        }
                        break

                    default:
                        return Config.return_fail(`Unknown type, ${stat.type}`, stat.id)
                }
            }
            return Config.return_pass()
        }
        return Config.return_fail(`should be an array`)
    }

    /**
     * Validates a given mode configuration section.
     * 
     * @param {object} config Mode config name 
     * @returns {object} Validation result
     */
    validate_mode(config)
    {
        return Config.validate_mode_raw(this[config])
    }

    /**
     * Validates a given mode configuration section.
     * 
     * @param {object} config Mode config object 
     * @returns {object} Validation result
     */
    static validate_mode_raw(c)
    {
        let ids = []
        if (Array.isArray(c))
        {
            for (let page of c)
            {
                let result = Config.check_properties(page, {'name': 'string', 'id': 'string'}, page.id)
                if (!result.result)
                {
                    return result
                }

                result = Config.check_array(page, 'columns', 'object', 0, true)
                if (!result.result)
                {
                    return result
                }

                for (let column of page.columns)
                {
                    result = Config.check_properties(column, {'name': 'string', 'id': 'string'}, column.id)
                    if (!result.result)
                    {
                        return result
                    }

                    result = Config.check_array(column, 'inputs', 'object', 0, true)
                    if (!result.result)
                    {
                        return result
                    }

                    result = Config.check_properties(column, {'cycle': 'boolean'}, column.id, false)
                    if (!result.result)
                    {
                        return result
                    }

                    for (let input of column.inputs)
                    {
                        result = Config.check_properties(input, {'name': 'string', 'id': 'string', 'type': 'string'}, input.id)
                        if (!result.result)
                        {
                            return result
                        }

                        // check for overlapping IDs
                        if (ids.includes(input.id))
                        {
                            return Config.return_fail(`Repeat id "${input.id}"`, input.id)
                        }
                        ids.push(input.id)

                        // check options first because it's values are used in future checking
                        if (['dropdown', 'select', 'multiselect', 'multicounter'].includes(input.type))
                        {
                            result = Config.check_array(input, 'options', 'string', 0, true)
                            if (!result.result)
                            {
                                return result
                            }

                            // check for overlapping IDs
                            for (let option of input.options)
                            {
                                let id = `${input.id}_${option.toLowerCase()}`
                                if (ids.includes(id))
                                {
                                    return Config.return_fail(`Repeat id "${id}"`, id)
                                }
                                ids.push(id)
                            }
                        }

                        switch (input.type)
                        {
                            case 'select':
                                let num_options = input.options.length
                                result = Config.check_array(input, 'images', 'string', num_options, false)
                                if (!result.result)
                                {
                                    return result
                                }

                                result = Config.check_array(input, 'colors', 'string', num_options, false)
                                if (!result.result)
                                {
                                    return result
                                }

                            case 'dropdown':
                                result = Config.check_properties(input, {'default': 'string'}, input.id)
                                if (!result.result)
                                {
                                    return result
                                }
                                // ensure "default" exists in options
                                else if (!input.options.includes(input.default))
                                {
                                    return Config.return_fail(`default "${input.default}" not found in options`, input.id)
                                }

                            case 'multiselect':
                                // require only multiselect to have a "default" array
                                if (input.type === 'multiselect')
                                {
                                    result = Config.check_array(input, 'default', 'boolean', input.options.length, true)
                                    if (!result.result)
                                    {
                                        return result
                                    }
                                }
                                break

                            case 'multicounter':
                                result = Config.check_properties(input, {'default': 'number'}, input.id)
                                if (!result.result)
                                {
                                    return result
                                }

                                // allow multicounter to have an "negative" array
                                result = Config.check_array(input, 'negative', 'boolean', input.options.length, false)
                                if (!result.result)
                                {
                                    return result
                                }
                                break

                            case 'checkbox':
                                result = Config.check_properties(input, {'default': 'boolean'}, input.id)
                                if (!result.result)
                                {
                                    return result
                                }
                                break

                            case 'string':
                            case 'text':
                                result = Config.check_properties(input, {'default': 'string'}, input.id)
                                if (!result.result)
                                {
                                    return result
                                }
                                break

                            case 'slider':
                                // this is checked later in number because either 2 or 3 is allowed
                                result = Config.check_array(input, 'options', 'number', 3, false)

                                if (result.result && 'options' in input)
                                {
                                    // ensure incr > 0
                                    if (input.options[2] <= 0)
                                    {
                                        return Config.return_fail('increment must be positive', input.id)
                                    }
                                    // ensure incr <= max - min
                                    if (input.options[2] > input.options[1] - input.options[0])
                                    {
                                        return Config.return_fail('increment may not be greater than the gap between minimum and maximum', input.id)
                                    }
                                }

                            case 'number':
                                // if slider has already passed don't bother checking 2 options
                                if (input.type === 'number' || !result.result)
                                {
                                    result = Config.check_array(input, 'options', 'number', 2, false)
                                }
                                if (!result.result)
                                {
                                    return result
                                }
                                // ensure max >= min
                                else if ('options' in input && input.options[1] < input.options[0])
                                {
                                    return Config.return_fail('maximum may not be less than minimum', input.id)
                                }

                            case 'counter':
                                result = Config.check_properties(input, {'default': 'number'}, input.id)
                                if (!result.result)
                                {
                                    return result
                                }
                                break

                            // prevent all other types
                            default:
                                return Config.return_fail(`Invalid type "${input.type}"`, input.id)
                        }

                        // allow all inputs to have a "disallow_default" boolean
                        result = Config.check_properties(input, {'disallow_default': 'boolean'}, input.id, false)
                        if (!result.result)
                        {
                            return result
                        }

                        // allow "negative" to be a boolean for all but multicounter
                        if (input.type !== 'multicounter')
                        {
                            result = Config.check_properties(input, {'negative': 'boolean'}, input.id, false)
                            if (!result.result)
                            {
                                return result
                            } 
                        }
                    }
                }
            }
            return Config.return_pass()
        }
        return Config.return_fail('Invalid mode object')
    }

    /**
     * Validates a object has a set of keys and values.
     * 
     * @param {object} types A map of keys to value types.
     * @param {string} id An optional ID associated with the object.
     * @param {boolean} required Whether the given keys are required.
     * @returns {object} Validation result
     */
    static check_properties(object, types, id='', required=true)
    {
        let keys = Object.keys(types)
        let fails = []
        for (let key of keys)
        {
            let type = types[key]
            if (!key in object && required)
            {
                fails.push(`missing property "${key}" of type ${type}`)
            }
            else if (key in object && typeof object[key] !== type)
            {
                fails.push(`${key} should be a ${type}, but found ${typeof object[key]}`)
            }
            else if (type === 'string' && object[key] === '' && required)
            {
                fails.push(`missing property "${key}" of type ${type}`)
            }
        }
        if (fails.length > 0)
        {
            return Config.return_fail(fails.join('; '), id)
        }
        return Config.return_pass()
    }

    /**
     * Validate that an array adheres to its required criteria.
     * 
     * @param {object} input Input/column/page that should contain the array.
     * @param {string} key Key representing the array in the input.
     * @param {string} type String type that values should be.
     * @param {number} expected_len The required number of entries in the array, <= 0 implies no requirement.
     * @param {boolean} require Whether the array's presents and expected length are required.
     * @returns {object} Validation object
     */
    static check_array(input, key, type, expected_len=0, require=false, valid_values=[])
    {
        let id = input.id
        if (key in input)
        {
            let value = input[key]
            if (!Array.isArray(value))
            {
                return Config.return_fail(`${key} must be an array`, id)
            }
            // ensure non-zero lengths match the expected length (if provided)
            else if (value.length > 0 && expected_len > 0 && value.length !== expected_len)
            {
                return Config.return_fail(`${key} must have ${expected_len} values`, id)
            }
            // ensure required keys have non-zero lengths
            else if (value.length === 0 && require)
            {
                return Config.return_fail(`${key} must have ${expected_len > 0 ? expected_len : '> 0 '} values`, id)
            }
            
            // check that each value conforms to the type
            for (let v of value)
            {
                if (typeof v !== type)
                {
                    return Config.return_fail(`value "${v}" in ${key} must be of type ${type}`, id)
                }
                else if (valid_values.length > 0 && !valid_values.includes(v))
                {
                    return Config.return_fail(`unexpected value "${v}" in ${key}`, id)
                }
            }
        }
        else if (require)
        {
            return Config.return_fail(`${key} is required`, id)
        }

        return Config.return_pass()
    }
}