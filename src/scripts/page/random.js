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
 * Populates the contents of the page.
 */
function init_page()
{
    // set header
    header_info.innerHTML = 'Generate Results'
    
    // load in and count qualification matches
    let count = Object.keys(dal.match_keys).length

    let page = new WRPage()
    let left_col = new WRColumn()
    page.add_column(left_col)
    let right_col = new WRColumn()
    page.add_column(right_col)

    type_form = new WRSelect('Mode', cfg.scout.configs.map(c => c.name), 'Match')
    type_form.on_change = hide_buttons
    left_col.add_input(type_form)

    user_form = new WREntry('School ID', cfg.user.state.user_id)
    user_form.bounds = [100000, 999999]
    user_form.type = 'number'
    left_col.add_input(user_form)

    pos_form = new WRDropdown('Position', ['All'].concat(get_position_names()))
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
    preview.append(page)
    hide_buttons()
}

/**
 * Toggle between match and team options depending on if pit mode is selected.
 */
function hide_buttons()
{
    let mode = cfg.scout.configs[type_form.selected_index]
    if (mode.type === 'team')
    {
        min_value.label_el.innerText = 'First Team'
        max_value.label_el.innerText = 'Last Team'
        min_value.element.value = 1
        max_value.element.value = Math.max(...dal.teams_numbers)
    }
    else
    {
        min_value.label_el.innerText = 'First Match'
        max_value.label_el.innerText = 'Last Match'
        min_value.element.value = 1
        max_value.element.value = Math.max(...Object.values(dal.matches).map(m => m.match_num))
    }
}

/**
 * Processes inputs to generate results.
 */
function create_results()
{
    // load in appropriate config
    let mode = cfg.scout.configs[type_form.selected_index].id
    let pos = pos_form.element.selectedIndex

    let min = min_value.element.value
    let max = max_value.element.value
    if (mode.type === 'team')
    {
        // filter out and generate for each selected team
        if (max >= min)
        {
            let ts = dal.team_numbers.filter(t => parseInt(t) >= min && parseInt(t) <= max)
            console.log(ts)
            for (let t of ts)
            {
                create_random_result(mode, pos-1, false, t, 'white')
            }
            alert(`${ts.length} team results generated`)
        }
        else
        {
            alert('Invalid range')
        }
    }
    else
    {
        // filter out and generate for each selected position in each selected match
        if (max >= min)
        {
            let matches = dal.match_keys
            for (let match_key of matches)
            {
                let fteams = Object.values(dal.get_match_teams(match_key))
                    .filter((t, j) => pos == 0 || pos == j - 1)
                if (dal.matches[match_key].match_num <= max && dal.matches[match_key].comp_level === 'qm')
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
 * Generates a new random result for the given parameters.
 * @param {String} scout_mode Scouting mode
 * @param {Number} scout_pos Scouting position
 * @param {String} match_key Match key to generate
 * @param {String} team_num Team number to generate
 */
function create_random_result(scout_mode, scout_pos, match_key, team_num)
{
    results = {
        meta: {
            result: {
                scout_mode: scout_mode,
                event_id: cfg.user.state.event_id,
                team_num: parseInt(team_num)
            },
            scouter: {
                user_id: parseInt(cfg.user.state.user_id),
                position: scout_pos,
                start_time: Math.round(start / 1000),
                duration: Math.round((Date.now() - start) / 1000),
                config_version: cfg.scout.version,
                app_version: cfg.app_version
            },
            status: {
                unsure: false,
                unsure_reason: '',
                ignore: false
            }
        },
        result: {}
    }

    if (match_key)
    {
        results.meta.result.match_key = match_key
    }

    // get each result
    for (let page of cfg.get_scout_config(scout_mode).pages)
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
                results.result[column.id] = cycle
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
                                results.result[name] = res[i]
                            }
                            break
                        default:
                            results.result[id] = res
                            break
                    }

                    // ensure team rank is unique
                    if (id === 'note_notes_team_rank')
                    {
                        let [red_teams, blue_teams] = dal.get_match_alliances(match_key) 
                        let red = red_teams.sort().indexOf(team_num)
                        if (red < 0)
                        {
                            let blue = blue_teams.sort().indexOf(team_num)
                            results.result[id] = blue + 1
                        }
                        else
                        {
                            results.result[id] = red + 1
                        }
                    }
                }
            }
        }
    }

    localStorage.setItem(create_result_name(), JSON.stringify(results))
}