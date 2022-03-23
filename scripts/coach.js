/**
 * file:        coach.js
 * description: Contains functions for the driver coach view page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2021-09-03
 */

const FUNCTIONS = ['mean', 'median', 'mode', 'min', 'max']

var vals = [] 
var results = {}
var meta = {}

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch simple event matches from localStorage. Initialize page contents.
 */
function init_page(contents_card, buttons_container)
{
    // load in config and results
    meta = get_result_meta(type, year)
    vals = get_config('coach-vals')[year]
    results = get_results(prefix, year)

    // build page
    let first = populate_matches()
    let file_name = get_event_teams_name(event_id)
    if (localStorage.getItem(file_name) != null)
    {
        let teams = JSON.parse(localStorage.getItem(file_name)).map(t => t.team_number)
        teams.unshift('')
        add_dropdown_filter('team_filter', teams, 'hide_matches()')
    }
    if (first)
    {
        contents_card.innerHTML = `<h2>Match <span id="match_num">No Match Selected</span></h2>
                                    <h3 id="time"></h3>
                                    <table id="alliance_stats"></table>`

        // reorganize teams into single object
        let match_teams = get_match_teams(1, event_id)

        // make row for match notes
        let reds = []
        let blues = []

        // make a row for each team
        let teams = Object.keys(match_teams)
        for (let i in teams)
        {
            let key = teams[i]
            // add button and description to appropriate column
            if (key.slice(0, -1) == 'red')
            {
                reds.push(build_num_entry(`team_${i}`, '', '', [0, 10000], 'open_teams()'))
                reds.push(build_card(`team_${i}_details`, '', false, 'red_box'))
            }
            else
            {
                blues.push(build_num_entry(`team_${i}`, '', '', [0, 10000], 'open_teams()'))
                blues.push(build_card(`team_${i}_details`, '', false, 'blue_box'))
            }
        }

        // build template
        buttons_container.innerHTML = build_checkbox('show_notes', 'Show Notes', false, `toggle_notes()`) +
            '<div id="teams">' +
            build_page_frame('', [
                build_column_frame('', reds),
                build_column_frame('', blues)
            ]) +'</div>'

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
function open_match(match_num)
{
    deselect_all()
    
    // select option
    document.getElementById(`match_${match_num}`).classList.add('selected')

    // place match number and team to scout on pane
    document.getElementById('match_num').innerHTML = match_num

    // place match time
    let match = parse_match(match_num, event_id)
    let actual = match.actual_time
    let predicted = match.predicted_time
    let time = document.getElementById('time')
    if (actual > 0)
    {
        time.innerHTML = unix_to_match_time(actual)
    }
    else if (predicted > 0)
    {
        time.innerHTML = `${unix_to_match_time(predicted)} (Projected)`
    }

    // reorganize teams into single object
    let match_teams = extract_match_teams(match)
    let teams = Object.keys(match_teams)

    // get matches for each alliance
    let red_res = {}
    let blue_res = {}
    for (let team of teams)
    {
        let res = get_team_results(results, match_teams[team])
        if (team.startsWith('red'))
        {
            Object.assign(red_res, res)
        }
        else if (team.startsWith('blue'))
        {
            Object.assign(blue_res, res)
        }
    }

    // make a row for each team
    for (let index in teams)
    {
        document.getElementById(`team_${parseInt(index)}`).value = match_teams[teams[index]]
    }

    open_teams()
}

/**
 * function:    open_teams
 * parameters:  none
 * returns:     none
 * description: Completes right info pane for the current teams in the number entries.
 */
function open_teams()
{
    // reorganize teams into single object
    let match_teams = get_match_teams(1, event_id)
    let format = get_teams_format(event_id)

    let red_totals = {}
    let blue_totals = {}
    for (let v of vals)
    {
        red_totals[v.key] = 0
        blue_totals[v.key] = 0
    }

    // make a row for each team
    for (let index in Object.keys(match_teams))
    {
        let id = `team_${parseInt(index)}`

        // add team name and ranking data
        let team_num = document.getElementById(id).value
        let rank = ''
        let rankings = get_team_rankings(team_num, event_id)
        if (rankings)
        {
            rank = `#${rankings.rank} (${rankings.record.wins}-${rankings.record.losses}-${rankings.record.ties})`
        }

        // make a table of "coach-vals"
        let notes = `<center>${get_team_name(team_num, event_id)}<br>${rank}</center><br><table>`
        for (let v of vals)
        {
            let stat = avg_results(get_team_results(results, team_num), v.key, meta[v.key].type, FUNCTIONS.indexOf(v.function), meta[v.key].options)
            if (parseInt(index) >= format.red)
            {
                if (typeof stat === 'object')
                {
                    if (blue_totals[v.key] == 0)
                    {
                        blue_totals[v.key] = stat
                    }
                    else
                    {
                        for (let k of Object.keys(stat))
                        {
                            blue_totals[v.key][k] += stat[k]
                        }
                    }
                }
                else
                {
                    blue_totals[v.key] += stat
                }
            }
            else
            {
                if (typeof stat === 'object')
                {
                    if (red_totals[v.key] == 0)
                    {
                        red_totals[v.key] = stat
                    }
                    else
                    {
                        for (let k of Object.keys(stat))
                        {
                            red_totals[v.key][k] += stat[k]
                        }
                    }
                }
                else
                {
                    red_totals[v.key] += stat
                }
            }
            notes += `<tr><th>${v.function.charAt(0).toUpperCase()}${v.function.substr(1)} ${meta[v.key].name}</th><td>${get_value(meta, v.key, stat)}</td></tr>`
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
    for (let v of vals)
    {
        stats += `<tr><th>${v.function.charAt(0).toUpperCase()}${v.function.substr(1)} ${meta[v.key].name}</th><td>${get_value(meta, v.key, red_totals[v.key])}</td><td>${get_value(meta, v.key, blue_totals[v.key])}</td></tr>`
    }
    document.getElementById('alliance_stats').innerHTML = stats

    toggle_notes()
}

/**
 * function:    toggle_notes
 * parameters:  none
 * returns:     none
 * description: Shows/hides the note blocks based on checkbox.
 */
function toggle_notes()
{
    for (let n of Array.from(document.getElementsByClassName('notes')))
    {
        n.style.display = document.getElementById('show_notes').checked ? 'block' : 'none'
    }
}