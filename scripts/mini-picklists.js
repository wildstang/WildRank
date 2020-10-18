/**
 * file:        mini-picklists.js
 * description: Builds a picklist within an existing interface.
 *              Functions also used for full picklists interface.
 * author:      Liam Fruzyna
 * date:        2020-10-05
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
 * function:    select_list
 * parameters:  selected list name
 * returns:     none
 * description: Display a list's teams when selected.
 */
function select_list(name='')
{
    // use first list name if dropdown isn't created
    if (name == '')
    {
        name = document.getElementById('list_names') == null ? Object.keys(lists)[0] : document.getElementById('list_names').value
    }
    // create new dropdown with current selection as default
    let list_text = `<tr><td>${build_dropdown('list_names', '', Object.keys(lists), default_op=name, onchange='select_list()')}</td>`
    if (Object.keys(lists).includes(name))
    {
        list_text += `<td>${build_button('', 'Add to Top', `add_to('${name}', '')`, `remove_team('${name}', '')`, 'pick_item')}</td>`
        lists[name].forEach(function (team, index)
        {
            // add team button
            list_text += `<td>${build_button('', team, `add_to('${name}', '${team}')`, `remove_team('${name}', '${team}')`, 'pick_item')}</td>`
        })
    }
    document.getElementById('teams').innerHTML = `${list_text}</tr>`
}

/**
 * function:    build_pick_lists
 * parameters:  selected list name
 * returns:     none
 * description: Builds HTML elements of all pick lists with buttons.
 */
function build_pick_lists(list_name='')
{
    let lists_text = `<table id="teams" style="overflow-x: scroll; display: block"></table>`
    document.getElementById('pick_lists').innerHTML = lists_text

    select_list(list_name)

    // save to localStorage
    localStorage.setItem(get_event_pick_lists_name(event_id), JSON.stringify(lists))
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