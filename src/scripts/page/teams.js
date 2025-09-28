/**
 * file:        teams.js
 * description: Contains functions for the team overview page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-06-13
 */

include('mini-picklists')

var avatar, team_num_hdr, team_name, loc, ranking, completion_table, events_table

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch event teams from localStorage. Initialize page contents.
 */
function init_page()
{
    header_info.innerText = 'Team Profiles'

    if (dal.team_numbers.length > 0)
    {
        avatar = document.createElement('img')
        avatar.className = 'avatar'

        let team_header = document.createElement('h2')
        team_num_hdr = new WRDropdown('', dal.team_numbers)
        team_num_hdr.on_change = open_option
        team_num_hdr.add_class('inline')
        team_num_hdr.add_class('thin')
        team_num_hdr.add_class('h2-dropdown')
        team_name = document.createElement('span')
        team_header.append(team_num_hdr, ' ', team_name)

        ranking = document.createElement('h3')
        completion_table = document.createElement('table')
        let card = new WRCard([avatar, team_header, ranking, completion_table])
        card.add_class('result_card')

        events_table = document.createElement('table')
        let events_card = new WRCard(events_table)

        preview.append(card, events_card)
        
        open_option()
    }
    else
    {
        add_error_card('No Team Data Found', 'Please preload event')
    }
}

/**
 * Populates a cell in the team stats table.
 * @param {number} team_num Team number
 * @param {*} row Table row
 * @param {String} key Stat ID
 */
function populate_cell(team_num, row, key)
{
    row.append(create_header(dal.get_name(key)))
    let val = dal.get_value(team_num, key, 'mean', true)
    let cell = row.insertCell()
    cell.innerHTML = val
    // alight numeric values to the right
    if (!isNaN(val))
    {
        cell.style.textAlign = 'right'
    }
    // color positive booleans green
    else if (val === 'Yes' || val == 'No' && dal.meta[key].negative)
    {
        cell.style.color = 'green'
    }
    // color negative (not positive) booleans red
    else if (['Yes', 'No'].includes(val))
    {
        cell.style.color = 'red'
    }
}

/**
 * Handles team number selection and populate the page.
 */
function open_option()
{
    let team_num = team_num_hdr.element.value

    // populate top
    avatar.src = dal.teams[team_num].avatar
    //team_num_hdr.innerText = team_num
    team_name.innerText = dal.teams[team_num].name

    // populate ranking
    ranking.innerHTML = dal.get_rank_string(team_num)

    // scouting completion table
    completion_table.replaceChildren()

    // TODO: account for multiple results, display unsure, allow ignoring
    // add pit scouting to completion table
    let modes = cfg.team_scouting_modes
    let team_header = completion_table.insertRow()
    team_header.insertCell()
    let team_status = completion_table.insertRow()
    team_status.append(create_header('Team'))
    for (let mode of modes)
    {
        team_header.append(create_header(cfg.get_scout_config(mode).name))
        let cell = team_status.insertCell()
        let scouted = dal.is_team_scouted(team_num, mode)
        cell.style.backgroundColor = scouted ? 'green' : 'red'
    }

    // add match scouting to completion table
    modes = cfg.match_scouting_modes
    let match_header = completion_table.insertRow()
    match_header.insertCell()
    let matches = dal.sort_match_keys(dal.teams[team_num].matches)
    for (let match_key of matches)
    {
        match_header.append(create_header(dal.matches[match_key].short_name))
    }
    for (let mode of modes)
    {
        let match_status = completion_table.insertRow()
        match_status.append(create_header(cfg.get_scout_config(mode).name))
        for (let match_key of matches)
        {
            let cell = match_status.insertCell()
            let scouted = dal.is_match_scouted(match_key, team_num, mode)
            cell.style.backgroundColor = scouted ? 'green' : 'red'
            cell.onclick = (event) => window_open(build_url('results', {'match': match_key, 'team': team_num}))
        }
    }

    populate_events(team_num)

    ws(team_num)
}

/**
 * Converts a TBA date string to an int for sorting
 * @param {String} date TBA date string (YYYY-MM-DD)
 * @returns Int representation of date
 */
function date_to_int(date)
{
    return parseInt(date.replace('-', ''))
}

/**
 * Populates the events card with data from TBA.
 * @param {Number} team_num Team number
 */
function populate_events(team_num)
{
    events_table.replaceChildren(create_header_row(['Event', 'Date', 'Rank', 'RP', 'Alliance', 'Pick', 'Awards']))

    let key = cfg.user.settings.tba_key
    if (!key) return
    let key_query = `?${TBA_AUTH_KEY}=${key}`

    fetch(`https://www.thebluealliance.com/api/v3/team/frc${team_num}/events/${cfg.year}/simple${key_query}`)
        .then(response => {
            if (response.status == 401) {
                alert('Invalid API Key Suspected')
            }
            return response.json()
        })
        .then(data => {
            let events = data.sort((a,b) => date_to_int(a.start_date) - date_to_int(b.start_date))
            for (let d of events)
            {
                let row = events_table.insertRow()
                row.insertCell().innerText = d.name
                row.insertCell().innerText = d.start_date

                let ranking_cell = row.insertCell()
                let rp_cell = row.insertCell()
                let alliance_cell = row.insertCell()
                let pick_cell = row.insertCell()
                let award_cell = row.insertCell()

                fetch(`https://www.thebluealliance.com/api/v3/team/frc${team_num}/event/${cfg.year}${d.event_code}/status${key_query}`)
                    .then(response => {
                        if (response.status == 401)
                        {
                            alert('Invalid API Key Suspected')
                        }
                        return response.json()
                    })
                    .then(data => {
                        if (data.qual)
                        {
                            ranking_cell.innerText = `${data.qual.ranking.rank}/${data.qual.num_teams}`
                            rp_cell.innerText = `${data.qual.ranking.sort_orders[0]}`
                            if (data.alliance)
                            {
                                alliance_cell.innerText = `${data.alliance.number}`
                                let pick = ''
                                switch (data.alliance.pick)
                                {
                                    case 0:
                                        pick = 'Captain'
                                        break
                                    case 1:
                                        pick = '1st'
                                        break
                                    case 2:
                                        pick = '2nd'
                                        break
                                    case 3:
                                        pick = '3rd'
                                        break
                                }
                                pick_cell.innerText = `${pick}`
                            }
                        }
                    })
                    .catch(err => {
                        console.log(`Error fetching team, ${err}`)
                    })

                fetch(`https://www.thebluealliance.com/api/v3/team/frc${team_num}/event/${cfg.year}${d.event_code}/awards${key_query}`)
                    .then(response => {
                        if (response.status == 401)
                        {
                            alert('Invalid API Key Suspected')
                        }
                        return response.json()
                    })
                    .then(data => {
                        for (let award of data)
                        {
                            switch (award.award_type)
                            {
                                case 0:
                                    award_cell.innerHTML += 'Impact<br>'
                                    break
                                case 1:
                                    award_cell.innerHTML += 'Winner<br>'
                                    break
                                case 2:
                                    // winner and finalist
                                    award_cell.innerHTML += 'Finalist<br>'
                                    break
                                case 9:
                                    // ei
                                    award_cell.innerHTML += 'EI<br>'
                                    break
                            }
                        }
                    })
                    .catch(err => {
                        console.log(`Error fetching team, ${err}`)
                    })
            }
        })
        .catch(err => {
            console.log(`Error fetching team, ${err}`)
        })
}

/**
 * function:    ignore_match
 * parameters:  match key, team number
 * returns:     none
 * description: Toggles the meta_ignore key for the result.
 */
function ignore_match(match_key, team_num)
{
    let checked = document.getElementById(`ignore_${match_key}`).checked
    let file = `match-${match_key}-${team_num}`
    let result = JSON.parse(localStorage.getItem(file))
    result.meta_ignore = checked
    localStorage.setItem(file, JSON.stringify(result))
}

/**
 * function:    clear_ignores
 * parameters:  team number
 * returns:     none
 * description: Sets every result's meta_ignore to false.
 */
function clear_ignores(team_num)
{
    let results = dal.teams[team_num].results
    for (let result of results)
    {
        let match_key = result.meta_match_key
        let file = `match-${match_key}-${team_num}`
        result.meta_ignore = false
        localStorage.setItem(file, JSON.stringify(result))
    }
    open_option(team_num)
}