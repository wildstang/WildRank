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
const selected = urlParams.get('file')

var avatar, result_name, team_el, name_el, match_el, loc, rank, results_tab, show_meta, team_filter

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch results from localStorage. Initialize page contents.
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
    loc = document.createElement('h3')
    rank = document.createElement('h3')
    title.append(avatar, ' ', result_name, loc, rank)

    let label = document.createElement('label')
    show_meta = create_element('input', 'show_meta')
    show_meta.type = 'checkbox'
    show_meta.onclick = (event) => rebuild_result_list()
    label.append(show_meta, 'Show Metadata')

    results_tab = create_element('table', 'results_tab')
    let card = new WRCard([title, label, results_tab])
    preview.append(card)

    // add filter for teams
    let avail_teams = Object.keys(dal.teams)
    avail_teams.sort((a,b) => parseInt(a) - parseInt(b))
    avail_teams.unshift('All')
    team_filter = add_dropdown_filter(avail_teams, build_result_list)

    build_result_list()
    setup_picklists()
}

/**
 * function:    build_team_list
 * parameters:  none
 * returns:     none
 * description: Completes left select result pane with results.
 */
function build_result_list()
{
    let results = dal.get_results()

    // get selected team in filter
    let filter = team_filter.element.value

    // build list of options, sorted by match
    let options = {}
    let classes = {}
    for (let result of results)
    {
        let team = result.meta_team
        let match = result.meta_match_key
        if (((selected === '' || selected === null) || `${match}-${result.meta_team}` === selected) &&
            (filter === 'All' || team.toString() === filter))
        {
            let spaces = 4 - team.toString().length
            let disp_team = team
            for (let i = 0; i < spaces; i++)
            {
                disp_team = `&nbsp;${disp_team}`
            }
            options[`${match}-${team}`] = `${dal.get_match_value(match, 'short_match_name')} ${disp_team}`
            classes[`${match}-${team}`] = dal.get_result_value(team, match, 'meta_unsure') ? 'highlighted' : ''
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
 * function:    rebuild_team_list
 * parameters:  none
 * returns:     none
 * description: Calls open_option with the current result.
 */
function rebuild_result_list()
{
    let op = document.getElementsByClassName('selected')[0]
    open_option(op.id.replace('left_pit_option_', ''))
}

/**
 * function:    open_option
 * parameters:  selected option
 * returns:     none
 * description: Selects the given option and populate the page.
 */
function open_option(option)
{
    // select the new option
    deselect_all()
    document.getElementById(`left_pit_option_${option}`).classList.add('selected')

    // pull match and team out
    let parts = option.split('-')
    let match = parts[0]
    let team = parts[1].trim()
    let result = dal.teams[team].results.filter(r => r.meta_match_key === match)[0]

    // highlight config mismatches with red text
    let version = dal.get_result_value(team, match, 'meta_config_version', true)
    let color = 'black'
    if (version !== '' && version !== cfg.version)
    {
        color = 'red'
    }
    result_name.style.color = color

    // setup header
    avatar.src = dal.get_value(team, 'pictures.avatar')
    team_el.innerText = team
    name_el.innerText = dal.get_value(team, 'meta.name')
    match_el.innerText = dal.get_match_value(match, 'match_name')
    loc.innerText = `${dal.get_value(team, 'meta.city')}, ${dal.get_value(team, 'meta.state_prov')}, ${dal.get_value(team, 'meta.country')}`
    rank.innerText = dal.get_rank_str(team)

    // build a list of opponents to prepare for replacing opponentX in names TODO?
    let red = dal.matches[match].red_alliance
    let blue = dal.matches[match].blue_alliance
    let opponents = []
    if (red.includes(team))
    {
        opponents = blue
    }
    else if (blue.includes(team))
    {
        opponents = red
    }

    let alliances = dal.build_relative_alliances(team, match)
    results_tab.replaceChildren()
    results_tab.append(create_header_row(['', 'Match Value']))
    let keys = Object.keys(result)
    if (!show_meta.checked)
    {
        keys = keys.filter(k => !k.startsWith('meta_'))
    }
    for (let key of keys)
    {
        let name = dal.fill_team_numbers(dal.get_name('stats.' + key, ''), alliances)
        let row = results_tab.insertRow()
        row.append(create_header(name))
        row.insertCell().innerHTML = dal.get_result_value(team, match, key, true)
    }
}