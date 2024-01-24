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

var results_tab, val_el

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

    let column = document.createElement('div')
    let center = document.createElement('center')
    results_tab = document.createElement('table')
    results_tab.style.textAlign = 'center'
    let card = new Card('res', results_tab)
    card.add_class('scalable_card')
    center.append(card.element)
    column.append(center)

    buttons_container.append(br(), page.element, br(), column)
    
    let [first, second] = populate_teams(false, false, true)
    if (first)
    {
        val_el = document.createElement('div')
        contents_card.append(val_el)
        selectedA = first
        selectedB = second
        open_both_teams()
    }
    else
    {
        let header = document.createElement('h2')
        header.innerText = 'No Results Found'
        contents_card.append(header)
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
 * function:    build_header
 * parameters:  team number
 * returns:     header HTML
 * description: Builds a header for the given team.
 */
function build_header(team)
{
    let header = document.createElement('div')
    header.className = 'result_title'
    let avatar = document.createElement('img')
    avatar.className = 'avatar'
    avatar.src = dal.get_value(team, 'pictures.avatar')
    let result = document.createElement('h1')
    result.className = 'result_name'
    result.innerText = `${team} ${dal.get_value(team, 'meta.name')}`
    let rank = document.createElement('div')
    rank.className = 'side_rank'
    rank.innerText = dal.get_rank_str(team)
    header.append(avatar, ' ', result, rank)
    return header
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
    document.getElementById(`pit_option_${selectedA}`).classList.add('selected')
    document.getElementById(`soption_${selectedB}`).classList.add('selected')

    let opponents = dal.find_matches([selectedA], [selectedB])
    let partners = dal.find_matches([selectedA, selectedB])

    // team details
    let summary = document.createElement('div')
    summary.append('Competed', br(), `Together ${partners.length} times`, br(), `Against ${opponents.length} times`, br())

    val_el.replaceChildren(build_header(selectedA), build_header(selectedB), summary)

    results_tab.replaceChildren()
    results_tab.insertRow().append(create_header('Key'), create_header(selectedA), create_header(selectedB), create_header('Max'))
    let keys = dal.get_keys(true, true, true, false)
    let type = SORT_OPTIONS[Select.get_selected_option('type_form')]
    for (let key of keys)
    {
        let aVal = dal.get_value(selectedA, key, type)
        let bVal = dal.get_value(selectedB, key, type)

        let placeholders = find_team_placeholders(key)
        if (placeholders.length > 0)
        {
            if (partners.length > 0 && placeholders.some(p => p[1] === 'partner'))
            {
                aVal = mean(partners.map(match => dal.get_result_value(selectedA, match, key)))
                bVal = mean(partners.map(match => dal.get_result_value(selectedB, match, key)))
            }
            else if (opponents.length > 0 && placeholders.some(p => p[1] === 'opponent'))
            {
                aVal = mean(opponents.map(match => dal.get_result_value(selectedA, match, key)))
                bVal = mean(opponents.map(match => dal.get_result_value(selectedB, match, key)))
            }
        }

        if (typeof aVal === 'object')
        {
            let aSum = Object.values(aVal).reduce((a, b) => a + b, 0)
            let bSum = Object.values(bVal).reduce((a, b) => a + b, 0)
            for (let op of meta[key].options)
            {
                let aPct = 100 * aVal[op] / aSum
                let bPct = 100 * bVal[op] / bSum
                build_row(key, aPct, bPct, op)
            }
        }
        else
        {
            build_row(key, aVal, bVal)
        }
    }
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
        // skip row if its a string
        return ''
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

    let row = results_tab.insertRow()
    row.append(create_header(dal.get_name(key)))
    let aCell = row.insertCell()
    aCell.innerText = aVal
    aCell.style.color = aColor
    let bCell = row.insertCell()
    bCell.innerText = bVal
    bCell.style.color = bColor
    row.insertCell().innerText = max
}