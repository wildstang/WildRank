/**
 * file:        multipicklists.js
 * description: Contains functions for the pick list page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2023-01-01
 */

include('picklists-core')
include('transfer')

var avatar_el, team_el, name_el, lists_el, mode_el, table_card

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch simple event matches from localStorage. Initialize page contents.
 */
function init_page()
{
    header_info.innerText = 'Picklists'

    let first = populate_teams(false)
    if (first)
    {
        avatar_el = document.createElement('img')
        avatar_el.className = 'avatar'
        let header = document.createElement('h2')
        team_el = create_element('label', 'team_num')
        name_el = document.createElement('label')
        header.append(team_el, ' ', name_el)
        let belongs = document.createElement('h4')
        belongs.innerText = 'Belongs to:'
        lists_el = document.createElement('span')
        let card = new WRCard([avatar_el, header, belongs, lists_el], true)

        // remove empty lists on page load
        let names = Object.keys(dal.picklists)
        for (let list of names)
        {
            if (dal.picklists[list].length == 0)
            {
                delete dal.picklists[list]
            }
        }

        // build page
        table_card = new WRCard('')
        table_card.add_class('scalable_card')
        let new_list_el = new WRButton('Add to New List', new_list)
        mode_el = new WRSelect('', ['Add', 'Strike', 'Remove'])
        let export_button = new WRButton('Export Lists', export_picklists)
        let column = new WRColumn('', [new_list_el, table_card, mode_el, export_button])
        preview.append(card, new WRPage('', [column]))

        build_pick_lists()
        open_option(first)
    }
    else
    {
        add_error_card('No Team Data Found', 'Please preload event')
    }
}

/**
 * function:    new_list
 * parameters:  none
 * returns:     none
 * description: Creates a new list containing the current team.
 */
function new_list()
{
    let team = team_el.innerText
    dal.picklists['New List'] = [team]
    build_pick_lists('New List', 0, 'New List')
}

/**
 * function:    mark_team
 * parameters:  pick list name, team number
 * returns:     none
 * description: Cross off or remove a team based on the remove checkbox.
 */
function mark_team(list, team)
{
    let mode = mode_el.selected_index
    console.log(list, team, mode)
    switch (mode)
    {
        case 0:
            add_to(list, team)
            break
        case 1:
            cross_out(list, team)
            break
        case 2:
            remove_team(list, team)
            break
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
    avatar_el.src = dal.get_value(team_num, 'pictures.avatar')
    team_el.innerHTML = team_num
    name_el.innerHTML = dal.get_value(team_num, 'meta.name')

    let belongs_to = []
    if (Object.keys(dal.picklists).length > 0)
    {
        belongs_to = Object.keys(dal.picklists).filter(l => dal.picklists[l].includes(team_num))
    }
    lists_el.innerHTML = belongs_to.join(', ')

    // select team button
    document.getElementById(`left_pit_option_${team_num}`).classList.add('selected')
    ws(team_num)
}

function build_pick_lists(highlight='', list_num=0, rename='')
{
    let columns = []
    let longest = 2
    for (let list of Object.keys(dal.picklists))
    {
        let length = dal.picklists[list].length
        let column = [...dal.picklists[list]]
        column.unshift(`${length} Teams`)
        column.unshift(list)
        columns.push(column)
        if (length + 2 > longest)
        {
            longest = length + 2
        }
    }

    let table = create_element('table', 'pick_list_table')
    let match_filter = []
    for (let i = 0; i < longest; i++)
    {
        let row = table.insertRow()
        for (let column of columns)
        {
            let list = column[0]
            if (i === 0)
            {
                let selected = ''
                if (highlight === list)
                {
                    selected = 'selected ' 
                }
                row.insertCell()
                if (rename === list)
                {
                    let name = create_element('input', `new_name_${list}`)
                    name.type = 'text'
                    name.value = list
                    name.onchange = (event) => rename_list(list)

                    let cell = row.insertCell()
                    cell.className = selected
                    cell.oncontextmenu = (event) => { remove_list(list); return false }
                    cell.ontouchstart = (event) => touch_start()
                    cell.ontouchmove = (event) => touch_move()
                    cell.ontouchend = (event) => touch_end(() => remove_list(list))
                    cell.append(name)
                }
                else
                {
                    let header = create_header(list)
                    header.onclick = (event) => build_pick_lists(list, 0, list)
                    header.className = selected
                    row.append(header)
                }
            }
            else if (column.length > i)
            {
                let avatar_cell = row.insertCell()
                avatar_cell.onclick = (event) => mark_team(list, team)

                let team = column[i]
                let classes = []
                if (i > 1)
                {
                    classes.push('team_cell')

                    let avatar = document.createElement('img')
                    avatar.className = 'avatar'
                    avatar.src = dal.get_value(team, 'pictures.avatar')
                    avatar_cell.append(avatar)
                }
                if (dal.picklists['picked'] && dal.picklists['picked'].includes(team))
                {
                    classes.push('crossed_out')
                }
                else if (highlight === list)
                {
                    match_filter.push(team)
                }
                let cell = row.insertCell()
                cell.onclick = (event) => mark_team(list, team)
                cell.classList.add(...classes)
                cell.innerText = team
            }
            else
            {
                row.insertCell()
                row.insertCell()
            }
        }
    }
    table_card.element.replaceChildren(table)

    // add secondary list for picklist matches
    let prev_right = 'flex'
    let right = document.getElementById('right')
    if (right !== null && right.style.display)
    {
        prev_right = right.style.display
    }
    populate_matches(false, true, match_filter, true)
    right.style.display = prev_right
    
    // save to localStorage
    dal.save_picklists()
}

/**
 * function:    remove_list
 * parameters:  list name
 * returns:     none
 * description: Removes a given list and rebuilds the page.
 */
function remove_list(list)
{
    if (confirm(`Delete "${list}"?`))
    {
        delete dal.picklists[list]
        build_pick_lists()
    }
}

/**
 * function:    export_picklists
 * parameters:  none
 * returns:     none
 * description: Starts the zip export process for picklists.
 */
function export_picklists()
{
    let handler = new ZipHandler()
    handler.picklists = true
    handler.user = get_cookie(USER_COOKIE, USER_DEFAULT)
    handler.export_zip()
}