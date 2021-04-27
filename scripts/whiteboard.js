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
var magnetHeld = -1
var draw_on_drag = false

var mouseDown = false
var hasChanged = true

var matches

// read parameters from URL
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const year = event_id.substr(0,4)

// red alliance team images
var red1 = new Image()
var red2 = new Image()
var red3 = new Image()

// blue alliance team images
var blue1 = new Image()
var blue2 = new Image()
var blue3 = new Image()

var game_pieces = {}

/**
 * function:    open_match
 * parameters:  selected match number
 * returns:     none
 * description: Updates robot images with selected match.
 */
function open_match(match_num)
{
    let use_elims = document.getElementById('elims').checked

    // iterate through each match obj
    matches.forEach(function (match, index) {
        let level = match.comp_level
        if ((level == 'qm' && !use_elims) || (level != 'qm' && use_elims))
        {
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
                document.getElementById('red1').value = red_teams[0].substr(3)
                document.getElementById('red2').value = red_teams[1].substr(3)
                document.getElementById('red3').value = red_teams[2].substr(3)
                
                document.getElementById('blue1').value = blue_teams[0].substr(3)
                document.getElementById('blue2').value = blue_teams[1].substr(3)
                document.getElementById('blue3').value = blue_teams[2].substr(3)

                update_teams()

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
    red1.src = get_avatar(document.getElementById('red1').value, year)
    red2.src = get_avatar(document.getElementById('red2').value, year)
    red3.src = get_avatar(document.getElementById('red3').value, year)
    
    blue1.src = get_avatar(document.getElementById('blue1').value, year)
    blue2.src = get_avatar(document.getElementById('blue2').value, year)
    blue3.src = get_avatar(document.getElementById('blue3').value, year)
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
    let use_elims = document.getElementById('elims').checked
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
        build_match_list()
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
    lines = []
    magnets = []
    let wb = get_wb_config(year)
    create_magnet(wb.red_1.x / scale_factor, wb.red_1.y / scale_factor, red1, wb.red_1.color)
    create_magnet(wb.red_2.x / scale_factor, wb.red_2.y / scale_factor, red2, wb.red_2.color)
    create_magnet(wb.red_3.x / scale_factor, wb.red_3.y / scale_factor, red3, wb.red_3.color)
    create_magnet(wb.blue_1.x / scale_factor, wb.blue_1.y / scale_factor, blue1, wb.blue_1.color)
    create_magnet(wb.blue_2.x / scale_factor, wb.blue_2.y / scale_factor, blue2, wb.blue_2.color)
    create_magnet(wb.blue_3.x / scale_factor, wb.blue_3.y / scale_factor, blue3, wb.blue_3.color)

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
            ctx.lineTo(p.x, p.y)
        })
        ctx.lineWidth = line_width
        ctx.strokeStyle = line.color
        ctx.stroke()
    })

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
    
// track mouse clicks on canvas
function mouse_down(evt) {
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

function mouse_up(evt) {
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
    let preview = document.getElementById('preview')
    contents_card.innerHTML = '<canvas id="whiteboard"></canvas>'
    buttons_container.innerHTML = '<br>' +
        build_page_frame('Controls', [
            build_column_frame('', [
                build_checkbox('draw_drag', 'Draw on Drag', false, 'draw_drag()'),
                '<span id="add_element_container"></span>',
                build_button('clear_lines', 'Clear Lines', 'clear_whiteboard()'),
                build_button('reset_whiteboard', 'Reset Whiteboard', 'init()'),
                build_button('update_teams', 'Update Teams', 'update_teams()'),
                build_checkbox('elims', 'Elimination Matches', false, 'build_match_list()')
            ])
        ]) +
        build_page_frame('Team Avatars', [
            build_column_frame('Red Teams', [build_num_entry('red1', 'Red 1', '', bounds=[0, 10000]),
                                            build_num_entry('red2', 'Red 2', '', bounds=[0, 10000]),
                                            build_num_entry('red3', 'Red 3', '', bounds=[0, 10000])]),
            build_column_frame('Blue Teams', [build_num_entry('blue1', 'Blue 1', '', bounds=[0, 10000]),
                                            build_num_entry('blue2', 'Blue 2', '', bounds=[0, 10000]),
                                            build_num_entry('blue3', 'Blue 3', '', bounds=[0, 10000])])
        ])

    // load in match data
    if (reload)
    {
        load_event()
    }

    // determine available space as preview width - padding - card padding - extra
    let preview_width = preview.offsetWidth - 16 - 32 - 4
    let preview_height = preview.offsetHeight - 16 - 32 - 4

    // get canvas config
    let wb = get_wb_config(year)

    // determine scaling factor based on most limited dimension
    let scale_factor_w = wb.field_width / preview_width
    let scale_factor_h = wb.field_height / preview_height
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

    // add magnets and start drawing
    init()
}
