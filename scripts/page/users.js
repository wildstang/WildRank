/**
 * file:        users.js
 * description: Contains functions for the user overview page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-06-13
 */

var users, scouters = []

var id_number, name_entry, user_card, admin_box, position_dropdown, pos_card, time_card, pit_card, filter_box

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch user results from localStorage. Initialize page contents.
 */
function init_page()
{
    header_info.innerText = 'User Profiles'

    let matches = dal.get_results([], false)
    let pits = dal.get_pits([], false)
    if (matches.length > 0 || pits.length > 0)
    {
        // build list of scouters
        let match_users = matches.map(m => m.meta_scouter_id).filter(id => typeof id !== 'undefined')
        let note_users = matches.map(m => m.meta_note_scouter_id).filter(id => typeof id !== 'undefined')
        let pit_users = pits.map(p => p.meta_scouter_id).filter(id => typeof id !== 'undefined')
        scouters = match_users.concat(note_users, pit_users)
        scouters = [... new Set(scouters)]

        // get list of users
        users = Object.keys(cfg.users)
        for (let user of scouters)
        {
            if (!users.includes(user.toString()))
            {
                users.push(user)
            }
        }

        // user column
        id_number = new WRNumber('ID Number', '')
        name_entry = new WREntry('User\'s Name', '')
        user_card = document.createElement('span')
        let card = new WRCard(user_card)
        card.limitWidth = true
        admin_box = new WRCheckbox('Admin', false)
        position_dropdown = new WRDropdown('Default Position', [''])
        for (let i = 1; i <= dal.alliance_size * 2; i++)
        {
            let color = 'Red'
            let pos = i
            if (i > dal.alliance_size)
            {
                color = 'Blue'
                pos = i - dal.alliance_size
            }
            position_dropdown.add_option(`${color} ${pos}`)
        }
        let save = new WRButton('Apply Changes', save_user)
        let user_col = new WRColumn('', [id_number, name_entry, card, admin_box, position_dropdown, save])

        // info column
        pos_card = new WRCard()
        pos_card.limitWidth = true
        time_card = new WRCard()
        pit_card = new WRCard()
        pit_card.limitWidth = true
        let card_col = new WRColumn('', [pos_card, time_card, pit_card])

        preview.replaceChildren(new WRPage('', [user_col, card_col]))

        filter_box = add_checkbox_filter('Show All Users', build_options)
        build_options()
    }
    else
    {
        add_error_card('No Results Found')
    }
}

function build_options()
{
    let show_non_scouters = filter_box !== undefined && filter_box.checked

    let classes = {}
    let display_users = []
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

        if (show_non_scouters || scouters.includes(parseInt(user)))
        {
            display_users.push(user)
        }
    }
    display_users.sort()

    let first = populate_other(display_users, classes)
    if (first !== '')
    {
        open_option(first)
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
    document.getElementById(`left_pit_option_${user_id}`).classList.add('selected')

    // get user's results
    let matches = dal.get_results([], false).filter(m => m.meta_scouter_id === user_id)
    matches.sort((a, b) => a.meta_scout_time - b.meta_scout_time)
    let notes = dal.get_results([], false).filter(m => m.meta_note_scouter_id === user_id)
    notes.sort((a, b) => a.meta_note_scout_time - b.meta_note_scout_time)
    let pits = dal.get_pits([], false).filter(m => m.meta_scouter_id === user_id)

    let pos_counts = {}
    let durations = []
    let delays = []
    let unsure_count = 0

    // create table of scouted matches
    let time_table = document.createElement('table')
    time_table.append(create_header_row(['Match', 'Team', 'Position', 'Start Delay', 'Duration', 'Unsure']))
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

        let unsure = ''
        if (dal.get_result_value(match.meta_team, match.meta_match_key, 'meta_unsure'))
        {
            unsure_count++
            unsure = 'Unsure'
        }

        let row = time_table.insertRow()
        row.onclick = (event) => window_open(build_url('results', {file: `${match.meta_match_key}-${match.meta_team}`}))
        row.insertCell().innerText = dal.get_match_value(match.meta_match_key, 'short_match_name')
        row.insertCell().innerText = match.meta_team
        row.insertCell().innerText = match.meta_position
        row.insertCell().innerText = `${delays[delays.length - 1]}s`
        row.insertCell().innerText = `${match.meta_scouting_duration.toFixed()}s`
        let cell = row.insertCell()
        cell.innerText = unsure
        cell.title = dal.get_result_value(match.meta_team, match.meta_match_key, 'meta_unsure_reason')
    }

    // create table of notes
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

        let row = time_table.insertRow()
        row.onclick = (event) => window_open(build_url('results', {file: `${match.meta_match_key}-${match.meta_team}`}))
        row.insertCell().innerText = dal.get_match_value(match.meta_match_key, 'short_match_name')
        row.insertCell().innerText = match.meta_alliance
        row.insertCell().innerText = match.meta_note_position
        row.insertCell().innerText = `${delays[delays.length - 1]}s`
        row.insertCell().innerText = `${match.meta_note_scouting_duration.toFixed()}s`
        row.insertCell().innerText = ''
    }
    let row = time_table.insertRow()
    row.append(create_header('Mean'))
    row.insertCell()
    row.insertCell()
    row.insertCell().innerText = `${mean(delays).toFixed()}s`
    row.insertCell().innerText = `${mean(durations).toFixed()}s`
    row.insertCell().innerText = unsure_count

    // create table of scouted pits
    let pit_table = document.createElement('table')
    pit_table.append(create_header_row(['Team', 'Duration']))
    for (let pit of pits)
    {
        let row = pit_table.insertRow()
        row.insertCell().innerText = pit.meta_team
        row.insertCell().innerText = `${pit.meta_scouting_duration.toFixed()}s`
    }

    // create table of scouting positions
    let pos_table = document.createElement('table')
    pos_table.append(create_header_row(['Position', 'Matches Scouted']))
    for (let pos in pos_counts)
    {
        let row = pos_table.insertRow()
        row.insertCell().innerText = pos
        row.insertCell().innerText = pos_counts[pos]
    }

    let num_matches = document.createElement('b')
    num_matches.innerText = matches.length
    let unsure_pct = ''
    if (matches.length)
    {
        unsure_pct = ` (${Math.round(100 * unsure_count / matches.length)}% unsure)`
    }
    let num_notes = document.createElement('b')
    num_notes.innerText = notes.length / 3
    let num_pits = document.createElement('b')
    num_pits.innerText = pits.length
    user_card.replaceChildren('has scouted:', br(), ' - ', num_matches, ` matches${unsure_pct}`, br(), ' - ', num_notes, ' notes', br(), ' - ', num_pits, ' pits')

    id_number.value_el.innerText = user_id
    name_entry.element.value = cfg.get_name(user_id)
    admin_box.set_checked(cfg.is_admin(user_id))
    let pos = cfg.get_position(user_id) + 1
    position_dropdown.element.value = position_dropdown.options[pos]

    pos_card.text_el.replaceChildren(pos_table)
    time_card.text_el.replaceChildren(time_table)
    pit_card.text_el.replaceChildren(pit_table)
}

/**
 * function:    save_user
 * parameters:  none
 * returns:     none
 * description: Saves the user inputs to the config.
 */
function save_user()
{
    let user_id = id_number.value_el.innerText

    let user = {
        name: name_entry.element.value,
        admin: admin_box.checkbox.checked
    }

    // add position if selected
    let position = position_dropdown.element.selectedIndex - 1
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
