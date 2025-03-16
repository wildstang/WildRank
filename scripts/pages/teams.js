/**
 * file:        teams.js
 * description: Contains functions for the team overview page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-06-13
 */

include('mini-picklists')

// read parameters from URL
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

var avatar, team_num_hdr, team_name, loc, ranking, photos, stats_container, clear_container, match_container

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch event teams from localStorage. Initialize page contents.
 */
function init_page()
{
    header_info.innerText = 'Team Profiles'

    let first = populate_teams()
    if (first)
    {
        avatar = document.createElement('img')
        avatar.className = 'avatar'

        let team_header = document.createElement('h2')
        team_num_hdr = create_element('span', 'team_num')
        team_num_hdr.innerText = 'No Team Selected'
        team_name = document.createElement('span')
        team_header.append(team_num_hdr, ' ', team_name)

        loc = document.createElement('h3')
        ranking = document.createElement('h3')
        let center = document.createElement('center')
        photos = document.createElement('span')
        center.append(photos)
        stats_container = document.createElement('div')
        let card = new WRCard([avatar, team_header, loc, ranking, center, stats_container], true)
        card.add_class('result_card')

        clear_container = document.createElement('span')
        match_container = document.createElement('div')
        preview.append(card, clear_container, match_container)
        
        open_option(first)
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
 * function:    open_option
 * parameters:  Selected team number
 * returns:     none
 * description: Completes right info pane for a given team number.
 */
function open_option(team_num)
{
    // select new option
    deselect_all()
    document.getElementById(`left_pit_option_${team_num}`).classList.add('selected')

    // populate top
    avatar.src = dal.get_value(team_num, 'pictures.avatar')
    team_num_hdr.innerText = team_num
    team_name.innerText = dal.get_value(team_num, 'meta.name')
    loc.innerText = `${dal.get_value(team_num, 'meta.city')}, ${dal.get_value(team_num, 'meta.state_prov')}, ${dal.get_value(team_num, 'meta.country')}`
    photos.replaceChildren(dal.get_photo_carousel(team_num))

    // populate ranking
    ranking.innerHTML = dal.get_rank_str(team_num)

    let clear_ignore = new WRButton('Clear Ignores')
    clear_ignore.on_click = () => clear_ignores(team_num)
    clear_container.replaceChildren(clear_ignore.element)

    // pull pit results
    let pit_button = ''
    if (!dal.is_pit_scouted(team_num))
    {
        pit_button = new WRLinkButton('Scout Pit', open_page('scout', {type: PIT_MODE, team: team_num, alliance: 'white', edit: false}))
    }

    // build stats table
    let stats_tab = document.createElement('table')
    stats_tab.style.textAlign = 'left'
    let match_stats = dal.get_keys(true, false, false, false)
    let pit_stats = dal.get_keys(false, true, false, false)
    let num_match = match_stats.length
    let num_pit = pit_stats.length
    let max_len = num_match > num_pit ? num_match : num_pit
    let pit_scouted = dal.is_pit_scouted(team_num)
    let match_scouted = dal.teams[team_num].results.length > 0
    for (let i = 0; i < max_len; ++i)
    {
        let row
        if (pit_scouted)
        {
            row = stats_tab.insertRow()

            if (i < num_pit)
            {
                let key = pit_stats[i]
                populate_cell(team_num, row, key)
            }
            else
            {
                row.insertCell()
                row.insertCell()
            }
        }

        if (match_scouted)
        {
            if (row == null)
            {
                row = stats_tab.insertRow()
            }

            if (i < num_match)
            {
                let key = match_stats[i]
                populate_cell(team_num, row, key)
            }
            else
            {
                row.insertCell()
                row.insertCell()
            }
        }
    }
    stats_container.replaceChildren(stats_tab)

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
            let time = document.createElement('center')
            time.innerText = dal.get_match_value(match_key, 'display_time')
            if (dal.get_match_value(match_key, 'complete'))
            {
                let winner = dal.get_match_value(match_key, 'winner')
                let win = 'L'
                if (winner === alliance)
                {
                    win = 'W'
                }
                else if (winner === 'tie')
                {
                    win = 'T'
                }
                let result = document.createElement('span')
                let w = document.createElement('b')
                w.innerText = win
                result.append(w, br(), dal.generate_score(match_key))
                time.append(br(), result)
            }

            let match_num = document.createElement('span')
            match_num.className = alliance
            match_num.innerText = dal.get_match_value(match_key, 'short_match_name')
            let match_link, ignore
            if (dal.is_match_scouted(match_key, team_num))
            {
                // build text of ignore checkbox
                let ignore_text = document.createElement('span')
                ignore_text.append('Ignore Match ', match_num)

                // build ignore checkbox
                ignore = new WRCheckbox(ignore_text, dal.get_result_value(team_num, match_key, 'meta_ignore'))
                ignore.on_click = () => ignore_match(match_key, team_num)
                ignore.add_class('slim')

                // build text of match button
                let match_text = document.createElement('span')
                match_text.append('Match ', match_num, ' Results')

                // build match button
                match_link = new WRLinkButton(match_text, open_page('results', {'file': `${match_key}-${team_num}`}))
            }
            else
            {
                // build text of match button
                let match_text = document.createElement('span')
                match_text.append('Scout Match ', match_num)
    
                // build match button
                match_link = new WRLinkButton(match_text, open_page('scout', {type: MATCH_MODE, match: match_key, team: team_num, alliance: alliance, edit: false}))
            }

            let card = new WRCard(time)
            card.space_after = false

            let stack = new WRStack([card, match_link])
            if (ignore)
            {
                stack.add_element(ignore)
            }
            cards.push(stack)
        }
    }

    let count = cards.length / 2
    // prefer more stacks on the left column
    if (cards.length % 2 === 1)
    {
        count++
    }
    console.log(cards.length, count)
    let left_col = new WRColumn('', cards.splice(0, count))
    let right_col = new WRColumn('', cards)
    let page = new WRPage('', [pit_button, left_col, right_col])

    match_container.replaceChildren(page)

    ws(team_num)
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