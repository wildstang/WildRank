/**
 * file:        event-generator.js
 * description: Page for building test events.
 *              Generates a teams file and helps build a matches file
 * author:      Liam Fruzyna
 * date:        2022-01-12
 */

const start = Date.now()

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    // set header
    document.getElementById('header_info').innerHTML = 'Generate Event'

    let col = new ColumnFrame('', '')
    let team_page = new PageFrame('', 'Team', [col])
    
    let event_entry = new Entry('event_id', 'Event ID', dal.event_id)
    event_entry.on_text_change = 'populate_matches()'
    col.add_input(event_entry)
    
    let num_teams = Object.keys(dal.teams).length
    if (num_teams === 0)
    {
        num_teams = 6
    }
    let teams_entry = new Entry('num_teams', 'Number of Teams', num_teams, [6, 100])
    teams_entry.type = 'number'
    col.add_input(teams_entry)
    
    let alliance_size = dal.alliance_size
    if (alliance_size === 0)
    {
        alliance_size = 3
    }
    let alliance_entry = new Entry('alliance_teams', 'Teams per Alliance', alliance_size, [1, 10])
    alliance_entry.on_text_change = 'populate_matches()'
    alliance_entry.type = 'number'
    col.add_input(alliance_entry)

    let generate_button = new Button('generate_teams', 'Generate Teams', 'generate_teams()')
    col.add_input(generate_button)

    let match_page = new PageFrame('match', 'Match')
    match_page.add_column('<div id="match_col"></div>')

    // build page
    document.body.innerHTML += team_page.toString + match_page.toString

    populate_matches()
}

/**
 * function:    populate_matches
 * parameters:  none
 * returns:     none
 * description: Builds the match adding right side of the page if a teams file exists.
 */
function populate_matches()
{
    let event_id = document.getElementById('event_id').value
    let teams = Object.keys(dal.teams)
    if (event_id !== dal.event_id)
    {
        dal = new DAL(event_id)
        teams = dal.build_teams()
    }
    let cols = ''
    let alliance_teams = parseInt(document.getElementById('alliance_teams').value)
    if (teams.length > 0)
    {
        let red_col = new ColumnFrame('', 'Red Teams')
        let blue_col = new ColumnFrame('', 'Blue Teams')
        
        let match_teams = generate_match_teams(alliance_teams * 2)
        for (let pos = 0; pos < alliance_teams; pos++)
        {
            let red = new Dropdown(`red_${pos}`, `Red ${pos+1}`, teams, match_teams[pos])
            let blue = new Dropdown(`blue_${pos}`, `Blue ${pos+1}`, teams, match_teams[pos + alliance_teams])
            red_col.add_input(red)
            blue_col.add_input(blue)
        }

        let add_match = new Button('add_match', 'Add Match', 'add_match()')
        blue_col.add_input(add_match)

        cols = red_col.toString + blue_col.toString
    }
    document.getElementById('match_col').innerHTML = cols
}

/**
 * function:    generate_match_teams
 * parameters:  number of teams to generate, evenly distribute teams
 * returns:     list of team numbers
 * description: Generates a new list of random teams.
 */
function generate_match_teams(num_teams, distribute=true)
{
    let match_teams = []
    let unavailable = []
    let teams = Object.keys(dal.teams)

    // prepopulate unavailable teams with those in last few matches
    // this prevents an uneven distribution of matches
    if (distribute)
    {
        let match_num = Object.keys(dal.matches).length // technically last match number
        let cycle_len = Math.floor(teams.length / num_teams)
        let cycle = Math.floor(match_num / cycle_len)
        for (let i = cycle * cycle_len; i < match_num; i++)
        {
            let match_key = `${dal.event_id}_qm${i+1}`
            let match_teams = Object.values(dal.get_match_teams(match_key))
            unavailable = unavailable.concat(match_teams)
        }
        // prevent back to back matches on first match in cycle
        if (cycle * cycle_len === match_num)
        {
            let match_key = `${dal.event_id}_qm${match_num}`
            let match_teams = Object.values(dal.get_match_teams(match_key))
            unavailable = unavailable.concat(match_teams)
        }
    }

    // generate teams until list is full
    while (match_teams.length < num_teams)
    {
        let team = teams[random_int(0, teams.length-1)]
        // check if previously marked unavailable (current match or optionally recent match)
        if (!unavailable.includes(team) || unavailable.length >= teams.length)
        {
            match_teams.push(team)
            unavailable.push(team)
        }
    }
    return match_teams
}

/**
 * function:    generate_teams
 * parameters:  none
 * returns:     none
 * description: Generates a new teams file for the event using the team paramters, plus an empty matches file.
 */
function generate_teams()
{
    let teams = []
    let num_teams = document.getElementById('num_teams').value
    let event_id = document.getElementById('event_id').value
    for (let team_num = 1; team_num <= num_teams; team_num++)
    {
        teams.push({
            city: 'Generated Team',
            country: 'GT',
            key: `frc${team_num}`,
            name: `Generated Team ${team_num}`,
            nickname: `Generated Team ${team_num}`,
            state_prov: 'GT',
            team_number: team_num
        })
    }
    localStorage.setItem(`teams-${event_id}`, JSON.stringify(teams))
    localStorage.setItem(`matches-${event_id}`, '[]')

    dal.build_teams()
    populate_matches()
}

/**
 * function:    add_match
 * parameters:  none
 * returns:     none
 * description: Adds a new match with the given parameters to the match file.
 */
function add_match()
{
    let event_id = document.getElementById('event_id').value
    let alliance_teams = document.getElementById('alliance_teams').value
    let file_name = `matches-${event_id}`
    let file = localStorage.getItem(file_name)
    if (file === null)
    {
        file = '[]'
    }
    let matches = JSON.parse(file)
    let match_number = matches.length + 1
    let red_teams = []
    let blue_teams = []
    for (let pos = 0; pos < alliance_teams; pos++)
    {
        red_teams.push(`frc${document.getElementById(`red_${pos}`).value}`)
        blue_teams.push(`frc${document.getElementById(`blue_${pos}`).value}`)
    }
    matches.push({
        actual_time: 0,
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
        comp_level: "qm",
        event_key: event_id,
        key: `${event_id}_qm${match_number}`,
        match_number: match_number,
        predicted_time: 1294765871,
        set_number: 1,
        time: 1294765871
    })
    localStorage.setItem(file_name, JSON.stringify(matches))
    alert(`Create match ${event_id} qm${match_number}`)

    dal.build_matches()
    populate_matches()
}