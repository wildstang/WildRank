/**
 * file:        whiteboard.js
 * description: Creates and manages the whiteboard pages utilizing the Whiteboard object.
 * author:      Liam Fruzyna
 * date:        2023-12-24
 */

include('whiteboard-obj')

var whiteboard, team_filter, drag_box
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
    let teams = dal.team_numbers
    teams.unshift('')
    team_filter = add_dropdown_filter(teams, hide_matches, true, default_filter)

    if (first)
    {
        header_info.innerText = 'Whiteboard'

        // create the whiteboard and add it to the card
        whiteboard = new Whiteboard()
        let card = new WRCard([whiteboard.canvas], true)
        card.space_after = false
        init_canvas()

        // create the whiteboard drawing controls and place them in a stack with the whiteboard
        let game_piece = new WRMultiButton('')
        for (let gp of cfg.game.whiteboard.gp_names)
        {
            game_piece.add_option(gp, () => whiteboard.add_game_piece(gp))
        }
        drag_box = new WRCheckbox('Draw on Drag')
        drag_box.on_click = draw_drag
        let clear = new WRMultiButton('', ['Clear Lines', 'Clear All'], [whiteboard.clear_lines.bind(whiteboard), whiteboard.clear.bind(whiteboard)])
        let reset_whiteboard = new WRButton('Reset Whiteboard', whiteboard.reset.bind(whiteboard))
        let stack = new WRStack([card, drag_box, game_piece, clear, reset_whiteboard], true)

        // populate the controls below the whiteboard in single column pages
        preview.append(stack)

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
    let team = team_filter.element.value
    // update the match list
    let first = populate_matches(true, true, team.length > 0 ? parseInt(team) : '')

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
 * Connects the draw on drag checkbox to the whiteboard.
 */
function draw_drag()
{
    whiteboard.draw_drag = drag_box.checked
}