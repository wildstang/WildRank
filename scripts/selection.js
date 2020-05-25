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