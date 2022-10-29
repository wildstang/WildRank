/**
 * file:        users.js
 * description: Contains functions for the user overview page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-06-13
 */

var users = {}

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch user results from localStorage. Initialize page contents.
 */
function init_page()
{
    let matches = dal.get_results([], false)
    let pits = dal.get_pits([], false)
    if (matches.length > 0 || pits.length > 0)
    {
        contents_card.style = 'display: none'
        buttons_container.innerHTML = '<div id="contents"></div>'
        
        // build list of users
        let match_users = matches.map(m => m.meta_scouter_id)
        let pit_users = pits.map(p => p.meta_scouter_id)
        let users = match_users.concat(pit_users)
        users = [... new Set(users)]
        
        let first = populate_other(users)
        if (first !== '')
        {
            open_option(first)
        }
    }
    else
    {
        contents_card.innerHTML = '<h2>No Results Found</h2>'
    }
}

/**
 * function:    open_option
 * parameters:  Selected user
 * returns:     none
 * description: Completes right info pane for a given user.
 */
function open_option(user_id)
{
    // select option
    select_all(false)
    document.getElementById(`option_${user_id}`).classList.add('selected')

    // get user's results
    let matches = dal.get_results([], false).filter(m => m.meta_scouter_id === user_id)
    matches.sort((a, b) => a.meta_scout_time - b.meta_scout_time)
    let pits = dal.get_pits([], false).filter(m => m.meta_scouter_id === user_id)

    let pos_counts = {}
    let durations = []
    let delays = []
    let time_table = `<table id="time_table"><tr><th>Match</th><th>Team</th><th>Position</th><th>Start Delay</th><th>Duration</th></tr>`
    for (let match of matches)
    {
        let pos = match.meta_position
        if (!pos_counts.hasOwnProperty(pos))
        {
            pos_counts[pos] = 0
        }
        pos_counts[pos]++

        durations.push(match.meta_scouting_duration)
        let actual = dal.get_match_value(match.meta_match_key, 'started_time')
        if (typeof actual === 'number')
        {
            delays.push(actual - match.meta_scout_time)
        }
        else
        {
            delays.push(0)
        }
        time_table += `<tr><td>${dal.get_match_value(match.meta_match_key, 'short_match_name')}</td><td>${match.meta_team}</td><td>${match.meta_position}</td><td>${delays[delays.length - 1]}s</td><td>${match.meta_scouting_duration.toFixed()}s</td></tr>`
    }
    time_table += `<tr><th>Averages</th><td>${mean(delays).toFixed()}s</td><td>${mean(durations).toFixed()}s</td></tr></table>`
    
    let pos_table = '<table id="pos_table"><tr><th>Position</th><th>Matches Scouted</th></tr>'
    for (let pos in pos_counts)
    {
        pos_table += `<tr><td>${pos}</td><td>${pos_counts[pos]}</tr>`
    }
    pos_table += '</table>'

    let card = new Card('user_card', `${cfg.get_name(user_id)} has scouted <b>${matches.length} matches</b> and <b>${pits.length} pits</b>.`)
    card.limitWidth = true
    let pos_card = new Card('pos_card', pos_table)
    pos_card.limitWidth = true
    let time_card = new Card('time_card', time_table)
    
    document.getElementById('contents').innerHTML = new PageFrame('', '', [card, pos_card, time_card]).toString
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
    return build_url('selection', {'page': 'results', [EVENT_COOKIE]: get_cookie(EVENT_COOKIE, EVENT_DEFAULT), [TYPE_COOKIE]: type, 'file': file})
}