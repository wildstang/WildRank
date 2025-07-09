/**
 * file:        mini-picklists.js
 * description: Builds a picklist within an existing interface.
 * author:      Liam Fruzyna
 * date:        2020-10-05
 */

include('picklists-core')

var picklist_dropdown

/**
 * Opens a given picklist at the bottom of the page.
 * @param {String} name Picklist name
 */
function select_list(name='')
{
    // use first list name if dropdown isn't created
    if (name == '')
    {
        name = picklist_dropdown == null ? Object.keys(dal.picklists)[0] : picklist_dropdown.element.value
    }
    // create new dropdown with current selection as default
    picklist_dropdown = new WRDropdown('', Object.keys(dal.picklists), name)
    picklist_dropdown.on_change = () => select_list()
    picklist_dropdown.add_class('slim')
    let table = document.getElementById('mpl-teams')
    table.replaceChildren()
    let row = table.insertRow()
    row.insertCell().append(picklist_dropdown)
    if (Object.keys(dal.picklists).includes(name))
    {
        let top = new WRButton('Add to Top', () => add_to(name, ''))
        top.on_right = () => remove_team(name, '')
        top.add_class('pick_item')
        top.add_class('slim')
        row.insertCell().append(top)
        for (let team of dal.picklists[name])
        {
            let classes = ['pick_item', 'slim']
            if (dal.picklists['picked'] && dal.picklists['picked'].includes(team))
            {
                classes.push('crossed_out')
            }
            // add team button
            let entry = new WRButton(team, () => add_to(name, team))
            entry.on_right = () => remove_team(name, team)
            for (let c of classes)
            {
                entry.add_class(c)
            }
            row.insertCell().append(entry)
        }
    }
}

/**
 * Populates the bottom picklist viewer with available picklists.
 * @param {String} list_name Picklist to default to
 */
function build_pick_lists(list_name='first_default')
{
    // don't show picklists UI if there are no lists
    if (Object.keys(dal.picklists).length > 0)
    {
        let lists_text = create_element('table', 'mpl-teams')
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