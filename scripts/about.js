/**
 * file:        about.js
 * description: About page, displays several relevant links and server/app info.
 * author:      Liam Fruzyna
 * date:        2020-12-18
 */

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

    // generate page
    let page = new PageFrame()
    let about_col = new ColumnFrame('', 'About')
    page.add_column(about_col)

    let server = new Card('server', 'Server: Unknown')
    about_col.add_input(server)

    let version = new Card('version', 'Git: Nope')
    version.limitWidth = true
    about_col.add_input(version)

    let release = new Card('release', 'Release: Nope')
    release.limitWidth = true
    about_col.add_input(release)

    let config = new Card('config', 'Config: Nope')
    config.limitWidth = true
    about_col.add_input(config)

    let description = new Card('description', 'WildRank is a FIRST Robotics Competition scouting web app and a spiritual successor to <a href="https://github.com/wildstang/wildrank-android">WildRank Android</a>. It was developed to be a progressive web app supporting full offline functionality on most modern devices.')
    description.limitWidth = true
    about_col.add_input(description)

    let get_col = new ColumnFrame('', 'Get WildRank')
    page.add_column(get_col)

    let source = new Button('source', 'Source')
    source.link = `'https://github.com/WildStang/WildRank'`
    get_col.add_input(source)

    let demo = new Button('demo', 'Web Demo')
    demo.link = `'/'`
    get_col.add_input(demo)

    let wildstang = new Button('wildstang', 'wildstang')
    wildstang.link = `'https://wildstang.org'`
    get_col.add_input(wildstang)

    document.body.innerHTML += page.toString

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