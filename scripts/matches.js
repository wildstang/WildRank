/**
 * file:        matches.js
 * description: Contains functions for the match selection page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

// read parameters from URL
var scout_pos = get_parameter(POSITION_COOKIE, POSITION_DEFAULT)
const scout_mode = get_parameter(TYPE_COOKIE, TYPE_DEFAULT)
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

var generate = ''

include('transfer')

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch simple event matches from localStorage. Initialize page contents.
 */
function init_page()
{
    // override scouting position with that from config
    // TODO: determine if this is actually desired
    if (cfg.get_position(user_id) > -1)
    {
        scout_pos = cfg.get_position(user_id)
    }

    let first = populate_matches(false, true, '', false, scout_pos, scout_mode === NOTE_MODE)
    add_button_filter('transfer', `Export ${scout_mode} Results`, `export_results()`, true)
    if (first)
    {
        let avatar = ''
        if (scout_mode == MATCH_MODE)
        {
            avatar = `<img id="avatar" onclick="generate='random'" ontouchstart="touch_button(false)" ontouchend="touch_button('generate=\\'random\\', true)')">`
        }

        // add scouting position
        let pos = 1 + parseInt(scout_pos)
        if (pos > dal.alliance_size)
        {
            pos -= dal.alliance_size
        }
        contents_card.innerHTML = `<h2><span id="match_num">No Match Selected</span></h2>
                                    Time: <span id="match_time"></span><br><br>
                                    ${avatar}
                                    <h2><span id="team_scouting">No Match Selected</span> <span id="team_name"></span> <span id="position">(${pos})</span></h2>
                                    <span id="photos"></span>`
        
        buttons_container.innerHTML = ''

        open_match(first)
    }
    else
    {
        contents_card.innerHTML = '<h2>No Match Data Found</h2>Please preload event'
    }
}

/**
 * function:    open_match
 * parameters:  match number
 * returns:     none
 * description: Completes right info pane for a given match number.
 */
function open_match(match_num)
{
    // clear previous selection
    deselect_all()
    if (document.getElementById('open_result_container') !== null)
    {
        document.getElementById('open_result_container').remove()
    }

    let red_teams = dal.get_match_value(match_num, 'red_alliance')
    let teams = red_teams.concat(dal.get_match_value(match_num, 'blue_alliance'))

    let number_span = document.getElementById('team_scouting')
    let name_span = document.getElementById('team_name')
    let pos_span = document.getElementById('position')

    // select option
    document.getElementById(`match_option_${match_num}`).classList.add('selected')

    // place match number and team to scout on card
    document.getElementById('match_num').innerHTML = dal.get_match_value(match_num, 'match_name')
    document.getElementById('match_time').innerHTML = dal.get_match_value(match_num, 'display_time')

    let team_num = teams[scout_pos]
    let alliance = 'red'
    let color = cfg.theme['red-alliance-color']
    if (scout_pos >= red_teams.length)
    {
        alliance = 'blue'
        color = cfg.theme['blue-alliance-color']
    }

    if (scout_mode === MATCH_MODE)
    {
        // populate team info
        document.getElementById('avatar').src = dal.get_value(team_num, 'pictures.avatar')
        document.getElementById('photos').innerHTML = dal.get_photo_carousel(team_num)
        number_span.innerHTML = team_num
        name_span.innerHTML = dal.get_value(team_num, 'meta.name')
        number_span.style.color = color
        name_span.style.color = color
        pos_span.style.color = color

        // build buttons
        let scout_button = new Button('scout_match', 'Scout Match')
        let key = match_num.toLowerCase()
        scout_button.link = `open_page('scout', {type: '${MATCH_MODE}', match: '${key}', team: '${team_num}', alliance: '${alliance}', edit: false})`
        buttons_container.innerHTML = scout_button.toString
    
        if (dal.is_match_scouted(match_num, team_num))
        {
            let page = new PageFrame()

            let result_button = new Button('view_result', 'View Result')
            result_button.link = `open_page('results', {'file': '${key}-${team_num}'})`
            result_button.add_class('slim')
            page.add_column(new ColumnFrame('', '', [result_button]))

            if (can_edit(match_num, team_num))
            {
                let edit_button = new Button('edit_match', 'Edit Match')
                edit_button.link = `open_page('scout', {type: '${MATCH_MODE}', match: '${key}', team: '${team_num}', alliance: '${alliance}', edit: true})`
                edit_button.add_class('slim')
                page.add_column(new ColumnFrame('', '', [edit_button]))

                let renumber = new Button('renumber', 'Renumber Result')
                renumber.link = `renumber_result('${key}', '${team_num}')`
                renumber.add_class('slim')
                //page.add_column(new ColumnFrame('', '', [renumber]))
        
                let del = new Button('delete', 'Delete Result')
                del.link = `delete_result('${key}', '${team_num}')`
                del.add_class('slim')
                page.add_column(new ColumnFrame('', '', [del]))
            }

            buttons_container.innerHTML += page.toString
        }

        ws(team_num)
    }
    else if (scout_mode === NOTE_MODE)
    {
        // populate team info
        number_span.innerHTML = `${alliance.charAt(0).toUpperCase()}${alliance.substring(1)} Alliance`
        number_span.style.color = color
        pos_span.style.color = color

        // build buttons
        let scout_button = new Button('scout_match', 'Take Notes')
        let key = match_num.toLowerCase()
        scout_button.link = `open_page('note', {match: '${key}', alliance: '${alliance}', edit: false})`
        buttons_container.innerHTML = scout_button.toString

        if (dal.is_note_scouted(match_num, team_num))
        {
            let page = new PageFrame()

            let result_button = new Button('view_result', 'View Result')
            result_button.link = `open_page('results', {'file': '${key}-${team_num}'})`
            result_button.add_class('slim')
            page.add_column(new ColumnFrame('', '', [result_button]))

            if (can_edit(match_num, team_num))
            {
                let edit_button = new Button('edit_match', 'Edit Notes')
                edit_button.link = `open_page('note', {match: '${key}', alliance: '${alliance}', edit: true})`
                edit_button.add_class('slim')
                page.add_column(new ColumnFrame('', '', [edit_button]))

                let renumber = new Button('renumber', 'Renumber Result')
                renumber.link = `renumber_result('${key}', '${team_num}')`
                renumber.add_class('slim')
                //page.add_column(new ColumnFrame('', '', [renumber]))
        
                let del = new Button('delete', 'Delete Result')
                del.link = `delete_result('${key}', '${team_num}')`
                del.add_class('slim')
                page.add_column(new ColumnFrame('', '', [del]))
            }

            buttons_container.innerHTML += page.toString
        }
    }
}

/**
 * function:    can_edit
 * parameters:  file to open
 * returns:     true if the user has permission to edit the file
 * description: Determines if the user has permissions to edit the file.
 */
function can_edit(match_num, team_num)
{
    return dal.get_result_value(team_num, match_num, 'meta_scouter_id') === parseInt(user_id) || cfg.is_admin(user_id)
}

/**
 * function:    delete_result
 * parameters:  existing match, team number
 * returns:     none
 * description: Prompts to delete a pit result.
 */
function delete_result(match_key, team_num)
{
    if (confirm(`Are you sure you want to delete ${match_key} ${team_num}?`))
    {
        localStorage.removeItem(`${scout_mode}-${match_key}-${team_num}`)
        location.reload()
    }
}

/**
 * function:    export_results
 * parameters:  none
 * returns:     none
 * description: Starts the zip export process for this page type's results.
 */
function export_results()
{
    let handler = new ZipHandler()
    handler.match = scout_mode === MATCH_MODE
    handler.note = scout_mode === NOTE_MODE
    handler.user = user_id
    handler.export_zip()
}