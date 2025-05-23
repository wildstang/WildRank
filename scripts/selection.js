/**
 * file:        selection.js
 * description: Imports appropriate script for desired selection screen.
 * author:      Liam Fruzyna
 * date:        2020-03-08
 */

// respond to keyboard inputs
document.onkeydown = function(e)
{
    // on arrow key press
    if (e.which == 38 || e.which == 40)
    {
        // find currently selected option
        let options = document.getElementById('option_list').children
        for (let i = 0; i < options.length; ++i)
        {
            if (options[i].classList.contains('selected'))
            {
                // increment/decrement selected index by arrow press
                let new_index = i
                if (e.which == 38) 
                {
                    new_index -= 1
                }
                else if (e.which == 40)
                {
                    new_index += 1
                }
                // click on newly selected option and scroll
                if (new_index >= 0 && new_index < options.length)
                {
                    options[new_index].click()
                    scroll_to('option_list', options[new_index].id)
                    return false
                }
            }
        }
    }
}

/**
 * function:    deselect_all
 * parameters:  use primary option list
 * returns:     none
 * description: Deselects all options in option_list.
 */
function deselect_all(primary_list=true)
{
    let id = 'option_list'
    if (!primary_list)
    {
        id = 'secondary_option_list'
    }
    let options = document.getElementById(id).children
    for (let i = 0; i < options.length; ++i)
    {
        options[i].classList.remove('selected')
    }
}

/**
 * function:    select_all
 * parameters:  use primary option list
 * returns:     none
 * description: Selects all options in option_list.
 */
function select_all(primary_list=true)
{
    let id = 'option_list'
    if (!primary_list)
    {
        id = 'secondary_option_list'
    }
    let options = document.getElementById(id).children
    for (let i = 0; i < options.length; ++i)
    {
        if (!options[i].classList.contains('selected'))
        {
            options[i].classList.add('selected')
        }
    }
}

/**
 * function:    toggle_select
 * parameters:  use primary option list
 * returns:     none
 * description: Selects or deselects all team options.
 */
function toggle_select(primary_list=true)
{
    let id = 'option_list'
    if (!primary_list)
    {
        id = 'secondary_option_list'
    }
    let options = document.getElementById(id).children
    for (let i = 0; i < options.length; ++i)
    {
        if (!options[i].classList.contains('selected'))
        {
            select_all(false)
            build_table()
            return
        }
    }
    deselect_all(false)
    build_table()
}

/**
 * function:    filter_by
 * parameters:  options to filter by, use primary option list
 * returns:     none
 * description: Filters a given options menu by a list of options.
 */
function filter_by(filter, primary_list=true)
{
    let start = 'left_pit_option_'
    if (!primary_list)
    {
        start = 'right_pit_option_'
    }
    deselect_all(primary_list)
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
 * function:    toggle_menu
 * parameters:  use primary option list
 * returns:     none
 * description: Toggles options menu on image click.
 */
function toggle_menu(primary_list=true)
{
    let id = 'left'
    if (!primary_list)
    {
        id = 'right'
    }
    let list = document.getElementById(id)
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
 * function:    enable_secondary_list
 * parameters:  none
 * returns:     none
 * description: Enables the secondary option list for the page.
 */
function enable_secondary_list()
{
    if (!cfg.settings.auto_hide_right)
    {
        document.getElementById('right').style.display = 'flex'
    }
    document.getElementById('secondary_menu_toggle').style.display = 'block'
}

var header_info, preview

window.addEventListener('load', function()
{
    // fix for selection pages being cut off by notch/home bar
    let iPad = navigator.userAgent.match(/iPad/) ||
                (navigator.userAgent.match(/Mac/) && navigator.maxTouchPoints && navigator.maxTouchPoints > 2)
    let iPhone = navigator.userAgent.match(/iPhone/) || navigator.platform == "iPhone"
    if (iPhone) {
        document.body.style.height = "93%"
    }
    else if (iPad) {
        document.body.style.height = "97%"
    }

    // save elements of body
    header_info = document.getElementById('header_info')
    preview = document.getElementById('preview')

    // load in configs
    create_config()
})