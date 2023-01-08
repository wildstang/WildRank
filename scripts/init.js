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
var event_id = get_parameter(EVENT_COOKIE, undefined)
if (typeof event_id === 'undefined')
{
    var cfg = new Config()
}
else
{
    var cfg = new Config(event_id.substring(0, 4))
}

// create config object, load in what is available, and set the theme
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
    // listen for dark mode changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', apply_theme)

    if (typeof event_id === 'undefined')
    {
        event_id = cfg.defaults.event_id
    }
    
    // load in data
    dal = new DAL(event_id)
    dal.build_teams()

    init_page()
}

/**
 * function:    home()
 * parameters:  right click
 * returns:     none
 * description: Opens the appropriate home page, based on the current page.
 */
function home(right=false)
{
    let url = 'index.html?page=home'
    if (page == 'home' || page == 'index' || page == '' || page == 'matches' || page == 'pits')
    {
        url = 'index.html' 
    }
    if (!right)
    {
        window_open(url, '_self')
    }
    else
    {
        window_open(url, '_blank')
    }
}