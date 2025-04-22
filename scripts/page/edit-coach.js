/**
 * file:        coach.js
 * description: Contains functions for the driver coach view page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2021-09-03
 */

const FUNCTIONS = ['Mean', 'Median', 'Mode', 'Min', 'Max', 'Total', 'StdDev']


/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Populate body
 */
function init_page()
{
    build_buttons()
}

var new_func, new_key

/**
 * function:    build_buttons
 * parameters:  none
 * returns:     none
 * description: Populates the body with buttons to create and delete coach values.
 */
function build_buttons()
{
    new_func = new WRSelect('New Function', FUNCTIONS)
    new_key = new WRDropdown('New Key', dal.get_keys(true, true, false, false).map(k => dal.get_name(k, '')))
    let button = new WRButton('Add Coach Value', create)

    let column = new WRColumn('Delete Coach Value')
    for (let i in cfg.analysis.coach)
    {
        let c = cfg.analysis.coach[i]
        column.add_input(new WRButton(dal.get_name(c.key, c.function), () => delete_val(i)))
    }

    // build template
    let page = new WRPage('', [new WRColumn('New Coach Value', [new_func, new_key, button]), column])
    body.replaceChildren(page)
}

/**
 * function:    create
 * parameters:  none
 * returns:     none
 * description: Create and save a new coach value based on the inputs.
 */
function create()
{
    let keys = dal.get_keys(true, true, false, false)
    let func = FUNCTIONS[new_func.selected_index].toLowerCase()
    let key = keys[new_key.element.selectedIndex]

    let coach = {
        function: func,
        key: key
    }
    cfg.analysis.coach.push(coach)
    cfg.analysis.store_config()

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