/**
 * file:        matches-overview.js
 * description: Contains functions for the match overview selection page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-06-13
 */

var match_num_el, time_el, team_tab, completion_table, extra_el, team_filter

/**
 * Builds the structure of the page on page load.
 */
function init_page()
{
    header_info.innerText = 'Match Summaries'


    if (dal.match_keys.length > 0)
    {
        match_num_el = document.createElement('h2')
        match_num_el.innerText = 'No Match Selected'
        time_el = document.createElement('h3')
        team_tab = document.createElement('table')
        team_tab.style.margin = 'auto'
        completion_table = document.createElement('table')
        completion_table.style.margin = 'auto'
        extra_el = document.createElement('div')
        let card = new WRCard([match_num_el, time_el, team_tab, br(), completion_table, br(), extra_el], true)
        preview.append(card)

        // show and populate the left column with matches and a team filter
        enable_list()
        let teams = dal.team_numbers
        teams.unshift('')
        team_filter = add_dropdown_filter(teams, build_match_list)

        build_match_list()
    }
    else
    {
        add_error_card('No Match Data Found', 'Please preload event')
    }
}

/**
 * Filters matches to those for the currently selected team.
 */
function build_match_list()
{
    clear_list()

    let first = ''
    let team_num = parseInt(team_filter.element.value)
    for (let match_key of dal.match_keys)
    {
        let match = dal.matches[match_key]
        if (isNaN(team_num) || match.red_alliance.includes(team_num) || match.blue_alliance.includes(team_num))
        {
            if (!first)
            {
                first = match_key
            }
            let op = new WRMatchOption(match_key, match.short_name, match.red_alliance.map(t => t.toString()), match.blue_alliance.map(t => t.toString()))
            if (!match.complete)
            {
                op.add_class('scouted')
            }
            add_option(op)
        }
    }

    if (first)
    {
        open_option(first)
    }
}

/**
 * Opens the given match. Currently only displays time, score, and video
 * @param {String} match_key Match key
 */
function open_option(match_key)
{
    // select option
    deselect_all()
    document.getElementById(`left_match_option_${match_key}`).classList.add('selected')

    // place match number and team to scout on pane
    let match = dal.matches[match_key]
    match_num_el.innerText = match.name

    // place match time
    time_el.innerText = new Date(match.time).toLocaleTimeString("en-US")

    team_tab.replaceChildren()
    build_alliance_row(team_tab, match, 'blue')
    build_alliance_row(team_tab, match, 'red')

    let teams = Object.values(dal.get_match_teams(match_key))

    completion_table.replaceChildren()
    let header_row = completion_table.insertRow()
    header_row.insertCell()
    for (let team_num of teams)
    {
        header_row.insertCell().innerText = team_num
    }
    for (let mode of cfg.match_scouting_modes)
    {
        let row = completion_table.insertRow()
        row.append(create_header(cfg.get_scout_config(mode).name))
        for (let team_num of teams)
        {
            let cell = row.insertCell()
            let scouted = dal.is_match_scouted(match_key, team_num, mode)
            cell.style.backgroundColor = scouted ? 'green' : 'red'
        }
    }

    // generate extras
    let extras = []
    if (match.complete)
    {
        // add videos
        let videos = match.videos
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
    }
    extra_el.replaceChildren(...extras)
}

/**
 * Adds a row to a given table for a given alliance and score.
 * @param {HTMLTableElement} table Existing table
 * @param {Object} match Match object
 * @param {String} color Alliance color
 */
function build_alliance_row(table, match, color)
{
    let row = table.insertRow()
    for (let team of match[`${color}_alliance`])
    {
        let cell = row.insertCell()
        cell.innerText = team
        if (match.winner === undefined || match.winner === color)
        {
            cell.className = color
        }
    }
    if (match.winner)
    {
        let cell = row.insertCell()
        cell.style.fontWeight = 'bold'
        cell.innerText = match[`${color}_score`]
        if (match.winner === color)
        {
            cell.className = color
        }
    }
}