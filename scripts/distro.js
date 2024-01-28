/**
 * file:        distro.js
 * description: Contains functions for the result distribution page of the web app.
 *              Primarily for building the interface from results.
 * author:      Liam Fruzyna
 * date:        2022-05-18
 */

const FUNCTIONS = ['Mean', 'Median', 'Mode', 'Min', 'Max', 'Total']

let pwidth, pheight = 0

let title_el, canvas

function init_page()
{
    title_el = document.createElement('h2')
    canvas = document.createElement('canvas')
    contents_card.append(title_el, canvas)

    let max_bins = new Entry('max_bins', 'Max bins', 5)
    max_bins.entry = 'number'
    max_bins.on_text_change = 'build_plot()'

    let select = new Select('function', 'Function', FUNCTIONS, 'Mean')
    select.on_change = 'build_plot()'

    buttons_container.append(new ColumnFrame('', '', [max_bins]).element, new ColumnFrame('', '', [select]).element)

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
    canvas.width = pwidth
    canvas.height = pheight
    canvas.onclick = find_bin
    canvas.ontouchend = find_bin
    build_plot()
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
    let keys = dal.get_keys(true, true, true, false, [], false)
    for (let k of keys)
    {
        let element = document.getElementById(`pit_option_${k}`)
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
    document.getElementById(`pit_option_${key}`).classList.add('selected')

    build_plot()
}

/**
 * function:    open_secondary_option
 * parameters:  Selected key, rebuild the plot
 * returns:     none
 * description: Selects and opens a secondary option.
 */
function open_secondary_option(key, rebuild=true)
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

    if (rebuild)
    {
        select_none()
        build_plot()
    }
}

/**
 * function:    get_selected_keys
 * parameters:  none
 * returns:     array of selected keys
 * description: Builds an array of the currently selected keys.
 */
function get_selected_keys()
{
    return Array.prototype.filter.call(document.getElementsByClassName('pit_option selected'), item => item.id.startsWith('p')).map(item => item.id.replace('pit_option_', ''))
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
    if (keys.length === 0)
    {
        return
    }

    let key = keys[0]
    let highlights = get_secondary_selected_keys()
    let teams = Object.keys(dal.teams)

    let func = FUNCTIONS[Select.get_selected_option('function')]
    let num_bins = parseInt(document.getElementById('max_bins').value)

    title_el.innerText = dal.get_name(key, func)

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
        if (bin >= 0)
        {
            bins[bin].push(team)
        }
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
    var ctx = canvas.getContext('2d')
    ctx.globalCompositeOperation = 'destination-over'
    ctx.clearRect(0, 0, pwidth, pheight)

    // draw radio dial bars and their labels to highlight teams
    // this is first because JS drawing order is backwards... I think
    let vals = {}
    for (let team of highlights)
    {
        let val = dal.get_value(team, key, func)
        if (val === '')
        {
            continue
        }
        if (typeof val === 'boolean')
        {
            val = val ? 1 : 0
        }
        val = val.toFixed(1).replace('.0', '')
        if (!Object.keys(vals).includes(val))
        {
            vals[val] = []
        }
        vals[val].push(team)
    }
    let dials = Object.keys(vals)
    for (let val of dials)
    {
        ctx.beginPath()
        ctx.fillStyle = 'red'
        let pos = parseInt(val)
        let label = val
        if (dal.meta[key].type === 'checkbox' || dal.meta[key].type === 'dropdown' || dal.meta[key].type === 'select')
        {
            pos += 0.5
        }
        let percent = (pos - min) / (max - min)

        // draw line
        ctx.fillRect(25 + percent * (pwidth - 50), 0, 1, pheight - 35)

        // draw team numbers
        ctx.font = `15px mono, courier`
        let teams = vals[val].join(',')
        text_width = ctx.measureText(teams).width
        let lines = 1
        if (text_width > pwidth)
        {
            teams = ''
            lines = Math.ceil(text_width / pwidth)
            let length = vals[val].length / lines
            for (let i = 0; i < lines; i++)
            {
                if (i === lines - 1)
                {
                    length = vals[val].length - i * length
                }
                teams += vals[val].slice(i * length, (i+1) * length) + '\n'
            }
        }
        let x = 25 + percent * (pwidth - 50) - text_width / 2
        if (x + text_width > pwidth)
        {
            x -= (x + text_width) - pwidth
        }
        else if (x < 0)
        {
            x = 0
        }
        let text = teams.split('\n')
        for (let line = 0; line < lines; line++)
        {
            ctx.fillText(text[line], x, pheight - 12 * (lines - line) + 7)
        }

        // draw team(s) value
        if (dal.meta[key].type !== 'checkbox' && dal.meta[key].type !== 'dropdown' && dal.meta[key].type !== 'select')
        {
            ctx.font = `bold 17px mono, courier`
            let text_width = ctx.measureText(label).width
            let x = 25 + percent * (pwidth - 50) - text_width / 2
            if (x + text_width > pwidth)
            {
                x -= (x + text_width) - pwidth
            }
            else if (x < 0)
            {
                x = 0
            }
            ctx.fillText(label, x, pheight - 20 - (lines - 1) * 12)
        }

        ctx.stroke()
    }

    // draw each bin and its label
    for (let i in bins)
    {
        let bin = bins[i]
        let height = (bin.length / max_teams) * (pheight - 35)
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
        ctx.fillRect(25 + i * width, (pheight - 35) - height, width - 1, height)

        label = (bin_size * i + min).toFixed(1).replace('.0', '')
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
        ctx.fillText(label, 25 + i * width - text_width / 2 + label_shift, pheight - 20)

        ctx.stroke()
    }

    // add a label at the end
    if (!select)
    {
        ctx.beginPath()
        ctx.fillStyle = 'gray'
        ctx.font = `20px mono, courier`
        label = (max).toFixed(1).replace('.0', '')
        text_width = ctx.measureText(label).width
        ctx.fillText(label, pwidth - 25 - text_width / 2, pheight - 20)
        ctx.stroke()
    }
}

/**
 * function:    find_bin
 * parameters:  MouseEvent
 * returns:     none
 * description: Highlights teams based on a clicked on bin.
 */
function find_bin(event)
{
    deselect_all(false)

    let keys = get_selected_keys()
    let key = keys[0]
    let teams = Object.keys(dal.teams)

    let func = FUNCTIONS[Select.get_selected_option('function')]
    let num_bins = parseInt(document.getElementById('max_bins').value)

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

    // determine which bin was selected
    let width = (pwidth - 49) / num_bins
    let selected = Math.floor((event.offsetX - 25) / width)
    if (selected < 0 || selected >= num_bins)
    {
        build_plot()
        return
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
        if (bin === selected)
        {
            open_secondary_option(team, rebuilt=false)
        }
    }

    build_plot()
}