/**
 * file:        matches-overview.js
 * description: Contains functions for the match overview selection page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-06-13
 */

// read parameters from URL
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch simple event matches from localStorage. Initialize page contents.
 */
function init_page(contents_card, buttons_container)
{
    let first = populate_matches(true, false)
    if (first)
    {
        contents_card.innerHTML = `<h2>Match <span id="match_num">No Match Selected</span></h2>
                                    <h3 id="time"></h3>
                                    <h3 id="result"></h3>
                                    <div id="extra"></div>`
        buttons_container.innerHTML = '<div id="teams"></div>'

        open_match(first)
    }
    else
    {
        contents_card.innerHTML = '<h2>No Match Data Found</h2>Please preload event'
    }
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
        
        // add match score
        let red_score = match.alliances.red.score
        let blue_score = match.alliances.blue.score
        let score = `<span class="red">${red_score}</span> - <span class="blue">${blue_score}</span>`
        if (match.winning_alliance == 'blue')
        {
            score = `<span class="blue">${blue_score}</span> - <span class="red">${red_score}</span>`
        }
        document.getElementById('result').innerHTML = score

        // add videos
        let extra = '<div id="videos"></div>'
        if (match.videos && match.videos.length > 0)
        {
            for (let vid of match.videos)
            {
                // only youtube videos
                if (vid.type == 'youtube')
                {
                    extra += `<iframe id="${vid.key}" width="426" height="240" src="https://www.youtube.com/embed/${vid.key}"></iframe>`
                }
            }
        }

        // add score breakdown
        if (match.score_breakdown)
        {
            extra += '<table style=""><tr><th>Key</th><th>Red</th><th>Blue</th></tr>'
            for (let key of Object.keys(match.score_breakdown.red))
            {
                let name = key.replace('tba_', '')
                name = name[0].toUpperCase() + name.substring(1).split(/(?=[A-Z])/).join(' ')
                name = name.replace('1', ' 1').replace('2', ' 2').replace('3', ' 3')
                let red = parse_val(match.score_breakdown.red[key])
                let blue = parse_val(match.score_breakdown.blue[key])
                extra += `<tr><th>${name}</th><td>${red}</td><td>${blue}</td></tr>`
            }
            extra += '</table>'
        }
        document.getElementById('extra').innerHTML = extra
    }
    else if (predicted > 0)
    {
        time.innerHTML = `${unix_to_match_time(predicted)} (Projected)`
    }

    // reorganize teams into single object
    let match_teams = extract_match_teams(match)

    let note_button = ''
    let reds = []
    let blues = []

    let teams = Object.keys(match_teams)
    if (match.comp_level == 'qm')
    {
        // make row for match notes
        note_button = build_link_button('note_button', 'Take Match Notes', `notes('${match_num}', ${notes_taken(match_num, event_id)})`)
    
        // make a row for each team
        for (let key of teams)
        {
            let team_num = match_teams[key]
            let alliance = key.slice(0, -1)
            let rank = ''
            let rankings = get_team_rankings(team_num, event_id)
            if (rankings)
            {
                rank = `#${rankings.rank} (${rankings.record.wins}-${rankings.record.losses}-${rankings.record.ties})`
            }
            let team = `<span class="${alliance}">${team_num}</span>`
            
            // build button to either scout or result
            let result_file = get_match_result(match_num, team_num, event_id)
            let button = build_link_button(result_file, `Scout ${team}`, `scout('${MATCH_MODE}', '${team_num}', '${alliance}', '${match_num}')`)
            if (localStorage.getItem(result_file) != null)
            {
                button = build_link_button(result_file, `${team} Results`, `open_result('${result_file}')`)
            }
    
            // add button and description to appropriate column
            let team_info = `<center>${get_team_name(team_num, event_id)}<br>${rank}</center>`
            if (alliance == 'red')
            {
                reds.push(button)
                reds.push(build_card('', team_info, limitWidth=true))
            }
            else
            {
                blues.push(button)
                blues.push(build_card('', team_info, limitWidth=true))
            }
        }
    }

    // no scouting for finals
    for (let key of teams)
    {
        let team_num = match_teams[key]
        let alliance = key.slice(0, -1)
        let rank = ''
        let rankings = get_team_rankings(team_num, event_id)
        if (rankings)
        {
            rank = `#${rankings.rank} (${rankings.record.wins}-${rankings.record.losses}-${rankings.record.ties})`
        }

        // add button and description to appropriate column
        let team_info = `<center><span class="${alliance}">${team_num}</span><br>${get_team_name(team_num, event_id)}<br>${rank}</center>`
        if (alliance == 'red')
        {
            reds.push(build_card('', team_info, limitWidth=true))
        }
        else
        {
            blues.push(build_card('', team_info, limitWidth=true))
        }
    }

    // create columns and page
    document.getElementById('teams').innerHTML = build_page_frame('', [
        note_button,
        build_column_frame('', reds),
        build_column_frame('', blues)
    ])
}

/**
 * function:    parse_val
 * parameters:  value to parse
 * returns:     parsed value
 * parameters:  Parses a value to be more human-readable on the table.
 */
function parse_val(val)
{
    if (typeof val === 'string')
    {
        val = val[0].toUpperCase() + val.substring(1).split(/(?=[A-Z])/).join(' ')
        val = val.replace('None', '').replace('Unknown', '')
    }
    else if (typeof val === 'boolean')
    {
        val = val ? 'Yes' : ''
    }
    return val
}

/**
 * function:    open_result
 * parameters:  result file to open
 * returns:     none
 * description: Loads the result page for a button when pressed.
 */
function open_result(file)
{
    return build_url('selection', {'page': 'results', [EVENT_COOKIE]: get_cookie(EVENT_COOKIE, EVENT_DEFAULT), [TYPE_COOKIE]: file.split('-')[0], 'file': file})
}

/**
 * function:    scout
 * parameters:  scouting mode, team number, alliance color, match number
 * returns:     none
 * description: Loads the scouting page for a button when pressed.
 */
function scout(mode, team, alliance, match, edit=false)
{
    return build_url('index', {'page': 'scout', [TYPE_COOKIE]: mode, [EVENT_COOKIE]: get_cookie(EVENT_COOKIE, EVENT_DEFAULT), [POSITION_COOKIE]: get_cookie(POSITION_COOKIE, POSITION_DEFAULT), [USER_COOKIE]: get_cookie(USER_COOKIE, USER_DEFAULT), 'match': match, 'team': team, 'alliance': alliance, 'edit': edit})
}

/**
 * function:    notes
 * parameters:  match number
 * returns:     none
 * description: Loads the note taking page for a button when pressed.
 */
function notes(match, edit=false)
{
    let teams = get_match_teams(match, event_id)
    let url_params = {'page': NOTE_MODE, [EVENT_COOKIE]: get_cookie(EVENT_COOKIE, EVENT_DEFAULT), [USER_COOKIE]: get_cookie(USER_COOKIE, USER_DEFAULT), 'match': match, 'edit': edit}
    return build_url('index', Object.assign({}, teams, url_params))
}