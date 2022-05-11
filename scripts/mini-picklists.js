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
        name = document.getElementById('list_names') == null ? Object.keys(dal.picklists)[0] : document.getElementById('list_names').value
    }
    // create new dropdown with current selection as default
    let dropdown = new Dropdown('list_names', '', Object.keys(dal.picklists), name)
    dropdown.onclick = 'select_list()'
    dropdown.add_class('slim')
    let list_text = `<tr><td>${dropdown.toString}</td>`
    if (Object.keys(dal.picklists).includes(name))
    {
        let top = new Button('', 'Add to Top', `add_to('${name}', '')`)
        top.onsecondary = `remove_team('${name}', '')`
        top.add_class('pick_item')
        top.add_class('slim')
        list_text += `<td>${top.toString}</td>`
        for (let team of dal.picklists[name])
        {
            let classes = 'pick_item slim'
            if (dal.picklists['picked'] && dal.picklists['picked'].includes(team))
            {
                classes += ' crossed_out'
            }
            // add team button
            let entry = new Button('', team, `add_to('${name}', '${team}')`)
            entry.onsecondary = `remove_team('${name}', '${team}')`
            entry.add_class(classes)
            list_text += `<td>${entry.toString}</td>`
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
    dal.save_picklists()
}