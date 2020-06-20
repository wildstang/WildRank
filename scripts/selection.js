/**
 * file:        selection.js
 * description: Imports appropriate script for desired selection screen.
 * author:      Liam Fruzyna
 * date:        2020-03-08
 */

var urlParams = new URLSearchParams(window.location.search)
const page = urlParams.get('page')

let script = document.createElement('script')
script.src = `/scripts/${page}.js`
document.head.appendChild(script)

// respond to keyboard inputs
document.onkeydown = function(e)
{
    if (e.which == 38 || e.which == 40)
    {
        let list = document.getElementById('option_list').children
        for (let i = 0; i < list.length; ++i)
        {
            if (list[i].classList.contains('selected'))
            {
                let new_index = i
                if (e.which == 38) 
                {
                    new_index -= 1
                }
                else if (e.which == 40)
                {
                    new_index += 1
                }
                if (new_index >= 0 && new_index < list.length)
                {
                    list[new_index].click()
                    scroll_to('option_list', list[new_index].id)
                    return false
                }
            }
        }
    }
}