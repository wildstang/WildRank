/**
 * file:        init.js
 * description: Imports appropriate script for desired screen.
 * author:      Liam Fruzyna
 * date:        2020-06-20
 */

var header_info
var body

// load in config on page load
window.addEventListener('load', function()
{
    // save elements of body
    header_info = document.getElementById('header_info')
    body = document.getElementById('body')

    create_config()
})