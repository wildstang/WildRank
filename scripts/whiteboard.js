/**
 * file:        whiteboard.js
 * description: Renders the whiteboard.
 * author:      Liam Fruzyna
 * date:        2020-03-10
 */

var mouseX = 0
var mouseY = 0
var canvas

var magnets = []
var lines = []
var magnetHeld = -1

var dozer = new Image()
dozer.src = "/config/dozer.png"

var robot = new Image()
robot.src = "/config/robot.png"

var mouseDown = false
var hasChanged = true

window.addEventListener("load", function() {
    canvas = document.getElementById("whiteboard")
    canvas.width = 1494
    canvas.height = 790
    
    canvas.addEventListener("mousemove", function(evt) {
        var rect = canvas.getBoundingClientRect()
        mouseX = evt.clientX - rect.left
        mouseY = evt.clientY - rect.top
        if (hasChanged && mouseDown)
        {
            lines.push([{x: mouseX, y: mouseY}])
            hasChanged = false
        }
        else if (mouseDown)
        {
            lines[lines.length-1].push({x: mouseX, y: mouseY})
            lines[lines.length-1].color = "#FFFFFF"
        }
        if (magnetHeld >= 0)
        {
            magnets[magnetHeld].x = mouseX - (magnets[magnetHeld].width / 2)
            magnets[magnetHeld].y = mouseY - (magnets[magnetHeld].height / 2)
            lines[lines.length-1].color = magnets[magnetHeld].color
        }
    }, false)
    
    canvas.addEventListener("mousedown", function(evt) {
        let over = intersects_image(mouseX, mouseY)
        mouseDown = true
        hasChanged = true
        if (over >= 0)
        {
            magnetHeld = over
        }
    }, false)
    
    canvas.addEventListener("mouseup", function(evt) {
        let over = intersects_image(mouseX, mouseY)
        mouseDown = false
        hasChanged = true
        if (magnetHeld >= 0)
        {
            magnetHeld = -1
        }
    }, false)

    init()
})

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
    obj.width = 100
    obj.height = 100
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
    create_magnet(250, 125, dozer, "#0000FF")
    create_magnet(250, 375, dozer, "#0000FF")
    create_magnet(250, 625, dozer, "#0000FF")
    create_magnet(1150, 125, robot, "#FF0000")
    create_magnet(1150, 375, robot, "#FF0000")
    create_magnet(1150, 625, robot, "#FF0000")

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
    ctx.clearRect(0, 0, 1494, 790)

    magnets.forEach(function (image, index)
    {
        if (image.img.complete)
        {
            ctx.drawImage(image.img, image.x, image.y, image.width, image.height)
        }
    })

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