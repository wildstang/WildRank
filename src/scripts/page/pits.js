/**
 * file:        pits.js
 * description: Contains functions for the pit selection page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

// read parameters from URL
const scout_mode = get_parameter(MODE_QUERY, '')

var streaming = false

var avatar_el, team_num_el, team_name_el, buttons_el, capture_el

var scout_type

include('transfer')

/**
 * Populates the team selector and builds the structure of the page.
 */
function init_page()
{
    header_info.innerText = 'Team Select'

    let scout_config = cfg.get_scout_config(scout_mode)
    enable_list()
    let first = ''
    for (let team_num of dal.team_numbers)
    {
        let op = new WRDescriptiveOption(team_num, team_num, dal.teams[team_num].name)
        if (dal.is_team_scouted(team_num, scout_mode))
        {
            op.add_class('scouted')
        }
        else if (first === '')
        {
            first = team_num
        }
        add_option(op)
    }
    add_button_filter(`Export ${scout_config.name} Results`, () => ZipHandler.export_results(scout_mode), true)

    if (first === '' && dal.team_numbers.length > 0)
    {
        first = dal.team_numbers[0]
    }
    if (first)
    {
        scout_type = scout_config.scout_type
        avatar_el = document.createElement('img')
        avatar_el.className = 'avatar'

        team_el = document.createElement('h2')
        team_num_el = document.createElement('span')
        team_name_el = document.createElement('span')
        team_el.append(team_num_el, ' ', team_name_el)

        let card = new WRCard([avatar_el, team_el])
        card.add_class('body_card')

        buttons_el = document.createElement('div')
        preview.append(card, buttons_el)
        
        open_option(first)
    }
    else
    {
        add_error_card('No Team Data Found', 'Please preload event')
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
    deselect_all()
    buttons_el.replaceChildren()

    // fill team info
    avatar_el.src = dal.teams[team_num].avatar
    team_num_el.innerText = team_num
    team_name_el.innerText = dal.teams[team_num].name
    document.getElementById(`left_pit_option_${team_num}`).classList.add('selected')

    // build buttons
    const scout_url = build_url('scout', {[MODE_QUERY]: scout_mode, index: team_num, edit: false})
    buttons_el.append(new WRLinkButton('Scout Team', scout_url))

    if (dal.is_team_scouted(team_num, scout_mode))
    {
        let page = new WRPage()

        const edit_url = build_url('scout', {[MODE_QUERY]: scout_mode, index: team_num, edit: true})
        page.add_column(new WRColumn('', [new WRLinkButton('Edit Result', edit_url)]))

        if (cfg.is_admin())
        {
            let renumber = new WRButton('Renumber Result', () => renumber_result(team_num))
            renumber.add_class('slim')
            page.add_column(new WRColumn('', [renumber]))
    
            let del = new WRButton('Delete Result', () => delete_result(team_num))
            del.add_class('slim')
            page.add_column(new WRColumn('', [del]))
        }

        buttons_el.append(page)
    }

    ws(team_num)
}

/**
 * Renumbers a result with a new team number.
 * @param {Number} team_num Original match key
 */
function renumber_result(team_num)
{
    let input = prompt('New team number')
    if (input !== null)
    {
        let new_team = parseInt(input)
        if (!dal.team_numbers.includes(input))
        {
            alert('Invalid team number!')
            return
        }

        let result = dal.teams[team_num]
        let index = prompt_for_result(result.meta[scout_mode], 'renumber')

        if (index >= 0)
        {
            // change result
            let new_result = {
                meta: result.meta[scout_mode][index],
                result: result.results[scout_mode][index]
            }
            new_result.meta.result.team_num = new_team
            localStorage.setItem(result.file_names[scout_mode][index], JSON.stringify(new_result))
        }
        location.reload()
    }
}

/**
 * Prompts to, then deletes the result for the specified team.
 * @param {Number} team Team number to delete
 */
function delete_result(team_num)
{
    if (confirm(`Are you sure you want to delete ${scout_mode} results for ${team_num}?`))
    {
        let result = dal.teams[team_num]
        if (scout_mode in result.results)
        {
            let index = prompt_for_result(result.meta[scout_mode], 'delete')
            if (index >= 0)
            {
                localStorage.removeItem(result.file_names[scout_mode][index])
                location.reload()
            }
        }
    }
}