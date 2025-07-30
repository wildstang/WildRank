let touching = false

/**
 * @class Line Represents a series of points to be drawn on a Whiteboard.
 */
class Line
{
    /**
     * Creates an empty instance of Line.
     * 
     * @param {string} color Color to draw the points in.
     */
    constructor(color)
    {
        this.x_points = []
        this.y_points = []
        this.color = color
    }

    /**
     * Add a single point to the end of the Line.
     * 
     * @param {number} x X-coordinate
     * @param {number} y Y-coordinate
     */
    add_point(x, y)
    {
        this.x_points.push(x)
        this.y_points.push(y)
    }

    /**
     * Returns the length of the Line.
     * 
     * @return {number} Number of x-coordinates.
     */
    get num_points()
    {
        return this.x_points.length
    }
}

/**
 * @class Magnet Represents a single whiteboard magnet.
 */
class Magnet
{
    /**
     * Creates an instance of Magnet.
     * 
     * @param {string} name Name of the magnet, normally team number.
     * @param {Image} image Image to draw.
     * @param {number} x Starting x-coordinate
     * @param {number} y Starting y-coordinate
     * @param {string} color Color used to draw a trace of the Magnet history.
     */
    constructor(name, image, x, y, color)
    {
        this.name = name
        this.image = image
        this.x = x
        this.y = y
        this.color = color
    }

    /**
     * Move the Magnet to a given point in time on a given line.
     * 
     * @param {Line} line Line to draw from.
     * @param {number} time Index of the line.
     */
    move_to(line, time)
    {
        this.x = line.x_points[time]
        this.y = line.y_points[time]
    }
}

/**
 * @class Whiteboard represents a whiteboard canvas and all interactions with it directly.
 * Helper functions should be used to connect it to other UI elements.
 */
class Whiteboard
{
    /**
     * Creates an instance of Whiteboard.
     */
    constructor(interactive=true)
    {
        this.lines = []
        this.magnets = []
        this.traces = []

        this.canvas = create_element('canvas', 'whiteboard')
        this.canvas.style.backgroundImage = `url('assets/${cfg.year}/field-${cfg.year}.png')`

        this.scale_factor = 0
        this.field_height = 0
        this.field_width = 0
        this.magnet_size = 0
        this.line_width = 0
        this.drawing = false
        this.carrying = -1
        this.draw_drag = false

        this.current_match = ''

        if (interactive)
        {
            this.canvas.addEventListener('mousedown', event => this.handle_click(event, 'down'))
            this.canvas.addEventListener('mousemove', event => this.handle_click(event, 'move'))
            this.canvas.addEventListener('mouseup', event => this.handle_click(event, 'up'))
            // disable touch events for browsers that do not support them
            if (window.TouchEvent !== undefined)
            {
                this.canvas.addEventListener('touchstart', event => this.handle_click(event, 'down'))
                this.canvas.addEventListener('touchmove', event => this.handle_click(event, 'move'))
                this.canvas.addEventListener('touchend', event => this.handle_click(event, 'up'))
            }
        }
    }

    /**
     * Update the canvas dimensions based on given dimensions.
     * 
     * @param {number} width Desired Element width in pixels.
     * @param {number} height Desired Element height in pixels.
     */
    update_dimensions(width, height)
    {
        // determine scaling factor for magnets and lines
        let horizontal_scale_factor = cfg.game.whiteboard.field_width / width
        let vertical_scale_factor = cfg.game.whiteboard.field_height / height
        let prev_scale_factor = this.scale_factor
        this.scale_factor = Math.max(horizontal_scale_factor, vertical_scale_factor)

        // determine actual canvas, magnet, and line dimensions
        this.field_height = cfg.game.whiteboard.field_height / this.scale_factor
        this.field_width = cfg.game.whiteboard.field_width / this.scale_factor
        this.magnet_size = cfg.game.whiteboard.magnet_size / this.scale_factor
        this.line_width = cfg.game.whiteboard.line_width / this.scale_factor

        // rescale any existing lines and magents
        let rescale_factor = prev_scale_factor / this.scale_factor
        for (let line of this.lines)
        {
            for (let i = 0; i < line.num_points; i++)
            {
                line.x_points[i] *= rescale_factor
                line.y_points[i] *= rescale_factor
            }
        }
        for (let magnet of this.magnets)
        {
            magnet.x *= rescale_factor
            magnet.y *= rescale_factor
        }
    }

    /**
     * Remove all lines from the Whiteboard, re-draw.
     */
    clear_lines()
    {
        this.lines = []
    }

    /**
     * Remove all magnets and lines from the Whiteboard, re-draw.
     */
    clear()
    {
        this.magnets = []
        this.clear_lines()
    }

    /**
     * Reload the current match.
     */
    reset()
    {
        this.load_match(this.current_match)
    }

    /**
     * Constructs a new magnet and adds it to the whiteboard.
     * 
     * @param {string} name Name of the magnet, normally team number.
     * @param {number} x Starting x-coordinate, center if not provided
     * @param {number} y Starting y-coordinate, center if not provided
     */
    add_game_piece(name, x=-1, y=-1)
    {
        // use center if coordinates not provided
        x = x < 0 ? this.field_width / 2 : 0
        y = y < 0 ? this.field_height / 2 : 0

        // find the image in the config
        let gp = cfg.game.whiteboard.gp_names.indexOf(name)
        if (gp >= 0)
        {
            let image = new Image()
            image.src = `assets/${cfg.year}/${cfg.game.whiteboard.gp_images[gp]}`
    
            // create and add the magnet
            this.magnets.push(new Magnet(name, image, x, y, 'white'))
        }
    }

    /**
     * Manually adds a team to the whiteboard.
     * 
     * @param {number} team_num Team number
     * @param {string} alliance Optional alliance color
     * @param {number} position Optional alliance position
     */
    add_team(team_num, alliance='white', position=-1)
    {
        // create an image from using the avatar
        let image = new Image()
        image.src = dal.teams[team_num].avatar

        // create a magnet to scale using the configured color and position
        let x = cfg.game.whiteboard.field_width / 2
        let y = cfg.game.whiteboard.field_height / 2
        if (Object.keys(cfg.game.whiteboard).includes(`${alliance}_${position}`))
        {
            let c = cfg.game.whiteboard[`${alliance}_${position}`]
            x = c.x
            y = c.y
            alliance = c.color
        }
        this.magnets.push(new Magnet(team_num, image, x / this.scale_factor, y / this.scale_factor, alliance))
    }

    /**
     * Loads in teams and avatars for a given match key.
     * 
     * @param {string} match_key Unique match identifier 
     */
    load_match(match_key)
    {
        // remove everything from the canvas
        this.clear()

        // get teams belonging to the match and create magnets
        let teams = dal.get_match_teams(match_key)
        let keys = Object.keys(teams)
        for (let key of keys)
        {
            let team = teams[key]

            // create an image from using the avatar
            let image = new Image()
            image.src = dal.teams[team].avatar

            let parts = key.split('_')
            let alliance = parts[0]
            let i = parseInt(parts[1])

            // create a magnet to scale using the configured color
            let c = cfg.game.whiteboard
            let x = c[`${alliance}_xs`][i] / this.scale_factor
            let y = c[`${alliance}_ys`][i] / this.scale_factor
            let color = c[`${alliance}_color`]
            this.magnets.push(new Magnet(team, image, x, y, color))
        }

        this.current_match = match_key
    }

    /**
     * Handle all mouse events on the canvas.
     * 
     * @param {MouseEvent} event Event from the listener.
     * @param {string} type Event type (down, move, up)
     */
    handle_click(event, type)
    {
        // if touch event, disable mouse events until up
        if (window.TouchEvent !== undefined && event instanceof TouchEvent)
        {
            touching = true
        }
        else if (touching)
        {
            return
        }

        // get mouse position relative to canvas
        let rect = this.canvas.getBoundingClientRect()
        let x = event.pageX - rect.left
        let y = event.pageY - rect.top
        let magnet_size = this.magnet_size / this.scale_factor
        let offset = magnet_size / 2

        if (type === 'down')
        {
            // determine if a magnet was clicked on
            let color = 'white'
            for (let i in this.magnets)
            {
                let m = this.magnets[i]
                if (x > m.x - offset && y > m.y - offset && x < m.x + offset && y < m.y + offset)
                {
                    // if so assume its color and pick it up
                    this.carrying = i
                    color = m.color
                    break
                }
            }

            // if no magnet was picked up or draw on drag is configured
            if (this.carrying < 0 || this.draw_drag)
            {
                // create and begin drawing a new line of the appropriate color
                this.lines.push(new Line(color))
                this.drawing = true
                this.lines[this.lines.length - 1].add_point(x, y)
            }
        }
        else if (type === 'move' && (this.drawing || this.carrying >= 0))
        {
            // if no magnet is carried or draw on drag is configured
            if (this.carrying < 0 || this.draw_drag)
            {
                // add points to the current line
                this.lines[this.lines.length - 1].add_point(x, y)
            }

            // if a magnet is carried
            if (this.carrying >= 0 && this.carrying < this.magnets.length)
            {
                // move it with the mouse
                this.magnets[this.carrying].x = x
                this.magnets[this.carrying].y = y
            }
        }
        else
        {
            // drop any carried magnet and end any line
            this.drawing = false
            this.carrying = -1
            touching = false
        }
    }

    /**
     * Draw all magnets and lines on the whiteboard
     */
    draw()
    {
        this.canvas.width = this.field_width
        this.canvas.height = this.field_height

        // reset the canvas
        let context = this.canvas.getContext('2d')
        context.globalCompositeOperation = 'destination-over'
        context.clearRect(0, 0, this.field_width, this.field_height)

        // draw each magnet with its coordinate being the center point
        let offset = this.magnet_size / 2
        for (let magnet of this.magnets)
        {
            context.beginPath()
            context.drawImage(magnet.image, magnet.x - offset, magnet.y - offset, this.magnet_size, this.magnet_size)
            context.stroke()
        }

        // draw each line and trace
        for (let line of this.lines.concat(this.traces))
        {
            context.beginPath(line.x_points[0], line.y_points[0])
            for (let i = 1; i < line.num_points; i++)
            {
                context.lineTo(line.x_points[i], line.y_points[i])
            }
            context.lineWidth = this.line_width
            context.strokeStyle = line.color
            context.stroke()
        }
    }

    /**
     * Redraw the canvas at 60 fps
     */
    start()
    {
        setInterval(this.draw.bind(this), 1000 / 60)
    }
}