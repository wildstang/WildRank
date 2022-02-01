/**
 * file:        progress.js
 * description: Page to display what results exist.
 * author:      Liam Fruzyna
 * date:        2022-01-31
 */

// read parameters from URL
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    // set header
    document.getElementById('header_info').innerHTML = 'Scouting Progress'
    
    let match_table = '<table><tr><td></td>'
    let pit_table = '<table><tr>'
    
    // build match result table
    let file_name = get_event_matches_name(event_id)
    if (localStorage.getItem(file_name) != null)
    {
        let matches = JSON.parse(localStorage.getItem(file_name))
        matches.sort((a, b) => a.time - b.time)
        let keys = get_team_keys(event_id)
        for (let key of keys)
        {
            match_table += `<th>${key}</th>`
        }
        match_table += '</tr>'
        for (let match of matches)
        {
            match_table += `<tr><th>${match.match_number}</th>`
            for (let key of keys)
            {
                let team = extract_match_teams(match)[key.toLowerCase().replaceAll(' ', '')]
                let color = file_exists(get_match_result(match.match_number, team, event_id)) ? 'green' : 'red'
                match_table += `<td style="background-color: ${color}">${team}</td>`
            }
            match_table += '</tr>'
        }
        match_table += '</table>'
    }
    
    // build pit result table
    file_name = get_event_teams_name(event_id)
    if (localStorage.getItem(file_name) != null)
    {
        let teams = JSON.parse(localStorage.getItem(file_name))
        teams.sort((a, b) => a.team_number - b.team_number)
        for (let i in teams)
        {
            if (i % 7 == 0)
            {
                if (i != 0)
                {
                    pit_table += '</tr>'
                }
                pit_table += '<tr>'
            }
            let color = file_exists(get_pit_result(teams[i].team_number, event_id)) ? 'green' : 'red'
            pit_table += `<td style="background-color: ${color}">${teams[i].team_number}</td>`
        }
        pit_table += '</tr></table>'
    }

    // add both tables to the page in cards
    document.body.innerHTML += build_page_frame('', [
        build_column_frame('Pit Progress', [
            build_card('pits', pit_table)
        ]),
        build_column_frame('Match Progress', [
            build_card('matches', match_table)
        ])
    ])
}