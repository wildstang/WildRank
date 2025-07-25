/**
 * file:        socials.js
 * description: Displays a table summarizing the social media account of a team at a given event.
 * author:      Liam Fruzyna
 * date:        2025-03-17
 */

var summary, table, event_entry
var csv

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    header_info.innerText = 'Team Socials'
    event_entry = new WREntry('Event ID', dal.event_id)
    let entry_col = new WRColumn('', [event_entry])
    let run = new WRButton('Run', process_event)
    let label = document.createElement('h4')
    label.className = 'input_label'
    label.innerHTML = '&nbsp;'
    let button_col = new WRColumn('', [label, run])
    let card_contents = document.createElement('span')
    summary = document.createElement('summary')
    table = document.createElement('table')
    table.style.textAlign = 'right'
    card_contents.append(summary, table)
    let card = new WRCard(card_contents)
    let export_button = new WRButton('Download CSV', download_csv)
    preview.append(new WRPage('', [entry_col, button_col, card, export_button]))
}


/**
 * Fetches data from TBA and builds a table of social media accounts.
 */
function process_event()
{
    let event_id = event_entry.element.value
    summary.innerText = 'Loading data....'

    table.replaceChildren(create_header_row(['Team', 'Facebook', 'Github', 'Instagram', 'Twitter', 'YouTube']))

    let key_query = cfg.tba_query
    if (!key_query)
    {
        return
    }

    let platforms = ['facebook-profile', 'github-profile', 'instagram-profile', 'twitter-profile', 'youtube-channel']
    let team_socials = {}
    // fetch list of all events in the year
    fetch(`https://www.thebluealliance.com/api/v3/event/${event_id}/teams/keys${key_query}`)
        .then(response => {
            if (response.status === 401) {
                alert('Invalid API Key Suspected')
            }
            return response.json()
        })
        .then(teams => {
            for (let team of teams)
            {
                fetch(`https://www.thebluealliance.com/api/v3/team/${team}/social_media${key_query}`)
                    .then(response => {
                        if (response.status === 401) {
                            alert('Invalid API Key Suspected')
                        }
                        return response.json()
                    })
                    .then(socials => {
                        let t = parseInt(team.substring(3))
                        team_socials[t] = Array(platforms.length).fill('')
                        for (let social of socials)
                        {
                            let index = platforms.indexOf(social.type)
                            if (index >= 0)
                            {
                                team_socials[t][index] = social.foreign_key
                            }
                            else
                            {
                                console.log('Missing', social)
                            }
                        }

                        if (Object.keys(team_socials).length === teams.length)
                        {
                            csv = ''
                            let team_keys = Object.keys(team_socials).sort((a,b) => a - b)
                            for (let team of team_keys)
                            {
                                let row = table.insertRow()
                                row.append(create_header(team))
                                csv += team

                                for (let i = 0; i < platforms.length; i++)
                                {
                                    let name = team_socials[team][i]
                                    if (name)
                                    {
                                        let link = document.createElement('a')
                                        link.innerText = name
                                        link.href = `https://${platforms[i].split('-')[0]}.com/${name}`
                                        row.insertCell().append(link)
                                        csv += `,https://${platforms[i].split('-')[0]}.com/${name}`
                                    }
                                    else
                                    {
                                        row.insertCell()
                                        csv += ','
                                    }
                                }

                                csv += '\n'
                            }
                            summary.innerText = ''
                        }
                    })
                    .catch(err => {
                        console.log(`Error fetching ${team} socials, ${err}`)
                    })
            }
        })
        .catch(err => {
            console.log(`Error fetching ${event_id} teams, ${err}`)
        })
}

/**
 * Downloads the generated table as a CSV
 */
function download_csv()
{
    if (!csv)
    {
        alert('Press run first')
        return
    }

    let element = document.createElement('a')
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv))
    element.setAttribute('download', `${event_entry.element.value}`)

    element.style.display = 'none'
    body.appendChild(element)

    element.click()

    body.removeChild(element)
}