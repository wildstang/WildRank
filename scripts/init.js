/**
 * file:        init.js
 * description: Imports appropriate script for desired screen.
 * author:      Liam Fruzyna
 * date:        2020-06-20
 */

var urlParams = new URLSearchParams(window.location.search)
const page = urlParams.get('page')

let script = document.createElement('script')
switch (page)
{
    case 'scout':
        script.src = `/scripts/scout.js`
        break
    case NOTE_MODE:
        script.src = `/scripts/notes.js`
        break
    case 'index':
    default:
        script.src = `/scripts/index.js`
}
document.head.appendChild(script)