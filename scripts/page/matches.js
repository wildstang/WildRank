/**
 * file:        matches.js
 * description: Contains functions for the match selection page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

// read parameters from URL
const scout_mode = get_parameter(MODE_QUERY, '')

var match_num_el, match_time_el, avatar_el, team_num_el, team_name_el, team_pos_el, photos_el, buttons
var scout_pos
var scout_type

include('transfer')

/**
 * Populates the match selector and builds the structure of the page.
 */
function init_page()
{
    header_info.innerText = 'Match Select'

    // override scouting position with that from config
    // TODO: determine if this is actually desired
    scout_pos = cfg.get_selected_position()

    let scout_config = cfg.get_scout_config(scout_mode)
    let first = populate_matches(false, true, '', false, scout_pos, scout_mode === NOTE_MODE)
    add_button_filter(`Export ${scout_config.name} Results`, () => ZipHandler.export_results(scout_mode), true)
    if (first)
    {
        scout_type = scout_config.type
        match_num_el = document.createElement('h2')
        match_time_el = document.createElement('span')
        avatar_el = document.createElement('div')
        card_elements = [match_num_el, match_time_el, br(), br(), avatar_el]

        // add scouting position
        let pos = 1 + parseInt(scout_pos)
        if (pos > 3)
        {
            pos -= 3
        }

        let team = document.createElement('h2')
        team_num_el = document.createElement('span')
        team_num_el.textContent = 'No Match Selected'
        team_name_el = document.createElement('span')
        team_pos_el = document.createElement('span')
        team_pos_el.textContent = `(${pos})`
        team.append(team_num_el, ' ', team_name_el, ' ', team_pos_el)

        photos_el = document.createElement('span')
        card_elements.push(team, photos_el)

        buttons = document.createElement('div')
        let card = new WRCard(card_elements, true)
        preview.append(card, buttons)

        open_option(first)
    }
    else
    {
        add_error_card('No Match Data Found', 'Please preload event')
    }
}

/**
 * Populate the body of the page for the selected match.
 * @param {String} match_key Match key
 */
function open_option(match_key)
{
    // clear previous selection
    deselect_all()
    if (document.getElementById('open_result_container') !== null)
    {
        document.getElementById('open_result_container').remove()
    }
    buttons.replaceChildren()

    // select option
    document.getElementById(`left_match_option_${match_key}`).classList.add('selected')

    // place match number and team to scout on card
    match_num_el.innerText = dal.matches[match_key].name
    match_time_el.innerText = new Date(dal.matches[match_key].time).toLocaleTimeString("en-US")

    // determine teams and updates avatar(s) and number(s)
    let teams = scout_type === 'match-alliance' ? dal.get_match_alliance(match_key, scout_pos) : [dal.get_match_team(match_key, scout_pos)]
    avatar_el.replaceChildren(...teams.map(t => dal.teams[t].avatar_el))
    team_num_el.innerText = teams.join(', ')

    // TODO: update photo carousel
    //photos_el.replaceChildren(dal.get_photo_carousel(team_num))

    // determine alliance
    let color = cfg.theme['blue-alliance-color']
    if (scout_pos < 3)
    {
        color = cfg.theme['red-alliance-color']
    }
    team_num_el.style.color = color
    team_name_el.style.color = color
    team_pos_el.style.color = color

    // add team name if scouting a single match-team
    let result_url = build_url('results', {'match': match_key})
    if (scout_type === 'match-team')
    {
        team_name_el.innerText = dal.teams[teams[0]].name
        result_url = build_url('results', {'match': match_key, 'team': teams[0]})
        ws(teams[0])
    }

    // build buttons
    const scout_url = build_url('scout', {[MODE_QUERY]: scout_mode, index: match_key, edit: false})
    buttons.append(new WRLinkButton('Scout Match', scout_url))

    if (teams.some(t => dal.is_match_scouted(match_key, t, scout_mode)))
    {
        let left_col = new WRColumn()
        let right_col = new WRColumn()

        left_col.add_input(new WRLinkButton('View Result', result_url))

        const edit_url = build_url('scout', {[MODE_QUERY]: scout_mode, index: match_key, edit: true})
        right_col.add_input(new WRLinkButton('Edit Result', edit_url))

        if (cfg.is_admin())
        {
            let renumber = new WRButton('Renumber Result', () => renumber_result(match_key, teams))
            renumber.add_class('slim')
            left_col.add_input(renumber)
    
            let del = new WRButton('Delete Result', () => delete_result(match_key, teams))
            del.add_class('slim')
            right_col.add_input(del)
        }

        buttons.append(new WRPage('', [left_col, right_col]))
    }
}

/**
 * Renumbers a result with a new match.
 * @param {string} match_key Original match key
 * @param {Array} teams Original team numbers
 */
function renumber_result(match_key, teams)
{
    let new_match = prompt('New match number')
    if (new_match !== null)
    {
        let new_key = `${dal.event_id}_qm${new_match}`
        if (!dal.match_keys.includes(new_key))
        {
            alert('Invalid match number!')
            return
        }

        let original_teams = dal.get_match_teams(match_key)
        let new_teams = dal.get_match_teams(new_key)

        for (let team_num of teams)
        {
            let result = dal.get_match_result(match_key, team_num)
            let index = prompt_for_result(result.meta[scout_mode], 'renumber')

            if (index >= 0)
            {
                let new_team
                for (let key in original_teams)
                {
                    if (original_teams[key] === team_num)
                    {
                        new_team = new_teams[key]
                        break
                    }
                }

                // change result
                let new_result = {
                    meta: result.meta[scout_mode][index],
                    result: result.results[scout_mode][index]
                }
                new_result.meta.result.match_key = new_key
                new_result.meta.result.team_num = new_team
                localStorage.setItem(result.file_names[scout_mode][index], JSON.stringify(new_result))
            }
        }
        location.reload()
    }
}

/**
 * Prompts to, then deletes the result for the specified match.
 * @param {String} match_key Match key
 * @param {Array} teams Team numbers to delete
 */
function delete_result(match_key, teams)
{
    if (confirm(`Are you sure you want to delete ${scout_mode} results for ${match_key}?`))
    {
        for (let team_num of teams)
        {
            let result = dal.get_match_result(match_key, team_num)
            if (scout_mode in result.results)
            {
                let index = prompt_for_result(result.meta[scout_mode], 'delete')
                if (index >= 0)
                {
                    localStorage.removeItem(result.file_names[scout_mode][index])
                }
            }
        }
        location.reload()
    }
}