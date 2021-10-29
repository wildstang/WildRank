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