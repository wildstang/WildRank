/**
 * file:        teams.js
 * description: Contains functions for the team overview page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-06-13
 */

// read parameters from URL
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch event teams from localStorage. Initialize page contents.
 */
function init_page()
{
    let first = populate_teams()
    if (first)
    {
        contents_card.innerHTML = `<img id="avatar">
                                    <h2><span id="team_num">No Team Selected</span> <span id="team_name"></span></h2>
                                    <h3 id="location"></h3>
                                    <h3 id="ranking"></h3>
                                    <div id="notes"></div>`
        buttons_container.innerHTML = '<div id="matches"></div>'
        
        setup_picklists()
        open_option(first)
    }
    else
    {
        contents_card.innerHTML = '<h2>No Team Data Found</h2>Please preload event'
    }
}

/**
 * function:    open_option
 * parameters:  Selected team number
 * returns:     none
 * description: Completes right info pane for a given team number.
 */
function open_option(team_num)
{
    // select new option
    deselect_all()
    document.getElementById(`option_${team_num}`).classList.add('selected')

    // populate top
    document.getElementById('avatar').src = get_avatar(team_num, event_id.substr(0, 4))
    document.getElementById('team_num').innerHTML = team_num
    document.getElementById('team_name').innerHTML = dal.get_value(team_num, 'meta.name')
    document.getElementById('location').innerHTML = `${dal.get_value(team_num, 'meta.city')}, ${dal.get_value(team_num, 'meta.state_prov')}, ${dal.get_value(team_num, 'meta.country')}`

    // populate ranking
    document.getElementById('ranking').innerHTML = dal.get_rank_str(team_num)

    // pull pit results
    let pit_button = ''
    if (!dal.is_pit_scouted(team_num))
    {
        pit_button = new Button('', 'Scout Pit')
        pit_button.link = `start_scout('${PIT_MODE}', '', '${team_num}', 'white')`
    }

    // build stats table
    let notes = '<table style="text-align: left">'
    let match_stats = dal.get_keys(true, false, false, false)
    let pit_stats = dal.get_keys(false, true, false, false)
    let num_match = match_stats.length
    let num_pit = pit_stats.length
    let max_len = num_match > num_pit ? num_match : num_pit
    for (let i = 0; i < max_len; ++i)
    {
        notes += '<tr>'
        if (i < num_pit)
        {
            let key = pit_stats[i]
            notes += `<th>${dal.get_name(key)}</th><td>${dal.get_value(team_num, key, 'mean', true)}</td>`
        }
        else
        {
            notes += '<th></th><td></td>'
        }
        if (i < num_match)
        {
            let key = match_stats[i]
            notes += `<th>${dal.get_name(key)}</th><td>${dal.get_value(team_num, key, 'mean', true)}</td>`
        }
        else
        {
            notes += '<th></th><td></td>'
        }
        notes += '</tr>'
    }
    document.getElementById('notes').innerHTML = notes

    let cards = []

    // add row for each match
    let matches = dal.teams[team_num].matches
    matches.sort((a, b) => dal.get_match_value(a.key, 'started_time') - dal.get_match_value(b.key, 'started_time'))
    for (let match of matches)
    {
        let match_key = match.key

        if (true || match.comp_level === 'qm')
        {
            // determine team's alliance (if any)
            let alliance = match.alliance

            // add time
            let time = dal.get_match_value(match_key, 'display_time')
            if (dal.get_match_value(match_key, 'complete'))
            {
                let winner = dal.get_match_value(match_key, 'winner')
                let result = `<b>${winner === alliance ? 'W' : 'L'}</b><br>${dal.get_match_value(match_key, 'score_str')}`
                time += `<br>${result}`
            }

            let match_num = `<span class="${alliance}">${dal.get_match_value(match_key, 'short_match_name')}</span>`
            // make match button
            let match_link = new Button(`scout_${match_key}`, `Scout Match ${match_num}`)
            match_link.link = `start_scout('${MATCH_MODE}', '${match.match_number}', '${team_num}', '${alliance}')`
            if (dal.is_match_scouted(match_key, team_num))
            {
                match_link = new Button(`result_${match_key}`, `Match ${match_num} Results`)
                match_link.link = `open_result('${match_key}', '${team_num}')`
            }
            cards.push(match_link)
            cards.push(new Card(`card_${match_key}`, `<center>${time}</center>`))
        }
    }

    let left_col = new ColumnFrame('', '', cards.splice(0, cards.length/2))
    let right_col = new ColumnFrame('', '', cards)
    let page = new PageFrame('', '', [pit_button, left_col, right_col])

    document.getElementById('matches').innerHTML = page.toString

    ws(team_num)
}