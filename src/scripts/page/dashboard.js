/**
 * file:        dashboard.js
 * description: Page that provides data management tools to admins.
 * author:      Liam Fruzyna
 * date:        2025-05-03
 */

var event_config, scout_config_valid, analysis_config_valid, summary_card
var breakdown_table, team_table, match_table

/**
 * Builds the page components, but does not populate them.
 */
function init_page()
{
    header_info.innerText = 'Dashboard'

    // build shortcut buttons to common analysis pages
    let stats_link = new WRLinkButton('Stat Builder', build_url('ranker'))
    stats_link.add_class('slim')
    let edit_links = new WRMultiLinkButton('', ['Coach', 'Faves', 'FMS'], [build_url('edit-coach'), build_url('edit-favorites'), build_url('edit-fms')])
    edit_links.add_class('slim')
    let second_links = new WRMultiLinkButton('', ['Pivot Table', 'Plotter'], [build_url('pivot'), build_url('plot')])
    second_links.add_class('slim')
    let third_links = new WRMultiLinkButton('', ['Note Viewer', 'Pick Lists'], [build_url('note-viewer'), build_url('multipicklists')])
    third_links.add_class('slim')

    // produce status tiles
    event_config = new WRStatusTile(dal.event_name)
    scout_config_valid = new WRStatusTile(cfg.scout.version)
    scout_config_valid.on_click = () => window_open(build_url('config-debug'))
    analysis_config_valid = new WRStatusTile(cfg.analysis.version)
    analysis_config_valid.on_click = () => window_open(build_url('config-debug'))
    let status_stack = new WRStack([event_config, scout_config_valid, analysis_config_valid])

    // create result summary card
    summary_card = new WRMultiNumber('', ['Pits', 'Matches', 'Latest Match'], ['-', '-', '-'])

    // create transfer buttons
    let labels = ['Pull from TBA', 'Export Config', 'Import Results', 'Export Data']
    let functions = [() => preload_event(populate), export_setup, () => import_results(populate), export_data]
    let transfer_buttons = new WRMultiButton('', labels, functions)
    transfer_buttons.add_class('slim')

    // create result breakdown card
    let breakdown_contents = document.createElement('div')
    let breakdown_header = document.createElement('h2')
    breakdown_header.innerText = 'Breakdown'
    breakdown_table = document.createElement('table')
    breakdown_contents.append(breakdown_header, breakdown_table)
    let breakdown_card = new WRCard(breakdown_contents)

    // create team result table card
    let team_contents = document.createElement('div')
    let team_header = document.createElement('h2')
    team_header.innerText = 'Teams'
    team_table = document.createElement('table')
    team_contents.append(team_header, team_table)
    let teams_card = new WRCard(team_contents)

    // create match-team result table card
    let match_contents = document.createElement('div')
    let match_header = document.createElement('h2')
    match_header.innerText = 'Matches'
    match_table = document.createElement('table')
    match_contents.append(match_header, match_table)
    let matches_card = new WRCard(match_contents)

    // put cards into 2 pages
    let top_page = new WRPage('', [new WRColumn('', [new WRStack([stats_link, edit_links]), status_stack]),
                                   new WRColumn('', [second_links, summary_card]),
                                   new WRColumn('', [third_links, transfer_buttons])])
    let bottom_page = new WRPage('', [new WRColumn('', [breakdown_card, teams_card]), new WRColumn('', [matches_card])])
    preview.replaceChildren(top_page, bottom_page)

    transfer_buttons.element.children[1].title = 'Export event data, scouting config, and analysis config'
    transfer_buttons.element.children[3].title = 'Export event data and results'

    populate()
}

/**
 * Populates the contents of the page.
 */
function populate()
{
    dal.load_data()

    // clear tables
    breakdown_table.replaceChildren()
    team_table.replaceChildren()
    match_table.replaceChildren()

    // get lists of teams and matches
    let teams = dal.team_numbers
    let matches = dal.match_keys

    // update status tiles
    event_config.label_el.innerText = dal.event_name
    event_config.set_status((teams.length > 0 ? 1 : 0) + (matches.length > 0 ? 1 : 0) - 1)
    scout_config_valid.set_status(cfg.validate() ? 1 : -1)
    analysis_config_valid.set_status(cfg.validate() ? 1 : -1)

    // count team results
    let team_modes = cfg.team_scouting_modes
    summary_card.numbers[0].value_el.innerText = `${dal.count_team_results()}/${teams.length * team_modes.length}`

    // complete match results
    let match_modes = cfg.match_scouting_modes
    summary_card.numbers[1].value_el.innerText = `${dal.count_match_results()}/${matches.length * 6 * match_modes.length}`

    // determine the last match that has been scouted and received from FMS
    let last_scouted = ''
    let last_result = ''
    for (let match_key of matches)
    {
        let match = dal.matches[match_key]
        if (match.comp_level === 'qm')
        {
            for (let team_num in match.results)
            {
                let team_res = match.results[team_num]
                if (Object.keys(team_res.results).length > 0)
                {
                    last_scouted = match_key
                }
                if (Object.keys(team_res.fms_results).length > 0)
                {
                    last_result = match_key
                }
            }
        }
    }
    last_scouted = last_scouted.length > 0 ? dal.matches[last_scouted].short_name : 0
    last_result = last_result.length > 0 ? dal.matches[last_result].short_name : 0
    summary_card.numbers[2].value_el.innerText = `${last_scouted}:${last_result}`

    // create object to count scouting mode breakdowns
    let all_modes = cfg.scouting_modes
    let mode_counts = {}
    for (let mode of all_modes)
    {
        mode_counts[mode] = {
            complete: 0,
            unsure: 0,
            ignored: 0,
            total: 0
        }
    }

    // create header row for match result table
    let header_row = match_table.insertRow()
    header_row.insertCell()
    for (let k of get_position_names())
    {
        let th = document.createElement('th')
        th.innerText = k
        header_row.append(th)
    }

    // build match result table
    for (let match of matches)
    {
        // create a row for each match, starting with match number
        let row = match_table.insertRow()
        let th = document.createElement('th')
        th.innerText = dal.matches[match].short_name
        row.append(th)

        // add a cell for each team
        let match_teams = dal.get_match_teams(match)
        for (let team_key of Object.keys(match_teams))
        {
            // add to mode breakdown counts
            let team = match_teams[team_key]
            if (dal.matches[match].comp_level === 'qm')
            {
                for (let mode of match_modes)
                {
                    mode_counts[mode].total++
                    if (dal.is_match_scouted(match, team, mode))
                    {
                        mode_counts[mode].complete++
                        if (dal.matches[match].results[team].meta[mode][0].status.unsure)
                        {
                            mode_counts[mode].unsure++
                        }
                        if (dal.matches[match].results[team].meta[mode][0].status.unsure)
                        {
                            mode_counts[mode].ignore++
                        }
                    }
                }
            }

            // count number of scouted modes
            let scouted_modes = match_modes.filter(m => dal.is_match_scouted(match, team, m)).length

            // build cell
            let td = row.insertCell()
            td.innerText = team
            td.title = dal.teams[team].name
            td.style.backgroundColor = get_completion_color(scouted_modes, match_modes.length)
            if (scouted_modes > 0)
            {
                td.onclick = (event) => window_open(build_url('results', {'match': match, 'team': team}))
            }
        }
    }

    // build pit result table
    let teams_row
    for (let i in teams)
    {
        // create a new row every 7 cells
        if (i % 7 == 0)
        {
            teams_row = team_table.insertRow()
        }

        // add to mode breakdown counts
        let team = teams[i]
        for (let mode of team_modes)
        {
            mode_counts[mode].total++
            if (dal.is_team_scouted(team, mode))
            {
                mode_counts[mode].complete++
                if (dal.teams[team].meta[mode][0].status.unsure)
                {
                    mode_counts[mode].unsure++
                }
                if (dal.teams[team].meta[mode][0].status.unsure)
                {
                    mode_counts[mode].ignore++
                }
            }
        }

        // count number of scouted modes
        let scouted_modes = team_modes.filter(m => dal.is_team_scouted(team, m)).length

        // build cell
        let td = teams_row.insertCell()
        td.style.backgroundColor = get_completion_color(scouted_modes, team_modes.length)
        td.innerText = team
        if (scouted_modes > 0)
        {
            td.onclick = (event) => window_open(build_url('teams', {'team': team}))
        }
    }

    // produce a table for the breakdown of each mode
    breakdown_table.append(create_header_row(['Mode', 'Complete', 'Unsure', 'Ignored']))
    for (let mode of all_modes)
    {
        let breakdown_row = breakdown_table.insertRow()
        breakdown_row.append(create_header(cfg.get_scout_config(mode).name))
        breakdown_row.insertCell().innerText = `${mode_counts[mode].complete} (${(100 * mode_counts[mode].complete / mode_counts[mode].total).toFixed(1)}%)`
        breakdown_row.insertCell().innerText = `${mode_counts[mode].unsure} (${(100 * mode_counts[mode].unsure / mode_counts[mode].total).toFixed(1)}%)`
        breakdown_row.insertCell().innerText = `${mode_counts[mode].ignored} (${(100 * mode_counts[mode].ignored / mode_counts[mode].total).toFixed(1)}%)`
    }
}

/**
 * Computes a color from green to red representing the given completion percentage.
 * @param {Number} percent Completion percentage
 * @returns Hex color string
 */
function get_completion_color(completed_modes, num_modes)
{
    let colors = ['red', 'orange', 'yellow', 'yellowgreen', 'green']
    return colors[Math.round(completed_modes / num_modes * (colors.length - 1))]
}