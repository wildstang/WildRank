/**
 * file:        scatter.js
 * description: Builds the scatter plot page where teams' performances over time can be compared.
 * author:      Liam Fruzyna
 * date:        2022-06-28
 */

var pwidth
var pheight

let title_el, canvas, max_el

/**
 * Builds the structure of the page and populate the two selectors.
 */
function init_page()
{
    header_info.innerText = 'Scatter'

    title_el = document.createElement('h2')
    canvas = document.createElement('canvas')
    canvas.style.background = 'white'
    let card = new WRCard([title_el, canvas])
    preview.append(card)

    // load keys from localStorage and build list
    let numeric_keys = cfg.filter_keys(cfg.get_match_keys(), 'number')
    let first = populate_dual_keys(numeric_keys)
    if (first)
    {
        deselect_all(false)
        document.getElementById(`right_pit_option_${first}`).classList.add('selected')
        open_option(first)
        init_canvas()
    }
}

/**
 * Initializes the plot's canvas and draws the first frame.
 */
function init_canvas()
{
    pwidth = preview.offsetWidth - 64
    pheight = 2*window.innerHeight/3 - 64
    canvas.width = pwidth
    canvas.height = pheight
    build_plot()
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
 * Selects the given key on the right option list and triggers a plot update.
 * @param {String} key Newly selected key
 */
function open_secondary_option(key)
{
    deselect_all(false)
    document.getElementById(`right_pit_option_${key}`).classList.add('selected')
    
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
 * Determines which result keys are selected on the right option list. This should always be an array of length 1.
 * @returns Array of currently selected result keys.
 */
function get_secondary_selected_keys()
{
    return Array.prototype.filter.call(document.getElementsByClassName('pit_option selected'), item => item.id.startsWith('right_')).map(item => item.id.replace('right_pit_option_', ''))
}

/**
 * Renders the plot for the selected keys.
 */
function build_plot()
{
    let key_a = get_selected_keys()[0]
    let key_b = get_secondary_selected_keys()[0]

    // get key names and create title
    let name_a = cfg.get_result_from_key(key_a).name
    let name_b = cfg.get_result_from_key(key_b).name
    title_el.innerHTML = `${name_b}<br>vs<br>${name_a}`

    // build table of values
    let points = []
    let teams = Object.keys(dal.teams)
    let max_a = 0
    let max_b = 0
    for (let team of teams)
    {
        points[team] = {
            a: dal.compute_stat(key_a, team),
            b: dal.compute_stat(key_b, team)
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
    var ctx = canvas.getContext('2d')
    ctx.globalCompositeOperation = 'destination-over'
    ctx.clearRect(0, 0, pwidth, pheight)

    // plot points and lines
    let font_size = 16
    let left_margin = 75
    let bottom_margin = 50
    for (let team of teams)
    {
        let x = left_margin + (points[team].a / max_a) * (pwidth - left_margin)
        let y = pheight - ((points[team].b / max_b) * (pheight - bottom_margin) + bottom_margin)

        ctx.beginPath()
        ctx.fillStyle = 'black'
            
        // points
        ctx.arc(x, y, 5, 0, 2 * Math.PI, false)
        ctx.fill()
    }

    // draw axis labels
    ctx.beginPath()
    ctx.fillStyle = 'black'
    ctx.font = `${font_size}px mono, courier`
    ctx.fillText(name_a, pwidth / 2 - 5 * name_a.toString().length, pheight - 10)
    ctx.rotate(-Math.PI * 2 / 4)
    ctx.fillText(name_b, -pheight / 2 - 5 * name_b.toString().length, 15)
    ctx.rotate(Math.PI * 2 / 4)
    for (let i = 0; i <= 10; i++)
    {
        let val = (i / 10 * max_b).toFixed(1)
        let y = pheight - bottom_margin - val * (pheight - 50) / max_b
        ctx.fillText(val, 25, y + font_size / 2)
        ctx.fillRect(left_margin, y, pwidth, 1)

        val = (i / 10 * max_a).toFixed(1)
        let x = left_margin + val * (pwidth - 50) / max_a
        ctx.fillText(val, x - 5 * val.toString().length, pheight - 30)
        ctx.fillRect(x, 0, 1, pheight - bottom_margin)
    }
    ctx.fill()

    // set tooltip on hover over dot
    canvas.onmousemove = function(e) {
        let rect = this.getBoundingClientRect()
        let x = e.clientX - rect.left
        let y = e.clientY - rect.top
        
        canvas.title = ''
        for (let team of teams)
        {
            let team_x = left_margin + (points[team].a / max_a) * (pwidth - left_margin)
            let team_y = pheight - ((points[team].b / max_b) * (pheight - bottom_margin) + bottom_margin)
            
            if (x > team_x - 3 && x < team_x + 3 && y > team_y - 3 && y < team_y + 3)
            {
                canvas.title = team
            }
        }
    }
}