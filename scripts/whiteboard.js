/**
 * file:        whiteboard.js
 * description: Renders the whiteboard.
 * author:      Liam Fruzyna
 * date:        2020-03-10
 */

// canvas
var canvas
var field_width
var field_height
var scale_factor = 1

// magnets
var bot_images = {}
var game_pieces = {}
var magnets = []
var magnet_size
var magnet_held = -1
var draw_on_drag = false

// drawing
var lines = []
var markers = []
var draw_color
var line_width

// playback
var match_plots = []
var trail_length = 0
var draw_trace = false

// heatmap
var heatmaps = {}
var heatmap = []
var hm_color = '#000000'
var draw_heatmap = true

// click tracking
var mouseDown = false
var hasChanged = true

// read parameters from URL
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const year = event_id.substr(0,4)

var matches
var wb = get_wb_config(year)


/**
 * function:    open_match
 * parameters:  selected match number
 * returns:     none
 * description: Updates robot images with selected match.
 */
function open_match(match_num)
{
    let use_elims = get_selected_option('elims') == 1

    // iterate through each match obj
    matches.forEach(function (match, index) {
        let level = match.comp_level
        if ((level == 'qm' && !use_elims) || (level != 'qm' && use_elims))
        {
            let match_div = document.getElementById(`match_${match.key}`)
            if (match_num == match.key)
            {
                let red_teams = match.alliances.red.team_keys
                let blue_teams = match.alliances.blue.team_keys

                // update avatars
                bot_images = {}
                red_teams.forEach(function (team, i)
                {
                    let pos = `red_${i+1}`
                    bot_images[pos] = new Image()
                    document.getElementById(pos).value = team.substr(3)
                })
                blue_teams.forEach(function (team, i)
                {
                    let pos = `blue_${i+1}`
                    bot_images[pos] = new Image()
                    document.getElementById(pos).value = team.substr(3)
                })

                update_teams()

                fetch_zebra(match.key)

                // select option
                match_div.classList.add('selected')
            }
            else if (match_div.classList.contains('selected'))
            {
                match_div.classList.remove('selected')
            }
        }
    })

    init()
}

/**
 * function:    update_teams
 * parameters:  none
 * returns:     none
 * description: Update the teams on the whiteboard with those in the number boxes.
 */
function update_teams()
{
    Object.keys(bot_images).forEach(function (pos)
    {
        bot_images[pos].src = get_avatar(document.getElementById(pos).value, year)
    })
}

/**
 * function:    build_match_list
 * parameters:  none
 * returns:     none
 * description: Completes left select match pane with matches from event data.
 */
function build_match_list()
{
    let first = ''
    let use_elims = get_selected_option('elims') == 1
    document.getElementById('option_list').innerHTML = ''

    // iterate through each match obj
    matches.forEach(function (match, index) {
        let level = match.comp_level

        // filter out quals matches
        if ((level == 'qm' && !use_elims) || (level != 'qm' && use_elims))
        {
            let number = match.match_number
            let red_teams = match.alliances.red.team_keys
            let blue_teams = match.alliances.blue.team_keys
            let match_name = `${level.substr(0, 1).toUpperCase()}${number}`

            if (first == '')
            {
                first = match.key
            }

            // replace placeholders in template and add to screen
            document.getElementById('option_list').innerHTML += build_match_option(match.key, red_teams, blue_teams, '', match_name)
        }
    })
    open_match(first)
}

/**
 * function:    draw_drag
 * parameters:  none
 * returns:     none
 * description: Toggles drawing on magnet drawing from checkbox change.
 */
function draw_drag()
{
    draw_on_drag = document.getElementById('draw_drag').checked
}

/**
 * function:    set_path_type
 * parameters:  none
 * returns:     none
 * description: Toggles the path drawn on right click.
 */
function set_path_type()
{
    switch (get_selected_option('path_type'))
    {
        // heatmap
        case 0:
            draw_heatmap = true
            draw_trace = false
            break
        // trace
        case 1:
            draw_heatmap = false
            draw_trace = true
            break
        // both
        case 2:
            draw_heatmap = true
            draw_trace = true
            break
    }
}

/**
 * function:    update_trail
 * parameters:  none
 * returns:     none
 * description: Adjusts the length of playback trails with the slider.
 */
function update_trail()
{
    trail_length = document.getElementById('trail_length').value
}

/**
 * function:    load_event
 * parameters:  none
 * returns:     none
 * description: Fetch simple event matches and from localStorage.
 *              Build match list on load completion.
 */
function load_event()
{
    let file_name = `matches-${event_id}`

    if (localStorage.getItem(file_name) != null)
    {
        matches = JSON.parse(localStorage.getItem(file_name))
    }
}

/**
 * function:    clear_whiteboard
 * parameters:  none
 * returns:     none
 * description: Remove any lines from the whiteboard.
 */
function clear_whiteboard()
{
    lines = []
    markers = []
    heatmap = []
}

/**
 * function:    intersects_image
 * parameters:  x coordinate, y coordinate
 * returns:     none
 * description: Returns the last (top) image intersecting with a given coordinate.
 */
function intersects_image(x, y)
{
    let i = -1
    magnets.forEach(function (image, index)
    {
        if (x > image.x && y > image.y && x < image.x + image.width - 1 && y < image.y + image.height)
        {
            i = index
        }
    })
    return i
}

/**
 * function:    create_magnet
 * parameters:  x coordinate, y coordinate, image, line color
 * returns:     none
 * description: Create the object for a new magnet and add to the list.
 */
function create_magnet(x, y, image, color)
{
    var obj = {}
    obj.img = image
    obj.x = x
    obj.y = y
    obj.width = magnet_size
    obj.height = magnet_size
    obj.color = color
    magnets.push(obj)
}

/**
 * function:    add_game_piece
 * paramters:   name of game piece
 * returns:     none
 * description: Adds a game piece to the field.
 */
function add_game_piece(name)
{
    var obj = {}
    obj.img = game_pieces[name]
    obj.x = field_width / 2 - magnet_size / 2
    obj.y = field_height / 2 - magnet_size / 2
    obj.width = magnet_size
    obj.height = magnet_size
    obj.color = 'white'
    magnets.push(obj)
}

/**
 * function:    get_wb_config
 * parameters:  year
 * returns:     whiteboard config
 * description: Fetches the desired year's config for the whiteboard.
 */
function get_wb_config(year)
{
    let wbs = get_config('whiteboard')
    for (var i = 0; i < wbs.length; ++i)
    {
        if (wbs[i].year == year)
        {
            return wbs[i]
        }
    }
}

/**
 * function:    init
 * parameters:  none
 * returns:     none
 * description: Place magnets on the field and start drawing.
 */
function init() {
    clear_whiteboard()
    magnets = []
    let wb = get_wb_config(year)
    Object.keys(bot_images).forEach(function (pos)
    {
        create_magnet(wb[pos].x / scale_factor, wb[pos].y / scale_factor, bot_images[pos], wb[pos].color)
    })

    // determine game piece by game
    wb.game_pieces.forEach(function (piece)
    {
        let image = new Image()
        image.src = `/config/${piece.image}`
        game_pieces[piece.name] = image
    })

    let names = Object.keys(game_pieces)
    let button = build_multi_button('add_game_piece', 'Add Game Piece', names, names.map(name => `add_game_piece('${name}')`))
    document.getElementById('add_element_container').innerHTML = button

    window.requestAnimationFrame(draw);
}

/**
 * function:    draw
 * parameters:  none
 * returns:     none
 * description: Draw one frame of the whiteboard, including all magnets and lines.
 */
function draw() {
    var ctx = document.getElementById('whiteboard').getContext('2d')

    ctx.globalCompositeOperation = 'destination-over'
    // reset canvas
    ctx.clearRect(0, 0, field_width, field_height)

    // draw each magnet
    magnets.forEach(function (image)
    {
        if (image.img.complete)
        {
            ctx.beginPath()
            ctx.drawImage(image.img, image.x, image.y, image.width, image.height)
            ctx.stroke()
        }
    })

    markers.forEach(function (point)
    {
        ctx.beginPath()
        ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI, false)
        ctx.fillStyle = point.color
        ctx.fill()
        ctx.lineWidth = 5
        ctx.strokeStyle = '#000000'
        ctx.stroke()
    })

    // draw each line
    lines.forEach(function (line, idx)
    {
        ctx.beginPath()
        line.forEach(function (p, index)
        {
            if (index == 0)
            {
                ctx.beginPath(p.x, p.y)
            }
            else
            {
                ctx.lineTo(p.x, p.y)
            }
        })
        ctx.lineWidth = line_width
        ctx.strokeStyle = line.color
        ctx.stroke()
    })

    // draw trails during match playback
    if (trail_length > 0 && match_plots != null && match_plots.alliances != null)
    {
        // get current match time
        let now = document.getElementById('match_time').value
        Object.keys(bot_images).forEach(function (pos, i)
        {
            let parts = pos.split('_')

            // get teams points
            let num = document.getElementById(pos).value
            let points = match_plots.alliances[parts[0]].filter(t => t.team_key == `frc${num}`)[0]

            if (points)
            {
                // draw last x seconds base on sliders
                if (points.xs != null && points.xs != null)
                {
                    ctx.beginPath()
                    for (let t = 0; t < match_plots.times.length-1; t++)
                    {
                        let point = scale_coord(points.xs[t], points.ys[t])
                        if (t > 1 && t <= now && t >= now - trail_length)
                        {
                            ctx.lineTo(point.x, point.y)
                        }
                        else if (t == 1)
                        {
                            ctx.beginPath(point.x, point.y)
                        }
                    }
                    ctx.lineWidth = line_width
                    ctx.strokeStyle = magnets[i].color
                    ctx.stroke()
                }
            }
        })
    }

    // draw heatmap
    let margin = scale_coord(3, 3, false, false)
    let max = Math.sqrt(Math.max(...heatmap.flat()))
    heatmap.forEach(function (r, x)
    {
        r.forEach(function (c, y)
        {
            if (c > 1)
            {
                ctx.beginPath()
                ctx.fillStyle = hm_color
                let alpha = Math.sqrt(c) / max
                ctx.globalAlpha = alpha > 1 ? 1 : alpha
                let coord = scale_coord(x * 3, y * 3)
                ctx.fillRect(coord.x, coord.y, -margin.x, margin.y)
                ctx.stroke()
            }
        })
    })

    // reset alpha
    ctx.globalAlpha = 1.0

    window.requestAnimationFrame(draw)
}

// track mouse movement on canvas
function mouse_move(evt) {
    // get mouse position relative to canvas
    let rect = canvas.getBoundingClientRect()
    let mouseX = evt.clientX - rect.left
    let mouseY = evt.clientY - rect.top

    // add to current line
    if (hasChanged && mouseDown)
    {
        // create if first point
        lines.push([{x: mouseX, y: mouseY}])
        hasChanged = false
    }
    else if (mouseDown && (draw_on_drag || magnet_held < 0))
    {
        lines[lines.length-1].push({x: mouseX, y: mouseY})
        lines[lines.length-1].color = draw_color
    }

    // move the selected magnet
    if (magnet_held >= 0)
    {
        magnets[magnet_held].x = mouseX - (magnets[magnet_held].width / 2)
        magnets[magnet_held].y = mouseY - (magnets[magnet_held].height / 2)
        lines[lines.length-1].color = magnets[magnet_held].color
    }
}

/**
 * function:    fetch_zebra
 * parameters:  match_key
 * returns:     none
 * description: Fetch zebra data for a given match from TBA.
 */
function fetch_zebra(match_key)
{
    match_plots = []

    if (!API_KEY)
    {
        return
    }

    // fetch zebra match data
    fetch(`https://www.thebluealliance.com/api/v3/match/${match_key}/zebra_motionworks${build_query({[TBA_KEY]: API_KEY})}`)
        .then(response => {
            if (response.status == 401) {
                alert('Invalid API Key Suspected')
            }
            return response.json()
        })
        .then(data => {
            match_plots = data
            heatmaps = {}

            Object.keys(bot_images).forEach(function (pos, i)
            {
                let parts = pos.split('_')

                // get teams points
                let num = document.getElementById(pos).value
                let points = match_plots.alliances[parts[0]].filter(t => t.team_key == `frc${num}`)[0]

                if (points)
                {
                    // move magnet to started position
                    if (points.xs[1] != null && points.ys[1] != null)
                    {
                        let point = scale_coord(points.xs[1], points.ys[1])
                        magnets[i].x = point.x - magnet_size / 2
                        magnets[i].y = point.y - magnet_size / 2
                    }

                    let heatmap = new Array(18).fill([])
                    heatmap.forEach((_,i) => heatmap[i] = new Array(9).fill(0))
                    data.times.forEach(function (t, i)
                    {
                        // build heatmap
                        if (i > 0 && i < data.times.length - 1 && points.xs[i] != null && points.ys[i] != null) {
                            let x = Math.floor(points.xs[i] / 3)
                            let y = Math.floor(points.ys[i] / 3)
                            heatmap[x][y]++
                        }
                    })
                    heatmaps[points.team_key.substr(3)] = heatmap
                }
            })

            // update sliders
            if (match_plots) {
                set_slider_max('trail_length', match_plots.times.length-1)
                set_slider_max('match_time', match_plots.times.length-1)
                set_slider('match_time', 1)
            }
        })
        .catch(err => {
            console.log('Error loading zebra data!', err)
        })
}

/**
 * function:    plot_zebra
 * parameters:  team position
 * returns:     none
 * description: Add lines and markers for selected team position.
 */
function plot_zebra(team)
{
    if (match_plots != null)
    {
        // get points and color for position
        let pos = Object.keys(bot_images)[team]
        let parts = pos.split('_')
        let color = wb[pos].color
        let num = document.getElementById(pos).value

        // find heatmap for team
        if (draw_heatmap)
        {
            heatmap = heatmaps[num]
            hm_color = get_wb_config(year)[pos].color
        }

        let points = match_plots.alliances[parts[0]].filter(t => t.team_key == `frc${num}`)[0]
        if (draw_trace && points && points.xs[1] != null && points.ys[1] != null)
        {
            // add start and end markers
            let point = scale_coord(points.xs[1], points.ys[1])
            point.color = 'green'
            markers.push(point)

            point = scale_coord(points.xs[match_plots.times.length-2], points.ys[match_plots.times.length-2])
            point.color = 'red'
            markers.push(point)

            // add line points
            lines.push([scale_coord(points.xs[1], points.ys[1])])
            for (let i = 1; i < match_plots.times.length-1; i++)
            {
                lines[lines.length-1].push(scale_coord(points.xs[i], points.ys[i]))
            }
            lines[lines.length-1].color = color
        }
    }
}

/**
 * function:    update_time
 * parameters:  none
 * returns:     none
 * description: Moves the magnets according to the selected time
 */
function update_time()
{
    let time = document.getElementById('match_time').value

    Object.keys(bot_images).forEach(function (pos, i)
    {
        let parts = pos.split('_')

        // get teams points
        let num = document.getElementById(pos).value
        let points = match_plots.alliances[parts[0]].filter(t => t.team_key == `frc${num}`)[0]

        if (points)
        {
            // move magnet to started position
            if (points.xs[time] != null && points.ys[time] != null)
            {
                let point = scale_coord(points.xs[time], points.ys[time])
                magnets[i].x = point.x - magnet_size / 2
                magnets[i].y = point.y - magnet_size / 2
            }
        }
    })
}

/**
 * function:    play_match
 * parameters:  speed to play at (1x = 0.1s per point)
 * returns:     none
 * description: Moves the magnets over time
 */
async function play_match(speed)
{
    for (let i = 1; i < match_plots.times.length - 1; i++)
    {
        set_slider('match_time', i)
        update_time()
        await new Promise(r => setTimeout(r, 100.0 / speed));
    }
}

/**
 * function:    scale_coord
 * parameters:  zebra x, y
 * returns:     Object containing scaled x and y coordinates
 * description: Scale zebra coords to properly draw on screen.
 */
function scale_coord(x, y, add_margin=true, invert_x=true)
{
    // TODO add to config
    let xm = add_margin ? wb.horizontal_margin : 0
    let ym = add_margin ? wb.vertical_margin : 0
    let ft2px = wb.field_height_px / wb.field_height_ft
    let scaled = { x: (xm + x * ft2px) / scale_factor, y: (ym + y * ft2px) / scale_factor }
    if (invert_x) {
        scaled.x = field_width - scaled.x
    }
    return scaled
}

// track mouse clicks on canvas
function mouse_down(evt)
{
    // get mouse position relative to canvas
    let rect = canvas.getBoundingClientRect()
    let mouseX = evt.clientX - rect.left
    let mouseY = evt.clientY - rect.top

    // start drawing
    mouseDown = true
    hasChanged = true
    // pick up the clicked magnet
    let over = intersects_image(mouseX, mouseY)
    if (over >= 0)
    {
        magnet_held = over
    }
}

function mouse_right(evt)
{
    evt.preventDefault()
    clear_whiteboard()

    // get mouse position relative to canvas
    let rect = canvas.getBoundingClientRect()
    let mouseX = evt.clientX - rect.left
    let mouseY = evt.clientY - rect.top

    // pick up the clicked magnet
    let over = intersects_image(mouseX, mouseY)
    if (over >= 0 && over < Object.keys(bot_images).length)
    {
        plot_zebra(over)
    }
}

function mouse_up(evt)
{
    // stop drawing
    mouseDown = false
    hasChanged = true
    // release any held magnets
    magnet_held = -1
}

/**
 * function:    init_page
 * parameters:  contents card, buttons container, reload event
 * returns:     matches
 * description: Fetch simple event matches from localStorage. Initialize page contents.
 */
function init_page(contents_card, buttons_container, reload=true)
{
    // fill in page template
    contents_card.innerHTML = '<canvas id="whiteboard"></canvas>'

    // load in match data
    if (reload)
    {
        load_event()
    }

    let red_buttons = matches[0].alliances.red.team_keys.map(function (team, i)
    {
        return build_num_entry(`red_${i+1}`, `Red ${i+1}`, '', bounds=[0, 10000])
    })
    let blue_buttons = matches[0].alliances.blue.team_keys.map(function (team, i)
    {
        return build_num_entry(`blue_${i+1}`, `Blue ${i+1}`, '', bounds=[0, 10000])
    })
    blue_buttons.push(build_button('update_teams', 'Update Teams', 'update_teams()'))

    buttons_container.innerHTML = '<br>' +
        build_page_frame('Controls', [
            build_column_frame('', [
                '<span id="add_element_container"></span>',
                build_checkbox('draw_drag', 'Draw on Drag', false, 'draw_drag()'),
                build_select('path_type', 'Path Type ', ['Heatmap', 'Trace', 'Both'], 'Heatmap', 'set_path_type()'),
                build_button('clear_lines', 'Clear Lines', 'clear_whiteboard()'),
                build_button('reset_whiteboard', 'Reset Whiteboard', 'init()'),
                build_select('elims', 'Match Type', ['Qual', 'Elim'], 'Qual', 'build_match_list()')
            ])
        ]) +
        build_page_frame('Playback', [
            build_column_frame('', [
                build_multi_button('play_match', 'Play at', ['1x', '10x', '50x'], ['play_match(1)', 'play_match(10)', 'play_match(50)']),
                build_slider('match_time', 'Match Time', 1, 1, 1, 1, 'update_time()'),
                build_slider('trail_length', 'Trail Length', 0, 1, 10, 0, 'update_trail()')
            ])
        ]) +
        build_page_frame('Team Avatars', [
            build_column_frame('Red Teams', red_buttons),
            build_column_frame('Blue Teams', blue_buttons)
        ])

    build_match_list()

    init_canvas()

    // add magnets and start drawing
    init()
}

/**
 * function:    init_canvas
 * parameters:  none
 * returns:     none
 * description: Setup whiteboard canvas.
 */
function init_canvas()
{
    // determine available space as preview width - padding - card padding - extra
    let preview_width = preview.offsetWidth - 16 - 32 - 4
    let preview_height = preview.offsetHeight - 16 - 32 - 4

    // determine scaling factor based on most limited dimension
    let scale_factor_w = wb.field_width / preview_width
    let scale_factor_h = wb.field_height / preview_height
    let old_scale_factor = scale_factor
    if (scale_factor_w > scale_factor_h)
    {
        scale_factor = scale_factor_w
    }
    else
    {
        scale_factor = scale_factor_h
    }

    // get properties from config
    draw_color = wb.draw_color
    field_height = wb.field_height / scale_factor
    field_width = wb.field_width / scale_factor
    magnet_size = wb.magnet_size / scale_factor
    line_width = wb.line_width / scale_factor

    // resize canvas
    canvas = document.getElementById('whiteboard')
    canvas.style.backgroundImage = `url('/config/field-${year}.png')`
    canvas.width = field_width
    canvas.height = field_height

    // track mouse movement on canvas
    canvas.addEventListener('touchmove', function (evt)
    {
        mouse_move(evt.touches[0])
        evt.preventDefault();
    }, false)
    canvas.addEventListener('mousemove', mouse_move, false)

    // track mouse clicks on canvas
    canvas.addEventListener('touchstart', function (evt)
    {
        mouse_down(evt.touches[0])
        evt.preventDefault();
    }, false)
    canvas.addEventListener('mousedown', mouse_down, false)
    canvas.addEventListener('touchend', mouse_up, false)
    canvas.addEventListener('mouseup', mouse_up, false)
    canvas.addEventListener('contextmenu', mouse_right, false)

    // adjust magnets to fit new scale
    magnets.forEach(function (mag)
    {
        let mag_scale_factor = old_scale_factor / scale_factor
        mag.x *= mag_scale_factor
        mag.y *= mag_scale_factor
        mag.width *= mag_scale_factor
        mag.height *= mag_scale_factor
    })
}