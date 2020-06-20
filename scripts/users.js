/**
 * file:        users.js
 * description: Contains functions for the user overview page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-06-13
 */

// read parameters from URL
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

var users = {}

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch user results from localStorage. Initialize page contents.
 */
function init_page(contents_card, buttons_container)
{
    if (Object.keys(localStorage).length > 0)
    {
        contents_card.style = 'display: none'
        buttons_container.innerHTML = '<div id="contents"></div>'
        
        // build list of users and results
        Object.keys(localStorage).forEach(function (file, index)
        {
            if (file.startsWith(`${MATCH_MODE}-${event_id}-`) || file.startsWith(`${PIT_MODE}-${event_id}-`) || file.startsWith(`${NOTE_MODE}-${event_id}-`))
            {
                let user = JSON.parse(localStorage.getItem(file)).meta_scouter_id
                if (users.hasOwnProperty(user))
                {
                    users[user].push(file)
                }
                else
                {
                    users[user] = [file]
                }
            }
        })
        
        build_options_list()
    }
    else
    {
        contents_card.innerHTML = '<h2>No Results Found</h2>'
    }
}

/**
 * function:    build_options_list
 * parameters:  none
 * returns:     none
 * description: Completes left select user pane with users from event data.
 */
function build_options_list()
{
    let first = ''
    // iterate through each match obj
    Object.keys(users).forEach(function (user, index) {
        if (first == '')
        {
            first = user
        }

        // replace placeholders in template and add to screen
        document.getElementById('option_list').innerHTML += build_option(user)
    })
    open_option(first)
    scroll_to('option_list', `option_${first}`)
}

/**
 * function:    open_option
 * parameters:  Selected user
 * returns:     none
 * description: Completes right info pane for a given user.
 */
function open_option(user_id)
{
    // remove selected options
    Object.keys(users).forEach(function (user, index)
    {
        document.getElementById(`option_${user}`).classList.remove('selected')
    })

    // iterate through each result
    let total_pit = 0
    let total_match = 0
    let total_notes = 0
    let total_match_delta = 0
    let total_notes_delta = 0
    let pits = []
    let matches = []
    let notes = []
    users[user_id].forEach(function (file, index)
    {
        let parts = file.split('-')

        let result = JSON.parse(localStorage.getItem(file))
        let duration = result.meta_scouting_duration
        let summary = `${unix_to_match_time(result.meta_scout_time)} for ${duration} secs`

        // build columns for each result type
        if (parts[0] == PIT_MODE)
        {
            pits.push(build_button(file, `Team ${parts[2]}`, `open_result('${file}')`))
            pits.push(build_card('', summary))
            total_pit += duration
        }
        else if (parts[0] == MATCH_MODE)
        {
            matches.push(build_button(file, `Match ${parts[2]} Team ${parts[3]}`, `open_result('${file}')`))
            let delta = get_delta(parts[2], result.meta_scout_time)
            matches.push(build_card('', `${delta} secs behind<br>${summary}`))
            total_match += duration
            total_match_delta += delta
        }
        else if (parts[0] == NOTE_MODE)
        {
            notes.push(build_button(file, `Match ${parts[2]} Team ${parts[3]}`, `open_result('${file}')`))
            let delta = get_delta(parts[2], result.meta_scout_time)
            notes.push(build_card('', `${delta} secs behind<br>${summary}`))
            total_notes += duration
            total_notes_delta += delta
        }
    })

    let user_class = is_admin(user_id) ? '(admin)' : ''

    if (pits.length > 0)
    {
        pits.unshift(build_card('', `<b>${pits.length/2}</b> pits scouted<br><br>Mean Duration: <b>${Math.round(total_pit / (pits.length / 2))}</b> secs`))
    }
    else
    {
        pits = [build_card('', 'No pits scouted')]
    }
    if (matches.length > 0)
    {
        matches.unshift(build_card('', `<b>${matches.length/2}</b> matches scouted<br>Mean Delay: <b>${Math.round(total_match_delta / (matches.length / 2))}</b> secs<br>Mean Duration: <b>${Math.round(total_match / (matches.length / 2))}</b> secs`))
    }
    else
    {
        matches = [build_card('', 'No matches scouted')]
    }
    if (notes.length > 0)
    {
        notes.unshift(build_card('', `<b>${notes.length/2}</b> match notes taken<br>Mean Delay: <b>${Math.round(total_notes_delta / (notes.length / 2))}</b> secs<br>Mean Duration: <b>${Math.round(total_notes / (notes.length / 2))}</b> secs`))
    }
    else
    {
        notes = [build_card('', 'No match notes taken')]
    }

    // build page
    let table = build_page_frame(`${user_id} ${user_class}`, [
        build_column_frame('Pits', pits),
        build_column_frame('Matches', matches),
        build_column_frame('Notes', notes)
    ])

    // update page
    document.getElementById(`option_${user_id}`).classList.add('selected')
    document.getElementById('contents').innerHTML = table
}

/**
 * function:    get_delta
 * parameters:  match number, scouting start time
 * returns:     difference between match and scouting start
 * description: Returns how late a scouter started scouting.
 */
function get_delta(match_num, scout_time)
{
    let match = get_match(match_num, event_id)
    if (match.actual_time > 0)
    {
        return scout_time - match.actual_time
    }
    else if (match.predicted_time > 0)
    {
        return scout_time - match.predicted_time
    }
    return 0
}

/**
 * function:    open_result
 * parameters:  result file to open
 * returns:     none
 * description: Loads the result page for a button when pressed.
 */
function open_result(file)
{
    let type = file.split('-')[0]
    if (type == 'notes')
    {
        file = ''
    }
    document.location.href = `/selection.html${build_query({'page': 'results', [EVENT_COOKIE]: get_cookie(EVENT_COOKIE, EVENT_DEFAULT), [TYPE_COOKIE]: type, 'file': file})}`
}