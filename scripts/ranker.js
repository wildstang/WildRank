/**
 * file:        ranker.js
 * description: Selection page which sorts a list of teams based off a given smart stat criteria.
 *              Can also be used to build picklists and new smart stats.
 * author:      Liam Fruzyna
 * date:        2020-03-13
 *              2021-11-19
 */

const SORT_OPTIONS = ['Mean', 'Median', 'Mode', 'Min', 'Max']
const STAT_TYPES = ['Sum', 'Percent', 'Ratio', 'Where']

var results = {}
var meta = {}
var cycles = []
var lists = []
var team_order = []

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch results from localStorage. Initialize page contents.
 */
function init_page(contents_card, buttons_container)
{
    // get picklists if any
    let file_name = get_event_pick_lists_name(event_id)
    if (file_exists(file_name))
    {
        lists = JSON.parse(localStorage.getItem(file_name))

        add_dropdown_filter('picklist_filter', ['None'].concat(Object.keys(lists)), 'calculate()', true)
    }

    // gets results
    results = get_results(prefix, year)
    meta = get_result_meta(type, year)
    cycles = Object.keys(meta).filter(k => meta[k].type == 'cycle')

    // build static components
    buttons_container.innerHTML = build_page_frame('', [
        build_column_frame('', [ build_str_entry('name', 'Name', 'New Smart Stat'),
            build_select('type', 'Type', STAT_TYPES, 'Sum', 'update_params()'),
            '<div id="params"></div>'
        ]),
        build_column_frame('', [ build_button('save_stat', 'Save Stat to Config', 'save_stat()'),
            build_button('save_list', 'Save as Picklist', 'save_list()')
        ])
    ])
    contents_card.innerHTML = '<h2>Build a Smart Stat</h2>'

    // build dynamic components
    update_params()
}

/**
 * function:    filter_numeric
 * parameters:  key
 * returns:     none
 * description: Determines if a key results a result which is a number.
 */
function filter_numeric(key)
{
    let type = meta[key].type
    return meta[key].cycle == false && (type == 'number' || type == 'counter' || type == 'slider')
}

/**
 * function:    filter_cycle
 * parameters:  key
 * returns:     none
 * description: Determines if a key belongs to a cycle.
 */
function filter_cycle(key, cycle)
{
    let type = meta[key].type
    return (type == 'counter' || type == 'dropdown' || type == 'select') && meta[key].cycle == cycle
}

/**
 * function:    update_params
 * parameters:  none
 * returns:     none
 * description: Updates the inputs at the bottom of the page corresponding to the static inputs' values.
 */
function update_params()
{
    let type = STAT_TYPES[get_selected_option('type')]

    // add appropriate inputs for the selected type
    let html = ''
    switch (type)
    {
        case 'Sum':
            for (let c of Object.keys(meta).filter(filter_numeric))
            {
                html += build_checkbox(c, meta[c].name, false, 'calculate()')
            }
            break
        case 'Percent':
        case 'Ratio':
            let keys = Object.keys(meta).filter(filter_numeric).map(k => meta[k].name)
            html += build_dropdown('numerator', 'Numerator', keys, '', 'calculate()')
            html += build_dropdown('denominator', 'Denominator', keys, '', 'calculate()')
            break
        case 'Where':
            let cycle = cycles[0]
            if (document.getElementById('cycle'))
            {
                cycle = document.getElementById('cycle').value
            }
            let inputs = Object.keys(meta).filter(key => filter_cycle(key, cycle))
            let counters = inputs.filter(k => meta[k].type == 'counter').map(k => meta[k].name)
            let selects = inputs.filter(k => meta[k].type != 'counter')

            html += build_dropdown('cycle', 'Cycle', cycles, cycle, 'update_params()', '', 'The ID of the cycle you would like to count.')
            html += build_dropdown('count', 'Count', ['Count'].concat(counters), '', 'calculate()', '', 'The cycle-counter you would like to add up as part of the stat. "Count" means count matching cycles.')
            for (let s of selects)
            {
                html += build_dropdown(s, meta[s].name, [''].concat(meta[s].options), '', 'calculate()', '', 'Optional, choose value of the above select to filter cycles by.')
            }
            break
    }
    document.getElementById('params').innerHTML = html

    // always update the calculations on any change
    calculate()
}


/**
 * function:    build_stat
 * parameters:  none
 * returns:     smart stat object
 * description: Builds a smart stat object corresponding to the inputs selected on the page.
 */
function build_stat()
{
    // build core stat object
    let name = document.getElementById('name').value
    let id = name.toLowerCase().split(' ').join('_')
    let type = STAT_TYPES[get_selected_option('type')]
    let stat = {
        name: name,
        id: id,
        type: type.toLowerCase()
    }

    // fill out the stat object based on the type
    switch (type)
    {
        case 'Sum':
            let keys = []
            for (let c of Object.keys(meta).filter(filter_numeric))
            {
                if (document.getElementById(c).checked)
                {
                    keys.push(c)
                }
            }
            stat.keys = keys
            break
        case 'Percent':
        case 'Ratio':
            let ids = Object.keys(meta).filter(filter_numeric)
            let numerator = ids[document.getElementById('numerator').selectedIndex]
            let denominator = ids[document.getElementById('denominator').selectedIndex]
            stat.numerator = numerator
            stat.denominator = denominator
            break
        case 'Where':
            let cycle = document.getElementById('cycle').value
            let count = document.getElementById('count').selectedIndex
            let inputs = Object.keys(meta).filter(key => filter_cycle(key, cycle))
            let counters = inputs.filter(k => meta[k].type == 'counter')
            let selects = inputs.filter(k => meta[k].type != 'counter')
            let vals = {}
            for (let s of selects)
            {
                let val = document.getElementById(s).value
                if (val)
                {
                    vals[s] = val 
                }
            }
            stat.conditions = vals
            stat.cycle = cycle
            if (count != 0)
            {
                stat.sum = counters[count-1]
            }
            break
    }
    return stat
}

/**
 * function:    calculate
 * parameters:  none
 * returns:     none
 * description: Calculates each team's stat based on the current inputs.
 */
function calculate()
{
    let name = document.getElementById('name').value
    let id = name.toLowerCase().split(' ').join('_')
    let stat = build_stat()

    // filter teams
    let picklist = false
    if (lists.length > 0)
    {
        picklist = document.getElementById('picklist_filter').value
        if (!Object.keys(lists).includes(picklist))
        {
            picklist = false
        }    
    }

    // get team smart stat results
    let team_res = {}
    for (let res of Object.values(results))
    {
        if (!picklist || lists[picklist].includes(res.meta_team.toString()))
        {
            if (typeof team_res[res.meta_team] === 'undefined')
            {
                team_res[res.meta_team] = [] 
            }
            team_res[res.meta_team].push(add_given_smart_stats(res, [stat])[id])
        }
    }

    // average each set of team results
    let team_vals = {}
    for (let team of Object.keys(team_res))
    {
        team_vals[team] = mean(team_res[team])
    }
    
    // sort teams and populate left
    let teams = Object.keys(team_vals)
    teams.sort((a,b) => team_vals[b] - team_vals[a])
    team_order = [...teams]
    teams = teams.map(function (t, i)
    {
        let val = team_vals[t].toFixed(1)
        if (isNaN(val))
        {
            val = '0.0'
        }
        if (++i < 10)
        {
            i = `&nbsp;${i}`
        }
        if (t < 100)
        {
            t = `&nbsp;&nbsp;${t}`
        }
        else if (t < 1000)
        {
            t = `&nbsp;${t}`
        }
        return `${i} ${t} ${val}`
    })
    populate_other(teams)
}

/**
 * function:    save_stat
 * parameters:  none
 * returns:     none
 * description: Adds the current smart stat to the config for use in other pages.
 */
function save_stat()
{
    let stat = build_stat()
    let config = get_config('smart-stats')
    config[year].push(stat)
    localStorage.setItem('config-smart-stats', JSON.stringify(config))
}

/**
 * function:    save_list
 * parameters:  none
 * returns:     none
 * description: Saves the current order of teams as a picklist.
 */
function save_list()
{
    let file = get_event_pick_lists_name(event_id)
    let picklists = JSON.parse(localStorage.getItem(file))
    if (!picklists)
    {
        picklists = {}
    }
    let name = document.getElementById('name').value
    picklists[name] = team_order
    localStorage.setItem(file, JSON.stringify(picklists))
}