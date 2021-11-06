/**
 * file:        selection-pages.js
 * description: Contains functions for more specific selection page configurations.
 * author:      Liam Fruzyna
 * date:        2021-11-05
 */

const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const type = get_parameter(TYPE_COOKIE, TYPE_DEFAULT)
const prefix = `${type}-${event_id}-`
const year = event_id.substr(0,4)

/**
 * function:    populate_matches
 * parameters:  if finals matches should be used, if matches should be marked as completed
 * returns:     default selection
 * description: Populates the left options list with matches.
 * 
 * Pages: Match/Note Scout, Whiteboard, Match Summaries, Coach View
 */
function populate_matches(finals=true, complete=true)
{
    document.getElementById('option_list').innerHTML = ''
    
    let file_name = get_event_matches_name(event_id)
    if (localStorage.getItem(file_name) != null)
    {
        let matches = JSON.parse(localStorage.getItem(file_name))
        let first = ''
        matches.sort((a, b) => a.time - b.time)

        // iterate through each match obj
        for (let match of matches)
        {
            let number = match.match_number
            let red_teams = match.alliances.red.team_keys
            let blue_teams = match.alliances.blue.team_keys
            
            if (match.comp_level == 'qm' || finals)
            {
                // grey out previously scouted matches/teams
                let scouted = 'not_scouted'
                let level = match.comp_level.replace('qm', '').toUpperCase()
                if (complete && ((match.alliances.red.score && match.alliances.red.score >= 0) || (is_match_scouted(event_id, number) && level == '')))
                {
                    scouted = 'scouted'
                    first = ''
                }
                else if (first == '')
                {
                    first = number
                }
                if (level && level != 'F')
                {
                    level += match.set_number
                }
    
                document.getElementById('option_list').innerHTML += build_match_option(`${level}${number}`, red_teams, blue_teams, scouted, `${level}${number}`)
            }
        }
        // default to first match if no first was selected
        if (first == '')
        {
            first = matches[0].match_number
        }
        
        //open_match(first)
        scroll_to('option_list', `match_${first}`)
        return first
    }
    else
    {
        alert('No matches found')
        return false
    }
}

/**
 * function:    populate_teams
 * parameters:  if minipicklists is needed, if teams should be marked as complete, if secondary panel should be added
 * returns:     default selection
 * description: Populates the left options list with teams and activates the mini-picklist.
 * 
 * Pages: Pit Scout, Pick Lists, Advanced Stats, Team Profiles, Side-by-Side
 */
function populate_teams(minipicklist=true, complete=false, secondary=false)
{
    document.getElementById('option_list').innerHTML = ''
    document.getElementById('secondary_option_list').innerHTML = ''

    let file_name = get_event_teams_name(event_id)
    if (localStorage.getItem(file_name) != null)
    {
        let teams = JSON.parse(localStorage.getItem(file_name))
        let first = ''
        let second = ''

        // iterate through team objs
        for (let team of teams)
        {
            let number = team.team_number
            // determine if the team has already been scouted
            let scouted = 'not_scouted'
            if (complete && file_exists(get_pit_result(number, event_id)))
            {
                first = ''
                scouted = 'scouted'
            }
            else if (first == '')
            {
                first = number
            }
            else if (second == '')
            {
                second = number
            }
            
            // replace placeholders in template and add to screen
            document.getElementById('option_list').innerHTML += build_option(number, scouted)
            if (secondary)
            {
                document.getElementById('secondary_option_list').innerHTML += build_option(number, scouted, '', '', false)
            }
        }

        if (minipicklist)
        {
            setup_picklists()
        }

        scroll_to('option_list', `option_${first}`)
        if (secondary)
        {
            enable_secondary_list()
            scroll_to('secondary_option_list', `soption_${first}`)
            return [first, second]
        }

        return first
    }
    else
    {
        alert('No teams found')
        return false
    }
}

/**
 * function:    populate_keys
 * parameters:  results, teams
 * returns:     default selection
 * description: Populates the left options list with keys and the right with teams.
 * 
 * Pages: Pivot Table, Distributions
 */
function populate_keys(results, teams)
{
    document.getElementById('option_list').innerHTML = ''
    document.getElementById('secondary_option_list').innerHTML = ''

    if (Object.keys(results).length > 0)
    {
        let keys = Object.keys(results[Object.keys(results)[0]]).filter(function (key)
        {
            let type = get_type(key)
            return !key.startsWith('meta_') && type != 'cycle' && type != 'string' && type != 'text'
        })
        
        // add pick list selector at top
        let ops = Object.keys(lists)
        ops.unshift('None')
        
        // iterate through result keys
        for (let key of keys)
        {
            document.getElementById('option_list').innerHTML += build_option(key, '', get_name(key), 'font-size:10px')
        }
        
        // add second option list of teams
        for (let team of teams)
        {
            document.getElementById('secondary_option_list').innerHTML += build_option(team, '', '', '', false)
        }

        enable_secondary_list()
        return keys[0]
    }
    else
    {
        alert('No results found')
        return false
    }
}

/**
 * function:    populate_other
 * parameters:  options
 * returns:     default selection
 * description: Populates the left options list with a given list of options.
 * 
 * Pages: User Profiles, Results, Team Rankings
 */
function populate_other(options)
{
    document.getElementById('option_list').innerHTML = ''

    // determine if passed list or array
    let names = []
    if (typeof options === 'object' && !Array.isArray(options) && options !== null)
    {
        names = options
        options = Object.keys(options)
    }
    if (options)
    {
        let first = ''
        // iterate through each match obj
        for (let op of options)
        {
            if (first == '')
            {
                first = op
            }
    
            // replace placeholders in template and add to screen
            let name = names ? names[op] : op
            document.getElementById('option_list').innerHTML += build_option(op, '', name)
        }
        
        scroll_to('option_list', `option_${first}`)
        return first
    }
    return false
}