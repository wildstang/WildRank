/**
 * file:        result-state.js
 * description: Displays result summary data and actions for teams or match-teams.
 * author:      Liam Fruzyna
 * date:        2025-09-28
 */

// read parameters from URL
const selected_match = get_parameter('match', '')
const selected_team = get_parameter('team', '')

/**
 * Choose whether to populate page for a team or match-team.
 */
function init_page()
{
    if (selected_match)
    {
        display_match()
    }
    else if (selected_team)
    {
        display_team()
    }
    else
    {
        alert('No team or match selected!')
    }
}

/**
 * Build cards for each match scouting mode. With a table containing each individual result.
 */
function display_match()
{
    // put team number and match name in header
    header_info.innerText = `#${selected_team} ${dal.matches[selected_match].name}`

    let results = dal.matches[selected_match].results[selected_team]

    // create column with a button to view results and a status tile displaying if there are fms results
    let open_results = new WRButton('View Results', (event) => window_open(build_url('results', {'match': selected_match, 'team': selected_team})))
    let fms_results = new WRStatusTile('FMS Results', Object.keys(results.fms_results).length > 0 ? 'green' : 'red')
    let column = new WRColumn('', [open_results, fms_results])

    // add a card for each match scouting mode
    for (let scout_mode of cfg.match_scouting_modes)
    {
        let body = document.createElement('div')
        let card = new WRCard(body)
        column.add_input(card)

        let header = document.createElement('h2')
        header.innerText = cfg.get_scout_config(scout_mode).name
        body.append(header)

        if (scout_mode in results.meta)
        {
            let meta_tab = document.createElement('table')
            body.append(meta_tab)
            meta_tab.append(create_header_row(['Scouter', 'Time', 'Ignored', 'Unsure', 'Actions']))

            for (let i in results.meta[scout_mode])
            {
                let row = meta_tab.insertRow()

                let meta = results.meta[scout_mode][i]
                row.insertCell().innerText = cfg.get_name(meta.scouter.user_id, true)

                let match_time = dal.matches[meta.result.match_key].time * 1000
                let scout_time = meta.scouter.start_time * 1000
                let delta_secs = (match_time - scout_time) / 1000
                let abs_secs = Math.abs(delta_secs)
                let delta = `${abs_secs.toFixed(0)} secs`
                if (abs_secs >= 60)
                {
                    delta = `${(abs_secs / 60).toFixed(0)} mins`
                }
                row.insertCell().innerText = `${new Date(scout_time).toLocaleTimeString("en-US")} (${delta} ${delta_secs > 0 ? 'early' : 'late'})`

                let ignore_box = document.createElement('input')
                ignore_box.type = 'checkbox'
                ignore_box.checked = meta.status.ignore
                ignore_box.onclick = () => toggle_ignore(selected_match, meta, results.file_names[scout_mode][i])
                row.insertCell().append(ignore_box) 

                row.insertCell().innerText = meta.status.unsure ? meta.status.unsure_reason : '-'

                let del_result = document.createElement('button')
                del_result.innerText = 'Delete'
                del_result.onclick = () => delete_result(selected_match, [selected_team], scout_mode)
                row.insertCell().append(del_result)
            }
        }
        else
        {
            body.append('No results found')
        }
    }

    preview.replaceChildren(new WRPage('', [column]))
}

/**
 * Build cards for each team scouting mode. With a table containing each individual result.
 */
function display_team()
{
    header_info.innerText = `#${selected_team}`

    let results = dal.teams[selected_team]

    // create column with a button to view results and a status tile displaying if there are fms results
    let open_results = new WRButton('View Results', (event) => window_open(build_url('teams', {'team': selected_team})))
    let fms_results = new WRStatusTile('FMS Results', Object.keys(results.fms_results).length > 0 ? 'green' : 'red')
    let column = new WRColumn('', [open_results, fms_results])

    // add a card for each team scouting mode
    for (let scout_mode of cfg.team_scouting_modes)
    {
        let body = document.createElement('div')
        let card = new WRCard(body)
        column.add_input(card)

        let header = document.createElement('h2')
        header.innerText = cfg.get_scout_config(scout_mode).name
        body.append(header)

        if (scout_mode in results.meta)
        {
            let meta_tab = document.createElement('table')
            body.append(meta_tab)
            meta_tab.append(create_header_row(['Scouter', 'Time', 'Ignored', 'Unsure', 'Actions']))

            for (let i in results.meta[scout_mode])
            {
                let row = meta_tab.insertRow()

                let meta = results.meta[scout_mode][i]
                row.insertCell().innerText = cfg.get_name(meta.scouter.user_id, true)

                let scout_time = meta.scouter.start_time * 1000
                row.insertCell().innerText = new Date(scout_time).toLocaleTimeString("en-US")

                let ignore_box = document.createElement('input')
                ignore_box.type = 'checkbox'
                ignore_box.checked = meta.status.ignore
                ignore_box.onclick = () => toggle_ignore(selected_match, meta, results.file_names[scout_mode][i])
                row.insertCell().append(ignore_box) 

                row.insertCell().innerText = meta.status.unsure ? meta.status.unsure_reason : '-'

                let del_result = document.createElement('button')
                del_result.innerText = 'Delete'
                del_result.onclick = () => delete_result(selected_match, [selected_team], scout_mode)
                row.insertCell().append(del_result)
            }
        }
        else
        {
            body.append('No results found')
        }
    }

    preview.replaceChildren(new WRPage('', [column]))
}