/**
 * file:        utils.js
 * description: Contains utility functions for various sections of the web app.
 * author:      Liam Fruzyna
 * date:        2020-03-04
 */

/**
 * function:    get_selected_option
 * parameters:  ID of selected item
 * returns:     none
 * description: Returns the selected index of the given select.
 */
function get_selected_option(id)
{
    let children = document.getElementById(id).getElementsByClassName("wr_select_option")
    let i = 0
    for (let option of children)
    {
        if (option.classList.contains("selected"))
        {
            return i
        }
        ++i
    }
    return -1
}

/**
 * function:    merge_results
 * parameters:  none
 * returns:     Combined object of all files of a type
 * description: Combines all files of the currently selected type into a single CSV file.
 */
function merge_results(header)
{
    let type = get_type()
    // get all files in localStorage
    let files = Object.keys(localStorage)
    let combo = ""
    files.forEach(function (file, index)
    {
        let parts = file.split("-")
        // determine files which start with the desired type
        if (parts[0] == type)
        {
            let results = JSON.parse(localStorage.getItem(file))
            // assumes all files are formatted the same
            if (header)
            {
                start = "team,"
                if (type == "match")
                {
                    start = "match,team,"
                }
                combo += start + Object.keys(results).join(",")
                header = false
            }
            start = parts[2]
            if (type == "match")
            {
                start += "," + parts[3]
            }
            combo += start + "," + Object.values(results).join(",")
                
            // add as a field to the object named by the file name
            combo[file] = localStorage.getItem(file)
        }
    })
    return combo
}

/**
 * function:    select_option
 * parameters:  ID of the selector, index of the newly selected option
 * returns:     none
 * description: Select a given option in a selector.
 */
function select_option(id, index)
{
    let children = document.getElementById(id).getElementsByClassName("wr_select_option")
    for (let option of children)
    {
        option.classList.remove("selected")
    }
    document.getElementById(id + "-" + index).classList.add("selected")
}

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