/**
 * file:        selection.js
 * description: Provides functions for interacting with option lists and their filters.
 * author:      Liam Fruzyna
 * date:        2020-03-08
 */

//
// List Functions
//

/**
 * Toggles whether the specified option list is open.
 * Used to handle hamburger menu clicks.
 * @param {Boolean} left Whether to use the left list
 */
function toggle_menu(left=true)
{
    let list = document.getElementById(left ? 'left' : 'right')
    if (getComputedStyle(list).display == 'flex')
    {
        list.style.display = 'none'
    }
    else
    {
        list.style.display = 'flex'
    }

    // rescale whiteboard
    if (document.getElementById('whiteboard') || document.getElementById('canvas'))
    {
        init_canvas()
    }
}

/**
 * Makes the specified list visible, unless not allowed to be visible by default.
 * @param {Boolean} left Whether to use the left list
 */
function enable_list(left=true)
{
    if (!cfg.user.settings.auto_hide_right)
    {
        document.getElementById(left ? 'left' : 'right').style.display = 'flex'
    }
    document.getElementById(`${left ? '' : 'secondary_'}menu_toggle`).style.display = 'block'
}

/**
 * Gets one of the option lists.
 * @param {Boolean} left Whether to use the left list
 * @returns The left/right option list
 */
function get_list(left)
{
    return left ? left_list : right_list
}

/**
 * Deselects all options in the specified list.
 * @param {Boolean} left Whether to use the left list
 */
function deselect_all(left=true)
{
    let options = get_list(left).children
    for (let i = 0; i < options.length; ++i)
    {
        options[i].classList.remove('selected')
    }
}

/**
 * Selects all options in the specified list.
 * @param {Boolean} left Whether to use the left list
 */
function select_all(left=true)
{
    let options = get_list(left).children
    for (let i = 0; i < options.length; ++i)
    {
        if (!options[i].classList.contains('selected'))
        {
            options[i].classList.add('selected')
        }
    }
}

/**
 * Filters the specified list by the given values.
 * @param {Boolean} left Whether to use the left list
 */
function filter_by(filter, left=true)
{
    deselect_all(left)

    let start = `${left ? 'left' : 'right'}_pit_option_`
    for (let f of filter)
    {
        let op = start + f
        let element = document.getElementById(op)
        if (element !== null)
        {
            if (!element.classList.contains('selected'))
            {
                element.classList.add('selected')
            }
            else
            {
                element.classList.remove('selected')
            }
        }
    }
}

/**
 * Clears a specified column of all options.
 * @param {Boolean} left Whether to use the left list
 */
function clear_list(left=true)
{
    get_list(left).replaceChildren()
}

/**
 * Adds a given option to a selection column.
 * @param {Boolean} left Whether to use the left list
 * @param {Boolean} secondary Whether to add to the right/secondary column
 */
function add_option(option, left=true)
{
    get_list(left).append(option)
}

//
// Filter Functions
//

/**
 * Gets one of the option list filters.
 * @param {Boolean} left Whether to use the left filter
 * @returns The left/right filter
 */
function get_filter(left)
{
    return left ? left_filter : right_filter
}

/**
 * Selects the first option in the specified dropdown filter.
 * @param {Boolean} left Whether to use the left filter
 */
function select_none(left=true)
{
    get_filter(left).selectedIndex = 0
}

/**
 * Builds a dropdown filter for the specified option list.
 * @param {Array} options List of strings to populate the filter with
 * @param {Function} func Function to call when a new option is selected
 * @param {Boolean} left Whether to use the left filter location
 * @param {String} default_selection Default option to select
 * @returns The WRDropdown
 */
function add_dropdown_filter(options, func, left=true, default_selection='')
{
    console.log(default_selection)
    let dropdown = new WRDropdown('', options, default_selection)
    dropdown.on_change = func
    get_filter(left).append(dropdown)
    return dropdown
}

/**
 * Builds a button filter for the specified option list.
 * @param {String} text Button label
 * @param {Function} func Function to call when the button is pressed
 * @param {Boolean} left Whether to use the left filter location
 */
function add_button_filter(text, func, left=true)
{
    let button = new WRButton(text, func)
    if (text.startsWith('Export'))
    {
        button.add_class('transfer')
    }
    get_filter(left).append(button)
}

/**
 * Builds a checkbox filter for the specified option list.
 * @param {String} text Checkbox label
 * @param {Function} func Function to call when the checkbox is toggled
 * @param {Boolean} left Whether to use the left filter location
 * @returns The WRCheckbox
 */
function add_checkbox_filter(text, func, left=true)
{
    let checkbox = new WRCheckbox(text, false)
    checkbox.on_click = func
    get_filter(left).append(checkbox)
    return checkbox
}