/**
 * file:        custom-match.js
 * description: Page for adding a single match. Used for coach.
 * author:      Liam Fruzyna
 * date:        2023-01-05
 */

const start = Date.now()

/**
 * Function used by the application to initialize the custom match page.
 */
function init_page()
{
    // set header
    document.getElementById('header_info').innerHTML = 'Custom Match'

    let match_col = document.createElement('div')
    match_col.id = 'match_col'
    let match_page = new PageFrame('match', 'Match')
    match_page.add_column(match_col)

    // build page
    document.getElementById('body').replaceChildren(match_page.element)

    populate_matches()
}

/**
 * Builds a pair of columns of dropdown to choose the teams.
 */
function populate_matches()
{
    let teams = Object.keys(dal.teams)

    let cols = []
    if (teams.length > 0)
    {
        let red_col = new ColumnFrame('', 'Red Teams')
        let blue_col = new ColumnFrame('', 'Blue Teams')

        for (let pos = 0; pos < dal.max_alliance_size; pos++)
        {
            let red = new Dropdown(`red_${pos}`, `Red ${pos+1}`, teams, teams[pos])
            let blue = new Dropdown(`blue_${pos}`, `Blue ${pos+1}`, teams, teams[pos + dal.max_alliance_size])
            red_col.add_input(red)
            blue_col.add_input(blue)
        }

        let custom = new Button('return', 'Return to Coach')
        custom.link = `open_page('coach')`
        blue_col.add_input(custom)

        let add_match = new Button('add_match', 'Add Match', 'add_match()')
        red_col.add_input(add_match)

        cols = [blue_col.element, red_col.element]
    }
    document.getElementById('match_col').replaceChildren(...cols)
}

/**
 * Saves the current selected set of teams as a new match.
 */
function add_match()
{
    let file_name = `matches-${dal.event_id}`
    let file = localStorage.getItem(file_name)
    if (file === null)
    {
        file = '[]'
    }
    let matches = JSON.parse(file)
    let match_number = matches.length + 1
    let red_teams = []
    let blue_teams = []
    for (let pos = 0; pos < dal.max_alliance_size; pos++)
    {
        red_teams.push(`frc${document.getElementById(`red_${pos}`).value}`)
        blue_teams.push(`frc${document.getElementById(`blue_${pos}`).value}`)
    }

    if ([...new Set(red_teams.concat(blue_teams))].length < dal.max_alliance_size * 2)
    {
        alert('Duplicate teams not allowed!')
        return
    }

    let time = Date.now() / 1000
    matches.push({
        actual_time: time,
        alliances: {
            blue: {
                dq_team_keys: [],
                surrogate_team_keys: [],
                team_keys: blue_teams
            },
            red: {
                dq_team_keys: [],
                surrogate_team_keys: [],
                team_keys: red_teams
            }
        },
        comp_level: 'cm',
        event_key: event_id,
        key: `${event_id}_cm${match_number}`,
        match_number: match_number,
        predicted_time: time,
        set_number: 1,
        time: time
    })
    localStorage.setItem(file_name, JSON.stringify(matches))

    alert(`Match ${event_id}_cm${match_number} added!`)

    dal.build_matches()
    populate_matches()
}