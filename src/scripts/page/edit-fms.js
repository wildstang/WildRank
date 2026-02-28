/**
 * file:        edit-fms.js
 * description: Allows the user to add and delete FMS ranking, OPR, and match breakdown results.
 * author:      Liam Fruzyna
 * date:        2025-07-25
 */

var new_match_key, new_match_name, negative_match_cb
var new_copr_key, new_copr_name, negative_copr_cb
var new_rank_key, new_rank_name, negative_rank_cb

var matches, rankings
var match_keys = []
var copr_keys = []
var rank_keys = []

/**
 * Get possible keys.
 */
function init_page()
{
    matches = JSON.parse(localStorage.getItem(`matches-${dal.event_id}`))
    if (matches !== null && matches.length > 0)
    {
        let breakdown = matches[0].score_breakdown.red
        match_keys = Object.keys(breakdown).filter(k => 
            ['boolean', 'number', 'string'].includes(typeof breakdown[k]) &&
            (k.endsWith('Robot1') || !k.includes('Robot'))
        ).map(k => k.endsWith('Robot1') ? k.substring(0, k.length - 1) + 'X' : k)
    }

    let coprs = JSON.parse(localStorage.getItem(`coprs-${dal.event_id}`))
    copr_keys = coprs !== null ? Object.keys(coprs) : []

    rankings = JSON.parse(localStorage.getItem(`rankings-${dal.event_id}`))
    if (rankings !== null && rankings.length > 0)
    {
        for (let key of Object.keys(rankings[0]))
        {
            let value = rankings[0][key]
            if (Array.isArray(value))
            {
                for (let i in value)
                {
                    rank_keys.push(`${key}_${i}`)
                }
            }
            else if (typeof value === 'object')
            {
                if (value !== null)
                {
                    for (let sub_key of Object.keys(value))
                    {
                        rank_keys.push(`${key}_${sub_key}`)
                    }
                }
            }
            else if (key !== 'team_key')
            {
                rank_keys.push(key)
            }
        }
    }

    build_buttons()
}

/**
 * Populate the page.
 */
function build_buttons()
{
    // build rank page
    new_rank_key = new WRDropdown('New Key', rank_keys)
    new_rank_name = new WREntry('New Name', '')
    negative_rank_cb = new WRCheckbox('Negative?', false)
    let rank_button = new WRButton('Add Rank Result', build_rank_result)

    let rank_column = new WRColumn('Delete Rank Result')
    for (let i in cfg.analysis.fms_ranking_results)
    {
        let key = cfg.analysis.fms_ranking_results[i].id
        if (key.startsWith('rank_'))
        {
            let name = cfg.get_result_from_key(`fms.${key}`).name
            rank_column.add_input(new WRButton(name, () => delete_rank_val(i)))
        }
    }

    // build C-OPR page
    new_copr_key = new WRDropdown('New Key', copr_keys)
    new_copr_name = new WREntry('New Name', '')
    negative_copr_cb = new WRCheckbox('Negative?', false)
    let copr_button = new WRButton('Add OPR Result', build_copr_result)

    let copr_column = new WRColumn('Delete OPR Result')
    for (let i in cfg.analysis.fms_ranking_results)
    {
        let key = cfg.analysis.fms_ranking_results[i].id
        if (key.startsWith('copr_'))
        {
            let name = cfg.get_result_from_key(`fms.${key}`).name
            copr_column.add_input(new WRButton(name, () => delete_copr_val(i)))
        }
    }

    // build match page
    new_match_key = new WRDropdown('New Key', match_keys)
    new_match_name = new WREntry('New Name', '')
    negative_match_cb = new WRCheckbox('Negative?', false)
    let match_button = new WRButton('Add Match Result', build_match_result)

    let match_column = new WRColumn('Delete Match Result')
    for (let i in cfg.analysis.fms_breakdown_results)
    {
        let key = cfg.analysis.fms_breakdown_results[i].id
        let name = cfg.get_result_from_key(`fms.${key}`).name
        match_column.add_input(new WRButton(name, () => delete_match_val(i)))
    }

    // build template
    let rank_page = new WRPage('Ranking', [new WRColumn('New Rank Result', [new_rank_key, new_rank_name, negative_rank_cb, rank_button]), rank_column])
    let copr_page = new WRPage('Component OPR', [new WRColumn('New OPR Result', [new_copr_key, new_copr_name, negative_copr_cb, copr_button]), copr_column])
    let match_page = new WRPage('Match', [new WRColumn('New Match Result', [new_match_key, new_match_name, negative_match_cb, match_button]), match_column])

    // populate page
    preview.replaceChildren()
    if (rank_keys.length)
    {
        preview.append(rank_page)
    }
    if (copr_keys.length)
    {
        preview.append(copr_page)
    }
    if (match_keys.length)
    {
        preview.append(match_page)
    }
}

function determine_type(value)
{
    // determine type
    switch (typeof value)
    {
        case 'boolean':
            return 'boolean'
        case 'number':
            return 'int'
        case 'string':
            if (['Yes', 'No'].includes(value))
            {
                return 'yes_no'
            }
            else
            {
                return 'state'
            }
    }
    return ''
}

/**
 * Builds an FMS breakdown result based on the selection.
 */
function build_match_result()
{
    let id = new_match_key.element.value
    let name = new_match_name.element.value
    let actual_id = id.endsWith('RobotX') ? id.substring(0, id.length - 1) + '1' : id
    let value = matches[0].score_breakdown.red[actual_id]

    if (!name)
    {
        alert('Invalid name')
        return
    }

    // build id
    let res = {
        id: `bd_${create_id_from_name(id)}`,
        name: name,
        type: determine_type(value)
    }

    // find unique states
    if (res.type === 'state')
    {
        let valid_ids = []
        if (id.endsWith('RobotX'))
        {
            for (let i = 1; i <= 3; ++i)
            {
                valid_ids.push(id.substring(0, id.length - 1) + i)
            }
        }
        else
        {
            valid_ids = 'id'
        }

        let options = []
        for (let match of matches)
        {
            if (match.score_breakdown && match.score_breakdown.red && match.score_breakdown.blue)
            {
                for (let id of valid_ids)
                {
                    let red_val = match.score_breakdown.red[id]
                    let blue_val = match.score_breakdown.blue[id]
                    if (red_val !== undefined && !options.includes(red_val))
                    {
                        options.push(red_val)
                    }
                    if (blue_val !== undefined && !options.includes(blue_val))
                    {
                        options.push(blue_val)
                    }
                }
            }
        }
        res.options = options
    }
    else
    {
        res.negative = negative_match_cb.checked
    }

    cfg.analysis.fms_breakdown_results.push(res)
    cfg.analysis.store_config()
    build_buttons()
}

/**
 * Builds an FMS C-OPR result based on the selection.
 */
function build_copr_result()
{
    let id = `copr_${create_id_from_name(new_copr_key.element.value)}`
    let name = new_copr_name.element.value

    if (!name)
    {
        alert('Invalid name')
        return
    }

    let res = {
        id: id,
        name: name,
        type: 'float',
        negative: negative_copr_cb.checked
    }

    cfg.analysis.fms_ranking_results.push(res)
    cfg.analysis.store_config()
    build_buttons()
}

/**
 * Builds an FMS ranking result based on the selection.
 */
function build_rank_result()
{
    let selected = new_rank_key.element.value
    let id = `rank_${create_id_from_name(selected)}`
    let name = new_rank_name.element.value

    if (!name)
    {
        alert('Invalid name')
        return
    }

    let value = null
    for (let key of Object.keys(rankings[0]))
    {
        let val = rankings[0][key]
        if (Array.isArray(val))
        {
            for (let i in val)
            {
                if (selected === `${key}_${i}`)
                {
                    value = val[i]
                    break
                }
            }
            if (value !== null)
            {
                break
            }
        }
        else if (typeof val === 'object')
        {
            if (val !== null)
            {
                for (let sub_key of Object.keys(val))
                {
                    if (selected === `${key}_${sub_key}`)
                    {
                        value = val[sub_key]
                        break
                    }
                }
                if (value !== null)
                {
                    break
                }
            }
        }
        else
        {
            value = val
            break
        }
    }

    let res = {
        id: id,
        name: name,
        type: determine_type(value),
        negative: negative_rank_cb.checked
    }

    cfg.analysis.fms_ranking_results.push(res)
    cfg.analysis.store_config()
    build_buttons()
}

/**
 * Delete the C-OPR at the given index.
 * @param {Number} idx C-OPR index
 */
function delete_match_val(idx)
{
    cfg.analysis.fms_breakdown_results.splice(idx, 1)
    cfg.analysis.store_config()
    build_buttons()
}

/**
 * Delete the C-OPR value at the given index.
 * @param {Number} idx C-OPR value index
 */
function delete_copr_val(idx)
{
    cfg.analysis.fms_ranking_results.splice(idx, 1)
    cfg.analysis.store_config()
    build_buttons()
}

/**
 * Delete the ranking value at the given index.
 * @param {Number} idx Ranking value index
 */
function delete_rank_val(idx)
{
    cfg.analysis.fms_ranking_results.splice(idx, 1)
    cfg.analysis.store_config()
    build_buttons()
}