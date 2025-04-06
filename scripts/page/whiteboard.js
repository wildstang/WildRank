/**
 * file:        whiteboard.js
 * description: Creates and manages the whiteboard pages utilizing the Whiteboard object.
 * author:      Liam Fruzyna
 * date:        2023-12-24
 */

include('whiteboard-obj')

var whiteboard, teams_container, team_filter, play_button, time_slider, trail_slider, team_drop, drag_box, speed_slider
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
    if (cfg.user.settings.hasOwnProperty('team_number'))
    {
        default_filter = cfg.user.settings.team_number.toString()
    }
    let teams = Object.keys(dal.teams)
    teams.unshift('')
    team_filter = add_dropdown_filter(teams, hide_matches, true, default_filter)

    if (first)
    {
        header_info.innerText = 'Whiteboard'

        // create the whiteboard and add it to the card
        whiteboard = new Whiteboard(update_sliders)
        let card = new WRCard([whiteboard.canvas], true)
        card.space_after = false
        init_canvas()

        // create the whiteboard drawing controls and place them in a stack with the whiteboard
        let game_piece = new WRMultiButton('')
        for (let gp of cfg.game.whiteboard.game_pieces)
        {
            game_piece.add_option(gp.name, () => whiteboard.add_game_piece(gp.name))
        }
        drag_box = new WRCheckbox('Draw on Drag')
        drag_box.on_click = draw_drag
        let clear = new WRMultiButton('', ['Clear Lines', 'Clear All'], [whiteboard.clear_lines.bind(whiteboard), whiteboard.clear.bind(whiteboard)])
        let reset_whiteboard = new WRButton('Reset Whiteboard', whiteboard.reset.bind(whiteboard))
        let stack = new WRStack([card, drag_box, game_piece, clear, reset_whiteboard], true)

        // create the various playback controls and place them in a single column
        play_button = new WRButton('Play', play_match)
        speed_slider = new WRSlider('Play at', 5)
        speed_slider.bounds = [1, 10, 1]
        speed_slider.add_class('slim')
        time_slider = new WRSlider('Match Time', 0)
        time_slider.bounds = [0, 0, 1]
        time_slider.on_change = update_time
        time_slider.add_class('slim')
        trail_slider = new WRSlider('Trail Length', 0)
        trail_slider.bounds = [0, 1, 10]
        trail_slider.on_change = update_time
        trail_slider.add_class('slim')
        let playback = new WRColumn('', [play_button, speed_slider, time_slider, trail_slider])

        // create a container to place the teams dropdown in
        teams_container = document.createElement('span')
        let teams = new WRColumn('', [teams_container])

        // populate the controls below the whiteboard in single column pages
        preview.append(stack, br(),
            new WRPage('Playback', [playback]),
            new WRPage('Teams', [teams]))

        // update the match list
        hide_matches()
    }
    else
    {
        add_error_card('No Match Data Found', 'Please preload event.')
    }
}

/**
 * A function used by the hamburger menu mechanism to update the whiteboard size
 * when the menu is opened/closed.
 */
function init_canvas()
{
    let preview = document.getElementById('center')
    // subtract margins from the parent dimensions
    // assumes card padding of 2x16px, panel padding of 2x8px, plus headroom
    let width = preview.offsetWidth - (16 + 32 + 8)
    let height = preview.offsetHeight - (16 + 32 + 8)
    whiteboard.update_dimensions(width, height)
}

/**
 * A function used by the selection page filter mechanism to update the list of
 * matches on the left when a new team is selected in the filter.
 */
function hide_matches()
{
    // update the match list
    let team = team_filter.value
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
    document.getElementById(`left_match_option_${match_key}`).classList.add('selected')

    // load the match on the whiteboard, UI updates handled by update_sliders()
    whiteboard.load_match(match_key)
}

/**
 * A function passed to the whiteboard to update the sliders, populate the
 * dropdown, and pause any playback when a new match is opened.
 */
function update_sliders()
{
    // reset previous match playback
    pause()
    time_slider.position = 1

    // set the slider limits appropriately
    let length = whiteboard.get_match_length()
    time_slider.maximum = length
    trail_slider.maximum = length

    // populate the dropdown with teams with zebra data
    let teams = Object.keys(whiteboard.match_traces[whiteboard.current_match])
    teams.unshift('None', 'All', 'Blue', 'Red')
    team_drop = new WRDropdown('Heatmap', teams, 'None')
    team_drop.on_change = set_draw_team
    teams_container.replaceChildren(team_drop)

    // redraw the now reset whiteboard
    update_time()
}

/**
 * Update match playback based on the match time and trail length sliders.
 */
function update_time()
{
    whiteboard.set_match_time(parseInt(time_slider.slider.value),
                              parseInt(trail_slider.slider.value))
}

/**
 * Pause the asyncronously running match playback.
 */
function pause()
{
    playing = false
    play_button.label_el.innerText = 'Play'
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
    play_button.label_el.innerText = 'Pause'

    // get the starting time and match length
    let time = parseInt(time_slider.slider.value)
    let length = parseInt(trail_slider.slider.max)

    // play the match until complete or externally paused
    playing = true
    while (time < length && playing)
    {
        start = Date.now()

        // increment the playback
        time++
        time_slider.position = time
        update_time()

        // determine the interval by the requested speed (in 1/10 seconds)
        let interval = 100.0 / parseInt(speed_slider.slider.value)
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
        time_slider.position = 0
    }
}

/**
 * Connects the draw on drag checkbox to the whiteboard.
 */
function draw_drag()
{
    whiteboard.draw_drag = drag_box.checked
}

/**
 * Connects the team selection dropdown to the whiteboard.
 */
function set_draw_team()
{
    let team = team_drop.element.value
    whiteboard.set_heatmap_team(team)
}