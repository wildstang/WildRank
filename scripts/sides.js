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
            build_column_frame('', [ build_select('scale_max', 'Use maximum of', ['Pair', 'All Teams', 'No Bar'], 'Pair', 'open_teams()') ])
        ], false)}<br>
        <div class="column"><center><div class="wr_card"><table id="compare_tab"></table></div></center></div>`
    
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
    Object.keys(localStorage).forEach(function (file, index)
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
            unsorted[file] = add_smart_stats(JSON.parse(localStorage.getItem(file)))
        }
    })

    let num_results = Object.keys(unsorted).length
    if (num_results == 0)
    {
        return 0
    }

    keys = get_keys(meta).filter(key => !['string', 'text', 'unknown'].includes(meta[key].type))
    // calculate max for each value
    keys.forEach(function (key, index)
    {
        maxs[key] = avg_results(unsorted, key, meta[key].type, 4)
    })
    Object.keys(teams).forEach(function (team, index)
    {
        let team_results = get_team_results(unsorted, team)
        keys.forEach(function (key, index)
        {
            let type = meta[key].type
            teams[team][key] = avg_results(team_results, key, type, get_selected_option('type_form'))
            stddevs[team][key] = avg_results(team_results, key, type, 5)
        })
    })

    return num_results
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
            return 'var(--green-alliance-color)'
        case 0:
            return 'var(--blue-alliance-color)'
        case -1:
            return 'var(--red-alliance-color)'
    }
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

    let compare = `<tr><th>${selectedA}</th><th></th><th>${selectedB}</th></tr>`
    keys.forEach(function (key, index)
    {
        let aVal = get_value(meta, key, teams[selectedA][key])
        let bVal = get_value(meta, key, teams[selectedB][key])
        let aColor = 0
        let bColor = 0
        let aWidth = 250
        let bWidth = 250
        let type = meta[key].type
        let scale_max = get_selected_option('scale_max')

        if (typeof teams[selectedA][key] == 'number' && type != 'select' && type != 'dropdown')
        {
            let aFloat = parseFloat(aVal)
            let bFloat = parseFloat(bVal)
            // color and scale bars according to proportion
            if (aFloat > bFloat)
            {
                aColor = 1
                bColor = -1
                bWidth *= bFloat / aFloat
            }
            else if (aFloat < bFloat)
            {
                aColor = -1
                bColor = 1
                aWidth *= aFloat / bFloat
            }
            else if (aFloat == 0)
            {
                // if both values are 0, make bars short
                aWidth *= 0.1
                bWidth *= 0.1
            }

            if (scale_max == 1)
            {
                // override scaling if there is a known maximum
                let options = meta[key].options
                if (typeof options !== 'undefined' && options.length == 2)
                {
                    scale_to = parseFloat(options[1])
                }
                else
                {
                    scale_to = parseFloat(maxs[key])
                }
                aWidth = 250 * (aFloat / scale_to)
                bWidth = 250 * (bFloat / scale_to)
            }

            if (aVal.indexOf('.') < 2)
            {
                aVal = '&nbsp;' + aVal
            }
            if (bVal.indexOf('.') < 2)
            {
                bVal = '&nbsp;' + bVal
            }
            
            // only show std dev for means
            if (get_selected_option('type_form') == 0)
            {
                aVal += ` <font size="-1">(${get_value(meta, key, stddevs[selectedA][key])})</font>`
                bVal = `<font size="-1">(${get_value(meta, key, stddevs[selectedB][key])})</font> ` + bVal
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

        // bars disabled
        if (scale_max == 2)
        {
            scale_to = 0
            aWidth = 0
            bWidth = 0
        }

        // invert colors if attribute is negativve
        if (meta[key].negative)
        {
            aColor *= -1
            bColor *= -1
        }
        
        compare += `<tr><td><span style="float:left; padding-right: 16px">${aVal}</span>
            <span style="float:right; width:${aWidth}px; height:20px; background-color:${num2color(aColor)}"></span></td>
            <th>${meta[key].name}</th>
            <td><span style="float:right; padding-left: 16px">${bVal}</span>
            <span style="float:left; width:${bWidth}px; height:20px; background-color:${num2color(bColor)}"></span></td></tr>`
    })

    document.getElementById('compare_tab').innerHTML = compare

    // select team on left
    deselect_all()
    deselect_all(false)
    document.getElementById(`option_${selectedA}`).classList.add('selected')
    document.getElementById(`soption_${selectedB}`).classList.add('selected')
}