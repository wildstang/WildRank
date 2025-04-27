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
 * Populates the page with basic contents.
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
 * Creates a new list called "New List".
 */
function new_list()
{
    let team = team_el.innerText
    dal.picklists['New List'] = [team]
    build_pick_lists('New List', 'New List')
}

/**
 * Marks a team (add, cross out, remove) based on the current mode.
 * @param {String} list List name
 * @param {Number} team Team number
 */
function mark_team(list, team)
{
    let mode = mode_el.selected_index
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
 * Opens the given team number.
 * @param {Number} team_num Team number
 */
function open_option(team_num)
{
    deselect_all()

    // build team header
    avatar_el.src = dal.teams[team_num].avatar
    team_el.innerHTML = team_num
    name_el.innerHTML = dal.teams[team_num].name

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

/**
 * Builds a table of all the pick lists.
 * @param {String} highlight Selected picklist
 * @param {String} rename List currently selected to be renamed
 */
function build_pick_lists(highlight='', rename='')
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
                    avatar.src = dal.teams[team].avatar
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
 * Deletes the given picklist.
 * @param {String} list List name
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
 * Exports the picklists to a zip.
 * TODO: maybe just export a json file and add an import button
 */
function export_picklists()
{
    let handler = new ZipHandler()
    handler.picklists = true
    handler.user = cfg.user.state.user_id
    handler.export_zip()
}