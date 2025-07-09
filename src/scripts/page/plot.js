/**
 * file:        plot.js
 * description: Builds the plot page where teams' performances over time can be compared.
 * author:      Liam Fruzyna
 * date:        2021-12-10
 */

const COLORS = [0x0000FF, 0xFF0000, 0x800080, 0xFFA500, 0x008000]

var pwidth
var pheight
var numeric_keys
var result_el, canvas, max_el, key_tab, filter_el

/**
 * Builds the structure of the page and populate the two selectors.
 */
function init_page()
{
    header_info.innerText = 'Plotter'

    numeric_keys = cfg.filter_keys(cfg.get_match_keys(), 'number')
    result_el = new WRDropdown('', cfg.get_names(numeric_keys))
    result_el.on_change = build_plot
    result_el.add_class('inline')

    canvas = document.createElement('canvas')
    canvas.style.background = 'white'
    let card = new WRCard([result_el, canvas])

    let label = document.createElement('label')
    max_el = document.createElement('b')
    key_tab = document.createElement('table')
    label.append('Max Value: ', max_el, key_tab)
    let key_card = new WRCard(label)
    key_card.limitWidth = true
    preview.append(card, key_card)

    filter_el = add_dropdown_filter(['None'].concat(Object.keys(dal.picklists)), filter_teams)

    // show and populate the left column with team numbers
    enable_list()
    for (let team_num of dal.team_numbers)
    {
        let op = new WRDescriptiveOption(team_num, team_num, dal.teams[team_num].name)
        add_option(op)
    }

    init_canvas()
}

/**
 * Initializes the plot's canvas and draws the first frame.
 */
function init_canvas()
{
    pwidth = preview.offsetWidth - 64
    pheight = window.innerHeight/2 - 64
    canvas.width = pwidth
    canvas.height = pheight
    build_plot()
}

/**
 * Filters teams based on the selected picklist.
 */
function filter_teams()
{
    let list = filter_el.element.value
    if (list in dal.picklists)
    {
        filter_by(dal.picklists[list])
    }
    else
    {
        deselect_all()
    }

    init_canvas()
}

/**
 * Selects the given team on the right option list and triggers a plot update.
 * @param {String} key Newly selected team
 */
function open_option(key)
{
    let class_list = document.getElementById(`left_pit_option_${key}`).classList
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
 * Determines which teams are selected on the right option list.
 * @returns Array of currently selected team numbers.
 */
function get_selected_teams()
{
    return Array.prototype.filter.call(document.getElementsByClassName('pit_option selected'), item => item.id.startsWith('left_')).map(item => item.id.replace('left_pit_option_', ''))
}

/**
 * Renders the plot for the select key and teams.
 */
function build_plot()
{
    let key = numeric_keys[result_el.element.selectedIndex]
    let selected_teams = ['avg'].concat(get_selected_teams())
    let colors = []

    // build key
    key_tab.replaceChildren()
    key_tab.append(create_header_row(['Color', 'Value']))
    for (let i in selected_teams)
    {
        let team = selected_teams[i]
        let color_int = 0
        if (i > 0)
        {
            let base_color = COLORS[(i - 1) % COLORS.length]
            let scale_factor = Math.pow(0.67, Math.floor((i - 1) / COLORS.length))
            let red = Math.round(((base_color & 0xFF0000) >> 16) * scale_factor)
            let green = Math.round(((base_color & 0x00FF00) >> 8) * scale_factor)
            let blue = Math.round((base_color & 0x0000FF) * scale_factor)
            color_int = (red << 16) + (green << 8) + blue
        }
        let color = `#${color_int.toString(16).padStart(6, '0')}`
        colors.push(color)
        let row = key_tab.insertRow()
        let color_cell = row.insertCell()
        color_cell.style.backgroundColor = color
        color_cell.innerText = ' '
        row.insertCell().innerText = team
    }

    // build table of values
    let plots = {}
    let max = 0
    let matches = 0
    let totals = []
    let counts = []
    for (let team of dal.team_numbers)
    {
        plots[team] = dal.get_match_results(key, team)
        let team_max = Math.max(...plots[team])
        if (team_max > max)
        {
            max = team_max
        }
        if (plots[team].length > matches)
        {
            matches = plots[team].length
            for (let i = totals.length; i < matches; ++i)
            {
                totals.push(0)
                counts.push(0)
            }
        }
        for (let i in plots[team])
        {
            totals[i] += plots[team][i]
            ++counts[i]
        }
    }

    // round to a reasonable number
    max_el.innerText = max
    if (max <= 2)
    {
        max = Math.ceil(max)
    }
    else if (max <= 2.5)
    {
        max = 2.5
    }
    else if (max <= 3.33)
    {
        max = 3.33
    }
    else if (max <= 5)
    {
        max = 5
    }
    else
    {
        max = Math.ceil(max / 10) * 10
    }

    // calculate averages
    plots['avg'] = []
    for (let i = 0; i < matches; i++)
    {
        plots['avg'].push(totals[i] / counts[i])
    }

    // reset canvas
    var ctx = canvas.getContext('2d')
    ctx.globalCompositeOperation = 'destination-over'
    ctx.clearRect(0, 0, pwidth, pheight)

    // reset colors of all options
    for (let team_num of dal.team_numbers)
    {
        document.getElementById(`left_pit_option_${team_num}`).style.backgroundColor = 'var(--foreground-color)'
    }

    // plot points and lines
    let font_size = 16
    let left_margin = 60
    let bottom_margin = 30
    for (let i = 0; i < matches; i++)
    {
        let x = left_margin + i * pwidth / matches
        for (let j in selected_teams)
        {
            let team = selected_teams[j]
            ctx.beginPath()
            let color = colors[j]
            ctx.fillStyle = color
            
            // points
            let y = pheight - bottom_margin - plots[team][i] * (pheight - 50) / max
            ctx.arc(x, y, 5, 0, 2 * Math.PI, false)
            ctx.fill()

            // lines
            if (i > 0)
            {
                ctx.beginPath()
                ctx.strokeStyle = color
                ctx.lineWidth = 3
                ctx.moveTo(x - pwidth / matches, pheight - bottom_margin - plots[team][i-1] * (pheight - 50) / max)
                ctx.lineTo(x, y)
                ctx.stroke()
            }

            // change selected option text color
            if (team != 'avg')
            {
                document.getElementById(`left_pit_option_${team}`).style.backgroundColor = color
            }
        }

        // draw X axis labels
        ctx.beginPath()
        ctx.fillStyle = 'black'
        ctx.font = `${font_size}px mono, courier`
        let height = pheight - 25 + font_size
        ctx.fillText(i + 1, x - 5 * (i + 1).toString().length, height)
        ctx.fillRect(x - 1, 0, 1, pheight - bottom_margin)
        ctx.fill()
    }

    // draw Y axis labels
    ctx.beginPath()
    ctx.fillStyle = 'black'
    ctx.font = `${font_size}px mono, courier`
    for (let i = 0; i <= 10; i++)
    {
        let val = i * max / 10
        let y = pheight - bottom_margin - val * (pheight - 50) / max
        ctx.fillText(val.toFixed(1), 5, y + font_size / 2)
        ctx.fillRect(left_margin, y, pwidth, 1)
    }
    ctx.fill()
}