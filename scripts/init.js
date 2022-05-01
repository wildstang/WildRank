/**
 * file:        init.js
 * description: Imports appropriate script for desired screen.
 * author:      Liam Fruzyna
 * date:        2020-06-20
 */

var urlParams = new URLSearchParams(window.location.search)
const page = urlParams.get('page')

let script = document.createElement('script')
script.src = `scripts/${page}.js`
if (!page)
{
    script.src = `scripts/index.js`
}
document.head.appendChild(script)

// register service workers
if ('serviceWorker' in navigator)
{
    navigator.serviceWorker.register('pwa.js')
}

const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const type = get_parameter(TYPE_COOKIE, TYPE_DEFAULT)
const prefix = `${type}-${event_id}-`
const year = event_id.substr(0,4)

var cfg
var dal

window.addEventListener('load', function()
{
    // load in configs
    cfg = new Config(year)
    cfg.load_configs()
    
    // load in data
    dal = new DAL(event_id)
    dal.build_teams()

    init_page()
})

/**
 * function:    home()
 * parameters:  none
 * returns:     none
 * description: Opens the appropriate home page, based on the current page.
 */
function home()
{
    let url = 'index.html?page=home'
    if (page == 'home' || page == 'index' || page == '')
    {
        url = 'index.html' 
    }
    window_open(url, '_self')
}