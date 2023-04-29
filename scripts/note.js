/**
 * file:        note.js
 * description: Scouting page for notes mode.
 * author:      Liam Fruzyna
 * date:        2023-01-26
 */

const start = Date.now()

var teams = []

// read parameters from 
const scout_pos = get_parameter(POSITION_COOKIE, POSITION_DEFAULT)
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

var urlParams = new URLSearchParams(window.location.search)
const match_num = urlParams.get('match')
const alliance_color = urlParams.get('alliance')
var edit = urlParams.get('edit') == 'true'

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    let match_teams = dal.get_match_teams(match_num)
    for (let pos of Object.keys(match_teams))
    {
        if (pos.startsWith(alliance_color))
        {
            teams.push(match_teams[pos])
        }
    }

    // build the page from config for the desired mode
    let style = `color: ${alliance_color}; background-color: rgba(0, 0, 0, 0.33); box-shadow: 0 0 4px 4px rgba(0, 0, 0, 0.33)`
    document.getElementById('header_info').innerHTML = `<span id="match">${dal.get_match_value(match_num, 'match_name')}</span> - Scouting: <span id="team" style="${style}">${teams.join(', ')}</span>`

    build_page_from_config()
}

/**
 * function:    build_page_from_config
 * parameters:  none
 * returns:     none
 * description: Builds the page from the config file.
 */
function build_page_from_config()
{
    let select_ids = []
    let page = cfg[NOTE_MODE][0]
    let column = page.columns[0]
    let page_frame = new PageFrame(page.id, page.name)
    // iterate through each column in the page
    for (let team of teams)
    {
        page_frame.add_column(build_column_from_config(column, NOTE_MODE, select_ids, edit, match_num, team, alliance_color))
    }
    if (page.columns.length > 1)
    {
        page_frame.add_column(build_column_from_config(page.columns[1], NOTE_MODE, select_ids, edit, match_num, team, alliance_color))
    }

    let submit = new Button('submit', 'Submit', 'get_results_from_page()')
    let submit_page = new PageFrame('', '', [new ColumnFrame('', '', [submit])])
    document.body.innerHTML += page_frame.toString + submit_page.toString

    // mark each selected box as such
    for (let id of select_ids)
    {
        document.getElementById(id).classList.add('selected')
    }
}

/**
 * function:    check_results
 * parameters:  none
 * returns:     name of default value that has not changes
 * description: Checks if all required values have changed from default.
 */
function check_results()
{
    let page = cfg[NOTE_MODE][0]
    let column = page.columns[0]

    if (page.columns.length > 1)
    {
        let ret = check_column(page.columns[1], NOTE_MODE, team, alliance_color)
        if (ret)
        {
            return ret
        }
    }

    for (let team of teams)
    {
        let ret = check_column(column, NOTE_MODE, team, alliance_color)
        if (ret)
        {
            return ret
        }
    }

    return false
}

/**
 * function:    get_results_from_page
 * parameters:  none
 * returns:     none
 * description: Accumulates the results from the page into a new object.
 */
function get_results_from_page()
{
    // hack to prevent 2 teams from being assigned the same ranking
    // TODO: explore doing this automatically
    let rankings = []
    for (let team of teams)
    {
        let rank_slider = document.getElementById(`note_notes_${team}_rank`)
        if (rank_slider !== null)
        {
            rankings.push(rank_slider.value)
        }
    }
    let unique_ranks = [... new Set(rankings)].length
    if (unique_ranks < 3 && unique_ranks > 0)
    {
        alert('All 3 rankings must be unique values')
        return
    }

    let iid = check_results()
    if (iid)
    {
        document.getElementById(iid).style['background-color'] = '#FAA0A0'
        let container = document.getElementById(`${iid}_container`)
        if (container !== null)
        {
            container.style['background-color'] = '#FAA0A0'
        }
        alert(`There are unchanged defaults! (${iid})`)
        return
    }
    if (!confirm('Are you sure you want to submit?'))
    {
        return
    }

    let page = cfg[NOTE_MODE][0]
    let column = page.columns[0]
    let results = {}

    let alliance_results = {}
    if (page.columns.length > 1)
    {
        alliance_results = get_results_from_column(page.columns[1], NOTE_MODE, team, alliance_color)
    }

    // scouter metadata
    results['meta_note_scouter_id'] = parseInt(user_id)
    results['meta_note_scout_time'] = Math.round(start / 1000)
    results['meta_note_scouting_duration'] = (Date.now() - start) / 1000
    results['meta_config_version'] = cfg.version

    // scouting metadata
    results['meta_scout_mode'] = NOTE_MODE
    results['meta_note_position'] = parseInt(scout_pos)
    results['meta_event_id'] = event_id
    results['meta_match_key'] = match_num
    results['meta_comp_level'] = dal.get_match_value(match_num, 'comp_level')
    results['meta_set_number'] = parseInt(dal.get_match_value(match_num, 'set_number'))
    results['meta_match'] = parseInt(dal.get_match_value(match_num, 'match_number'))
    results['meta_alliance'] = alliance_color

    // iterate through each column in the page
    for (let team of teams)
    {
        team_results = get_results_from_column(column, NOTE_MODE, team, alliance_color)
        let result = Object.assign({'meta_team': team}, results, team_results, alliance_results)
        localStorage.setItem(`${NOTE_MODE}-${match_num}-${team}`, JSON.stringify(result))
    }

    query = {'page': 'matches', [TYPE_COOKIE]: NOTE_MODE, [EVENT_COOKIE]: event_id, [POSITION_COOKIE]: scout_pos, [USER_COOKIE]: user_id}
    window.location.href = build_url('selection', query)
}
