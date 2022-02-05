/**
 * file:        init.js
 * description: Imports appropriate script for desired screen.
 * author:      Liam Fruzyna
 * date:        2020-06-20
 */

var urlParams = new URLSearchParams(window.location.search)
const page = urlParams.get('page')

let script = document.createElement('script')
script.src = `scripts/${page}.js`
if (!page)
{
    script.src = `scripts/index.js`
}
document.head.appendChild(script)

window.addEventListener('load', function()
{
    init_page()
})

// register service workers
if ('serviceWorker' in navigator)
{
    navigator.serviceWorker.register('pwa.js')
}

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