/**
 * file:        coach.js
 * description: Contains functions for the driver coach view page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2021-09-03
 */

const FUNCTIONS = ['Mean', 'Median', 'Mode', 'Min', 'Max', 'Total', 'Std Dev']

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Populate body
 */
function init_page()
{
    let container = document.createElement('div')
    container.id = 'buttons_container'
    document.body.replaceChildren(container)
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
    let select = new Select('new_function', 'New Function', FUNCTIONS)
    let dropdown = new Dropdown('new_key', 'New Key', dal.get_keys(true, true, false, false).map(k => dal.get_name(k, '')))
    let button = new Button('add_coach', 'Add Coach Value', 'create()')

    let column = new ColumnFrame('del_col', 'Delete Coach Value')
    for (let i in cfg.coach)
    {
        let c = cfg.coach[i]
        column.add_input(new Button(c.key, dal.get_name(c.key, c.function), `delete_val(${i})`))
    }

    // build template
    let page = new PageFrame('page', '', [new ColumnFrame('new_col', 'New Coach Value', [select, dropdown, button]), column])
    document.getElementById('buttons_container').replaceChildren(page.element)
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
    let func = FUNCTIONS[Select.get_selected_option('new_function')].toLowerCase()
    let key = keys[document.getElementById('new_key').selectedIndex]

    let coach = {
        function: func,
        key: key
    }
    cfg.coach.push(coach)
    localStorage.setItem(`config-${cfg.year}-coach`, JSON.stringify(cfg.coach))

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
    cfg.coach.splice(idx, 1)
    localStorage.setItem(`config-${cfg.year}-coach`, JSON.stringify(cfg.coach))

    build_buttons()
}