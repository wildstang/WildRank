/**
 * file:        distro.js
 * description: Contains functions for the result distribution page of the web app.
 *              Primarily for building the interface from results.
 * author:      Liam Fruzyna
 * date:        2022-05-18
 */

const FUNCTIONS = ['Mean', 'Median', 'Mode', 'Min', 'Max', 'Total']

let pwidth, pheight = 0

function init_page()
{
    contents_card.innerHTML = '<h2 id="plot_title"></h2><canvas id="canvas"></canvas>'

    let max_bins = new Entry('max_bins', 'Max bins', 5)
    max_bins.entry = 'number'
    max_bins.on_text_change = 'build_plot()'

    let select = new Select('function', 'Function', FUNCTIONS, 'Mean')
    select.onselect = 'build_plot()'

    buttons_container.innerHTML = new ColumnFrame('', '', [max_bins]).toString + new ColumnFrame('', '', [select]).toString

    add_dropdown_filter('picklist_filter', ['None'].concat(Object.keys(dal.picklists)), 'filter_teams()', false)
    add_dropdown_filter('stat_filter', ['All', 'Stats', 'Pit', 'Rank'], 'filter_stats()', true)

    let first = populate_keys(dal, false, true)
    if (first !== '')
    {
        init_canvas()
        open_option(first)
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
    let canvas = document.getElementById('canvas')
    canvas.width = pwidth
    canvas.height = pheight
    canvas.onclick = find_bin
    canvas.ontouchend = find_bin
}

/**
 * function:    filter_stats
 * parameters:  none
 * returns:     none
 * description: Filters stats based off the selected type.
 */
function filter_stats()
{
    let filter = document.getElementById('stat_filter').value.toLowerCase()
    let keys = dal.get_keys(true, true, true, false)
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
    let keys = get_selected_keys()
    let key = keys[0]
    let highlights = get_secondary_selected_keys()
    let teams = Object.keys(dal.teams)

    let func = FUNCTIONS[get_selected_option('function')]
    let num_bins = parseInt(document.getElementById('max_bins').value)

    document.getElementById('plot_title').innerHTML = dal.get_name(key, func)

    // calculate number of bins and what ranges the bins cover
    let global = dal.compute_global_stats(keys, teams, func)
    let min = dal.get_global_value(global, key, 'low')
    let max = dal.get_global_value(global, key, 'high')
    if (min === '---')
    {
        return
    }
    let select = dal.meta[key].type === 'checkbox' || dal.meta[key].type === 'select' || dal.meta[key].type === 'dropdown'
    if (select)
    {
        num_bins = max
    }
    let bin_size = (max - min) / num_bins

    // build list of empty bin counts
    let bins = []
    for (let i = 0; i < num_bins; i++)
    {
        bins.push([])
    }

    // determine which team each bin belongs in
    for (let team of teams)
    {
        let val = dal.get_value(team, key, func)
        if (typeof val === 'boolean')
        {
            val = val ? 1 : 0
        }
        let bin = Math.floor((val - min) / bin_size)
        if (isNaN(bin))
        {
            continue
        }
        if (val === max)
        {
            bin = num_bins - 1
        }
        bins[bin].push(team)
    }

    // determine the largest bin
    let max_teams = 0
    for (let bin of bins)
    {
        if (bin.length > max_teams)
        {
            max_teams = bin.length
        }
    }

    // clear canvas
    var ctx = document.getElementById('canvas').getContext('2d')
    ctx.globalCompositeOperation = 'destination-over'
    ctx.clearRect(0, 0, pwidth, pheight)

    // draw radio dial bars and their labels to highlight teams
    // this is first because JS drawing order is backwards... I think
    for (let team of highlights)
    {
        ctx.beginPath()
        ctx.fillStyle = 'red'
        ctx.font = `15px mono, courier`
        let val = dal.get_value(team, key, func)
        if (typeof val === 'boolean')
        {
            val = val ? 1 : 0
        }
        let percent = (val - min) / (max - min)
        ctx.fillRect(25 + percent * (pwidth - 50), 0, 1, pheight - 25)

        let label = (val).toFixed(1)
        let text_width = ctx.measureText(label).width
        ctx.fillText(label, 25 + percent * (pwidth - 50) - text_width / 2, pheight - 10)

        ctx.stroke()
    }

    // draw each bin and its label
    for (let i in bins)
    {
        let bin = bins[i]
        let height = (bin.length / max_teams) * (pheight - 25)
        let width = (pwidth - 50) / num_bins

        ctx.beginPath()
        ctx.fillStyle = 'white'
        ctx.font = `20px mono, courier`

        let label = bin.length
        let text_width = ctx.measureText(label).width
        ctx.fillText(label, 25 + i * width - text_width / 2 + width / 2, pheight - height)

        ctx.stroke()

        ctx.beginPath()
        ctx.fillStyle = 'gray'
        ctx.font = `20px mono, courier`
        ctx.fillRect(25 + i * width, (pheight - 25) - height, width - 1, height)

        label = (bin_size * i + min).toFixed(1)
        // use option name for checkboxes, selects, dropdowns
        let label_shift = 0
        if (select)
        {
            label = dal.meta[key].options[i]
            if (typeof label === 'boolean')
            {
                label = label ? 'Yes' : 'No'
            }
            label_shift = width / 2
        }
        text_width = ctx.measureText(label).width
        ctx.fillText(label, 25 + i * width - text_width / 2 + label_shift, pheight - 10)

        ctx.stroke()
    }

    // add a label at the end
    if (!select)
    {
        ctx.beginPath()
        ctx.fillStyle = 'gray'
        ctx.font = `20px mono, courier`
        label = (max).toFixed(1)
        text_width = ctx.measureText(label).width
        ctx.fillText(label, pwidth - 25 - text_width / 2, pheight - 10)
        ctx.stroke()
    }
}

function find_bin()
{
    // TODO highlight teams in selected bin
}