/**
 * file:        coach.js
 * description: Contains functions for the driver coach view page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2021-09-03
 */

include('whiteboard-obj')
include('bracket-obj')

// read parameters from URL
var urlParams = new URLSearchParams(window.location.search)
const selected = urlParams.get('match')

var carousel, whiteboard_page, whiteboard, controls_column, bracket, bracket_page

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch simple event matches from localStorage. Initialize page contents.
 */
function init_page()
{
    header_info.innerText = 'Coach View'

    // build page
    let first = populate_matches()
    let teams = Object.keys(dal.teams)
    teams.unshift('')
    let default_filter = ''
    if (selected === '' && cfg.settings.hasOwnProperty('team_number'))
    {
        default_filter = cfg.settings.team_number.toString()
    }
    add_dropdown_filter('team_filter', teams, 'hide_matches()', true, default_filter)

    if (first)
    {
        carousel = create_element('div', 'scouting-carousel', 'scouting-carousel')
        preview.replaceChildren(carousel)

        // create page containing whiteboard
        whiteboard = new Whiteboard(update_sliders)
        let card = new Card('contents_card', [whiteboard.canvas])
        card.space_after = false

        // create the whiteboard drawing controls and place them in two columns
        let game_piece = new MultiButton('game_piece', '')
        for (let gp of cfg.whiteboard.game_pieces)
        {
            game_piece.add_option(gp.name, `whiteboard.add_game_piece('${gp.name}')`)
        }
        game_piece.on_click = 'add_game_piece()'
        let draw_drag = new Checkbox('draw_drag', 'Draw on Drag')
        draw_drag.on_click = 'draw_drag()'
        let clear = new MultiButton('clear', '', ['Clear Lines', 'Clear All'], ['whiteboard.clear_lines()', 'whiteboard.clear()'])
        clear.add_class('slim')
        let reset_whiteboard = new Button('reset_whiteboard', 'Reset Whiteboard', 'whiteboard.reset()')
        reset_whiteboard.add_class('slim')

        let stack = new Stack('', [card, draw_drag, game_piece, clear, reset_whiteboard], true)
        let wb_col = new ColumnFrame('', '', [stack])
        whiteboard_page = new PageFrame('', '', [wb_col])

        // create column of buttons for coach page
        let edit = new Button('edit_coach', 'Edit Values')
        edit.link = `open_page('edit-coach')`
        let custom = new Button('custom_match', 'Add Custom Match')
        custom.link = `open_page('custom-match')`
        controls_column = new ColumnFrame('', '', [edit, custom])

        // subtract margins from the parent dimensions
        // assumes card padding of 2x16px, panel padding of 2x8px, plus headroom
        let width = preview.offsetWidth - (16 + 32 + 8)
        let height = preview.offsetHeight - (16 + 32 + 8)
        whiteboard.update_dimensions(width, height)

        // build a Bracket if it is a double elims event
        let elim_matches = Object.values(dal.matches).filter(m => m.short_match_name.startsWith('M'))
        if (dal.event.playoff_type === 10 && elim_matches.length > 0)
        {
            bracket = new Bracket(dal.event_id, add_bracket)
        }

        hide_matches()

        if (selected)
        {
            open_option(selected)
        }
    }
    else
    {
        add_error_card('No Match Data Found', 'Please preload event')
    }
}

/**
 * Adds the bracket to the current page.
 */
function add_bracket()
{
    if (bracket)
    {
        if (bracket_page && carousel.contains(bracket_page))
        {
            carousel.removeChild(bracket_page)
        }

        let team = cfg.settings.team_number
        let a = 0
        for (let i in bracket.alliances)
        {
            if (bracket.alliances[i].teams.includes(team + ''))
            {
                //a = parseInt(i) + 1
                break
            }
        }
        bracket_page = bracket.build_page(a).element
        carousel.append(bracket_page)
    }
}

/**
 * Empty function which runs when the whiteboard is updated.
 */
function update_sliders(){}

/**
 * function:    hide_matches
 * parameters:  none
 * returns:     none
 * description: Rebuilds the match list based on the selected team.
 */
function hide_matches()
{
    let team = document.getElementById('team_filter').value
    let first = populate_matches(true, true, team)
    open_option(first)
}

/**
 * function:    open_match
 * parameters:  Selected match number
 * returns:     none
 * description: Completes right info pane for a given match number.
 */
function open_option(match_key)
{
    // select option
    deselect_all()
    document.getElementById(`match_option_${match_key}`).classList.add('selected')

    // load the match on the whiteboard, UI updates handled by update_sliders()
    whiteboard.load_match(match_key, false)

    // reorganize teams into single object
    let match_teams = dal.get_match_teams(match_key)
    let red_teams = Object.keys(match_teams).filter(k => k.startsWith('red')).map(k => match_teams[k])
    let blue_teams = Object.keys(match_teams).filter(k => k.startsWith('blue')).map(k => match_teams[k])

    // place match time and number on title
    let actual = dal.get_match_value(match_key, 'started_time')
    let predicted = dal.get_match_value(match_key, 'predicted_time')
    let time = dal.get_match_value(match_key, 'scheduled_time')
    if (actual > 0)
    {
        time = unix_to_match_time(actual)
    }
    else if (predicted > 0)
    {
        time = `${unix_to_match_time(predicted)} (Projected)`
    }
    else
    {
        time = unix_to_match_time(time)
    }
    header_info.innerText = `${dal.get_match_value(match_key, 'match_name')} - ${time}`

    let red_col = new ColumnFrame('red_alliance', '')
    let blue_col = new ColumnFrame('blue_alliance', '')
    let page = new PageFrame('', '', [red_col, blue_col, controls_column])

    let red_card = new Card(`red_details`, '')
    red_card.add_class('red_box')
    red_col.add_input(red_card)

    let blue_card = new Card(`blue_details`, '')
    blue_card.add_class('blue_box')
    blue_col.add_input(blue_card)

    // build template
    carousel.replaceChildren(page.element, whiteboard_page.element)
    add_bracket()

    // populate cards with tables
    build_table('red', red_teams)
    build_table('blue', blue_teams)
}

/**
 * function:    build_table
 * parameters:  alliance color, array of team numbers
 * returns:     none
 * description: Populates a card with coach vals of each team in an alliance.
 */
function build_table(alliance, teams)
{
    let images = []

    let table = document.createElement('table')

    let teams_header = table.insertRow()
    teams_header.insertCell()
    let names = table.insertRow()
    names.insertCell()
    table.append(teams_header, names)

    for (let team of teams)
    {
        images.push(dal.get_photo_carousel(team, '400px'))

        let team_header = document.createElement('th')
        team_header.innerText = team
        if (dal.is_unsure(team))
        {
            team_header.classList.add('highlighted')
        }
        teams_header.append(team_header)

        let name = document.createElement('th')
        name.innerText = dal.get_value(team, 'meta.name')
        names.append(name)
    }

    for (let v of cfg.coach)
    {
        let row = table.insertRow()
        table.append(row)

        let key = document.createElement('th')
        key.innerText = dal.get_name(v.key, v.function)
        row.append(key)

        for (let team of teams)
        {
            row.insertCell().innerText = dal.get_value(team, v.key, v.function, true)
        }
    }

    let header = document.createElement('h2')
    header.innerText = `${alliance[0].toUpperCase()}${alliance.substring(1)} Alliance`
    header.style.color = alliance

    let center = document.createElement('center')
    center.append(header)

    document.getElementById(`${alliance}_details`).replaceChildren(center)
    document.getElementById(`${alliance}_details`).append(...images, table)
}

/**
 * Connects the draw on drag checkbox to the whiteboard.
 */
function draw_drag()
{
    whiteboard.draw_drag = document.getElementById('draw_drag').checked
}