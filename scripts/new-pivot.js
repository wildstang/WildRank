/**
 * file:        new-pivot.js
 * description: Contains functions for the pivot table page of the web app.
 *              New because rewritten for DAL.
 * author:      Liam Fruzyna
 * date:        2022-04-28
 */

let selected_keys = []

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Assemble the structure of the page.
 */
function init_page()
{
    contents_card.innerHTML = '<table id="results_tab" style="position: relative"></table>'
    buttons_container.innerHTML = ''
    
    // add pick list filter
    add_dropdown_filter('picklist_filter', ['None'].concat(Object.keys(dal.picklists)), 'filter_teams()', false)
    add_dropdown_filter('stat_filter', ['All', 'Stats', 'Pit', 'Rank', 'Meta'], 'filter_stats()', true)

    // add select button above secondary list
    add_button_filter('select_toggle', '(De)Select All', 'toggle_select(false); select_none()', false)

    // build lists
    populate_keys(dal)
    select_all(false)
    build_table()
}

/**
 * function:    filter_teams
 * parameters:  none
 * returns:     none
 * description: Selects teams based off the selected picklist.
 */
function filter_teams()
{
    let list = document.getElementById('picklist_filter').value
    if (Object.keys(dal.picklists).includes(list))
    {
        filter_by(dal.picklists[list], false)
    }

    build_table()
}

/**
 * function:    filter_stats
 * parameters:  none
 * returns:     none
 * description: Selects stats based off the selected type.
 */
function filter_stats()
{
    let filter = document.getElementById('stat_filter').value.toLowerCase()
    let keys = dal.get_keys()
    for (let k of keys)
    {
        let element = document.getElementById(`option_${k}`)
        if (filter !== 'all' && !k.startsWith(filter) && !element.classList.contains('selected'))
        {
            element.style.display = 'none'
        }
        else
        {
            element.style.display = 'block'
        }
    }
}

/**
 * function:    open_option
 * parameters:  Selected key
 * returns:     none
 * description: Selects or unselects options then opens.
 */
function open_option(key, table=true)
{
    list_name = "Team Number"
    // select team button 
    if (document.getElementById(`option_${key}`).classList.contains('selected'))
    {
        document.getElementById(`option_${key}`).classList.remove('selected')
        selected_keys = selected_keys.filter(s => s != key)
    }
    else
    {
        document.getElementById(`option_${key}`).classList.add('selected')
        selected_keys.push(key)
    }

    if (table)
    {
        build_table()
    }
}

/**
 * function:    open_secondary_option
 * parameters:  Selected key
 * returns:     none
 * description: Selects and opens a secondary option.
 */
function open_secondary_option(key)
{
    let class_list = document.getElementById(`soption_${key}`).classList
    // select team button
    if (class_list.contains('selected'))
    {
        class_list.remove('selected')
    }
    else
    {
        class_list.add('selected')
    }

    select_none()
    build_table()
}

/**
 * function:    get_selected_keys
 * parameters:  none
 * returns:     array of selected keys
 * description: Builds an array of the currently selected keys.
 */
function get_selected_keys()
{
    let selected = []
    for(let key of selected_keys)
    {
        selected.push(key)
    }
    return selected
}

/**
 * function:    get_secondary_selected_keys
 * parameters:  none
 * returns:     array of selected keys
 * description: Builds an array of the currently selected keys.
 */
function get_secondary_selected_keys()
{
    return Array.prototype.filter.call(document.getElementsByClassName('pit_option selected'), item => item.id.startsWith('s')).map(item => item.id.replace('soption_', ''))
}

/**
 * function:    build_table
 * parameters:  key to sort by, whether to reverse all
 * returns:     none
 * description: Completes the center info pane with the selected options.
 */
function build_table(sort_by='', reverse=false)
{
    // get selected keys on either side
    let selected = get_selected_keys()
    let filter_teams = get_secondary_selected_keys()

    // sort teams based on parameters
    let type = 'mean'
    if (document.getElementById(`select_${sort_by}`))
    {
        type = document.getElementById(`select_${sort_by}`).value.toLowerCase()
    }
    filter_teams.sort((a,b) => dal.get_value(b, sort_by, type) - dal.get_value(a, sort_by, type))
    if (reverse)
    {
        filter_teams.reverse()
    }

    // compute totals
    let global_stats = dal.compute_global_stats(selected, filter_teams)

    // build table headers
    let table = `<table><tr><th onclick="build_table('', ${!reverse})">Team Number</th>`
    let types = '<tr><td></td>'
    let totals = '<tr><td></td>' 
    for (let key of selected)
    {
        // add key names
        table += `<th onclick="build_table('${key}', ${key == sort_by && !reverse})">${dal.get_name(key, '')}</th>`

        // determine previously selected stat
        type = 'Mean'
        if (document.getElementById(`select_${key}`))
        {
            type = document.getElementById(`select_${key}`).value
        }

        // build dropdown for those that have stats
        let fn = ''
        if (key.startsWith('stats.'))
        {
            let dropdown = new Dropdown(`select_${key}`, '', ['Mean', 'Median', 'Mode', 'Min', 'Max', 'Total'], type)
            dropdown.onchange = `build_table('${sort_by}', ${reverse})`
            dropdown.add_class('slim')
            dropdown.add_class('thin')
            fn = dropdown.toString
        }

        // build cells
        types += `<td>${fn}</td>`
        totals += `<td>${dal.get_global_value(global_stats, key, type.toLowerCase(), true)}</td>`
    }
    table += `</tr>${types}</tr>${totals}</tr>`

    // build team rows
    for (let team of filter_teams)
    {
        table += `<tr><td>${team}</td>`
        for (let key of selected)
        {
            // determine previously selected stat
            type = 'mean'
            if (document.getElementById(`select_${key}`))
            {
                type = document.getElementById(`select_${key}`).value.toLowerCase()
            }

            // compute color
            let color = ''
            let val = dal.get_value(team, key, type)
            let min = dal.get_global_value(global_stats, key, 'min')
            let max = dal.get_global_value(global_stats, key, 'max')
            let mean = dal.get_global_value(global_stats, key, 'mean')
            if (val !== mean)
            {
                let colors = [0,0,0,0]

                if (val > mean)
                {
                    colors = [0, 256, 0, (val - mean) / (max - mean) / 2]
                }
                else if (val < mean)
                {
                    colors = [256, 0, 0, (mean - val) / (mean - min) / 2]
                }

                if (dal.meta[key].negative === true)
                {
                    colors = [colors[1], colors[0], colors[2], colors[3]]
                }
                color = `style="background-color: rgba(${colors.join(',')}"`
            }

            // build cell
            table += `<td ${color}>${dal.get_value(team, key, type, true)}</td>`
        }
        table += '</tr>'
    }
    table += '</table>'

    document.getElementById('results_tab').innerHTML = table
}