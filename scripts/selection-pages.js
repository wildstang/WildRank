/**
 * file:        selection-pages.js
 * description: Contains functions for more specific selection page configurations.
 * author:      Liam Fruzyna
 * date:        2021-11-05
 */

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
 * Pages: Match Scout, Whiteboard, Match Summaries, Coach View
 */
function populate_matches(finals=true, complete=true, team_filter='', secondary=false, scout_pos=0, note=false)
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
            let teams = red_teams.concat(blue_teams)
            let is_scouted = (!note && dal.is_match_scouted(match_key, teams[scout_pos])) || (note && dal.is_note_scouted(match_key, teams[scout_pos]))
            if (complete && ((!completeTBA && match.red_score && match.red_score >= 0) || (is_scouted && level == 'QM')))
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
            let option = new WRMatchOption(match_key, dal.get_match_value(match_key, 'short_match_name'), red_teams, blue_teams, !secondary)
            option.add_class(scouted)
            document.getElementById(list).append(option)
        }
    }
    // default to first match if no first was selected
    if (first === '' && first_avail !== '')
    {
        first = first_avail
    }

    if (first !== '')
    {
        scroll_to(list, WROption.get_id(!secondary, 'match_option', first))
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
            /*if (dal.get_value(number, 'pit.meta_pit_unsure'))
            {
                scouted = 'highlighted'
            }*/
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
        let op = new WRDescriptiveOption(number, number, name)
        op.add_class(scouted)
        document.getElementById('option_list').append(op)
        if (secondary)
        {
            let op = new WRDescriptiveOption(number, number, name, false)
            op.add_class(scouted)
            document.getElementById('secondary_option_list').append(op)
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
        scroll_to('option_list', `left_pit_option_${first}`)
        if (secondary && second !== '')
        {
            enable_secondary_list()
            scroll_to('secondary_option_list', `right_pit_option_${first}`)
            return [first, second]
        }
    }

    return first
}

/**
 * function:    populate_keys
 * parameters:  data abstraction layer, use results only, exclude strings
 * returns:     default selection
 * description: Populates the left options list with keys and the right with teams.
 * 
 * Pages: Pivot Table, Distributions
 */
function populate_keys(dal, results_only=false, exclude_strings=false)
{
    document.getElementById('option_list').innerHTML = ''
    document.getElementById('secondary_option_list').innerHTML = ''

    let keys = dal.get_keys(true, !results_only, !results_only, !results_only, [], !exclude_strings)
    if (keys.length > 0)
    {
        // add pick list selector at top
        let ops = Object.keys(dal.picklists)
        ops.unshift('None')
        
        // iterate through result keys
        for (let key of keys)
        {
            let op = new WROption(key, dal.meta[key].name)
            op.style = 'font-size:10px'
            document.getElementById('option_list').append(op)
        }
        
        // add second option list of teams
        let teams = Object.keys(dal.teams)
        for (let team of teams)
        {
            let name = dal.get_value(team, 'meta.name')
            let op = new WRDescriptiveOption(team, team, name, false)
            document.getElementById('secondary_option_list').append(op)
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
 * function:    populate_dual_keys
 * parameters:  data abstraction layer, use results only, exclude strings
 * returns:     default selection
 * description: Populates the left and right options lists with keys.
 * 
 * Pages: Scatter
 */
function populate_dual_keys(dal, results_only=false, exclude_strings=false)
{
    document.getElementById('option_list').innerHTML = ''
    document.getElementById('secondary_option_list').innerHTML = ''

    let keys = dal.get_keys(true, !results_only, !results_only, !results_only && !exclude_strings)
    if (keys.length > 0)
    {
        // add pick list selector at top
        let ops = Object.keys(dal.picklists)
        ops.unshift('None')
        
        // iterate through result keys
        for (let key of keys)
        {
            let left_op = new WROption(key, dal.meta[key].name, true)
            left_op.style = 'font-size:10px'
            document.getElementById('option_list').append(left_op)

            let right_op = new WROption(key, dal.meta[key].name, false)
            right_op.style = 'font-size:10px'
            document.getElementById('secondary_option_list').append(right_op)
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
 * parameters:  options, associated ids
 * returns:     default selection
 * description: Populates the left options list with a given list of options.
 * 
 * Pages: User Profiles, Results, Team Rankings
 */
function populate_other(options, classes={})
{
    // determine if passed list or array
    let names
    if (typeof options === 'object' && !Array.isArray(options) && options !== null)
    {
        names = options
        options = Object.keys(options)
    }
    if (options)
    {
        let first = ''
        // iterate through each match obj
        let option_list = []
        for (let op of options)
        {
            if (first == '')
            {
                first = op
            }

            // replace placeholders in template and add to screen
            let name = typeof names !== 'undefined' ? names[op] : op
            let option = new WROption(op, name)
            if (classes.hasOwnProperty(op) && classes[op] !== '')
            {
                option.add_class(classes[op])
            }
            option_list.push(option)
        }
        document.getElementById('option_list').replaceChildren(...option_list)

        if (first !== '')
        {
            scroll_to('option_list', `left_pit_option_${first}`)
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
function add_dropdown_filter(options, func, primary_list=true, default_selection='')
{
    let id = 'filter'
    if (!primary_list)
    {
        id = 'secondary_filter'
    }
    let dropdown = new WRDropdown('', options, default_selection)
    dropdown.on_change = func
    document.getElementById(id).append(dropdown)
    return dropdown
}

/**
 * function:    add_button_filter
 * parameters:  id of filter, text, on change filter, filter to be placed in
 * returns:     none
 * description: Builds a button in a given filter box.
 */
function add_button_filter(text, func, primary_list=true)
{
    let id = 'filter'
    if (!primary_list)
    {
        id = 'secondary_filter'
    }
    let button = new WRButton(text, func)
    document.getElementById(id).append(button)
}

/**
 * Creates a new card with a message in the header and a description below it.
 * 
 * @param {string} message Header message
 * @param {string} description Optional extended description
 */
function add_error_card(message, description='')
{
    let header = document.createElement('h2')
    header.textContent = message
    let details = document.createElement('span')
    details.textContent = description
    let card = new WRCard([header, details])
    preview.append(card)
}