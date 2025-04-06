/**
 * file:        sponsor-counter.js
 * description: Displays a table summarizing the number of teams including a string in their name in a given year.
 * author:      Liam Fruzyna
 * date:        2025-01-18
 */

var summary, table, year_entry, search

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    year_entry = new WREntry('Year', cfg.year)
    year_entry.type = 'number'
    search = new WREntry('Sponsor', '')
    let entry_col = new WRColumn('', [search, year_entry])
    let run = new WRButton('Run', process_year)
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
    body.append(new WRPage('', [entry_col, button_col, card]))
}

/**
 * function:    process_year
 * parameters:  none
 * returns:     none
 * description: Counts the number of district teams at each regional.
 */
function process_year()
{
    let year = year_entry.element.value
    let sponsor = search.element.value.toLowerCase()
    summary.innerText = 'Loading data....'

    table.append(create_header_row(['Number', 'Nickname', 'Location', 'Name']))

    if (!TBA_KEY)
    {
        if (cfg.user.settings && cfg.user.settings.keys && cfg.user.settings.tba_key)
        {
            TBA_KEY = cfg.user.settings.tba_key
        }
        if (!TBA_KEY)
        {
            alert('No API key found for TBA!')
            return
        }
    }

    let count = 0
    let results = []
    for (let i = 0; i <= 21; i++)
    {
        // fetch list of all events in the year
        fetch(`https://www.thebluealliance.com/api/v3/teams/${year}/${i}/simple${build_query({[TBA_AUTH_KEY]: TBA_KEY})}`)
            .then(response => {
                if (response.status === 401) {
                    alert('Invalid API Key Suspected')
                }
                return response.json()
            })
            .then(teams => {
                if (teams)
                {
                    results = results.concat(teams.filter(t => t.name.toLowerCase().includes(sponsor)))
                }
                if (++count === 22)
                {
                    summary.innerText = `Found ${results.length} teams with "${sponsor}" in their name.`
                    results = results.sort((a, b) => a.team_number - b.team_number)
                    for (let team of results)
                    {
                        let row = table.insertRow()
                        row.insertCell().innerText = team.team_number
                        row.insertCell().innerText = team.nickname
                        row.insertCell().innerText = `${team.city}, ${team.state_prov}, ${team.country}`
                        row.insertCell().innerText = team.name
                    }
                }
            })
            .catch(err => {
                console.log(`Error fetching ${year} events, ${err}`)
            })
    }
}