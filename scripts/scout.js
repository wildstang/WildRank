/**
 * file:        pits.js
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
    var select_ids = [];
    // iterate through each page in the mode
    config.pages.forEach(function (page, index)
    {
        var page_name = page.name
        var page_id = page.id
        columns = []
        // iterate through each column in the page
        page["columns"].forEach(function (column, index)
        {
            var col_name = column.name
            items = []
            // iterate through input in the column
            column["inputs"].forEach(function (input, index)
            {
                var name = input.name
                var id = input.id
                var type = input.type
                var default_val = input.default

                var item = ""
                // build each input from its template
                switch (type)
                {
                    case "checkbox":
                        if (default_val)
                        {
                            select_ids.push(id + "-container")
                        }
                        item = build_checkbox(id, name, default_val)
                        break
                    case "counter":
                        item = build_counter(id, name, default_val)
                        break
                    case "select":
                        item = build_select(id, name, input["options"], default_val)
                        break
                    case "dropdown":
                        item = build_dropdown(id, name, input["options"], default_val)
                        break
                    case "string":
                        item = build_str_entry(id, name, default_val)
                        break
                    case "number":
                        let options = []
                        if (Object.keys(input).includes("options"))
                        {
                            options = input["options"]
                        }
                        item = build_num_entry(id, name, default_val, options)
                        break
                    case "text":
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
    document.body.innerHTML += build_button("submit_" + scout_mode, "Submit", "get_results_from_page()")

    let teams = team_num.split(",")
    if (teams.length > 1)
    {
        document.body.innerHTML = document.body.innerHTML.replace(/Red 1/g, teams[0] + " " + get_team_name(teams[0], event_id))
                                                         .replace(/Red 2/g, teams[1] + " " + get_team_name(teams[1], event_id))
                                                         .replace(/Red 3/g, teams[2] + " " + get_team_name(teams[2], event_id))
                                                         .replace(/Blue 1/g, teams[3] + " " + get_team_name(teams[3], event_id))
                                                         .replace(/Blue 2/g, teams[4] + " " + get_team_name(teams[4], event_id))
                                                         .replace(/Blue 3/g, teams[5] + " " + get_team_name(teams[5], event_id))
    }

    // mark each selected box as such
    select_ids.forEach(function (id, index)
    {
        document.getElementById(id).classList.add("selected")
    })
}

/**
 * function:    get_results_from_page
 * parameters:  none
 * returns:     none
 * description: Accumulates the results from page into a new object.
 */
function get_results_from_page()
{
    results = {}
    results["meta_scouting_duration"] = (Date.now() - start) / 1000
    results["meta_scouter_id"] = parseInt(user_id)
    results["meta_scout_mode"] = scout_mode
    if (scout_mode != PIT_MODE)
    {
        results["meta_match"] = parseInt(match_num)
        results["meta_position"] = parseInt(scout_pos)
    }
    if (scout_mode != NOTE_MODE)
    {
        results["meta_team"] = parseInt(team_num)
    }
    config.pages.forEach(function (page, index)
    {
        page["columns"].forEach(function (column, index)
        {
            column["inputs"].forEach(function (input, index)
            {
                var id = input.id
                var type = input.type

                switch (type)
                {
                    case "checkbox":
                        results[id] = document.getElementById(id).checked
                        break
                    case "counter":
                        results[id] = parseInt(document.getElementById(id).innerHTML)
                        break
                    case "select":
                        results[id] = -1
                        let children = document.getElementById(id).getElementsByClassName("wr_select_option")
                        var i = 0;
                        for (let option of children)
                        {
                            if (option.classList.contains("selected"))
                            {
                                results[id] = i
                            }
                            i++
                        }
                        break
                    case "dropdown":
                        results[id] = document.getElementById(id).selectedIndex
                        break
                    case "number":
                        results[id] = parseInt(document.getElementById(id).value)
                        break
                    case "string":
                    case "text":
                        results[id] = document.getElementById(id).value
                        break
                }
            })
        })
    })

    let file = get_pit_result(team_num, event_id)
    if (scout_mode == MATCH_MODE)
    {
        file = get_match_result(match_num, team_num, event_id)
    }
    else if (scout_mode == NOTE_MODE)
    {
        file = get_notes(match_num, event_id)
    }
    localStorage.setItem(file, JSON.stringify(results));
    window.location.href = document.referrer
}

// read parameters from URL
const scout_pos = get_parameter(POSITION_COOKIE, POSITION_DEFAULT)
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)
const scout_mode = get_parameter(TYPE_COOKIE, TYPE_DEFAULT)

var urlParams = new URLSearchParams(window.location.search)
const match_num = urlParams.get("match")
const team_num = urlParams.get("team")
const alliance_color = urlParams.get('alliance')

load_config(scout_mode)
window.addEventListener("load", function() {

    // build the page from config for the desired mode
    switch (scout_mode)
    {
        case PIT_MODE:
            document.getElementById("match").innerHTML = "Pit"
            document.getElementById("team").innerHTML = team_num
            document.getElementById("team").style.color = "white"
            break
        case MATCH_MODE:
            document.getElementById("match").innerHTML = match_num
            document.getElementById("team").innerHTML = team_num
            document.getElementById("team").style.color = alliance_color
            break
        case NOTE_MODE:
            document.getElementById("match").innerHTML = match_num
            document.getElementById("team").innerHTML = "Match " + match_num
            document.getElementById("team").style.color = "white"
            break
    }
    ws(team_num)
    build_page_from_config(scout_mode)
})