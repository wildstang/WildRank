/**
 * file:        picklists.js
 * description: Contains functions for the pick list page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-03-19
 */

var lists = {}

// read parameters from URL
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch simple event matches from localStorage. Initialize page contents.
 */
function init_page(contents_card, buttons_container)
{
    let file_name = get_event_teams_name(event_id)
    if (localStorage.getItem(file_name) != null)
    {
        contents_card.innerHTML = '<img id="avatar"><h2>Add team <label id="team_num"></label>, <label id="team_name"></label>, to...</h2>'
        buttons_container.innerHTML = '<div id="pick_lists"></div>'
        
        // load teams from localStorage and build team lists
        teams = JSON.parse(localStorage.getItem(file_name))
        build_team_list(teams)

        // load lists in from localStorage, and build lists
        let name = get_event_pick_lists_name(event_id)
        if (file_exists(name))
        {
            lists = JSON.parse(localStorage.getItem(name))
            // remove empty lists on page load
            Object.keys(lists).forEach(function (list, index)
            {
                if (lists[list].length == 0)
                {
                    delete lists[list]
                }
            })
        }
        build_pick_lists()
    }
    else
    {
        contents_card.innerHTML = '<h2>No Team Data Found</h2>Please preload event'
    }
}

/**
 * function:    build_team_list
 * parameters:  teams
 * returns:     none
 * description: Completes left select team pane with teams from event data.
 */
function build_team_list(teams)
{
    let first = ''
    // iterate through team objs
    teams.forEach(function (team, index) {
        let number = team.team_number
        if (first == '')
        {
            first = number
        }

        // replace placeholders in template and add to screen
        document.getElementById('option_list').innerHTML += build_option(number)
    })
    open_option(first)
    scroll_to('option_list', `option_${first}`)
}

/**
 * function:    open_option
 * parameters:  Selected team number
 * returns:     none
 * description: Completes right info pane for a given team number.
 */
function open_option(team_num)
{
    deselect_all()

    // build team header
    document.getElementById('avatar').src = get_avatar(team_num, event_id.substr(0,4))
    document.getElementById('team_num').innerHTML = team_num
    document.getElementById('team_name').innerHTML = get_team_name(team_num, event_id)

    // select team button
    document.getElementById(`option_${team_num}`).classList.add('selected')
    ws(team_num)
}

/**
 * function:    remove_team
 * parameters:  list name, team number
 * returns:     none
 * description: Removes the clicked team from the containing list.
 */
function remove_team(name, team)
{
    if (team !== '')
    {
        lists[name].splice(lists[name].indexOf(team), 1);
    }
    else if (confirm(`Are you sure you want to delete "${name}"`))
    {
        delete lists[name]
    }
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
    let team_num = document.getElementById('team_num').innerHTML
    if (team_num == after_team)
    {
        return
    }
    if (lists[name].includes(team_num))
    {
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
    let name = document.getElementById('pick_list_name').value
    if (Object.keys(lists).includes(name))
    {
        alert(`List "${name}" already exists!`)
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
    let lists_text = ''
    Object.keys(lists).forEach(function (name, index)
    {
        // add list button
        let list_text = ''
        lists[name].forEach(function (team, index)
        {
            // add team button
            list_text += build_button('', team, `add_to('${name}', '${team}')`, `remove_team('${name}', '${team}')`)
        })
        lists_text += `<div id="${name}_list" class="pick_list">${build_button(`list_${name}`, name, `add_to('${name}', '')`, `remove_team('${name}', '')`)}${list_text}</div>`
    })
    // add create list form and add to screen
    lists_text += `<div id="create_new_list" class="pick_list">
            ${build_str_entry("pick_list_name", "New Pick List...", "new pick list")}
            ${build_button("create_list", "Create", "create_list()")}
        </div>`
    document.getElementById('pick_lists').innerHTML = lists_text

    // save to localStorage
    localStorage.setItem(get_event_pick_lists_name(event_id), JSON.stringify(lists))
}