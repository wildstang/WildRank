/**
 * file:        mini-picklists.js
 * description: Builds a picklist within an existing interface.
 * author:      Liam Fruzyna
 * date:        2020-10-05
 */

include('picklists-core')

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
    dropdown.on_change = 'select_list()'
    dropdown.add_class('slim')
    let table = document.getElementById('mpl-teams')
    table.replaceChildren()
    let row = table.insertRow()
    row.insertCell().append(dropdown.element)
    if (Object.keys(dal.picklists).includes(name))
    {
        let top = new Button('', 'Add to Top', `add_to('${name}', '')`)
        top.on_secondary = `remove_team('${name}', '')`
        top.add_class('pick_item')
        top.add_class('slim')
        row.insertCell().append(top.element)
        for (let team of dal.picklists[name])
        {
            let classes = ['pick_item', 'slim']
            if (dal.picklists['picked'] && dal.picklists['picked'].includes(team))
            {
                classes.push('crossed_out')
            }
            // add team button
            let entry = new Button('', team, `add_to('${name}', '${team}')`)
            entry.on_secondary = `remove_team('${name}', '${team}')`
            for (let c of classes)
            {
                entry.add_class(c)
            }
            row.insertCell().append(entry.element)
        }
    }
}

/**
 * function:    build_pick_lists
 * parameters:  selected list name, list number
 * returns:     none
 * description: Builds HTML elements of all pick lists with buttons.
 */
function build_pick_lists(list_name='first_default', i=0)
{
    // don't show picklists UI if there are no lists
    if (Object.keys(dal.picklists).length > 0)
    {
        let lists_text = document.createElement('table')
        lists_text.id = 'mpl-teams'
        document.getElementById('pick_lists').replaceChildren(lists_text)

        if (list_name === 'first_default')
        {
            list_name = ''
        }
        select_list(list_name)

        // save to localStorage
        dal.save_picklists()
    }
}