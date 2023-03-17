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
    add_dropdown_filter('team_filter', teams, 'hide_matches()', true, cfg.settings.team_number.toString())

    if (first)
    {
        contents_card.innerHTML = `<h2><span id="match_key">No Match Selected</span></h2>
                                    <h3 id="time"></h3>
                                    <table id="alliance_stats"></table>`

        hide_matches()
    }
    else
    {
        contents_card.innerHTML = '<h2>No Match Data Found</h2>Please preload event'
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
    open_match(first)
}

/**
 * function:    open_match
 * parameters:  Selected match number
 * returns:     none
 * description: Completes right info pane for a given match number.
 */
function open_match(match_key)
{
    // select option
    deselect_all()
    document.getElementById(`match_option_${match_key}`).classList.add('selected')

    // reorganize teams into single object
    let match_teams = dal.get_match_teams(match_key)
    let red_teams = Object.keys(match_teams).filter(k => k.startsWith('red')).map(k => match_teams[k])
    let blue_teams = Object.keys(match_teams).filter(k => k.startsWith('blue')).map(k => match_teams[k])

    // place match number and team to scout on pane
    document.getElementById('match_key').innerHTML = dal.get_match_value(match_key, 'match_name')

    // place match time
    let actual = dal.get_match_value(match_key, 'started_time')
    let predicted = dal.get_match_value(match_key, 'predicted_time')
    let time = dal.get_match_value(match_key, 'scheduled_time')
    if (actual > 0)
    {
        time.innerHTML = unix_to_match_time(actual)
    }
    else if (predicted > 0)
    {
        time.innerHTML = `${unix_to_match_time(predicted)} (Projected)`
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
    buttons_container.innerHTML = page.toString + edit.toString

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
    let table = '<table><tr><td></td>'
    let names = '<tr><td></td>'
    for (let team of teams)
    {
        images += dal.get_photo_carousel(team, '400px')
        table += `<th>${team}</th>`
        names += `<th>${dal.get_value(team, 'meta.name')}</th>`
    }
    table += `</tr>${names}</tr>`
    for (let v of cfg.coach)
    {
        table += `<tr><th>${dal.get_name(v.key, v.function)}</th>`
        for (let team of teams)
        {
            table += `<td>${dal.get_value(team, v.key, v.function, true)}</td>`
        }
        table += '</tr>'
    }
    table += '</table>'
    let header = `<center><h2>${alliance[0].toUpperCase()}${alliance.substring(1)} Alliance</h2></center>`
    document.getElementById(`${alliance}_details`).innerHTML = header + images + table
}