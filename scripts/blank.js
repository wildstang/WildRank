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
 * parameters:  none
 * returns:     none
 * description: Opens the appropriate home page, based on the current page.
 */
function home()
{
    let url = 'index.html?page=home'
    if (page == 'home' || page == 'index' || page == '')
    {
        url = 'index.html' 
    }
    window_open(url, '_self')
}