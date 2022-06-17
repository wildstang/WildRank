/**
 * file:        picklist-core.js
 * description: Contains functions used for picklists interfaces.
 * author:      Liam Fruzyna
 * date:        2020-10-18
 */

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
        dal.picklists[name].splice(dal.picklists[name].indexOf(team), 1);
    }
    else if (confirm(`Are you sure you want to delete "${name}"`))
    {
        delete dal.picklists[name]
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
    if (dal.picklists[name].includes(team_num))
    {
        remove_team(name, team_num)
    }
    // insert team in list after clicked button (list name will return index of -1 so 0)
    dal.picklists[name].splice(dal.picklists[name].indexOf(after_team)+1, 0, team_num)
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
    if (!Object.keys(dal.picklists).includes('picked'))
    {
        dal.picklists['picked'] = []
    }
    
    if (dal.picklists['picked'].includes(team))
    {
        dal.picklists['picked'].splice(dal.picklists['picked'].indexOf(team), 1);
    }
    else
    {
        dal.picklists['picked'].push(team)
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
    if (Object.keys(dal.picklists).includes(name))
    {
        alert(`List "${name}" already exists!`)
    }
    else
    {
        // add empty array of list name
        dal.picklists[name] = []
        build_pick_lists(name)
    }
}

/**
 * function:    rename_list
 * parameters:  none
 * returns:     none
 * description: Renames the current picklist.
 */
function rename_list()
{
    let new_name = document.getElementById('new_name').value
    let old_name = document.getElementById('list_names').value
    if (Object.keys(dal.picklists).includes(new_name))
    {
        alert(`List "${new_name}" already exists!`)
    }
    else
    {
        // add empty array of list name
        dal.picklists[new_name] = dal.picklists[old_name]
        delete dal.picklists[old_name]
        build_pick_lists(new_name)
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
    // remove empty lists on page load
    let names = Object.keys(dal.picklists)
    for (let list of names)
    {
        if (dal.picklists[list].length == 0)
        {
            delete dal.picklists[list]
        }
    }
    build_pick_lists()
}