/**
 * file:        utils.js
 * description: Contains utility functions for various sections of the web app.
 * author:      Liam Fruzyna
 * date:        2020-03-04
 */

const MODE_QUERY = 'scout-mode'
const TBA_AUTH_KEY = 'X-TBA-Auth-Key'

//
// URL Functions
//

/**
 * Opens a given URL.
 * @param {String} url URL to open, does nothing if blank
 * @param {Boolean} new_tab Whether to open the URL in a new tab
 */
function window_open(url, new_tab=false)
{
    if (url != '')
    {
        window.open(url, new_tab ? '_blank' : '_self')
    }
}

/**
 * Assembles a URL path for within the application.
 * @param {String} page Name of the page to load.
 * @param {Object} parameters Key value pairs to include in the query string.
 * @returns An assembled URL path.
 */
function build_url(page, parameters={})
{
    let query = ''
    for (let key in parameters)
    {
        query += `&${key}=${parameters[key]}`
    }
    return `index.html?page=${page}${query}`
}

/**
 * Gets a URL query parameter from URLSearchParam.
 * @param {String} key Parameter key
 * @param {String} dvalue Default parameter if not provided
 * @returns Provided query value or default
 */
function get_parameter(key, dvalue)
{
    let urlParams = new URLSearchParams(window.location.search)
    let value = urlParams.get(key)
    if (typeof value !== 'undefined' && value)
    {
        return value
    }
    return dvalue
}

/**
 * Removes the path from a given URL.
 * @param {String} addr URL
 * @returns Base server address
 */
function parse_server_addr(addr)
{
    let slash = addr.indexOf('/', 8)
    let dot = addr.lastIndexOf('.')
    if (slash > -1 && dot > 0 && slash < dot)
    {
        addr = addr.substring(0, addr.lastIndexOf('/'))
    }
    if (addr.includes('?'))
    {
        addr = addr.substring(0, addr.indexOf('?'))
    }
    if (addr.endsWith('/'))
    {
        addr = addr.substring(0, addr.length - 1)
    }
    return addr
}

/**
 * Determines whether the server supports WildRank features.
 * @param {String} server Server URL
 * @param {Boolean} notify Whether to notify the user
 * @returns Whether the server is a POST server
 */
function check_server(server, notify=true)
{
    try
    {
        // send request to /about
        let check_addr = `${parse_server_addr(server)}/about`
        var req = new XMLHttpRequest()
        req.open('GET', check_addr, false)
        req.send(null)

        // confirm Python server
        if (req.responseText.includes('POST server'))
        {
            return true
        }
        else
        {
            console.log('Feature is only supported on Python server.')
            if (notify)
            {
                alert('This server does not support this feature!')
            }
            return false
        }
    }
    catch (e)
    {
        console.log('Unable to communicate with this server.')
        if (notify)
        {
            alert('Unable to find a compatible server!')
        }
        return false
    }
}

/**
 * Links a specified stylesheet.
 * @param {String} name 
 */
function link(name)
{
    let s = document.createElement('link')
    s.rel = 'stylesheet'
    s.type = 'text/css'
    if (name.startsWith('https://'))
    {
        s.href = name
        s.crossOrigin = ''
    }
    else
    {
        s.href = `styles/${name}.css`
    }
    document.head.appendChild(s)
}

/**
 * Links a specified script.
 * @param {String} name 
 */
function include(name)
{
    let s = document.createElement('script')
    if (name.startsWith('https://'))
    {
        s.src = name
        s.crossOrigin = ''
    }
    else
    {
        s.src = `scripts/lib/${name}.js`
    }
    document.head.appendChild(s)
}

//
// Statistical Methods
//

/**
 * Computes the mean of a given array of values.
 * @param {Array} values Array of numbers
 * @returns Mean of the provided values
 */
function mean(values)
{
    if (values.length == 0)
    {
        return 0
    }
    return values.reduce((a, b) => a + b, 0) / values.length
}

/**
 * Computes the standard deviation of a given array of values.
 * @param {Array} values Array of numbers
 * @returns Standard deviation of the provided values
 */
function std_dev(values)
{
    if (values.length == 0)
    {
        return 0
    }
    let avg = mean(values)
    return Math.sqrt(values.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b) / values.length)
}

/**
 * Computes the median of a given array of values.
 * @param {Array} values Array of numbers
 * @returns Median of the provided values
 */
function median(values)
{
    let sorted = values.sort((a,b ) => a - b)
    return sorted[Math.floor(sorted.length / 2)]
}

/**
 * Computes the mode of a given array of values.
 * @param {Array} values Array of values
 * @returns Mode of the provided values
 */
function mode(values)
{
    let counts = {}
    let maxVal = values[0]
    for (let val of values)
    {
        if (val == null)
        {
            val = 'null'
        }
        // increase count of value if it exists already
        if (Object.keys(counts).includes(val.toString())) counts[val]++
        // start count of value if it has not been added yet
        else counts[val] = 1

        // if this was a most frequent increase the max count
        if (counts[val] > counts[maxVal]) maxVal = val
    }
    return maxVal
}

//
// Random Functions
//

/**
 * Generates a random boolean.
 * @param {Number} low_odds Odds to produce a 0
 * @returns Random boolean value
 */
function random_bool(low_odds=0.5)
{
    return Math.random() >= low_odds
}

/**
 * Generates a random integer.
 * @param {Number} min Minimum allowed value
 * @param {Number} max Maximum allowed value
 * @returns Random int value
 */
function random_int(min=0, max=10)
{
    return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generates a random floating point number.
 * @param {Number} min Minimum allowed value
 * @param {Number} max Maximum allowed value
 * @returns Random float value
 */
function random_float(min=0, max=10)
{
    return Math.random() * (max - min) + min
}

/**
 * Randomly generate a hex string of a given number of characters.
 *  
 * @param {int} length Number of hex character to generate.
 * @returns A hex string of length length.
 */
function random_hex(length)
{
    let arr = new Array(length).fill(0)
    return arr.map(() => Math.floor(Math.random(0.999) * 16).toString(16)).join('')
}

//
// Page Functions
//

/**
 * Scrolls a given container so the given element is visible.
 * @param {HTMLElement} container Scrollable element
 * @param {HTMLElement} goal Target element
 */
function scroll_to(container, goal)
{
    // non-blanking spaces make it crash
    // avoid these in selection options
    if (goal.includes('&nbsp;'))
    {
        return
    }
    let option_top = document.getElementById(goal).getBoundingClientRect().top
    let container_top = document.getElementById(container).getBoundingClientRect().top
    let option_bottom = document.getElementById(goal).getBoundingClientRect().bottom
    let container_bottom = document.getElementById(container).getBoundingClientRect().bottom
    let offset_top = option_top - container_top
    let offset_bottom = option_bottom - container_bottom

    if(offset_bottom > 0)
    {
        document.getElementById(container).scrollBy(0, offset_bottom)
    }
    else if(offset_top < 0)
    {
        document.getElementById(container).scrollBy(0, offset_top)
    }
}

/**
 * Provides the header color easter egg for the given team.
 * @param {Number} team_num Team number
 */
function ws(team_num)
{
    let header = document.getElementById('header')
    if (team_num == '111')
    {
        header.style.background = 'linear-gradient(124deg, #1ddde8, #2b1de8, #dd00f3, #dd00f3, #ff2400, #e81d1d, #e8b71d, #e3e81d, #1de840)'
        header.style['background-size'] = '3600% 3600%'
        header.style.animation = 'rainbow 36s ease infinite'
    }
    else if (team_num == '112')
    {
        header.style.background = 'linear-gradient(124deg, #1ddde8, #2b1de8)'
        header.style['background-size'] = '3600% 3600%'
        header.style.animation = 'rainbow 9s ease infinite'
    }
    else
    {
        let color = cfg.theme['primary-color']
        if (cfg.user.settings.use_team_color)
        {
            //color = dal.get_value(team_num, 'meta.color')
        }
        header.style.background = color
        header.style['background-size'] = ''
        header.style.animation = ''
    }
}

/**
 * Applies the configured theme to the page.
 */
function apply_theme()
{
    // read title from config
    document.title = cfg.title
    if (document.getElementById('title') !== null)
    {
        document.getElementById('title').innerHTML = cfg.title
    }

    let theme = cfg.theme
    let keys = Object.keys(theme)
    for (let key of keys)
    {
        document.documentElement.style.setProperty(`--${key}`, theme[key])
    }
}

/**
 * Prompts the user to choose between the given results.
 * @param {Array} metas Metadata for results to choose from
 * @param {String} op Operation that will be performed on the selected result
 * @returns Chosen result index or -1
 */
function prompt_for_result(metas, op)
{
    if (metas.length > 1)
    {
        let descriptions = metas.map((r, i) => {
            let scouter = cfg.get_name(r.scouter.user_id)
            let time = new Date(r.scouter.start_time).toLocaleTimeString("en-US")
            return `${i}: ${scouter} @ ${time}`
        })
        let choice = prompt(`${metas.length} results found. Please choose a result to ${op}:\n${descriptions.join('\n')}`)
        if (choice !== null)
        {
            let index = parseInt(choice)
            if (index < metas.length)
            {
                return index
            }
        }
        return -1
    }
    return 0
}

//
// Caching Functions
//

/**
 * Computes a hash from a given string.
 * Based on this SO answer: https://stackoverflow.com/a/52171480
 * @param {String} str Any string
 * @returns Calculated has
 */
function hash(str)
{
    let h1 = 0x00000000
    let h2 = 0x00000000
    for (let i = 0, ch; i < str.length; i++)
    {
        ch = str.charCodeAt(i)
        h1 = Math.imul(h1 ^ ch, 2654435761)
        h2 = Math.imul(h2 ^ ch, 1597334677)
    }
    h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909)
    h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909)
    let hash = 4294967296 * (2097151 & h2) + (h1>>>0)
    return hash.toString(16)
}

/**
 * Adds a given file to the cache at the given URL
 * @param {String} url URL of file to cache
 * @param {String} file File contents
 */
async function cache_file(url, file)
{
    // get latest cache
    let current = 'default'
    let names = await caches.keys()
    if (names.length > 0)
    {
        current = names[0]
    }
    let cache = await caches.open(current)

    // TODO override res.url and res.type
    // set content type by file extension
    let headers = new Headers()
    headers.append('Content-Length', file.size)
    switch (url.substring(url.lastIndexOf('.') + 1))
    {
        case 'js':
            headers.append('Content-Type', 'application/javascript')
            break
        case 'html':
            headers.append('Content-Type', 'text/html; charset=utf-8')
            break
        case 'css':
            headers.append('Content-Type', 'text/css; charset=utf-8')
            break
        case 'ico':
            headers.append('Content-Type', 'image/x-icon')
            break
        case 'png':
            headers.append('Content-Type', 'image/png')
            break
        case 'jpg':
            headers.append('Content-Type', 'image/jpeg')
            break
        case 'svg':
            headers.append('Content-Type', 'image/svg+xml')
            break
        case 'json':
            headers.append('Content-Type', 'application/json')
            break
        case 'webmanifest':
            headers.append('Content-Type', 'application/manifest')
            break
        case 'zip':
            headers.append('Content-Type', 'application/zip')
            break
        default:
            return
    }

    // build response and add to cache
    let res = new Response(file, { statusText: 'OK', headers: headers })
    cache.put(new URL(url), res)
}

//
// String Functions
//

/**
 * Sanitizes a given name to generate an ID.
 * @param {String} name Input name
 * @returns Valid ID
 */
function create_id_from_name(name)
{
    return name.toLowerCase()
               .replaceAll(/\(.*\)/g, '') // remove parenthesis
               .replaceAll(/[- ]/g, '_')  // replace spaces and hyphens with underscores
               .replaceAll(/__+/g, '_')   // prevent repeated underscores
               .replaceAll(/\W+/g, '')    // remove any non-alphanumeric or underscore character
}

/**
 * Captialize the first letter of a given word.
 * 
 * @param {string} word A string containing a single word.
 * @returns The given word in lower case with the first character in uppercase.
 */
function capitalize(word)
{
    return word.charAt(0).toUpperCase() + word.substring(1).toLowerCase()
}

/**
 * Pluralizes a given word.
 * @param {String} word A string containing a single word.
 * @returns The plural form of the word.
 */
function pluralize(word)
{
    if (['s', 'x', 'z'].includes(word.substring(word.length - 1)) || ['ch', 'sh'].includes(word.substring(word.length - 2)))
    {
        return word + 'es'
    }
    else if (word.endsWith('y'))
    {
        return word.substring(0, word.length - 1) + 'ies'
    }
    return word + 's'
}

//
// User Agent Functions
//

/**
 * Determines the browser based on the userAgent.
 * @returns Browser name
 */
function get_browser()
{
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
    return browser
}

/**
 * Determines which display-mode the web app is opened in.
 * @return Display mode
 */
function get_display_mode()
{
    let display_mode = 'standalone'
    if (window.matchMedia('(display-mode: browser)').matches)
    {
        display_mode = 'browser'
    }
    else if (window.matchMedia('(display-mode: minimal-ui)').matches)
    {
        display_mode = 'minimal-ui'
    }
    else if (window.matchMedia('(display-mode: fullscreen)').matches)
    {
        display_mode = 'fullscreen'
    }
    return display_mode
}

//
// Position Functions
//

/**
 * Converts a given position index to a string.
 * @param {Number} pos Position index
 * @returns String representation of position
 */
function position_to_name(pos)
{
    return pos < 3 ? `Red ${pos + 1}` : `Blue ${pos - 2}`
}

/**
 * Runs position_to_name for every position.
 * @returns Array of position names
 */
function get_position_names()
{
    let names = []
    for (let i = 0; i < 6; ++i)
    {
        names.push(position_to_name(i))
    }
    return names
}