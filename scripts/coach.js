/**
 * file:        coach.js
 * description: Contains functions for the driver coach view page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2021-09-03
 */

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch simple event matches from localStorage. Initialize page contents.
 */
function init_page()
{
    // build page
    let first = populate_matches()
    let teams = Object.keys(dal.teams)
    teams.unshift('')
    let default_filter = ''
    if (cfg.settings.hasOwnProperty('team_number'))
    {
        default_filter = cfg.settings.team_number.toString()
    }
    add_dropdown_filter('team_filter', teams, 'hide_matches()', true, default_filter)

    if (first)
    {
        let match = document.createElement('span')
        match.id = 'match_key'
        match.innerText = 'No Match Selected'

        let header = document.createElement('h2')
        header.append(match)

        let time = document.createElement('h3')
        time.id = 'time'

        let table = document.createElement('table')
        table.id = 'alliance_stats'

        contents_card.append(header, time, table)

        hide_matches()
    }
    else
    {
        let header = document.createElement('h2')
        header.innerText = "No Match Data Found"

        let description = document.createElement('span')
        description.innerText = "Please preload event."

        contents_card.append(header, description)
    }
}

/**
 * function:    hide_matches
 * parameters:  none
 * returns:     none
 * description: Rebuilds the match list based on the selected team.
 */
function hide_matches()
{
    let team = document.getElementById('team_filter').value
    let first = populate_matches(true, true, team)
    open_option(first)
}

/**
 * function:    open_match
 * parameters:  Selected match number
 * returns:     none
 * description: Completes right info pane for a given match number.
 */
function open_option(match_key)
{
    // select option
    deselect_all()
    document.getElementById(`match_option_${match_key}`).classList.add('selected')

    // reorganize teams into single object
    let match_teams = dal.get_match_teams(match_key)
    let red_teams = Object.keys(match_teams).filter(k => k.startsWith('red')).map(k => match_teams[k])
    let blue_teams = Object.keys(match_teams).filter(k => k.startsWith('blue')).map(k => match_teams[k])

    // place match number and team to scout on pane
    document.getElementById('match_key').innerText = dal.get_match_value(match_key, 'match_name')

    // place match time
    let actual = dal.get_match_value(match_key, 'started_time')
    let predicted = dal.get_match_value(match_key, 'predicted_time')
    let time = dal.get_match_value(match_key, 'scheduled_time')
    if (actual > 0)
    {
        time.innerText = unix_to_match_time(actual)
    }
    else if (predicted > 0)
    {
        time.innerText = `${unix_to_match_time(predicted)} (Projected)`
    }

    let red_col = new ColumnFrame('red_alliance', '')
    let blue_col = new ColumnFrame('blue_alliance', '')
    let page = new PageFrame('', '', [red_col, blue_col])

    let red_card = new Card(`red_details`, '')
    red_card.add_class('red_box')
    red_col.add_input(red_card)

    let blue_card = new Card(`blue_details`, '')
    blue_card.add_class('blue_box')
    blue_col.add_input(blue_card)

    let edit = new Button('edit_coach', 'Edit Values')
    edit.link = `open_page('edit-coach')`

    // build template
    buttons_container.replaceChildren(page.element)
    buttons_container.append(edit.element)

    // populate cards with tables
    build_table('red', red_teams)
    build_table('blue', blue_teams)

    // make a table of alliance "coach-vals"
    let stats = '<tr><th></th><th>Red</th><th>Blue</th></tr>'
    let red_global = dal.compute_global_stats(cfg.coach.map(v => v.key), red_teams)
    let blue_global = dal.compute_global_stats(cfg.coach.map(v => v.key), blue_teams)
    for (let v of cfg.coach)
    {
        stats += `<tr><th>${dal.get_name(v.key, v.function)}</th><td>${dal.get_global_value(red_global, v.key, v.function, true)}</td><td>${dal.get_global_value(blue_global, v.key, v.function, true)}</td></tr>`
    }
    //document.getElementById('alliance_stats').innerHTML = stats
}

/**
 * function:    build_table
 * parameters:  alliance color, array of team numbers
 * returns:     none
 * description: Populates a card with coach vals of each team in an alliance.
 */
function build_table(alliance, teams)
{
    let images = []

    let table = document.createElement('table')

    let teams_header = table.insertRow()
    teams_header.insertCell()
    let names = table.insertRow()
    names.insertCell()
    table.append(teams_header, names)

    for (let team of teams)
    {
        images.push(dal.get_photo_carousel(team, '400px'))

        let team_header = document.createElement('th')
        team_header.innerText = team
        if (dal.is_unsure(team))
        {
            team_header.classList.add('highlighted')
        }
        teams_header.append(team_header)

        let name = document.createElement('th')
        name.innerText = dal.get_value(team, 'meta.name')
        names.append(name)
    }

    for (let v of cfg.coach)
    {
        let row = table.insertRow()
        table.append(row)

        let key = document.createElement('th')
        key.innerText = dal.get_name(v.key, v.function)
        row.append(key)

        for (let team of teams)
        {
            row.insertCell().innerText = dal.get_value(team, v.key, v.function, true)
        }
    }

    let header = document.createElement('h2')
    header.innerText = `${alliance[0].toUpperCase()}${alliance.substring(1)} Alliance`
    header.style.color = alliance

    let center = document.createElement('center')
    center.append(header)

    document.getElementById(`${alliance}_details`).replaceChildren(center)
    document.getElementById(`${alliance}_details`).append(...images, table)
}