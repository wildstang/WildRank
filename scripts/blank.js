/**
 * file:        init.js
 * description: Imports appropriate script for desired screen.
 * author:      Liam Fruzyna
 * date:        2020-06-20
 */

// load in config on page load
window.addEventListener('load', function()
{
    create_config()
})

/**
 * function:    home()
 * parameters:  right click
 * returns:     none
 * description: Opens the appropriate home page, based on the current page.
 */
function home(right=false)
{
    let url = 'index.html?page=home'
    if (page == 'home' || page == 'index' || page == '')
    {
        url = 'index.html' 
    }
    if (!right)
    {
        window_open(url, '_self')
    }
    else
    {
        window_open(url, '_blank')
    }
}