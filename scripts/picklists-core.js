/**
 * file:        picklist-core.js
 * description: Contains functions used for picklists interfaces.
 * author:      Liam Fruzyna
 * date:        2020-10-18
 */

var lists = {}

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
    build_pick_lists(name)
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
    build_pick_lists(name)
}

/**
 * function:    cross_out
 * parameters:  team number
 * returns:     none
 * description: Toggles the selected team's crossed out status across all picklists.
 */
function cross_out(name, team)
{
    if (!Object.keys(lists).includes('picked'))
    {
        lists['picked'] = []
    }
    
    if (lists['picked'].includes(team))
    {
        lists['picked'].splice(lists['picked'].indexOf(team), 1);
    }
    else
    {
        lists['picked'].push(team)
    }

    build_pick_lists(name)
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
        build_pick_lists(name)
    }
}

/**
 * function:    setup_picklists
 * parameters:  none
 * returns:     none
 * description: Fetches picklists from localstorage and populates picklist div.
 */
function setup_picklists()
{
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