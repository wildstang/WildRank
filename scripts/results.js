/**
 * file:        results.js
 * description: Contains functions for the result selection page of the web app.
 *              Primarily for building the interface from results.
 * author:      Liam Fruzyna
 * date:        2020-02-26
 */

var teams = {}
var results = {}

var avail_teams = []

// read parameters from URL
const type = get_parameter(TYPE_COOKIE, TYPE_DEFAULT)
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const year = event_id.substr(0,4)
const prefix = `${type}-${event_id}-`
var urlParams = new URLSearchParams(window.location.search)
const selected = urlParams.get('file')

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch results from localStorage. Initialize page contents.
 */
function init_page(contents_card, buttons_container)
{
    if (type == NOTE_MODE)
    {
        load_config(MATCH_MODE, year)
    }
    else
    {
        load_config(type, year)
    }
    if (collect_results() > 0)
    {
        contents_card.innerHTML = `<div id="result_title"><img id="avatar"> <h2 id="result_name"></h2><h3 id="location"></h3><h3 id="ranking"></h3></div>
                                   <img id="photo">
                                   <table id="results_tab"></table>`
        buttons_container.innerHTML = ''
        if (type != PIT_MODE)
        {
            avail_teams = avail_teams.sort(function (a, b) { return parseInt(a) - parseInt(b) })
            avail_teams.unshift('All')
            document.getElementById('preview').innerHTML = `\
                ${build_page_frame('', [
                    build_column_frame('', [ build_dropdown('team_filter', 'Team:', avail_teams, 'All', 'build_result_list()') ])
                ], false)}<br>${document.getElementById('preview').innerHTML}`
        }
        build_result_list()
        setup_picklists()
    }
    else
    {
        contents_card.innerHTML = '<h2>No Results Found</h2>'
    }
}

/**
 * function:    open_option
 * parameters:  Selected result name
 * returns:     none
 * description: Completes right info pane for a given result.
 */
function open_option(name)
{
    document.getElementById(`option_${name}`).classList.add('selected')
    let files = Object.keys(results)
    files.forEach(function (file, index)
    {
        // determine files which start with the desired type
        if (document.getElementById(`option_${file}`) && file.startsWith(prefix) && file != name && document.getElementById(`option_${file}`).classList.contains('selected'))
        {
            document.getElementById(`option_${file}`).classList.remove('selected')
        }
    })

    let parts = name.split('-')
    let team = parseInt(parts[parts.length - 1])
    document.getElementById('avatar').src = get_avatar(team, event_id.substr(0, 4))
    document.getElementById('result_name').innerHTML = `<span id="team_num">${team}</span>: ${get_team_name(team, event_id)}`
    document.getElementById('location').innerHTML = get_team_location(team, event_id)

    // populate ranking
    let rankings = get_team_rankings(team, event_id)
    if (rankings)
    {
        document.getElementById('ranking').innerHTML = `Rank: ${rankings.rank} (${rankings.record.wins}-${rankings.record.losses}-${rankings.record.ties})`
    }

    let table = '<tr>'
    switch (type)
    {
        case NOTE_MODE:
            table += '<th>Match</th><th>Notes</th>'
            break
        case MATCH_MODE:
            table += '<th>Entry</th><th>Match Value</th><th>Team Average</th><th>Match Average</th><th>Event Average</th><th>Scouter Average</th>'
            break
        case PIT_MODE:
            table += '<th>Entry</th><th>Pit Value</th><th>Event Average</th><th>Scouter Average</th>'
            break
    }
    table += '</tr><tr><th>Total Results</th><td>1</td>'

    use_cached_image(team, 'photo', '')

    switch (type)
    {
        case MATCH_MODE:
            let match = parseInt(parts[parts.length - 2])
            document.getElementById('result_name').innerHTML += `, Match #${match}`
            team_results = get_team_results(results, team)
            match_results = get_match_results(results, match)
            table += `<td>${Object.keys(team_results).length}</td><td>${Object.keys(match_results).length}</td>`
        case PIT_MODE:
            scouter_results = get_scouter_results(results, results[name]['meta_scouter_id'])
            table += `<td>${Object.keys(results).length}</td><td>${Object.keys(scouter_results).length}</td>`
        case NOTE_MODE:
            table += '</tr>'
    }

    let result = results[name]
    let entries = Object.keys(result)
    entries.forEach(function (entry, index)
    {
        let val = result[entry]
        table += `<tr><th id="${entry}" onclick="sort_results('${entry}'); build_result_list()">${get_name(entry)}</th><td class="result_cell">${get_value(entry, val)}</td>`
        if (typeof team_results !== 'undefined')
        {
            table += make_cell(team_results, entry, val)
        }
        if (typeof match_results !== 'undefined')
        {
            table += make_cell(match_results, entry, val)
        }
        if (type != NOTE_MODE)
        {
            table += make_cell(results, entry, val)
        }
        if (typeof scouter_results !== 'undefined')
        {
            table += make_cell(scouter_results, entry, val)
        }
        table += '</tr>'
    })
    document.getElementById('results_tab').innerHTML = table
    ws(team)
}

/**
 * function:    make_cell
 * parameters:  results to source from, entry to use, base value
 * returns:     formatted table cell
 * description: Produce a table cell and color appropriately.
 */
function make_cell(results, entry, base)
{
    let color = ''
    let val = avg_results(results, entry, 0)
    let valStr = get_value(entry, val)
    if (typeof base === 'number' && !entry.startsWith('meta'))
    {
        let delta = base - val
        if (is_negative(entry))
        {
            delta *= -1
        }
        let prop = Math.abs(delta / base) / 2
        if (delta > 0.01)
        {
            if (val === 0 || base === 0)
            {
                prop = val / 2
            }
            color = `style="background-color: rgba(0,255,0,${prop})"`
        }
        else if (delta < -0.01)
        {
            if (base === 0 || val === 0)
            {
                prop = val / 2
            }
            color = `style="background-color: rgba(255,0,0,${prop})"`
        }

        // add std dev if proper number
        let type = get_type(entry)
        if (type != 'select' && type != 'dropdown')
        {
            valStr += ` (${get_value(entry, avg_results(results, entry, 5))})`
        }
    }
    
    return `<td class="result_cell" ${color}>${valStr}</td>`
}

/**
 * function:    build_team_list
 * parameters:  none
 * returns:     none
 * description: Completes left select result pane with results.
 */
function build_result_list()
{
    let first = ''
    document.getElementById('option_list').innerHTML = ''
    Object.keys(results).forEach(function (file, index)
    {
        let label = file.substr(prefix.length).replace('-', ': ')
        let parts = label.split(': ')
        if (type == PIT_MODE || (document.getElementById('team_filter').value == 'All' || 
            parts[parts.length-1] == document.getElementById('team_filter').value))
        {
            if (first == '')
            {
                first = file
            }
            document.getElementById('option_list').innerHTML += build_option(file, '', label)
        }
    })
    if (selected !== null && selected != '')
    {
        first = selected
    }
    if (first != '')
    {
        open_option(first)
        scroll_to('option_list', `option_${first}`)
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
    files.forEach(function (file, index)
    {
        // determine files which start with the desired type
        if (file.startsWith(prefix))
        {
            unsorted[file] = JSON.parse(localStorage.getItem(file))
            if (unsorted[file].meta_scout_mode != PIT_MODE)
            {
                let team = unsorted[file].meta_team
                if (!avail_teams.includes(team))
                {
                    avail_teams.push(team)
                }
            }
        }
    })

    let num_results = Object.keys(unsorted).length
    if (num_results == 0)
    {
        return 0
    }

    // sort results
    Object.keys(unsorted).sort(function (a, b)
    { 
        return parseInt(a.split('-')[2]) - parseInt(b.split('-')[2])
    })
    .forEach(function (key)
    {
        results[key] = unsorted[key]
    })

    return num_results
}

/**
 * function:    sort_results
 * parameters:  key name to sort by
 * returns:     none
 * description: Sorts the results by a given key.
 */
function sort_results(sort_by)
{
    let unsorted = results
    results = {}
    
    // sort by given key
    Object.keys(unsorted).sort(function (a, b) {
        let left = unsorted[b][sort_by]
        let right = unsorted[a][sort_by]
        if (is_negative(sort_by))
        {
            right = unsorted[b][sort_by]
            left = unsorted[a][sort_by]
        }
        return left < right ? -1
                : left > right ? 1
                : 0
    }).forEach(function (key) {
        results[key] = unsorted[key]
    })
}