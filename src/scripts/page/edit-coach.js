/**
 * file:        coach.js
 * description: Contains functions for the driver coach view page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2021-09-03
 */

var new_func, new_key, keys


/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Populate body
 */
function init_page()
{
    keys = cfg.get_keys()
    build_buttons()
}

/**
 * function:    build_buttons
 * parameters:  none
 * returns:     none
 * description: Populates the body with buttons to create and delete coach values.
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
 * function:    create
 * parameters:  none
 * returns:     none
 * description: Create and save a new coach value based on the inputs.
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
 * function:    delete_val
 * parameters:  index of coach value
 * returns:     none
 * description: Delete a coach value of a given index.
 */
function delete_val(idx)
{
    cfg.analysis.coach.splice(idx, 1)
    cfg.analysis.store_config()

    build_buttons()
}