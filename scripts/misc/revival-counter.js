/**
 * file:        revival-counter.js
 * description: Counts the number of teams that have been "revived" and when teams went inactive.
 * author:      Liam Fruzyna
 * date:        2022-12-07
 */

let gaps_tab, lasts_tab

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
	gaps_tab = document.createElement('table')
	gaps_tab.style.textAlign = 'right'
	lasts_tab = document.createElement('table')
	lasts_tab.style.textAlign = 'right'
	let gaps = new Card('gaps_card', gaps_tab)
	let lasts = new Card('lasts_card', lasts_tab)
	document.body.append(new PageFrame('', '', [gaps, lasts]).element)

	gaps_tab.insertRow().append(create_header('Consecutive Years Inactive'), create_header('Num Team Nums'), create_header('Teams'))
	lasts_tab.insertRow().append(create_header('Last Year Before Inactive'), create_header('Num Team Nums'))

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

	let gaps = {}
	let lasts = {}
	let loop_complete = false
	let total_teams = 0
	let loaded_teams = 0
	for (let i = 0; i * 500 < 10000; i++)
	{
        fetch(`https://www.thebluealliance.com/api/v3/teams/${i}/keys${build_query({[TBA_AUTH_KEY]: TBA_KEY})}`)
            .then(response => {
                if (response.status === 401) {
                    alert('Invalid API Key Suspected')
                }
                return response.json()
            })
            .then(keys => {
				total_teams += keys.length
				for (let team of keys)
				{
					fetch(`https://www.thebluealliance.com/api/v3/team/${team}/years_participated${build_query({[TBA_AUTH_KEY]: TBA_KEY})}`)
						.then(response => {
							if (response.status === 401) {
								alert('Invalid API Key Suspected')
							}
							return response.json()
						})
						.then(years => {
							// look for gaps in participation
							for (let i in years)
							{
								let last = years[i-1]
								let delta = years[i] - last - 1
								if (i > 0 && delta > 0)
								{
									if (!gaps.hasOwnProperty(delta))
									{
										gaps[delta] = []
									}
									if (!lasts.hasOwnProperty(last))
									{
										lasts[last] = []
									}
									// log year last year active and period of inactivity
									gaps[delta].push(team.substring(3))
									lasts[last].push(team.substring(3))
								}
							}
							// look for inactive teams
							let last = years[years.length - 1]
							if (years[years.length - 1] < cfg.year)
							{
								if (!lasts.hasOwnProperty(last))
								{
									lasts[last] = []
								}
								// log last year active
								lasts[last].push(team.substring(3))
							}

							if (++loaded_teams === total_teams && loop_complete)
							{
								for (let years in gaps)
								{
									let teams = ''
									if (gaps[years].length <= 5)
									{
										teams = gaps[years].join(', ')
									}
									let row = gaps_tab.insertRow()
									row.insertCell().innerText = years
									row.insertCell().innerText = gaps[years].length
									row.insertCell().innerText = teams
								}
								for (let years in lasts)
								{
									let row = lasts_tab.insertRow()
									row.insertCell().innerText = years
									row.insertCell().innerText = lasts[years].length
								}
							}
						})
						.catch(err => {
							console.log(`Error fetching ${team} years, ${err}`)
						})
				}
			})
            .catch(err => {
                console.log(`Error fetching ${year} events, ${err}`)
            })

		// sleep 5 seconds to prevent memory/socket errors
		await new Promise(r => setTimeout(r, 5000))
    }

	// mark loop complete to prevent finishing early
	loop_complete = true
}