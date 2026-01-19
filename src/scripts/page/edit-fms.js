/**
 * file:        edit-fms.js
 * description: Allows the user to add and delete FMS OPR and match breakdown results.
 * author:      Liam Fruzyna
 * date:        2025-07-25
 */

var new_match_key, new_match_name, negative_match_cb
var new_copr_key, new_copr_name, negative_copr_cb

var matches, match_keys, copr_keys

/**
 * Get possible keys.
 */
function init_page()
{
    matches = JSON.parse(localStorage.getItem(`matches-${dal.event_id}`))
    let breakdown = matches[0].score_breakdown.red
    match_keys = Object.keys(breakdown).filter(k => 
        ['boolean', 'number', 'string'].includes(typeof breakdown[k]) &&
        (k.endsWith('Robot1') || !k.includes('Robot'))
    ).map(k => k.endsWith('Robot1') ? k.substring(0, k.length - 1) + 'X' : k)

    let coprs = JSON.parse(localStorage.getItem(`coprs-${dal.event_id}`))
    copr_keys = Object.keys(coprs)

    build_buttons()
}

/**
 * Populate the page.
 */
function build_buttons()
{
    new_copr_key = new WRDropdown('New Key', copr_keys)
    new_copr_name = new WREntry('New Name', '')
    negative_copr_cb = new WRCheckbox('Negative?', false)
    let copr_button = new WRButton('Add OPR Result', build_copr_result)

    let copr_column = new WRColumn('Delete OPR Result')
    for (let i in cfg.analysis.fms_ranking_results)
    {
        let key = cfg.analysis.fms_ranking_results[i].id
        let name = cfg.get_result_from_key(`fms.${key}`).name
        copr_column.add_input(new WRButton(name, () => delete_copr_val(i)))
    }

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
    let copr_page = new WRPage('', [new WRColumn('New OPR Result', [new_copr_key, new_copr_name, negative_copr_cb, copr_button]), copr_column])
    let match_page = new WRPage('', [new WRColumn('New Match Result', [new_match_key, new_match_name, negative_match_cb, match_button]), match_column])
    preview.replaceChildren(copr_page, match_page)
}

/**
 * Builds an FMS result based on the selection.
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

    // determine type
    let type = ""
    switch (typeof value)
    {
        case 'boolean':
            type = 'boolean'
            break
        case 'number':
            type = 'int'
            break
        case 'string':
            if (['Yes', 'No'].includes(value))
            {
                type = 'yes_no'
            }
            else
            {
                type = 'state'
            }
            break
        default:
            return
    }

    // build id
    let res = {
        id: id,
        name: name,
        type: type
    }

    // find unique states
    if (type === 'state')
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
 * Builds an FMS result based on the selection.
 */
function build_copr_result()
{
    let id = create_id_from_name(new_copr_key.element.value)
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
 * Delete the match breakdown at the given index.
 * @param {Number} idx Match breakdown index
 */
function delete_copr_val(idx)
{
    cfg.analysis.fms_ranking_results.splice(idx, 1)
    cfg.analysis.store_config()
    build_buttons()
}