/**
 * file:        result-cards.js
 * description: Contains functions for building result cards used on results and teams.
 * author:      Liam Fruzyna
 * date:        2026-04-07
 */

/**
 * Builds a table for the given result.
 * @param {String} res_type Result type: result, smart, fms
 * @param {Object} result Result key value pairs
 * @param {Number} team_num Team number
 * @param {Boolean} team_avg Whether to add a team average column
 * @param {String} match_key Match key, if applicable
 * @returns A table element containing the given results
 */
function build_result_table(res_type, result, team_num, team_avg, match_key='')
{
    let result_tab = document.createElement('table')
    result_tab.append(create_header_row(team_avg ? ['', 'Result', 'Team Avg', 'Event Avg'] : ['', 'Result', 'Event Avg']))
    for (let key in result)
    {
        let full_key = `${res_type}.${key}`
        let res = cfg.get_result_from_key(full_key)
        let row = result_tab.insertRow()
        row.append(create_header(res.name))
        let cell = row.insertCell()
        cell.innerText = res.clean_value(result[key])
        if (res.type === 'cycle' && match_key)
        {
            cell.onclick = event => window_open(build_url('cycles', {'match': match_key, 'team': team_num}))
        }
        if (team_avg)
        {
            row.insertCell().innerText = res.clean_value(dal.compute_stat(full_key, team_num))
        }
        row.insertCell().innerText = res.clean_value(dal.compute_stat(full_key))
    }

    return result_tab
}

/**
 * Builds a card and adds it to the page for the given scouting mode in the given result.
 * @param {String} scout_mode Scouting mode
 * @param {Object} match_result Match result for scouting mode
 * @param {Object} meta Match result metadata for scouting mode
 * @param {Object} file_name Match result file name
 * @param {Boolean} team_avg Whether to add a team average column
 */
function add_result_card(scout_mode, match_result, meta, file_name)
{
    let config = cfg.get_scout_config(scout_mode)
    let match_scouting = config.type.includes('match')

    let result_name = document.createElement('h3')
    result_name.innerText = `${config.name} Result`

    let meta_tab = document.createElement('table')
    meta_tab.className = 'meta_table'
    let header = create_header_row(['Scouter', 'Time', 'Ignored', 'Unsure'])
    if (match_scouting)
    {
        header = create_header_row(['Scouter', 'Match Time', 'Scout Time', 'Ignored', 'Unsure'])
    }
    meta_tab.append(header)
    let value_row = meta_tab.insertRow()
    value_row.insertCell().innerText = cfg.get_name(meta.scouter.user_id, true)
    if (match_scouting)
    {
        let match_time = dal.matches[meta.result.match_key].time * 1000
        value_row.insertCell().innerText = new Date(match_time).toLocaleTimeString('en-US')
        let scout_time = meta.scouter.start_time * 1000
        let delta_secs = (match_time - scout_time) / 1000
        let abs_secs = Math.abs(delta_secs)
        let delta = `${abs_secs.toFixed(0)} secs`
        if (abs_secs >= 60)
        {
            delta = `${(abs_secs / 60).toFixed(0)} mins`
        }
        value_row.insertCell().innerText = `${new Date(scout_time).toLocaleTimeString("en-US")} (${delta} ${delta_secs > 0 ? 'early' : 'late'})`
    }
    else
    {
        let scout_time = meta.scouter.start_time * 1000
        value_row.insertCell().innerText = new Date(scout_time).toLocaleTimeString("en-US")
    }
    let ignore_box = document.createElement('input')
    ignore_box.type = 'checkbox'
    ignore_box.checked = meta.status.ignore
    ignore_box.onclick = () => toggle_ignore(match_result, meta, file_name)
    value_row.insertCell().append(ignore_box)
    value_row.insertCell().innerText = meta.status.unsure ? meta.status.unsure_reason : '-'

    let result_tab = build_result_table('result', match_result, meta.result.team_num, match_scouting, meta.result.match_key)
    let card = new WRCard([result_name, meta_tab, result_tab], true)
    let page = new WRPage('', [card])
    results_box.append(page)
}

/**
 * Builds a card and adds it to the page for the given FMS result.
 * @param {String} team_num Team number
 * @param {Object} fms_result FMS result for match-team
 * @param {Boolean} team_avg Whether to add a team average column
 */
function add_fms_card(team_num, fms_result, team_avg=false)
{
    let result_name = document.createElement('h3')
    result_name.innerText = `FMS Result`

    let result_tab = build_result_table('fms', fms_result, team_num, team_avg)
    let card = new WRCard([result_name, result_tab], true)
    let page = new WRPage('', [card])
    results_box.append(page)
}

/**
 * Builds a card and adds it to the page for the given smart result.
 * @param {String} team_num Team number
 * @param {Object} smart_result Smart result for match-team
 * @param {Boolean} team_avg Whether to add a team average column
 */
function add_smart_card(team_num, smart_result, team_avg=false)
{
    let result_name = document.createElement('h3')
    result_name.innerText = `Smart Result`

    let result_tab = build_result_table('smart', smart_result, team_num, team_avg)
    let card = new WRCard([result_name, result_tab], true)
    let page = new WRPage('', [card])
    results_box.append(page)
}

/**
 * Adds all results in the given match-team or team to the results_box.
 * @param {Object} result Result key value pairs
 * @param {Array} scout_modes Scout mode IDs the result may contain
 * @param {Number} team_num Team number
 * @param {Boolean} team_avg Whether to add a team average column
 */
function add_all_results(result, scout_modes, team_num, team_avg=false)
{
    // build a card for each scouter, fms, and smart result
    for (let scout_mode of scout_modes)
    {
        if (scout_mode in result.results)
        {
            for (let i in result.results[scout_mode])
            {
                add_result_card(scout_mode, result.results[scout_mode][i], result.meta[scout_mode][i], result.file_names[scout_mode][i])
            }
        }
    }
    if (Object.keys(result.results).length)
    {
        if (Object.keys(result.fms_results).length > 0)
        {
            add_fms_card(team_num, result.fms_results, team_avg)
        }
        add_smart_card(team_num, result.smart_results, team_avg)
    }
}
