/**
 * file:        progress.js
 * description: Page to display what results exist.
 * author:      Liam Fruzyna
 * date:        2022-01-31
 */

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
    let key = `<table><tr><th style="background-color: green">Complete</th><th style="background-color: yellowgreen">Match Only</th>
                          <th style="background-color: yellow">Note Only</th><th style="background-color: orange">Unsure</th>
                          <th style="background-color: red">Unscouted</th></tr></table>`

    // build match result table
    let matches = Object.keys(dal.matches)
    matches.sort((a, b) => dal.get_match_value(a, 'scheduled_time') - dal.get_match_value(b, 'scheduled_time'))
    let keys = Object.values(dal.get_team_keys(event_id))
    for (let key of keys)
    {
        match_table += `<th>${key}</th>`
    }
    match_table += '</tr>'
    for (let match of matches)
    {
        match_table += `<tr><th>${dal.get_match_value(match, 'short_match_name')}</th>`
        let teams = dal.get_match_teams(match)
        for (let team_key of Object.keys(teams))
        {
            let team = teams[team_key]
            let alliance = team_key.substring(0, team_key.indexOf('_'))
            let color = 'red'
            let link = ''
            let match_scouted = dal.is_match_scouted(match, team)
            let note_scouted = dal.is_note_scouted(match, team)
            if (match_scouted || note_scouted)
            {
                if (dal.get_result_value(team, match, 'meta_unsure'))
                {
                    color = 'orange'
                    link = open_page('scout', {type: MATCH_MODE, match: match, team: team, alliance: alliance, edit: true})
                }
                else if (match_scouted && note_scouted)
                {
                    color = 'green'
                    link = open_page('results', {'file': `${match}-${team}`})
                }
                else if (match_scouted)
                {
                    color = 'yellowgreen'
                    link = open_page('results', {'file': `${match}-${team}`})
                }
                else if (note_scouted)
                {
                    color = 'yellow'
                    link = open_page('results', {'file': `${match}-${team}`})
                }
            }
            else
            {
                color = 'red'
                link = open_page('scout', {type: MATCH_MODE, match: match, team: team, alliance: alliance, edit: false})
            }
            match_table += `<td style="background-color: ${color}" onclick="window_open('${link}', '_self')">${team}</td>`
        }
        match_table += '</tr>'
    }
    match_table += '</table>'

    // build pit result table
    let teams = Object.keys(dal.teams)
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
        let color = 'red'
        let link = ''
        if (dal.is_pit_scouted(teams[i]))
        {
            color = 'green'
            link = open_page('scout', {type: PIT_MODE, team: teams[i], edit: true})
        }
        else
        {
            color = 'red'
            link = open_page('scout', {type: PIT_MODE, team: teams[i], edit: false})
        }
        pit_table += `<td style="background-color: ${color}" onclick="window_open('${link}', '_self')">${teams[i]}</td>`
    }
    pit_table += '</tr></table>'

    // add both tables to the page in cards
    let page = new PageFrame('', '')

    let pit = new ColumnFrame('pit_page', 'Pit Progress')
    page.add_column(pit)
    let pit_card = new Card('pits', pit_table)
    pit.add_input(pit_card)

    let match = new ColumnFrame('match_page', 'Match Progress')
    page.add_column(match)
    let match_card = new Card('matches', `${key}${match_table}`)
    match.add_input(match_card)

    document.body.innerHTML += page.toString
}