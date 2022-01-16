/**
 * file:        event-generator.js
 * description: Page for building test events.
 *              Generates a teams file and helps build a matches file
 * author:      Liam Fruzyna
 * date:        2022-01-12
 */

// read parameters from URL
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)

const start = Date.now()

var teams = []
var matches = []

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    // set header
    document.getElementById('header_info').innerHTML = 'Generate Event'

    // build page
    document.body.innerHTML += 
        build_page_frame('Team', [
            build_column_frame('', [
                build_str_entry('event_id', 'Event ID:', event_id, 'text', 'populate_matches()'),
                build_num_entry('num_teams', 'Number of Teams', 6, [6, 100]),
                build_num_entry('alliance_teams', 'Teams per Alliance', 3, [1, 10], 'populate_matches()'),
                build_button('generate_teams', 'Generate Teams', 'generate_teams()')
            ])
        ]) + build_page_frame('Match', ['<div id="match_col"></div>'])

    populate_matches()
}

/**
 * function:    populate_matches
 * parameters:  none
 * returns:     none
 * description: Builds the match adding right side of the page if a teams file exists.
 */
function populate_matches()
{
    let cols = []
    let event_id = document.getElementById('event_id').value
    let alliance_teams = document.getElementById('alliance_teams').value
    let file_name = get_event_teams_name(event_id)
    if (file_exists(file_name))
    {
        let teams = JSON.parse(localStorage.getItem(file_name)).map(t => t.team_number)
        let reds = []
        let blues = []
        for (let pos = 0; pos < alliance_teams; pos++)
        {
            reds.push(build_dropdown(`red_${pos}`, `Red ${pos+1}`, teams))
            blues.push(build_dropdown(`blue_${pos}`, `Blue ${pos+1}`, teams))
        }
        blues.push(build_button('add_match', 'Add Match', 'add_match()'))
        cols.push(build_column_frame('Red Teams', reds))
        cols.push(build_column_frame('Blue Teams', blues))
    }
    document.getElementById('match_col').innerHTML = cols.join('')
}

/**
 * function:    generate_teams
 * parameters:  none
 * returns:     none
 * description: Generates a new teams file for the event using the team paramters, plus an empty matches file.
 */
function generate_teams()
{
    let teams = []
    let num_teams = document.getElementById('num_teams').value
    let event_id = document.getElementById('event_id').value
    for (let team_num = 1; team_num <= num_teams; team_num++)
    {
        teams.push({
            city: 'Generated Team',
            country: 'GT',
            key: `frc${team_num}`,
            name: `Generated Team ${team_num}`,
            nickname: `Generated Team ${team_num}`,
            state_prov: 'GT',
            team_number: team_num
        })
    }
    localStorage.setItem(get_event_teams_name(event_id), JSON.stringify(teams))
    localStorage.setItem(get_event_matches_name(event_id), '[]')

    populate_matches()
}

/**
 * function:    add_match
 * parameters:  none
 * returns:     none
 * description: Adds a new match with the given parameters to the match file.
 */
function add_match()
{
    let event_id = document.getElementById('event_id').value
    let alliance_teams = document.getElementById('alliance_teams').value
    let file_name = get_event_matches_name(event_id)
    if (!file_exists(file_name))
    {
        localStorage.setItem(file_name, '[]')
    }
    let matches = JSON.parse(localStorage.getItem(file_name))
    let match_number = matches.length + 1
    let red_teams = []
    let blue_teams = []
    for (let pos = 0; pos < alliance_teams; pos++)
    {
        red_teams.push(`frc${document.getElementById(`red_${pos}`).value}`)
        blue_teams.push(`frc${document.getElementById(`blue_${pos}`).value}`)
    }
    matches.push({
        actual_time: 1294765871,
        alliances: {
            blue: {
                dq_team_keys: [],
                surrogate_team_keys: [],
                team_keys: red_teams
            },
            red: {
                dq_team_keys: [],
                surrogate_team_keys: [],
                team_keys: blue_teams
            }
        },
        comp_level: "qm",
        event_key: event_id,
        key: `${event_id}_qm${match_number}`,
        match_number: match_number,
        predicted_time: 1294765871,
        set_number: 1,
        time: 1294765871
    })
    localStorage.setItem(file_name, JSON.stringify(matches))
    alert(`Create match ${event_id} qm${match_number}`)
}