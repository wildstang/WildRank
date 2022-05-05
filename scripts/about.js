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
        build_card('release', 'Release: Nope', true),
        build_card('config', 'Config: Nope', true),
        build_card('description', 'WildRank is a FIRST Robotics Competition scouting web app and a spiritual successor to <a href="https://github.com/wildstang/wildrank-android">WildRank Android</a>. It was developed to be a progressive web app supporting full offline functionality on most modern devices.', true)
    ]),
    build_column_frame('Get WildRank', [
        build_link_button('source', 'Source', `'https://github.com/WildStang/WildRank'`),
        build_link_button('demo', 'Web Demo', `'/'`),
        build_link_button('wildstang', 'WildStang', `'https://wildstang.org'`)    ]),
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
            let git = /Git: <a href=".*">(.*)<\/a><br>/g.exec(req.responseText)
            if (git !== null && git.length > 0)
            {
                git = git[0]
                document.getElementById('version').innerHTML = git.substring(0, git.length - 36) + '</a>'
            }
        }
        // add pwa version and link
        if (req.responseText.includes('Release:'))
        {
            let release = /Release: ([^<]*)<br>/g.exec(req.responseText)
            if (release !== null && release.length > 0)
            {
                release = release[0]
                document.getElementById('release').innerHTML = release.substring(0, release.length)
            }
        }
        if (cfg.version)
        {
            document.getElementById('config').innerHTML = `Config: ${cfg.version}`
        }
    }
    catch (e)
    {
        console.log('Error')
    }
}