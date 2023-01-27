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
    document.getElementById('header_info').innerHTML = `Match: <span id="match">${dal.get_match_value(match_num, 'match_name')}</span> - Scouting: <span id="team" style="color: ${alliance_color}">${teams.join(', ')}</span>`

    build_page_from_config()
}

/**
 * function:    build_page_from_config
 * parameters:  none
 * returns:     none
 * description: Builds the page from the config file and the given mode.
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
        let col_frame = new ColumnFrame(column.id, column.name.replace('TEAM', team))
        // iterate through input in the column
        for (let input of column.inputs)
        {
            let name = input.name
            let id = input.id.replace('_team_', `_${team}_`)
            let type = input.type
            let default_val = input.default
            let options = input['options']

            let item
            // build each input from its template
            switch (type)
            {
                case 'checkbox':
                    if (default_val)
                    {
                        select_ids.push(`${id}-container`)
                    }
                    item = new Checkbox(id, name, default_val)
                    break
                case 'counter':
                    item = new Counter(id, name, default_val)
                    break
                case 'multicounter':
                    item = new MultiCounter(id, name, options, default_val)
                    break
                case 'select':
                    item = new Select(id, name, options, default_val)
                    item.vertical = input.vertical
                    break
                case 'multiselect':
                    let def = []
                    if (default_val instanceof Array)
                    {
                        for (let i in default_val)
                        {
                            if (default_val[i])
                            {
                                def.push(options[parseInt(i)])
                            }
                        }
                    }
                    else if (default_val)
                    {
                        default_val.split(',')
                    }
                    item = new MultiSelect(id, name, options, def)
                    item.vertical = input.vertical
                    break
                case 'dropdown':
                    item = new Dropdown(id, name, options, default_val)
                    break
                case 'string':
                    item = new Entry(id, name, default_val)
                    break
                case 'number':
                    item = new Entry(id, name, default_val)
                    item.type = 'number'
                    item.bounds = options
                    break
                case 'slider':
                    item = new Slider(id, name, default_val)
                    item.bounds = options
                    break
                case 'text':
                    item = new Extended(id, name, default_val)
                    break
            }
            col_frame.add_input(item)
        }
        page_frame.add_column(col_frame)
    }
    let unsure = new Checkbox('unsure', `Unsure of Results`)
    let submit = new Button('submit', 'Submit', 'get_results_from_page()')
    let submit_page = new PageFrame('', '', [new ColumnFrame('', '', [unsure]), new ColumnFrame('', '', [submit])])
    document.body.innerHTML += page_frame.toString + submit_page.toString

    // mark each selected box as such
    for (let id of select_ids)
    {
        document.getElementById(id).classList.add('selected')
    }
}

/**
 * function:    get_results_from_page
 * parameters:  none
 * returns:     none
 * description: Accumulates the results from the page into a new object.
 */
function get_results_from_page()
{
    if (!confirm('Are you sure you want to submit?'))
    {
        return
    }

    // get each result
    let page = cfg[NOTE_MODE][0]
    let column = page.columns[0]
    // iterate through each column in the page
    for (let team of teams)
    {
        let results = {}
    
        // scouter metadata
        results['meta_scouter_id'] = parseInt(user_id)
        results['meta_scout_time'] = Math.round(start / 1000)
        results['meta_scouting_duration'] = (Date.now() - start) / 1000
        results['meta_unsure'] = document.getElementById('unsure').checked
    
        // scouting metadata
        results['meta_scout_mode'] = NOTE_MODE
        results['meta_position'] = parseInt(scout_pos)
        results['meta_event_id'] = event_id
        results['meta_match_key'] = match_num
        results['meta_comp_level'] = dal.get_match_value(match_num, 'comp_level')
        results['meta_set_number'] = parseInt(dal.get_match_value(match_num, 'set_number'))
        results['meta_match'] = parseInt(dal.get_match_value(match_num, 'match_number'))
        results['meta_alliance'] = alliance_color
        results['meta_team'] = team

        // iterate through input in the column
        for (let input of column.inputs)
        {
            let id = input.id
            let el_id = input.id.replace('_team_', `_${team}_`)
            let type = input.type
            let options = input.options

            switch (type)
            {
                case 'checkbox':
                    results[id] = document.getElementById(el_id).checked
                    break
                case 'counter':
                    results[id] = parseInt(document.getElementById(el_id).innerHTML)
                    break
                case 'multicounter':
                    for (let i in options)
                    {
                        let name = `${id}_${options[i].toLowerCase().split().join('_')}`
                        let html_id = `${el_id}_${op_ids[i].toLowerCase().split().join('_')}`
                        results[name] = parseInt(document.getElementById(`${html_id}-value`).innerHTML)
                    }
                    break
                case 'select':
                    results[id] = -1
                    let children = document.getElementById(el_id).getElementsByClassName('wr_select_option')
                    let i = 0
                    for (let option of children)
                    {
                        if (option.classList.contains('selected'))
                        {
                            results[id] = i
                        }
                        i++
                    }
                    break
                case 'multiselect':
                    for (let i in options)
                    {
                        let name = `${id}_${options[i].toLowerCase().split().join('_')}`
                        results[name] = MultiSelect.get_selected_options(el_id).includes(parseInt(i))
                    }
                    break
                case 'dropdown':
                    results[id] = document.getElementById(el_id).selectedIndex
                    break
                case 'number':
                    results[id] = parseInt(document.getElementById(el_id).value)
                    break
                case 'slider':
                    results[id] = parseInt(document.getElementById(el_id).value)
                    break
                case 'string':
                case 'text':
                    results[id] = document.getElementById(el_id).value
                    break
            }
        }

        localStorage.setItem(`${NOTE_MODE}-${match_num}-${team}`, JSON.stringify(results))
    }

    query = {'page': 'matches', [TYPE_COOKIE]: NOTE_MODE, [EVENT_COOKIE]: event_id, [POSITION_COOKIE]: scout_pos, [USER_COOKIE]: user_id}
    window.location.href = build_url('selection', query)
}
