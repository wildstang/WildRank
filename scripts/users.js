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
        
        // build list of scouters
        let match_users = matches.map(m => m.meta_scouter_id).filter(id => typeof id !== 'undefined')
        let note_users = matches.map(m => m.meta_note_scouter_id).filter(id => typeof id !== 'undefined')
        let pit_users = pits.map(p => p.meta_scouter_id).filter(id => typeof id !== 'undefined')
        let scouters = match_users.concat(note_users, pit_users)
        scouters = [... new Set(scouters)]

        // get list of users
        let users = Object.keys(cfg.users)

        for (let user of scouters)
        {
            if (!users.includes(user.toString()))
            {
                users.push(user)
            }
        }

        let classes = {}
        for (let user of users)
        {
            if (cfg.is_admin(user))
            {
                classes[user] = 'highlighted'
            }
            else if (!scouters.includes(parseInt(user)))
            {
                classes[user] = 'scouted'
            }            
        }
        users.sort()
        
        let first = populate_other(users, classes)
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
    if (typeof user_id === 'string')
    {
        user_id = parseInt(user_id)
    }

    // select option
    deselect_all()
    document.getElementById(`option_${user_id}`).classList.add('selected')

    // get user's results
    let matches = dal.get_results([], false).filter(m => m.meta_scouter_id === user_id)
    matches.sort((a, b) => a.meta_scout_time - b.meta_scout_time)
    let notes = dal.get_results([], false).filter(m => m.meta_note_scouter_id === user_id)
    notes.sort((a, b) => a.meta_note_scout_time - b.meta_note_scout_time)
    let pits = dal.get_pits([], false).filter(m => m.meta_scouter_id === user_id)

    let pos_counts = {}
    let durations = []
    let delays = []
    // create table of scouted matches
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
        time_table += `<tr onclick="window_open('${open_page('results', {'file': `${match.meta_match_key}-${match.meta_team}`})}', '_self')"><td><a>${dal.get_match_value(match.meta_match_key, 'short_match_name')}</a></td><td>${match.meta_team}</td><td>${match.meta_position}</td><td>${delays[delays.length - 1]}s</td><td>${match.meta_scouting_duration.toFixed()}s</td></tr>`
    }
    for (let i = 0; i < notes.length; i += 3)
    {
        let match = notes[i]
        let pos = match.meta_alliance
        if (!pos_counts.hasOwnProperty(pos))
        {
            pos_counts[pos] = 0
        }
        pos_counts[pos]++

        durations.push(match.meta_scouting_duration)
        let actual = dal.get_match_value(match.meta_match_key, 'started_time')
        if (typeof actual === 'number')
        {
            delays.push(actual - match.meta_note_scout_time)
        }
        else
        {
            delays.push(0)
        }
        time_table += `<tr onclick="window_open('${open_page('results', {'file': `${match.meta_match_key}-${match.meta_team}`})}', '_self')"><td><a>${dal.get_match_value(match.meta_match_key, 'short_match_name')}</a></td><td>${match.meta_alliance}</td><td>${match.meta_note_position}</td><td>${delays[delays.length - 1]}s</td><td>${match.meta_note_scouting_duration.toFixed()}s</td></tr>`
    }
    time_table += `<tr><th>Averages</th><td>${mean(delays).toFixed()}s</td><td>${mean(durations).toFixed()}s</td></tr></table>`

    // create table of scouted pits
    let pit_table = `<table id="pit_table"><tr><th>Team</th><th>Duration</th></tr>`
    for (let pit of pits)
    {
        pit_table += `<tr><td>${pit.meta_team}</td><td>${pit.meta_scouting_duration.toFixed()}s</td></tr>`
    }
    pit_table += `</table>`

    let pos_table = '<table id="pos_table"><tr><th>Position</th><th>Matches Scouted</th></tr>'
    for (let pos in pos_counts)
    {
        pos_table += `<tr><td>${pos}</td><td>${pos_counts[pos]}</tr>`
    }
    pos_table += '</table>'

    // user column
    let name = new Entry('name', 'User\'s Name', cfg.get_name(user_id))
    let card = new Card('user_card', `has scouted:<br>- <b>${matches.length}</b> matches<br>- <b>${notes.length / 3}</b> notes<br>- <b>${pits.length}</b> pits`)
    card.limitWidth = true
    let admin = new Checkbox('admin', 'Admin', cfg.is_admin(user_id))
    let position = new Dropdown('position', 'Default Position', [''])
    for (let i = 1; i <= dal.alliance_size * 2; i++)
    {
        let color = 'Red'
        let pos = i
        if (i > dal.alliance_size)
        {
            color = 'Blue'
            pos = i - dal.alliance_size
        }
        position.add_option(`${color} ${pos}`)
    }
    let pos = cfg.get_position(user_id) + 1
    position.def = position.options[pos]
    let save = new Button('save', 'Apply Changes', `save_user('${user_id}')`)
    let user_col = new ColumnFrame('', '', [name, card, admin, position, save])

    // info column
    let pos_card = new Card('pos_card', pos_table)
    pos_card.limitWidth = true
    let time_card = new Card('time_card', time_table)
    let pit_card = new Card('pit_card', pit_table)
    pit_card.limitWidth = true
    let card_col = new ColumnFrame('', '', [pos_card, time_card, pit_card])

    document.getElementById('contents').innerHTML = new PageFrame('', '', [user_col, card_col]).toString
}

/**
 * function:    save_user
 * parameters:  user_id
 * returns:     none
 * description: Saves the user inputs to the config.
 */
function save_user(user_id)
{
    let user = {
        name: document.getElementById('name').value,
        admin: document.getElementById('admin').checked
    }

    // add position if selected
    let position = document.getElementById('position').selectedIndex - 1
    if (position >= 0)
    {
        user.position = position
    }

    // apply and store config
    cfg.users[user_id] = user
    localStorage.setItem(`config-users`, JSON.stringify(cfg.users))
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
