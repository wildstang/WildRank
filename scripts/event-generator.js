/**
 * file:        event-generator.js
 * description: Page for building test events.
 *              Generates a teams file and helps build a matches file
 * author:      Liam Fruzyna
 * date:        2022-01-12
 */

const start = Date.now()

var match_page, match_col, event_entry, teams_entry, teams_list, alliance_entry, gen_elim_cb

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    // set header
    header_info.innerHTML = 'Generate Event'

    let col = new WRColumn()
    let team_page = new WRPage('Team', [col])
    
    event_entry = new WREntry('Event ID', dal.event_id)
    event_entry.on_text_change = populate_matches
    col.add_input(event_entry)
    
    let num_teams = Object.keys(dal.teams).length
    if (num_teams === 0)
    {
        num_teams = 6
    }
    teams_entry = new WREntry('Number of Teams', num_teams, [6, 100])
    teams_entry.type = 'number'
    col.add_input(teams_entry)

    let teams = Object.keys(dal.teams)
    team_list = new WRExtended('Attending Teams', teams.join(','))
    col.add_input(team_list)
    
    let alliance_size = dal.alliance_size
    if (alliance_size === 0)
    {
        alliance_size = 3
    }
    alliance_entry = new WREntry('Teams per Alliance', alliance_size, [1, 10])
    alliance_entry.on_text_change = populate_matches
    alliance_entry.type = 'number'
    col.add_input(alliance_entry)

    let generate_button = new WRButton('Generate Teams', generate_teams)
    col.add_input(generate_button)

    match_col = document.createElement('div')
    match_page = new WRPage('Match')
    match_page.add_column(match_col)

    // build page
    body.replaceChildren(team_page, match_page)

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
    let event_id = event_entry.element.value
    let teams = Object.keys(dal.teams)
    if (event_id !== dal.event_id)
    {
        dal = new DAL(event_id)
        teams = dal.build_teams()
    }
    let cols = []
    let alliance_teams = parseInt(alliance_entry.element.value)
    if (teams.length > 0)
    {
        let red_col = new WRColumn('Red Teams')
        let blue_col = new WRColumn('Blue Teams')
        
        let match_teams = generate_match_teams(alliance_teams * 2)
        for (let pos = 0; pos < alliance_teams; pos++)
        {
            let red = new WRDropdown(`Red ${pos+1}`, teams, match_teams[pos])
            red.input_id = `red_${pos}`
            let blue = new WRDropdown(`Blue ${pos+1}`, teams, match_teams[pos + alliance_teams])
            blue.input_id = `blue_${pos}`
            red_col.add_input(red)
            blue_col.add_input(blue)
        }

        let add_match_button = new WRButton('Add Match', add_match)
        blue_col.add_input(add_match_button)

        gen_elim_cb = new WRCheckbox('Elimination', gen_elim_cb && gen_elim_cb.checked)
        gen_elim_cb.on_click = update_titles
        red_col.add_input(gen_elim_cb)

        cols = [red_col, blue_col]
    }
    match_col.replaceChildren(...cols)
    update_titles()
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

    let match_num = Object.keys(dal.matches).length // technically last match number
    match_page.getElementsByClassName('page_header')[0].innerText = `Match ${match_num + 1}`

    // prepopulate unavailable teams with those in last few matches
    // this prevents an uneven distribution of matches
    if (distribute)
    {
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
    let team_nums = team_list.element.value
    let event_id = event_entry.element.value
    if (team_nums.includes(','))
    {
        return pull_teams(event_id, team_nums)
    }

    let num_teams = num_teams.element.value
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

    save_teams(event_id, teams)
}

/**
 * function:    save_teams
 * parameters:  event id, list of teams objects
 * returns:     none
 * description: Saves a generated list of teams to localStorage.
 */
 function save_teams(event_id, teams)
 {
    localStorage.setItem(`teams-${event_id}`, JSON.stringify(teams))
    if (Object.keys(dal.matches).length === 0 || confirm('Matches already exist, erase them?'))
    {
        localStorage.setItem(`matches-${event_id}`, '[]')
    }
    localStorage.setItem(`event-${event_id}`, JSON.stringify({
        playoff_type: 10,
        year: cfg.year,
        event_code: dal.event_id.substring(4)
    }))

    dal.build_teams()
    populate_matches()
}

/**
 * function:    pull_teams
 * parameters:  event id, commas separated list of teams
 * returns:     none
 * description: Generates a new teams file for the event using the current list of team numbers.
 */
function pull_teams(event_id, team_list)
{
    if (!TBA_KEY)
    {
        let file = cfg.keys
        if (file != null)
        {
            if (cfg.keys.hasOwnProperty('tba'))
            {
                TBA_KEY = cfg.keys.tba
            }
        }
    }

    // split up list of teams
    let team_nums = team_list.split(',').map(t => t.trim())
    let teams = []

    let count = 0
    for (let team_num of team_nums)
    {
        if (TBA_KEY)
        {
            fetch(`https://www.thebluealliance.com/api/v3/team/frc${team_num}/simple${build_query({[TBA_AUTH_KEY]: TBA_KEY})}`)
                .then(response => {
                    return response.json()
                })
                .then(team => {
                    if ('Error' in team)
                    {
                        throw team.Error
                    }
                    teams.push(team)

                    let year = event_id.substr(0, 4)
                    fetch(`https://www.thebluealliance.com/api/v3/team/frc${team.team_number}/media/${year}${build_query({[TBA_AUTH_KEY]: TBA_KEY})}`)
                        .then(response => {
                            return response.json()
                        })
                        .then(data => {
                            for (let m of data)
                            {
                                switch (m.type)
                                {
                                    case 'avatar':
                                        localStorage.setItem(`avatar-${year}-${team.team_number}`, m.details.base64Image)
                                        break
                                    case 'cdphotothread':
                                    case 'imgur':
                                    // NOTE: instagram does things weird
                                    //case 'instagram-image':
                                    case 'onshape':
                                        dal.add_photo(team.team_number, m.direct_url)
                                        break
                                }
                            }
                        })
                        .catch(err => {
                        })
                
                    if (++count === team_nums.length)
                    {
                        save_teams(event_id, teams)
                    }
                })
                .catch(err => {
                    console.log(`Could not find team ${team_num}, generating`)
                    teams.push({
                        city: 'Generated Team',
                        country: 'GT',
                        key: `frc${team_num}`,
                        name: `Generated Team ${team_num}`,
                        nickname: `Generated Team ${team_num}`,
                        state_prov: 'GT',
                        team_number: team_num
                    })

                    if (++count === team_nums.length)
                    {
                        save_teams(event_id, teams)
                    }
                })
        }
        else
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

            if (++count === team_nums.length)
            {
                save_teams(event_id, teams)
            }
        }
    }
}

/**
 * Updates the page and column titles to have the correct match number and alliances.
 */
function update_titles()
{
    let elim = gen_elim_cb && gen_elim_cb.checked
    if (elim)
    {
        let matches = Object.values(dal.matches).filter(m => m.comp_level === 'sf').sort((a, b) => a.set_number - b.set_number)
        let match_num = 1
        if (matches.length > 0)
        {
            match_num = matches[matches.length - 1].set_number + 1
        }
        let red, blue = 0
        switch (match_num)
        {
            case 1:
                red = 1
                blue = 8
                break
            case 2:
                red = 4
                blue = 5
                break
            case 3:
                red = 3
                blue = 6
                break
            case 4:
                red = 2
                blue = 7
                break
            default:
                gen_elim_cb.checked = false
                update_titles()
                alert("Cannot generate beyond elim match 4")
                return
        }

        match_page.getElementsByClassName('page_header')[0].innerText = `Match ${match_num}`
    }
    else
    {
        let match_num = Object.values(dal.matches).filter(m => m.comp_level === 'qm').length + 1
        match_page.getElementsByClassName('page_header')[0].innerText = `Match ${match_num}`
    }
}

/**
 * function:    add_match
 * parameters:  none
 * returns:     none
 * description: Adds a new match with the given parameters to the match file.
 */
function add_match()
{
    let event_id = event_entry.element.value
    let alliance_teams = alliance_entry.element.value
    let file_name = `matches-${event_id}`
    let file = localStorage.getItem(file_name)
    if (file === null)
    {
        file = '[]'
    }
    let matches = JSON.parse(file)
    let match_number = matches.length + 1
    let elim = gen_elim_cb.checked
    if (elim)
    {
        let matches = Object.values(dal.matches).filter(m => m.comp_level === 'sf').sort((a, b) => a.set_number - b.set_number)
        match_number = 1
        if (matches.length > 0)
        {
            match_number = matches[matches.length - 1].set_number + 1
        }
    }
    let red_teams = []
    let blue_teams = []
    for (let pos = 0; pos < alliance_teams; pos++)
    {
        red_teams.push(`frc${document.getElementById(`red_${pos}`).value}`)
        blue_teams.push(`frc${document.getElementById(`blue_${pos}`).value}`)
    }
    let comp_level = elim ? "sf" : "qm"
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
        comp_level: comp_level,
        event_key: event_id,
        key: `${event_id}_${comp_level}${match_number}`,
        match_number: match_number,
        predicted_time: time,
        set_number: elim ? match_number : 1,
        time: time
    })
    localStorage.setItem(file_name, JSON.stringify(matches))

    dal.build_matches()
    populate_matches()
}