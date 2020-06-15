/**
 * file:        users.js
 * description: Contains functions for the user overview page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-06-13
 */
                              
const BUTTONS = `<div id="contents"></div>`

var users = {}

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
    let pits = []
    let matches = []
    let notes = []
    users[user_id].forEach(function (file, index)
    {
        let parts = file.split('-')

        let result = JSON.parse(localStorage.getItem(file))
        let summary = `${unix_to_match_time(result.meta_scout_time)}, ${result.meta_scouting_duration} secs<br><br>`

        // build columns for each result type
        if (parts[0] == PIT_MODE)
        {
            pits.push(build_button(file, `Team ${parts[2]}`, `open_result('${file}')`))
            pits.push(summary)
        }
        else if (parts[0] == MATCH_MODE)
        {
            matches.push(build_button(file, `Match ${parts[2]} Team ${parts[3]}`, `open_result('${file}')`))
            matches.push(`${get_delta(parts[2], result.meta_scout_time)}, ${summary}`)
        }
        else if (parts[0] == NOTE_MODE)
        {
            notes.push(build_button(file, `Match ${parts[2]}`, `open_result('${file}')`))
            notes.push(`${get_delta(parts[2], result.meta_scout_time)}, ${summary}`)
        }
    })

    // build page
    let table = build_page_frame(user_id, [
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
 * parameters:  match number, scouting duration
 * returns:     string description of match start delta
 * description: Describes how early/late a scouter started scouting.
 */
function get_delta(match_num, duration)
{
    let match = get_match(match_num, event_id)
    if (match.actual_time > 0)
    {
        let delta = duration - match.actual_time
        if (delta > 0)
        {
            return `${delta} secs late`
        }
        else if (delta < 0)
        {
            return `${-delta} secs early`
        }
        else
        {
            ', on time'
        }
    }
    return ''
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

/**
 * function:    build_user_list
 * parameters:  none
 * returns:     none
 * description: Completes left select user pane with user ids.
 */
function build_user_list()
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
 * function:    load_user
 * parameters:  none
 * returns:     none
 * description: Discover users from all result data
 */
function load_user()
{
    if (Object.keys(localStorage).length > 0)
    {
        preview.innerHTML = preview.innerHTML.replace(/BUTTONS/g, BUTTONS)
        document.getElementById('contents_card').style = 'display: none'
        
        // build list of users and results
        Object.keys(localStorage).forEach(function (file, index)
        {
            if (file.startsWith(`match-${event_id}-`) || file.startsWith(`pit-${event_id}-`) || file.startsWith(`notes-${event_id}-`))
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
        build_user_list()
    }
    else
    {
        preview.innerHTML = preview.innerHTML.replace(/CONTENTS/g, '<h2>No Results Found</h2>')
                                             .replace(/BUTTONS/g, '')
    }
}

// read parameters from URL
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

load_user()