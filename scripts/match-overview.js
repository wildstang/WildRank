/**
 * file:        matches-overview.js
 * description: Contains functions for the match overview selection page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-06-13
 */

include('whiteboard-obj')

var match_num_el, time_el, result_el, extra_el, teams_el, whiteboard
var playing = false

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch simple event matches from localStorage. Initialize page contents.
 */
function init_page()
{
    header_info.innerText = 'Match Summaries'

    let first = populate_matches(true, false)
    let teams = Object.keys(dal.teams)
    if (teams.length > 0)
    {
        teams.unshift('')
        add_dropdown_filter('team_filter', teams, 'hide_matches()')
    }
    if (first)
    {
        whiteboard = new Whiteboard(start_match, false)
        let preview = document.getElementById('center')
        whiteboard.update_dimensions(640, preview.offsetHeight)

        match_num_el = document.createElement('h2')
        match_num_el.innerText = 'No Match Selected'
        time_el = document.createElement('h3')
        result_el = document.createElement('h3')
        let extra_toggle = new Button('toggle_extra', 'Show/Hide Extra', 'toggle_extra()')
        extra_toggle.add_class('slim')
        extra_el = document.createElement('div')
        extra_el.style.display = 'none'
        let card = new Card('contents_card', [match_num_el, time_el, result_el, extra_toggle.element, extra_el])

        teams_el = document.createElement('div')
        preview.append(card.element, teams_el)

        open_option(first)
    }
    else
    {
        add_error_card('No Match Data Found', 'Please preload event')
    }
}

/**
 * Plays the match continuously.
 */
async function start_match()
{
    playing = false

    let length = whiteboard.get_match_length()
    if (length > 0)
    {
        await new Promise(r => setTimeout(r, 1000))
        whiteboard.canvas.style.display = 'inline-block'
    
        let time = 0
        playing = true
        while (playing)
        {
            start = Date.now()
    
            // increment the playback
            whiteboard.set_match_time(++time, 10)
    
            // determine the interval by the requested speed (in 1/10 seconds)
            let interval = 100.0
            let delta = Date.now() - start
    
            // sleep until the next frame
            if (interval > delta)
            {
                await new Promise(r => setTimeout(r, interval - delta))
            }
    
            if (time >= length)
            {
                time = 0
            }
        }
    }
    else
    {
        // hide the whiteboard if there is no zebra data
        whiteboard.canvas.style.display = 'none'
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
    open_option(first)
}

/**
 * function:    open_option
 * parameters:  Selected match number
 * returns:     none
 * description: Completes right info pane for a given match number.
 */
function open_option(match_key)
{
    // select option
    deselect_all()
    document.getElementById(`match_option_${match_key}`).classList.add('selected')

    // place match number and team to scout on pane
    match_num_el.innerText = dal.get_match_value(match_key, 'match_name')

    // place match time
    time_el.innerText = dal.get_match_value(match_key, 'display_time')

    // generate extras
    let extras = []
    if (dal.get_match_value(match_key, 'complete'))
    {        
        // add match score
        result_el.replaceChildren(dal.generate_score(match_key))

        // add videos
        let videos = dal.get_match_value(match_key, 'videos')
        if (videos && videos.length > 0)
        {
            for (let vid of videos)
            {
                // only youtube videos
                if (vid.type == 'youtube')
                {
                    let video = document.createElement('iframe')
                    video.width = 640
                    video.height = 360
                    video.src = `https://www.youtube.com/embed/${vid.key}`
                    video.allow = 'fullscreen'
                    extras.push(video)
                }
            }
        }

        extras.push(whiteboard.canvas)

        // add score breakdown
        let breakdown = dal.get_match_value(match_key, 'score_breakdown')
        if (breakdown)
        {
            // create score breakdown header
            let table = document.createElement('table')
            let row = table.insertRow()
            row.append(create_header('Key'), create_header('Red'), create_header('Blue'))

            // add each team
            for (let key of Object.keys(breakdown.red))
            {
                let name = key.replace('tba_', '')
                name = name[0].toUpperCase() + name.substring(1).split(/(?=[A-Z])/).join(' ')
                name = name.replace('1', ' 1').replace('2', ' 2').replace('3', ' 3')
                row = table.insertRow()
                row.append(create_header(name))
                row.insertCell().append(parse_val(breakdown.red[key]))
                row.insertCell().append(parse_val(breakdown.blue[key]))
            }

            // center the table
            let center = document.createElement('center')
            center.append(table)
            extras.push(center)
        }
    }
    extra_el.replaceChildren(...extras)

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
        let team = document.createElement('span')
        team.className = alliance
        team.innerText = team_num

        let scout_text = document.createElement('span')
        scout_text.append('Scout ', team)
        let scout_link = new Button(`scout_${team_num}`, scout_text)
        scout_link.link = `open_page('scout', {type: '${MATCH_MODE}', match: '${match_key}', team: '${team_num}', alliance: '${alliance}', edit: false})`
        if (dal.is_match_scouted(match_key, team_num))
        {
            let result_text = document.createElement('span')
            result_text.append(team, ' Results')
            scout_link = new Button(`results_${team_num}`, result_text)
            scout_link.link = `open_page('results', {'file': '${match_key}-${team_num}'})`
        }

        // add button and description to appropriate column
        let team_info = document.createElement('center')
        let team_el = document.createElement('span')
        team_el.className = alliance
        team_el.innerText = team_num
        team_info.append(team_el, br(), dal.get_value(team_num, 'meta.name'), br(), dal.get_rank_str(team_num))
        let info_card = new Card(`card_${team_num}`, team_info)
        info_card.limitWidth = true
        info_card.space_after = false
        let stack = new Stack('', [info_card, scout_link])
        if (alliance === 'red')
        {
            red_col.add_input(stack)
        }
        else
        {
            blue_col.add_input(stack)
        }
    }

    // create page
    let page = new PageFrame('', '', [red_col, blue_col])
    teams_el.replaceChildren(page.element)

    whiteboard.load_match(match_key)
}

/**
 * function:    toggle_extra
 * parameters:  none
 * returns:     none
 * description: Toggles the display property of the extra content area.
 */
function toggle_extra()
{
    if (extra_el.style.display == 'none')
    {
        extra_el.style.display = 'block'
    }
    else
    {
        extra_el.style.display = 'none'
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
    else if (typeof val === 'object' && cfg.year === '2023')
    {
        if (Array.isArray(val))
        {
            let table = document.createElement('table')
            for (let v of val)
            {
                let r = table.insertRow()
                r.insertCell().innerText = v.row
                r.insertCell().innerText = v.nodes.join(', ')
            }
            val = table
        }
        else
        {
            let table = document.createElement('table')
            let rows = Object.keys(val)
            for (let r of rows)
            {
                let trow = table.insertRow()
                trow.append(create_header(r))
                let row = val[r]
                for (let p of row)
                {
                    let color = ''
                    if (p === 'Cube')
                    {
                        color = 'purple'
                    }
                    else if (p === 'Cone')
                    {
                        color = 'yellow'
                    }
                    let cell = trow.insertCell()
                    cell.style.backgroundColor = color
                    cell.innerText = p.replace('None', '')
                }
            }
            val = table
        }
    }
    else if (typeof val === 'object')
    {
        val = JSON.stringify(val, 1)
    }
    return val
}