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

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch results from localStorage. Initialize page contents.
 */
function init_page()
{
    contents_card.innerHTML = `<div id="result_title"><img id="avatar"> <h2 id="result_name"></h2><h3 id="location"></h3><h3 id="ranking"></h3></div>
                                <input type="checkbox" id="show_meta" onclick="rebuild_result_list()">Show Metadata</input>
                                <table id="results_tab"></table>`
    buttons_container.innerHTML = ''

    // add filter for teams
    let avail_teams = Object.keys(dal.teams)
    avail_teams.sort((a,b) => parseInt(a) - parseInt(b))
    avail_teams.unshift('All')
    add_dropdown_filter('team_filter', avail_teams, 'build_result_list()')

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
    let filter = document.getElementById('team_filter').value

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
            let spaces = 4 - team.length
            for (let i = 0; i < spaces; i++)
            {
                team = `&nbsp;${team}`
            }
            options[`${match}-${team}`] = `${dal.get_match_value(match, 'short_match_name')} ${team}`
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
    open_option(op.id.replace('option_', ''))
}

/**
 * function:    open_option
 * parameters:  selected option
 * returns:     none
 * description: Selects the given option and populate the page.
 */
function open_option(option)
{
    // remove &nbsp; from string, which is automatically done when put in HTML
    // so basically only for the automatically opened first option
    option = option.replace(/&nbsp;/g, '\xa0')

    // select the new option
    deselect_all()
    document.getElementById(`option_${option}`).classList.add('selected')

    // pull match and team out
    let parts = option.split('-')
    let match = parts[0]
    let team = parts[1].trim()
    let result = dal.teams[team].results.filter(r => r.meta_match_key === match)[0]

    // setup header
    document.getElementById('avatar').src = dal.get_value(team, 'pictures.avatar')
    document.getElementById('result_name').innerHTML = `<span id="team_num">${team}</span>: ${dal.get_value(team, 'meta.name')}, ${dal.get_match_value(match, 'match_name')}`
    document.getElementById('location').innerHTML = `${dal.get_value(team, 'meta.city')}, ${dal.get_value(team, 'meta.state_prov')}, ${dal.get_value(team, 'meta.country')}`
    document.getElementById('ranking').innerHTML = dal.get_rank_str(team)

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
    let table = '<table><tr><th></th><th>Match Value</th></tr>'
    let keys = Object.keys(result)
    if (!document.getElementById('show_meta').checked)
    {
        keys = keys.filter(k => !k.startsWith('meta_'))
    }
    for (let key of keys)
    {
        let name = dal.fill_team_numbers(dal.get_name('stats.' + key, ''), alliances)
        table += `<tr><th>${name}</th><td>${dal.get_result_value(team, match, key, true)}</td></tr>`
    }
    table += '</table>'
    document.getElementById('results_tab').innerHTML = table
}