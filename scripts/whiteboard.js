/**
 * file:        whiteboard.js
 * description: Renders the whiteboard.
 * author:      Liam Fruzyna
 * date:        2020-03-10
 */

// HTML template for a match option
const MATCH_BLOCK = "\
    <div id=\"match_MATCH_NUM\" class=\"match_option\" onclick=\"open_match(MATCH_NUM)\">\
        <span class=\"option_number\">QMATCH_NUM</span>\
        <span>\
            <div class=\"alliance red\">RED_TEAMS</div>\
            <div class=\"alliance blue\">BLUE_TEAMS</div>\
        </span>\
    </div>"

const CONTENTS = "<canvas id=\"whiteboard\"></canvas>"

const BUTTONS = "\
    <div class=\"page\">\
        <div class=\"column\">\
            <div class=\"wr_button\" onclick=\"clear_whiteboard()\">\
                <label>Clear</label>\
            </div>\
            <div class=\"wr_button\" onclick=\"init()\">\
                <label>Reset</label>\
            </div>\
            <div class=\"wr_button\" onclick=\"update_teams()\">\
                <label>Update Teams</label>\
            </div>\
        </div>\
        <div class=\"column\">\
            <h4 class=\"input_label\">Red 1</h4>\
            <input class=\"wr_number\" type=\"number\" id=\"red1\" min=\"0\" max=\"10000\"><br>\
            <h4 class=\"input_label\">Blue 1</h4>\
            <input class=\"wr_number\" type=\"number\" id=\"blue1\" min=\"0\" max=\"10000\"><br>\
        </div>\
        <div class=\"column\">\
            <h4 class=\"input_label\">Red 2</h4>\
            <input class=\"wr_number\" type=\"number\" id=\"red2\" min=\"0\" max=\"10000\"><br>\
            <h4 class=\"input_label\">Blue 2</h4>\
            <input class=\"wr_number\" type=\"number\" id=\"blue2\" min=\"0\" max=\"10000\"><br>\
        </div>\
        <div class=\"column\">\
            <h4 class=\"input_label\">Red 3</h4>\
            <input class=\"wr_number\" type=\"number\" id=\"red3\" min=\"0\" max=\"10000\"><br>\
            <h4 class=\"input_label\">Blue 3</h4>\
            <input class=\"wr_number\" type=\"number\" id=\"blue3\" min=\"0\" max=\"10000\"><br>\
        </div>\
    </div>"

const MAGNET_SIZE = 100

var mouseX = 0
var mouseY = 0
var canvas

var magnets = []
var lines = []
var magnetHeld = -1

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

/**
 * function:    open_match
 * parameters:  selected match number
 * returns:     none
 * description: Updates robot images with selected match.
 */
function open_match(match_num)
{
    // iterate through each match obj
    matches.forEach(function (match, index) {
        let level = match.comp_level
        let number = match.match_number
        let red_teams = match.alliances.red.team_keys
        let blue_teams = match.alliances.blue.team_keys
        // find the desired qualifying match
        if (level == "qm" && number == match_num)
        {
            // update avatars
            red1.src = get_avatar(red_teams[0].substr(3), year)
            red2.src = get_avatar(red_teams[1].substr(3), year)
            red3.src = get_avatar(red_teams[2].substr(3), year)
            
            blue1.src = get_avatar(blue_teams[0].substr(3), year)
            blue2.src = get_avatar(blue_teams[1].substr(3), year)
            blue3.src = get_avatar(blue_teams[2].substr(3), year)

            document.getElementById("red1").value = red_teams[0].substr(3)
            document.getElementById("red2").value = red_teams[1].substr(3)
            document.getElementById("red3").value = red_teams[2].substr(3)
            
            document.getElementById("blue1").value = blue_teams[0].substr(3)
            document.getElementById("blue2").value = blue_teams[1].substr(3)
            document.getElementById("blue3").value = blue_teams[2].substr(3)

            // select option
            document.getElementById("match_" + match_num).classList.add("selected")
        }
        else if (level == "qm" && document.getElementById("match_" + number).classList.contains("selected"))
        {
            document.getElementById("match_" + number).classList.remove("selected")
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
    red1.src = get_avatar(document.getElementById("red1").value, year)
    red2.src = get_avatar(document.getElementById("red2").value, year)
    red3.src = get_avatar(document.getElementById("red3").value, year)
    
    blue1.src = get_avatar(document.getElementById("blue1").value, year)
    blue2.src = get_avatar(document.getElementById("blue2").value, year)
    blue3.src = get_avatar(document.getElementById("blue3").value, year)
}

/**
 * function:    build_match_list
 * parameters:  none
 * returns:     none
 * description: Completes left select match pane with matches from event data.
 */
function build_match_list()
{
    let first = ""
    // iterate through each match obj
    matches.forEach(function (match, index) {
        let level = match.comp_level
        let number = match.match_number
        let red_teams = match.alliances.red.team_keys
        let blue_teams = match.alliances.blue.team_keys
        // filter out quals matches
        if (level == "qm")
        {
            if (first == "")
            {
                first = number
            }

            // replace placeholders in template and add to screen
            document.getElementById("option_list").innerHTML += MATCH_BLOCK.replace(/MATCH_NUM/g, number)
                                                                           .replace(/BLUE_TEAMS/g, blue_teams.join(" | "))
                                                                           .replace(/RED_TEAMS/g, red_teams.join(" | "))
                                                                           .replace(/frc/g, "")
        }
    })
    open_match(first)
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
    let file_name = "matches-" + event_id

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
    obj.width = MAGNET_SIZE
    obj.height = MAGNET_SIZE
    obj.color = color
    magnets.push(obj)
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
    create_magnet(250, 125, red1, "#FF0000")
    create_magnet(250, 375, red2, "#FF0000")
    create_magnet(250, 625, red3, "#FF0000")
    create_magnet(1150, 125, blue1, "#0000FF")
    create_magnet(1150, 375, blue2, "#0000FF")
    create_magnet(1150, 625, blue3, "#0000FF")

    window.requestAnimationFrame(draw);
}

/**
 * function:    draw
 * parameters:  none
 * returns:     none
 * description: Draw one frame of the whiteboard, including all magnets and lines.
 */
function draw() {
    var ctx = document.getElementById("whiteboard").getContext("2d")

    ctx.globalCompositeOperation = "destination-over"
    // reset canvas
    ctx.clearRect(0, 0, 1494, 790)

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
        ctx.lineWidth = 5
        ctx.strokeStyle = line.color
        ctx.stroke()
    })

    window.requestAnimationFrame(draw)
}

window.addEventListener("load", function() {
    // fill in page template
    document.getElementById("preview").innerHTML = document.getElementById("preview").innerHTML.replace(/CONTENTS/g, CONTENTS)
    document.getElementById("preview").innerHTML = document.getElementById("preview").innerHTML.replace(/BUTTONS/g, BUTTONS)
    // load in match data
    load_event()

    // resize canvas
    canvas = document.getElementById("whiteboard")
    canvas.width = 1494
    canvas.height = 790
    
    // track mouse movement on canvas
    canvas.addEventListener("mousemove", function(evt) {
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
        else if (mouseDown)
        {
            lines[lines.length-1].push({x: mouseX, y: mouseY})
            lines[lines.length-1].color = "#FFFFFF"
        }

        // move the selected magnet
        if (magnetHeld >= 0)
        {
            magnets[magnetHeld].x = mouseX - (magnets[magnetHeld].width / 2)
            magnets[magnetHeld].y = mouseY - (magnets[magnetHeld].height / 2)
            lines[lines.length-1].color = magnets[magnetHeld].color
        }
    }, false)
    
    // track mouse clicks on canvas
    canvas.addEventListener("mousedown", function(evt) {
        // start drawing
        mouseDown = true
        hasChanged = true
        // pick up the clicked magnet
        let over = intersects_image(mouseX, mouseY)
        if (over >= 0)
        {
            magnetHeld = over
        }
    }, false)
    canvas.addEventListener("mouseup", function(evt) {
        // stop drawing
        mouseDown = false
        hasChanged = true
        // release any held magnets
        magnetHeld = -1
    }, false)

    // add magnets and start drawing
    init()
})