/**
 * file:        edit-coach.js
 * description: Allows the user to add and delete favorites.
 * author:      Liam Fruzyna
 * date:        2021-09-03
 */

var new_func, new_key, keys


/**
 * Get possible keys and populate page.
 */
function init_page()
{
    keys = cfg.get_keys()
    build_buttons()
}

/**
 * Builds the page with an add column and a delete column.
 */
function build_buttons()
{
    let key = new_key !== undefined ? keys[new_key.element.selectedIndex] : keys[0]
    let res = cfg.get_result_from_key(key)
    let functions = res.available_stats

    new_func = new WRSelect('New Function', functions.map(f => capitalize(f)))
    new_key = new WRDropdown('New Key', cfg.get_names(keys), res.name)
    new_key.on_change = build_buttons
    let button = new WRButton('Add Coach Value', create)

    let column = new WRColumn('Delete Coach Value')
    for (let i in cfg.analysis.coach)
    {
        let c = cfg.analysis.coach[i]
        column.add_input(new WRButton(cfg.get_coach_name(c), () => delete_val(i)))
    }

    // build template
    let page = new WRPage('', [new WRColumn('New Coach Value', [new_key, new_func, button]), column])
    preview.replaceChildren(page)
}

/**
 * Create a new coach result for the selected key.
 */
function create()
{
    let keys = cfg.get_keys()
    let key = keys[new_key.element.selectedIndex]
    let func = new_func.selected_option.toLowerCase()

    let coach = {
        function: func,
        key: key
    }

    let tests = AnalysisConfig.validate_coach(coach, false).filter(t => t !== true)
    if (tests.length > 0)
    {
        alert('Config error!\n\n' + tests.join('\n\n'))
    }
    else
    {
        cfg.analysis.coach.push(coach)
        cfg.analysis.store_config()
    }

    build_buttons()
}

/**
 * Delete the coach result at the given index.
 * @param {Number} idx Coach result index
 */
function delete_val(idx)
{
    cfg.analysis.coach.splice(idx, 1)
    cfg.analysis.store_config()

    build_buttons()
}