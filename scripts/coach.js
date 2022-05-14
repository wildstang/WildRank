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
    add_dropdown_filter('team_filter', teams, 'hide_matches()')

    if (first)
    {
        contents_card.innerHTML = `<h2>Match <span id="match_key">No Match Selected</span></h2>
                                    <h3 id="time"></h3>
                                    <table id="alliance_stats"></table>`

        open_match(first)
    }
    else
    {
        contents_card.innerHTML = '<h2>No Match Data Found</h2>Please preload event'
    }
}

/**
 * function:    hide_match
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
    let teams = Object.keys(match_teams)

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

    // make row for match notes
    let red_col = new ColumnFrame('red_alliance', '')
    let blue_col = new ColumnFrame('blue_alliance', '')
    let page = new PageFrame('', '', [red_col, blue_col])

    // make a row for each team
    for (let team of teams)
    {
        let entry = new Entry(`team_${team}`, '', match_teams[team])
        entry.type = 'number'
        entry.bounds = [0, 10000]
        entry.on_text_change = `open_teams('${match_key}')`

        let card = new Card(`team_${team}_details`, '')

        // add button and description to appropriate column
        if (team.startsWith('red'))
        {
            card.add_class('red_box')
            red_col.add_input(entry)
            red_col.add_input(card)
        }
        else
        {
            card.add_class('blue_box')
            blue_col.add_input(entry)
            blue_col.add_input(card)
        }
    }

    // build template
    buttons_container.innerHTML = `<div id="teams">${page.toString}</div>`

    open_teams(match_key)
}

/**
 * function:    open_teams
 * parameters:  match key
 * returns:     none
 * description: Completes right info pane for the current teams in the number entries.
 */
function open_teams(match_key)
{
    let vals = cfg.coach
    let match_teams = dal.get_match_teams(match_key)
    let red_teams = []
    let blue_teams = []

    // make a row for each team
    let keys = Object.keys(match_teams)
    for (let key of keys)
    {
        let id = `team_${key}`

        // add team name and ranking data
        let team_num = document.getElementById(id).value
        if (key.startsWith('red'))
        {
            red_teams.push(team_num)
        }
        else
        {
            blue_teams.push(team_num)
        }

        // make a table of "coach-vals"
        let notes = `<center>${dal.get_value(team_num, 'meta.name')}<br>${dal.get_rank_str(team_num)}</center><br><table>`
        for (let v of vals)
        {
            let stat = dal.get_value(team_num, v.key, v.function, true)
            notes += `<tr><th>${dal.get_name(v.key, v.function)}</th><td>${stat}</td></tr>`
        }
        notes += '</table><div class="notes">'

        // add notes from notes mode, if box is checked
        let files = Object.keys(localStorage)
        for (let file of files)
        {
            if (file.startsWith(`${NOTE_MODE}-`))
            {
                let result = JSON.parse(localStorage.getItem(file))
                if (result.meta_team == team_num && result.meta_event_id == event_id)
                {
                    if (notes == '')
                    {
                        notes = ''
                    }
                    else {
                        notes += '<br>'
                    }
                    notes += result.notes
                }
            }
        }
        notes += '</div>'

        document.getElementById(`${id}_details`).innerHTML = notes
    }

    // make a table of alliance "coach-vals"
    let stats = '<tr><th></th><th>Red</th><th>Blue</th></tr>'
    let red_global = dal.compute_global_stats(vals.map(v => v.key), red_teams)
    let blue_global = dal.compute_global_stats(vals.map(v => v.key), blue_teams)
    for (let v of vals)
    {
        stats += `<tr><th>${dal.get_name(v.key, v.function)}</th><td>${dal.get_global_value(red_global, v.key, v.function, true)}</td><td>${dal.get_global_value(blue_global, v.key, v.function, true)}</td></tr>`
    }
    document.getElementById('alliance_stats').innerHTML = stats
}