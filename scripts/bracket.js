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
    let f = document.getElementById('alliance_filter')
    let ops = ['All'].concat(bracket.alliances.map(a => a.team_str))
    if (f)
    {
        alliance = f.selectedIndex
    }

    // build a filter for the alliance
    let filter = new Dropdown('alliance_filter', 'Alliance Filter', ops, ops[alliance])
    filter.add_class('slim')
    filter.on_change = 'build_page()'
    let filter_page = new PageFrame('', '', [new ColumnFrame('', '', [filter])])

    let page = bracket.build_page(alliance)
    body.replaceChildren(filter_page.element, page.element)
}
