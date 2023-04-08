/**
 * file:        bracket.js
 * description: Builds a double elim bracket for your team.
 *              TODO: support manually marking teams as won and generating matches
 * author:      Liam Fruzyna
 * date:        2023-04-07
 */

include('transfer')

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch simple event matches from localStorage. Initialize page contents.
 */
function init_page()
{
    // build page
    first = populate_teams(false)

    if (dal.event.playoff_type !== 10)
    {
        contents_card.innerHTML = '<h2>Not a double elim event!</h2>'
    }
    else if (first)
    {
        // build template
        contents_card.innerHTML = `<h2 id="next_match"></h2><h3 id="alliance"></h3><div id="partners"></div><br>vs<h3 id="opp_alliance"></h3><div id="opponents"></div>`
        let card = new Card('table', '')
        let edit = new Button('edit_coach', 'Edit Values')
        edit.link = `open_page('edit-coach')`
        let preload = new Button('preload', 'Update Matches', 'preload_event()')
        buttons_container.innerHTML = new ColumnFrame('', '', [card, edit, preload]).toString

        // open default time
        if (cfg.settings.hasOwnProperty('team_number'))
        {
            let team = cfg.settings.team_number.toString()
            if (team in dal.teams)
            {
                first = cfg.settings.team_number.toString()
            }
        }
        open_option(first)
    }
    else
    {
        contents_card.innerHTML = '<h2>No Teams Found</h2>Please preload event'
    }
}

/**
 * function:    open_match
 * parameters:  Selected team number
 * returns:     none
 * description: Completes right info pane for a given team number.
 */
function open_option(team)
{
    // select option
    deselect_all()
    document.getElementById(`option_${team}`).classList.add('selected')

    // get the team's matches
    let matches = Object.values(dal.matches)
    let team_matches = matches.filter(m => (m.red_alliance.includes(team) || m.blue_alliance.includes(team)) && !m.complete)

    // find the templates
    let title = document.getElementById('next_match')
    let alliance_box = document.getElementById('alliance')
    let partner_box = document.getElementById('partners')
    let opp_section = document.getElementById('opp_alliance')
    let opp_teams = document.getElementById('opponents')
    document.getElementById(`table`).innerHTML = ''

    // if no matches find assume team is eliminated
    if (team_matches.length === 0)
    {
        title.innerHTML = 'Team Eliminated'
        alliance_box.innerHTML = ''
        partner_box.innerHTML = ''
        opp_section.innerHTML = ''
        opp_teams.innerHTML = ''
    }
    // if there still is a qualification match scheduled, elims hasn't started
    else if (team_matches[0].comp_level === 'qm')
    {
        title.innerHTML = 'Elims not yet started'
        alliance_box.innerHTML = ''
        partner_box.innerHTML = ''
        opp_section.innerHTML = ''
        opp_teams.innerHTML = ''
    }
    // otherwise populate with the assumed next elim match
    else
    {
        let match = team_matches[0]
        title.innerHTML = `Next Match: ${match.match_name}`

        // determine alliance color and teams
        let alliance = 'Blue'
        let opp_alliance = 'Red'
        if (match.red_alliance.includes(team))
        {
            alliance = 'Red'
            opp_alliance = 'Blue'
        }
        let partners = match[`${alliance.toLowerCase()}_alliance`]
        let opponents = match[`${opp_alliance.toLowerCase()}_alliance`]

        // place alliance color
        alliance_box.innerHTML = `${alliance} Alliance`
        alliance_box.style.color = alliance
        partner_box.innerHTML = partners.join(', ')

        if (opponents.length > 0 && !opponents.includes('0'))
        {
            // place alliance partners
            opp_section.style.color = opp_alliance
            opp_section.innerHTML = `${opp_alliance} Alliance`
            opp_teams.innerHTML = opponents.join(', ')
            build_table(opp_alliance.toLowerCase(), opponents)
        }
        else
        {
            // determine match that determines opponents
            let match_name = ''
            let winner = true
            switch (match.short_match_name)
            {
                case 'M5':
                    match_name = 'M2'
                    winner = false
                    break
                case 'M6':
                    match_name = 'M4'
                    winner = false
                    break
                case 'M7':
                    match_name = 'M2'
                    break
                case 'M8':
                    match_name = 'M4'
                    break
                case 'M9':
                    match_name = 'M7'
                    winner = false
                    break
                case 'M10':
                    match_name = 'M8'
                    winner = false
                    break
                case 'M11':
                    match_name = 'M10'
                    break
                case 'M12':
                    match_name = 'M8'
                    break
                case 'M13':
                    match_name = 'M12'
                    winner = false
                    break
                case 'F1':
                    match_name = 'M13'
                    break
            }
            let opp_match = matches.filter(m => m.short_match_name === match_name)[0]

            // populate with opponent match
            opp_section.innerHTML = `Determined by ${winner ? 'WINNER' : 'LOSER'} of ${opp_match.match_name}`
            opp_teams.innerHTML += `<table><tr style="color: red">${opp_match.red_alliance.map(t => `<td>${t}</td>`).join('')}</tr>
                                             <tr style="color: blue">${opp_match.blue_alliance.map(t => `<td>${t}</td>`).join('')}</tr></table>`

            build_table('red', opp_match.red_alliance)
            build_table('blue', opp_match.blue_alliance)
        }
    }
}

/**
 * function:    build_table
 * parameters:  alliance color, array of team numbers
 * returns:     none
 * description: Populates a card with coach vals of each team in an alliance.
 */
function build_table(alliance, teams)
{
    let images = dal.get_photo_carousel(teams, '400px')
    let table = '<table><tr><td></td>'
    let names = '<tr><td></td>'
    for (let team of teams)
    {
        table += `<th ${dal.is_unsure(team) ? 'class="highlighted"' : ''}>${team}</th>`
        names += `<th>${dal.get_value(team, 'meta.name')}</th>`
    }
    table += `</tr>${names}</tr>`
    for (let v of cfg.coach)
    {
        table += `<tr><th>${dal.get_name(v.key, v.function)}</th>`
        for (let team of teams)
        {
            table += `<td>${dal.get_value(team, v.key, v.function, true)}</td>`
        }
        table += '</tr>'
    }
    table += '</table>'
    let header = `<center><h2 style="color: ${alliance}">${alliance[0].toUpperCase()}${alliance.substring(1)} Alliance</h2></center>`
    document.getElementById(`table`).innerHTML += header + images + table
}

/**
 * function:    process_files
 * parameters:  none
 * returns:     none
 * description: Reloads the page on new results.
 */
function process_files()
{
    dal.build_teams()
    init_page()
}

/**
 * function:    get_event
 * parameters:  none
 * returns:     Currently entered event ID.
 * description: Returns text in event id box.
 */
function get_event()
{
    return get_cookie(EVENT_COOKIE, cfg.defaults.event_id)
}