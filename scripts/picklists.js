/**
 * file:        picklists.js
 * description: Contains functions for the pick list page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-03-19
 */

include('picklists-core')

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch simple event matches from localStorage. Initialize page contents.
 */
function init_page()
{
    let first = populate_teams(false)
    if (first)
    {
        contents_card.innerHTML = `<img id="avatar">
                                    <h2><label id="team_num"></label> <label id="team_name"></label></h2>
                                    <h4>Belongs to:</h4>
                                    <span id="belongs_to"></span>`
        buttons_container.innerHTML = ''

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
        open_option(first)
    }
    else
    {
        contents_card.innerHTML = '<h2>No Team Data Found</h2>Please preload event'
    }
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
    document.getElementById('team_name').innerHTML = dal.get_value(team_num, 'meta.name')

    let belongs_to = []
    if (Object.keys(dal.picklists).length > 0)
    {
        belongs_to = Object.keys(dal.picklists).filter(l => dal.picklists[l].includes(team_num))
    }
    document.getElementById('belongs_to').innerHTML = belongs_to.join(', ')

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
    if (!Object.keys(dal.picklists).includes(list_name))
    {
        if (document.getElementById('list_names'))
        {
            list_name = document.getElementById('list_names').value
        }
        if (!Object.keys(dal.picklists).includes(list_name) && Object.keys(dal.picklists).length > 0)
        {
            list_name = Object.keys(dal.picklists)[0]
        }
    }

    let list = new ColumnFrame('', 'Pick List')

    // rebuild dropdown
    let dropdown = new Dropdown('list_names', '', Object.keys(dal.picklists), list_name)
    dropdown.onclick = 'build_pick_lists()'
    list.add_input(dropdown)
    
    // build selected list
    if (Object.keys(dal.picklists).length > 0)
    {
        let match_filter = []
        let card = new Card('', `<center>${dal.picklists[list_name].length} Teams<center>`)
        list.add_input(card)
        let top = new Button('', 'Add to Top', `add_to('${list_name}', '')`)
        top.onsecondary = `remove_team('${list_name}', '')`
        list.add_input(top)
        for (let team of dal.picklists[list_name])
        {
            let classes = ''
            if (dal.picklists['picked'] && dal.picklists['picked'].includes(team))
            {
                classes = 'crossed_out'
            }
            else
            {
                match_filter.push(team)
            }
            // add team button
            let entry = new MultiButton(team, '')
            entry.add_option(`${team} ${dal.get_value(team, 'meta.name')}`, `add_to('${list_name}', '${team}')`, `remove_team('${list_name}', '${team}')`)
            entry.add_option('✗', `cross_out('${list_name}', '${team}')`)
            entry.add_class(classes)
            list.add_input(entry)
        }

        // add secondary list for picklist matches
        populate_matches(false, true, match_filter, true)
    }

    let new_list = new ColumnFrame('', 'New Pick List')
    let new_name = new Entry('pick_list_name', '', 'new pick list')
    new_list.add_input(new_name)
    let new_button = new Button('create_list', 'Create', 'create_list()')
    new_list.add_input(new_button)

    // build page
    buttons_container.innerHTML = list.toString + new_list.toString
    
    // save to localStorage
    dal.save_picklists()
}