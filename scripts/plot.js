/**
 * file:        plot.js
 * description: Builds the plot page where teams' performances over time can be compared.
 * author:      Liam Fruzyna
 * date:        2021-12-10
 */

const COLORS = ['black', 'blue', 'red', 'purple', 'orange', 'green']

var pwidth
var pheight

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch simple event matches from localStorage. Initialize page contents.
 */
function init_page()
{
    contents_card.innerHTML = '<h2 id="plot_title"></h2><canvas id="whiteboard"></canvas>'
    let key_card = new Card('', `Max Value: <b id='max'></b><table id='key'></table>`)
    key_card.limitWidth = true
    buttons_container.innerHTML = key_card.toString
    
    add_dropdown_filter('picklist_filter', ['None'].concat(Object.keys(dal.picklists)), 'filter_teams()', false)

    // load keys from localStorage and build list
    let first = populate_keys(dal, true, true)
    if (first)
    {
        open_option(first)
        init_canvas()
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
    let selected_teams = ['avg'].concat(get_secondary_selected_keys())
    document.getElementById('plot_title').innerHTML = dal.get_name(key)

    // build key
    let color_key = document.getElementById('key')
    color_key.innerHTML = `<tr><th>Color</th><th>Value</th></tr>`
    for (let i in selected_teams)
    {
        let team = selected_teams[i]
        let color = COLORS[i % COLORS.length]
        if (team !== 'avg' && cfg.settings.use_team_color)
        {
            color = dal.get_value(team, 'meta.color')
        }
        color_key.innerHTML += `<tr><td style="background-color: ${color}"> </td><td>${team}</td></tr>`
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
        plots[team] = []
        let keys = dal.get_result_names([team])
        for (let i in keys)
        {
            let match_key = keys[i].split('-')[0]
            let val = dal.get_result_value(team, match_key, key)
            plots[team].push(val)

            if (val > max)
            {
                max = val
            }

            if (matches <= i)
            {
                matches++
                totals.push(0)
                counts.push(0)
            }
            totals[i] += val
            counts[i]++
        }
    }

    // round to a reasonable number
    document.getElementById('max').innerHTML = max
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
    var ctx = document.getElementById('whiteboard').getContext('2d')
    ctx.globalCompositeOperation = 'destination-over'
    ctx.clearRect(0, 0, pwidth, pheight)

    // reset colors of all options
    for (let team of teams)
    {
        document.getElementById(`soption_${team}`).style.backgroundColor = 'var(--foreground-color)'
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
            if (team !== 'avg' && cfg.settings.use_team_color)
            {
                color = dal.get_value(team, 'meta.color')
            }
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
                document.getElementById(`soption_${team}`).style.backgroundColor = color
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
        ctx.fillText(val.toFixed(1), 5, y + font_size)
        ctx.fillRect(0, y, pwidth, 1)
    }
    ctx.fill()

    // fill margins
    ctx.beginPath()
    ctx.fillStyle = 'gray'
    ctx.fillRect(0, 0, left_margin, pheight)
    ctx.fillRect(0, pheight - bottom_margin, pwidth, bottom_margin)
    ctx.fill()
}