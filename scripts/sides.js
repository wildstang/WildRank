/**
 * file:        sides.js
 * description: Contains functions for the side-by-side comparison page of the web app.
 *              Primarily for building the interface from results.
 * author:      Liam Fruzyna
 * date:        2020-05-24
 */

const SORT_OPTIONS = ['Mean', 'Median', 'Mode', 'Min', 'Max', 'Total']

var selectedA = ''
var selectedB = ''

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch simple event matches from localStorage. Initialize page contents.
 */
function init_page()
{
    let type_form = new Select('type_form', 'Sort numeric resuts by', SORT_OPTIONS, 'Mean')
    type_form.on_change = 'open_both_teams()'

    let scale_max = new Select('scale_max', 'Use maximum of', ['Pair', 'All Teams'], 'Pair')
    scale_max.on_change = 'open_both_teams()'

    let page = new PageFrame('', '', [
        new ColumnFrame('', '', [type_form]),
        new ColumnFrame('', '', [scale_max])
    ])
    buttons_container.innerHTML = `<br>${page.toString}<br>
        <div class="column"><center><div class="wr_card"><table id="results_tab" style="text-align:center"></table></div></center></div>`
    
    let [first, second] = populate_teams(false, false, true)
    if (first)
    {
        contents_card.innerHTML = '<h2 id="value"></h2>'
        selectedA = first
        selectedB = second
        open_both_teams()
    }
    else
    {
        contents_card.innerHTML = '<h2>No Results Found</h2>'
    }
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
    open_both_teams()
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
    open_both_teams()
}

/**
 * function:    open_both_teams
 * parameters:  team numbers
 * returns:     none
 * description: Updates the selected teams.
 */
function open_both_teams()
{
    if (!selectedB)
    {
        alert('Not enough teams available')
    }

    // select teams
    deselect_all()
    deselect_all(false)
    document.getElementById(`option_${selectedA}`).classList.add('selected')
    document.getElementById(`soption_${selectedB}`).classList.add('selected')

    // populate ranking
    let rankA = `${dal.get_rank_str(selectedA)}<br>`
    let rankB = `${dal.get_rank_str(selectedB)}<br>`

    // team details
    let details = `<div id="result_title"><img id="avatar" src="${dal.get_value(selectedA, 'pictures.avatar')}"> <h2 class="result_name">${selectedA} ${dal.get_value(selectedA, 'meta.name')}</h2><br>${rankA}</div> vs
        <div id="result_title"><img id="avatar" src="${dal.get_value(selectedB, 'pictures.avatar')}"> <h2 class="result_name">${selectedB} ${dal.get_value(selectedB, 'meta.name')}</h2><br>${rankB}</div>`

    document.getElementById('value').innerHTML = details

    let compare = `<tr><th>Key</th><th>${selectedA}</th><th>${selectedB}</th><th>Max</th></tr>`
    let keys = dal.get_keys(true, true, true, false)
    let type = SORT_OPTIONS[Select.get_selected_option('type_form')]
    for (let key of keys)
    {
        let aVal = dal.get_value(selectedA, key, type)
        let bVal = dal.get_value(selectedB, key, type)

        if (typeof aVal === 'object')
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
            compare += build_row(key, aVal, bVal)
        }
    }

    document.getElementById('results_tab').innerHTML = compare
}

/**
 * function:    build_row
 * parameters:  row key, first team value, second team value, additional row label
 * returns:     HTML table row as string
 * description: Builds a single row of the comparison table.
 */
function build_row(key, aVal, bVal, label='')
{
    // get max
    let max = Math.max(aVal, bVal)
    if (Select.get_selected_option('scale_max') === 1)
    {
        let global = dal.compute_global_stats([key], Object.keys(dal.teams))
        max = dal.get_global_value(global, key, 'max')
        if (label !== '')
        {
            let pcts = Object.keys(teams).map(function (t)
            {
                return 100 * teams[t][key][label.toString()] / Object.values(teams[t][key]).reduce((a, b) => a + b, 0)
            })
            max = Math.max(...pcts)
        }
    }
    if (isNaN(max))
    {
        max = '---'
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
    if ((Array.isArray(dal.meta[key].negative) && dal.meta[key].negative[dal.meta[key].options.indexOf(label)]) || 
        (dal.meta[key].type == 'checkbox' && dal.meta[key].negative ? label === true : label === false) ||
        (dal.meta[key].negative && !Array.isArray(dal.meta[key].negative)))
    {
        colorA = aColor
        aColor = bColor
        bColor = colorA
    }

    // make numbers pretty
    if (typeof aVal === 'number')
    {
        aVal = aVal.toFixed(1)
    }
    if (typeof bVal === 'number')
    {
        bVal = bVal.toFixed(1)
    }
    if (typeof max === 'number')
    {
        max = max.toFixed(1)
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

    return `<tr><th>${dal.get_name(key)} ${label}</th><td style="color:${aColor}">${aVal}</td><td style="color:${bColor}">${bVal}</td><td>${max}</td></tr>`
}