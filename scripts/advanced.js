/**
 * file:        advanced.js
 * description: Computes and displays advanced statistics that require special calculation or data.
 * author:      Liam Fruzyna
 * date:        2021-05-21
 */

// read parameters from URL
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const year = event_id.substr(0,4)
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

var teams = []
var matches = []
var zebra_data = {}
var match_stats = []
var team_stats = []

var field_width
var field_height
var scale_factor = 1

var count = 0
var start = 0
var first

var wb = get_wb_config(year)

/**
 * function:    wait
 * parameters:  resolve and reject functions
 * returns:     none
 * description: Waits for match fetch to complete.
 */
function wait(resolve, reject)
{
    if (count == matches.length)
    {
        resolve(count)
    }
    else if (Date.now() - start > 20000)
    {
        reject()
    }
    else
    {
        document.getElementById('progress').innerHTML = `${count}/${matches.length}`
        document.getElementById('progress').value = count
        document.getElementById('progress').max = matches.length
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
    // base layer of page with loading text
    contents_card.innerHTML = '<h2>Zebra data is loading...</h2><progress id="progress" value="0" max="100"></progress>'
    buttons_container.innerHTML = '<div id="data" class="column"></div><canvas id="whiteboard"></canvas>'

    // load in teams
    let file_name = get_event_teams_name(event_id)
    if (localStorage.getItem(file_name) != null)
    {
        teams = JSON.parse(localStorage.getItem(file_name))
        build_options_list(teams)

        // load in matches
        file_name = get_event_matches_name(event_id)
        if (localStorage.getItem(file_name) != null)
        {
            // get zebra data for each match
            matches = JSON.parse(localStorage.getItem(file_name))
            matches.forEach(m => fetch_zebra(m.key, zebra_data, match_stats))

            // wait for fetches to complete to render page
            start = Date.now()
            new Promise(wait).then(function (val)
            {
                if (val != matches.length)
                {
                    alert(`${matches.length - val} matches failed to load`)
                }
                fill_page(contents_card)
            })
            .catch(function (e)
            {
                console.log(e)
                alert('Zebra data loading timed out')
                fill_page(contents_card)
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
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Render page on data is fetched.
 */
function fill_page(contents_card)
{
    // replace loading with team info
    contents_card.innerHTML = `<img id="avatar">
                                <h2><span id="team_num">No Team Selected</span> <span id="team_name"></span></h2>
                                <h3 id="location"></h3>
                                <h3 id="ranking"></h3>`

    
    // open the first team and start drawing
    open_option(first)
    setup_picklists()
    init_canvas()

    window.requestAnimationFrame(draw);
}

/**
 * function:    build_options_list
 * parameters:  teams
 * returns:     none
 * description: Completes left select team pane with teams from event data.
 */
function build_options_list(teams)
{
    first = ''
    // iterate through team objs
    teams.forEach(function (team)
    {
        let number = team.team_number
        // determine if the team has already been scouted
        let scouted = 'not_scouted'
        if (first == '')
        {
            first = number
        }

        // replace placeholders in template and add to screen
        document.getElementById('option_list').innerHTML += build_option(number, scouted)
    })
    scroll_to('option_list', `option_${first}`)
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
    calculate_team_stats()
    let team = team_stats[team_num]

    // build stats table
    let data = `<table>
    <tr><th>Max Speed</th><td>${team.max_speed} ft/s</td><td>${format_rank(team.max_speed_rank)}</td></tr>
    <tr><th>Max Acceleration</th><td>${team.max_accel} ft/s2</td><td>${format_rank(team.max_accel_rank)}</td></tr>
    <tr><th>Max Cycles</th><td>${team.max_cycles}</td><td>${format_rank(team.max_cycles_rank)}</td></tr>
    <tr><th>Avg Cycles</th><td>${team.avg_cycles}</td><td>${format_rank(team.avg_cycles_rank)}</td></tr>
    <tr><th>Attempts Climb</th><td>${team.climb_pct}%</td><td>${format_rank(team.climb_pct_rank)}</td></tr>
    <tr><th>Min Climb</th><td>${team.min_climb} secs</td><td>${format_rank(team.min_climb_rank)}</td></tr>
    <tr><th>Avg Climb</th><td>${team.avg_climb} secs</td><td>${format_rank(team.avg_climb_rank)}</td></tr>
    </table>`
    document.getElementById('data').innerHTML = build_card('data_card', data)

    ws(team_num)
}

/**
 * function:    format_rank
 * parameters:  rank
 * returns:     none
 * description: Formats rank to be more readable.
 */
function format_rank(rank)
{
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
    else
    {
        rank += 'th'
    }
    return `(${rank})`
}

/**
 * function:    calculate_team_stats
 * parameters:  none
 * returns:     none
 * description: Calculate stats and rankings for each team based of all matches.
 */
function calculate_team_stats()
{
    teams.forEach(function (t)
    {
        // calculate base stats
        let team_num = t.team_number
        let team = { 'team': team_num }
        let team_matches = match_stats.filter(s => parseInt(s.team) == team_num)
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
        
        // build heatmap of all matches
        if (team_matches.length > 0)
        {
            let heatmap = team_matches[0].heatmap
            heatmap.forEach(function (col, c)
            {
                col.forEach(function (_, r)
                {
                    team_matches.forEach(function (t, i)
                    {
                        if (i > 0)
                        {
                            let x = c
                            let y = r
                            if (t.pos.startsWith('blue'))
                            {
                                x = 17 - c
                                y = 8 - r
                            }
                            heatmap[x][y] += t.heatmap[c][r]
                        }
                    })
                })
            })
            team.heatmap = heatmap
        }

        // save start and end markers
        let markers = []
        team_matches.forEach(function (t)
        {
            let blue = t.pos.startsWith('blue')
            let point = scale_coord(t.x_start, t.y_start, true, !blue, blue)
            point.color = 'green'
            markers.push(point)
            point = scale_coord(t.x_end, t.y_end, true, !t.pos.startsWith('blue'), t.pos.startsWith('blue'))
            point.color = 'red'
            markers.push(point)
        })
        team.markers = markers

        team_stats[team_num] = team
    })

    // compute rankings
    let max_speeds = team_stats.map(t => t.max_speed).sort((a, b) => b - a)
    let max_accels = team_stats.map(t => t.max_accel).sort((a, b) => b - a)
    let max_cycles = team_stats.map(t => t.max_cycles).sort((a, b) => b - a)
    let avg_cycles = team_stats.map(t => t.avg_cycles).sort((a, b) => b - a)
    let min_climbs = team_stats.map(t => t.min_climb).sort()
    let avg_climbs = team_stats.map(t => t.avg_climb).sort()
    let climb_pcts = team_stats.map(t => t.climb_pct).sort((a, b) => b - a)
    team_stats.forEach(function (team)
    {
        team.max_speed_rank = max_speeds.indexOf(team.max_speed) + 1
        team.max_accel_rank = max_accels.indexOf(team.max_accel) + 1
        team.max_cycles_rank = max_cycles.indexOf(team.max_cycles) + 1
        team.avg_cycles_rank = avg_cycles.indexOf(team.avg_cycles) + 1
        team.min_climb_rank = min_climbs.indexOf(team.min_climb) + 1
        team.avg_climb_rank = avg_climbs.indexOf(team.avg_climb) + 1
        team.climb_pct_rank = climb_pcts.indexOf(team.climb_pct) + 1
    })
}

/**
 * function:    fetch_zebra
 * parameters:  match_key, zebra data container, match stats container
 * returns:     none
 * description: Fetch zebra data for a given match from TBA.
 */
function fetch_zebra(match_key, zebra_data, stats)
{
    // fetch simple event matches
    fetch(`https://www.thebluealliance.com/api/v3/match/${match_key}/zebra_motionworks${build_query({ [TBA_KEY]: API_KEY })}`)
        .then(response => {
            if (response.status == 401)
            {
                // log to prevent user spam
                console.log('Invalid API Key Suspected')
            }
            return response.json()
        })
        .then(data => {
            zebra_data[match_key] = data

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
                teams.forEach(function (pos)
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
                        heatmap.forEach((_,i) => heatmap[i] = new Array(9).fill(0))
                        data.times.forEach(function (t, i)
                        {
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
                                    console.log('Removing', points.team_key, speeds[speeds.length-1], i, points.xs[i], points.ys[i])
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
                        })

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
                })
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
    field_height = wb.field_height / scale_factor
    field_width = wb.field_width / scale_factor

    // resize canvas
    canvas = document.getElementById('whiteboard')
    canvas.style.backgroundImage = `url('config/field-${year}.png')`
    canvas.width = field_width
    canvas.height = field_height
    canvas.addEventListener('mousedown', mouse_down, false)

    // fix markers
    calculate_team_stats()
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
            markers.forEach(function (point)
            {
                ctx.beginPath()
                ctx.arc(point.x, point.y, 5 / scale_factor, 0, 2 * Math.PI, false)
                ctx.fillStyle = point.color
                ctx.fill()
                ctx.lineWidth = 3 / scale_factor
                ctx.strokeStyle = '#000000'
                ctx.stroke()
            })
        }

        // draw heatmap
        let heatmap = stats.heatmap
        if (heatmap)
        {
            let margin = scale_coord(3, 3, false, false)
            let max = Math.sqrt(Math.max(...heatmap.flat()))
            heatmap.forEach(function (r, x)
            {
                r.forEach(function (c, y)
                {
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
                })
            })
        }
    }

    // reset alpha
    ctx.globalAlpha = 1.0

    window.requestAnimationFrame(draw)
}