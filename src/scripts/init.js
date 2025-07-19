/**
 * file:        init.js
 * description: The first Javascript that runs on any page load.
 * author:      Liam Fruzyna
 * date:        2022-06-05
 */

// create config object, load in what is available, and set the theme
var cfg = new Config()
cfg.load_configs(on_config)

var dal

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
    dal = new Data(cfg.user.state.event_id)
    dal.load_data()

    // don't directly pass in init_page to ensure that init_page isn't accessed before the page is loaded in
    run_after_load(() => init_page())
}

var header_info, preview, pick_lists
var left_list, left_filter
var right_list, right_filter

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
    if ('serviceWorker' in navigator && cfg.user.settings !== undefined && cfg.user.settings.use_offline)
    {
        let notification = document.getElementById('update_notification')

        // handle incoming message from the serviceWorker
        navigator.serviceWorker.addEventListener('message', e => {
            if (e.data.msg === 'version')
            {
                let version = e.data.version

                // if the update banner is shown, assume the version is the newly installled version
                if (notification.style.visibility === 'visible')
                {
                    notification.innerText = `${version} installed. Click here to reload.`
                    notification.onclick = () => location.reload()
                }
                else
                {
                    cfg.app_version = version.replace('wildrank-', '')
                }
            }
        })

        navigator.serviceWorker.register('/pwa.js')
            .then(reg => {
                console.log('serviceWorker registered')

                reg.onupdatefound = () => {
                    if (reg.installing)
                    {
                        // pop-up the notification banner
                        notification.innerText = 'Installing update...'
                        notification.style.transform = 'translate(0%)'
                        notification.style.visibility = 'visible'

                        // listen for install to complete, then request new version
                        reg.installing.onstatechange = () => {
                            if (reg.installing === null && reg.active)
                            {
                                reg.active.postMessage({msg: 'get_version'})
                            }
                        }
                    }
                }

                // request the current app version from the serviceWorker
                if (reg.active)
                {
                    console.log('requesting active version')
                    reg.active.postMessage({msg: 'get_version'})
                }
            })
    }
    else if ('serviceWorker' in navigator)
    {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (let reg of registrations)
            {
                reg.unregister()
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
 * @param {Boolean} right Whether a right click was used.
 */
function home(right=false)
{
    let start = window.location.href.lastIndexOf('/') + 1
    let current_page = window.location.href.substring(start)
    let home_page = get_role_page()

    if (current_page.startsWith(home_page))
    {
        cfg.set_role('')
        window_open(build_url('setup'), right)
    }
    else
    {
        window_open(home_page, right)
    }
}

/**
 * Creates a new card with a message in the header and a description below it.
 * @param {String} message Header message
 * @param {String} description Optional extended description
 */
function add_error_card(message, description='')
{
    let header = document.createElement('h2')
    header.textContent = message
    let details = document.createElement('span')
    details.textContent = description
    let card = new WRCard([header, details])
    preview.append(card)
}

// open the updater page when u is pressed 5 times
var u_count = 0
document.onkeydown = function (e)
{
    let offset = 0
    switch (e.key)
    {
        case 'u':
            u_count++
            if (u_count === 5)
            {
                window_open('updater.html')
            }
            break

        case 'ArrowUp':
            offset = -2
        case 'ArrowDown':
            offset += 1

            // find currently selected option
            let options = document.getElementById('option_list').children
            for (let i = 0; i < options.length; ++i)
            {
                if (options[i].classList.contains('selected'))
                {
                    // increment/decrement selected index by arrow press
                    let new_index = i + offset
                    // click on newly selected option and scroll
                    if (new_index >= 0 && new_index < options.length)
                    {
                        options[new_index].click()
                        scroll_to('option_list', options[new_index].id)
                        return false
                    }
                }
            }
            break
    }
}

run_after_load(function()
{
    // fix for selection pages being cut off by notch/home bar
    let iPad = navigator.userAgent.match(/iPad/) ||
                (navigator.userAgent.match(/Mac/) && navigator.maxTouchPoints && navigator.maxTouchPoints > 2)
    let iPhone = navigator.userAgent.match(/iPhone/) || navigator.platform == "iPhone"
    if (iPhone) {
        document.body.style.height = "93%"
    }
    else if (iPad) {
        document.body.style.height = "97%"
    }

    // build references for various page components
    header_info = document.getElementById('header_info')
    preview = document.getElementById('preview')
    pick_lists = document.getElementById('pick_lists')

    left_list = document.getElementById('option_list')
    left_filter = document.getElementById('filter')

    right_list = document.getElementById('secondary_option_list')
    right_filter = document.getElementById('secondary_filter')
})