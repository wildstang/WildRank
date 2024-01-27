/**
 * file:        random.js
 * description: Page for generating random match/pit results.
 *              Built for easy data generation for testing.
 * author:      Liam Fruzyna
 * date:        2021-09-06
 */

// read parameters from URL
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

const start = Date.now()

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
    let count = Object.keys(dal.matches).length

    let page = new PageFrame('', '')
    let left_col = new ColumnFrame('', '')
    page.add_column(left_col)
    let right_col = new ColumnFrame('', '')
    page.add_column(right_col)

    let type_form = new Select('type_form', 'Mode', MODES.map(m => m.charAt(0).toUpperCase() + m.substring(1)), 'Match')
    type_form.on_change = 'hide_buttons()'
    left_col.add_input(type_form)

    let user_form = new Entry('user_id', 'School ID', user_id)
    user_form.bounds = [100000, 999999]
    user_form.type = 'number'
    left_col.add_input(user_form)

    let pos_form = new Dropdown('position', 'Position', ['All'].concat(Object.values(dal.get_team_keys())))
    right_col.add_input(pos_form)

    let min_value = new Entry('min_value', 'First Match', 1)
    min_value.type = 'number'
    right_col.add_input(min_value)

    let max_value = new Entry('max_value', 'Last Match', count)
    max_value.type = 'number'
    right_col.add_input(max_value)

    let generate = new Button('generate', 'Generate Results')
    generate.on_click = 'create_results()'
    right_col.add_input(generate)

    // build page
    document.getElementById('body').append(page.element)
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
    let mode = MODES[Select.get_selected_option('type_form')]
    if (mode === PIT_MODE)
    {
        document.getElementById('min_value_label').innerText = 'First Team'
        document.getElementById('max_value_label').innerText = 'Last Team'
        document.getElementById('min_value').value = 1
        document.getElementById('max_value').value = Math.max(...Object.keys(dal.teams))
    }
    else if (mode === MATCH_MODE || mode == NOTE_MODE)
    {
        document.getElementById('min_value_label').innerText = 'First Match'
        document.getElementById('max_value_label').innerText = 'Last Match'
        document.getElementById('min_value').value = 1
        document.getElementById('max_value').value = Math.max(...Object.values(dal.matches).map(m => m.match_number))
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
    let mode = MODES[Select.get_selected_option('type_form')]
    let pos = document.getElementById('position').selectedIndex

    let min = parseInt(document.getElementById('min_value').value)
    let max = parseInt(document.getElementById('max_value').value)
    if (mode === PIT_MODE)
    {
        // filter out and generate for each selected team
        if (max >= min)
        {
            let teams = Object.keys(dal.teams)
            let ts = teams.filter(t => t >= min && t <= max)
            for (let t of ts)
            {
                create_random_result(mode, pos-1, -1, t, 'white')
            }
            alert(`${ts.length} pit results generated`)
        }
        else
        {
            alert('Invalid range')
        }
    }
    else if (mode === MATCH_MODE || mode == NOTE_MODE)
    {
        // filter out and generate for each selected position in each selected match
        if (max >= min)
        {
            let matches = Object.keys(dal.matches)
            for (let match_key of matches)
            {
                let fteams = Object.values(dal.get_match_teams(match_key))
                    .filter((t, j) => pos == 0 || pos == j - 1)
                
                if (dal.matches[match_key].match_number <= max && dal.matches[match_key].comp_level === 'qm')
                {
                    for (let j in fteams)
                    {
                        create_random_result(mode, pos == 0 ? j : pos-1, match_key, fteams[j], j < dal.alliance_size ? 'red' : 'blue')
                    }
                }
            }
            alert(`${max - min + 1} match results generated`)
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
function create_random_result(scout_mode, scout_pos, match_key, team_num, alliance_color)
{
    results = {}

    // scouter metadata
    if (scout_mode != NOTE_MODE)
    {
        results['meta_scouter_id'] = parseInt(user_id)
        results['meta_scout_time'] = Math.round(start / 1000)
        results['meta_scouting_duration'] = (Date.now() - start) / 1000
    }
    else
    {
        results['meta_note_scouter_id'] = parseInt(user_id)
        results['meta_note_scout_time'] = Math.round(start / 1000)
        results['meta_note_scouting_duration'] = (Date.now() - start) / 1000
    }

    // scouting metadata
    results['meta_scout_mode'] = scout_mode
    results['meta_position'] = parseInt(scout_pos)
    results['meta_event_id'] = event_id

    // match metadata
    if (scout_mode != PIT_MODE)
    {
        results['meta_match_key'] = match_key
        results['meta_comp_level'] = dal.get_match_value(match_key, 'comp_level')
        results['meta_set_number'] = parseInt(dal.get_match_value(match_key, 'set_number'))
        results['meta_match'] = dal.get_match_value(match_key, 'match_number')
        results['meta_alliance'] = alliance_color
    }
    results['meta_team'] = parseInt(team_num)

    // get each result
    for (let page of cfg[scout_mode])
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
                        let options = input.options

                        let res = generate_result_for_input(input)
                        switch (type)
                        {
                            case 'multicounter':
                            case 'multiselect':
                                for (let i in options)
                                {
                                    let name = `${id}_${options[i].toLowerCase().split().join('_')}`
                                    c[name] = res[i]
                                }
                                break
                            default:
                                c[id] = res
                                break
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

                    let res = generate_result_for_input(input)
                    switch (type)
                    {
                        case 'multicounter':
                        case 'multiselect':
                            for (let i in options)
                            {
                                let name = `${id}_${options[i].toLowerCase().split().join('_')}`
                                results[name] = res[i]
                            }
                            break
                        default:
                            results[id] = res
                            break
                    }

                    // ensure team rank is unique
                    if (id === 'note_notes_team_rank')
                    {
                        let red = dal.matches[match_key].red_alliance.sort().indexOf(team_num)
                        if (red < 0)
                        {
                            let blue = dal.matches[match_key].blue_alliance.sort().indexOf(team_num)
                            results[id] = blue + 1
                        }
                        else
                        {
                            results[id] = red + 1
                        }
                    }
                }
            }
        }
    }

    // get result name and save
    let file = `pit-${event_id}-${team_num}`
    if (scout_mode === MATCH_MODE || scout_mode === NOTE_MODE)
    {
        file = `${scout_mode}-${match_key}-${team_num}`
    }
    localStorage.setItem(file, JSON.stringify(results))
}