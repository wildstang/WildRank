/**
 * file:        scout.js
 * description: Page for collecting scouting data for all scouting types.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

// record time scouting was started
const start = Date.now()

// read parameters from URL
var urlParams = new URLSearchParams(window.location.search)
const scout_mode = urlParams.get(MODE_QUERY)
const index = urlParams.get('index')
var edit = urlParams.get('edit').toLowerCase() == 'true'

var unsure_cb
var teams = []
var cycles = {}
var match_key
var scout_type
var edit_index = -1

/**
 * Populates the page based on the scouting type
 */
function init_page()
{
    // build a structure for the header
    let match_box = document.createElement('span')
    let team_box = document.createElement('span')
    header_info.append(match_box, ' - Scouting: ', team_box)
    scout_type = cfg.get_scout_config(scout_mode).type

    // any match scouting mode
    if (scout_type.startsWith('match-'))
    {
        // validate that the index is a valid match ID
        match_key = index
        if (!dal.match_keys.includes(match_key))
        {
            alert(`Invalid match key "${match_key}"`)
            header_info.innerText = 'Error'
            return
        }

        // get configured scouting position
        let pos = cfg.get_selected_position()
        let is_red = pos < 3

        // populate the header with the match name and alliance color
        match_box.innerText = dal.matches[match_key].name
        team_box.style.color = is_red ? 'red' : 'blue'
        team_box.style.backgroundColor = 'rgba(0, 0, 0, 0.33)'
        team_box.style.boxShadow = '0 0 4px 4px rgba(0, 0, 0, 0.33)'

        if (scout_type === 'match-team')
        {
            // determine scouting team and set it in the header
            let team_num = dal.get_match_team(match_key, pos)
            team_box.innerText = `${team_num} (${pos})`
            teams = [team_num]
            ws(team_num)

            // disable editing if the match hasn't been scouted
            if (edit && !dal.is_match_scouted(match_key, team_num, scout_mode))
            {
                alert(`Could not find result "${match_key}-${team_num}"`)
                edit = false
            }
            else if (edit)
            {
                let metas = dal.get_match_meta(match_key, team_num, scout_mode)
                edit_index = prompt_for_result(metas, 'edit')
            }
        }
        else if (scout_type === 'match-alliance')
        {
            // get teams for the scouting alliance and set them in the header 
            teams = dal.get_match_alliance(match_key, is_red ? 0 : 3)
            team_box.innerText = `${teams.join(', ')} (${pos})`

            // disable editing if the match hasn't been scouted
            if (edit && teams.some(t => !dal.is_match_scouted(match_key, t, scout_mode)))
            {
                alert(`Could not find any results for ${match_key}`)
                edit = false
            }
            else if (edit)
            {
                let metas = dal.get_match_meta(match_key, teams[0], scout_mode)
                edit_index = prompt_for_result(metas, 'edit')
            }
        }
        else
        {
            alert(`Invalid type "${scout_type}" for "${scout_mode}"`)
            header_info.innerText = 'Error'
        }
    }
    else if (scout_type === 'team')
    {
        // validate that the index is a valid team number
        let team_num = index
        if (!dal.team_numbers.includes(team_num))
        {
            alert(`Invalid team "${team_num}"`)
            header_info.innerText = 'Error'
            return
        }
        teams = [team_num]

        // disable editing if the team hasn't been scouted
        if (edit && !dal.is_team_scouted(team_num, scout_mode))
        {
            alert(`Could not find result "${team_num}"`)
            edit = false
        }
        else if (edit)
        {
            let metas = dal.teams[team_num].meta[scout_mode]
            edit_index = prompt_for_result(metas, 'edit')
        }

        // populate the header with the team
        match_box.innerText = 'Pit'
        team_box.innerText = team_num
        team_box.style.color = 'white'
        ws(team_num)
    }
    else
    {
        alert(`Invalid type "${scout_type}" for "${scout_mode}"`)
        header_info.innerText = 'Error'
    }

    if (edit_index < 0)
    {
        edit = false
    }

    build_page_from_config()
}

/**
 * Displays the submit button if the final page has been reached.
 */
function check_for_last_page()
{
    let carousel = document.getElementById('scouting-carousel')
    let final_page = carousel.clientWidth * (cfg.get_scout_config(scout_mode).pages.length - 1)
    let view_start = Math.ceil(carousel.scrollLeft)

    let options = []
    let actions = []
    if (view_start > 0)
    {
        options.push('Back')
        actions.push(() => scroll_carousel(false))
    }
    if (view_start >= final_page)
    {
        options.push('Submit')
        actions.push(get_results_from_page)
    }
    else
    {
        options.push('Next')
        actions.push(scroll_carousel)
    }
    let button = new WRMultiButton('', options, actions)
    button.add_class('advance')
    document.getElementById('submit_container').replaceChildren(button)
}

/**
 * Scrolls the scouting carousel in the specified direction.
 * @param {Boolean} right Whether to scroll right
 */
function scroll_carousel(right=true)
{
    document.getElementById('scouting-carousel').scrollBy(right ? 1 : -1, 0)
}


/**
 * Populates the page using the scouting config.
 */
function build_page_from_config()
{
    // wrap the scouting pages in a carousel, check if the last page on scroll
    let carousel = create_element('div', 'scouting-carousel', 'scouting-carousel')
    carousel.onscroll = check_for_last_page

    // iterate through each page in the mode
    for (let page of cfg.get_scout_config(scout_mode).pages)
    {
        let page_frame = new WRPage(page.name)

        // iterate through each column in the page
        for (let column of page.columns)
        {
            // repeat the column once for every team (only for match-alliance modes)
            for (let team_num of teams)
            {
                let result
                if (edit && scout_type === 'team')
                {
                    result = dal.teams[team_num].results[scout_mode][edit_index]
                }
                else if (edit)
                {
                    result = dal.get_match_result(match_key, team_num).results[scout_mode][edit_index]
                }

                let cycle = column.cycle
                let col_frame = build_column_from_config(column, scout_type, team_num, !cycle ? result : null)
                if (cycle)
                {
                    // create and populate (if editing) cycle arrays
                    if (edit)
                    {
                        cycles[column.id] = result[column.id]
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
        }
        carousel.append(page_frame)
    }

    // add the unsure box and the submit box (if only one page)
    unsure_cb = new WRCheckbox(`Unsure of Results`)
    let submit = create_element('span', 'submit_container')
    let page_options = new WRPage('', [new WRColumn('', [unsure_cb]), new WRColumn('', [submit])])
    preview.replaceChildren(carousel, page_options)
    check_for_last_page()
}


/**
 * Advances or returns the specified cycle counter.
 * @param {String} cycle Cycle ID
 * @param {Boolean} decrement Whether the cycle was decremented
 * @returns Whether the cycle is free of unsaved changes or unchanged defaults.
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
                    let cid = check_column(column)
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
                    let cid = check_cycle(column)
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
                        cycle_result = Object.assign(cycle_result, get_result_from_input(input, scout_type)) 
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
 * Determines if any cycles have unsaved changes.
 * @returns The ID of any cycles with unsaved changes
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
                let ret = check_cycle(column)
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
 * Checks if the scouting form has been completed, then builds and writes results to localStorage.
 */
function get_results_from_page()
{
    // check for unsaved cycles
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

    // check for unchanged defaults
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

    // prompt for a reason why the scouter is unsure
    let unsure_reason = ''
    if (unsure_cb.checkbox.checked)
    {
        unsure_reason = prompt('Why are you unsure?')
        if (!unsure_reason)
        {
            return
        }
    }

    // double check before saving
    if (!confirm('Are you sure you want to submit?'))
    {
        return
    }

    // save a result for each team that is being scouted
    for (let team_num of teams)
    {
        // build the result metadata
        results = new_result(scout_mode, Math.round(start / 1000), unsure_cb.checkbox.checked, unsure_reason, {})
        results.meta.result.team_num = team_num
        if (scout_type.startsWith('match'))
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
                    results.result[column.id] = cs
                }
                else
                {
                    results.result = Object.assign(results.result, get_results_from_column(column, scout_type, team_num))
                }
            }
        }

        // write the result to a semi-random file in localStorage
        localStorage.setItem(create_result_name(), JSON.stringify(results))
    }

    // return to the appropriate match/team selection page
    window.location.href = build_url(scout_type === 'team' ? 'pits' : 'matches', {'scout-mode': scout_mode})
}

/**
 * Determines if any cycles have unchanged defaults.
 * @returns The ID of any cycles with unchanged defaults
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
                let ret = check_column(column)
                if (ret)
                {
                    return ret
                }
            }
        }
    }

    return false
}