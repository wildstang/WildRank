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

// create config object, load in what is available, and set the theme
var cfg = new Config()
cfg.load_configs(on_config)

var dal

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
                let notification = document.getElementById('warning_notification')
                notification.innerText = `${cfg.title} is opened in ${display_mode}. Data may be lost!`
                notification.style.transform = 'translate(0%)'
                notification.style.visibility = 'visible'
                notification.onclick = event => {
                    // on Chrome and Safari give basic instruction on how to install
                    if (browser === 'Chrome')
                    {
                        alert(`To prevent future data loss install the app and open it from your app launcher.
    
Press the "Install ${cfg.title}" button on the home page.`)
                    }
                    else if (browser === 'Safari')
                    {
                        alert(`To prevent future data loss add ${cfg.title} to your home screen and open it from there.
    
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
    
    // load in data
    dal = new DAL(cfg.user.state.event_id)
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
    // determine whether to redirect to setup or home
    let url = 'index.html'
    if (['setup', 'matches', 'pits'].includes(page))
    {
        cfg.user.state.role = ''
        cfg.store_configs()
        url += '?page=setup'
    }
    else
    {
        url += '?page=home'
    }

    window_open(url, right ? '_blank' : '_self')
}

// open the updater page when u is pressed 5 times
var u_count = 0
document.onkeydown = function (e)
{
    if (e.key === 'u')
    {
        u_count++
        if (u_count === 5)
        {
            window_open('updater.html', '_self')
        }
    }
}