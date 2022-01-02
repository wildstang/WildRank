/**
 * file:        note.js
 * description: Contains functions for the note taking page of the web app.
 * author:      Liam Fruzyna
 * date:        2020-06-18
 */

const start = Date.now()

/** 
 * function:    build_page
 * parameters:  none
 * returns:     none
 * description: Builds the page from the given team numbers.
 */
function build_page()
{
    reds = []
    for (let i in red_teams)
    {
        build_note_box(red_teams[i], `red${parseInt(i)+1}`, reds)
    }
    blues = []
    for (let i in blue_teams)
    {
        build_note_box(blue_teams[i], `blue${parseInt(i)+1}`, blues)
    }

    let scouting = 0
    const descriptions = ['No One', 'Red Alliance', 'Blue Alliance', 'Both Alliances']
    const colors = ['white', 'red', 'blue', 'white']
    if (reds.length > 0)
    {
        document.body.innerHTML += build_page_frame('Red Alliance', reds)
        scouting += 1
    }
    if (blues.length > 0)
    {
        document.body.innerHTML += build_page_frame('Blue Alliance', blues)
        scouting += 2
    }

    document.getElementById('header_info').innerHTML = `Match: <span id="match">${match_num}</span> - Scouting: <span id="team" style="color: ${colors[scouting]}">${descriptions[scouting]}</span>`
    document.body.innerHTML += build_button(`submit_notes`, 'Submit', 'get_results_from_page()')
}

/**
 * function:    build_note_box
 * paramters:   team number, box id, array to insert into
 * returns:     none
 * description: Creates a new text box and column for a given team in a given page.
 */
function build_note_box(team_num, id, array)
{
    if (team_num)
    {
        let default_val = ''
        let file = get_note(team_num, match_num, event_id)
        if (edit && file_exists(file))
        {
            default_val = JSON.parse(localStorage.getItem(file)).notes
        }
        array.push(build_column_frame(team_num, [build_text_entry(id, get_team_name(team_num, event_id), default_val)]))
    }
}

/**
 * function:    get_results_from_page
 * parameters:  none
 * returns:     none
 * description: Accumulates the results from the page into new note save files.
 */
function get_results_from_page()
{
    results = {}

    // scouter metadata
    results['meta_scouter_id'] = parseInt(user_id)
    results['meta_scout_time'] = Math.round(start / 1000)
    results['meta_scouting_duration'] = (Date.now() - start) / 1000

    // scouting metadata
    results['meta_scout_mode'] = NOTE_MODE
    results['meta_position'] = parseInt(scout_pos)
    results['meta_event_id'] = event_id
    results['meta_match'] = parseInt(match_num)

    // save each individual team
    for (let i in red_teams)
    {
        save_team_result(results, red_teams[i], `red${parseInt(i)+1}`)
    }
    for (let i in blue_teams)
    {
        save_team_result(results, blue_teams[i], `blue${parseInt(i)+1}`)
    }

    window.location.href = build_url('selection', {'page': 'matches', [TYPE_COOKIE]: NOTE_MODE, [EVENT_COOKIE]: event_id, [POSITION_COOKIE]: scout_pos, [USER_COOKIE]: user_id})
}

/**
 * function:    save_team_result
 * parameters:  base result object, team number, box id
 * returns:     none
 * description: Adds team number and note into result and saves to file.
 */
function save_team_result(base_result, team_num, id)
{
    if (team_num)
    {
        base_result['meta_team'] = parseInt(team_num)
        base_result['notes'] = document.getElementById(id).value
        if (base_result['notes'] != '')
        {
            file = get_note(team_num, match_num, event_id)
            localStorage.setItem(file, JSON.stringify(base_result))
        }
    }
}

// read parameters from URL
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)
const scout_pos = get_parameter(POSITION_COOKIE, POSITION_DEFAULT)

var urlParams = new URLSearchParams(window.location.search)
const match_num = urlParams.get('match')
const team_num = urlParams.get('team')
const alliance_color = urlParams.get('alliance')
var edit = urlParams.get('edit') == 'true'
var results = {}

var red_teams = []
for (let i = 1; urlParams.has(`red${i}`); i++)
{
    red_teams.push(urlParams.get(`red${i}`))
}
var blue_teams = []
for (let i = 1; urlParams.has(`blue${i}`); i++)
{
    blue_teams.push(urlParams.get(`blue${i}`))
}

window.addEventListener('load', function()
{
    build_page()
})