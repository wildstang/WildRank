/**
 * TODO:
 * 
 * - unify drawing colors (drag, trace, heatmap)
 * - custom heatmaps (one team over event)
 */

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
     * Override all coordinates with the given arrays.
     * 
     * @param {array} xs Ordered x-coordinates
     * @param {array} ys Ordered y-coordinates
     */
    ingest_points(xs, ys)
    {
        this.x_points = xs
        this.y_points = ys
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

    /**
     * Returns a subset of the current Line.
     * 
     * @param {number} start Position in the Line to start from.
     * @param {number} length Length of points to go backwards from the start.
     * @returns A new Line object using the same color and a subset of points.
     */
    sub_line(start, length)
    {
        if (start < length)
        {
            length = start
        }
        let line = new Line(this.color)
        line.ingest_points(this.x_points.slice(start - length, start),
                           this.y_points.slice(start - length, start))
        return line
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
     * 
     * @param {symbol} on_load A reference to a function to call when a match is loaded.
     */
    constructor(on_load, interactive=true)
    {
        this.lines = []
        this.magnets = []
        this.traces = []

        this.match_traces = {}
        this.heatmaps = {}

        this.canvas = document.createElement('canvas')
        this.canvas.id = 'whiteboard'
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
        this.heatmap_team = ''
        this.on_load = on_load

        if (interactive)
        {
            this.canvas.addEventListener('mousedown', event => this.handle_click(event, 'down'))
            this.canvas.addEventListener('mousemove', event => this.handle_click(event, 'move'))
            this.canvas.addEventListener('mouseup', event => this.handle_click(event, 'up'))
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
        let horizontal_scale_factor = cfg.whiteboard.field_width / width
        let vertical_scale_factor = cfg.whiteboard.field_height / height
        let prev_scale_factor = this.scale_factor
        this.scale_factor = Math.max(horizontal_scale_factor, vertical_scale_factor)

        // determine actual canvas, magnet, and line dimensions
        this.field_height = cfg.whiteboard.field_height / this.scale_factor
        this.field_width = cfg.whiteboard.field_width / this.scale_factor
        this.magnet_size = cfg.whiteboard.magnet_size / this.scale_factor
        this.line_width = cfg.whiteboard.line_width / this.scale_factor

        // rescale any existing lines
        let rescale_factor = prev_scale_factor / this.scale_factor
        for (let line of this.lines)
        {
            for (let i = 0; i < line.num_points; i++)
            {
                line.x_points[i] *= rescale_factor
                line.y_points[i] *= rescale_factor
            }
        }

        // re-draw
        this.draw()
    }

    /**
     * Remove all lines from the Whiteboard, re-draw.
     */
    clear_lines()
    {
        this.lines = []
        this.draw()
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
     * Arranges magnets on the Whiteboard to match zebra data at a given time index.
     * 
     * @param {number} time Time index (1/10 seconds)
     * @param {number} trail_length Trail length in points
     */
    set_match_time(time, trail_length)
    {
        this.traces = []
        if (Object.keys(this.match_traces).includes(this.current_match))
        {
            for (let magnet of this.magnets)
            {
                if (Object.keys(this.match_traces[this.current_match]).includes(magnet.name))
                {
                    let line = this.match_traces[this.current_match][magnet.name]
                    magnet.move_to(line, time)
                    this.traces.push(line.sub_line(time, trail_length))
                }
            }

            this.draw()
        }
    }

    /**
     * Returns the number of points in the match. Subtracts 10 to remove garbage at the end.
     * 
     * @returns The length of the match in 1/10 seconds.
     */
    get_match_length()
    {
        if (this.match_traces[this.current_match])
        {
            let traces = Object.values(this.match_traces[this.current_match])
            if (traces.length > 0)
            {
                return traces[0].num_points - 10
            }
        }
        return 0
    }

    /**
     * Set the team or other heatmap to display, re-draw. Disable with any other string.
     * 
     * @param {string} team Team number, alliance name, or all. Case-insensitive
     */
    set_heatmap_team(team)
    {
        this.heatmap_team = team.toLowerCase()
        this.draw()
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
        let gp = cfg.whiteboard.game_pieces.filter(p => p.name === name)
        if (gp.length > 0)
        {
            let image = new Image()
            image.src = `assets/${gp[0].image}`
    
            // create and add the magnet
            this.magnets.push(new Magnet(name, image, x, y, 'white'))

            // re-draw
            this.draw()
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
        image.src = dal.get_value(team_num, 'pictures.avatar')

        // create a magnet to scale using the configured color and position
        let x = cfg.whiteboard.field_width / 2
        let y = cfg.whiteboard.field_height / 2
        if (Object.keys(cfg.whiteboard).includes(`${alliance}_${position}`))
        {
            let c = cfg.whiteboard[`${alliance}_${position}`]
            x = c.x
            y = c.y
            alliance = c.color
        }
        this.magnets.push(new Magnet(team_num, image, x / this.scale_factor, y / this.scale_factor, alliance))

        // inform the UI the Whiteboard is ready
        this.on_load()

        // re-draw
        this.draw()
    }

    /**
     * Loads in teams, avatars, and zebra data for a given match key.
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
            image.src = dal.get_value(team, 'pictures.avatar')

            // create a magnet to scale using the configured color
            let c = cfg.whiteboard[key]
            this.magnets.push(new Magnet(team, image, c.x / this.scale_factor, c.y / this.scale_factor, c.color))
        }

        this.current_match = match_key

        // if a set of match traces hasn't been created
        if (!Object.keys(this.match_traces).includes(match_key))
        {
            // attempt to fetch zebra data from TBA
            this.fetch_match_traces(match_key)
        }
        else
        {
            // inform the UI the Whiteboard is ready
            this.on_load()
        }

        // re-draw
        this.draw()
    }

    /**
     * Fetch zebra data from The Blue Alliance.
     * 
     * @param {string} match_key Unique match identifier
     */
    fetch_match_traces(match_key)
    {
        // grab TBA API key from config
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
                alert('No API key found for TBA!')
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
                // populate traces with lines for each team providing zebra data
                this.match_traces[match_key] = {}
                for (let color in data.alliances)
                {
                    for (let team in data.alliances[color])
                    {
                        let team_obj = data.alliances[color][team]
                        if (team_obj.xs[0])
                        {
                            let line = new Line(color)
                            // scale coordinates to match Whiteboard scale before ingesting
                            let [xs, ys] = this.scale_coords(team_obj.xs, team_obj.ys)
                            line.ingest_points(xs, ys)
                            this.match_traces[match_key][team_obj.team_key.substring(3)] = line
                        }
                    }
                }

                // draw the first frame of the match
                this.set_match_time(0)

                // build heatmaps using the same data
                this.build_match_heatmaps(match_key, data)

                // inform the UI the Whiteboard is ready
                this.on_load()
            })
            .catch(err => {
                console.log('Error loading zebra data!', err)

                // data was not found, inform the UI the Whiteboard is ready
                this.on_load()
            })
    }

    /**
     * Scale a set of coordinates from TBA to match the canvas.
     * 
     * @param {array} xs X-coordinates
     * @param {array} ys Y-coordinates
     * @param {boolean} add_margin Whether to account for margin.
     * @param {boolean} invert_x Whether to invert the x-axis.
     * 
     * @returns {array} Scaled x and y coordinates in an wrapper array.
     */
    scale_coords(xs, ys, add_margin=true, invert_x=true)
    {
        let xm = add_margin ? cfg.whiteboard.horizontal_margin : 0
        let ym = add_margin ? cfg.whiteboard.vertical_margin : 0
        let ft2px = cfg.whiteboard.field_height_px / cfg.whiteboard.field_height_ft
        xs = xs.map(x => this.scale_point(x, xm, ft2px, invert_x))
        ys = ys.map(y => this.scale_point(y, ym, ft2px, false))
        return [xs, ys]
    }

    /**
     * Scale a single point.
     * 
     * @param {number} p Single coordinate
     * @param {number} margin Amount of margin to account for.
     * @param {number} ft2px Ratio of feet to pixels.
     * @param {boolean} invert Whether to invert the axis.
     * 
     * @returns {number} Scaled coordinate.
     */
    scale_point(p, margin, ft2px, invert=false)
    {
        let sp = (margin + p * ft2px) / this.scale_factor
        if (invert) {
            sp = cfg.whiteboard.field_width / this.scale_factor - sp
        }
        return sp
    }

    /**
     * Populate the heatmaps for a given match.
     * 
     * @param {number} match_key Unique match identifier
     * @param {symbol} data Zebra data from TBA
     */
    build_match_heatmaps(match_key, data)
    {
        this.heatmaps[match_key] = {}

        // iterate over each alliance and team
        let combined_hm = this.create_heatmap()
        for (let color of Object.keys(data.alliances))
        {
            let alliance = data.alliances[color]
            let alliance_hm = this.create_heatmap()
            for (let i in alliance)
            {
                let points = alliance[i]
                let team_num = points.team_key.substring(3)

                let heatmap = this.create_heatmap()
                for (let i in data.times)
                {
                    // build heatmap using only valid data
                    if (i > 0 && i < data.times.length - 1 && points.xs[i] != null && points.ys[i] != null) {
                        // filter into 18x9 buckets
                        let x = Math.floor(points.xs[i] / 3)
                        let y = Math.floor(points.ys[i] / 3)

                        // flip the x-axis for blue alliance teams
                        x = color === 'blue' ? 17 - x : x

                        // add to a team, alliance, and match heatmap
                        heatmap[x][y]++
                        alliance_hm[x][y]++
                        combined_hm[x][y]++
                    }
                }
                this.heatmaps[match_key][team_num] = heatmap
            }
            this.heatmaps[match_key][color] = alliance_hm
        }
        this.heatmaps[match_key]['all'] = combined_hm
    }

    /**
     * Create an empty heatmap 2D-array.
     * 
     * @returns {array} Empty 18x9 array
     */
    create_heatmap()
    {
        let heatmap = new Array(18).fill([])
        for (let i in heatmap)
        {
            heatmap[i] = new Array(9).fill(0)
        }
        return heatmap
    }

    /**
     * Handle all mouse events on the canvas.
     * 
     * @param {MouseEvent} event Event from the listener.
     * @param {string} type Event type (down, move, up)
     */
    handle_click(event, type)
    {
        // get mouse position relative to canvas
        let rect = this.canvas.getBoundingClientRect()
        let x = event.clientX - rect.left
        let y = event.clientY - rect.top
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
        }

        // re-draw on every interaction
        this.draw()
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

        // draw the selected heatmap
        if (this.heatmaps[this.current_match] && this.heatmaps[this.current_match][this.heatmap_team])
        {
            let heatmap = this.heatmaps[this.current_match][this.heatmap_team]
            let max = Math.sqrt(Math.max(...heatmap.flat()))
            for (let x = 0; x < 18; x++)
            {
                for (let y = 0; y < 9; y++)
                {
                    context.beginPath()

                    // determine color by alliance, or white for all
                    let color = ''
                    if (this.match_traces[this.current_match] && this.match_traces[this.current_match][this.heatmap_team])
                    {
                        color = this.match_traces[this.current_match][this.heatmap_team].color
                    }
                    else if (this.heatmap_team === 'all' || this.current_match === 'teams')
                    {
                        color = 'white'
                    }
                    else
                    {
                        color = this.heatmap_team
                    }
                    context.fillStyle = color

                    // completely fill the square of the map
                    let x_tile = color == 'red' ? 17 - x : x
                    let alpha = Math.sqrt(parseFloat(heatmap[x_tile][y])) / max
                    context.globalAlpha = alpha
                    context.fillRect(x * this.field_width / 18, y * this.field_height / 9, this.field_width / 18, this.field_height / 9)
                    context.stroke()
                }
            }
        }
    }
}