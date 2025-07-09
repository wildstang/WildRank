/**
 * file:        standalone.js
 * description: Replacement for init.js for use standalone use of compatible app pages.
 * author:      Liam Fruzyna
 * date:        2025-03-09
 */

// determine the desired page
var urlParams = new URLSearchParams(window.location.search)
const page = urlParams.get('page')

// load in requested page
let script = document.createElement('script')
script.src = `scripts/${page}.js`
if (!page)
{
    script.src = `scripts/setup.js`
}
document.head.appendChild(script)

/**
 * Commandeers the create_config call normally called on page load to initialize the page.
 */
function create_config()
{
    init_page()
}