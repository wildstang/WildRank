/**
 * file:        scatter.js
 * description: Builds the scatter plot page where teams' performances over time can be compared.
 * author:      Liam Fruzyna
 * date:        2022-06-28
 */

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
    contents_card.innerHTML = '<canvas id="whiteboard"></canvas>'
    buttons_container.innerHTML = ''

    // load keys from localStorage and build list
    let first = populate_dual_keys(dal, false, true)
    if (first)
    {
        deselect_all(false)
        document.getElementById(`soption_${first}`).classList.add('selected')
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
    deselect_all(false)
    document.getElementById(`soption_${key}`).classList.add('selected')
    
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
    let key_a = get_selected_keys()[0]
    let key_b = get_secondary_selected_keys()[0]

    // build table of values
    let points = []
    let teams = Object.keys(dal.teams)
    let max_a = 0
    let max_b = 0
    for (let team of teams)
    {
        points[team] = {
            a: dal.get_value(team, key_a),
            b: dal.get_value(team, key_b)
        }

        if (points[team].a > max_a)
        {
            max_a = points[team].a
        }
        if (points[team].b > max_b)
        {
            max_b = points[team].b
        }
    }
    max_a *= 1.05
    max_b *= 1.05

    // reset canvas
    var ctx = document.getElementById('whiteboard').getContext('2d')
    ctx.globalCompositeOperation = 'destination-over'
    ctx.clearRect(0, 0, pwidth, pheight)

    // plot points and lines
    let font_size = 16
    let left_margin = 60
    let bottom_margin = 30
    for (let team of teams)
    {
        let x = left_margin + (points[team].a / max_a) * (pwidth - left_margin)
        let y = pheight - ((points[team].b / max_b) * (pheight - bottom_margin) + bottom_margin)

        ctx.beginPath()
        ctx.fillStyle = 'black'
            
        // points
        ctx.arc(x, y, 3, 0, 2 * Math.PI, false)
        ctx.fill()
    }

    // draw Y axis labels
    ctx.beginPath()
    ctx.fillStyle = 'black'
    ctx.font = `${font_size}px mono, courier`
    for (let i = 0; i <= 10; i++)
    {
        let val = (i / 10 * max_b).toFixed(1)
        let y = pheight - bottom_margin - val * (pheight - 50) / max_b
        ctx.fillText(val, 5, y + font_size)
        ctx.fillRect(0, y, pwidth, 1)

        val = (i / 10 * max_a).toFixed(1)
        let x = left_margin + val * (pwidth - 50) / max_a
        ctx.fillText(val, x - 5 * val.toString().length, pheight - 5)
        ctx.fillRect(x, 0, 1, pheight - bottom_margin)
    }
    ctx.fill()

    // fill margins
    ctx.beginPath()
    ctx.fillStyle = 'gray'
    ctx.fillRect(0, 0, left_margin, pheight)
    ctx.fillRect(0, pheight - bottom_margin, pwidth, bottom_margin)
    ctx.fill()
}