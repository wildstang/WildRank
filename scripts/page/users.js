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
 * Initialize the structure of the page.
 */
function init_page()
{
    header_info.innerText = 'User Profiles'

    // get all scouters
    scouters = dal.get_all_scouters()
    if (scouters.length > 0)
    {
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
        for (let i = 1; i <= 6; i++)
        {
            let color = 'Red'
            let pos = i
            if (i > 3)
            {
                color = 'Blue'
                pos = i - 3
            }
            position_dropdown.add_option(`${color} ${pos}`)
        }
        let save = new WRButton('Apply Changes', save_user)
        let user_col = new WRColumn('', [id_number, name_entry, card, admin_box, position_dropdown, save])

        // info column
        pos_card = new WRCard('')
        pos_card.limitWidth = true
        time_card = new WRCard('')
        pit_card = new WRCard('')
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

/**
 * Updates the scouter list based on filter.
 */
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
 * Populates the page with info on the scouter.
 * @param {Number} user_id Selected user ID
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

    pit_card.text_el.replaceChildren()
    time_card.text_el.replaceChildren()

    id_number.value_el.innerText = user_id
    name_entry.element.value = cfg.get_name(user_id)
    admin_box.set_checked(cfg.is_admin(user_id))
    let pos = cfg.get_position(user_id) + 1
    position_dropdown.element.value = position_dropdown.options[pos]

    let pos_counts = {}
    let mode_counts = {}
    let unsure_counts = {}

    // get user's results
    for (let mode of cfg.scouting_modes)
    {
        let config = cfg.get_scout_config(mode)

        let results = dal.get_all_results(mode, true).filter(m => m.scouter.user_id === user_id)
        results.sort((a, b) => a.scouter.start_time - b.scouter.start_time)
        if (results.length === 0)
        {
            continue
        }
        mode_counts[config.name] = results.length

        let delays = []
        let durations = []
        let unsure_count = 0

        let row
        let header = document.createElement('h3')
        header.innerText = config.name
        let table = document.createElement('table')
        switch (config.type)
        {
            case 'team':
                row = create_header_row(['Team', 'Duration', 'Unsure'])
                pit_card.text_el.append(header)
                pit_card.text_el.append(table)
                break
            case 'match-team':
                row = create_header_row(['Match', 'Team', 'Position', 'Start Delay', 'Duration', 'Unsure'])
            case 'match-alliance':
                if (row === undefined)
                {
                    row = create_header_row(['Match', 'Alliance', 'Position', 'Start Delay', 'Duration', 'Unsure'])
                }
                time_card.text_el.append(header)
                time_card.text_el.append(table)
        }
        table.append(row)

        for (let result of results)
        {
            let team_num = result.result.team_num

            durations.push(result.scouter.duration)

            let unsure = ''
            if (result.status.unsure)
            {
                unsure_count++
                unsure = 'Unsure'
            }

            // parse data from the match
            let pos = 0
            let match_key = ''
            if (config.type.startsWith('match-'))
            {
                match_key = result.result.match_key

                pos = result.scouter.position
                if (!pos_counts.hasOwnProperty(pos))
                {
                    pos_counts[pos] = 0
                }
                pos_counts[pos]++

                if (config.type === 'match-alliance')
                {
                    team_num = pos < 3 ? 'red' : 'blue'
                }

                durations.push(result.scouter.duration)
                let actual = dal.matches[match_key].time
                if (typeof actual === 'number')
                {
                    delays.push(result.scouter.start_time - actual)
                }
                else
                {
                    delays.push(0)
                }
            }

            // build a row for the individual result
            let row = table.insertRow()
            let team = config.type === 'match-alliance' ? '' : team_num
            row.onclick = (event) => window_open(build_url('results', {match: match_key, team: team}))
            if (config.type.startsWith('match-'))
            {
                row.insertCell().innerText = dal.matches[match_key].short_name
            }
            row.insertCell().innerText = team_num
            if (config.type.startsWith('match-'))
            {
                row.insertCell().innerText = position_to_name(pos)
                row.insertCell().innerText = `${delays[delays.length - 1]}s`
            }
            row.insertCell().innerText = `${result.scouter.duration.toFixed()}s`
            let unsure_cell = row.insertCell()
            unsure_cell.innerText = unsure
            unsure_cell.title = result.status.unsure_reason
        }

        // build a row summarizing the table
        let mean_row = table.insertRow()
        mean_row.append(create_header('Mean'))
        if (config.type.startsWith('match-'))
        {
            mean_row.insertCell()
            mean_row.insertCell()
            mean_row.insertCell().innerText = `${mean(delays).toFixed()}s`
        }
        mean_row.insertCell().innerText = `${mean(durations).toFixed()}s`
        mean_row.insertCell().innerText = unsure_count

        unsure_counts[config.name] = unsure_count
    }

    // create table of scouting positions
    let pos_table = document.createElement('table')
    pos_table.append(create_header_row(['Position', 'Matches Scouted']))
    for (let pos in pos_counts)
    {
        let row = pos_table.insertRow()
        pos = parseInt(pos)
        row.insertCell().innerText = position_to_name(pos)
        row.insertCell().innerText = pos_counts[pos]
    }
    pos_card.text_el.replaceChildren(pos_table)

    user_card.replaceChildren()
    for (let mode of Object.keys(mode_counts))
    {
        unsure_pct = `(${Math.round(100 * unsure_counts[mode] / mode_counts[mode])}% unsure)`
        user_card.append(`${mode_counts[mode]} ${pluralize(mode)} ${unsure_pct}`, br())
    }
}

/**
 * Responds to button press by saving the on screen selections to the current user.
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
    cfg.user_list.store_config()
}
