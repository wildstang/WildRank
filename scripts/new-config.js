/**
 * file:        new-config.js
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
        this.admins = []
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
    load_configs(fetch_on_fail=true)
    {
        // load in settings configs
        this.keys = this.load_config('keys')
        this.defaults = this.load_config('defaults')
        this.theme = this.load_config('theme')
        this.dark_theme = this.load_config('dark-theme')
        this.admins = this.load_config('admins')
        this.settings = this.load_config('settings')

        // if any failed to load re-fetch them
        if (fetch_on_fail && (this.keys === false || this.defaults === false || this.theme === false ||
            this.dark_theme === false || this.admins === false || this.settings === false))
        {
            this.fetch_settings_config(true)
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
        this.smart_stats = this.load_config(`${this.year}-smart-stats`)
        this.coach = this.load_config(`${this.year}-coach`)
        this.whiteboard = this.load_config(`${this.year}-whiteboard`)
        this.version = this.load_config(`${this.year}-version`)

        // if any failed to load re-fetch them
        if (fetch_on_fail && (this.pit === false || this.match === false || this.smart_stats === false ||
            this.coach === false || this.whiteboard === false))
        {
            this.fetch_game_config(true)
            return
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
    fetch_settings_config(force=false)
    {
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
                this.load_configs(false)
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
    fetch_game_config(force=false)
    {
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
                this.load_configs(false)
            })
            .catch(err => {
                console.log(`Error fetching ${this.year} config file, ${err}`)
            })
    }

    /**
     * function:    is_settings_valid
     * parameters:  none
     * returns:     none
     * description: Validates all settings configs.
     */
    validate_settings_configs()
    {
        return this.validate_theme('theme') && this.validate_theme('dark_theme') && this.validate_keys('keys') &&
            this.validate_admins('admins') && this.validate_defaults('defaults') && this.validate_settings('settings')
    }

    validate_theme(config)
    {
        let c = this[config]
        if (typeof c === 'object')
        {
            return true
        }
        console.log('Invalid theme object')
        return false
    }

    validate_keys(config)
    {
        let c = this[config]
        if (typeof c === 'object')
        {
            return this.check_property(c, 'tba', 'string')
        }
        console.log('Invalid keys object')
        return false
    }

    validate_admins(config)
    {
        let c = this[config]
        if (Array.isArray(c))
        {
            for (let admin of c)
            {
                if (typeof admin !== 'number')
                {
                    console.log('Invalid admin', admin)
                    return false
                }
            }
            return true
        }
        console.log('Invalid admins object')
        return false
    }

    validate_defaults(config)
    {
        let c = this[config]
        if (typeof c === 'object')
        {
            return this.check_property(c, 'event_id', 'string') && this.check_property(c, 'upload_url', 'string') &&
                this.check_property(c, 'user_id', 'number')
        }
        console.log('Invalid defaults object')
        return false
    }

    validate_settings(config)
    {
        let c = this[config]
        if (typeof c === 'object')
        {
            return this.check_property(c, 'allow_random', 'boolean') && this.check_property(c, 'time_format', 'number') &&
                this.check_property(c, 'title', 'string') && this.check_property(c, 'use_images', 'boolean')
        }
        console.log('Invalid defaults object')
        return false
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

    validate_version(config)
    {
        let c = this[config]
        if (typeof c !== 'string')
        {
            console.log('Invalid version')
            return false
        }
        return true
    }

    validate_coach(config)
    {
        let c = this[config]
        if (Array.isArray(c))
        {
            for (let coach of c)
            {
                if (!this.check_property(coach, 'function', 'string') || !this.check_property(coach, 'key', 'string'))
                {
                    return false
                }
                if (!['mean', 'median', 'mode', 'min', 'max', 'total'].includes(coach.function))
                {
                    console.log('Invalid function')
                    return false
                }
            }
            return true
        }
        console.log('Invalid coach object')
        return false
    }

    validate_whiteboard(config)
    {
        let c = this[config]
        if (typeof c === 'object')
        {
            return this.check_property(c, 'draw_color', 'string') && this.check_property(c, 'field_height', 'number') && this.check_property(c, 'field_height_ft', 'number') &&
                this.check_property(c, 'field_height_px', 'number') && this.check_property(c, 'field_width', 'number') && this.check_property(c, 'horizontal_margin', 'number') &&
                this.check_property(c, 'line_width', 'number') && this.check_property(c, 'magnet_size', 'number') && this.check_property(c, 'vertical_margin', 'number') &&
                Array.isArray(c.game_pieces) && typeof c.blue_1 === 'object' && typeof c.blue_2 === 'object' && typeof c.blue_3 === 'object' &&
                typeof c.red_1 === 'object' && typeof c.red_2 === 'object' && typeof c.red_3 === 'object'
        }
        console.log('Invalid whiteboard object')
        return false
    }

    validate_smart_stats(config)
    {
        let c = this[config]
        if (Array.isArray(c))
        {
            for (let stat of c)
            {
                if (!this.check_property(stat, 'id', 'string') || !this.check_property(stat, 'type', 'string') ||
                    !this.check_property(stat, 'name', 'string') || !this.check_property(stat, 'negative', 'boolean'))
                {
                    return false
                }
            }
            return true
        }
        console.log('Invalid smart-stats object')
        return false
    }

    validate_mode(config)
    {
        let c = this[config]
        if (Array.isArray(c))
        {
            return true
        }
        console.log('Invalid mode object')
        return false
    }

    check_property(object, key, type)
    {
        if (!object.hasOwnProperty(key) || typeof object[key] !== type)
        {
            console.log('Invalid', key)
            return false
        }
        return true
    }
}