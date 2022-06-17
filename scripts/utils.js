/**
 * file:        utils.js
 * description: Contains utility functions for various sections of the web app.
 * author:      Liam Fruzyna
 * date:        2020-03-04
 */

const MATCH_MODE = 'match'
const PIT_MODE   = 'pit'
const NOTE_MODE  = 'note'

const EVENT_COOKIE = 'event_id'
const EVENT_DEFAULT = '2022new'
const USER_COOKIE = 'user_id'
const USER_DEFAULT = '120001'
const TYPE_COOKIE = 'type'
const TYPE_DEFAULT = MATCH_MODE
const POSITION_COOKIE = 'position'
const POSITION_DEFAULT = 0
const UPLOAD_COOKIE = 'upload_url'
const UPLOAD_DEFAULT = 'http://localhost:80'
const TBA_AUTH_KEY = 'X-TBA-Auth-Key'
const THEME_COOKIE = 'theme'
const THEME_DEFAULT = 'light'
const ROLE_COOKIE = 'role'
const ROLE_DEFAULT = 'index'

/**
 * function:    window_open
 * parameters:  url, option
 * returns:     none
 * description: Opens in window if url is not empty.
 */
function window_open(url, option)
{
    if (url != '')
    {
        window.open(url, option)
    }
}
/**
 * function:    build_url
 * parameters:  page, map of query keys to values
 * returns:     url string
 * description: Builds a url string from a query given object.
 */
function build_url(page, query)
{
    return `${page}.html${build_query(query)}`
}

/**
 * function:    build_query
 * parameters:  map of query keys to values
 * returns:     query string
 * description: Builds a query string from a given object.
 */
function build_query(query)
{
    let str = '?'
    for (var key in query)
    {
        if (str != '?')
        {
            str += '&'
        }
        str += `${key}=${query[key]}`
    }
    return str
}

/**
 * function:    get_parameter
 * parameters:  desired key of parameter, default value of parameter
 * returns:     value of desired parameter or default
 * description: Attempt to get a parameter first as a URLSearchParam, then as a cookie.
 */
function get_parameter(key, dvalue)
{
    let urlParams = new URLSearchParams(window.location.search)
    let value = urlParams.get(key)
    if (typeof value !== 'undefined' && value)
    {
        return value
    }
    return get_cookie(key, dvalue)
}

/**
 * function:    set_cookie
 * parameters:  name of cookie, value of cookie
 * returns:     none
 * description: Creates a cookie with a given name and value, expires in 1 week.
 */
function set_cookie(cname, cvalue)
{
    var d = new Date();
    d.setTime(d.getTime() + (7*24*60*60*1000))
    var expires = `expires=${d.toUTCString()}`
    document.cookie = `${cname}=${cvalue};${expires};path=/;SameSite=Strict`
}

/**
 * function:    get_cookie
 * parameters:  name of cookie, default value
 * returns:     value of named cookie or default value
 * description: Returns the value of the requested cookie.
 */
function get_cookie(cname, dvalue)
{
    var name = `${cname}=`;
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++)
    {
        var c = ca[i];
        while (c.charAt(0) == ' ')
        {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0)
        {
            return c.substring(name.length, c.length);
        }
    }
    if (typeof dvalue !== 'undefined')
    {
        set_cookie(cname, dvalue)
    }
    return dvalue;
}

/**
 * function:    mean
 * parameters:  array of values
 * returns:     mean of given values
 * description: Calculates the mean of a given array of values.
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
 * function:    std_dev
 * parameters:  array of values
 * returns:     standard deviation of given values
 * description: Calculates the standard deviation of a given array of values. 
 */
function std_dev(values)
{
    if (values.length == 0)
    {
        return 0
    }
    return Math.sqrt(values.map(x => Math.pow(x - mean(values), 2)).reduce((a, b) => a + b) / values.length)
}

/**
 * function:    median
 * parameters:  array of values
 * returns:     median of given values
 * description: Calculates the median of a given array of values.
 */
function median(values)
{
    let sorted = values.sort((a,b ) => a - b)
    return sorted[Math.floor(sorted.length / 2)]
}

/**
 * function:    mode
 * parameters:  array of values
 * returns:     mode of given values
 * description: Calculates the mode of a given array of values.
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

/**
 * function:    random_bool
 * parameters:  odds of producing a 0
 * returns:     random boolean
 * description: Generates a random boolean.
 */
function random_bool(low_odds=0.5)
{
    return Math.random() >= low_odds
}

/**
 * function:    random_int
 * parameters:  minimum and maximum result
 * returns:     random integer from min to max
 * description: Generates a random integer between two given bounds.
 */
function random_int(min=0, max=10)
{
    return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * function:    distance
 * parameters:  2 pairs of x, y coordinates
 * returns:     distance between 2 coordinates
 * description: Calculates the distance between 2 x, y coordinates.
 */
function distance(x1, y1, x2, y2)
{
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
}

/**
 * function:    contained
 * parameters:  list of vertices of shape, x, y coordinate of point
 * returns:     if the shape is container
 * description: Determines if a given point is contained in a shape.
 */
function contained(vertices, x, y)
{
    let above = 0
    let below = 0
    // check which side of each line point is on
    for (let i = 0; i < vertices.length; i++)
    {
        // get last vertices to make line
        let j = i - 1
        if (j < 0)
        {
            j = vertices.length - 1
        }

        let vx = vertices[i].x
        let vy = vertices[i].y
        let lvx = vertices[j].x
        let lvy = vertices[j].y
        
        // determine if lines will intersect at all
        if ((vx - x) * (lvx - x) < 0)
        {
            // build line formula and calculate intersecting y of line
            let m = (vy - lvy) / (vx - lvx)
            let b = -m * vx + vy
            let ly = m * x + b
    
            // determine if point is above of below
            if (y < ly)
            {
                above++
            }
            else if (y > ly)
            {
                below++
            }
            // if point is on line, it is inside
            else
            {
                return true
            }
        }
    }

    // point is inside if there are an odd number of lines on each side of it
    return above % 2 == 1 && below % 2 == 1
}

/**
 * function:    scroll_to
 * parameters:  scrollable element, goal item
 * returns:     none
 * description: Scrolls a given element so another can be seen.
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
 * function:    ws
 * parameters:  team number
 * returns:     none
 * description: Makes the header rainbow, if 111 is the team number.
 */
function ws(team_num)
{
    if (team_num == '111' || team_num == '112')
    {
        document.getElementById('header').style.background = 'linear-gradient(124deg, #1ddde8, #2b1de8, #dd00f3, #dd00f3, #ff2400, #e81d1d, #e8b71d, #e3e81d, #1de840)'
        document.getElementById('header').style['background-size'] = '3600% 3600%'
        document.getElementById('header').style.animation = 'rainbow 36s ease infinite'
    }
    else
    {
        document.getElementById('header').style.background = cfg.theme['primary-color']
        document.getElementById('header').style['background-size'] = ''
        document.getElementById('header').style.animation = ''
    }
}

/**
 * function:    unix_to_match_time
 * paramters:   unix timestamp
 * returns:     Time in format Day Hour:Minute
 * description: Converts a given unix timestamp to Day Hour:Minute.
 */
function unix_to_match_time(unix_time)
{
    let time = new Date(unix_time * 1000)
    let mins = `${time.getMinutes()}`
    if (mins.length == 1)
    {
        mins = `0${mins}`
    }
    let hours = `${time.getHours()}`
    if (hours.length == 1)
    {
        hours = `0${hours}`
    }
    let day = ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'][time.getDay()]
    let part = ''
    if (cfg.settings.time_format === 12)
    {
        if (hours > 12)
        {
            hours -= 12
            part = 'PM'
        }
        else
        {
            part = 'AM'
        }
    }
    return `${day} ${hours}:${mins} ${part}`
}

/**
 * function:    parse_server_addr
 * parameters:  URL
 * returns:     The web server's address
 * description: Removes the path from the end of a URL.
 */
function parse_server_addr(addr)
{
    let slash = addr.indexOf('/', 8)
    let dot = addr.lastIndexOf('.')
    if (slash > -1 && dot > 0 && slash < dot)
    {
        addr = addr.substr(0, addr.lastIndexOf('/'))
    }
    if (addr.endsWith('/'))
    {
        addr = addr.substr(0, addr.length - 1)
    }
    if (addr.includes('?'))
    {
        addr = addr.substr(0, addr.indexOf('?'))
    }
    return addr
}

/**
 * function:    check_server
 * parameters:  Server address, whether to notify on error
 * returns:     If the server is the custom Python web server.
 * description: Determines if the server is the custom Python web server, if it is not alerts the user.
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
 * function:    include
 * parameters:  script name
 * returns:     none
 * description: Includes a script by name.
 */
function include(name)
{
    let s = document.createElement('script')
    s.src = `scripts/${name}.js`
    document.head.appendChild(s)
}

/**
 * function:    apply_theme
 * parameters:  none
 * returns:     none
 * description: Applys the current theme to page.
 */
function apply_theme()
{
    // read title from config
    document.title = cfg.settings.title
    document.getElementById('title').innerHTML = cfg.settings.title

    let theme = cfg.theme
    if (get_cookie(THEME_COOKIE, THEME_DEFAULT) === 'dark')
    {
        theme = cfg.dark_theme
    }
    let keys = Object.keys(theme)
    for (let key of keys)
    {
        document.documentElement.style.setProperty(`--${key}`, theme[key])
    }
}