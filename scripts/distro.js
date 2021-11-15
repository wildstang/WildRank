/**
 * file:        distro.js
 * description: Contains functions for the result distribution page of the web app.
 *              Primarily for building the interface from results.
 * author:      Liam Fruzyna
 * date:        2021-10-17
 */

const SORT_OPTIONS = ['Mean', 'Median', 'Mode', 'Min', 'Max']

var teams = []
var results = {}
var lists = {}

var pwidth
var pheight

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch simple event matches from localStorage. Initialize page contents.
 */
function init_page(contents_card, buttons_container)
{
    contents_card.innerHTML = '<canvas id="whiteboard"></canvas>'
    buttons_container.innerHTML = build_column_frame('', [ build_select('type_form', 'Sort numeric results by', SORT_OPTIONS, 'Mean', 'build_plot()') ]) +
                                    build_column_frame('', [ build_num_entry('max_bins', 'Max Bins', 10, [], 'build_plot()') ])

    load_config(type, year)

    // load all event teams from localStorage
    let file_name = get_event_teams_name(event_id)
    if (file_exists(file_name))
    {
        results = get_results(prefix)
        
        teams = JSON.parse(localStorage.getItem(file_name)).map(team => team.team_number)
                    .filter(team => Object.keys(get_team_results(results, team)).length > 0)
        
        file_name = get_event_pick_lists_name(event_id)
        if (file_exists(file_name))
        {
            lists = JSON.parse(localStorage.getItem(file_name))

            // add select button above secondary list
            add_dropdown_filter('picklist_filter', ['None'].concat(Object.keys(lists)), 'filter_teams()', false)
        }
    
        // load keys from localStorage and build list
        let first = populate_keys(results, teams)
        if (first)
        {
            open_option(first)
            init_canvas()
        }
    }
}

/**
 * function:    init_canvas
 * parameters:  none
 * returns:     none
 * description: Setup plot canvas.
 */
function init_canvas()
{
    pwidth = preview.offsetWidth - 64
    pheight = window.innerHeight/2 - 64
    let canvas = document.getElementById('whiteboard')
    canvas.width = pwidth
    canvas.height = pheight
    build_plot()
}

/**
 * function:    open_option
 * parameters:  none
 * returns:     none
 * description: Selects teams based off the selected picklist.
 */
function filter_teams()
{
    let list = document.getElementById('picklist_filter').value
    if (Object.keys(lists).includes(list))
    {
        filter_by(lists[list], false)
    }

    init_canvas()
}

/**
 * function:    open_option
 * parameters:  Selected key
 * returns:     none
 * description: Selects and opens an option.
 */
function open_option(key)
{
    deselect_all(true)
    document.getElementById(`option_${key}`).classList.add('selected')

    build_plot()
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
    build_plot()
}

/**
 * function:    get_selected_keys
 * parameters:  none
 * returns:     array of selected keys
 * description: Builds an array of the currently selected keys.
 */
function get_selected_keys()
{
    return Array.prototype.filter.call(document.getElementsByClassName('pit_option selected'), item => item.id.startsWith('o')).map(item => item.id.replace('option_', ''))
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
 * function:    build_plot
 * parameters:  none
 * returns:     none
 * description: Plots the variable in the right pane.
 */
function build_plot()
{
    let key = get_selected_keys()[0]
    let type = get_type(key)
    let method = get_selected_option('type_form')

    // build distribution
    let values = []
    let team_vals = {}
    let team_modes = {}
    teams.forEach(function (team)
    {
        let team_results = get_team_results(results, team)
        // build a value string of percents for discrete inputs
        if (type == 'checkbox' || type == 'select' || type == 'dropdown')
        {
            let ops = get_options(key)
            if (type == 'checkbox')
            {
                ops = [false, true]
            }
            else
            {
                ops = ops.map((_, i) => i)
            }
            // add each count to a list to plot
            let counts = avg_results(team_results, key, method, ops)
            Object.values(counts).forEach(function (c, i)
            {
                for (let j = 0; j < c; ++j)
                {
                    values.push(i)
                }
            })
            // get mode for placing highlight
            let mode = avg_results(team_results, key, 2)
            // convert mode to numeric values
            if (type == 'checkbox')
            {
                mode = mode ? 1 : 0
            }
            team_vals[team] = counts
            team_modes[team] = mode
        }
        else
        {
            if (Object.keys(team_results).length > 0)
            {
                let val = avg_results(team_results, key, method)
                values.push(val)
                team_vals[team] = val
            }
        }
    })

    // bin math
    let max_bins = document.getElementById('max_bins').value
    let bins = max_bins
    let min = Math.min(...values)
    let max = Math.max(...values)
    let delta = max - min
    let bin_size = delta / bins

    // get unique values and find smallest delta between values
    let unique = [... new Set(values)]
    unique.sort((a, b) => a - b)
    let min_delta = delta
    unique.forEach(function(u, i)
    {
        if (i+1 < unique.length)
        {
            let udelta = unique[i+1] - u
            if (udelta < min_delta)
            {
                min_delta = udelta
            }
        }
    })

    // reduce bin size if possible
    if (delta / min_delta <= bins)
    {
        bins = delta / min_delta + 1
        bin_size = delta / bins
    }

    // calculate each bin
    let counts = []
    let bin_names = []
    for (let i = 0; i < bins; ++i)
    {
        // define bin
        let binStart = min + i * bin_size
        let binEnd = binStart + bin_size

        // count results in bin
        let count = values.filter(v => v >= binStart && (v < binEnd || i == bins - 1)).length
        counts.push(count)
        
        // build list of names
        // for discrete string results
        if (type == 'checkbox' || type == 'select' || type == 'dropdown')
        {
            bin_names.push(get_value(key, i))
        }
        // for discrete number results
        else if (unique.length <= max_bins)
        {
            bin_names.push(unique[i])
        }
        // for continuous number results
        else
        {
            bin_names.push(((binStart + binEnd) / 2).toFixed(2))
        }
    }

    // reset canvas
    var ctx = document.getElementById('whiteboard').getContext('2d')
    ctx.globalCompositeOperation = 'destination-over'
    ctx.clearRect(0, 0, pwidth, pheight)
    
    let width = (pwidth - 25) / bins;
    let font_size = 16
    
    // draw line to highlight teams
    let selected = 0
    get_secondary_selected_keys().forEach(function (highlight)
    {
        // check if selected and avoid invalid team numbers
        if (!isNaN(parseInt(highlight)))
        {
            ctx.beginPath()
            ctx.fillStyle = 'firebrick'
            ctx.font = `${font_size}px mono, courier`
            let raw_val = team_vals[highlight]
            let team_val = get_value(key, raw_val, false)
            let x = 25 + (team_val - min) / delta * (pwidth - 25)
            // fix values for line position
            if (team_modes.hasOwnProperty(highlight))
            {
                let vals = Object.values(raw_val)
                x = 25 + vals.map((v, i) => v * i).reduce((a, b) => a + b) / ((vals.length - 1) *vals.reduce((a, b) => a + b)) * (pwidth - 25)
                team_val = Object.keys(team_val).map(k => `${k}: ${team_val[k]}%`)
                raw_val = team_modes[highlight]
            }
            // handle non-numeric and low bin values
            else if (unique.length <= max_bins)
            {
                x = 25 + (unique.indexOf(raw_val) + 0.5) * width
            }
            ctx.fillRect(x, 0, 1, pheight-20)
            ctx.fillText(highlight, x + 5, font_size * (selected + 1))
            selected++
            if (typeof team_val !== 'string' && Array.isArray(team_val))
            {
                for (let t of team_val)
                {
                    ctx.fillText(t, x + 5, font_size * (selected + 1))
                    selected++
                }
            }
            else
            {
                ctx.fillText(team_val, x + 5, font_size * (selected + 1))
                selected++
            }
            selected++
            ctx.stroke()
        }
    })

    // draw each bin
    let maxBin = Math.max(...counts)
    let j = 0
    let neg = is_negative(key)
    for (let i = 0; i < bins; ++i)
    {
        let l = i
        if (neg)
        {
            l = bins - (i + 1)
        }
        let height = (counts[i] / maxBin) * (pheight - 25)
        ctx.beginPath()
        ctx.fillStyle = 'gray'
        ctx.font = `${font_size}px mono, courier`
        ctx.fillRect(25 + l * width, (pheight - 25) - height, width - 1, height)
        // draw labels
        if (counts[l] > 0 || unique.length >= counts.length)
        {
            let text_width = ctx.measureText(bin_names[j]).width
            ctx.fillText(bin_names[j], 25 + (l + 0.5) * width - text_width / 2, (pheight - 25 + font_size))
            ++j
        }
        ctx.fillText(counts[l], 0, (pheight - 25 + font_size) - height)
        ctx.stroke()
    }
}