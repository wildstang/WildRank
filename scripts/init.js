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
        script.src = `scripts/scout.js`
        break
    case NOTE_MODE:
        script.src = `scripts/notes.js`
        break
    case 'config-generator':
        script.src = `scripts/config-generator.js`
        break
    case 'settings':
        script.src = `scripts/settings.js`
        break
    case 'about':
        script.src = `scripts/about.js`
        break
    case 'random':
        script.src = `scripts/random.js`
        break
    case 'index':
    default:
        script.src = `scripts/index.js`
}
document.head.appendChild(script)