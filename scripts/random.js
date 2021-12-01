/**
 * file:        random.js
 * description: Page for generating random match/pit/note results.
 *              Built for easy data generation for testing.
 * author:      Liam Fruzyna
 * date:        2021-09-06
 */

// read parameters from URL
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)
const scout_mode = get_parameter(TYPE_COOKIE, TYPE_DEFAULT)

const year = event_id.substr(0,4)
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
    document.getElementById('header_info').innerHTML = 'Generate Results'
    
    // load in and count qualification matches
    matches = JSON.parse(localStorage.getItem(get_event_matches_name(event_id)))
        .filter(m => m.comp_level == 'qm')
        .sort((a, b) => a.match_number - b.match_number)
    let count = matches.length

    // load in and count teams
    teams = JSON.parse(localStorage.getItem(get_event_teams_name(event_id))).map(t => t.team_number)
    let last = Math.max(...teams)

    // select default scouting position
    let mode = 'Match'
    if (scout_mode.toLowerCase() == PIT_MODE)
    {
        mode = 'Pit'
    }
    else if (scout_mode.toLowerCase() == NOTE_MODE)
    {
        mode = 'Note'
    }

    // build page
    document.body.innerHTML += build_page_frame('', [
        build_column_frame('', [
            build_select('type_form', 'Mode:', ['Pit', 'Match', 'Note'], mode, 'hide_buttons()'),
            build_num_entry('user_id', 'School ID:', user_id, [100000, 999999])
        ]),
        build_column_frame('', [
            '<div id="match_ops">' +
                build_dropdown('position', 'Position:', ['All'].concat(get_team_keys(event_id)), 'scout_pos') +
                build_num_entry('min_match', 'First Match', 1, [1, count]) + 
                build_num_entry('max_match', 'Last Match', count, [1, count]) +
            '</div>',
            '<div id="team_ops">' +
                build_num_entry('min_team', 'First Team', 1, [1, last]) +
                build_num_entry('max_team', 'Last Team', last, [1, last]) +
            '</div>',
            build_button('generate', 'Generate Results', 'create_results()')
        ])
    ])
    hide_buttons()
}

/**
 * function:    hide_buttons
 * parameters:  none
 * returns:     none
 * description: Toggle between match and team options depending on if pit mode is selected.
 */
function hide_buttons()
{
    if (get_selected_option('type_form') == 0)
    {
        document.getElementById('match_ops').style.display = 'none'
        document.getElementById('team_ops').style.display = 'block'
    }
    else
    {
        document.getElementById('match_ops').style.display = 'block'
        document.getElementById('team_ops').style.display = 'none'
    }
}

/**
 * function:    create_results
 * parameters:  none
 * returns:     none
 * description: Processes inputs to generate results.
 */
function create_results()
{
    // load in appropriate config
    let mode = [PIT_MODE, MATCH_MODE, NOTE_MODE][get_selected_option('type_form')]
    let pos = document.getElementById('position').selectedIndex

    if (mode == PIT_MODE)
    {
        let min = parseInt(document.getElementById('min_team').value)
        let max = parseInt(document.getElementById('max_team').value)

        // filter out and generate for each selected team
        if (max >= min)
        {
            let ts = teams.filter(t => t >= min && t <= max)
            for (let t of ts)
            {
                create_random_result(mode, pos-1, -1, t)
            }
            alert(`${ts.length} pit results generated`)
        }
        else
        {
            alert('Invalid range')
        }
    }
    else if (mode == MATCH_MODE)
    {
        let min = parseInt(document.getElementById('min_match').value)
        let max = parseInt(document.getElementById('max_match').value)

        // filter out and generate for each selected position in each selected match
        if (max >= min)
        {
            for (let i = min; i <= max; i++)
            {
                let fteams = matches[i-1].alliances.red.team_keys
                    .concat(matches[i-1].alliances.blue.team_keys)
                    .filter((t, j) => pos == 0 || pos == j - 1)
                    .map(t => t.substr(3))
                
                for (let j in fteams)
                {
                    create_random_result(mode, pos == 0 ? j : pos-1, i, fteams[j])
                }
            }
            alert(`${max - min + 1} match results generated`)
        }
        else
        {
            alert('Invalid range')
        }
    }
    else if (mode == NOTE_MODE)
    {
        let min = parseInt(document.getElementById('min_match').value)
        let max = parseInt(document.getElementById('max_match').value)

        // filter out and generate for each selected position in each selected match
        if (max >= min)
        {
            for (let i = min; i <= max; i++)
            {
                let fteams = matches[i-1].alliances.red.team_keys
                fteams = fteams.concat(matches[i-1].alliances.blue.team_keys)
                    .filter((t, i) => pos == 0 || pos == i - 1)
                    .map(t => t.substr(3))

                generate_notes(pos == 0 ? i : pos-1, i, fteams)
            }
            alert(`${max - min + 1} match notes generated`)
        }
        else
        {
            alert('Invalid range')
        }
    }
}

/**
 * function:    create_random_result
 * parameters:  scouting mode, scouting position, match number, team number
 * returns:     none
 * description: Generates and saves a new random result
 */
function create_random_result(scout_mode, scout_pos, match_num, team_num)
{
    results = {}

    // scouter metadata
    results['meta_scouter_id'] = parseInt(user_id)
    results['meta_scout_time'] = Math.round(start / 1000)
    results['meta_scouting_duration'] = (Date.now() - start) / 1000

    // scouting metadata
    results['meta_scout_mode'] = scout_mode
    results['meta_position'] = parseInt(scout_pos)
    results['meta_event_id'] = event_id

    // match metadata
    if (scout_mode != PIT_MODE)
    {
        results['meta_match'] = parseInt(match_num)
    }
    results['meta_team'] = parseInt(team_num)

    // get each result
    let pages = get_scout_config(scout_mode, year).pages
    for (let page of pages)
    {
        for (let column of page.columns)
        {
            // check if its a cycle column
            if (column.cycle)
            {
                let cycle = []
                let num_cycles = random_int()
                for (let i = 0; i < num_cycles; ++i)
                {
                    let c = {}
                    for (let input of column.inputs)
                    {
                        let id = input.id
                        let type = input.type
                        let ops = input.options

                        if (type == 'multicounter')
                        {
                            for (let op of ops)
                            {
                                c[`${id}_${op.toLowerCase().split().join('_')}`] = random_int()
                            }
                        }
                        else if (type == 'counter')
                        {
                            c[id] = random_int()
                        }
                        else
                        {
                            c[id] = random_int(0, ops.length-1)
                        }
                    }
                    cycle.push(c)
                }
                results[column.id] = cycle
            }
            else
            {
                for (let input of column.inputs)
                {
                    let id = input.id
                    let type = input.type
                    let options = input.options
                    let min = 0
                    let max = 10

                    // randomly generate results appropriate for each input
                    switch (type)
                    {
                        case 'checkbox':
                            results[id] = random_bool()
                            break
                        case 'counter':
                            results[id] = random_int()
                            break
                        case 'multicounter':
                            for (let op of options)
                            {
                                let name = `${id}_${op.toLowerCase().split().join('_')}`
                                results[name] = random_int()
                            }
                            break
                        case 'select':
                            results[id] = random_int(0, options.length - 1)
                            break
                        case 'dropdown':
                            results[id] = random_int(0, options.length - 1)
                            break
                        case 'number':
                            if (options.length == 2)
                            {
                                min = options[0]
                                max = options[1]
                            }
                            else if (options.length == 1)
                            {
                                max = options[0]
                            }
                            results[id] = random_int(min, max)
                            break
                        case 'slider':
                            if (options.length >= 2)
                            {
                                min = options[0]
                                max = options[1]
                            }
                            results[id] = random_int(min, max)
                            break
                        case 'string':
                            results[id] = 'Random Result'
                        case 'text':
                            results[id] = 'This result was randomly generated'
                            break
                    }
                }
            }
        }
    }

    // get result name and save
    let file = get_pit_result(team_num, event_id)
    if (scout_mode == MATCH_MODE)
    {
        file = get_match_result(match_num, team_num, event_id)
    }
    localStorage.setItem(file, JSON.stringify(results))
}

/**
 * function:    generate_nodes
 * parameters:  scouting position, match number, list of teams
 * returns:     none
 * description: Generates a "random" note for each given team in a match.
 *              Note: text isn't randomly generated so nothing is here.
 */
function generate_notes(scout_pos, match_num, teams)
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
    for (let team of teams)
    {
        if (team)
        {
            results['meta_team'] = parseInt(team)
            results['notes'] = 'This result was randomly generated'
            if (results['notes'] != '')
            {
                file = get_note(team, match_num, event_id)
                localStorage.setItem(file, JSON.stringify(results))
            }
        }
    }
}