/**
 * file:        config.js
 * description: Contains config object for importing and accessing config files.
 * author:      Liam Fruzyna
 * date:        2025-03-16
 */

let init = {}

function load_config(name, on_received, year='')
{
    let path = year ? `/config/${year}` : '/config'
    fetch(`${path}/${name}.json`, init)
        .then(response => {
            return response.json()
        })
        .then(on_received)
}

APP_CONFIG = 'app-config'
USER_CONFIG = 'user-config'
USER_LIST = 'user-list'
BASE_SCOUT_CONFIG = 'scout-config'
BASE_ANALYSIS_CONFIG = 'analysis-config'
GAME_CONFIG = 'game-config'

class Config
{

    constructor()
    {
        this.app_version = ''

        this.app = {}
        this.user = {}
        this.users = {}

        this.scout = {}
        this.analysis = {}
        this.game = {}

        this.include_game_config = true
    }

    get year()
    {
        if (this.user.state && this.user.state.event_id)
        {
            return parseInt(this.user.state.event_id.substring(0, 4))
        }
        return 0
    }

    get theme()
    {
        // determine selected theme from config and system if auto is selected
        let theme_name = cfg.user.state.theme
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

    get title()
    {
        if (this.app.config && this.app.config.title)
        {
            return cfg.app.config.title
        }
        return 'WildRank'
    }

    //
    // User Functions
    //

    get_name(user_id)
    {
        if (Object.keys(this.users).includes(user_id))
        {
            return this.users[user_id].name
        }
        return 'Unknown User'
    }

    is_admin(user_id)
    {
        if (Object.keys(this.users).includes(user_id))
        {
            return this.users[user_id].admin
        }
        return false
    }

    get_position(user_id)
    {
        if (Object.keys(this.users).includes(user_id))
        {
            return this.users[user_id].position
        }
        return -1
    }

    //
    // Config Loading/Storage Functions
    //

    store_user_config()
    {
        localStorage.setItem(USER_CONFIG, JSON.stringify(this.user))
    }

    update_event_id(event_id)
    {
        let old_year = this.year
        this.user.state.event_id = event_id
        this.store_user_config()

        // load in new game configs if the year has changed
        if (this.year !== old_year)
        {
            this.load_game_configs()
        }
    }

    get SCOUT_CONFIG()
    {
        return `${this.year}-${BASE_SCOUT_CONFIG}`
    }

    get ANALYSIS_CONFIG()
    {
        return `${this.year}-${BASE_ANALYSIS_CONFIG}`
    }

    store_configs()
    {
        if (Object.keys(this.user).length)
        {
            this.store_user_config()
        }
        if (Object.keys(this.scout).length)
        {
            localStorage.setItem(this.SCOUT_CONFIG, JSON.stringify(this.scout))
        }
        if (Object.keys(this.analysis).length)
        {
            localStorage.setItem(this.ANALYSIS_CONFIG, JSON.stringify(this.analysis))
        }
        if (Object.keys(this.users).length)
        {
            let user_list = ''
            for (let key in this.users)
            {
                user_list += `${key},${this.users[key].name},${this.users[key].admin},${this.users[key].position}\n`
            }
            localStorage.setItem(USER_LIST, user_list)
        }
    }

    load_configs(on_complete=() => console.log('Config loaded'), game_config=true)
    {
        this.include_game_config = game_config
        this.on_complete = on_complete
        this.load_app_config()
    }

    load_app_config()
    {
        load_config(APP_CONFIG, this.handle_app_config.bind(this))
    }

    handle_app_config(app_config)
    {
        this.app = app_config
        this.load_user_config()
    }

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

    handle_user_config(user_config)
    {
        this.user = user_config
        this.load_user_list()
    }

    load_user_list()
    {
        let user_list = localStorage.getItem(USER_LIST)
        if (user_list === null)
        {
            console.log('user-list does not exist, pulling from server/cache')
            fetch(`/config/${USER_LIST}.csv`, init)
                .then(response => {
                    return response.text()
                })
                .then(this.handle_user_list.bind(this))
                .catch(err => {
                    console.log(`Error fetching ${name} config, ${err}`)
                })
        }
        else
        {
            this.handle_user_list(user_list)
        }
    }

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

        if (this.include_game_config)
        {
            this.load_game_configs()
        }
        else
        {
            this.on_complete()
        }
    }

    load_game_configs()
    {
        if (this.year)
        {
            this.load_scout_config()
        }
        else
        {
            console.log('event_id not found, skipping game configs')
            this.on_complete()
        }
    }

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

    handle_scout_config(scout_config)
    {
        this.scout = scout_config
        this.load_analysis_config()
    }

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

    handle_analysis_config(analysis_config)
    {
        this.analysis = analysis_config
        this.load_game_config()
    }

    load_game_config()
    {
        load_config(GAME_CONFIG, this.handle_game_config.bind(this), this.year)
    }

    handle_game_config(game_config)
    {
        this.game = game_config
        this.on_complete()
    }
}