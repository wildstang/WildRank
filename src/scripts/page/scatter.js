/**
 * file:        scatter.js
 * description: Builds the scatter plot page where teams' performances over time can be compared.
 * author:      Liam Fruzyna
 * date:        2022-06-28
 */

var pwidth
var pheight
var numeric_keys
var x_result_el, y_result_el, canvas, max_el

/**
 * Builds the structure of the page and populate the two selectors.
 */
function init_page()
{
    header_info.innerText = 'Scatter'

    // load keys from localStorage and dropdowns
    numeric_keys = cfg.filter_keys(cfg.get_match_keys(), 'number')
    let names = cfg.get_names(numeric_keys)
    x_result_el = new WRDropdown('', names)
    x_result_el.on_change = build_plot
    x_result_el.add_class('inline')
    y_result_el = new WRDropdown('', names)
    y_result_el.on_change = build_plot
    y_result_el.add_class('inline')

    let title_el = document.createElement('h2')
    title_el.innerText = 'vs'
    title_el.style.display = 'inline'
    canvas = document.createElement('canvas')
    canvas.style.background = 'white'
    let card = new WRCard([y_result_el, title_el, x_result_el, canvas])
    preview.append(card)

    init_canvas()
}

/**
 * Initializes the plot's canvas and draws the first frame.
 */
function init_canvas()
{
    pwidth = preview.offsetWidth - 64
    pheight = 2 * window.innerHeight / 3 - 64
    canvas.width = pwidth
    canvas.height = pheight
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
 * Renders the plot for the selected keys.
 */
function build_plot()
{
    let key_x = numeric_keys[x_result_el.element.selectedIndex]
    let key_y = numeric_keys[y_result_el.element.selectedIndex]

    let name_x = x_result_el.element.value
    let name_y = y_result_el.element.value

    // build table of values
    let points = []
    let teams = dal.team_numbers
    let max_x = 0
    let max_y = 0
    for (let team of teams)
    {
        points[team] = {
            x: dal.compute_stat(key_x, team),
            y: dal.compute_stat(key_y, team)
        }

        if (points[team].x > max_x)
        {
            max_x = points[team].x
        }
        if (points[team].y > max_y)
        {
            max_y = points[team].y
        }
    }
    max_x *= 1.05
    max_y *= 1.05

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
        let x = left_margin + (points[team].x / max_x) * (pwidth - left_margin)
        let y = pheight - ((points[team].y / max_y) * (pheight - bottom_margin) + bottom_margin)

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
    ctx.fillText(name_x, pwidth / 2 - 5 * name_x.toString().length, pheight - 10)
    ctx.rotate(-Math.PI * 2 / 4)
    ctx.fillText(name_y, -pheight / 2 - 5 * name_y.toString().length, 15)
    ctx.rotate(Math.PI * 2 / 4)
    for (let i = 0; i <= 10; i++)
    {
        let val = (i / 10 * max_y).toFixed(1)
        let y = pheight - bottom_margin - val * (pheight - 50) / max_y
        ctx.fillText(val, 25, y + font_size / 2)
        ctx.fillRect(left_margin, y, pwidth, 1)

        val = (i / 10 * max_x).toFixed(1)
        let x = left_margin + val * (pwidth - 50) / max_x
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
            let team_x = left_margin + (points[team].x / max_x) * (pwidth - left_margin)
            let team_y = pheight - ((points[team].y / max_y) * (pheight - bottom_margin) + bottom_margin)
            
            if (x > team_x - 3 && x < team_x + 3 && y > team_y - 3 && y < team_y + 3)
            {
                canvas.title = team
            }
        }
    }
}