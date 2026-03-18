/**
 * file:        partner-matches.js
 * description: Generates a spreadsheet of alliance partners for a given team and their previous match.
 * author:      Liam Fruzyna
 * date:        2026-03-1
 */

var team_el

/**
 * Builds the structure of the page on page load.
 */
function init_page()
{
    header_info.innerText = 'Partner Matches'

    if (dal.match_keys.length > 0)
    {
        team_el = new WREntry('Team Number', cfg.user.settings.team_number)
        team_el.type = 'number'

        let button = new WRButton('Generate', generate)
        preview.replaceChildren(new WRPage('', [new WRColumn('', [team_el, button])]))
    }
    else
    {
        add_error_card('No Match Data Found', 'Please preload event')
    }
}

/**
 * Generates a CSV file for the specified team.
 */
function generate()
{
    let team = parseInt(team_el.element.value)

    let matches = [`Match #,Partners of,${team}`]
    for (let key of dal.teams[team].matches)
    {
        let match_num = dal.matches[key].match_num
        let alliances = dal.get_match_alliances(key)
        let match_teams = alliances[0].includes(team) ? alliances[0] : alliances[1]

        let match = [`Match ${match_num}`]
        for (let team_num of match_teams)
        {
            if (team_num !== team)
            {
                match.push(`${team_num}: ${dal.get_last_team_match(match_num, team_num)}`)
            }
        }
        matches.push(match.join(','))
    }

    download_object(`${dal.event_id}-${team}-partner-export.csv`, matches.join('\n'))
}