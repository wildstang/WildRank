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
    let first = populate_teams()
    if (first)
    {
        avatar = document.createElement('img')

        let team_header = document.createElement('h2')
        team_num_hdr = document.createElement('span')
        team_num_hdr.innerText = 'No Team Selected'
        team_name = document.createElement('span')
        team_header.append(team_num_hdr, ' ', team_name)

        loc = document.createElement('h3')
        ranking = document.createElement('h3')
        let center = document.createElement('center')
        photos = document.createElement('span')
        center.append(photos)
        stats_container = document.createElement('div')
        contents_card.append(avatar, team_header, loc, ranking, center, stats_container)

        clear_container = document.createElement('span')
        match_container = document.createElement('div')
        buttons_container.append(clear_container, match_container)
        
        open_option(first)
    }
    else
    {
        let header = document.createElement('h2')
        header.innerText = 'No Team Data Found'
        contents_card.append(header, 'Please preload event')
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
    document.getElementById(`pit_option_${team_num}`).classList.add('selected')

    // populate top
    avatar.src = dal.get_value(team_num, 'pictures.avatar')
    team_num_hdr.innerText = team_num
    team_name.innerText = dal.get_value(team_num, 'meta.name')
    loc.innerText = `${dal.get_value(team_num, 'meta.city')}, ${dal.get_value(team_num, 'meta.state_prov')}, ${dal.get_value(team_num, 'meta.country')}`
    photos.replaceChildren(dal.get_photo_carousel(team_num))

    // populate ranking
    ranking.innerHTML = dal.get_rank_str(team_num)

    let clear_ignore = new Button('clear_ignore', 'Clear Ignores')
    clear_ignore.on_click = `clear_ignores('${team_num}')`
    clear_container.replaceChildren(clear_ignore.element)

    // pull pit results
    let pit_button = ''
    if (!dal.is_pit_scouted(team_num))
    {
        pit_button = new Button('', 'Scout Pit')
        pit_button.link = `open_page('scout', {type: '${PIT_MODE}', team: '${team_num}', alliance: 'white', edit: false})`
    }

    // build stats table
    let stats_tab = document.createElement('table')
    stats_tab.style.textAlign = 'left'
    let match_stats = dal.get_keys(true, false, false, false)
    let pit_stats = dal.get_keys(false, true, false, false)
    let num_match = match_stats.length
    let num_pit = pit_stats.length
    let max_len = num_match > num_pit ? num_match : num_pit
    for (let i = 0; i < max_len; ++i)
    {
        if ((i < num_pit && dal.is_pit_scouted(team_num)) || (i < num_match && dal.teams[team_num].results.length > 0))
        {
            let row = stats_tab.insertRow()
            let pit_cell = row.insertCell()
            if (i < num_pit && dal.is_pit_scouted(team_num))
            {
                let key = pit_stats[i]
                row.append(create_header(dal.get_name(key)))
                pit_cell.innerText = dal.get_value(team_num, key, 'mean', true)
            }
            else
            {
                row.append(create_header(''))
            }
            let match_cell = row.insertCell()
            if (i < num_match && dal.teams[team_num].results.length > 0)
            {
                let key = match_stats[i]
                row.append(create_header(dal.get_name(key)))
                match_cell.innerText = dal.get_value(team_num, key, 'mean', true)
            }
            else
            {
                row.append(create_header(''))
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
                result.append(w, document.createElement('br'), dal.generate_score(match_key))
                time.append(document.createElement('br'), result)
            }

            let match_num = document.createElement('span')
            match_num.className = alliance
            match_num.innerText = dal.get_match_value(match_key, 'short_match_name')
            let match_link
            if (dal.is_match_scouted(match_key, team_num))
            {
                // build text of ignore checkbox
                let ignore_text = document.createElement('span')
                ignore_text.append('Ignore Match ', match_num)

                // build ignore checkbox
                let ignore = new Checkbox(`ignore_${match_key}`, ignore_text, dal.get_result_value(team_num, match_key, 'meta_ignore'))
                ignore.on_click = `ignore_match('${match_key}', '${team_num}')`
                ignore.add_class('slim')
                cards.push(ignore)

                // build text of match button
                let match_text = document.createElement('span')
                match_text.append('Match ', match_num, ' Results')

                // build match button
                match_link = new Button(`result_${match_key}`, match_text)
                match_link.link = `open_page('results', {'file': '${match_key}-${team_num}'})`
            }
            else
            {
                // build text of match button
                let match_text = document.createElement('span')
                match_text.append('Scout Match ', match_num)
    
                // build match button
                match_link = new Button(`scout_${match_key}`, match_text)
                match_link.link = `open_page('scout', {type: '${MATCH_MODE}', match: '${match.match_number}', team: '${team_num}', alliance: '${alliance}', edit: false})`
            }
            cards.push(match_link)
            cards.push(new Card(`card_${match_key}`, time))
        }
    }

    let count = cards.length/2
    // prevent time and button from ending up in different columns
    if (count % 2 === 1)
    {
        count++
    }
    let left_col = new ColumnFrame('', '', cards.splice(0, count))
    let right_col = new ColumnFrame('', '', cards)
    let page = new PageFrame('', '', [pit_button, left_col, right_col])

    match_container.replaceChildren(page.element)

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