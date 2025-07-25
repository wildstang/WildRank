/**
 * file:        verde.js
 * description: Displays summary notable results for event teams.
 * author:      Liam Fruzyna
 * date:        2024-03-30
 */

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    document.getElementById('title').innerText = 'VerdeRank'
    document.getElementById('header').style.background = 'Green'

    let contents = document.createElement('span')
    let summary = document.createElement('div')
    summary.innerText = 'Loading data...'
    let table = document.createElement('table')
    table.style.textAlign = 'left'
    contents.append(summary, table)

    let year = parseInt(cfg.year)
    table.append(create_header_row(['Team', '', 'HoF', 'Champ', 'Reigning Champ', `${year} Event Impact`, `${year} Event Wins`,
        'Reigning Event Winner', `${year} Event Finalists`, 'EI', `${year - 1} Event Wins`]))

    let card = new WRCard(contents)
    preview.append(new WRPage('', [card]))

    let teams = dal.team_numbers
    if (teams.length > 0)
    {
        let awards = {}

        // request the TBA key if it doesn't already exist
        let key_query = cfg.tba_query
        if (!key_query)
        {
            return
        }

        for (let team of teams)
        {
            fetch(`https://www.thebluealliance.com/api/v3/team/frc${team}/awards${key_query}`)
                .then(response => {
                    if (response.status == 401)
                    {
                        alert('Invalid API Key Suspected')
                    }
                    return response.json()
                })
                .then(data => {
                    let award_list = {
                        champs: 0,
                        prev_champ: 0,
                        impact: 0,
                        event_wins: 0,
                        event_impact: 0,
                        event_finalist: 0,
                        prev_winner: 0,
                        prev_event_wins: 0,
                        ei: 0
                    }
                    for (let award of data)
                    {
                        let champ = award.event_key.startsWith(`${award.year}cmp`)
                        switch (award.award_type)
                        {
                            case 0:
                                if (champ)
                                {
                                    award_list.impact++
                                }
                                else if (award.year === year)
                                {
                                    award_list.event_impact++
                                }
                                break
                            case 1:
                                if (champ)
                                {
                                    award_list.champs++
                                    if (award.event_key === award.event_key.replace(award.year, year - 1))
                                    {
                                        award_list.prev_champ++
                                    }
                                }
                                else if (award.year === year)
                                {
                                    award_list.event_wins++
                                }
                                else if (award.year === year - 1)
                                {
                                    award_list.prev_event_wins++
                                    if (award.event_key === dal.event_id.replace(year, year - 1))
                                    {
                                        award_list.prev_winner++
                                    }
                                }
                                break
                            case 2:
                                if (award.year === year)
                                {
                                    award_list.event_finalist++
                                }
                                break
                            case 9:
                                if (award.year === year)
                                {
                                    award_list.ei++
                                }
                                break
                        }
                    }

                    awards[team] = award_list

                    if (Object.keys(awards).length === teams.length)
                    {
                        for (let team in awards)
                        {
                            let award_list = awards[team]
                            if (award_list.champs + award_list.impact + award_list.event_wins + award_list.event_impact +
                                award_list.event_finalist + award_list.prev_event_wins + award_list.ei > 0)
                            {
                                let row = table.insertRow()
                                row.append(create_header(team))
                                row.append(create_header(dal.teams[team].name))
                                row.insertCell().innerText = award_list.impact ? award_list.impact : ''
                                row.insertCell().innerText = award_list.champs ? award_list.champs : ''
                                row.insertCell().innerText = award_list.prev_champ ? '✔' : ''
                                row.insertCell().innerText = award_list.event_impact ? award_list.event_impact : ''
                                row.insertCell().innerText = award_list.event_wins ? award_list.event_wins : ''
                                row.insertCell().innerText = award_list.prev_winner ? '✔' : ''
                                row.insertCell().innerText = award_list.event_finalist ? award_list.event_finalist : ''
                                row.insertCell().innerText = award_list.ei ? award_list.ei : ''
                                row.insertCell().innerText = award_list.prev_event_wins ? award_list.prev_event_wins : ''
                            }
                        }
                        summary.innerText = dal.event_id
                    }
                })
                .catch(err => {
                    console.log(`Error fetching team, ${err}`)
                    awards[team] = []
                })
        }
    }
    else
    {
        summary.innerText = 'No teams found'
    }
}