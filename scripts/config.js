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
        this.pit = []
        this.match = []
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
        if (this.year === '')
        {
            this.year = this.defaults.event_id.substring(0, 4)
        }

        // load in game configs
        this.pit = this.load_config(`${this.year}-pit`)
        this.match = this.load_config(`${this.year}-match`)
        this.smart_stats = this.load_config(`${this.year}-smart_stats`)
        this.coach = this.load_config(`${this.year}-coach`)
        this.whiteboard = this.load_config(`${this.year}-whiteboard`)
        this.version = this.load_config(`${this.year}-version`)

        // if any failed to load re-fetch them
        if (fetch_on_fail < 2 && (this.pit === false || this.match === false || this.smart_stats === false ||
            this.coach === false || this.whiteboard === false))
        {
            this.fetch_game_config(true, on_load)
            return
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
            })
    }

    /**
     * function:    validate_settings_configs
     * parameters:  none
     * returns:     none
     * description: Validates all settings configs.
     */
    validate_settings_configs()
    {
        return this.validate_theme('theme') && this.validate_theme('dark_theme') && this.validate_keys('keys') &&
            this.validate_users('users') && this.validate_defaults('defaults') && this.validate_settings('settings')
    }

    /**
     * function:    Config.return_description
     * parameters:  boolean result, result description, whether to return the description
     * returns:     either the boolean result or an array of the result and its description
     * description: Variably returns a description with a result
     */
    static return_description(result, description, return_description)
    {
        if (description !== '')
        {
            console.log(description)
        }
        if (return_description)
        {
            return [result, description]
        }
        else
        {
            return result
        }
    }

    /**
     * function:    validate_theme
     * parameters:  config name
     * returns:     none
     * description: Validates a theme config.
     */
    validate_theme(config, description=false)
    {
        let c = this[config]
        if (typeof c === 'object')
        {
            return Config.return_description(true, '', description)
        }
        return Config.return_description(false, `should be an object, but found ${typeof c}`, description)
    }

    /**
     * function:    validate_keys
     * parameters:  config name
     * returns:     none
     * description: Validates a keys config.
     */
    validate_keys(config, description=false)
    {
        let c = this[config]
        if (typeof c === 'object')
        {
            return Config.check_properties(c, {'tba': 'string', 'server': 'string'}, description)
        }
        return Config.return_description(false, `should be an object, but found ${typeof c}`, description)
    }

    /**
     * function:    validate_users
     * parameters:  config name
     * returns:     none
     * description: Validates a users config.
     */
    validate_users(config, description=false)
    {
        let c = this[config]
        if (typeof c === 'object')
        {
            if (c.hasOwnProperty('admins') && Array.isArray(c.admins))
            {
                for (let admin of c.admins)
                {
                    if (typeof admin !== 'number')
                    {
                        return Config.return_description(false, `admin "${admin}" should be a number`, description)
                    }
                }
                return Config.check_properties(c, {'scouters': 'object'}, description)
            }
            else if (c.hasOwnProperty('admins'))
            {
                return Config.return_description(false, `admins is not an array`, description)

            }
            return Config.return_description(false, `missing property admins`, description)
        }
        return Config.return_description(false, `should be an object, but found ${typeof c}`, description)
    }

    /**
     * function:    validate_defaults
     * parameters:  config name
     * returns:     none
     * description: Validates a defaults config.
     */
    validate_defaults(config, description=false)
    {
        let c = this[config]
        if (typeof c === 'object')
        {
            return Config.check_properties(c, {'event_id': 'string', 'upload_url': 'string', 'user_id': 'number'}, description)
        }
        return Config.return_description(false, `should be an object, but found ${typeof c}`, description)
    }

    /**
     * function:    validate_settings
     * parameters:  config name
     * returns:     none
     * description: Validates a settings config.
     */
    validate_settings(config, description=false)
    {
        let c = this[config]
        if (typeof c === 'object')
        {
            return Config.check_properties(c, {'allow_random': 'boolean', 'time_format': 'number', 'title': 'string', 'use_images': 'boolean'}, description)
        }
        return Config.return_description(false, `should be an object, but found ${typeof c}`, description)
    }

    /**
     * function:    is_settings_valid
     * parameters:  none
     * returns:     none
     * description: Validates all settings configs.
     */
    validate_game_configs()
    {
        return this.validate_version('version') && this.validate_coach('coach') && this.validate_whiteboard('whiteboard') &&
            this.validate_smart_stats('smart_stats') && this.validate_mode('pit') && this.validate_mode('match')
    }

    /**
     * function:    validate_version
     * parameters:  config name
     * returns:     none
     * description: Validates a version config.
     */
    validate_version(config, description=false)
    {
        let c = this[config]
        if (typeof c !== 'string')
        {
            return Config.return_description(false, `should be a string, but found ${typeof c}`, description)
        }
        return Config.return_description(true, '', description)
    }

    /**
     * function:    validate_coach
     * parameters:  config name
     * returns:     none
     * description: Validates a coach stats config.
     */
    validate_coach(config, description=false)
    {
        let c = this[config]
        if (Array.isArray(c))
        {
            let keys = dal.get_keys()
            for (let coach of c)
            {
                let result = Config.check_properties(coach, {'function': 'string', 'key': 'string'})
                if (Config.failed(result))
                {
                    return result
                }
                if (!['mean', 'median', 'mode', 'min', 'max', 'total'].includes(coach.function))
                {
                    return Config.return_description(false, `invalid function ${coach.function}`, description)
                }
                if (!keys.includes(coach.key))
                {
                    return Config.return_description(false, `key ${coach.key} does not exist`, description)
                }
            }
            return Config.return_description(true, '', description)
        }
        return Config.return_description(false, `should be an array`, description)
    }

    /**
     * function:    validate_whiteboard
     * parameters:  config name
     * returns:     none
     * description: Validates a whiteboard config.
     */
    validate_whiteboard(config, description=false)
    {
        let c = this[config]
        if (typeof c === 'object')
        {
            if (!c.hasOwnProperty('game_pieces'))
            {
                return Config.return_description(false, `missing property game_pieces`, description)
            }
            if (!Array.isArray(c.game_pieces))
            {
                return Config.return_description(false, `property game_pieces should be an array`, description)
            }
            return Config.check_properties(c, {'draw_color': 'string', 'field_height': 'number', 'field_height_ft': 'number', 'field_height_px': 'number',
                'field_width': 'number', 'horizontal_margin': 'number', 'line_width': 'number', 'magnet_size': 'number', 'vertical_margin': 'number',
                'blue_0': 'object', 'blue_1': 'object', 'blue_2': 'object', 'red_0': 'object', 'red_1': 'object', 'red_2': 'object'}, description)
        }
        return Config.return_description(false, `should be an object, but found ${typeof c}`, description)
    }

    /**
     * function:    validate_smart_stats
     * parameters:  config name
     * returns:     none
     * description: Validates a smart stats config.
     */
    validate_smart_stats(config, description=false)
    {
        let c = this[config]
        if (Array.isArray(c))
        {
            for (let stat of c)
            {
                let result = Config.check_properties(stat, {'id': 'string', 'type': 'string', 'name': 'string'}, description)
                if (Config.failed(result))
                {
                    return result
                }
                switch (stat.type)
                {
                    case 'sum':
                        if (!stat.hasOwnProperty('keys'))
                        {
                            return Config.return_description(false, `stat missing property keys`, description)
                        }
                        if (!Array.isArray(stat.keys))
                        {
                            return Config.return_description(false, `stat property keys should be an array`, description)
                        }
                        break
                    case 'percent':
                    case 'ratio':
                        result = Config.check_properties(stat, {'numerator': 'string', 'denominator': 'string'}, description)
                        if (Config.failed(result))
                        {
                            return result
                        }
                        break
                    case 'where':
                        result = Config.check_properties(stat, {'cycle': 'string', 'conditions': 'object'}, description)
                        if (Config.failed(result))
                        {
                            return result
                        }
                        let keys = dal.get_result_keys(true, ['cycle'])
                        if (!keys.includes(`results.${stat.cycle}`))
                        {
                            return Config.return_description(false, `cycle ${stat.cycle} for where does not exist`, description)
                        }
                        keys = dal.get_result_keys(stat.cycle)
                        let conditions = Object.keys(stat.conditions)
                        for (let key of conditions)
                        {
                            if (!keys.includes(`results.${key}`))
                            {
                                return Config.return_description(false, `condition ${key} for where does not exist`, description)
                            }
                            if (!dal.meta[`results.${key}`].options.includes(stat.conditions[key]))
                            {
                                return Config.return_description(false, `condition ${key} does not have option ${stat.conditions[key]} for where`, description)
                            }
                        }
                        break
                    case 'min':
                    case 'max':
                        if (!stat.hasOwnProperty('keys'))
                        {
                            return Config.return_description(false, `stat missing property keys`, description)
                        }
                        if (!Array.isArray(stat.keys))
                        {
                            return Config.return_description(false, `stat property keys should be an array`, description)
                        }
                        break
                    case 'math':
                        result = Config.check_properties(stat, {'math': 'string'}, description)
                        if (Config.failed(result))
                        {
                            return result
                        }
                        break
                    default:
                        return Config.return_description(false, `Unknown type, ${stat.type}`, description)
                }
            }
            return Config.return_description(true, '', description)
        }
        return Config.return_description(false, `should be an array`, description)
    }

    /**
     * function:    validate_mode
     * parameters:  config name
     * returns:     none
     * description: Validates a scouting mode config.
     */
    validate_mode(config, description=false)
    {
        let c = this[config]
        if (Array.isArray(c))
        {
            for (let page of c)
            {
                let result = Config.check_properties(page, {'name': 'string', 'id': 'string'}, description)
                if (Config.failed(result))
                {
                    return result
                }
                if (!page.hasOwnProperty('columns'))
                {
                    return Config.return_description(false, `page missing property columns`, description)
                }
                if (!Array.isArray(page.columns))
                {
                    return Config.return_description(false, `page property columns should be an array`, description)
                }
                for (let column of page.columns)
                {
                    result = Config.check_properties(column, {'name': 'string', 'id': 'string'}, description)
                    if (Config.failed(result))
                    {
                        return result
                    }
                    if (!column.hasOwnProperty('inputs'))
                    {
                        return Config.return_description(false, `column missing property inputs`, description)
                    }
                    if (!Array.isArray(column.inputs))
                    {
                        return Config.return_description(false, `column property inputs should be an array`, description)
                    }
                    for (let input of column.inputs)
                    {
                        result = Config.check_properties(input, {'name': 'string', 'id': 'string', 'type': 'string'}, description)
                        if (Config.failed(result))
                        {
                            return result
                        }
                        switch (input.type)
                        {
                            case 'dropdown':
                            case 'select':
                                result = Config.check_properties(input, {'default': 'string'}, description)
                                if (Config.failed(result))
                                {
                                    return result
                                }
                                break
                            case 'multicounter':
                                if (!input.hasOwnProperty('options') && Array.isArray(input.options))
                                {
                                    return Config.return_description(false, '', description)
                                }
                                break
                            case 'checkbox':
                                result = Config.check_properties(input, {'default': 'boolean'}, description)
                                if (Config.failed(result))
                                {
                                    return result
                                }
                                break
                            case 'string':
                            case 'text':
                                result = Config.check_properties(input, {'default': 'string'}, description)
                                if (Config.failed(result))
                                {
                                    return result
                                }
                                break
                            case 'number':
                            case 'slider':
                            case 'counter':
                                result = Config.check_properties(input, {'default': 'number'}, description)
                                if (Config.failed(result))
                                {
                                    return result
                                }
                                break
                            default:
                                return Config.return_description(false, 'Invalid type', description)
                        }
                    }
                }
            }
            return Config.return_description(true, '', description)
        }
        return Config.return_description(false, 'Invalid mode object', description)
    }

    /**
     * function:    check_property
     * parameters:  js object, property key, expected type
     * returns:     property exists and is of valid type
     * description: Confirms a given property exists in a given object and has a value of a given type.
     */
    static check_properties(object, types, description=false)
    {
        let keys = Object.keys(types)
        let fails = []
        for (let key of keys)
        {
            let type = types[key]
            if (!object.hasOwnProperty(key))
            {
                fails.push(`missing property ${key} of type ${type}`)
            }
            else if (typeof object[key] !== type)
            {
                fails.push(`${key} should be a ${type}, but found ${typeof object[key]}`)
            }
        }
        if (fails.length > 0)
        {
            return Config.return_description(false, fails.join('; '), description)
        }
        return Config.return_description(true, '', description)
    }

    /**
     * function:    failed
     * parameters:  result
     * returns:     If the result is false
     * description: Determines if the given result is false.
     */
    static failed(result)
    {
        return (Array.isArray(result) && !result[0]) || !result
    }
}