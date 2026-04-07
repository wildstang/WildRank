/**
 * file:        teams.js
 * description: Contains functions for the team overview page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-06-13
 */

include('mini-picklists')

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
    for (let mode of cfg.team_scouting_modes)
    {
        if (mode in team.results)
        {
            for (let i in team.results[mode])
            {
                add_result_card(mode, team.results[mode][i], team.meta[mode][i], team.file_names[mode][i])
            }
        }
    }
    if (Object.keys(team.fms_results).length > 0)
    {
        add_fms_card(team_num, team.fms_results)
    }
    add_smart_card(team_num, team.smart_results)
}

/**
 * Builds a card and adds it to the page for the given scouting mode in the given result.
 * @param {String} scout_mode Scouting mode
 * @param {Object} result Match result for scouting mode
 * @param {Object} meta Match result metadata for scouting mode
 * @param {Object} file_name Match result file name
 */
function add_result_card(scout_mode, result, meta, file_name)
{
    let config = cfg.get_scout_config(scout_mode)

    let result_name = document.createElement('h3')
    result_name.innerText = `${config.name} Result`

    let meta_tab = document.createElement('table')
    meta_tab.className = 'meta_table'
    meta_tab.append(create_header_row(['Scouter', 'Time', 'Ignored', 'Unsure']))
    let value_row = meta_tab.insertRow()
    value_row.insertCell().innerText = cfg.get_name(meta.scouter.user_id, true)
    let scout_time = meta.scouter.start_time * 1000
    value_row.insertCell().innerText = new Date(scout_time).toLocaleTimeString("en-US")
    let ignore_box = document.createElement('input')
    ignore_box.type = 'checkbox'
    ignore_box.checked = meta.status.ignore
    ignore_box.onclick = () => toggle_ignore(result, meta, file_name)
    value_row.insertCell().append(ignore_box)
    value_row.insertCell().innerText = meta.status.unsure ? meta.status.unsure_reason : '-'

    let result_tab = document.createElement('table')
    result_tab.append(create_header_row(['', 'Result', 'Event Avg']))
    for (let key in result)
    {
        let res = cfg.get_result_from_key(`result.${key}`)
        let row = result_tab.insertRow()
        row.append(create_header(res.name))
        row.insertCell().innerText = res.clean_value(result[key])
        row.insertCell().innerText = res.clean_value(dal.compute_stat(`result.${key}`))
    }

    let card = new WRCard([result_name, meta_tab, result_tab], true)
    let page = new WRPage('', [card])
    results_box.append(page)
}

/**
 * Builds a card and adds it to the page for the given FMS result.
 * @param {String} team_num Team number
 * @param {Object} fms_result FMS result for team
 */
function add_fms_card(team_num, fms_result)
{
    let result_name = document.createElement('h3')
    result_name.innerText = `FMS Result`

    let result_tab = document.createElement('table')
    result_tab.append(create_header_row(['', 'Result', 'Event Avg']))
    for (let key in fms_result)
    {
        let result = cfg.get_result_from_key(`fms.${key}`)
        let row = result_tab.insertRow()
        row.append(create_header(result.name))
        row.insertCell().innerText = result.clean_value(fms_result[key])
        row.insertCell().innerText = result.clean_value(dal.compute_stat(`fms.${key}`))
    }

    let card = new WRCard([result_name, result_tab], true)
    let page = new WRPage('', [card])
    results_box.append(page)
}

/**
 * Builds a card and adds it to the page for the given smart result.
 * @param {String} team_num Team number
 * @param {Object} smart_result Smart result for team
 */
function add_smart_card(team_num, smart_result)
{
    let result_name = document.createElement('h3')
    result_name.innerText = `Smart Result`

    let result_tab = document.createElement('table')
    result_tab.append(create_header_row(['', 'Result', 'Event Avg']))
    for (let key in smart_result)
    {
        let result = cfg.get_result_from_key(`smart.${key}`)
        let row = result_tab.insertRow()
        row.append(create_header(result.name))
        row.insertCell().innerText = result.clean_value(smart_result[key])
        row.insertCell().innerText = result.clean_value(dal.compute_stat(`smart.${key}`))
    }

    let card = new WRCard([result_name, result_tab], true)
    let page = new WRPage('', [card])
    results_box.append(page)
}
