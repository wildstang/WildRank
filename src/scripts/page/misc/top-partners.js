/**
 * file:        top-partners.js
 * description: Displays a table summarizing all partners at event wins.
 * author:      Liam Fruzyna
 * date:        2023-04-14
 */

WINNER_TYPE = 1

var partners = {}

var summary, table, team

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Populates the page's inputs.
 */
function init_page()
{
    team = new WREntry('Team', cfg.user.settings.team_number)
    team.type = 'number'
    let entry_col = new WRColumn('', [team])
    let run = new WRButton('Run', handle_team)
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
    preview.append(new WRPage('', [entry_col, button_col, card]))
}

/**
 * function:    handle_team
 * parameters:  none
 * returns:     none
 * description: Fetches awards and partners.
 */
function handle_team()
{
    team_num = team.element.value
    summary.innerText = 'Loading data....'
    table.replaceChildren()

    // request the TBA key if it doesn't already exist
    let key_query = cfg.tba_query
    if (!key_query)
    {
        return
    }

    let total = 0
    let count = 0

    // fetch list of team-year's awards
    fetch(`https://www.thebluealliance.com/api/v3/team/frc${team_num}/awards${key_query}`)
        .then(response => {
            if (response.status === 401) {
                alert('Invalid API Key Suspected')
            }
            return response.json()
        })
        .then(awards => {
            for (let award of awards)
            {
                // filter to only event wins
                if (award.award_type === WINNER_TYPE)
                {
                    total++
                    // fetch list of events's awards
                    fetch(`https://www.thebluealliance.com/api/v3/event/${award.event_key}/awards${key_query}`)
                        .then(response => {
                            if (response.status === 401) {
                                alert('Invalid API Key Suspected')
                            }
                            return response.json()
                        })
                        .then(event_awards => {
                            for (let e_award of event_awards)
                            {
                                // filter to only the event's winners
                                if (e_award.award_type === WINNER_TYPE)
                                {
                                    for (let winner of e_award.recipient_list)
                                    {
                                        // remove the requested team
                                        let partner = winner.team_key.substring(3)
                                        if (partner !== team_num)
                                        {
                                            // add partner-event to list
                                            if (!(partner in partners))
                                            {
                                                partners[partner] = []
                                            }
                                            partners[partner].push(e_award.event_key)
                                        }
                                    }
                                }
                            }
                           
                            // build a table when everything has been fetched
                            if (++count === total)
                            {
                                populate_table()
                            }
                        })
                        .catch(err => {
                            console.log(`Error fetching ${award.event_key} status, ${err}`)
                        })
                }
            }
        })
        .catch(err => {
            console.log(`Error fetching ${team_num} awards, ${err}`)
        })
}

/**
 * function:    populate_table
 * parameters:  none
 * returns:     none
 * description: Populates the table with all partners.
 */
function populate_table()
{
    table.append(create_header_row(['Team', 'Banners', 'Events']))

    let max = []
    let teams = Object.keys(partners)
    for (let partner of teams)
    {
        let events = partners[partner]
        let row = table.insertRow()
        row.insertCell().innerText = partner
        row.insertCell().innerText = events.length
        row.insertCell().innerText = events.join(', ')
        if (max.length === 0 || events.length > partners[max[0]].length)
        {
            max = [partner]
        }
        else if (events.length === partners[max[0]].length)
        {
            max.push(partner)
        }
    }

    let team_num = team.element.value
    summary.innerHTML = `${team_num} has won with ${Object.keys(partners).length} unique partners.<br>${max.join(', ')} has won ${partners[max[0]].length} events with ${team_num}.`
}