/**
 * file:        init.js
 * description: The first Javascript that runs on any page load.
 * author:      Liam Fruzyna
 * date:        2022-06-05
 */

// determine the desired page
var urlParams = new URLSearchParams(window.location.search)
const page = urlParams.get('page')

// load in requested page
let script = document.createElement('script')
script.src = `scripts/${page}.js`
if (!page)
{
    script.src = `scripts/index.js`
}
document.head.appendChild(script)

// register service workers for PWA
if ('serviceWorker' in navigator)
{
    navigator.serviceWorker.register('pwa.js')
}

// pull in event id and determine game year
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const year = event_id.substr(0,4)

// create config object, load in what is available, and set the theme
var cfg = new Config(year)
cfg.load_configs(2, '')
apply_theme()

var dal

/**
 * function:    create_config()
 * parameters:  none
 * returns:     none
 * description: Load in Config, then calls on_config() when complete.
 *              This function is required to be called by all HTML pages after page load.
 */
function create_config()
{
    // load in configs
    cfg.load_configs(0, on_config)
}

/**
 * function:    on_config()
 * parameters:  none
 * returns:     none
 * description: Load in DAL and build page once there is a config, called by create_config().
 */
function on_config()
{
    apply_theme()
    
    // load in data
    dal = new DAL(event_id)
    dal.build_teams()

    init_page()
}