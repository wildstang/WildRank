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
const EVENT_DEFAULT = '2020ilch'
const USER_COOKIE = 'user_id'
const USER_DEFAULT = '120001'
const TYPE_COOKIE = 'type'
const TYPE_DEFAULT = MATCH_MODE
const POSITION_COOKIE = 'position'
const POSITION_DEFAULT = 0
const UPLOAD_COOKIE = 'upload_url'
const UPLOAD_DEFAULT = 'http://localhost:80'
const TBA_KEY = 'X-TBA-Auth-Key'
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
    set_cookie(cname, dvalue)
    return dvalue;
}

/**
 * function:    get_team_results
 * parameters:  results to filter, team number
 * returns:     list of results for team
 * description: Get all results for the current team.
 */
function get_team_results(results, team)
{
    let files = Object.keys(results)
    let team_results = {}
    for (let file of files)
    {
        let parts = file.split('-')
        let number = parseInt(parts[parts.length - 1])
        // determine files which start with the desired type
        if (file.startsWith(prefix) && number == team)
        {
            team_results[file] = results[file]
        }
    }
    return team_results
}

/**
 * function:    get_match_results
 * parameters:  results to filter, match number
 * returns:     list of results for match
 * description: Get all results for the current match.
 */
function get_match_results(results, match)
{
    let files = Object.keys(results)
    let match_results = {}
    for (let file of files)
    {
        let parts = file.split('-')
        let number = parseInt(parts[parts.length - 2])
        // determine files which start with the desired type
        if (file.startsWith(prefix) && number == match)
        {
            match_results[file] = results[file]
        }
    }
    return match_results
}

/**
 * function:    get_scouter_results
 * parameters:  results to filter, scouter id
 * returns:     list of results from a scouter
 * description: Get all results from the given scouter.
 */
function get_scouter_results(results, user)
{
    let files = Object.keys(results)
    let user_results = {}
    for (let file of files)
    {
        let id = results[file]['meta_scouter_id']
        // determine files which start with the desired type
        if (file.startsWith(prefix) && id == user)
        {
            user_results[file] = results[file]
        }
    }
    return user_results
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
    let sorted = values.sort()
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
 * function:    get_results
 * parameters:  file prefix, event year
 * returns:     object of results
 * description: Gets all results which start with the given prefix.
 */
function get_results(prefix, year)
{
    let results = {}
    let files = Object.keys(localStorage)
    for (let file of files)
    {
        // determine files which start with the desired type
        if (file.startsWith(prefix))
        {
            let res = JSON.parse(localStorage.getItem(file))
            if (prefix.startsWith(MATCH_MODE))
            {
                res = add_smart_stats(res, year)
            }
            results[file] = res
        }
    }
    return results
}

/**
 * function:    get_match
 * parameters:  match number, current event, competition leve, set number
 * returns:     match object
 * description: Gets the match object from event data.
 */
function get_match(match_num, event, comp_level='qm', set_num=1)
{
    let matches = JSON.parse(localStorage.getItem(get_event_matches_name(event)))
    if (matches && matches.length > 0)
    {
        let results = matches.filter(match => match.match_number == match_num && match.comp_level == comp_level && match.set_number == set_num)
        if (results && results.length > 0)
        {
            return results[0]
        }
    }
    return null
}

/**
 * function:    get_match
 * parameters:  match name, current event
 * returns:     match object
 * description: Gets the match object from event data.
 */
function parse_match(match_name, event)
{
    let match_num = match_name
    let level = 'qm'
    let set_num = 1
    if (isNaN(match_num))
    {
        if (match_num[0] == 'F')
        {
            level = 'f'
            match_num = match_num.substr(1)
        }
        else
        {
            level = match_num.substr(0, 2).toLowerCase()
            set_num = match_num[2]
            match_num = match_num[3]
        }
    }
    return get_match(match_num, event, level, set_num)
}

/**
 * function:    get_team
 * parameters:  team number, current event
 * returns:     team object
 * description: Gets the team object from event data.
 */
function get_team(team_num, event)
{
    let teams = JSON.parse(localStorage.getItem(get_event_teams_name(event)))
    if (teams && teams.length > 0)
    {
        let results = teams.filter(team => team.team_number == team_num)
        if (results && results.length > 0)
        {
            return results[0]
        }
    }
    return null
}

/**
 * function:    get_team_name
 * parameters:  team number, current event
 * returns:     team name
 * description: Gets the team name from the team number.
 */
function get_team_name(team_num, event)
{
    let team = get_team(team_num, event)
    if (team)
    {
        return team.nickname
    }
    return 'team not found'
}

/**
 * function:    get_team_location
 * parameters:  team number, current event
 * returns:     team location
 * description: Gets the team location from the team number.
 */
function get_team_location(team_num, event)
{
    let team = get_team(team_num, event)
    if (team)
    {
        return `${team.city}, ${team.state_prov}, ${team.country}`
    }
    return 'team not found'
}

/**
 * function:    get_team_rankings
 * parameters:  team number, current event
 * returns:     team rankings object
 * description: Gets the team rankings from the team number.
 */
function get_team_rankings(team_num, event)
{
    let rankings = JSON.parse(localStorage.getItem(get_event_rankings_name(event)))
    if (rankings && rankings.length > 0)
    {
        let results = rankings.filter(rank => rank.team_key == `frc${team_num}`)
        if (results && results.length > 0)
        {
            return results[0]
        }
    }
    return null
}

/**
 * function:    is_match_scouted
 * parameters:  current event, match number
 * returns:     true if there are any results for the given match
 * description: Determines if a given event-match has any results available.
 */
function is_match_scouted(event, match)
{
    return Object.keys(localStorage).filter(f => f.startsWith(get_match_result(match, '', event))).length > 0
}

/**
 * function:    get_avatar
 * parameters:  team number, year to choose
 * returns:     source of team avatar
 * description: Fetches the team's avatar string from localStorage and return that or the dozer image if it can't be found.
 */
function get_avatar(team_num, year)
{
    let b64img = localStorage.getItem(get_team_avatar_name(team_num, year))
    if (b64img == null || b64img == 'undefined')
    {
        return 'config/dozer.png'
    }
    return `data:image/png;base64,${b64img}`
}

/**
 * function:    get_match_teams
 * parameters:  match number, event id
 * returns:     all teams in match
 * description: Returns all teams in the match with their alliances.
 */
function get_match_teams(match_num, event_id, comp_level='qm', set_num=1)
{
    let match = get_match(match_num, event_id, comp_level, set_num)
    return extract_match_teams(match)
}

/**
 * function:    extract_match_teams
 * parameters:  match
 * returns:     all teams in match
 * description: Returns all teams in the match with their alliances.
 */
function extract_match_teams(match)
{
    let teams = {}
    let red_teams = match.alliances.red.team_keys
    let blue_teams = match.alliances.blue.team_keys
    for (let t in red_teams)
    {
        teams[`red${parseInt(t)+1}`] = red_teams[t].substr(3)
    }
    for (let t in blue_teams)
    {
        teams[`blue${parseInt(t)+1}`] = blue_teams[t].substr(3)
    }
    return teams
}

/**
 * function:    notes_taken
 * parameters:  match number, event id
 * returns:     if notes have been taken
 * description: Determines if any notes have been take for a given match.
 */
function notes_taken(match_num, event_id, comp_level='qm', set_num=1)
{
    let teams = Object.values(get_match_teams(match_num, event_id, comp_level, set_num))
    for (let i = 0; i < teams.length; ++i)
    {
        if (file_exists(get_note(teams[i], match_num, event_id)))
        {
            return true
        }
    }
    return false
}

/**
 * function:    get_event_matches_name
 * parameters:  event id
 * returns:     event matches filename
 * description: Fetches the event's matches filename from localStorage.
 */
function get_event_matches_name(event_id)
{
    return `matches-${event_id}`
}

/**
 * function:    get_event_teams_name
 * parameters:  event id
 * returns:     event teams filename
 * description: Fetches the event's teams filename from localStorage.
 */
function get_event_teams_name(event_id)
{
    return `teams-${event_id}`
}

/**
 * function:    get_event_rankings_name
 * parameters:  event id
 * returns:     event rankings filename
 * description: Fetches the event's rankings filename from localStorage.
 */
function get_event_rankings_name(event_id)
{
    return `rankings-${event_id}`
}

/**
 * function:    get_event_zebra_name
 * parameters:  event id
 * returns:     event zebra data filename
 * description: Fetches the filename for an event's zebra from localStorage.
 */
function get_event_zebra_name(event_id)
{
    return `zebra-${event_id}`
}

/**
 * function:    get_team_avatar_name
 * parameters:  team number, year
 * returns:     team avatar filename
 * description: Fetches the team's avatar filename from localStorage.
 */
function get_team_avatar_name(team_num, year)
{
    return `avatar-${year}-${team_num}`
}

/**
 * function:    get_team_image_name
 * parameters:  team number, event, full resolution image
 * returns:     team image filename
 * description: Fetches the team's image filename from localStorage.
 */
function get_team_image_name(team_num, event, full_res=false)
{
    return `image-${event}-${team_num}${full_res ? '-full' : ''}`
}

/**
 * function:    get_pit_result
 * parameters:  team number, event id
 * returns:     pit result filename
 * description: Fetches the filename for a teams pit result from localStorage.
 */
function get_pit_result(team_num, event_id)
{
    return `${PIT_MODE}-${event_id}-${team_num}`
}

/**
 * function:    get_match_result
 * parameters:  match number, team number, event id
 * returns:     team match result filename
 * description: Fetches the filename for a team's match result from localStorage.
 */
function get_match_result(match_num, team_num, event_id)
{
    return `${MATCH_MODE}-${event_id}-${match_num}-${team_num}`
}

/**
 * function:    get_note
 * parameters:  team number, match number, event id
 * returns:     team notes filename
 * description: Fetches the filename for a team's notes from localStorage.
 */
function get_note(team_num, match_num, event_id)
{
    return `${NOTE_MODE}-${event_id}-${match_num}-${team_num}`
}

/**
 * function:    get_event_pick_lists_name
 * parameters:  event id
 * returns:     event pick lists filename
 * description: Fetches the filename for an event's pick lists from localStorage.
 */
function get_event_pick_lists_name(event_id)
{
    return `picklists-${event_id}`
}

/**
 * function:    file_exists
 * parameters:  filename
 * returns:     if the file exists in localStorage
 * description: Determines if the given filename exists in localStorage.
 */
function file_exists(filename)
{
    let val = localStorage.getItem(filename)
    return val != null && val != false
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
        document.getElementById('header').style.background = get_config('theme')['primary-color']
        document.getElementById('header').style['background-size'] = ''
        document.getElementById('header').style.animation = ''
    }
}

/**
 * function:    add_smart_stats
 * parameters:  match result, event year
 * returns:     the result with smart stats added
 * description: Add the smart stats to a given match result.
 */
function add_smart_stats(result, year)
{
    let stats = get_config('smart-stats')[year]
    return add_given_smart_stats(result, stats)
}

function add_given_smart_stats(result, stats)
{
    let md = get_result_meta(MATCH_MODE, result['meta_event_id'].substr(0,4))
    
    for (let stat of stats)
    {
        let id = stat.id
        switch (stat.type)
        {
            case 'sum':
                let total = 0
                for (let k of stat.keys)
                {
                    total += result[k]
                }
                result[id] = total
                break
            case 'percent':
                result[id] = result[stat.numerator] / (result[stat.numerator] + result[stat.denominator])
                if (isNaN(result[id]))
                {
                    result[id] = 0
                }
                break
            case 'ratio':
                if (result[stat.denominator] != 0)
                {
                    result[id] = result[stat.numerator] / result[stat.denominator]
                }
                else
                {
                    result[id] = result[stat.numerator]
                }
                break
            // exclusively for cycle
            case 'where':
                let count = typeof stat.sum === 'undefined' || !stat.sum
                let value = 0
                let denominator = 0
                let percent = typeof stat.denominator !== 'undefined'
                for (let cycle of result[stat.cycle])
                {
                    let passed = true
                    for (let key of Object.keys(stat.conditions))
                    {
                        if (cycle[key] != md[key].options.indexOf(stat.conditions[key]))
                        {
                            passed = false
                        }
                    }
                    if (passed)
                    {
                        if (count)
                        {
                            value++
                        }
                        else
                        {
                            value += cycle[stat.sum]
                        }
                        if (percent)
                        {
                            denominator += cycle[stat.denominator]
                        }
                    }
                }

                // store smart stat
                if (percent)
                {
                    result[id] = value / (value + denominator)
                    if (isNaN(result[id]))
                    {
                        result[id] = 0
                    }
                }
                else
                {
                    result[id] = value
                }
                break
        }
    }
    return result
}

/**
 * function:    avg_results
 * parameters:  results container, column to sum, type of input, type of ordering, options for input
 * returns:     average of all results
 * description: Average all the results for a given column.
 */
function avg_results(results, key, type, sort_type, options=[])
{
    let values = []
    let keys = Object.keys(results)
    for (let name of keys)
    {
        if (!isNaN(results[name][key]))
        {
            values.push(results[name][key])
        }
    }
    switch (type)
    {
        // compute mode for non-numerics
        case 'checkbox':
        case 'select':
        case 'dropdown':
        case 'unknown':
            if (options.length > 0)
            {
                let counts = {}
                for (let i in options)
                {
                    counts[options[i]] = values.filter(val => val == i).length
                }
                return counts
            }
            return mode(values)
        // don't attempt to use strings
        case 'string':
        case 'text':
        case 'cycle':
            return '---'
        // compute average for numbers
        case 'counter':
        case 'multicounter':
        case 'number':
        default:
            switch (sort_type)
            {
                // median
                case 1:
                    return median(values)
                // mode
                case 2:
                    return mode(values)
                // min
                case 3:
                    return Math.min(... values)
                // max
                case 4:
                    return Math.max(... values)
                // std dev
                case 5:
                    return std_dev(values)
                // mean
                case 0:
                default:
                    return mean(values)
            }
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
    if (get_config('settings').time_format == 12)
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
 * function:    get_teams_format
 * parameters:  event id
 * returns:     object containing number of teams
 * description: Counts the number of teams for each alliance at an event.
 */
function get_teams_format(event_id)
{
    let format = {}
    let matches_file = localStorage.getItem(get_event_matches_name(event_id))
    if (matches_file != null)
    {
        let matches = JSON.parse(matches_file)
        if (matches && matches.length > 0)
        {
            let m = matches[0]
            format = {
                red:    m.alliances.red.team_keys.length,
                blue:   m.alliances.red.team_keys.length
            }
            format.total = format.red + format.blue
        }
    }
    return format
}

/**
 * function:    get_team_keys
 * parameters:  event id
 * returns:     list of team position keys
 * description: Builds a list of team position keys for an event.
 */
function get_team_keys(event_id)
{
    let keys = []
    let teams = get_teams_format(event_id)
    if (teams.red && teams.blue)
    {
        for (let i = 1; i <= teams.red; i++)
        {
            keys.push(`Red ${i}`)
        }
        for (let i = 1; i <= teams.blue; i++)
        {
            keys.push(`Blue ${i}`)
        }
    }
    return keys
}

/**
 * function:    count_results
 * parameters:  event id, scouting type
 * returns:     number of results
 * description: Determines how many results of a given type and event exist.
 */
function count_results(event_id, type)
{
    let count = 0
    let files = Object.keys(localStorage)
    for (let file of files)
    {
        if (file.startsWith(`${type}-${event_id}-`))
        {
            ++count
        }
    }
    return count
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