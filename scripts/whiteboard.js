/**
 * file:        whiteboard.js
 * description: Renders the whiteboard.
 * author:      Liam Fruzyna
 * date:        2020-03-10
 */

var magnet_size
var field_width
var field_height
var line_width

var scale_factor = 1

var mouseX = 0
var mouseY = 0
var canvas
var draw_color

var magnets = []
var lines = []
var markers = []
var magnetHeld = -1
var draw_on_drag = false
var trail_length = 0
var match_plots = []

var mouseDown = false
var hasChanged = true

var matches
var match_key

// read parameters from URL
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const year = event_id.substr(0,4)

var bot_images = {}
var game_pieces = {}

/**
 * function:    open_match
 * parameters:  selected match number
 * returns:     none
 * description: Updates robot images with selected match.
 */
function open_match(match_num)
{
    init()
    let use_elims = get_selected_option('elims') == 1

    // iterate through each match obj
    matches.forEach(function (match, index) {
        let level = match.comp_level
        if ((level == 'qm' && !use_elims) || (level != 'qm' && use_elims))
        {
            match_key = match.key
            let number = match.match_number
            let red_teams = match.alliances.red.team_keys
            let blue_teams = match.alliances.blue.team_keys
            let set = match.set_number
            let match_id = `${level.substr(0, 1).toUpperCase()}${set}${number}`
            let match_div = document.getElementById(`match_${match_id}`)

            // find the desired qualifying match
            if (match_id == match_num)
            {
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

                fetch_zebra(match_key)

                // select option
                match_div.classList.add('selected')
            }
            else if (match_div.classList.contains('selected'))
            {
                match_div.classList.remove('selected')
            }
        }
    })
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
            let set = match.set_number
            let match_id = `${level.substr(0, 1).toUpperCase()}${set}${number}`
            let match_name = `${level.substr(0, 1).toUpperCase()}${number}`

            if (first == '')
            {
                first = match_id
            }

            // replace placeholders in template and add to screen
            document.getElementById('option_list').innerHTML += build_match_option(match_id, red_teams, blue_teams, '', match_name)
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
    magnets.forEach( function (image, index)
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
    magnets.forEach(function (image, index)
    {
        if (image.img.complete)
        {
            ctx.drawImage(image.img, image.x, image.y, image.width, image.height)
        }
    })

    markers.forEach(function (point, idx)
    {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI, false);
        ctx.fillStyle = point.color;
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#000000';
        ctx.stroke();
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
            let points = match_plots.alliances[parts[0]][parts[1]]
            
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

    window.requestAnimationFrame(draw)
}

// track mouse movement on canvas
function mouse_move(evt) {
    // get mouse position relative to canvas
    var rect = canvas.getBoundingClientRect()
    mouseX = evt.clientX - rect.left
    mouseY = evt.clientY - rect.top

    // add to current line
    if (hasChanged && mouseDown)
    {
        // create if first point
        lines.push([{x: mouseX, y: mouseY}])
        hasChanged = false
    }
    else if (mouseDown && (draw_on_drag || magnetHeld < 0))
    {
        lines[lines.length-1].push({x: mouseX, y: mouseY})
        lines[lines.length-1].color = draw_color
    }

    // move the selected magnet
    if (magnetHeld >= 0)
    {
        magnets[magnetHeld].x = mouseX - (magnets[magnetHeld].width / 2)
        magnets[magnetHeld].y = mouseY - (magnets[magnetHeld].height / 2)
        lines[lines.length-1].color = magnets[magnetHeld].color
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

    // fetch simple event matches
    fetch(`https://www.thebluealliance.com/api/v3/match/${match_key}/zebra_motionworks${build_query({[TBA_KEY]: 'g4Wgdb1euHxs8W83KQyxRC8mKws8uqwDkjTci5PLM5WX63vKbhFyRgjlVBq7VMQr'})}`)
        .then(response => {
            if (response.status == 401) {
                alert('Invalid API Key Suspected')
            }
            return response.json()
        })
        .then(data => {
            match_plots = data

            Object.keys(bot_images).forEach(function (pos, i)
            {
                let parts = pos.split('_')
                
                // get teams points
                let points = match_plots.alliances[parts[0]][parts[1]]

                if (points)
                {
                    let speeds = []
                    let accels = []
                    match_plots.times.forEach(function (t, i)
                    {
                        if (i > 0 && i < match_plots.times.length - 6)
                        {
                            speeds.push(Math.abs(distance(points.xs[i], points.ys[i], points.xs[i+5], points.ys[i+5]) * 2))
                            let last = speeds.length - 1
                            if (i > 1)
                            {
                                accels.push(Math.abs(speeds[last] - speeds[last-1]))
                            }
                        }
                    })
                    console.log('Max Speed:', Math.max(...speeds), 'FPPS')
                    console.log('Max Accel:', Math.max(...accels), 'FPPSPS')

                    // move magnet to started position
                    if (points.xs[1] != null && points.ys[1] != null)
                    {
                        let point = scale_coord(points.xs[1], points.ys[1])
                        magnets[i].x = point.x - magnet_size / 2
                        magnets[i].y = point.y - magnet_size / 2
                    }
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

function zebra_stats(keys, results)
{
    if (keys.length > 0)
    {
        // fetch simple event matches
        fetch(`https://www.thebluealliance.com/api/v3/match/${keys.pop()}/zebra_motionworks${build_query({[TBA_KEY]: 'g4Wgdb1euHxs8W83KQyxRC8mKws8uqwDkjTci5PLM5WX63vKbhFyRgjlVBq7VMQr'})}`)
            .then(response => {
                if (response.status == 401) {
                    alert('Invalid API Key Suspected')
                }
                return response.json()
            })
            .then(data => {
                let max_x = results.max_x;
                let min_x = results.min_x;
                let max_y = results.max_y;
                let min_y = results.min_y;

                Object.keys(bot_images).forEach(function (pos, i)
                {
                    
                    if (data && data.alliances)
                    {
                        // get points for team
                        let parts = pos.split('_')
                        let points = match_plots.alliances[parts[0]][parts[1]]

                        if (points.xs[0])
                        {
                            if (Math.max(...points.xs) > max_x)
                            {
                                max_x = Math.max(...points.xs)
                            }
                            else if (Math.min(...points.xs) < min_x)
                            {
                                min_x = Math.min(...points.xs)
                            }
                            if (Math.max(...points.ys) > max_y)
                            {
                                max_y = Math.max(...points.ys)
                            }
                            else if (Math.min(...points.ys) < min_y)
                            {
                                min_y = Math.min(...points.ys)
                            }
                        }
                    }
                })

                results = {
                    max_x: max_x,
                    min_x: min_x,
                    max_y: max_y,
                    min_y: min_y
                }
                zebra_stats(keys, results)
            })
            .catch(err => {
                console.log('Error loading zebra data!', err)
            })
    }
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
        let wb = get_wb_config(year)
    
        // get points and color for position
        let pos = Object.keys(bot_images)[team]
        let parts = pos.split('_')
        let points = match_plots.alliances[parts[0]][parts[1]]
        let color = wb[pos].color
    
        if (points.xs[1] != null && points.ys[1] != null)
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
        let points = match_plots.alliances[parts[0]][parts[1]]

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
function scale_coord(x, y)
{
    let scale = 0.85
    let offset = (1 - scale) / 4
    let max_x = 50
    let max_y = 25
    return {x: 3 * offset * field_width + scale * (-x + max_x) * field_width / max_x, y: offset * field_height + scale * y * field_height / max_y}
}

// track mouse clicks on canvas
function mouse_down(evt)
{
    // get mouse position relative to canvas
    var rect = canvas.getBoundingClientRect()
    mouseX = evt.clientX - rect.left
    mouseY = evt.clientY - rect.top

    // start drawing
    mouseDown = true
    hasChanged = true
    // pick up the clicked magnet
    let over = intersects_image(mouseX, mouseY)
    if (over >= 0)
    {
        magnetHeld = over
    }
}

function mouse_right(evt)
{
    evt.preventDefault()
    clear_whiteboard()

    // get mouse position relative to canvas
    var rect = canvas.getBoundingClientRect()
    mouseX = evt.clientX - rect.left
    mouseY = evt.clientY - rect.top

    // pick up the clicked magnet
    let over = intersects_image(mouseX, mouseY)
    if (over >= 0 && over < bot_images.length)
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
    magnetHeld = -1
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

    // get canvas config
    let wb = get_wb_config(year)

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
    canvas.addEventListener('touchmove', function(evt) {
        mouse_move(evt.touches[0])
        evt.preventDefault();
    }, false)
    canvas.addEventListener('mousemove', mouse_move, false)
    
    // track mouse clicks on canvas
    canvas.addEventListener('touchstart', function(evt) {
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