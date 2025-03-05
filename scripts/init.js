/**
 * file:        init.js
 * description: The first Javascript that runs on any page load.
 * author:      Liam Fruzyna
 * date:        2022-06-05
 */

// register service workers for PWA
if ('serviceWorker' in navigator && get_cookie(OFFLINE_COOKIE, OFFLINE_DEFAULT) === 'on')
{
    navigator.serviceWorker.register('pwa.js')
        .then(reg => {
            reg.onupdatefound = () => {
                // TODO: figure out how to listen for messages from reg.installing to determine new version
                let notification = document.getElementById('update_notification')
                notification.innerText = 'Update detected! Click here to apply it now.'
                notification.style.transform = 'translate(0%)'
                notification.style.visibility = 'visible'
                notification.onclick = event => {
                    location.reload()
                }
            }
        })
}
else if ('serviceWorker' in navigator)
{
    navigator.serviceWorker.getRegistrations().then(function(registrations)
    {
        for(let registration of registrations)
        {
            registration.unregister()
        }
    })
}

// determine the desired page
var urlParams = new URLSearchParams(window.location.search)
const page = urlParams.get('page')

// load in requested page
let script = document.createElement('script')
script.src = `scripts/${page}.js`
if (!page)
{
    script.src = `scripts/setup.js`
}
document.head.appendChild(script)

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

window.addEventListener('load', event => {
    // basic browser detection
    let browser = 'Unknown'
    if (navigator.userAgent.includes('Chrome/'))
    {
        browser = 'Chrome'
    }
    else if (navigator.userAgent.includes('Firefox/'))
    {
        browser = 'Firefox'
    }
    else if (navigator.userAgent.includes('Safari/'))
    {
        browser = 'Safari'
    }

    if (browser !== 'Firefox')
    {
        // determine if the app is installed correctly
        let display_mode = 'standalone';
        if (window.matchMedia('(display-mode: browser)').matches) {
            display_mode = 'browser'
        }
        else if (window.matchMedia('(display-mode: minimal-ui)').matches) {
            display_mode = 'minimal-ui'
        }
        else if (window.matchMedia('(display-mode: fullscreen)').matches) {
            display_mode = 'fullscreen'
        }

        // if it's not show a warning notification
        if (display_mode !== 'standalone')
        {
            if (!sessionStorage.getItem('dismiss_warning'))
            {
                let title = typeof cfg.settings.title === 'undefined' ? 'WildRank' : cfg.settings.title
                let notification = document.getElementById('warning_notification')
                notification.innerText = `${title} is opened in ${display_mode}. Data may be lost!`
                notification.style.transform = 'translate(0%)'
                notification.style.visibility = 'visible'
                notification.onclick = event => {
                    // on Chrome and Safari give basic instruction on how to install
                    if (browser === 'Chrome')
                    {
                        alert(`To prevent future data loss install the app and open it from your app launcher.
    
Press the "Install ${title}" button on the home page.`)
                    }
                    else if (browser === 'Safari')
                    {
                        alert(`To prevent future data loss add ${title} to your home screen and open it from there.
    
In the share menu (box with up arrow), choose "Add to Home Screen", then press "Add".`)
                    }

                    // dismiss the warning for this session
                    sessionStorage.setItem('dismiss_warning', true)
                    notification.style.transform = 'translate(0%, 100%)'
                    notification.style.visibility = 'collapse'
                }
            }
        }
    }
  })

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

    if (cfg.settings.use_offline)
    {
        set_cookie(OFFLINE_COOKIE, 'on')
    }
    else if (cfg.settings.use_offline === false)
    {
        set_cookie(OFFLINE_COOKIE, 'off')
    }
    else
    {
        set_cookie(OFFLINE_COOKIE, OFFLINE_DEFAULT)
    }

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
    let role = get_parameter(ROLE_COOKIE, ROLE_DEFAULT)

    // determine whether to redirect to setup or home
    let url = 'index.html'
    if (page === 'setup' || (page === 'home' && role == ROLE_DEFAULT))
    {
        url += '?page=setup'
    }
    else
    {
        url += '?page=home'
        if (page === 'home')
        {
            set_cookie(ROLE_COOKIE, ROLE_DEFAULT)
        }
    }

    window_open(url, right ? '_blank' : '_self')
}