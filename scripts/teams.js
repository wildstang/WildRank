/**
 * file:        teams.js
 * description: Contains functions for the team overview page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-06-13
 */

const CONTENTS = `<img id="avatar">
                  <h2><span id="team_num">No Team Selected</span> <span id="team_name"></span></h2>
                  <h3 id="location"></h3>
                  <h3 id="ranking"></h3>
                  <img id="photo" alt="No image available">
                  <table id="contents"></table>`
    
const BUTTONS = ``

var teams

/**
 * function:    open_option
 * parameters:  Selected team number
 * returns:     none
 * description: Completes right info pane for a given team number.
 */
function open_option(team_num)
{
    // select new option
    teams.forEach(function (team, index)
    {
        document.getElementById(`option_${team.team_number}`).classList.remove('selected')
    })
    document.getElementById(`option_${team_num}`).classList.add('selected')

    // populate top
    document.getElementById('avatar').src = get_avatar(team_num, event_id.substr(0, 4))
    document.getElementById('team_num').innerHTML = team_num
    document.getElementById('team_name').innerHTML = get_team_name(team_num, event_id)
    document.getElementById('location').innerHTML = get_team_location(team_num, event_id)

    // populate ranking
    let rankings = get_team_rankings(team_num, event_id)
    if (rankings)
    {
        document.getElementById('ranking').innerHTML = `Rank: ${rankings.rank} (${rankings.record.wins}-${rankings.record.losses}-${rankings.record.ties})`
    }

    // find robot photo
    let photo = document.getElementById('photo')
    photo.setAttribute('onerror', `use_cached_image(${team_num}, "photo")`)
    file = get_team_image_name(team_num, event_id)
    photo.setAttribute('src', `/uploads/${file}.png`)

    // add pit row
    let result_file = get_pit_result(team_num, event_id)
    let result = build_button(result_file, 'Scout Pit', `scout('${PIT_MODE}', '${team_num}', 'white')`)
    if (localStorage.getItem(result_file) != null)
    {
        result = build_button(result_file, 'View Result', `open_result('${result_file}')`)
    }
    let table = `<tr><td>Pit</td><td>${result}</td></tr>`

    // add row for each match
    let file_name = get_event_matches_name(event_id)
    if (localStorage.getItem(file_name) != null)
    {
        matches = JSON.parse(localStorage.getItem(file_name))
        matches.forEach(function (match, index)
        {
            if (match.comp_level == 'qm')
            {
                // determine team's alliance (if any)
                let alliance = ''
                if (match.alliances.blue.team_keys.includes(`frc${team_num}`))
                {
                    alliance = 'blue'
                }
                else if (match.alliances.red.team_keys.includes(`frc${team_num}`))
                {
                    alliance = 'red'
                }

                // make match row
                if (alliance)
                {
                    // make match button
                    result_file = get_match_result(match.match_number, team_num, event_id)
                    result = build_button(result_file, 'Scout Match', `scout('${MATCH_MODE}', '${team_num}', '${alliance}', '${match.match_number}')`)
                    if (localStorage.getItem(result_file) != null)
                    {
                        result = build_button(result_file, 'View Result', `open_result('${result_file}')`)
                    }

                    // add time
                    let actual = match.actual_time
                    let predicted = match.predicted_time
                    let time = ''
                    if (actual > 0)
                    {
                        time = `${unix_to_match_time(actual)}`
                    }
                    else if (predicted > 0)
                    {
                        time = `${unix_to_match_time(predicted)} (projected)`
                    }
                    
                    table += `<tr><td class="${alliance}">${match.match_number}</td><td>${result}</td><td>${time}</td></tr>`
                }
            }
        })
        document.getElementById('contents').innerHTML = table
    }
}

/**
 * function:    open_result
 * parameters:  result file to open
 * returns:     none
 * description: Loads the result page for a button when pressed.
 */
function open_result(file)
{
    document.location.href = `/selection.html${build_query({'page': 'results', [EVENT_COOKIE]: get_cookie(EVENT_COOKIE, EVENT_DEFAULT), [TYPE_COOKIE]: file.split('-')[0], 'file': file})}`
}

/**
 * function:    scout
 * parameters:  scouting mode, team number, alliance color, match number
 * returns:     none
 * description: Loads the scouting page for a button when pressed.
 */
function scout(mode, team, alliance, match='')
{
    document.location.href = `/scout.html${build_query({[TYPE_COOKIE]: mode, [EVENT_COOKIE]: get_cookie(EVENT_COOKIE, EVENT_DEFAULT), [POSITION_COOKIE]: get_cookie(POSITION_COOKIE, POSITION_DEFAULT), [USER_COOKIE]: get_cookie(USER_COOKIE, USER_DEFAULT), 'match': match, 'team': team, 'alliance': alliance})}`
}

/**
 * function:    build_team_list
 * parameters:  none
 * returns:     none
 * description: Completes left select team pane with teams from event data.
 */
function build_team_list()
{
    let first = ''
    // iterate through team objs
    teams.forEach(function (team, index)
    {
        let number = team.team_number
        // determine if the team has already been scouted
        let scouted = 'not_scouted'
        if (first == '')
        {
            first = number
        }

        // replace placeholders in template and add to screen
        document.getElementById('option_list').innerHTML += build_option(number, scouted)
    })
    open_option(first)
    scroll_to('option_list', `option_${first}`)
}

/**
 * function:    load_event
 * parameters:  none
 * returns:     none
 * description: Fetch simple event teams from localStorage.
 *              Build team list on load completion.
 */
function load_event()
{
    let file_name = get_event_teams_name(event_id)
    let preview = document.getElementById('preview')

    if (localStorage.getItem(file_name) != null)
    {
        preview.innerHTML = preview.innerHTML.replace(/CONTENTS/g, CONTENTS)
                                             .replace(/BUTTONS/g, BUTTONS)
        
        teams = JSON.parse(localStorage.getItem(file_name))
        build_team_list()
    }
    else
    {
        preview.innerHTML = preview.innerHTML.replace(/CONTENTS/g, '<h2>No Team Data Found</h2>Please preload event')
                                             .replace(/BUTTONS/g, '')
    }
}

// read parameters from URL
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

// load event data on page load
load_event()