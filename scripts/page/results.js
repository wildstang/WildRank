/**
 * file:        results.js
 * description: Contains functions for the result selection page of the web app.
 *              Primarily for building the interface from results.
 * author:      Liam Fruzyna
 * date:        2020-02-26
 */

include('mini-picklists')

// read parameters from URL
var urlParams = new URLSearchParams(window.location.search)
const selected_match = get_parameter('match', '')
const selected_team = get_parameter('team', '')

var avatar, result_name, team_el, name_el, match_el, rank_el, team_filter, results_box

/**
 * Fetch results from localStorage. Initialize page contents.
 */
function init_page()
{
    header_info.innerText = 'Result Viewer'

    let title = document.createElement('div')
    avatar = document.createElement('img')
    avatar.className = 'avatar'
    result_name = document.createElement('h2')
    team_el = create_element('label', 'team_num')
    name_el = document.createElement('name_el')
    match_el = document.createElement('label')
    result_name.append(team_el, ': ', name_el, ', ', match_el)
    rank_el = document.createElement('h3')
    title.append(avatar, ' ', result_name, rank_el)

    let card = new WRCard([title], true)
    preview.append(card)

    results_box = document.createElement('div')
    preview.append(results_box)

    // add filter for teams
    let avail_teams = dal.team_numbers
    avail_teams.sort((a,b) => parseInt(a) - parseInt(b))
    avail_teams.unshift('All')
    team_filter = add_dropdown_filter(avail_teams, build_result_list)

    build_result_list()
    setup_picklists()
}

/**
 * Completes left select result pane with results.
 */
function build_result_list()
{
    // get selected team in filter
    let filter = team_filter.element.value

    // build list of options, sorted by match
    let options = {}
    let classes = {}
    for (let match_key of dal.match_keys)
    {
        if (selected_match.length === 0 || selected_match === match_key)
        {
            for (let team_num in dal.matches[match_key].results)
            {
                // TODO: support selecting based off of file name? from query
                if ((selected_team.length === 0 && (filter === 'All' || team_num.toString() === filter)) ||
                    team_num === selected_team)
                {
                    let result = dal.get_match_result(match_key, team_num)
                    let spaces = 5 - team_num.toString().length
                    let disp_team = team_num
                    for (let i = 0; i < spaces; i++)
                    {
                        disp_team = `&nbsp;${disp_team}`
                    }
                    options[`${match_key}-${team_num}`] = `${dal.matches[match_key].short_name} ${disp_team}`
                    classes[`${match_key}-${team_num}`] = result.unsure ? 'highlighted' : ''
                }
            }
        }
    }

    // populate list and open first option
    let first = populate_other(options, classes)
    if (first !== '')
    {
        open_option(first)
    }
}

/**
 * Calls open_option with the current result.
 */
function rebuild_result_list()
{
    let op = document.getElementsByClassName('selected')[0]
    open_option(op.id.replace('left_pit_option_', ''))
}

/**
 * Populates the body of the page for the selected result.
 * @param {String} option Selected result ID
 */
function open_option(option)
{
    // select the new option
    deselect_all()
    document.getElementById(`left_pit_option_${option}`).classList.add('selected')
    results_box.replaceChildren()

    // pull match and team out
    let parts = option.split('-')
    let match_key = parts[0]
    let team_num = parts[1].trim()

    // setup header
    avatar.src = dal.teams[team_num].avatar
    team_el.innerText = team_num
    name_el.innerText = dal.teams[team_num].name
    match_el.innerText = dal.matches[match_key].name
    let rank = dal.get_team_value(team_num, 'fms.rank')
    if (rank !== null)
    {
        rank_el.innerText = `Rank #${rank} (${dal.get_team_value(team_num, 'fms.sort_orders_0')} RP)`
    }

    let result = dal.get_match_result(match_key, team_num)
    for (let scout_mode in result.results)
    {
        for (let i in result.results[scout_mode])
        {
            add_result_card(scout_mode, result.results[scout_mode][i], result.meta[scout_mode][i])
        }
    }
}

/**
 * Builds a card and adds it to the page for the given scouting mode in the given result.
 * @param {String} scout_mode Scouting mode
 * @param {Object} match_result Match result for scouting mode
 * @param {Object} meta Match result metadata for scouting mode
 */
function add_result_card(scout_mode, match_result, meta)
{
    let config = cfg.get_scout_config(scout_mode)

    let result_name = document.createElement('h3')
    result_name.innerText = `${config.name} Result`

    let meta_tab = document.createElement('table')
    meta_tab.className = 'meta_table'
    let user_row = meta_tab.insertRow()
    user_row.append(create_header('Scouter'))
    user_row.insertCell().innerText = cfg.get_name(meta.scouter.user_id, true)
    let match_time_row = meta_tab.insertRow()
    match_time_row.append(create_header('Match Time'))
    let match_time = dal.matches[meta.result.match_key].time * 1000
    match_time_row.insertCell().innerText = new Date(match_time).toLocaleTimeString("en-US")
    let scout_time_row = meta_tab.insertRow()
    scout_time_row.append(create_header('Scout Time'))
    let scout_time = meta.scouter.start_time * 1000
    let delta_secs = (match_time - scout_time) / 1000
    let abs_secs = Math.abs(delta_secs)
    let delta = `${abs_secs.toFixed(0)} secs`
    if (abs_secs >= 60)
    {
        delta = `${(abs_secs / 60).toFixed(0)} mins`
    }
    scout_time_row.insertCell().innerText = `${new Date(scout_time).toLocaleTimeString("en-US")} (${delta} ${delta_secs > 0 ? 'early' : 'late'})`
    let ignore_box = document.createElement('input')
    ignore_box.type = 'checkbox'
    ignore_box.checked = meta.status.ignore
    // TODO: handle ignore box
    let ignore_row = meta_tab.insertRow()
    ignore_row.append(create_header('Ignored'))
    ignore_row.insertCell().append(ignore_box)
    let unsure_row = meta_tab.insertRow()
    unsure_row.append(create_header('Unsure'))
    unsure_row.insertCell().innerText = meta.status.unsure ? meta.status.unsure_reason : '-'

    let result_tab = document.createElement('table')
    for (let key in match_result)
    {
        let result = cfg.get_result_from_key(`result.${key}`)
        let row = result_tab.insertRow()
        row.append(create_header(result.name))
        row.insertCell().innerText = result.clean_value(match_result[key])
        row.insertCell().innerText = result.clean_value(dal.compute_stat(`result.${key}`, meta.result.team_num))
        row.insertCell().innerText = result.clean_value(dal.compute_stat(`result.${key}`))
    }

    let card = new WRCard([result_name, meta_tab, result_tab], true)
    results_box.append(card)
}