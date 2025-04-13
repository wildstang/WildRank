/**
 * file:        init.js
 * description: The first Javascript that runs on any page load.
 * author:      Liam Fruzyna
 * date:        2022-06-05
 */

// create config object, load in what is available, and set the theme
var cfg = new Config()
cfg.load_configs(on_config)

/**
 * Executes after the configuration has successfully loaded.
 */
function on_config()
{
    register_service_worker()

    run_after_load(trigger_install_warning)

    apply_theme()
    // listen for dark mode changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', apply_theme)
    
    // load in data
    dal = new DAL(cfg.user.state.event_id)
    dal.build_teams()

    // don't directly pass in init_page to ensure that init_page isn't accessed before the page is loaded in
    run_after_load(() => init_page())
}

var dal

// determine the requested page
var urlParams = new URLSearchParams(window.location.search)
var page = urlParams.get('page')
if (!page)
{
    page = 'setup'
}

// load in requested page
var script = document.createElement('script')
script.src = `scripts/page/${page}.js`
document.head.appendChild(script)

// create a listener just to track whether page has been loaded
var page_loaded = false
window.addEventListener('load', _ => page_loaded = true)

/**
 * Creates an event listener to run a given function onload, or immediately calls it if the page has already been loaded.
 * 
 * @param {Function} func Function to run after the page has been loaded.
 */
function run_after_load(func)
{
    if (page_loaded)
    {
        func()
    }
    else
    {
        window.addEventListener('load', func)
    }
}

/**
 * If the app is configured to run offline, register the serviceWorker and trigger a notification for any updates.
 * Otherwise, unregister the serviceWorker.
 */
function register_service_worker()
{
    if ('serviceWorker' in navigator && cfg.user.settings.use_offline)
    {
        navigator.serviceWorker.register('pwa.js')
            .then(reg => {
                reg.onupdatefound = () => {
                    console.log('update detected, triggering banner')

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

        console.log('serviceWorker registered')

        // request the current version from the serviceWorker
        if (navigator.serviceWorker.controller != null)
        {
            navigator.serviceWorker.controller.postMessage({msg: 'get_version'})
            navigator.serviceWorker.addEventListener('message', e => {
                if (e.data.msg === 'version')
                {
                    cfg.app_version = e.data.version.replace('wildrank-', '')
                }
            })
        }
    }
    else if ('serviceWorker' in navigator)
    {
        navigator.serviceWorker.getRegistrations().then(function(registrations)
        {
            for(let registration of registrations)
            {
                registration.unregister()
                console.log('serviceWorker unregistered')
            }
        })
    }
}

/**
 * Triggers a warning banner if the app isn't installed properly.
 */
function trigger_install_warning()
{
    if (get_browser() !== 'Firefox' && get_display_mode() !== 'standalone' && !sessionStorage.getItem('dismiss_warning'))
    {
        let notification = document.getElementById('warning_notification')
        notification.innerText = `${cfg.title} is not properly installed. Data may be lost!`
        notification.style.transform = 'translate(0%)'
        notification.style.visibility = 'visible'
        notification.onclick = _ => {
            // on Chrome and Safari give basic instruction on how to install
            if (browser === 'Chrome')
            {
                alert(`To prevent future data loss install the app and open it from your app launcher.

To install, press the "Install ${cfg.title}" button on the address bar.`)
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

/**
 * Handles clicking on the app title to navigate to the role/overall homepage based on current page.
 * 
 * @param {Boolean} right Whether a right click was used.
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