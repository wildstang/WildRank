/**
 * file:        plot.js
 * description: Builds the plot page where teams' performances over time can be compared.
 * author:      Liam Fruzyna
 * date:        2021-12-10
 */

const COLORS = ['black', 'blue', 'red', 'yellow', 'purple', 'orange', 'green']

var meta = {}
var results = []
var teams = []
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
    buttons_container.innerHTML = ''

    meta = get_result_meta(type, year)

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
        let first = populate_keys(meta, results, teams, false)
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
    let type = meta[key].type
    let selected_teams = ['avg'].concat(get_secondary_selected_keys())

    // build table of values
    let plots = {}
    let max = 0
    let matches = 0
    let totals = []
    let counts = []
    for (let team of teams)
    {
        plots[team] = []
        let res = get_team_results(results, team)
        for (let i in Object.keys(res))
        {
            let val = res[Object.keys(res)[i]][key]
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

    // plot points and lines
    let font_size = 16
    for (let i = 0; i < matches; i++)
    {
        let x = 30 + i * ((pwidth + 25) / matches)
        for (let j in selected_teams)
        {
            let team = selected_teams[j]
            ctx.beginPath()
            ctx.fillStyle = COLORS[j % COLORS.length]
            
            // points
            let y = (pheight - 30) - plots[team][i] * ((pheight - 50) / max)
            ctx.arc(x, y, 5, 0, 2 * Math.PI, false)
            ctx.fill()

            // lines
            if (i > 0)
            {
                ctx.beginPath()
                ctx.strokeStyle = COLORS[j % COLORS.length]
                ctx.lineWidth = 3
                ctx.moveTo(30 + (i-1) * ((pwidth + 25) / matches), (pheight - 30) - plots[team][i-1] * ((pheight - 50) / max))
                ctx.lineTo(x, y)
                ctx.stroke()
            }
        }

        // draw X axis labels
        ctx.beginPath()
        ctx.fillStyle = 'black'
        ctx.font = `${font_size}px mono, courier`
        let height = pheight - 25 + font_size
        ctx.fillText(i + 1, x - 5, height)
        ctx.fill()
    }

    // draw Y axis labels
    ctx.beginPath()
    ctx.fillStyle = 'black'
    ctx.font = `${font_size}px mono, courier`
    for (let i = 0; i <= 10; i++)
    {
        let val = i * max / 10
        let y = (pheight - 25) - val * ((pheight - 50) / max)
        ctx.fillText(val, 0, y)
    }
    ctx.fill()
}