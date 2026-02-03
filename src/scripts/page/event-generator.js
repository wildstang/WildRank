/**
 * file:        event-generator.js
 * description: Page for building test events.
 *              Generates a teams file and helps build a matches file
 * author:      Liam Fruzyna
 * date:        2022-01-12
 */

const start = Date.now()

var match_page, match_col, name_entry, teams_entry, teams_list, alliance_entry, gen_elim_cb

/**
 * Runs onload to fill out the page.
 */
function init_page()
{
    // set header
    header_info.innerHTML = 'Generate Event'

    let col = new WRColumn()
    let team_page = new WRPage('Team', [col])

    name_entry = new WREntry('Event Name', dal.event_name)
    col.add_input(name_entry)
    
    let teams = dal.team_numbers
    let num_teams = teams.length
    if (num_teams === 0)
    {
        num_teams = 6
    }
    teams_entry = new WREntry('Number of Teams', num_teams, [6, 100])
    teams_entry.type = 'number'
    col.add_input(teams_entry)

    team_list = new WRExtended('Attending Teams', teams.join(','))
    col.add_input(team_list)

    alliance_entry = new WREntry('Teams per Alliance', 3, [1, 10])
    alliance_entry.on_text_change = populate_matches
    alliance_entry.type = 'number'
    col.add_input(alliance_entry)

    let generate_button = new WRButton('Generate Teams', generate_teams)
    col.add_input(generate_button)

    match_col = document.createElement('div')
    match_page = new WRPage('Match')
    match_page.add_column(match_col)

    // build page
    preview.replaceChildren(team_page, match_page)

    populate_matches()
}

/**
 * Builds the match adding right side of the page if a teams file exists.
 */
function populate_matches()
{
    let teams = dal.team_numbers
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
 * Generates a new list of random teams for a match.
 * @param {Number} num_teams Number of teams to populate the match with
 * @param {Boolean} distribute Whether to evenly distribute teams
 * @returns Array of teams for a new match.
 */
function generate_match_teams(num_teams, distribute=true)
{
    let match_teams = []
    let unavailable = []
    let teams = dal.team_numbers

    let match_num = dal.match_keys.length // technically last match number
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
        if (cycle * cycle_len === match_num && match_num !== 0)
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
 * Generates a new teams file for the event using the team parameters, plus an empty matches file.
 */
function generate_teams()
{
    let teams = []
    let team_nums = team_list.element.value
    if (team_nums.includes(','))
    {
        pull_teams(dal.event_id, team_nums)
    }
    else
    {
        let num_teams = teams_entry.element.value
        for (let team_num = 1; team_num <= num_teams; team_num++)
        {
            teams.push(generate_team(team_num))
        }
        team_list.element.value = teams.map(t => t.team_number).join(',')

        save_teams(dal.event_id, teams)
    }
}

/**
 * Saves a generated list of teams and the event to localStorage.
 * @param {String} event_id Event ID to generate teams for.
 * @param {Array} teams Team numbers to add to teams file.
 */
 function save_teams(event_id, teams)
 {
    localStorage.setItem(`teams-${event_id}`, JSON.stringify(teams))
    if (dal.match_keys.length === 0 || confirm('Matches already exist, erase them?'))
    {
        localStorage.setItem(`matches-${event_id}`, '[]')
    }

    let name = name_entry.element.value.trim()
    if (!name)
    {
        name = dal.event_name
    }

    localStorage.setItem(`event-${event_id}`, JSON.stringify({
        name: name,
        playoff_type: 10,
        year: cfg.year,
        event_code: event_id.substring(4)
    }))

    dal.load_teams()
    populate_matches()
}

/**
 * Generates a new teams file for the event using the current list of team numbers.
 * Attempts to pull team info from TBA.
 * @param {String} event_id Event ID to pull teams for.
 * @param {Array} team_list Team numbers to pull from TBA.
 */
function pull_teams(event_id, team_list)
{
    let key = cfg.tba_key
    let key_query = `?${TBA_AUTH_KEY}=${key}`

    // split up list of teams
    let team_nums = team_list.split(',').map(t => t.trim())
    let teams = []

    let count = 0
    for (let team_num of team_nums)
    {
        if (key)
        {
            fetch(`https://www.thebluealliance.com/api/v3/team/frc${team_num}/simple${key_query}`)
                .then(response => {
                    return response.json()
                })
                .then(team => {
                    if ('Error' in team)
                    {
                        throw team.Error
                    }
                    teams.push(team)

                    let year = event_id.substring(0, 4)
                    fetch(`https://www.thebluealliance.com/api/v3/team/frc${team.team_number}/media/${year}${key_query}`)
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
                    teams.push(generate_team(team_num))

                    if (++count === team_nums.length)
                    {
                        save_teams(event_id, teams)
                    }
                })
        }
        else
        {
            teams.push(generate_team(team_num))

            if (++count === team_nums.length)
            {
                save_teams(event_id, teams)
            }
        }
    }
}

/**
 * Generates a new team from a team number.
 * @param {Number} team_num Team number to assign the generated team.
 * @returns A team object with default values.
 */
function generate_team(team_num)
{
    return {
        city: 'Generated Team',
        country: 'GT',
        key: `frc${team_num}`,
        name: `Generated Team ${team_num}`,
        nickname: `Generated Team ${team_num}`,
        state_prov: 'GT',
        team_number: team_num
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
 * Adds a new match with the given parameters to the match file.
 */
function add_match()
{
    let alliance_teams = alliance_entry.element.value
    let file_name = `matches-${dal.event_id}`
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
        event_key: dal.event_id,
        key: `${dal.event_id}_${comp_level}${match_number}`,
        match_number: match_number,
        predicted_time: time,
        set_number: elim ? match_number : 1,
        time: time
    })
    localStorage.setItem(file_name, JSON.stringify(matches))

    dal.load_matches()
    populate_matches()
}