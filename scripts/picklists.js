/**
 * file:        picklists.js
 * description: Contains functions for the pick list page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-03-19
 */

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch simple event matches from localStorage. Initialize page contents.
 */
function init_page(contents_card, buttons_container)
{
    let first = populate_teams(false)
    if (first)
    {
        contents_card.innerHTML = '<img id="avatar"><h2>Add team <label id="team_num"></label>, <label id="team_name"></label>, to...</h2>'
        buttons_container.innerHTML = ''

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
        open_option(first)
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
 * function:    build_pick_lists
 * parameters:  selected list name
 * returns:     none
 * description: Builds HTML elements of all pick lists with buttons.
 */
function build_pick_lists(list_name='')
{
    // determine what list is currently selected
    if (!Object.keys(lists).includes(list_name))
    {
        if (document.getElementById('list_names'))
        {
            list_name = document.getElementById('list_names').value
        }
        if (!Object.keys(lists).includes(list_name) && Object.keys(lists).length > 0)
        {
            list_name = Object.keys(lists)[0]
        }
    }

    // rebuild dropdown
    let column_items = [ build_dropdown('list_names', '', Object.keys(lists), default_op=list_name, onchange='build_pick_lists()') ]
    
    // build selected list
    if (Object.keys(lists).length > 0)
    {
        column_items.push(build_button('', 'Add to Top', `add_to('${list_name}', '')`, `remove_team('${list_name}', '')`))
        lists[list_name].forEach(function (team)
        {
            let classes = ''
            if (lists['picked'] && lists['picked'].includes(team))
            {
                classes = 'crossed_out'
            }
            // add team button
            column_items.push(build_multi_button(team, '', [team, '✗'], [`add_to('${list_name}', '${team}')`, `cross_out('${list_name}', '${team}')`], classes, [`remove_team('${list_name}', '${team}')`]))
        })
    }

    // build page
    document.getElementById('buttons_container').innerHTML = build_column_frame('Pick List', column_items) + build_column_frame('New Pick List', [
        build_str_entry('pick_list_name', '', 'new pick list'),
        build_button('create_list', 'Create', 'create_list()')
    ])
    
    // save to localStorage
    localStorage.setItem(get_event_pick_lists_name(event_id), JSON.stringify(lists))
}