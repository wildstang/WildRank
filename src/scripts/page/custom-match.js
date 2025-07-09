/**
 * file:        custom-match.js
 * description: Page for adding a single match. Used for coach.
 * author:      Liam Fruzyna
 * date:        2023-01-05
 */

const start = Date.now()

var match_col, red_col, blue_col

/**
 * Function used by the application to initialize the custom match page.
 */
function init_page()
{
    // set header
    header_info.innerHTML = 'Custom Match'

    match_col = document.createElement('div')
    let match_page = new WRPage('New Match', [match_col])

    // build page
    preview.replaceChildren(match_page)

    populate_matches()
}

/**
 * Builds a pair of columns of dropdown to choose the teams.
 */
function populate_matches()
{
    let teams = Object.keys(dal.teams)

    let cols = []
    if (teams.length > dal.max_alliance_size * 2)
    {
        red_col = new WRColumn('Red Teams')
        blue_col = new WRColumn('Blue Teams')

        for (let pos = 0; pos < dal.max_alliance_size; pos++)
        {
            red_col.add_input(new WRDropdown(`Red ${pos+1}`, teams, teams[pos]))
            blue_col.add_input(new WRDropdown(`Blue ${pos+1}`, teams, teams[pos + dal.max_alliance_size]))
        }

        let custom = new WRLinkButton('Return to Coach', build_url('coach'))
        blue_col.add_input(custom)

        let add_match_button = new WRButton('Add Match', add_match)
        red_col.add_input(add_match_button)

        cols = [blue_col, red_col]
    }
    else
    {
        cols.push(new WRCard('Not enough teams'))
    }
    match_col.replaceChildren(...cols)
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
        red_teams.push('frc' + red_col.inputs[pos].element.value)
        blue_teams.push('frc' + blue_col.inputs[pos].element.value)
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