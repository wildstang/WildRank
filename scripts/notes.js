/**
 * file:        notes.js
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
    blues = []

    build_note_box(red1, 'red1', reds)
    build_note_box(red2, 'red2', reds)
    build_note_box(red3, 'red3', reds)
    build_note_box(blue1, 'blue1', blues)
    build_note_box(blue2, 'blue2', blues)
    build_note_box(blue3, 'blue3', blues)

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
    save_team_result(results, red1, 'red1')
    save_team_result(results, red2, 'red2')
    save_team_result(results, red3, 'red3')
    save_team_result(results, blue1, 'blue1')
    save_team_result(results, blue2, 'blue2')
    save_team_result(results, blue3, 'blue3')

    // get result name
    window.location.href = document.referrer
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
const red1 = urlParams.get('red1')
const red2 = urlParams.get('red2')
const red3 = urlParams.get('red3')
const blue1 = urlParams.get('blue1')
const blue2 = urlParams.get('blue2')
const blue3 = urlParams.get('blue3')
var edit = urlParams.get('edit') == 'true'
var results = {}

window.addEventListener('load', function()
{
    build_page()
})