/**
 * file:        schedule-importer.js
 * description: Page for building event data from a schedule PDF.
 *              Generates a teams file and helps build a matches file
 * author:      Liam Fruzyna
 * date:        2022-07-24
 */

const start = Date.now()

var event_entry, alliance_entry, schedule_entry

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
    let setup_page = new WRPage('Setup', [col])
    
    event_entry = new WREntry('Event ID', dal.event_id)
    col.add_input(event_entry)
    
    let alliance_size = dal.alliance_size
    if (alliance_size === 0)
    {
        alliance_size = 3
    }
    alliance_entry = new WREntry('Teams per Alliance', alliance_size, [1, 10])
    alliance_entry.type = 'number'
    col.add_input(alliance_entry)

    let generate_button = new WRButton('Generate Event Data', generate)
    col.add_input(generate_button)

    let matches_col = new WRColumn()
    let matches_page = new WRPage('Schedule Text', [matches_col])

    schedule_entry = new WRExtended('PDF Schedule Table')
    schedule_entry.description = 'Copy and paste the entire event schedule table after the headers.'
    matches_col.add_input(schedule_entry)

    // build page
    body.replaceChildren(setup_page, matches_page)
}

/**
 * function:    generate
 * parameters:  none
 * returns:     none
 * description: Generates a new teams and matches file for the event using the schedule table text.
 */
function generate()
{
    let lines = schedule_entry.element.value.replaceAll('*', '').trim().split('\n')
    let event_id = event_entry.element.value
    let alliance_teams = parseInt(alliance_entry.element.value)
    
    let teams = []
    let matches = []
    for (let line of lines)
    {
        let words = line.split(' ')

        // parse the limited date given
        let date = new Date()
        let times = words[1].split(':')
        date.setHours(parseInt(times[0]) + (words[2] === 'PM' ? 24 : 0), parseInt(times[1]))
        let current_day = date.getDay()
        let day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        let distance = (day.indexOf(words[0]) + 7 - current_day) % 7
        date.setDate(date.getDate() + distance)
        let time = Math.floor(date.getTime() / 1000)
        
        // parse competition level
        let comp_level = {
            'Qualification': 'qm',
            'Quarterfinal': 'qf',
            'Semifinal': 'sf',
            'Final': 'f'
        }[words[3]]
        let match_number = words[4]

        let match_teams = words.slice(5)
        let blue_teams = match_teams.slice(0, alliance_teams).map(t => `frc${t}`)
        let red_teams = match_teams.slice(alliance_teams).map(t => `frc${t}`)

        // build match object
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
            comp_level: comp_level,
            event_key: event_id,
            key: `${event_id}_${comp_level}${match_number}`,
            match_number: match_number,
            predicted_time: time,
            set_number: 1,
            time: time
        })

        for (let team of match_teams)
        {
            if (!teams.includes(team))
            {
                teams.push(team)
            }
        }
    }

    pull_teams(event_id, teams, matches)
}

/**
 * function:    save_data
 * parameters:  event id, list of teams objects, list of match objects
 * returns:     none
 * description: Saves generated lists of teams and matches to localStorage.
 */
 function save_data(event_id, teams, matches)
 {
    localStorage.setItem(`teams-${event_id}`, JSON.stringify(teams))
    localStorage.setItem(`matches-${event_id}`, JSON.stringify(matches))

    dal.build_teams()
    alert('Schedule saved!')
}

/**
 * function:    pull_teams
 * parameters:  event id, commas separated list of teams
 * returns:     none
 * description: Generates a new teams file for the event using the current list of team numbers.
 */
function pull_teams(event_id, team_nums, matches)
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
        if (!TBA_KEY)
        {
            alert('No API key found for TBA!')
            return
        }
    }

    // split up list of teams
    let teams = []

    let count = 0
    for (let team_num of team_nums)
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
                save_data(event_id, teams, matches)
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
                save_data(event_id, teams, matches)
            }
        })
    }
}