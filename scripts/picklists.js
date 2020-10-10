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
        buttons_container.innerHTML = '<div id="picklists"></div>'
        
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
 * function:    select_list
 * parameters:  none
 * returns:     none
 * description: Display a list's teams when selected.
 */
function selectList()
{
    // use first list name if dropdown isn't created
    let name = document.getElementById('list_names') == null ? Object.keys(lists)[0] : document.getElementById('list_names').value
    // create new dropdown with current selection as default
    let list_text = ''
    if (Object.keys(lists).includes(name))
    {
        list_text += build_button('', 'Add to Top', `add_to('${name}', '')`, `remove_team('${name}', '')`)
        lists[name].forEach(function (team, index)
        {
            // add team button
            list_text += build_button('', team, `add_to('${name}', '${team}')`, `remove_team('${name}', '${team}')`)
        })
    }
    document.getElementById('teams').innerHTML = list_text
}

/**
 * function:    build_pick_lists
 * parameters:  selected list name
 * returns:     none
 * description: Builds HTML elements of all pick lists with buttons.
 */
function build_pick_lists(list_name='')
{
    let lists_text = `<div class="pick_list">${build_dropdown('list_names', '', Object.keys(lists), default_op=list_name, onchange='selectList()')}<div id="teams"></div></div>`

    // add create list form and add to screen
    lists_text += `<div id="create_new_list" class="pick_list">
            ${build_str_entry("pick_list_name", "New Pick List...", "new pick list")}
            ${build_button("create_list", "Create", "create_list()")}
        </div>`
    document.getElementById('picklists').innerHTML = lists_text

    selectList()

    // save to localStorage
    localStorage.setItem(get_event_pick_lists_name(event_id), JSON.stringify(lists))
}