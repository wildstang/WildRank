/**
 * file:        whiteboard.js
 * description: Creates and manages the whiteboard pages utilizing the Whiteboard object.
 * author:      Liam Fruzyna
 * date:        2023-12-24
 */

include('whiteboard_obj')

var whiteboard
var playing = false

/**
 * Function used by the application to initialize the whiteboard page.
 */
function init_page()
{
    // populate the match selection panel, get the first selected match
    let first = populate_matches()

    // create a dropdown filter for the match list and set the default value to the configured team
    let default_filter = ''
    if (cfg.settings.hasOwnProperty('team_number'))
    {
        default_filter = cfg.settings.team_number.toString()
    }
    let teams = Object.keys(dal.teams)
    teams.unshift('')
    add_dropdown_filter('team_filter', teams, 'hide_matches()', true, default_filter)

    if (first)
    {
        // create the whiteboard and add it to the card
        whiteboard = new Whiteboard(update_sliders)
        contents_card.appendChild(whiteboard.canvas)
        init_canvas()

        // create the whiteboard drawing controls and place them in a single column
        let game_piece = new MultiButton('game_piece', 'Add Game Piece')
        for (let gp of cfg.whiteboard.game_pieces)
        {
            game_piece.add_option(gp.name, `whiteboard.add_game_piece('${gp.name}')`)
        }
        game_piece.on_click = 'add_game_piece()'
        let draw_drag = new Checkbox('draw_drag', 'Draw on Drag')
        draw_drag.on_click = 'draw_drag()'
        let clear_lines = new Button('clear_lines', 'Clear Lines', 'whiteboard.clear_lines()')
        let reset_whiteboard = new Button('reset_whiteboard', 'Reset Whiteboard', 'whiteboard.reset()')
        let controls = new ColumnFrame('', '', [game_piece, draw_drag, clear_lines, reset_whiteboard])

        // create the various playback controls and place them in a single column
        let play_match = new Button('play_match', 'Play', 'play_match()')
        play_match.add_class('slim')
        let playback_speed = new Slider('playback_speed', 'Play at', 5)
        playback_speed.bounds = [1, 10, 1]
        playback_speed.add_class('slim')
        let match_time = new Slider('match_time', 'Match Time', 0)
        match_time.bounds = [0, 0, 1]
        match_time.on_change = 'update_time()'
        match_time.add_class('slim')
        let trail_length = new Slider('trail_length', 'Trail Length', 0)
        trail_length.bounds = [0, 1, 10]
        trail_length.on_change = 'update_time()'
        trail_length.add_class('slim')
        let playback = new ColumnFrame('', '', [play_match, playback_speed, match_time, trail_length])

        // create a container to place the teams dropdown in
        let teams_container = document.createElement('span')
        teams_container.id = 'teams'
        let teams = new ColumnFrame('', '', [teams_container])

        // populate the controls below the whiteboard in single column pages
        buttons_container.append(document.createElement('br'),
            new PageFrame('controls', 'Controls', [controls]).element,
            new PageFrame('playback', 'Playback', [playback]).element,
            new PageFrame('teams_page', 'Teams', [teams]).element)

        // update the match list
        hide_matches()
    }
    else
    {
        // display a warning if there is no match data to display
        let header = document.createElement('h2')
        header.innerText = 'No Match Data Found'
        contents_card.append(header, 'Please preload event.')
    }
}

/**
 * A function used by the hamburger menu mechanism to update the whiteboard size
 * when the menu is opened/closed.
 */
function init_canvas()
{
    let preview = document.getElementById('center')
    whiteboard.update_dimensions(preview.offsetWidth, preview.offsetHeight)
}

/**
 * A function used by the selection page filter mechanism to update the list of
 * matches on the left when a new team is selected in the filter.
 */
function hide_matches()
{
    // update the match list
    let team = document.getElementById('team_filter').value
    let first = populate_matches(true, true, team)

    // update the right panel
    open_option(first)
}

/**
 * A function used by the selection mechanism to update the right side of the
 * window when a new match is selected on the left.
 * 
 * @param {string} match_key Unique match identifier.
 */
function open_option(match_key)
{
    // select option
    deselect_all()
    document.getElementById(`match_option_${match_key}`).classList.add('selected')

    // load the match on the whiteboard, UI updates handled by update_sliders()
    whiteboard.load_match(match_key)
}

/**
 * A function passed to the whiteboard to update the sliders, populate the
 * dropdown, and pause any playback when a new match is opened.
 * 
 * @param {number} length Number of frames in the new match.
 */
function update_sliders(length)
{
    // reset previous match playback
    pause()
    Slider.set_slider('match_time', 1)

    // set the slider limits appropriately
    document.getElementById('match_time').max = length
    document.getElementById('trail_length').max = length

    // populate the dropdown with teams with zebra data
    let teams = Object.keys(whiteboard.match_traces[whiteboard.current_match])
    teams.unshift('None', 'All', 'Blue', 'Red')
    let team_drop = new Dropdown('team_drop', 'Heatmap', teams, 'None')
    team_drop.on_change = 'set_draw_team()'
    document.getElementById('teams').replaceChildren(team_drop.element)

    // redraw the now reset whiteboard
    update_time()
}

/**
 * Update match playback based on the match time and trail length sliders.
 */
function update_time()
{
    whiteboard.set_match_time(parseInt(document.getElementById('match_time').value),
                              parseInt(document.getElementById('trail_length').value))
}

/**
 * Pause the asyncronously running match playback.
 */
function pause()
{
    playing = false
    document.getElementById('play_match').innerText = 'Play'
}

/**
 * Asyncronous function which is used to handle playing of the match.
 * Runs when the play/pause button is pressed.
 */
async function play_match()
{
    // pause playback if currently playing
    if (playing)
    {
        pause()
        return
    }

    // change the play button to pause on play
    document.getElementById('play_match').innerText = 'Pause'

    // get the starting time and match length
    let time = parseInt(document.getElementById('match_time').value)
    let length = parseInt(document.getElementById('trail_length').max)

    // play the match until complete or externally paused
    playing = true
    while (time < length && playing)
    {
        start = Date.now()

        // increment the playback
        time++
        Slider.set_slider('match_time', time)
        update_time()

        // determine the interval by the requested speed (in 1/10 seconds)
        let interval = 100.0 / parseInt(document.getElementById('playback_speed').value)
        let delta = Date.now() - start

        // sleep until the next frame
        if (interval > delta)
        {
            await new Promise(r => setTimeout(r, interval - delta))
        }
    }

    // reset playback
    pause()
    if (time >= length)
    {
        Slider.set_slider('match_time', 0)
    }
}

/**
 * Connects the draw on drag checkbox to the whiteboard.
 */
function draw_drag()
{
    whiteboard.draw_drag = document.getElementById('draw_drag').checked
}

/**
 * Connects the team selection dropdown to the whiteboard.
 */
function set_draw_team()
{
    let team = document.getElementById('team_drop').value
    whiteboard.set_heatmap_team(team)
}