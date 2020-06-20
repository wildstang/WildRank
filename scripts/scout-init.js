/**
 * file:        scout-init.js
 * description: Imports appropriate script for desired scouting screen.
 * author:      Liam Fruzyna
 * date:        2020-06-19
 */

var urlParams = new URLSearchParams(window.location.search)
const type = urlParams.get(TYPE_COOKIE)

let script = document.createElement('script')
if (type == NOTE_MODE)
{
    script.src = `/scripts/notes.js`
}
else
{
    script.src = `/scripts/scout.js`
}
document.head.appendChild(script)