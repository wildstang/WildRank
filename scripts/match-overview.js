/**
 * file:        matches-overview.js
 * description: Contains functions for the match overview selection page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-06-13
 */

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch simple event matches from localStorage. Initialize page contents.
 */
function init_page()
{
    let first = populate_matches(true, false)
    let teams = Object.keys(dal.teams)
    if (teams.length > 0)
    {
        teams.unshift('')
        add_dropdown_filter('team_filter', teams, 'hide_matches()')
    }
    if (first)
    {
        let extra_toggle = new Button('toggle_extra', 'Show/Hide Extra', 'toggle_extra()')
        extra_toggle.add_class('slim')
        contents_card.innerHTML = `<h2>Match <span id="match_num">No Match Selected</span></h2>
                                    <h3 id="time"></h3>
                                    <h3 id="result"></h3>
                                    ${extra_toggle.toString}
                                    <div id="extra" style="display: none"></div>`
        buttons_container.innerHTML = '<div id="teams"></div>'

        open_match(first)
    }
    else
    {
        contents_card.innerHTML = '<h2>No Match Data Found</h2>Please preload event'
    }
}

/**
 * function:    hide_match
 * parameters:  none
 * returns:     none
 * description: Rebuilds the match list based on the selected team.
 */
function hide_matches()
{
    let team = document.getElementById('team_filter').value
    let first = populate_matches(true, true, team)
    open_match(first)
}

/**
 * function:    open_match
 * parameters:  Selected match number
 * returns:     none
 * description: Completes right info pane for a given match number.
 */
function open_match(match_key)
{
    
    // select option
    deselect_all()
    document.getElementById(`match_option_${match_key}`).classList.add('selected')

    // place match number and team to scout on pane
    document.getElementById('match_num').innerHTML = dal.get_match_value(match_key, 'match_name')

    // place match time
    document.getElementById('time').innerHTML = dal.get_match_value(match_key, 'display_time')
    if (dal.get_match_value(match_key, 'complete'))
    {        
        // add match score
        document.getElementById('result').innerHTML = dal.get_match_value(match_key, 'score_str')

        // add videos
        let extra = '<div id="videos"></div>'
        let videos = dal.get_match_value(match_key, 'videos')
        if (videos && videos.length > 0)
        {
            for (let vid of videos)
            {
                // only youtube videos
                if (vid.type == 'youtube')
                {
                    extra += `<iframe id="${vid.key}" width="640" height="360" src="https://www.youtube.com/embed/${vid.key}" allow="fullscreen"></iframe>`
                }
            }
        }

        // add score breakdown
        let breakdown = dal.get_match_value(match_key, 'score_breakdown')
        if (breakdown)
        {
            extra += '<center><table style=""><tr><th>Key</th><th>Red</th><th>Blue</th></tr>'
            for (let key of Object.keys(breakdown.red))
            {
                let name = key.replace('tba_', '')
                name = name[0].toUpperCase() + name.substring(1).split(/(?=[A-Z])/).join(' ')
                name = name.replace('1', ' 1').replace('2', ' 2').replace('3', ' 3')
                let red = parse_val(breakdown.red[key])
                let blue = parse_val(breakdown.blue[key])
                extra += `<tr><th>${name}</th><td>${red}</td><td>${blue}</td></tr>`
            }
            extra += '</table></center>'
        }
        document.getElementById('extra').innerHTML = extra
    }
    else
    {
        document.getElementById('result').innerHTML = ''
        document.getElementById('extra').innerHTML = ''
    }

    // reorganize teams into single object
    let match_teams = dal.get_match_teams(match_key)

    let red_col = new ColumnFrame('', '')
    let blue_col = new ColumnFrame('', '')

    let positions = Object.keys(match_teams)
    
    // make a row for each team
    for (let key of positions)
    {
        let team_num = match_teams[key]
        let alliance = key.split('_')[0]

        // build button to either scout or result
        let team = `<span class="${alliance}">${team_num}</span>`
        let scout_link = new Button(`scout_${team_num}`, `Scout ${team}`)
        scout_link.link = `open_page('scout', {type: '${MATCH_MODE}', match: '${match_key}', team: '${team_num}', alliance: '${alliance}', edit: false})`
        if (dal.is_match_scouted(match_key, team_num))
        {
            scout_link = new Button(`results_${team_num}`, `${team} Results`)
            scout_link.link = `open_page('results', {'file': '${match_key}-${team_num}'})`
        }

        // add button and description to appropriate column
        let team_info = `<center><span class="${alliance}">${team_num}</span><br>${dal.get_value(team_num, 'meta.name')}<br>${dal.get_rank_str(team_num)}</center>`
        let info_card = new Card(`card_${team_num}`, team_info)
        info_card.limitWidth = true
        if (alliance === 'red')
        {
            red_col.add_input(scout_link)
            red_col.add_input(info_card)
        }
        else
        {
            blue_col.add_input(scout_link)
            blue_col.add_input(info_card)
        }
    }

    // create page
    let page = new PageFrame('', '', [red_col, blue_col])
    document.getElementById('teams').innerHTML = page.toString
}

/**
 * function:    toggle_extra
 * parameters:  none
 * returns:     none
 * description: Toggles the display property of the extra content area.
 */
function toggle_extra()
{
    let extra = document.getElementById('extra')
    if (extra.style.display == 'none')
    {
        extra.style.display = 'block'
    }
    else
    {
        extra.style.display = 'none'
    }
}

/**
 * function:    parse_val
 * parameters:  value to parse
 * returns:     parsed value
 * parameters:  Parses a value to be more human-readable on the table.
 */
function parse_val(val)
{
    if (typeof val === 'string')
    {
        val = val[0].toUpperCase() + val.substring(1).split(/(?=[A-Z])/).join(' ')
        val = val.replace('None', '').replace('Unknown', '')
    }
    else if (typeof val === 'boolean')
    {
        val = val ? 'Yes' : ''
    }
    return val
}