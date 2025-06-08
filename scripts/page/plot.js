/**
 * file:        plot.js
 * description: Builds the plot page where teams' performances over time can be compared.
 * author:      Liam Fruzyna
 * date:        2021-12-10
 */

const COLORS = ['black', 'blue', 'red', 'purple', 'orange', 'green']

var pwidth
var pheight

var title_el, canvas, max_el, key_tab

/**
 * Builds the structure of the page and populate the two selectors.
 */
function init_page()
{
    header_info.innerText = 'Plotter'

    title_el = document.createElement('h2')
    canvas = document.createElement('canvas')
    canvas.style.background = 'white'
    let card = new WRCard([title_el, canvas])

    let label = document.createElement('label')
    max_el = document.createElement('b')
    key_tab = document.createElement('table')
    label.append('Max Value: ', max_el, key_tab)
    let key_card = new WRCard(label)
    key_card.limitWidth = true
    preview.append(card, key_card)
    
    add_dropdown_filter(['None'].concat(Object.keys(dal.picklists)), filter_teams, false)

    let numeric_keys = cfg.filter_keys(cfg.get_match_keys(), 'number')
    let first = populate_keys(numeric_keys)
    if (first)
    {
        open_option(first)
        init_canvas()
    }
    else
    {
        add_error_card('No Results Found')
    }
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
    let list = document.getElementById('picklist_filter').value
    if (Object.keys(dal.picklists).includes(list))
    {
        filter_by(dal.picklists[list], false)
    }
    else
    {
        deselect_all(false)
    }

    init_canvas()
}

/**
 * Selects the given key on the left option list and triggers a plot update.
 * @param {String} key Newly selected key
 */
function open_option(key)
{
    deselect_all(true)
    document.getElementById(`left_pit_option_${key}`).classList.add('selected')

    build_plot()
}

/**
 * Selects the given team on the right option list and triggers a plot update.
 * @param {String} key Newly selected team
 */
function open_secondary_option(key)
{
    let class_list = document.getElementById(`right_pit_option_${key}`).classList
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
 * Determines which result keys are selected on the left option list. This should always be an array of length 1.
 * @returns Array of currently selected result keys.
 */
function get_selected_keys()
{
    return Array.prototype.filter.call(document.getElementsByClassName('pit_option selected'), item => item.id.startsWith('left_')).map(item => item.id.replace('left_pit_option_', ''))
}

/**
 * Determines which teams are selected on the right option list.
 * @returns Array of currently selected team numbers.
 */
function get_secondary_selected_keys()
{
    return Array.prototype.filter.call(document.getElementsByClassName('pit_option selected'), item => item.id.startsWith('right_')).map(item => item.id.replace('right_pit_option_', ''))
}

/**
 * Renders the plot for the select key and teams.
 */
function build_plot()
{
    let key = get_selected_keys()[0]
    let selected_teams = ['avg'].concat(get_secondary_selected_keys())
    title_el.innerText = cfg.get_result_from_key(key).name

    // build key
    key_tab.replaceChildren()
    key_tab.append(create_header_row(['Color', 'Value']))
    for (let i in selected_teams)
    {
        let team = selected_teams[i]
        let color = COLORS[i % COLORS.length]
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
    let teams = Object.keys(dal.teams)
    for (let team of teams)
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
    for (let team of teams)
    {
        document.getElementById(`right_pit_option_${team}`).style.backgroundColor = 'var(--foreground-color)'
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
            let color = COLORS[j % COLORS.length]
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
                document.getElementById(`right_pit_option_${team}`).style.backgroundColor = color
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