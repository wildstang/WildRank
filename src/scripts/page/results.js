/**
 * file:        results.js
 * description: Contains functions for the result selection page of the web app.
 *              Primarily for building the interface from results.
 * author:      Liam Fruzyna
 * date:        2020-02-26
 */

include('mini-picklists')
include('result-cards')

// read parameters from URL
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

    let card = new WRCard([title])
    preview.append(card)

    results_box = create_element('div', 'scouting-carousel', 'scouting-carousel')
    preview.append(results_box)

    // add filter for teams
    let avail_teams = dal.team_numbers
    avail_teams.sort((a,b) => parseInt(a) - parseInt(b))
    avail_teams.unshift('All')
    team_filter = add_dropdown_filter(avail_teams, build_result_list)

    enable_list(true, true)
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
    clear_list()

    // build list of options, sorted by match
    let first = ''
    for (let match_key of dal.match_keys)
    {
        if (selected_match.length === 0 || selected_match === match_key)
        {
            for (let team_num in dal.matches[match_key].results)
            {
                let result = dal.matches[match_key].results[team_num]
                if (((selected_team.length === 0 && (filter === 'All' || team_num.toString() === filter)) ||
                    team_num === selected_team) && Object.keys(result.results).length)
                {
                    let result = dal.get_match_result(match_key, team_num)
                    let spaces = 5 - team_num.toString().length
                    let disp_team = team_num
                    for (let i = 0; i < spaces; i++)
                    {
                        disp_team = `&nbsp;${disp_team}`
                    }

                    let id = `${match_key}-${team_num}`
                    let title = `${dal.matches[match_key].short_name} ${disp_team}`
                    if (first === '')
                    {
                        first = id
                    }
                    let op = new WROption(id, title)
                    if (result.unsure)
                    {
                        op.add_class('highlighted')
                    }
                    add_option(op)
                }
            }
        }
    }

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
    results_box.scrollTo(0, 0)

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
    add_all_results(result, cfg.match_scouting_modes, team_num, true)
}