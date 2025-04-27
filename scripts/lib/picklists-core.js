/**
 * file:        picklist-core.js
 * description: Contains functions used for picklists interfaces.
 * author:      Liam Fruzyna
 * date:        2020-10-18
 */

/**
 * Removes a given team from the given list.
 * @param {String} name Picklist name
 * @param {Number} team Team number
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
 * Adds the current team to the given list after the given team.
 * @param {String} name Picklist name
 * @param {Number} after_team Team number to follow
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
 * Crosses out a given team to the given list.
 * @param {String} name Picklist name
 * @param {Number} team Team number
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
 * Creates a new picklist.
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
 * Renames the given picklist to the currently entered name.
 * @param {String} old_name List to be renamed.
 */
function rename_list(old_name)
{
    let new_name = document.getElementById(`new_name_${old_name}`).value
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
 * Deletes empty picklists and triggers building of the interface.
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