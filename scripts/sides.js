/**
 * file:        sides.js
 * description: Contains functions for the side-by-side comparison page of the web app.
 *              Primarily for building the interface from results.
 * author:      Liam Fruzyna
 * date:        2020-05-24
 */

const SORT_OPTIONS = ['Mean', 'Median', 'Mode', 'Min', 'Max']

var keys = {}
var teams = {}
var maxs = []
var selectedA = ''
var selectedB = ''
var selecting = 'a'

// read parameters from URL
const type = get_parameter(TYPE_COOKIE, TYPE_DEFAULT)
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const prefix = `${type}-${event_id}-`

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch simple event matches from localStorage. Initialize page contents.
 */
function init_page(contents_card, buttons_container)
{
    load_config(type)
    buttons_container.innerHTML = `<br>
        ${build_page_frame('', [
            build_column_frame('', [ build_select('type_form', 'Sort numeric values', SORT_OPTIONS, 'Mean', 'collect_results(); select()') ]),
            build_column_frame('', [ '<h4 class="input_label">Bars</h4>', build_checkbox('scale_max', 'Scale to Maximums', false, 'select()') ])
        ], false)}<br>
        <div class="wr_card"><table id="compare_tab"></table></div>`

    if (collect_results() > 0)
    {
        contents_card.innerHTML = '<h2 id="value"></h2>'
        selectedA = Object.keys(teams)[0]
        selectedB = Object.keys(teams)[1]
        select()
    }
    else
    {
        contents_card.innerHTML = '<h2>No Results Found</h2>'
    }
}

/**
 * function:    collect_results
 * parameters:  none
 * returns:     none
 * description: Collects all desired results from file, then add to screen.
 */
function collect_results()
{
    let unsorted = {}
    Object.keys(localStorage).forEach(function (file, index)
    {
        // determine files which start with the desired type
        if (file.startsWith(prefix))
        {
            let parts = file.split('-')
            let team = parts[parts.length - 1]
            if (!Object.keys(teams).includes(team))
            {
                teams[`#${team}`] = {}
            }
            unsorted[file] = JSON.parse(localStorage.getItem(file))
        }
    })

    let num_results = Object.keys(unsorted).length
    if (num_results == 0)
    {
        return 0
    }

    keys = Object.keys(unsorted[Object.keys(unsorted)[0]]).filter(key => !['string', 'text', 'unknown'].includes(get_type(key)))
    // calculate max for each value
    keys.forEach(function (key, index)
    {
        maxs[key] = avg_results(unsorted, key, 4)
    })
    Object.keys(teams).forEach(function (team, index)
    {
        let team_results = get_team_results(unsorted, team.substr(1))
        keys.forEach(function (key, index)
        {
            teams[team][key] = avg_results(team_results, key, get_selected_option('type_form'))
        })
    })

    return num_results
}

/**
 * function:    build_team_list
 * parameters:  none
 * returns:     none
 * description: Completes left select result pane with results.
 */
function build_team_list()
{
    let team_nums = Object.keys(teams)
    document.getElementById('option_list').innerHTML = build_select('selecting', '', ['Left', 'Right'], 'Left', 'switch_selecting()')
    team_nums.sort(function (a, b) { return parseInt(a.substr(1)) - parseInt(b.substr(1)) })
    team_nums.forEach(function (team, index)
    {
        document.getElementById('option_list').innerHTML += build_option(team, '', team.substr(1))
    })
}

/**
 * function:    switch_selecting
 * parameters:  none
 * returns:     none
 * description: Changes the team to be selecting.
 */
function switch_selecting()
{
    selecting = get_selected_option('selecting') == 0 ? 'a' : 'b'
}

/**
 * function:    select
 * parameters:  none
 * returns:     none
 * description: Responds to new key being selected by updating team order.
 */
function select()
{
    build_team_list()
    open_teams(selectedA, selectedB)
}

/**
 * function:    open_option
 * parameters:  team number
 * returns:     none
 * description: Updates a selected team.
 */
function open_option(team_num)
{
    if (selecting == 'a')
    {
        selectedA = team_num
    }
    else
    {
        selectedB = team_num
    }
    
    open_teams(selectedA, selectedB)
}

/**
 * function:    num2color
 * parameters:  color number
 * returns:     The color associated with the number
 * description: Converts 1/0/-1 to Green/Blue/Red.
 */
function num2color(num)
{
    switch (num)
    {
        case 1:
            return 'green'
        case 0:
            return 'blue'
        case -1:
            return 'red'
    }
}

/**
 * function:    open_teams
 * parameters:  team numbers
 * returns:     none
 * description: Updates the selected teams.
 */
function open_teams(team_numA, team_numB)
{
    selectedA = team_numA
    team_numA = selectedA.substr(1)
    selectedB = team_numB
    team_numB = selectedB.substr(1)

    // populate ranking
    let rankingA = get_team_rankings(team_numA, event_id)
    let rankingB = get_team_rankings(team_numB, event_id)
    let rankA = rankingA ? `Rank: ${rankingA.rank} (${rankingA.record.wins}-${rankingA.record.losses}-${rankingA.record.ties})<br>` : ''
    let rankB = rankingB ? `Rank: ${rankingB.rank} (${rankingB.record.wins}-${rankingB.record.losses}-${rankingB.record.ties})<br>` : ''

    // team details
    let details = `<div id="result_title"><img id="avatar" src="${get_avatar(team_numA, event_id.substr(0,4))}"> <h2 class="result_name">${team_numA} ${get_team_name(team_numA, event_id)}</h2><br>${rankA}</div> vs
        <div id="result_title"><img id="avatar" src="${get_avatar(team_numB, event_id.substr(0,4))}"> <h2 class="result_name">${team_numB} ${get_team_name(team_numB, event_id)}</h2><br>${rankB}</div>`
    details += '<img id="photoA" alt="No image available"></img><img id="photoB" alt="No image available"></img>'

    document.getElementById('value').innerHTML = details
    use_cached_image(team_numA, 'photoA', 'full_res')
    use_cached_image(team_numB, 'photoB', 'full_res')

    let compare = `<tr><th>${team_numA}</th><th></th><th>${team_numB}</th></tr>`
    keys.forEach(function (key, index)
    {
        let aVal = get_value(key, teams[selectedA][key])
        let bVal = get_value(key, teams[selectedB][key])
        let aColor = 0
        let bColor = 0
        let aWidth = 250
        let bWidth = 250
        let type = get_type(key)

        if (typeof teams[selectedA][key] == 'number' && type != 'select' && type != 'dropdown')
        {
            aVal = parseFloat(aVal)
            bVal = parseFloat(bVal)
            // color and scale bars according to proportion
            if (aVal > bVal)
            {
                aColor = 1
                bColor = -1
                bWidth *= bVal / aVal
            }
            else if (aVal < bVal)
            {
                aColor = -1
                bColor = 1
                aWidth *= aVal / bVal
            }
            else if (aVal == 0)
            {
                // if both values are 0, make bars short
                aWidth *= 0.1
                bWidth *= 0.1
            }

            if (document.getElementById('scale_max').checked)
            {
                // override scaling if there is a known maximum
                let options = get_options(key)
                if (typeof options !== 'undefined' && options.length == 2)
                {
                    scale_to = options[2]
                }
                else
                {
                    scale_to = maxs[key]
                }
                aWidth = 250 * (teams[selectedA][key] / scale_to)
                bWidth = 250 * (teams[selectedB][key] / scale_to)
            }
        }
        else if (typeof teams[selectedA][key] == 'boolean')
        {
            // colors Yes green and No red
            aColor = aVal == 'Yes' ? 1 : -1
            bColor = bVal == 'Yes' ? 1 : -1
        }
        // no bars for dropdowns
        else
        {
            aWidth = 0
            bWidth = 0
        }

        // invert colors if attribute is negativve
        if (is_negative(key))
        {
            aColor *= -1
            bColor *= -1
        }
        
        compare += `<tr><td><span style="float:left; padding-right: 16px">${aVal}</span>
            <span style="float:right; width:${aWidth}px; height:20px; background-color:${num2color(aColor)}"></span></td>
            <th>${get_name(key)}</th>
            <td><span style="float:right; padding-left: 16px">${bVal}</span>
            <span style="float:left; width:${bWidth}px; height:20px; background-color:${num2color(bColor)}"></span></td></tr>`
    })

    document.getElementById('compare_tab').innerHTML = compare

    // select team on left
    Object.keys(teams).forEach(function (team, index)
    {
        if (document.getElementById(`option_${team}`).classList.contains('selected'))
        {
            document.getElementById(`option_${team}`).classList.remove('selected')
        }
    })
    document.getElementById(`option_${selectedA}`).classList.add('selected')
    document.getElementById(`option_${selectedB}`).classList.add('selected')
}