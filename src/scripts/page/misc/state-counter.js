/**
 * file:        state-counter.js
 * description: Counts and lists the number of teams from Illinois..
 * author:      Liam Fruzyna
 * date:        2026-04-14
 */

let results

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
	results = document.createElement('span')
	results.innerText = 'Loading teams...'
	preview.append(new WRPage('', [new WRCard(results)]))

    process_teams()
}


/**
 * function:    process_teams
 * parameters:  none
 * returns:     none
 * description: Finds all teams with gap years.
 */
async function process_teams()
{
    // request the TBA key if it doesn't already exist
    let key_query = cfg.tba_query
    if (!key_query)
    {
        return
    }

	let state = 'Illinois'
	let state_teams = []
	let pages = 0
	for (let i = 0; i * 500 < 12000; i++)
	{
        fetch(`https://www.thebluealliance.com/api/v3/teams/2026/${i}${key_query}`)
            .then(response => {
                if (response.status === 401) {
                    alert('Invalid API Key Suspected')
                }
                return response.json()
            })
            .then(teams => {
				state_teams = state_teams.concat(teams.filter(t => t.state_prov === state).map(t => t.team_number))
				pages++
				if (pages === 12000 / 500)
				{
					results.innerHTML = `Found ${state_teams.length} from ${state}:<br><br>${state_teams.join(', ')}`
				}
			})
            .catch(err => {
                console.log(`Error fetching team, ${err}`)
            })
    }

	// mark loop complete to prevent finishing early
	loop_complete = true
}