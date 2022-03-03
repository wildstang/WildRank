/**
 * file:        advanced.js
 * description: Computes and displays advanced statistics that require special calculation or data.
 * author:      Liam Fruzyna
 * date:        2021-05-21
 */

// read parameters from URL
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

var num_matches = 0
var team_stats = []
var matches = []

var field_width
var field_height
var scale_factor = 1

var count = 0
var start = 0

var wb = {}

/**
 * function:    wait
 * parameters:  resolve and reject functions
 * returns:     none
 * description: Waits for match fetch to complete.
 */
function wait(resolve, reject)
{
    if (count == num_matches)
    {
        resolve(count)
    }
    else if (Date.now() - start > 20000)
    {
        reject()
    }
    else
    {
        document.getElementById('progress').innerHTML = `${count}/${num_matches}`
        document.getElementById('progress').value = count
        document.getElementById('progress').max = num_matches
        setTimeout(wait.bind(this, resolve, reject), 50)
    }
}

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch event teams and matches from localStorage. Initialize page contents.
 */
function init_page(contents_card, buttons_container)
{
    wb = get_wb_config(year)
    
    // base layer of page with loading text
    contents_card.innerHTML = '<h2>Zebra data is loading...</h2><progress id="progress" value="0" max="100"></progress>'
    buttons_container.innerHTML = '<div id="data" class="column"></div><canvas id="whiteboard"></canvas>'

    // load in teams
    let first = populate_teams()
    if (first)
    {
        let teams = JSON.parse(localStorage.getItem(get_event_teams_name(event_id)))

        // load in matches
        let file_name = get_event_matches_name(event_id)
        if (localStorage.getItem(file_name) != null)
        {
            // get zebra data for each match
            matches = JSON.parse(localStorage.getItem(file_name))
            let match_stats = []
            for (let m of matches)
            {
                fetch_zebra(m.key, match_stats)
            }
            num_matches = matches.length

            // wait for fetches to complete to render page
            start = Date.now()
            new Promise(wait).then(function (val)
            {
                if (val != num_matches)
                {
                    alert(`${num_matches - val} matches failed to load`)
                }
                fill_page(contents_card, teams, match_stats, first)
            })
            .catch(function (e)
            {
                console.log(e)
                alert('Zebra data loading timed out')
                fill_page(contents_card, teams, match_stats, first)
            })

        }
        else
        {
            contents_card.innerHTML = '<h2>No Match Data Found</h2>Please preload event'
        }
    }
    else
    {
        contents_card.innerHTML = '<h2>No Team Data Found</h2>Please preload event'
    }
}

/**
 * function:    fill_page
 * parameters:  contents card, teams, match stats, first team to open
 * returns:     none
 * description: Render page on data is fetched.
 */
function fill_page(contents_card, teams, match_stats, first)
{
    // replace loading with team info
    contents_card.innerHTML = `<img id="avatar">
                                <h2><span id="team_num">No Team Selected</span> <span id="team_name"></span></h2>
                                <h3 id="location"></h3>
                                <h3 id="ranking"></h3>`

    
    // open the first team and start drawing
    setup_picklists()
    init_canvas(teams, match_stats)
    calculate_team_stats(teams, match_stats)
    open_option(first)

    window.requestAnimationFrame(draw)
}

/**
 * function:    open_option
 * parameters:  Selected team number
 * returns:     none
 * description: Completes right info pane for a given team number.
 */
function open_option(team_num)
{
    // select new option
    deselect_all()
    document.getElementById(`option_${team_num}`).classList.add('selected')

    // populate top
    document.getElementById('avatar').src = get_avatar(team_num, event_id.substr(0, 4))
    document.getElementById('team_num').innerHTML = team_num
    document.getElementById('team_name').innerHTML = get_team_name(team_num, event_id)
    document.getElementById('location').innerHTML = get_team_location(team_num, event_id)

    // populate ranking
    let rankings = get_team_rankings(team_num, event_id)
    if (rankings)
    {
        document.getElementById('ranking').innerHTML = `Rank: ${rankings.rank} (${rankings.record.wins}-${rankings.record.losses}-${rankings.record.ties})`
    }

    // get team stats
    let team = team_stats[team_num]

    // build stats table
    let data = '<table>' +
        build_row('No Zebra Data', team.zebra, '', '') +
        build_row('Max Speed', team.max_speed, 'ft/s', team.max_speed_rank) +
        build_row('Max Acceleration', team.max_accel, 'ft/s2', team.max_accel_rank) +
        build_row('Max Cycles', team.max_cycles, '', team.max_cycles_rank) +
        build_row('Avg Cycles', team.avg_cycles, '', team.avg_cycles_rank) +
        build_row('Attempts Climb', team.climb_pct, '%', team.climb_pct_rank) +
        build_row('Min Climb', team.min_climb, 'secs', team.min_climb_rank) +
        build_row('Avg Climb', team.avg_climb, 'secs', team.avg_climb_rank) +
    '</table>'
    document.getElementById('data').innerHTML = build_card('data_card', data)

    // hide / display the whiteboard
    if (team_stats[team_num].markers.length > 0)
    {
        document.getElementById('whiteboard').style.display = 'inline-block'
    }
    else
    {
        document.getElementById('whiteboard').style.display = 'none'
    }

    ws(team_num)
}

/**
 * function:    build_row
 * parameters:  stat name, value, unit, rank
 * returns:     table row formatted stat
 * description: Formats stat for table, returns nothing if no stat.
 */
function build_row(name, value, unit, rank)
{
    if (typeof value === 'undefined')
    {
        return ''
    }

    rank = '' + rank
    if (rank.endsWith('1'))
    {
        rank += 'st'
    }
    else if (rank.endsWith('2'))
    {
        rank += 'nd'
    }
    else if (rank.endsWith('3'))
    {
        rank += 'rd'
    }
    else if (rank.length > 0)
    {
        rank += 'th'
    }

    return `<tr><th>${name}</th><td>${value} ${unit}</td><td>${rank}</td></tr>`
}

/**
 * function:    calculate_team_stats
 * parameters:  teams, match stats
 * returns:     none
 * description: Calculate stats and rankings for each team based of all matches.
 */
function calculate_team_stats(teams, match_stats)
{
    for (let t of teams)
    {
        // calculate base stats
        let team_num = t.team_number
        let team = { 'team': team_num }
        let team_matches = match_stats.filter(s => parseInt(s.team) == team_num)
        
        // build heatmap of all matches
        if (team_matches.length > 0)
        {
            let speeds = team_matches.map(s => s.max_speed)
            team.max_speed = Math.max(...speeds).toFixed(2)
            let accels = team_matches.map(s => s.max_accel)
            team.max_accel = Math.max(...accels).toFixed(2)
            let cycles = team_matches.map(s => s.cycles)
            team.max_cycles = Math.max(...cycles)
            team.avg_cycles = mean(cycles).toFixed(2)
            let climbs = team_matches.filter(s => s.climbed).map(s => s.climb)
            team.min_climb = Math.min(...climbs)
            team.avg_climb = mean(climbs).toFixed(2)
            team.climb_pct = (100 * climbs.length / team_matches.length).toFixed(2)

            let heatmap = team_matches[0].heatmap
            for (let c in heatmap)
            {
                c = parseInt(c)
                for (let r in heatmap[c])
                {
                    r = parseInt(r)
                    for (let i in team_matches)
                    {
                        let tm = team_matches[i]
                        if (i > 0)
                        {
                            let x = c
                            let y = r
                            if (tm.pos.startsWith('blue'))
                            {
                                x = 17 - c
                                y = 8 - r
                            }
                            heatmap[x][y] += tm.heatmap[c][r]
                        }
                    }
                }
            }
            team.heatmap = heatmap
        }
        else
        {
            // super smart hack to note no zebra data in the stats table
            team.zebra = `for ${team_num}`
        }

        // save start and end markers
        let markers = []
        for (let tm of team_matches)
        {
            let blue = tm.pos.startsWith('blue')
            let point = scale_coord(tm.x_start, tm.y_start, true, !blue, blue)
            point.color = 'green'
            markers.push(point)
            point = scale_coord(tm.x_end, tm.y_end, true, !tm.pos.startsWith('blue'), tm.pos.startsWith('blue'))
            point.color = 'red'
            markers.push(point)
        }
        team.markers = markers

        team_stats[team_num] = team
    }

    // compute rankings
    let max_speeds = team_stats.map(t => t.max_speed).sort((a, b) => b - a)
    let max_accels = team_stats.map(t => t.max_accel).sort((a, b) => b - a)
    let max_cycles = team_stats.map(t => t.max_cycles).sort((a, b) => b - a)
    let avg_cycles = team_stats.map(t => t.avg_cycles).sort((a, b) => b - a)
    let min_climbs = team_stats.map(t => t.min_climb).sort()
    let avg_climbs = team_stats.map(t => t.avg_climb).sort()
    let climb_pcts = team_stats.map(t => t.climb_pct).sort((a, b) => b - a)
    let vals = Object.values(team_stats)
    for (let team of vals)
    {
        if (team.markers.length > 0)
        {
            team.max_speed_rank = max_speeds.indexOf(team.max_speed) + 1
            team.max_accel_rank = max_accels.indexOf(team.max_accel) + 1
            team.max_cycles_rank = max_cycles.indexOf(team.max_cycles) + 1
            team.avg_cycles_rank = avg_cycles.indexOf(team.avg_cycles) + 1
            team.min_climb_rank = min_climbs.indexOf(team.min_climb) + 1
            team.avg_climb_rank = avg_climbs.indexOf(team.avg_climb) + 1
            team.climb_pct_rank = climb_pcts.indexOf(team.climb_pct) + 1
        }
    }
}

/**
 * function:    fetch_zebra
 * parameters:  match_key, match stats container
 * returns:     none
 * description: Fetch zebra data for a given match from TBA.
 */
function fetch_zebra(match_key, stats)
{
    // get match data
    fetch(`https://www.thebluealliance.com/api/v3/event/${event_id}/matches${build_query({ [TBA_AUTH_KEY]: TBA_KEY })}`)
        .then(response => {
            if (response.status == 401)
            {
                // log to prevent user spam
                console.log('Invalid API Key Suspected')
            }
            return response.json()
        })
        .then(data => {
            if (data && data.length > 0)
            {
                matches = data
            }
        })

    // fetch simple event matches
    fetch(`https://www.thebluealliance.com/api/v3/match/${match_key}/zebra_motionworks${build_query({ [TBA_AUTH_KEY]: TBA_KEY })}`)
        .then(response => {
            if (response.status == 401)
            {
                // log to prevent user spam
                console.log('Invalid API Key Suspected')
            }
            return response.json()
        })
        .then(data => {
            if (data && data.alliances)
            {
                // build list of teams
                let teams = data.alliances.red.map((t, i) => `red_${i}`)
                if (!teams)
                {
                    teams = []
                }
                teams = teams.concat(data.alliances.blue.map((t, i) => `blue_${i}`))
    
                // process zebra data for each team
                for (let pos of teams)
                {
                    // get teams points
                    let parts = pos.split('_')
                    let points = data.alliances[parts[0]][parts[1]]
    
                    if (points && points.xs[1] && points.ys[1])
                    {
                        let cycles = 0
                        let cycle_started = false
                        let under_since = 0
                        let speeds = []
                        let accels = []
                        let heatmap = new Array(18).fill([])
                        for (let i in heatmap)
                        {
                            heatmap[i] = new Array(9).fill(0)
                        }
                        for (let i in data.times)
                        {
                            i = parseInt(i)
                            // calculate speed and acceleration
                            if (i > 0 && i < data.times.length - 6)
                            {
                                speeds.push(Math.abs(distance(points.xs[i], points.ys[i], points.xs[i+5], points.ys[i+5]) * 2))
                                let last = speeds.length - 1
                                if (i > 5)
                                {
                                    accels.push(speeds[last] - speeds[last-5]*2)
                                }
                                if (speeds[speeds.length-1] > 20)
                                {
                                    //console.log('Removing', points.team_key, speeds[speeds.length-1], i, points.xs[i], points.ys[i])
                                    speeds.pop()
                                }
                                if (accels[accels.length-1] > 15)
                                {
                                    accels.pop()
                                }
                            }

                            if (i > 0 && i < data.times.length - 1)
                            {
                                // build heatmap
                                let x = Math.floor(points.xs[i] / 3)
                                let y = Math.floor(points.ys[i] / 3)
                                heatmap[x][y]++

                                // count cycles
                                y = pos.startsWith('blue') ? 26.9375 - points.ys[i] : points.ys[i]
                                x = pos.startsWith('blue') ? 52.4375 - points.xs[i] : points.xs[i]
                                if (x < 12)
                                {
                                    cycle_started = true
                                }
                                else if (((x > 26 && y < 8) || x > 34) && cycle_started)
                                {
                                    cycle_started = false
                                    cycles++
                                }

                                // count climb time
                                if (contained([{x: 22.8, y: 6}, {x: 20.9, y: 10.7}, {x: 32.2, y: 15.4}, {x: 34.3, y: 10.7}], x, y))
                                {
                                    if (under_since == 0)
                                    {
                                        under_since = i
                                    }
                                }
                                else
                                {
                                    under_since = 0
                                }
                            }
                        }

                        // filter out failed or unattempted climbs
                        let climbed = under_since > 0
                        let results = localStorage.getItem(get_match_result(match_key.split('_')[1].split('m')[1], points.team_key.substr(3), event_id))
                        if (climbed && results)
                        {
                            climbed = JSON.parse(results).match_teleop_climb_result > 1
                        }

                        // add to object
                        stats.push({ 'match': match_key, 'team': points.team_key.substr(3), 'pos': pos,
                            'x_start': points.xs[1], 'y_start': points.ys[1],
                            'x_end': points.xs[points.xs.length - 2], 'y_end': points.ys[points.ys.length - 2],
                            'max_speed': Math.max(...speeds), 'max_accel': Math.max(...accels),
                            'heatmap': heatmap, 'cycles': cycles, 'climb': (1500 - under_since) / 10, 'climbed': climbed
                        })
                    }
                }
            }
            count++
        })
        .catch(err => {
            console.log('Error loading zebra data!', err)
            count++
        })
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
    let preview_height = window.innerHeight / 2 - 16 - 32 - 4

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
    field_height = wb.field_height / scale_factor
    field_width = wb.field_width / scale_factor

    // resize canvas
    canvas = document.getElementById('whiteboard')
    canvas.style.backgroundImage = `url('config/field-${year}.png')`
    canvas.width = field_width
    canvas.height = field_height
    canvas.addEventListener('mousedown', mouse_down, false)

    // re-scale markers
    for (let stats of Object.values(team_stats))
    {
        let markers = stats.markers
        if (markers)
        {
            for (let point of markers)
            {
                point.x *= old_scale_factor / scale_factor
                point.y *= old_scale_factor / scale_factor
            }
        }
    }
}

/**
 * function:    mouse_down
 * parameters:  mouse event
 * returns:     nothing
 * description: Gets the point on the floor of the mouse click
 */
function mouse_down(evt)
{
    // get scaled mouse position relative to canvas
    let rect = canvas.getBoundingClientRect()
    let mouseX = (rect.right - evt.clientX) * scale_factor
    let mouseY = (evt.clientY - rect.top) * scale_factor

    // remove margin and convert to feet
    let xm = wb.horizontal_margin
    let ym = wb.vertical_margin
    let pxperft = wb.field_height_px / wb.field_height_ft
    let scaled = { x: (mouseX - xm) / pxperft, y: (mouseY - ym) / pxperft }

    alert(`${scaled.x.toFixed(1)}', ${scaled.y.toFixed(1)}'`)
}

/**
 * function:    scale_coord
 * parameters:  zebra x, y, to include margin, to invert x, to invert y
 * returns:     Object containing scaled x and y coordinates
 * description: Scale zebra coords to properly draw on screen.
 */
function scale_coord(x, y, add_margin=true, invert_x=true, invert_y=false)
{
    let xm = add_margin ? wb.horizontal_margin : 0
    let ym = add_margin ? wb.vertical_margin : 0
    let ft2px = wb.field_height_px / wb.field_height_ft
    let scaled = { x: (xm + x * ft2px) / scale_factor, y: (ym + y * ft2px) / scale_factor }

    // flip across field
    if (invert_x)
    {
        scaled.x = field_width - scaled.x
    }
    if (invert_y)
    {
        scaled.y = field_height - scaled.y
    }
    return scaled
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

    if (team_stats.length > 0)
    {
        let team = parseInt(document.getElementsByClassName('pit_option selected')[0].id.split('_')[1])
        let stats = team_stats[team]

        // draw markers
        let markers = stats.markers
        if (markers)
        {
            for (let point of markers)
            {
                ctx.beginPath()
                ctx.arc(point.x / 1, point.y / 1, 5 / scale_factor, 0, 2 * Math.PI, false)
                ctx.fillStyle = point.color
                ctx.fill()
                ctx.lineWidth = 3 / scale_factor
                ctx.strokeStyle = '#000000'
                ctx.stroke()
            }
        }

        // draw heatmap
        let heatmap = stats.heatmap
        if (heatmap)
        {
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
                        ctx.fillStyle = wb['red_1'].color
                        let alpha = Math.sqrt(c) / max
                        ctx.globalAlpha = alpha > 1 ? 1 : alpha
                        let coord = scale_coord(x * 3, y * 3)
                        ctx.fillRect(coord.x, coord.y, -margin.x, margin.y)
                        ctx.stroke()
                    }
                }
            }
        }
    }

    // reset alpha
    ctx.globalAlpha = 1.0

    window.requestAnimationFrame(draw)
}