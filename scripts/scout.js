/**
 * file:        scout.js
 * description: Contains functions for the scouting page of the web app.
 *              Primarily for building the interface from event and config data.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

const start = Date.now()

/** 
 * function:    build_page_from_config
 * parameters:  none
 * returns:     none
 * description: Builds the page from the config file and the given mode.
 */
function build_page_from_config()
{
    var select_ids = []
    // iterate through each page in the mode
    config.pages.forEach(function (page, index)
    {
        var page_name = page.name
        var page_id = page.id
        columns = []
        // iterate through each column in the page
        page['columns'].forEach(function (column, index)
        {
            var col_name = column.name
            items = []
            // iterate through input in the column
            column['inputs'].forEach(function (input, index)
            {
                var name = input.name
                var id = input.id
                var type = input.type
                var default_val = input.default
                if (edit)
                {
                    default_val = results[id]
                    if (type == 'dropdown' || type == 'select')
                    {
                        default_val = input['options'][default_val]
                    }
                }

                var item = ''
                // build each input from its template
                switch (type)
                {
                    case 'checkbox':
                        if (default_val)
                        {
                            select_ids.push(`${id}-container`)
                        }
                        item = build_checkbox(id, name, default_val)
                        break
                    case 'counter':
                        item = build_counter(id, name, default_val)
                        break
                    case 'select':
                        item = build_select(id, name, input['options'], default_val)
                        break
                    case 'dropdown':
                        item = build_dropdown(id, name, input['options'], default_val)
                        break
                    case 'string':
                        item = build_str_entry(id, name, default_val)
                        break
                    case 'number':
                        let options = []
                        if (Object.keys(input).includes('options'))
                        {
                            options = input['options']
                        }
                        item = build_num_entry(id, name, default_val, options)
                        break
                    case 'text':
                        item = build_text_entry(id, name, default_val)
                        break
                }
                items.push(item)
            })
            columns.push(build_column_frame(col_name, items))
        })
        document.body.innerHTML += build_page_frame(page_name, columns)
        
    })
    // replace placeholders in template and add to screen
    document.body.innerHTML += build_button(`submit_${scout_mode}`, 'Submit', 'get_results_from_page()')

    let teams = team_num.split(',')
    if (teams.length > 1)
    {
        document.body.innerHTML = document.body.innerHTML.replace(/Red 1/g, `${teams[0]} ${get_team_name(teams[0], event_id)}`)
                                                         .replace(/Red 2/g, `${teams[1]} ${get_team_name(teams[1], event_id)}`)
                                                         .replace(/Red 3/g, `${teams[2]} ${get_team_name(teams[2], event_id)}`)
                                                         .replace(/Blue 1/g, `${teams[3]} ${get_team_name(teams[3], event_id)}`)
                                                         .replace(/Blue 2/g, `${teams[4]} ${get_team_name(teams[4], event_id)}`)
                                                         .replace(/Blue 3/g, `${teams[5]} ${get_team_name(teams[5], event_id)}`)
    }

    // mark each selected box as such
    select_ids.forEach(function (id, index)
    {
        document.getElementById(id).classList.add('selected')
    })
}

/**
 * function:    get_results_from_page
 * parameters:  none
 * returns:     none
 * description: Accumulates the results from the page into a new object.
 */
function get_results_from_page()
{
    results = {}

    // scouter metadata
    results['meta_scouter_id'] = parseInt(user_id)
    results['meta_scout_time'] = Math.round(start / 1000)
    results['meta_scouting_duration'] = (Date.now() - start) / 1000

    // scouting metadata
    results['meta_scout_mode'] = scout_mode
    results['meta_position'] = parseInt(scout_pos)
    results['meta_event_id'] = event_id

    // match metadata
    if (scout_mode != PIT_MODE)
    {
        results['meta_match'] = parseInt(match_num)
    }
    results['meta_team'] = parseInt(team_num)

    // get each result
    config.pages.forEach(function (page, index)
    {
        page['columns'].forEach(function (column, index)
        {
            column['inputs'].forEach(function (input, index)
            {
                var id = input.id
                var type = input.type

                switch (type)
                {
                    case 'checkbox':
                        results[id] = document.getElementById(id).checked
                        break
                    case 'counter':
                        results[id] = parseInt(document.getElementById(id).innerHTML)
                        break
                    case 'select':
                        results[id] = -1
                        let children = document.getElementById(id).getElementsByClassName('wr_select_option')
                        var i = 0;
                        for (let option of children)
                        {
                            if (option.classList.contains('selected'))
                            {
                                results[id] = i
                            }
                            i++
                        }
                        break
                    case 'dropdown':
                        results[id] = document.getElementById(id).selectedIndex
                        break
                    case 'number':
                        results[id] = parseInt(document.getElementById(id).value)
                        break
                    case 'string':
                    case 'text':
                        results[id] = document.getElementById(id).value
                        break
                }
            })
        })
    })

    // get result name
    let file = get_pit_result(team_num, event_id)
    if (scout_mode == MATCH_MODE)
    {
        file = get_match_result(match_num, team_num, event_id)
    }
    localStorage.setItem(file, JSON.stringify(results))
    
    if (scout_mode === PIT_MODE)
    {
        query = {'page': 'pits', [EVENT_COOKIE]: event_id, [USER_COOKIE]: user_id}
    }
    else
    {
        query = {'page': 'matches', [TYPE_COOKIE]: MATCH_MODE, [EVENT_COOKIE]: event_id, [POSITION_COOKIE]: scout_pos, [USER_COOKIE]: user_id}
    }
    window.location.href = build_url('selection', query)
}

// read parameters from URL
const scout_pos = get_parameter(POSITION_COOKIE, POSITION_DEFAULT)
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const year = event_id.substr(0,4)
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)
const scout_mode = get_parameter(TYPE_COOKIE, TYPE_DEFAULT)

var urlParams = new URLSearchParams(window.location.search)
const match_num = urlParams.get('match')
const team_num = urlParams.get('team')
const alliance_color = urlParams.get('alliance')
const generate = urlParams.get('generate')
var edit = urlParams.get('edit') == 'true'
var results = {}

load_config(scout_mode, year)
window.addEventListener('load', function()
{
    if (edit)
    {
        let file = ''
        switch (scout_mode)
        {
            case MATCH_MODE:
                file = get_match_result(match_num, team_num, event_id)
                break
            case PIT_MODE:
                file = get_pit_result(team_num, event_id)
                break
        }
        edit = file_exists(file)
        if (edit)
        {
            results = JSON.parse(localStorage.getItem(file))
        }
        else
        {
            console.log(`Existing result, ${file}, could not be found`)
        }
    }

    // build the page from config for the desired mode
    switch (scout_mode)
    {
        case PIT_MODE:
            document.getElementById('header_info').innerHTML = `Match: <span id="match">Pit</span> - Scouting: <span id="team" style="color: white">${team_num}</span>`
            break
        case MATCH_MODE:
            document.getElementById('header_info').innerHTML = `Match: <span id="match">${match_num}</span> - Scouting: <span id="team" style="color: ${alliance_color}">${team_num}</span>`
            break
    }
    ws(team_num)
    build_page_from_config(scout_mode)
    if (generate == 'random')
    {
        generate_results()
    }
})

/**
 * function:    generate_results
 * parameters:  none
 * returns:     none
 * description: Populates the page with randomly generated results.
 */
function generate_results()
{
    config.pages.forEach(function (page, index)
    {
        page['columns'].forEach(function (column, index)
        {
            column['inputs'].forEach(function (input, index)
            {
                var id = input.id
                var type = input.type
                var options = input.options

                switch (type)
                {
                    case 'checkbox':
                        document.getElementById(id).checked = random_bool()
                        break
                    case 'counter':
                        document.getElementById(id).innerHTML = random_int()
                        break
                    case 'select':
                        select_option(id, random_int(0, options.length - 1))
                        break
                    case 'dropdown':
                        document.getElementById(id).selectedIndex = random_int(0, options.length - 1)
                        break
                    case 'number':
                        let min = 0
                        let max = 10
                        if (options.length == 2)
                        {
                            min = options[0]
                            max = options[1]
                        }
                        else if (options.length == 1)
                        {
                            max = options[0]
                        }
                        document.getElementById(id).value = random_int(min, max)
                        break
                    case 'string':
                        document.getElementById(id).value = "Random result"
                        break
                    case 'text':
                        document.getElementById(id).value = "This result was randomly generated"
                        break
                }
            })
        })
    })
}

/**
 * function:    random_bool
 * parameters:  odds of producing a 0
 * returns:     random boolean
 * description: Generates a random boolean.
 */
function random_bool(low_odds=0.5)
{
    return Math.random() >= low_odds
}

/**
 * function:    random_int
 * parameters:  minimum and maximum result
 * returns:     random integer from min to max
 * description: Generates a random integer between two given bounds.
 */
function random_int(min=0, max=10)
{
    return Math.floor(Math.random() * (max - min + 1)) + min
}