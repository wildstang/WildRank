/**
 * file:        bracket.js
 * description: Lists all double elim matches and the teams.
 *              Allows manual advancement of teams if no network.
 *              TODO:
 *              - Handle 4 team alliances properly
 *              - Advance other matches while filtered
 *              - Manually enter teams?
 * author:      Liam Fruzyna
 * date:        2024-02-08
 */

include('transfer')
include('bracket-obj')

var filter_el

/**
 * Initializes the contents of the page on page load.
 */
function init_page()
{
    header_info.innerText = 'Double Elims'

    if (dal.event.playoff_type !== 10)
    {
        body.innerText = 'Not a double-elimination event.'
    }
    else
    {
        bracket = new Bracket(dal.event_id, add_bracket)
        add_bracket()
    }
}

/**
 * Adds the bracket plus a filter to the current page.
 */
function add_bracket()
{
    // determine previously selected alliance filter
    let alliance = 0
    let ops = ['All'].concat(bracket.alliances.map(a => a.team_str))
    if (filter_el)
    {
        alliance = filter_el.element.selectedIndex
    }

    // build a filter for the alliance
    let filter_inputs = []
    if (ops.length > 1)
    {
        filter_el = new WRDropdown('Alliance Filter', ops, ops[alliance])
        filter_el.add_class('slim')
        filter_el.on_change = add_bracket
        filter_inputs = [filter_el]
    }
    let filter_page = new WRPage('', [new WRColumn('', filter_inputs)])

    let page = bracket.build_page(alliance)
    body.replaceChildren(filter_page, page)
}

/**
 * Does nothing, 
 * 
 * @param {number} match_num Elim match number
 * @param {Array} red_teams Array of red alliance team numbers
 * @param {Array} blue_teams Array of blue alliance team numbers
 */
function add_match(match_num, red_teams, blue_teams) {}

/**
 * Opens a given match in the coach view.
 * 
 * @param {string} match_key Match key
 */
function open_option(match_key)
{
    window_open(build_url('coach', {match: match_key}))
}