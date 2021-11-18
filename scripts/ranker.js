/**
 * file:        ranker.js
 * description: Contains functions for the team ranking page of the web app.
 *              Primarily for building the interface from results.
 * author:      Liam Fruzyna
 * date:        2020-03-13
 */

const SORT_OPTIONS = ['Mean', 'Median', 'Mode', 'Min', 'Max']

var keys = {}
var teams = {}
var stddevs = {}
var totals = []
var selected = ''
var meta = {}

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch results from localStorage. Initialize page contents.
 */
function init_page(contents_card, buttons_container)
{
    meta = get_result_meta(type, year)
    buttons_container.innerHTML = `<h4 class="center_text">Sort by key</h4>
        ${build_dropdown('key_selector', '', [], '', 'select()')}
        ${build_dropdown('key_selector_method', '', ['only', 'vs', 'out of'], '', 'select()')}
        ${build_dropdown('key_selector_against', '', [], '', 'select()')}<br>
        <h4 class="center_text">Sort numeric values</h4>
        ${build_select('type_form', '', SORT_OPTIONS, 'Mean', 'collect_results(); select()')}
        ${build_checkbox('reverse', 'Reverse Order', false, 'select()')}
        ${build_link_button('save', 'Save to Pick List', 'save_pick_list()')}`

    if (collect_results() > 0)
    {
        contents_card.innerHTML = '<h2 id="value"></h2>'
        fill_dropdown()
        selected = Object.keys(teams)[0]
        select()
        setup_picklists()
    }
    else
    {
        contents_card.innerHTML = '<h2>No Results Found</h2>'
    }
}

/**
 * function:    count_options
 * parameters:  results container, column to sum
 * returns:     count of individual options
 * description: Count all the options for a given column.
 */
function count_options(results, key)
{
    let counts = {}
    switch (meta[key].type)
    {
        // compute mode for non-numerics
        case 'select':
        case 'dropdown':
        case 'checkbox':
            Object.keys(results).forEach(function (name, index)
            {
                if (Object.keys(results[name]).includes(key))
                {
                    let val = results[name][key]
                    // increase count of value if it exists already
                    if (Object.keys(counts).includes(val.toString())) counts[val]++
                    // start count of value if it has not been added yet
                    else counts[val] = 1
                }
            })
    }
    return counts
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
            unsorted[file] = JSON.parse(localStorage.getItem(file))
        }
    })

    let num_results = Object.keys(unsorted).length
    if (num_results == 0)
    {
        return 0
    }

    keys = get_keys(meta).filter(key => !['string', 'text', 'unknown'].includes(meta[key].type))
    keys.forEach(function (key, index)
    {
        totals[key] = avg_results(unsorted, key, meta[key].type, get_selected_option('type_form'))
        totals[`${key}_options`] = count_options(unsorted, key)
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
 * function:    save_pick_list
 * parameters:  none
 * returns:     none
 * description: Saves the current team rankings into a pick list, named by the sorting order.
 */
function save_pick_list()
{
    let lists = JSON.parse(localStorage.getItem(get_event_pick_lists_name(event_id)))
    let name = `${SORT_OPTIONS[get_selected_option('type_form')]} of ${document.getElementById('key_selector').value}`
    let against = document.getElementById('key_selector_against').value
    switch (document.getElementById('key_selector_method').selectedIndex)
    {
        // single stat
        case 0:
            break
        // vs
        case 1:
            name += ` vs ${against}`
            break
        // out of
        case 2:
            name += ` out of ${against}`
            break
    }
    if (document.getElementById('reverse').checked)
    {
        name += ' Reversed'
    }

    if (lists == null)
    {
        lists = {}
    }
    lists[name] = []
    Object.keys(teams).forEach(function (team, index)
    {
        lists[name].push(team)
    })

    // save to localStorage and open
    localStorage.setItem(get_event_pick_lists_name(event_id), JSON.stringify(lists))
    return build_url('selection', {'page': 'picklists', [EVENT_COOKIE]: event_id})
}

/**
 * function:    sort_teams
 * parameters:  key index to sort by
 * returns:     none
 * description: Sorts the teams by a given key.
 */
function sort_teams(index, method_index, against_index)
{
    let sort_by = keys[index]
    let sort_by_against = keys[against_index]
    let unsorted = teams
    teams = {}
    
    // sort by given key
    Object.keys(unsorted).sort(function (a, b) {
        let a_val = unsorted[a][sort_by]
        let b_val = unsorted[b][sort_by]
        let a_against_val = unsorted[a][sort_by_against]
        let b_against_val = unsorted[b][sort_by_against]
        a_val = calc_prop(a_val, a_against_val, method_index)
        b_val = calc_prop(b_val, b_against_val, method_index)
        let reverse = document.getElementById('reverse').checked
        if (meta[sort_by].negative ? !reverse : reverse) // Exclusive OR
        {
            let old = a_val
            a_val = b_val
            b_val = old
        }
        return b_val < a_val ? -1
                : b_val > a_val ? 1
                : 0
    }).forEach(function (key) {
        teams[key] = unsorted[key]
    })
}

/**
 * function:    select
 * parameters:  none
 * returns:     none
 * description: Responds to new key being selected by updating team order.
 */
function select()
{
    sort_teams(document.getElementById('key_selector').selectedIndex,
               document.getElementById('key_selector_method').selectedIndex,
               document.getElementById('key_selector_against').selectedIndex)
    
    let team_vals = {}
    for (let team of Object.keys(teams))
    {
        let select = document.getElementById('key_selector')
        let against = document.getElementById('key_selector_against')
        team_vals[team] = `${team}: ` +get_value(meta, keys[select.selectedIndex], calc_prop(teams[team][keys[select.selectedIndex]],
                                                                    teams[team][keys[against.selectedIndex]],
                                                                    document.getElementById('key_selector_method').selectedIndex))
    }
    populate_other(team_vals)
    open_option(selected)
    
    // force mode selected if non-numeric
    let select = document.getElementById('key_selector')
    switch (meta[keys[select.selectedIndex]].type)
    {
        // compute mode for non-numerics
        case 'checkbox':
        case 'select':
        case 'dropdown':
        case 'unknown':
            select_option('type_form', 2)
    }
}

/**
 * function:    calc_prop
 * parameters:  first value, second value, selected method index
 * returns:     calculated proportion
 * description: Calculate the proportion between the two provided values with the given method.
 */
function calc_prop(val, against_val, method)
{
    if (method == 1 && val != 0)
    {
        val /= val + against_val
    }
    else if (method == 2 && val != 0 && against_val != 0)
    {
        val /= against_val
    }
    return val
}

/**
 * function:    open_option
 * parameters:  team number
 * returns:     none
 * description: Updates the selected team.
 */
function open_option(team_num)
{
    selected = team_num
    let select = document.getElementById('key_selector')
    let against = document.getElementById('key_selector_against')
    let method = document.getElementById('key_selector_method').selectedIndex
    let val = teams[selected][keys[select.selectedIndex]]
    let against_val = teams[selected][keys[against.selectedIndex]]
    let key = keys[select.selectedIndex]
    let against_key = keys[against.selectedIndex]
    let overall = totals[keys[select.selectedIndex]]
    let against_overall = totals[keys[against.selectedIndex]]
    let options = totals[`${keys[select.selectedIndex]}_options`]
    let against_options = totals[`${keys[against.selectedIndex]}_options`]

    let stddev = ''
    let against_stddev = ''
    let type = meta[key].type
    if (get_selected_option('type_form') == 0 && typeof teams[selected][key] == 'number' && type != 'select' && type != 'dropdown')
    {
        stddev = ` <font size="-1">(${get_value(meta, key, stddevs[selected][keys[select.selectedIndex]])})</font>`
        against_stddev = ` <font size="-1">(${get_value(meta, key, stddevs[selected][keys[against.selectedIndex]])})</font>`
    }

    // team details
    let details = `<div id="result_title"><img id="avatar" src="${get_avatar(team_num, event_id.substr(0,4))}"> <h2 class="result_name"><span id="team_num">${team_num}</span> ${get_team_name(team_num, event_id)}</h2></div>`

    details += '<table style="margin:auto; text-align:left">'

    // populate ranking
    let rankings = get_team_rankings(team_num, event_id)
    if (rankings)
    {
        details += `<tr><td>Rank:</td><td>${rankings.rank} (${rankings.record.wins}-${rankings.record.losses}-${rankings.record.ties})</td></tr>`
    }
    details += `<tr><td>${meta[key].name}:</td><td>${get_value(meta, key, val)}${stddev}</td></tr>`

    // overall stats
    details += `<tr><td>Overall:</td><td>${get_value(meta, key, overall)}</td></tr>`
    if (options !== {})
    {
        Object.keys(options).forEach(function (option, index)
        {
            details += `<tr><td>${get_value(meta, key, option)}:</td><td>${options[option]}</td></tr>`
        })
    }

    // against stats
    if (method != 0)
    {
        document.getElementById('key_selector_against').style.display = 'inline-block'
        details += `<tr><td>${meta[against_key].name}:</td><td>${get_value(meta, against_key, against_val)}${against_stddev}</td></tr>`
    }
    else
    {
        document.getElementById('key_selector_against').style.display = 'none'
    }

    // against overall stats
    if (method != 0)
    {
        details += `<tr><td>Overall:</td><td>${get_value(meta, against_key, against_overall)}</td></tr>`
        if (against_options !== {})
        {
            Object.keys(against_options).forEach(function (option, index)
            {
                details += `<tr><td>${get_value(meta, key, option)}:</td><td>${against_options[option]}</td></tr>`
            })
        }
        details += `<tr><td>Proportion:</td><td>${get_value(meta, key, calc_prop(val, against_val, method))}</td></tr>`
    }
    details += '</table>'

    document.getElementById('value').innerHTML = details

    // select team on left
    Object.keys(teams).forEach(function (team, index)
    {
        if (document.getElementById(`option_${team}`).classList.contains('selected'))
        {
            document.getElementById(`option_${team}`).classList.remove('selected')
        }
    })
    document.getElementById(`option_${selected}`).classList.add('selected')
    ws(team_num)
}

/**
 * function:    fill_dropdown
 * parameters:  none
 * returns:     none
 * description: Populates key selection dropdown with all key names.
 */
function fill_dropdown()
{
    let options = ''
    keys.forEach(function (key, index)
    {
        let name = meta[key].name
        options += `<option class="wr_dropdown_op" value="${name}">${name}</option>`
    })
    document.getElementById('key_selector').innerHTML = options
    document.getElementById('key_selector_against').innerHTML = options
}