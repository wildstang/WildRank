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
const selected = get_parameter('match', '')

var carousel, whiteboard_page, whiteboard, edit, custom, bracket, bracket_page, team_filter, red_card, blue_card, drag_box, buttons

/**
 * Build the structure of the page and initialize bracket and whiteboard.
 */
function init_page()
{
    header_info.innerText = 'Coach View'

    if (dal.match_keys.length > 0)
    {
        carousel = create_element('div', 'scouting-carousel', 'scouting-carousel')
        preview.replaceChildren(carousel)

        // create page containing whiteboard
        whiteboard = new Whiteboard(update_sliders)
        let card = new WRCard([whiteboard.canvas])
        card.space_after = false

        // create the whiteboard drawing controls and place them in a stack with the whiteboard
        let game_piece = new WRMultiButton('')
        for (let gp of cfg.game.whiteboard.gp_names)
        {
            game_piece.add_option(gp, () => whiteboard.add_game_piece(gp))
        }
        drag_box = new WRCheckbox('Draw on Drag')
        drag_box.on_click = draw_drag
        let clear_lines = new WRButton('Clear Lines', whiteboard.clear_lines.bind(whiteboard))
        let clear_all = new WRButton('Clear All', whiteboard.clear.bind(whiteboard))
        let reset_whiteboard = new WRButton('Reset Whiteboard', whiteboard.reset.bind(whiteboard))

        let wb_stack = new WRStack([card, drag_box, game_piece, clear_lines, clear_all, reset_whiteboard], true)
        let wb_col = new WRColumn('', [wb_stack])
        whiteboard_page = new WRPage('', [wb_col])

        red_card = new WRCard('')
        red_card.add_class('red_box')

        blue_card = new WRCard('')
        blue_card.add_class('blue_box')

        // add buttons to what is normally for the mini-picklist
        let edit_button = new WRLinkButton('Edit Values', build_url('edit-coach'))
        edit_button.add_class('slim')
        let custom_button = new WRLinkButton('Add Custom Match', build_url('custom-match'))
        let import_button = build_import_data().build_button('Import Data')
        buttons = new WRStack([edit_button, custom_button, import_button])

        // show and populate the left column with matches and a team filter
        enable_list(true, true)
        let default_filter = ''
        if (selected === '' && cfg.user.settings.hasOwnProperty('team_number'))
        {
            default_filter = cfg.user.settings.team_number.toString()
        }
        let teams = dal.team_numbers
        teams.unshift('')
        team_filter = add_dropdown_filter(teams, build_match_list, true, default_filter)

        // subtract margins from the parent dimensions
        // assumes card padding of 2x16px, panel padding of 2x8px, plus headroom
        let width = preview.offsetWidth - (16 + 32 + 8)
        let height = preview.offsetHeight - (16 + 32 + 8)
        whiteboard.update_dimensions(width, height)

        // build a Bracket if it is a double elims event
        let elim_matches = Object.values(dal.matches).filter(m => m.short_name.startsWith('M'))
        if (dal.double_elim_event && elim_matches.length > 0)
        {
            bracket = new Bracket(dal.event_id, add_bracket)
            // allows selected to include generated matches
            add_bracket()
        }

        build_match_list()

        whiteboard.start()
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

        let team = cfg.user.settings.team_number
        let a = 0
        for (let i in bracket.alliances)
        {
            if (bracket.alliances[i].teams.includes(team + ''))
            {
                //a = parseInt(i) + 1
                break
            }
        }
        bracket_page = bracket.build_page(a)
        carousel.append(bracket_page)
    }
}

/**
 * Empty function which runs when the whiteboard is updated.
 */
function update_sliders(){}

/**
 * Rebuilds the match list based on the selected team.
 */
function build_match_list()
{
    let team_num = parseInt(team_filter.element.value)
    clear_list()

    let first = ''
    let first_selected = ''
    for (let match_key of dal.match_keys)
    {
        let match = dal.matches[match_key]
        if (isNaN(team_num) || match.red_alliance.includes(team_num) || match.blue_alliance.includes(team_num))
        {
            let op = new WRMatchOption(match_key, match.short_name, match.red_alliance.map(t => t.toString()), match.blue_alliance.map(t => t.toString()))
            if (match.complete)
            {
                if (first_selected === '')
                {
                    first_selected = match_key
                }
                op.add_class('scouted')
            }
            else if (first === '')
            {
                first = match_key
            }
            add_option(op)
        }
    }

    if (selected)
    {
        first = selected
    }
    if (first === '')
    {
        first = first_selected
    }
    open_option(first)
}

/**
 * Completes right info pane for a given match number.
 * @param {String} match_key Match key
 */
function open_option(match_key)
{
    // select option
    deselect_all()
    document.getElementById(`left_match_option_${match_key}`).classList.add('selected')
    carousel.scrollTo(0, 0)

    // load the match on the whiteboard, UI updates handled by update_sliders()
    whiteboard.load_match(match_key, false)

    // reorganize teams into single object
    let match_teams = dal.get_match_teams(match_key)
    let red_teams = Object.keys(match_teams).filter(k => k.startsWith('red')).map(k => match_teams[k])
    let blue_teams = Object.keys(match_teams).filter(k => k.startsWith('blue')).map(k => match_teams[k])

    // place match time and number on title
    let time = new Date(dal.matches[match_key].time).toLocaleTimeString("en-US")
    header_info.innerText = `${dal.matches[match_key].name} - ${time}`

    let red_page = new WRPage('', [new WRColumn('', [red_card]), new WRColumn('', [buttons])])
    let blue_page = new WRPage('', [new WRColumn('', [blue_card])])

    // build template
    carousel.replaceChildren(red_page, blue_page, whiteboard_page)
    add_bracket()

    // populate cards with tables
    build_table('red', red_teams)
    build_table('blue', blue_teams)
}

/**
 * Populates a card with coach vals of each team in an alliance.
 * @param {String} alliance Alliance color
 * @param {Array} teams List of team numbers to add to the table
 */
function build_table(alliance, teams)
{
    let table = document.createElement('table')

    let teams_header = table.insertRow()
    teams_header.insertCell()
    let names = table.insertRow()
    names.insertCell()
    table.append(teams_header, names)

    for (let team of teams)
    {
        let team_header = document.createElement('th')
        team_header.innerText = team
        teams_header.append(team_header)

        let name = document.createElement('th')
        name.innerText = dal.teams[team].name
        names.append(name)
    }

    for (let c of cfg.analysis.coach)
    {
        let row = table.insertRow()
        table.append(row)

        let key = document.createElement('th')
        key.innerText = cfg.get_coach_name(c)
        row.append(key)

        let result = cfg.get_result_from_key(c.key)
        for (let team of teams)
        {
            row.insertCell().innerHTML = result.clean_value(dal.compute_stat(c.key, team, c.function))
        }
    }

    let header = document.createElement('h2')
    header.innerText = `${alliance[0].toUpperCase()}${alliance.substring(1)} Alliance`
    header.style.color = alliance

    let center = document.createElement('center')
    center.append(header)

    let details = blue_card
    if (alliance === 'red')
    {
        details = red_card
    }
    details.element.replaceChildren(center)
    details.element.append(table)
}

/**
 * Connects the draw on drag checkbox to the whiteboard.
 */
function draw_drag()
{
    whiteboard.draw_drag = drag_box.checked
}

/**
 * Temporarily adds an elim match to the DAL so it can be viewed in coach.
 * 
 * @param {number} match_num Elim match number
 * @param {Array} red_teams Array of red alliance team numbers
 * @param {Array} blue_teams Array of blue alliance team numbers
 */
function add_match(match_num, red_teams, blue_teams)
{
    // add a new match to the DAL
    let match_key = `${dal.event_id}_sf${match_num}`
    dal.matches[match_key] = {
        blue_alliance: blue_teams,
        red_alliance: red_teams,
        comp_level: 'sf',
        name: `Match ${match_num}`,
        match_num: match_num,
        set_num: match_num,
        short_name: `M${match_num}`,
        time: Date.now()
    }

    // add the match to the option list
    let option = new WRMatchOption(match_key, dal.matches[match_key].short_match_name, red_teams, blue_teams)
    add_option(option)
}