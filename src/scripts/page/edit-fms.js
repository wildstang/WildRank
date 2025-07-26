/**
 * file:        edit-fms.js
 * description: Allows the user to add and delete FMS match breakdown results.
 * author:      Liam Fruzyna
 * date:        2025-07-25
 */

var new_key, new_name, negative_cb

var matches, keys

/**
 * Get possible keys.
 */
function init_page()
{
    matches = JSON.parse(localStorage.getItem(`matches-${dal.event_id}`))
    let breakdown = matches[0].score_breakdown.red
    keys = Object.keys(breakdown).filter(k => 
        ['boolean', 'number', 'string'].includes(typeof breakdown[k]) &&
        (k.endsWith('Robot1') || !k.includes('Robot'))
    ).map(k => k.endsWith('Robot1') ? k.substring(0, k.length - 1) + 'X' : k)
    build_buttons()
}

/**
 * Populate the page.
 */
function build_buttons()
{
    new_key = new WRDropdown('New Key', keys)
    new_name = new WREntry('New Name', '')
    negative_cb = new WRCheckbox('Negative?', false)
    let button = new WRButton('Add FMS Result', build_result)

    let column = new WRColumn('Delete FMS Result')
    for (let i in cfg.analysis.fms_breakdown_results)
    {
        let key = cfg.analysis.fms_breakdown_results[i].id
        let name = cfg.get_result_from_key(`fms.${key}`).name
        column.add_input(new WRButton(name, () => delete_val(i)))
    }

    // build template
    let page = new WRPage('', [new WRColumn('New FMS Result', [new_key, new_name, negative_cb, button]), column])
    preview.replaceChildren(page)
}

/**
 * Builds an FMS result based on the selection.
 */
function build_result()
{
    let id = new_key.element.value
    let name = new_name.element.value
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
        res.negative = negative_cb.checked
    }

    cfg.analysis.fms_breakdown_results.push(res)
    cfg.analysis.store_config()
    build_buttons()
}

/**
 * Delete the coach result at the given index.
 * @param {Number} idx Coach result index
 */
function delete_val(idx)
{
    cfg.analysis.fms_breakdown_results.splice(idx, 1)
    cfg.analysis.store_config()
    build_buttons()
}