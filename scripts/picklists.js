/**
 * file:        picklists.js
 * description: Contains functions for the pick list page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-03-19
 */

// HTML template for a team option
const TEAM_BLOCK = "\
    <div id=\"team_TEAM_NUM\" class=\"pit_option\" onclick=\"open_team(TEAM_NUM)\">\
        <span class=\"long_option_number\">TEAM_NUM</span>\
    </div>"

// HTML template for pick list
const PICK_LIST = "<div id=\"NAME_list\" class=\"pick_list\">" +
                   BUTTON.replace(/ONCLICK/g, "add_to('NAME', '')")
                         .replace(/NAME/g, "NAME") + "LIST_ITEMS</div>"

// HTML template for new list
const CREATE_LIST = "<div id=\"create_new_list\" class=\"pick_list\">" +
                    STR_ENTRY.replace(/NAME/g, "New Pick List...")
                             .replace(/ID/g, "pick_list_name")
                             .replace(/VALUE/g, "new pick list") +
                    BUTTON.replace(/ONCLICK/g, "create_list()")
                          .replace(/NAME/g, "Create") + "</div>"

const CONTENTS = "<img id=\"avatar\"><h2>Add team <label id=\"team_num\"></label>, <label id=\"team_name\"></label>, to...</h2>"

const BUTTONS = "<div id=\"pick_lists\"></div>"

var teams
var lists = {}

/**
 * function:    open_team
 * parameters:  Selected team number
 * returns:     none
 * description: Completes right info pane for a given team number.
 */
function open_team(team_num)
{
    // build team header
    document.getElementById("avatar").src = get_avatar(team_num, event_id.substr(0,4))
    document.getElementById("team_num").innerHTML = team_num
    document.getElementById("team_name").innerHTML = get_team_name(team_num, event_id)

    // select team button
    document.getElementById("team_" + team_num).classList.add("selected")
    teams.forEach(function (team, index) {
        let number = team.team_number
        if (number != team_num && document.getElementById("team_" + number).classList.contains("selected"))
        {
            document.getElementById("team_" + number).classList.remove("selected")
        }
    })
}

/**
 * function:    remove_team
 * parameters:  list name, team number
 * returns:     none
 * description: Removes the clicked team from the containing list.
 */
function remove_team(name, team)
{
    lists[name].splice(lists[name].indexOf(team), 1);
    build_pick_lists()
}

/**
 * function:    add_to
 * parameters:  list name, team number
 * returns:     none
 * description: Adds the selected team to the selected list after the clicked team.
 */
function add_to(name, after_team)
{
    let team_num = document.getElementById("team_num").innerHTML
    if (team_num == after_team)
    {
        return
    }
    if (lists[name].includes(team_num))
    {
        //alert("Team " + team_num + " already exists in list \"" + name + "\"!")
        remove_team(name, team_num)
    }
    // insert team in list after clicked button (list name will return index of -1 so 0)
    lists[name].splice(lists[name].indexOf(after_team)+1, 0, team_num)
    build_pick_lists()
}

/**
 * function:    create_list
 * parameters:  none
 * returns:     none
 * description: Creates a new list, if it doesn't already exist.
 */
function create_list()
{
    let name = document.getElementById("pick_list_name").value
    if (Object.keys(lists).includes(name))
    {
        alert("List \"" + name + "\" already exists!")
    }
    else
    {
        // add empty array of list name
        lists[name] = []
        build_pick_lists()
    }
}

/**
 * function:    build_pick_lists
 * parameters:  none
 * returns:     none
 * description: Builds HTML elements of all pick lists with buttons.
 */
function build_pick_lists()
{
    let lists_text = ""
    Object.keys(lists).forEach(function (name, index)
    {
        // add list button
        lists_text += PICK_LIST.replace(/NAME/g, name)
        let list_text = ""
        lists[name].forEach(function (team, index)
        {
            // add team button
            list_text +=  BUTTON.replace(/ONCLICK/g, "add_to('" + name + "', '" + team + "')\" \
                                                      oncontextmenu=\"remove_team('" + name + "', '" + team + "'); return false")
                                .replace(/NAME/g, team)
        })
        lists_text = lists_text.replace(/LIST_ITEMS/g, list_text)
    })
    // add create list form and add to screen
    lists_text += CREATE_LIST
    document.getElementById("pick_lists").innerHTML = lists_text

    // save to localStorage
    localStorage.setItem(get_event_pick_lists_name(event_id), JSON.stringify(lists))
}

/**
 * function:    build_team_list
 * parameters:  none
 * returns:     none
 * description: Completes left select team pane with teams from event data.
 */
function build_team_list()
{
    let first = ""
    // iterate through team objs
    teams.forEach(function (team, index) {
        let number = team.team_number
        if (first == "")
        {
            first = number
        }

        // replace placeholders in template and add to screen
        document.getElementById("option_list").innerHTML += TEAM_BLOCK.replace(/TEAM_NUM/g, number)
    })
    open_team(first)
    scroll_to("option_list", "team_" + first)
}

/**
 * function:    load_event
 * parameters:  none
 * returns:     none
 * description: Fetch simple event teams and from localStorage.
 *              Build team list on load completion.
 */
function load_event()
{
    let file_name = get_event_teams_name(event_id)
    let preview = document.getElementById("preview")

    if (localStorage.getItem(file_name) != null)
    {
        preview.innerHTML = preview.innerHTML.replace(/CONTENTS/g, CONTENTS)
                                             .replace(/BUTTONS/g, BUTTONS)
        
        // load teams from localStorage and build team lists
        teams = JSON.parse(localStorage.getItem(file_name))
        build_team_list()

        // load lists in from localStorage, and build lists
        let name = get_event_pick_lists_name(event_id)
        if (file_exists(name))
        {
            lists = JSON.parse(localStorage.getItem(name))
        }
        build_pick_lists()
    }
    else
    {
        preview.innerHTML = preview.innerHTML.replace(/CONTENTS/g, "<h2>No Team Data Found</h2>Please preload event")
                                             .replace(/BUTTONS/g, "")
    }
}

// read parameters from URL
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)

// load event data on page load
load_event()