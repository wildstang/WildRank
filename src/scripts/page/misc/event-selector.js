/**
 * file:        event-selector.js
 * description: Allows a user to select an event.
 * author:      Liam Fruzyna
 * date:        2026-01-24
 */

var team, year

/**
 * Runs onload to fill out the page.
 */
function init_page()
{
    team = new WREntry('Team', cfg.user.settings.team_number)
    team.type = 'number'
    year = new WREntry('Year', cfg.year)
    year.type = 'number'
    let label = document.createElement('h4')
    label.className = 'input_label'
    label.innerHTML = '&nbsp;'
    let button = new WRButton('Search', find_events)
    let page = new WRPage('', [new WRColumn('', [year]),
                               new WRColumn('', [team]),
                               new WRColumn('', [label, button])])
    
    let results = document.createElement('div')
    results.id = 'results'

    preview.replaceChildren(page, results)
    find_events()
}

/**
 * Finds all events for the team-year.
 */
function find_events()
{
    // request the TBA key if it doesn't already exist
    let key_query = cfg.tba_query
    if (!key_query)
    {
        return
    }

    let today = new Date()

    // fetch list of all events in the year
    fetch(`https://www.thebluealliance.com/api/v3/team/frc${team.element.value}/events/${year.element.value}/simple${key_query}`)
        .then(response => {
            if (response.status === 401) {
                alert('Invalid API Key Suspected')
            }
            return response.json()
        })
        .then(events => {
            let previous = new WRColumn(`Previous Events`)
            let upcoming = new WRColumn(`Upcoming Events`)
            for (let event of events)
            {
                let button = new WRButton(event.name, () => cfg.update_event_id(event.key, home))
                if (new Date(event.end_date) < today)
                {
                    previous.add_input(button)
                }
                else
                {
                    upcoming.add_input(button)
                }
            }
            document.getElementById('results').replaceChildren(new WRPage('', [previous, upcoming]))
        })
        .catch(err => {
            console.log(`Error fetching ${111} events, ${err}`)
        })
}