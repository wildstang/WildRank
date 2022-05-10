/**
 * file:        results.js
 * description: Contains functions for the result selection page of the web app.
 *              Primarily for building the interface from results.
 * author:      Liam Fruzyna
 * date:        2020-02-26
 */

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
    let options = []
    for (let result of results)
    {
        let team = result.meta_team
        if (((selected === '' || selected === null) || `${result.meta_match_key}-${result.meta_team}` === selected) &&
            (filter === 'All' || team.toString() === filter))
        {
            let spaces = 4 - team.length
            for (let i = 0; i < spaces; i++)
            {
                team = `&nbsp;${team}`
            }
            options.push(`${result.meta_match} ${team}`)
        }
    }

    // populate list and open first option
    let first = populate_other(options)
    if (first !== '')
    {
        open_option(first)
    }
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
    let parts = option.split(' ')
    let match = parts[0]
    let team = parts[1].trim()
    let result = dal.teams[team].results.filter(r => r.meta_match === parseInt(match))[0]

    // setup header
    document.getElementById('avatar').src = get_avatar(team, event_id.substr(0, 4))
    document.getElementById('result_name').innerHTML = `<span id="team_num">${team}</span>: ${dal.teams[team].meta.name}, Match #${match}`
    document.getElementById('location').innerHTML = `${dal.teams[team].meta.city}, ${dal.teams[team].meta.state_prov}, ${dal.teams[team].meta.country}`
    document.getElementById('ranking').innerHTML = `Rank: ${dal.teams[team].rank.rank} (${dal.teams[team].rank.ranking_score}, ${dal.teams[team].rank.wins}-${dal.teams[team].rank.losses}-${dal.teams[team].rank.ties})`

    let table = '<table><tr><th></th><th>Match Value</th></tr>'
    let keys = Object.keys(result)
    for (let key of keys)
    {
        table += `<tr><th>${dal.get_name('stats.' + key, '')}</th><td>${get_value(result, key)}</td></tr>`
    }
    table += '</table>'
    document.getElementById('results_tab').innerHTML = table
}

function get_value(result, key)
{
    let meta = dal.meta['results.' + key]
    let val = result[key]
    // map to option if available
    if (typeof meta !== 'undefined' && typeof val === 'number' && meta.options && val < meta.options.length && (meta.type === 'dropdown' || meta.type === 'select'))
    {
        return meta.options[val]
    }
    // map numbers to 2 decimal places if they are at least that
    else if (typeof val === 'number' && val % 1 !== 0)
    {
        return val.toFixed(2)
    }
    // map booleans to Yes/No
    else if (typeof val === 'boolean')
    {
        return val ? 'Yes' : 'No'
    }
    else if (typeof meta !== 'undefined' && meta.cycle === true)
    {
        return ''
    }
    return val
}