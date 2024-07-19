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
    header_info.innerText = 'About'

    // generate page
    let page = new WRPage()
    let about_col = new WRColumn('Application')
    page.add_column(about_col)

    let server = new WRCard('Server: Unknown')
    server.space_after = false
    server.limitWidth = true
    about_col.add_input(server)

    let version = new WRCard('Git: Nope')
    version.space_after = false
    version.limitWidth = true
    about_col.add_input(version)

    let release = new WRCard('Release: Nope')
    release.limitWidth = true
    release.space_after = false
    about_col.add_input(release)

    let config = new WRCard('Config: Nope')
    config.limitWidth = true
    config.space_after = false
    about_col.add_input(config)

    let get_col = new WRColumn('Links')
    page.add_column(get_col)

    let source = new WRLinkButton('GitHub', 'https://github.com/WildStang/WildRank', true)
    get_col.add_input(source)

    let demo = new WRLinkButton('Public Demo', 'https://wildrank.app', true)
    get_col.add_input(demo)

    let wildstang = new WRLinkButton('WildStang Program', 'https://wildstang.org', true)
    get_col.add_input(wildstang)

    body.replaceChildren(page)

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
            let server_name = words[words.indexOf('POST') - 1]
            server.text_el.innerText = `Server: ${server_name} POST`
        }
        else
        {
            server.text_el.innerText = 'Server: Generic'
        }

        // add git commit and link
        if (req.responseText.includes('Git:'))
        {
            let git = /Git: <a href=".*">(.*)<\/a><br>/g.exec(req.responseText)
            if (git !== null && git.length > 0)
            {
                git = git[0]
                version.text_el.innerHTML = git.substring(0, git.length - 36) + '</a>'
            }
        }
        // add pwa version and link
        if (req.responseText.includes('Release:'))
        {
            let release_name = /Release: ([^<]*)<br>/g.exec(req.responseText)
            if (release_name !== null && release_name.length > 0)
            {
                release_name = release_name[0]
                release.text_el.innerHTML = release_name.substring(0, release_name.length)
            }
        }
        if (cfg.version)
        {
            config.text_el.innerText = `Config: ${cfg.version}`
        }
    }
    catch (e)
    {
        console.log('Error')
    }
}