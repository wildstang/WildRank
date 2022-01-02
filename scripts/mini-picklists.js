/**
 * file:        mini-picklists.js
 * description: Builds a picklist within an existing interface.
 * author:      Liam Fruzyna
 * date:        2020-10-05
 */

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
    let list_text = `<tr><td>${build_dropdown('list_names', '', Object.keys(lists), default_op=name, onchange='select_list()', 'slim')}</td>`
    if (Object.keys(lists).includes(name))
    {
        list_text += `<td>${build_button('', 'Add to Top', `add_to('${name}', '')`, `remove_team('${name}', '')`, 'pick_item slim')}</td>`
        for (let team of lists[name])
        {
            let classes = 'pick_item slim'
            if (lists['picked'] && lists['picked'].includes(team))
            {
                classes += ' crossed_out'
            }
            // add team button
            list_text += `<td>${build_button('', team, `add_to('${name}', '${team}')`, `remove_team('${name}', '${team}')`, classes)}</td>`
        }
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