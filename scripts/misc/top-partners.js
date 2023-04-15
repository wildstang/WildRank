/**
 * file:        top-partners.js
 * description: Displays a table summarizing all partners at event wins.
 * author:      Liam Fruzyna
 * date:        2023-04-14
 */

WINNER_TYPE = 1

var partners = {}

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Populates the page's inputs.
 */
function init_page()
{
    let team = new Entry('team', 'Team', cfg.settings.team_number)
    team.type = 'number'
    let entry_col = new ColumnFrame('', '', [team])
    let run = new Button('run', 'Run', 'handle_team()')
    let button_col = new ColumnFrame('', '', ['<h4 class="input_label">&nbsp;</h4>', run])
    let card = new Card('card', '<div id="summary"></div><table id="table" style="text-align: right"></table>')
    document.body.innerHTML += new PageFrame('', '', [entry_col, button_col, card]).toString
}

/**
 * function:    handle_team
 * parameters:  none
 * returns:     none
 * description: Fetches awards and partners.
 */
function handle_team()
{
    let team = document.getElementById('team').value
    document.getElementById('summary').innerHTML = 'Loading data....'
    document.getElementById('table').innerHTML = ''

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

    let total = 0
    let count = 0

    // fetch list of team-year's awards
    fetch(`https://www.thebluealliance.com/api/v3/team/frc${team}/awards${build_query({[TBA_AUTH_KEY]: TBA_KEY})}`)
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
                    fetch(`https://www.thebluealliance.com/api/v3/event/${award.event_key}/awards${build_query({[TBA_AUTH_KEY]: TBA_KEY})}`)
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
                                        if (partner !== team)
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
            console.log(`Error fetching ${team} awards, ${err}`)
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
    let team = document.getElementById('team').value
    let table = document.getElementById('table')
    document.getElementById('summary').innerHTML = `${team} has won with ${Object.keys(partners).length} unique partners.`
    table.innerHTML = '<tr><th>Team</th><th>Banners</th><th>Events</th></tr>'

    let teams = Object.keys(partners)
    for (let partner of teams)
    {
        let events = partners[partner]
        table.innerHTML += `<tr><td>${partner}</td><td>${events.length}</td><td>${events.join(', ')}</td></tr>`
    }
}