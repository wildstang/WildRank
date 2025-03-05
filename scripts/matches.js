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

var match_num_el, match_time_el, avatar_el, team_num_el, team_name_el, team_pos_el, photos_el, buttons

include('transfer')

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch simple event matches from localStorage. Initialize page contents.
 */
function init_page()
{
    header_info.innerText = 'Match Select'

    // override scouting position with that from config
    // TODO: determine if this is actually desired
    if (cfg.get_position(user_id) > -1)
    {
        scout_pos = cfg.get_position(user_id)
    }

    let first = populate_matches(false, true, '', false, scout_pos, scout_mode === NOTE_MODE)
    add_button_filter(`Export ${capitalize(scout_mode)} Results`, export_results, true)
    if (first)
    {
        match_num_el = document.createElement('h2')
        match_time_el = document.createElement('span')
        card_elements = [match_num_el, 'Time: ', match_time_el, br(), br()]
        
        if (scout_mode === MATCH_MODE)
        {
            avatar_el = document.createElement('img')
            avatar_el.className = 'avatar'
            card_elements.push(avatar_el)
        }

        // add scouting position
        let pos = 1 + parseInt(scout_pos)
        if (pos > dal.alliance_size)
        {
            pos -= dal.alliance_size
        }

        let team = document.createElement('h2')
        team_num_el = document.createElement('span')
        team_num_el.textContent = 'No Match Selected'
        team_name_el = document.createElement('span')
        team_pos_el = document.createElement('span')
        team_pos_el.textContent = `(${pos})`
        team.append(team_num_el, ' ', team_name_el, ' ', team_pos_el)

        photos_el = document.createElement('span')
        card_elements.push(team, photos_el)

        buttons = document.createElement('div')
        let card = new WRCard(card_elements, true)
        preview.append(card, buttons)

        open_option(first)
    }
    else
    {
        add_error_card('No Match Data Found', 'Please preload event')
    }
}

/**
 * function:    open_option
 * parameters:  match number
 * returns:     none
 * description: Completes right info pane for a given match number.
 */
function open_option(match_num)
{
    console.log(match_num)
    // clear previous selection
    deselect_all()
    if (document.getElementById('open_result_container') !== null)
    {
        document.getElementById('open_result_container').remove()
    }
    buttons.replaceChildren()

    // select option
    document.getElementById(`left_match_option_${match_num}`).classList.add('selected')

    let red_teams = dal.get_match_value(match_num, 'red_alliance')
    let teams = red_teams.concat(dal.get_match_value(match_num, 'blue_alliance'))

    // place match number and team to scout on card
    match_num_el.innerText = dal.get_match_value(match_num, 'match_name')
    match_time_el.innerText = dal.get_match_value(match_num, 'display_time')

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
        avatar_el.src = dal.get_value(team_num, 'pictures.avatar')
        photos_el.replaceChildren(dal.get_photo_carousel(team_num))
        team_num_el.innerText = team_num
        team_name_el.innerText = dal.get_value(team_num, 'meta.name')
        team_num_el.style.color = color
        team_name_el.style.color = color
        team_pos_el.style.color = color

        // build buttons
        let key = match_num.toLowerCase()
        let scout_button = new WRLinkButton('Scout Match', open_page('scout', {type: MATCH_MODE, match: key, team: team_num, alliance: alliance, edit: false}))
        buttons.append(scout_button)

        if (dal.is_match_scouted(match_num, team_num))
        {
            let page = new WRPage()

            let result_button = new WRLinkButton('View Result', open_page('results', {'file': `${key}-${team_num}`}))
            result_button.add_class('slim')
            page.add_column(new WRColumn('', [result_button]))

            if (can_edit(match_num, team_num))
            {
                let edit_button = new WRLinkButton('Edit Match', open_page('scout', {type: MATCH_MODE, match: key, team: team_num, alliance: alliance, edit: true}))
                edit_button.add_class('slim')
                page.add_column(new WRColumn('', [edit_button]))

                let renumber = new WRButton('Renumber Result', () => renumber_match(key, team_num))
                renumber.add_class('slim')
                page.add_column(new WRColumn('', [renumber]))
        
                let del = new WRButton('Delete Result', () => delete_result(key, team_num))
                del.add_class('slim')
                page.add_column(new WRColumn('', [del]))
            }

            buttons.append(page)
        }

        ws(team_num)
    }
    else if (scout_mode === NOTE_MODE)
    {
        // populate team info
        team_num_el.innerText = `${capitalize(alliance)} Alliance`
        team_num_el.style.color = color
        team_name_el.style.color = color
        team_pos_el.style.color = color

        // build buttons
        let key = match_num.toLowerCase()
        let scout_button = new WRLinkButton('Take Notes', open_page('note', {match: key, alliance: alliance, edit: false}))
        buttons.append(scout_button)

        if (dal.is_note_scouted(match_num, team_num))
        {
            let page = new WRPage()

            if (can_edit(match_num, team_num))
            {
                let edit_button = new WRLinkButton('Edit Notes', open_page('note', {match: key, alliance: alliance, edit: true}))
                edit_button.add_class('slim')
                page.add_column(new WRColumn('', [edit_button]))

                let renumber = new WRButton('Renumber Result', () => renumber_note(key, alliance))
                renumber.add_class('slim')
                page.add_column(new WRColumn('', [renumber]))
        
                let del = new WRButton('Delete Result', () => delete_result(key, team_num))
                del.add_class('slim')
                page.add_column(new WRColumn('', [del]))
            }

            buttons.append(page)
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

/**
 * Renumbers a note result with a new match.
 * 
 * @param {string} match_key Old match key
 * @param {string} alliance Alliance color
 */
function renumber_note(match_key, alliance)
{
    let input = prompt('New match number')
    if (input !== null)
    {
        let teams = dal.get_match_teams(match_key)
        let positions = Object.keys(teams).filter(p => p.startsWith(alliance.toLowerCase()))

        // build the new match key
        let new_num = parseInt(input)
        let new_key = `${dal.event_id}_qm${new_num}`
        let new_teams = dal.get_match_teams(new_key)

        for (let position of positions)
        {
            let team = teams[position]
            let new_team = new_teams[position]

            // determine the existing file name
            let file = `${NOTE_MODE}-${match_key}-${team}`
            let new_file = `${NOTE_MODE}-${new_key}-${new_team}`

            // confirm the user renamed the file correctly
            if (confirm(`Rename ${file} to ${new_file}`))
            {
                let result = localStorage.getItem(file)
                let new_result = localStorage.getItem(new_file)
                if (result !== null)
                {
                    if (new_result === null)
                    {
                        // edit the metadata and move the file
                        let jresult = JSON.parse(result)
                        jresult.meta_team = new_team
                        jresult.meta_match = new_num
                        jresult.meta_match_key = new_key
                        localStorage.setItem(new_file, JSON.stringify(jresult))
                        localStorage.removeItem(file)
                    }
                    else
                    {
                        alert(`${new_file} already exists!`)
                    }
                }
                else
                {
                    alert(`Rename failed!`)
                }
            }
        }
  
        location.reload()
    }
}

/**
 * Renumbers a match result with a new team and match.
 * 
 * @param {string} match_key Old match key
 * @param {string} team_num Old team number
 */
function renumber_match(match_key, team_num)
{
    let input = prompt('New match number')
    if (input !== null)
    {
        // determine the existing file name
        let file = `${MATCH_MODE}-${match_key}-${team_num}`

        // build the new match key
        let new_num = parseInt(input)
        let new_key = `${dal.event_id}_qm${new_num}`

        // find the new team number
        let teams = dal.get_match_teams(new_key)
        let position = scout_pos < dal.max_alliance_size ? `red_${scout_pos}` : `blue_${scout_pos - dal.max_alliance_size}`
        let new_team = teams[position]

        // build the new file name
        let new_file = `${MATCH_MODE}-${dal.event_id}_qm${new_num}-${new_team}`

        // confirm the user renamed the file correctly
        if (confirm(`Rename ${file} to ${new_file}`))
        {
            let result = localStorage.getItem(file)
            let new_result = localStorage.getItem(new_file)
            if (result !== null)
            {
                if (new_result === null)
                {
                    // edit the metadata and move the file
                    let jresult = JSON.parse(result)
                    jresult.meta_team = new_team
                    jresult.meta_match = new_num
                    jresult.meta_match_key = new_key
                    localStorage.setItem(new_file, JSON.stringify(jresult))
                    localStorage.removeItem(file)
        
                    location.reload()
                }
                else
                {
                    alert(`${new_file} already exists!`)
                }
            }
            else
            {
                alert(`Rename failed!`)
            }
        }
    }
}