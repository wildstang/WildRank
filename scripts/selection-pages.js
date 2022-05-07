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
 * function:    check_teams
 * parameters:  desired list of teams, teams to check
 * returns:     if there is a matching team
 * description: Returns true if any team of match_teams is in teams.
 */
function check_teams(teams, match_teams)
{
    for (let team of match_teams)
    {
        if (teams.includes(team))
        {
            return true
        }
    }
    return false
}

/**
 * function:    populate_matches
 * parameters:  if finals matches should be used, if matches should be marked as completed
 * returns:     default selection
 * description: Populates the left options list with matches.
 * 
 * Pages: Match/Note Scout, Whiteboard, Match Summaries, Coach View
 */
function populate_matches(finals=true, complete=true, team_filter='', secondary=false)
{
    let list = 'option_list'
    if (secondary)
    {
        enable_secondary_list()
        list = 'secondary_option_list'
    }
    document.getElementById(list).innerHTML = ''
    
    let matches = Object.keys(dal.matches)
    let first = ''
    let first_avail = ''
    matches.sort((a, b) => dal.matches[a].scheduled_time - dal.matches[b].scheduled_time)

    // determine if event has been completed outside of WildRank
    let completes = matches.map(m => dal.matches[m].winner !== null)
    let completeTBA = completes.every(Boolean)

    // iterate through each match obj
    for (let match_key of matches)
    {
        let match = dal.matches[match_key]
        let number = match.match_number
        let red_teams = match.red_alliance
        let blue_teams = match.blue_alliance
        if ((match.comp_level == 'qm' || finals) &&
            (Array.isArray(team_filter) || (team_filter == '' || red_teams.includes(team_filter) || blue_teams.includes(team_filter))) &&
            (!Array.isArray(team_filter) || (team_filter.length == 0 || check_teams(team_filter, red_teams) || check_teams(team_filter, blue_teams))))
        {
            // grey out previously scouted matches/teams
            let scouted = 'not_scouted'
            let level = match.comp_level.toUpperCase()
            if (complete && ((!completeTBA && match.red_score && match.red_score >= 0) || (is_match_scouted(event_id, number) && level == 'QM')))
            {
                scouted = 'scouted'
                first = ''
            }
            else if (first === '')
            {
                first = match_key
            }
            if (first_avail === '')
            {
                first_avail = match_key
            }

            // build match name
            let option = new MatchOption(match_key, dal.get_match_value(match_key, 'short_match_name'), red_teams, blue_teams)
            document.getElementById(list).innerHTML += option.toString
        }
    }
    // default to first match if no first was selected
    if (first === '' && first_avail !== '')
    {
        first = first_avail
    }
    else if (first == '' && matches.length > 0)
    {
        first = matches[0]
    }
    
    if (first !== '')
    {
        scroll_to(list, `match_option_${first}`)
    }
    return first
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

    let teams = Object.keys(dal.teams)
    let first = ''
    let second = ''

    // iterate through team objs
    for (let number of teams)
    {
        let name = dal.get_value(number, 'meta.name')
        // determine if the team has already been scouted
        let scouted = 'not_scouted'
        if (complete && dal.is_pit_scouted(number))
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
        document.getElementById('option_list').innerHTML += build_desc_option(number, scouted, '', name)
        if (secondary)
        {
            document.getElementById('secondary_option_list').innerHTML += build_desc_option(number, scouted, '', name, '', false)
        }
    }

    if (minipicklist)
    {
        setup_picklists()
    }

    if (first == '' && teams.length > 0)
    {
        first = teams[0]
    }
    if (second == '' && teams.length > 1)
    {
        second = teams[1]
    }

    if (first !== '')
    {
        scroll_to('option_list', `option_${first}`)
        if (secondary && second !== '')
        {
            enable_secondary_list()
            scroll_to('secondary_option_list', `soption_${first}`)
            return [first, second]
        }
    }

    return first
}

/**
 * function:    populate_keys
 * parameters:  data abstraction layer
 * returns:     default selection
 * description: Populates the left options list with keys and the right with teams.
 * 
 * Pages: Pivot Table, Distributions
 */
function populate_keys(dal)
{
    document.getElementById('option_list').innerHTML = ''
    document.getElementById('secondary_option_list').innerHTML = ''

    let keys = dal.get_keys()
    if (keys.length > 0)
    {
        // add pick list selector at top
        let ops = Object.keys(lists)
        ops.unshift('None')
        
        // iterate through result keys
        for (let key of keys)
        {
            document.getElementById('option_list').innerHTML += build_option(key, '', dal.meta[key].name, 'font-size:10px')
        }
        
        // add second option list of teams
        let teams = Object.keys(dal.teams)
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
        let option_list = ''
        for (let op of options)
        {
            if (first == '')
            {
                first = op
            }
    
            // replace placeholders in template and add to screen
            let name = names ? names[op] : op
            option_list += build_option(op, '', name)
        }
        document.getElementById('option_list').innerHTML = option_list
        
        if (first !== '')
        {
            scroll_to('option_list', `option_${first}`)
        }
        return first
    }
    return false
}

/**
 * function:    select_none
 * parameters:  none
 * returns:     none
 * description: Selects the first option in the picklist dropdown "None".
 */
function select_none()
{
    let filter = document.getElementById('picklist_filter')
    if (filter)
    {
        filter.selectedIndex = 0
    }
}

/**
 * function:    add_dropdown_filter
 * parameters:  id of filter, filter options, on change filter, filter to be placed in
 * returns:     none
 * description: Builds a dropdown in a given filter box.
 */
function add_dropdown_filter(filter_id, options, func, primary_list=true)
{
    let id = 'filter'
    if (!primary_list)
    {
        id = 'secondary_filter'
    }
    document.getElementById(id).innerHTML = build_dropdown(filter_id, '', options, options[0], func)
    document.getElementById(filter_id).style.margin = '4px auto'
    document.getElementById(filter_id).style.width = `${300}px`
}

/**
 * function:    add_button_filter
 * parameters:  id of filter, text, on change filter, filter to be placed in
 * returns:     none
 * description: Builds a button in a given filter box.
 */
function add_button_filter(filter_id, text, func, primary_list=true)
{
    let id = 'filter'
    if (!primary_list)
    {
        id = 'secondary_filter'
    }
    document.getElementById(id).innerHTML += build_button(filter_id, text, func)
    document.getElementById(`${filter_id}-container`).style.margin = '4px auto'
    document.getElementById(`${filter_id}-container`).style.width = `${300}px`
}