/**
 * file:        about.js
 * description: About page, displays several relevant links and server/app info.
 * author:      Liam Fruzyna
 * date:        2020-12-18
 */

// generate page
const PAGE_FRAME = build_page_frame('', [
    build_column_frame('About', [
        build_card('server', 'Server: Unknown'),
        build_card('version', 'Git: Nope', true),
        build_card('description', 'WildRank is a FIRST Robotics Competition scouting web app and a spiritual successor to <a href="https://github.com/wildstang/wildrank-android">WildRank Android</a>. Despite being a web app, the goal of WildRank is not to host a webpage on a remote server while scouting on clients, but rather to run generic lightweight servers on each of the clients themselves so that the majority of the app is platform agnostic.', true)
    ]),
    build_column_frame('Get WildRank', [
        build_link_button('source', 'Source', `'https://github.com/WildStang/WildRank'`),
        build_link_button('demo', 'Web Demo', `'/'`),
        build_link_button('android', 'Android', `'https://play.google.com/store/apps/details?id=net.fruzyna.wildrank.android'`),
        build_link_button('ios', 'iOS', `'https://github.com/WildStang/WildRank-iOS-Server'`),
    ]),
])

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    // set header
    document.getElementById('header_info').innerHTML = 'About'

    document.body.innerHTML += PAGE_FRAME

    try
    {
        // send request to /about
        let check_addr = `/about`
        var req = new XMLHttpRequest()
        req.open('GET', check_addr, false)
        req.send(null)

        // confirm Python server
        if (req.responseText.includes('POST server'))
        {
            let words = req.responseText.split(' ')
            let server = words[words.indexOf('POST') - 1]
            document.getElementById('server').innerHTML = `Server: ${server} POST`
        }
        else
        {
            document.getElementById('server').innerHTML = 'Server: Generic'
        }

        // add git commit and link
        if (req.responseText.includes('Git:'))
        {
            let words = req.responseText.split('<br>')
            let git = words[words.length - 1]
            document.getElementById('version').innerHTML = `${git.slice(0, git.indexOf('>') + 17)}</a>`
        }
    }
    catch (e)
    {
        console.log('Error')
    }
}