/**
 * file:        multipicklists.js
 * description: Contains functions for the pick list page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2023-01-01
 */

include('picklists-core')
include('transfer')

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
        let card = new Card('table_card', '')
        let new_list = new Button('new_list', 'Add to New List', 'new_list()')
        let remove = new Checkbox('remove_teams', 'Remove Teams')
        let export_button = new Button('export', 'Export Lists', 'export_picklists()')
        let column = new ColumnFrame('', '', [new_list, card, remove, export_button])
        buttons_container.innerHTML = new PageFrame('page', '', [column]).toString
        
        build_pick_lists()
        open_option(first)
    }
    else
    {
        contents_card.innerHTML = '<h2>No Team Data Found</h2>Please preload event'
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
    let team = document.getElementById('team_num').innerHTML
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
    if (document.getElementById('remove_teams').checked)
    {
        remove_team(list, team)
    }
    else
    {
        cross_out(list, team)
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
    document.getElementById('avatar').src = dal.get_value(team_num, 'pictures.avatar')
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

    let table = '<table id="pick_list_table">'
    let match_filter = []
    for (let i = 0; i < longest; i++)
    {
        table += '<tr>'
        for (let column of columns)
        {
            let list = column[0]
            if (i === 0)
            {
                let classes = ''
                if (highlight === list)
                {
                    classes += 'selected ' 
                }
                if (rename === list)
                {
                    table += `<td class="${classes}"><input id="new_name_${list}" type="text" value="${list}" onchange="rename_list('${list}')"></input></td>`
                }
                else
                {
                    table += `<th onclick="build_pick_lists('${list}', 0, '${list}')" class="${classes}">${list}</th>`
                }
            }
            else if (column.length > i)
            {
                let team = column[i]
                let classes = ''
                if (i > 1)
                {
                    classes += 'team_cell '
                }
                if (dal.picklists['picked'] && dal.picklists['picked'].includes(team))
                {
                    classes += 'crossed_out '
                }
                else if (highlight === list)
                {
                    match_filter.push(team)
                }
                table += `<td onclick="add_to('${list}', '${team}')" oncontextmenu="mark_team('${list}', '${team}'); return false" class="${classes}" ontouchstart="touch_button(false)" ontouchend="touch_button('mark_team(\\\'${list}\\\', \\\'${team}\\\')')">${team}</td>`
            }
            else
            {
                table += '<td></td>'
            }
        }
        table += '</tr>'
    }
    table += '</table>'

    document.getElementById('table_card').innerHTML = table

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