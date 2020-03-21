/**
 * file:        utils.js
 * description: Contains utility functions for various sections of the web app.
 * author:      Liam Fruzyna
 * date:        2020-03-04
 */

/**
 * function:    build_query
 * parameters:  map of query keys to values
 * returns:     query string
 * description: Builds a query string from a given object.
 */
function build_query(query)
{
    let str = "?"
    for (var key in query)
    {
        if (str != "?")
        {
            str += "&"
        }
        str += key + "=" + query[key]
    }
    return str
}

const EVENT_COOKIE = "event_id"
const EVENT_DEFAULT = "2020ilch"
const USER_COOKIE = "user_id"
const USER_DEFAULT = "120001"
const TYPE_COOKIE = "type"
const TYPE_DEFAULT = "match"
const POSITION_COOKIE = "position"
const POSITION_DEFAULT = 0
const UPLOAD_COOKIE = "upload_url"
const UPLOAD_DEFAULT = "http://localhost:80"
const TBA_KEY = "X-TBA-Auth-Key"

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
    if (typeof value !== "undefined")
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
    d.setTime(d.getTime() + (7*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

/**
 * function:    get_cookie
 * parameters:  name of cookie, default value
 * returns:     value of named cookie or default value
 * description: Returns the value of the requested cookie.
 */
function get_cookie(cname, dvalue)
{
    var name = cname + "=";
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
    files.forEach(function (file, index)
    {
        let parts = file.split("-")
        let number = parseInt(parts[parts.length - 1])
        // determine files which start with the desired type
        if (file.startsWith(prefix) && number == team)
        {
            team_results[file] = results[file]
        }
    })
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
    files.forEach(function (file, index)
    {
        let parts = file.split("-")
        let number = parseInt(parts[parts.length - 2])
        // determine files which start with the desired type
        if (file.startsWith(prefix) && number == match)
        {
            match_results[file] = results[file]
        }
    })
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
    files.forEach(function (file, index)
    {
        let parts = file.split("-")
        let id = results[file]["meta_scouter_id"]
        // determine files which start with the desired type
        if (file.startsWith(prefix) && id == user)
        {
            user_results[file] = results[file]
        }
    })
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
    return values.reduce((a, b) => a + b, 0) / values.length
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
    values.forEach(function (val, index)
    {
        // increase count of value if it exists already
        if (Object.keys(counts).includes(val.toString())) counts[val]++
        // start count of value if it has not been added yet
        else counts[val] = 1

        // if this was a most frequent increase the max count
        if (counts[val] > counts[maxVal]) maxVal = val
    })
    return maxVal
}

/**
 * function:    scroll_to
 * parameters:  scrollable element, goal item
 * returns:     none
 * description: Scrolls a given element so another can be seen.
 */
function scroll_to(container, goal)
{
    var offset = document.getElementById(goal).getBoundingClientRect().top - document.getElementById(container).getBoundingClientRect().top

    if(offset > window.innerHeight)
    {
        document.getElementById(container).scrollBy(0, offset)
    }
}

/**
 * function:    get_team_name
 * parameters:  team number, current event
 * returns:     team name
 * description: Gets the team name from the team number.
 */
function get_team_name(team_num, event)
{
    return JSON.parse(localStorage.getItem("teams-" + event)).filter(team => team.team_number == team_num)[0].nickname
}

/**
 * function:    get_avatar
 * parameters:  team number, year to choose
 * returns:     source of team avatar
 * description: Fetches the team's avatar string from localStorage and return that or the dozer image if it can't be found.
 */
function get_avatar(team_num, year)
{
    let b64img = localStorage.getItem("image-" + year + "-" + team_num)
    if (b64img == null)
    {
        return "/config/dozer.png"
    }
    return "data:image/png;base64," + b64img
}

/**
 * function:    get_event_matches_name
 * parameters:  event id
 * returns:     event matches filename
 * description: Fetches the event's matches filename from localStorage.
 */
function get_event_matches_name(event_id)
{
    return "matches-" + event_id
}

/**
 * function:    get_event_teams_name
 * parameters:  event id
 * returns:     event teams filename
 * description: Fetches the event's teams filename from localStorage.
 */
function get_event_teams_name(event_id)
{
    return "teams-" + event_id
}

/**
 * function:    get_team_avatar_name
 * parameters:  team number, year
 * returns:     team avatar filename
 * description: Fetches the team's avatar filename from localStorage.
 */
function get_team_avatar_name(team_num, year)
{
    return "image-" + year + "-" + team_num
}

/**
 * function:    get_pit_result
 * parameters:  team number, event id
 * returns:     pit result filename
 * description: Fetches the filename for a teams pit result from localStorage.
 */
function get_pit_result(team_num, event_id)
{
    return "pit-" + event_id + "-" + team_num
}

/**
 * function:    get_match_result
 * parameters:  match number, team number, event id
 * returns:     team match result filename
 * description: Fetches the filename for a team's match result from localStorage.
 */
function get_match_result(match_num, team_num, event_id)
{
    return "match-" + event_id + "-" + match_num + "-" + team_num
}

/**
 * function:    get_notes
 * parameters:  match number, event id
 * returns:     team notes filename
 * description: Fetches the filename for a team's notes from localStorage.
 */
function get_notes(match_num, event_id)
{
    return "notes-" + event_id + "-" + match_num
}

/**
 * function:    get_event_pick_lists_name
 * parameters:  event id
 * returns:     event pick lists filename
 * description: Fetches the filename for an event's pick lists from localStorage.
 */
function get_event_pick_lists_name(event_id)
{
    return "pick-lists-" + event_id
}

/**
 * function:    file_exists
 * parameters:  filename
 * returns:     if the file exists in localStorage
 * description: Determines if the given filename exists in localStorage.
 */
function file_exists(filename)
{
    return localStorage.getItem(filename) != null
}