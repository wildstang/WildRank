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

// playback status
const STOPPED  = 0
const RUNNING  = 1
const PAUSED   = 2
const STOPPING = 3

var status = STOPPED

/**
 * function:    open_match
 * parameters:  selected match key
 * returns:     none
 * description: Updates robot images with selected match.
 */
function open_match(match_key)
{
    deselect_all()
    
    let match_div = document.getElementById(`match_option_${match_key}`)
    if (match_div != null)
    {
        // update avatars
        bot_images = {}
        let teams = dal.get_match_teams(match_key)
        let keys = dal.get_team_keys()
        let red_teams = new ColumnFrame('red_teams', 'Red Teams')
        let blue_teams = new ColumnFrame('blue_teams', 'Blue Teams')
        for (let team of Object.keys(teams))
        {
            let entry = new Entry(team, keys[team], teams[team])
            entry.type = 'number'
            entry.bounds = [0, 10000]
            entry.on_text_change = 'update_teams()'
            if (team.startsWith('red'))
            {
                red_teams.add_input(entry)
            }
            else if (team.startsWith('blue'))
            {
                blue_teams.add_input(entry)
            }
            
            bot_images[team] = new Image()
        }

        document.getElementById('teams').innerHTML = red_teams.toString + blue_teams.toString

        update_teams()

        fetch_zebra(match_key)

        // select option
        match_div.classList.add('selected')
    }

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
    let names = Object.keys(bot_images)
    for (let pos of names)
    {
        bot_images[pos].src = get_avatar(document.getElementById(pos).value, year)
    }
}

/**
 * function:    filter_team
 * parameters:  none
 * returns:     none
 * description: Responds to team filter dropdown change and rebuilds match list
 */
function filter_team()
{
    let s = document.getElementById('team_filter')
    build_match_list(s.options[s.selectedIndex].text)
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
        case 2:cfg.whiteboard
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
    for (let index in magnets)
    {
        let image = magnets[index]
        if (x > image.x && y > image.y && x < image.x + image.width - 1 && y < image.y + image.height)
        {
            i = index
        }
    }
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
 * function:    init
 * parameters:  none
 * returns:     none
 * description: Place magnets on the field and start drawing.
 */
function init() {
    clear_whiteboard()
    magnets = []
    let bi_names = Object.keys(bot_images)
    for (let pos of bi_names)
    {
        create_magnet(cfg.whiteboard[pos].x / scale_factor, cfg.whiteboard[pos].y / scale_factor, bot_images[pos], cfg.whiteboard[pos].color)
    }

    // determine game piece by game
    for (let piece of cfg.whiteboard.game_pieces)
    {
        let image = new Image()
        image.src = `assets/${piece.image}`
        game_pieces[piece.name] = image
    }

    let names = Object.keys(game_pieces)
    let button = new MultiButton('add_game_piece', 'Add Game Piece', names, names.map(name => `add_game_piece('${name}')`))
    document.getElementById('add_element_container').innerHTML = button.toString

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
    for (let image of magnets)
    {
        if (image.img.complete)
        {
            ctx.beginPath()
            ctx.drawImage(image.img, image.x, image.y, image.width, image.height)
            ctx.stroke()
        }
    }

    for (let point of markers)
    {
        ctx.beginPath()
        ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI, false)
        ctx.fillStyle = point.color
        ctx.fill()
        ctx.lineWidth = 5
        ctx.strokeStyle = '#000000'
        ctx.stroke()
    }

    // draw each line
    for (let line of lines)
    {
        ctx.beginPath()
        for (let index in line)
        {
            let p = line[index]
            if (index == 0)
            {
                ctx.beginPath(p.x, p.y)
            }
            else
            {
                ctx.lineTo(p.x, p.y)
            }
        }
        ctx.lineWidth = line_width
        ctx.strokeStyle = line.color
        ctx.stroke()
    }

    // draw trails during match playback
    if (trail_length > 0 && match_plots != null && match_plots.alliances != null)
    {
        // get current match time
        let now = document.getElementById('match_time').value
        let names = Object.keys(bot_images)
        for (let i in names)
        {
            let pos = names[i]
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
        }
    }

    // draw heatmap
    let margin = scale_coord(3, 3, false, false)
    let max = Math.sqrt(Math.max(...heatmap.flat()))
    for (let x in heatmap)
    {
        x = parseInt(x)
        for (let y in heatmap[x])
        {
            y = parseInt(y)
            let c = heatmap[x][y]
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
        }
    }

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
    
    if (!TBA_KEY)
    {
        let file = cfg.keys
        if (file != null)
        {
            if (cfg.keys.hasOwnProperty('tba'))
            {
                TBA_KEY = cfg.keys.tba
            }
        }
        if (!TBA_KEY)
        {
            document.getElementById('playback').style.display = 'none'
            console.log('No API key found for TBA!')
            return
        }
    }

    // fetch zebra match data
    fetch(`https://www.thebluealliance.com/api/v3/match/${match_key}/zebra_motionworks${build_query({[TBA_AUTH_KEY]: TBA_KEY})}`)
        .then(response => {
            if (response.status == 401) {
                alert('Invalid API Key Suspected')
            }
            return response.json()
        })
        .then(data => {
            match_plots = data
            heatmaps = {}

            let names = Object.keys(bot_images)
            for (let i in names)
            {
                let pos = names[i]
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
                    for (let i in heatmap)
                    {
                        heatmap[i] = new Array(9).fill(0)
                    }
                    for (let i in data.times)
                    {
                        // build heatmap
                        if (i > 0 && i < data.times.length - 1 && points.xs[i] != null && points.ys[i] != null) {
                            let x = Math.floor(points.xs[i] / 3)
                            let y = Math.floor(points.ys[i] / 3)
                            heatmap[x][y]++
                        }
                    }
                    heatmaps[points.team_key.substr(3)] = heatmap
                }
            }

            // update sliders
            if (match_plots)
            {
                set_slider_max('trail_length', match_plots.times.length-1)
                set_slider_max('match_time', match_plots.times.length-1)
                set_slider('match_time', 1)
                document.getElementById('playback').style.display = 'inline-block'
            }
            // hide playback controls
            else
            {
                document.getElementById('playback').style.display = 'none'
            }
        })
        .catch(err => {
            console.log('Error loading zebra data!', err)

            // hide playback controls
            document.getElementById('playback').style.display = 'none'
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
        let color = cfg.whiteboard[pos].color
        let num = document.getElementById(pos).value

        // find heatmap for team
        if (draw_heatmap)
        {
            heatmap = heatmaps[num]
            hm_color = cfg.whiteboard[pos].color
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

    let names = Object.keys(bot_images)
    for (let i in names)
    {
        let pos = names[i]
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
    }
}

/**
 * function:    pause_match
 * parameters:  none
 * returns:     none
 * description: Pauses playback if running, resumes if paused.
 */
function pause_match()
{
    if (status == RUNNING)
    {
        document.getElementById('play_match').innerHTML = 'Play'
        status = PAUSED
    }
    else if (status == PAUSED)
    {
        document.getElementById('play_match').innerHTML = 'Pause'
        status = RUNNING
    }
    else
    {
        set_slider('match_time', 1)
        play_match()
    }
}

/**
 * function:    play_match
 * parameters:  none
 * returns:     none
 * description: Moves the magnets over time
 */
async function play_match()
{
    if (status != STOPPED)
    {
        status = STOPPING
        while (status != STOPPED)
        {
            await new Promise(r => setTimeout(r, 10))
        }
    }
    let i = 1;
    status = RUNNING
    document.getElementById('play_match').innerHTML = 'Pause'
    while (i < match_plots.times.length - 1)
    {
        if (status == STOPPING)
        {
            break
        }
        if (status == RUNNING)
        {
            let slider = document.getElementById('match_time').value
            if (slider != i - 1)
            {
                i = slider
            }
            else
            {
                set_slider('match_time', i)
            }
            update_time()
            ++i;
        }
        let speed = document.getElementById('playback_speed').value
        await new Promise(r => setTimeout(r, 100.0 / speed))
    }
    status = STOPPED
    document.getElementById('play_match').innerHTML = 'Play'
}

/**
 * function:    scale_coord
 * parameters:  zebra x, y
 * returns:     Object containing scaled x and y coordinates
 * description: Scale zebra coords to properly draw on screen.
 */
function scale_coord(x, y, add_margin=true, invert_x=true)
{
    let xm = add_margin ? cfg.whiteboard.horizontal_margin : 0
    let ym = add_margin ? cfg.whiteboard.vertical_margin : 0
    let ft2px = cfg.whiteboard.field_height_px / cfg.whiteboard.field_height_ft
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
function init_page()
{
    // fill in page template
    contents_card.innerHTML = '<canvas id="whiteboard"></canvas>'

    let first = populate_matches()
    add_dropdown_filter('team_filter', [''].concat(Object.keys(dal.teams)), 'hide_matches()')
    if (first)
    {
        let draw_drag = new Checkbox('draw_drag', 'Draw on Drag')
        draw_drag.onclick = 'draw_drag()'
        let path_type = new Select('path_type', 'Path Type', ['Heatmap', 'Trace', 'Both'], 'Heatmap')
        path_type.onselect = 'set_path_type()'
        let clear_lines = new Button('clear_lines', 'Clear Lines', 'clear_whiteboard()')
        let reset_whiteboard = new Button('reset_whiteboard', 'Reset Whiteboard', 'init()')
        let controls = new ColumnFrame('', '', ['<span id="add_element_container"></span>', draw_drag, clear_lines, reset_whiteboard])

        let play_match = new Button('play_match', 'Play', 'pause_match()')
        let playback_speed = new Slider('playback_speed', 'Play at', 10)
        playback_speed.bounds = [1, 50, 1]
        let match_time = new Slider('match_time', 'Match Time', 1)
        match_time.bounds = [1, 1, 1]
        match_time.oninput = 'update_time()'
        let trail_length = new Slider('trail_length', 'Trail Length', 0)
        trail_length.bounds = [0, 1, 10]
        trail_length.oninput = 'update_trail()'
        let playback = new ColumnFrame('', '', [play_match, playback_speed, match_time, trail_length])

        buttons_container.innerHTML = '<br>' +
            new PageFrame('controls', 'Controls', [controls]).toString +
            new PageFrame('playback', 'Playback', [playback]).toString +
            new PageFrame('teams_page', 'Teams', ['<span id="teams"></span>']).toString
        
        open_match(first)

        init_canvas()
    
        // add magnets and start drawing
        init()
    }
}

/**
 * function:    hide_match
 * parameters:  none
 * returns:     none
 * description: Rebuilds the match list based on the selected team.
 */
function hide_matches()
{
    let team = document.getElementById('team_filter').value
    let first = populate_matches(true, true, team)
    open_match(first)
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
    let preview_width = preview.offsetWidth - 16 - 32 - 8
    let preview_height = preview.offsetHeight - 16 - 32 - 8

    // determine scaling factor based on most limited dimension
    let scale_factor_w = cfg.whiteboard.field_width / preview_width
    let scale_factor_h = cfg.whiteboard.field_height / preview_height
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
    draw_color = cfg.whiteboard.draw_color
    field_height = cfg.whiteboard.field_height / scale_factor
    field_width = cfg.whiteboard.field_width / scale_factor
    magnet_size = cfg.whiteboard.magnet_size / scale_factor
    line_width = cfg.whiteboard.line_width / scale_factor

    // resize canvas
    canvas = document.getElementById('whiteboard')
    canvas.style.backgroundImage = `url('assets/field-${year}.png')`
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
    for (let mag of magnets)
    {
        let mag_scale_factor = old_scale_factor / scale_factor
        mag.x *= mag_scale_factor
        mag.y *= mag_scale_factor
        mag.width *= mag_scale_factor
        mag.height *= mag_scale_factor
    }
}