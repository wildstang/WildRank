/**
 * file:        random.js
 * description: Page for generating random match/pit results.
 *              Built for easy data generation for testing.
 * author:      Liam Fruzyna
 * date:        2021-09-06
 */

const start = Date.now()

var type_form, user_form, pos_form, min_value, max_value

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    // set header
    header_info.innerHTML = 'Generate Results'
    
    // load in and count qualification matches
    let count = Object.keys(dal.matches).length

    let page = new WRPage()
    let left_col = new WRColumn()
    page.add_column(left_col)
    let right_col = new WRColumn()
    page.add_column(right_col)

    type_form = new WRSelect('Mode', MODES.map(m => capitalize(m)), 'Match')
    type_form.on_change = hide_buttons
    left_col.add_input(type_form)

    user_form = new WREntry('School ID', cfg.user.state.user_id)
    user_form.bounds = [100000, 999999]
    user_form.type = 'number'
    left_col.add_input(user_form)

    pos_form = new WRDropdown('Position', ['All'].concat(dal.get_position_names()))
    right_col.add_input(pos_form)

    min_value = new WREntry('First Match', 1)
    min_value.type = 'number'
    right_col.add_input(min_value)

    max_value = new WREntry('Last Match', count)
    max_value.type = 'number'
    right_col.add_input(max_value)

    let generate = new WRButton('Generate Results', create_results)
    right_col.add_input(generate)

    // build page
    body.append(page)
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
    let mode = MODES[type_form.selected_index]
    if (mode === PIT_MODE)
    {
        min_value.label_el.innerText = 'First Team'
        max_value.label_el.innerText = 'Last Team'
        min_value.element.value = 1
        max_value.element.value = Math.max(...Object.keys(dal.teams))
    }
    else if (mode === MATCH_MODE || mode == NOTE_MODE)
    {
        min_value.label_el.innerText = 'First Match'
        max_value.label_el.innerText = 'Last Match'
        min_value.element.value = 1
        max_value.element.value = Math.max(...Object.values(dal.matches).map(m => m.match_number))
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
    let mode = MODES[type_form.selected_index]
    let pos = pos_form.element.selectedIndex

    let min = min_value.element.value
    let max = max_value.element.value
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
        results['meta_scouter_id'] = parseInt(cfg.user.state.user_id)
        results['meta_scout_time'] = Math.round(start / 1000)
        results['meta_scouting_duration'] = (Date.now() - start) / 1000
    }
    else
    {
        results['meta_note_scouter_id'] = parseInt(cfg.user.state.user_id)
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
                                    let name = `${id}_${create_id_from_name(options[i])}`
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
                                let name = `${id}_${create_id_from_name(options[i])}`
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