/**
 * file:        scout.js
 * description: Page for collecting scouting data during matches.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

const start = Date.now()

var cycles = {}
var alliances = {}

// read parameters from URL
var urlParams = new URLSearchParams(window.location.search)
const scout_mode = urlParams.get(MODE_QUERY)
const index = urlParams.get('index')
var edit = urlParams.get('edit').toLowerCase() == 'true'

var unsure
var team_num
var match_key

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    // build a structure for the header
    let match_box = document.createElement('span')
    let team_box = document.createElement('span')
    header_info.append(match_box, ' - Scouting: ', team_box)

    switch (scout_mode)
    {
        case MATCH_MODE:
            // validate that the index is a valid match ID
            match_key = index
            if (!dal.is_match(match_key))
            {
                alert(`Invalid match key "${match_key}"`)
                header_info.innerText = 'Error'
                return
            }

            // determine team numbers for match
            let pos = cfg.get_selected_position()
            team_num = dal.get_scouting_team(match_key, pos)
            alliances = dal.build_relative_alliances(team_num, match_key)

            // disable editing if the match hasn't been scouted
            if (edit && !dal.is_match_scouted(match_key, team_num))
            {
                alert(`Could not find result "${match_key}-${team_num}"`)
                edit = false
            }

            // populate the header with the match and team
            match_box.innerText = dal.get_match_value(match_key, 'match_name')
            team_box.innerText = `${team_num} (${pos})`
            team_box.style.color = dal.get_scouting_alliance(pos)
            team_box.style.backgroundColor = 'rgba(0, 0, 0, 0.33)'
            team_box.style.boxShadow = '0 0 4px 4px rgba(0, 0, 0, 0.33)'
            break
        case PIT_MODE:
            // validate that the index is a valid team number
            team_num = index
            if (!dal.is_team(team_num))
            {
                alert(`Invalid team "${team_num}"`)
                header_info.innerText = 'Error'
                return
            }

            // disable editing if the team hasn't been scouted
            if (edit && !dal.is_pit_scouted(team_num))
            {
                alert(`Could not find result "${team_num}"`)
                edit = false
            }

            // populate the header with the team
            match_box.innerText = 'Pit'
            team_box.innerText = team_num
            team_box.style.color = 'white'
            break
        default:
            alert(`Invalid mode "${scout_mode}"`)
            header_info.innerText = 'Error'
            return
    }

    ws(team_num)
    build_page_from_config()
}

/**
 * function:    check_for_last_page
 * parameters:  none
 * returns:     none
 * description: If on the last page, add the submit button.
 */
function check_for_last_page()
{
    let carousel = document.getElementById('scouting-carousel')
    let final_page = carousel.clientWidth * (cfg.get_scout_config(scout_mode).pages.length - 1)
    let view_start = Math.ceil(carousel.scrollLeft)
    if (view_start >= final_page && document.getElementById('submit_container').childElementCount === 0)
    {
        let submit = new WRButton('Submit', get_results_from_page)
        document.getElementById('submit_container').replaceChildren(submit)
    }
}

/**
 * function:    build_page_from_config
 * parameters:  none
 * returns:     none
 * description: Builds the page from the config file and the given mode.
 */
function build_page_from_config()
{
    // iterate through each page in the mode
    let carousel = create_element('div', 'scouting-carousel', 'scouting-carousel')
    carousel.onscroll = check_for_last_page
    for (let page of cfg.get_scout_config(scout_mode).pages)
    {
        let page_frame = new WRPage(page.name)
        // iterate through each column in the page
        for (let column of page.columns)
        {
            let cycle = column.cycle
            let col_frame = build_column_from_config(column, scout_mode, edit && !cycle, match_key, team_num, '', alliances)
            if (cycle)
            {
                // create and populate (if editing) cycle arrays
                if (edit && scout_mode === PIT_MODE)
                {
                    cycles[column.id] = dal.get_value(team_num, `pit.${column.id}`)
                }
                else if (edit)
                {
                    cycles[column.id] = dal.get_result_value(team_num, match_key, column.id)
                }
                else
                {
                    cycles[column.id] = []
                }

                // create cycle counter, call update_cycle() on change
                let cycler = new WRCycler('Cycles', cycles[column.id].length)
                cycler.input_id = column.id
                if (cycle)
                {
                    cycler.on_advance = update_cycle
                }
                col_frame.add_input(cycler)
                col_frame.add_class('cycle')
            }
            page_frame.add_column(col_frame)
        }
        carousel.append(page_frame)
    }

    unsure = new WRCheckbox(`Unsure of Results`)
    let submit = create_element('span', 'submit_container')
    let page_options = new WRPage('', [new WRColumn('', [unsure]), new WRColumn('', [submit])])
    body.replaceChildren(carousel, page_options)
    check_for_last_page()
}

/**
 * function:    update_cycle
 * parameters:  cycle name, if cycle was decremented
 * returns:     If increment/decrement is allowed
 * description: Saves the current cycles and moves on to the next.
 */
function update_cycle(cycle, decrement)
{
    // get selected and total number of cycles
    let counter = document.getElementById(cycle)
    let cycle_num = parseInt(counter.innerText)
    let saved_cycles = cycles[cycle].length

    let existing_result = {}
    let cycle_result = {}
    let saving_new_cycle = saved_cycles < cycle_num
    let starting_new_cycle = saved_cycles <= cycle_num
    if (!starting_new_cycle)
    {
        existing_result = cycles[cycle][cycle_num]
    }

    // iterate through each column in the page
    for (let page of cfg.get_scout_config(scout_mode).pages)
    {
        // iterate through each column in the page
        for (let column of page.columns)
        {
            if (column.id == cycle)
            {
                // determine if necessary defaults are changed before saving
                if (!decrement)
                {
                    let cid = check_column(column, scout_mode, '', '', alliances)
                    if (cid)
                    {
                        document.getElementById(cid).style['background-color'] = '#FFF2A8'
                        let container = document.getElementById(`${cid}-container`)
                        if (container !== null)
                        {
                            container.style['background-color'] = '#FFF2A8'
                        }
                        alert(`${cycle} has unchanged defaults! (${cid})`)
                        return false
                    }
                }
                // determine that nothing is changed in the new cycle before going back
                else if (saved_cycles === cycle_num + 1)
                {
                    let cid = check_cycle(column, scout_mode, '', '', alliances, true)
                    if (cid && !confirm(`The current cycle is unsaved (${cid})! Do you want to continue?`))
                    {
                        document.getElementById(cid).style['background-color'] = '#FFF2A8'
                        let container = document.getElementById(`${cid}-container`)
                        if (container !== null)
                        {
                            container.style['background-color'] = '#FFF2A8'
                        }
                        return false
                    }
                }

                // populate/save each input in the cycle
                for (let input of column.inputs)
                {
                    // only multicounter, select, and dropdown are supported in cycles
                    let type = input.type
                    let id = input.id
                    let ops = input.options
                    let def = input.default

                    if (!decrement)
                    {
                        cycle_result = Object.assign(cycle_result, get_result_from_input(input, scout_mode, '', '', alliances)) 
                    }

                    switch (type)
                    {
                        case 'multicounter':
                        case 'multiselect':
                            let values = []
                            if (starting_new_cycle)
                            {
                                values = def
                            }
                            else
                            {
                                values = ops.map(op => existing_result[`${id}_${create_id_from_name(op)}`])
                            }
                            set_input_value(input, values)
                            break
                        case 'dropdown':
                        case 'select':
                            def = ops.indexOf(def)
                        default:
                            set_input_value(input, starting_new_cycle ? def : existing_result[id])
                    }
                }
            }
        }
    }

    // store cycle in appropriate position
    if (!decrement)
    {
        if (saving_new_cycle)
        {
            cycles[cycle].push(cycle_result)
        }
        else
        {
            cycles[cycle][cycle_num-1] = cycle_result
        }
    }

    return true
}

/**
 * function:    check_cycles
 * parameters:  none
 * returns:     False is all cycles are saved, unsaved id otherwise.
 * description: Determines if any cycles are unfinished.
 */
function check_cycles()
{
    // iterate through each column in the page
    for (let page of cfg.get_scout_config(scout_mode).pages)
    {
        // iterate through each column in the page
        for (let column of page.columns)
        {
            if (column.cycle)
            {
                let ret = check_cycle(column, scout_mode, '', '', alliances, true)
                if (ret)
                {
                    return column.id
                }
            }
        }
    }
    return false
}

/**
 * function:    get_results_from_page
 * parameters:  none
 * returns:     none
 * description: Accumulates the results from the page into a new object.
 */
function get_results_from_page()
{
    let cid = check_cycles()
    if (cid)
    {
        document.getElementById(cid).style['background-color'] = '#FFF2A8'
        let container = document.getElementById(cid).parentElement.parentElement
        if (container !== null)
        {
            container.style['background-color'] = '#FFF2A8'
        }
        if (confirm(`There are unsaved cycles (${cid})! Do you want to return?`))
        {
            return
        }
    }
    let iid = check_results()
    if (iid)
    {
        document.getElementById(iid).style['background-color'] = '#FAA0A0'
        let container = document.getElementById(`${iid}-container`)
        if (container !== null)
        {
            container.style['background-color'] = '#FAA0A0'
        }
        alert(`There are unchanged defaults! (${iid})`)
        return
    }
    
    results = {}

    // scouter metadata
    results['meta_scouter_id'] = parseInt(cfg.user.state.user_id)
    results['meta_scout_time'] = Math.round(start / 1000)
    results['meta_scouting_duration'] = (Date.now() - start) / 1000
    results['meta_config_version'] = cfg.scout.version
    results['meta_app_version'] = cfg.app_version
    if (scout_mode === MATCH_MODE)
    {
        results['meta_unsure'] = unsure.checkbox.checked
        if (unsure.checkbox.checked)
        {
            let answer = prompt('Why are you unsure?')
            if (!answer)
            {
                return
            }
            results['meta_unsure_reason'] = answer
        }
    }
    else if (scout_mode === PIT_MODE)
    {
        results['meta_pit_unsure'] = unsure.checkbox.checked
    }

    // scouting metadata
    results['meta_scout_mode'] = scout_mode
    results['meta_position'] = parseInt(cfg.get_selected_position())
    results['meta_event_id'] = cfg.user.state.event_id

    // match metadata
    if (scout_mode == MATCH_MODE)
    {
        results['meta_match_key'] = match_key
        results['meta_comp_level'] = dal.get_match_value(match_key, 'comp_level')
        results['meta_set_number'] = parseInt(dal.get_match_value(match_key, 'set_number'))
        results['meta_match'] = parseInt(dal.get_match_value(match_key, 'match_number'))
        results['meta_alliance'] = dal.get_scouting_alliance()
        results['meta_ignore'] = false
    }
    results['meta_team'] = parseInt(team_num)

    // get each result
    for (let page of cfg.get_scout_config(scout_mode).pages)
    {
        for (let column of page.columns)
        {
            // check if its a cycle column
            if (column.cycle)
            {
                let cs = cycles[column.id]
                let val = cs.length - parseInt(document.getElementById(column.id).innerHTML)
                if (val > 0)
                {
                    if (!confirm(`Are you sure you want to dispose of ${val} cycles (${column.id})`))
                    {
                        return
                    }
                    cs.splice(-val, val)
                }
                results[column.id] = cs
            }
            else
            {
                Object.assign(results, get_results_from_column(column, scout_mode, '', '', alliances))
            }
        }
    }

    console.log(results)
    if (!confirm('Are you sure you want to submit?'))
    {
        return
    }

    // get result name
    let file = `pit-${cfg.user.state.event_id}-${team_num}`
    if (scout_mode === MATCH_MODE)
    {
        file = `match-${match_key}-${team_num}`
    }
    localStorage.setItem(file, JSON.stringify(results))
    
    if (scout_mode === PIT_MODE)
    {
        window.location.href = build_url('pits')
    }
    else
    {
        window.location.href = build_url('matches', {'type': 'match'})
    }
}

/**
 * function:    check_results
 * parameters:  none
 * returns:     name of default value that has not changes
 * description: Checks if all required values have changed from default.
 */
function check_results()
{
    // get each result
    for (let page of cfg.get_scout_config(scout_mode).pages)
    {
        for (let column of page.columns)
        {
            if (!column.cycle)
            {
                let ret = check_column(column, scout_mode, '', '', alliances)
                if (ret)
                {
                    return ret
                }
            }
        }
    }

    return false
}