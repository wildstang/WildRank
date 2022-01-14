/**
 * file:        sides.js
 * description: Contains functions for the side-by-side comparison page of the web app.
 *              Primarily for building the interface from results.
 * author:      Liam Fruzyna
 * date:        2020-05-24
 */

const SORT_OPTIONS = ['Mean', 'Median', 'Mode', 'Min', 'Max']

var meta = {}
var keys = {}
var teams = {}
var maxs = []
var stddevs = {}
var selectedA = ''
var selectedB = ''
var selecting = 'a'

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch simple event matches from localStorage. Initialize page contents.
 */
function init_page(contents_card, buttons_container)
{
    meta = get_result_meta(type, year)
    buttons_container.innerHTML = `<br>
        ${build_page_frame('', [
            build_column_frame('', [ build_select('type_form', 'Sort numeric results by', SORT_OPTIONS, 'Mean', 'collect_results(); open_teams()') ]),
            build_column_frame('', [ build_select('scale_max', 'Use maximum of', ['Pair', 'All Teams'], 'Pair', 'open_teams()') ])
        ], false)}<br>
        <div class="column"><center><div class="wr_card"><table id="results_tab" style="text-align:center"></table></div></center></div>`
    
    let [first, second] = populate_teams(false, false, true)
    if (first)
    {
        if (collect_results() > 0)
        {
            contents_card.innerHTML = '<h2 id="value"></h2>'
            selectedA = first
            selectedB = second
            open_teams()
        }
        else
        {
            contents_card.innerHTML = '<h2>No Results Found</h2>'
        }
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
    let files = Object.keys(localStorage)
    for (let file of files)
    {
        // determine files which start with the desired type
        if (file.startsWith(prefix))
        {
            let parts = file.split('-')
            let team = parts[parts.length - 1]
            if (!Object.keys(teams).includes(team))
            {
                teams[team] = {}
                stddevs[team] = {}
            }
            unsorted[file] = add_smart_stats(JSON.parse(localStorage.getItem(file)), year)
        }
    }

    let num_results = Object.keys(unsorted).length
    if (num_results == 0)
    {
        return 0
    }

    keys = get_keys(meta).filter(key => !['string', 'text', 'unknown'].includes(meta[key].type))
    // calculate max for each value
    for (let key of keys)
    {
        maxs[key] = avg_results(unsorted, key, meta[key].type, 4)
    }
    let tkeys = Object.keys(teams)
    for (let team of tkeys)
    {
        let team_results = get_team_results(unsorted, team)
        for (let key of keys)
        {
            let type = meta[key].type

            teams[team][key] = avg_results(team_results, key, type, get_selected_option('type_form'), meta[key].options)
            stddevs[team][key] = avg_results(team_results, key, type, 5)
        }
    }

    return num_results
}

/**
 * function:    open_option
 * parameters:  team number
 * returns:     none
 * description: Updates the selected team for the left.
 */
function open_option(team_num)
{
    selectedA = team_num
    open_teams()
}

/**
 * function:    open_secondary_option
 * parameters:  team number
 * returns:     none
 * description: Updates the selected team for the right.
 */
function open_secondary_option(team_num)
{
    selectedB = team_num
    open_teams()
}

/**
 * function:    open_teams
 * parameters:  team numbers
 * returns:     none
 * description: Updates the selected teams.
 */
function open_teams()
{
    if (!selectedB)
    {
        alert('Not enough teams available')
    }

    // populate ranking
    let rankingA = get_team_rankings(selectedA, event_id)
    let rankingB = get_team_rankings(selectedB, event_id)
    let rankA = rankingA ? `Rank: ${rankingA.rank} (${rankingA.record.wins}-${rankingA.record.losses}-${rankingA.record.ties})<br>` : ''
    let rankB = rankingB ? `Rank: ${rankingB.rank} (${rankingB.record.wins}-${rankingB.record.losses}-${rankingB.record.ties})<br>` : ''

    // team details
    let details = `<div id="result_title"><img id="avatar" src="${get_avatar(selectedA, event_id.substr(0,4))}"> <h2 class="result_name">${selectedA} ${get_team_name(selectedA, event_id)}</h2><br>${rankA}</div> vs
        <div id="result_title"><img id="avatar" src="${get_avatar(selectedB, event_id.substr(0,4))}"> <h2 class="result_name">${selectedB} ${get_team_name(selectedB, event_id)}</h2><br>${rankB}</div>`
    details += '<img id="photoA" alt="No image available"></img><img id="photoB" alt="No image available"></img>'

    document.getElementById('value').innerHTML = details
    use_cached_image(selectedA, 'photoA', 'full_res')
    use_cached_image(selectedB, 'photoB', 'full_res')

    let compare = `<tr><th>Key</th><th>${selectedA}</th><th>${selectedB}</th><th>Max</th></tr>`
    for (let key of keys)
    {
        let aVal = teams[selectedA][key]
        let bVal = teams[selectedB][key]

        if (typeof teams[selectedA][key] == 'object')
        {
            let aSum = Object.values(aVal).reduce((a, b) => a + b, 0)
            let bSum = Object.values(bVal).reduce((a, b) => a + b, 0)
            for (let op of meta[key].options)
            {
                let aPct = 100 * aVal[op] / aSum
                let bPct = 100 * bVal[op] / bSum
                compare += build_row(key, aPct, bPct, op)
            }
        }
        else
        {
            compare += build_row(key, get_value(meta, key, aVal), get_value(meta, key, bVal))
        }
    }

    document.getElementById('results_tab').innerHTML = compare

    // select team on left
    deselect_all()
    deselect_all(false)
    document.getElementById(`option_${selectedA}`).classList.add('selected')
    document.getElementById(`soption_${selectedB}`).classList.add('selected')
}

/**
 * function:    build_row
 * parameters:  row key, first team value, second team value, additional row label
 * returns:     HTML table row as string
 * description: Builds a single row of the comparison table.
 */
function build_row(key, aVal, bVal, label='')
{
    // prep numbers
    if (typeof aVal !== 'number')
    {
        aVal = parseFloat(aVal)
    }
    if (typeof bVal !== 'number')
    {
        bVal = parseFloat(bVal)
    }

    // get max
    let max = Math.max(aVal, bVal)
    if (get_selected_option('scale_max') === 1)
    {
        max = Math.max(...Object.keys(teams).map(t => parseFloat(teams[t][key])))
        if (label !== '')
        {
            let pcts = Object.keys(teams).map(function (t)
            {
                return 100 * teams[t][key][label.toString()] / Object.values(teams[t][key]).reduce((a, b) => a + b, 0)
            })
            max = Math.max(...pcts)
        }
    }

    // determine colors
    let aColor = 'black'
    let bColor = 'black'
    if (aVal > bVal)
    {
        aColor = 'var(--green-alliance-color)'
        bColor = 'var(--red-alliance-color)'
    }
    else if (aVal < bVal)
    {
        aColor = 'var(--red-alliance-color)'
        bColor = 'var(--green-alliance-color)'
    }
    // flip colors if negative (TODO handle discrete inputs better)
    if ((Array.isArray(meta[key].negative) && meta[key].negative[meta[key].options.indexOf(label)]) || 
        (meta[key].type == 'checkbox' && meta[key].negative ? label === true : label === false) ||
        (meta[key].negative && !Array.isArray(meta[key].negative)))
    {
        colorA = aColor
        aColor = bColor
        bColor = colorA
    }

    // make numbers pretty
    aVal = aVal.toFixed(1)
    bVal = bVal.toFixed(1)
    max  = max.toFixed(1)
    if (label !== '')
    {
        aVal += '%'
        bVal += '%'
        max  += '%'
    }

    // replace boolean labels
    if (label === false)
    {
        label = 'Not'
    }
    else if (label === true)
    {
        label = ''
    }

    return `<tr><th>${meta[key].name} ${label}</th><td style="color:${aColor}">${aVal}</td><td style="color:${bColor}">${bVal}</td><td>${max}</td></tr>`
}