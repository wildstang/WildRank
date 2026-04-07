/**
 * file:        teams.js
 * description: Contains functions for the team overview page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-06-13
 */

include('mini-picklists')
include('result-cards')

var avatar, team_number, team_name, loc, ranking, completion_table, results_box

const selected_team = get_parameter('team', '')

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch event teams from localStorage. Initialize page contents.
 */
function init_page()
{
    header_info.innerText = 'Team Profiles'
    enable_list(true, true)

    if (dal.team_numbers.length > 0)
    {
        let first = ''
        for (let team_num of dal.team_numbers)
        {
            let op = new WRDescriptiveOption(team_num, team_num, dal.teams[team_num].name)
            if (first === '')
            {
                first = team_num
            }
            add_option(op)
        }

        avatar = document.createElement('img')
        avatar.className = 'avatar'

        let team_header = document.createElement('h2')
        team_number = document.createElement('span')
        team_name = document.createElement('span')
        team_header.append(team_number, ' ', team_name)

        results_box = document.createElement('div')

        ranking = document.createElement('h3')
        completion_table = document.createElement('table')
        let card = new WRCard([avatar, team_header, ranking, completion_table])
        card.add_class('result_card')

        preview.append(card, results_box)
        
        open_option(first)
    }
    else
    {
        add_error_card('No Team Data Found', 'Please preload event')
    }
}

/**
 * Handles team number selection and populate the page.
 */
function open_option(team_num)
{
    deselect_all()

    // populate top
    avatar.src = dal.teams[team_num].avatar
    team_number.innerText = team_num
    team_name.innerText = dal.teams[team_num].name
    document.getElementById(`left_pit_option_${team_num}`).classList.add('selected')

    // populate ranking
    ranking.innerHTML = dal.get_rank_string(team_num)

    // scouting completion table
    completion_table.replaceChildren()

    // add match scouting to completion table
    modes = cfg.match_scouting_modes
    let match_header = completion_table.insertRow()
    match_header.insertCell()
    let matches = dal.sort_match_keys(dal.teams[team_num].matches)
    for (let match_key of matches)
    {
        match_header.append(create_header(dal.matches[match_key].short_name))
    }
    for (let mode of modes)
    {
        let match_status = completion_table.insertRow()
        match_status.append(create_header(cfg.get_scout_config(mode).name))
        for (let match_key of matches)
        {
            let cell = match_status.insertCell()
            let scouted = dal.is_match_scouted(match_key, team_num, mode)
            cell.style.backgroundColor = scouted ? 'green' : 'red'
            cell.onclick = (event) => window_open(build_url('result-state', {'match': match_key, 'team': team_num}))
        }
    }

    populate_results(team_num)

    ws(team_num)
}

/**
 * Builds a card for each team result belonging to the given team.
 * @param {Number} team_num Selected team number
 */
function populate_results(team_num)
{
    results_box.replaceChildren()
    results_box.scrollTo(0, 0)

    let team = dal.teams[team_num]
    add_all_results(team, cfg.team_scouting_modes, team_num)
}
