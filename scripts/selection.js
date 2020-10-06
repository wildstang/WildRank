/**
 * file:        selection.js
 * description: Imports appropriate script for desired selection screen.
 * author:      Liam Fruzyna
 * date:        2020-03-08
 */

var urlParams = new URLSearchParams(window.location.search)
const page = urlParams.get('page')

let script = document.createElement('script')
script.src = `/scripts/mini-picklists.js`
document.head.appendChild(script)

script = document.createElement('script')
script.src = `/scripts/${page}.js`
document.head.appendChild(script)

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
 * parameters:  none
 * returns:     none
 * description: Deselects all options in option_list.
 */
function deselect_all()
{
    let options = document.getElementById('option_list').children
    for (let i = 0; i < options.length; ++i)
    {
        options[i].classList.remove('selected')
    }
}

/**
 * function:    toggle_menu
 * parameters:  none
 * returns:     none
 * description: Toggles options menu on image click.
 */
function toggle_menu()
{
    let list = document.getElementById('option_list')
    if (getComputedStyle(list).display == 'block')
    {
        list.style.display = 'none'
    }
    else
    {
        list.style.display = 'block'
    }

    // rescale whiteboard
    if (document.getElementById('whiteboard'))
    {
        init_page(document.getElementById('contents_card'), document.getElementById('buttons_container'), false)
    }
}

window.addEventListener('load', function()
{
    init_page(document.getElementById('contents_card'), document.getElementById('buttons_container'))
})