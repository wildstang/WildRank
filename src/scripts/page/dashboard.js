/**
 * file:        dashboard.js
 * description: Page that provides data management tools to admins.
 * author:      Liam Fruzyna
 * date:        2025-05-03
 */

include('transfer')

var event_config, scout_config_valid, analysis_config_valid, summary_card
var breakdown_table, team_table, match_table

/**
 * Builds the page components, but does not populate them.
 */
function init_page()
{
    header_info.innerText = 'Dashboard'

    // build shortcut buttons to common analysis pages
    let ranker = new WRLinkButton('Stat Builder', build_url('ranker'))
    ranker.add_class('slim')
    let coach = new WRLinkButton('Edit Coach', build_url('edit-coach'))
    coach.add_class('slim')
    let pivot = new WRLinkButton('Pivot Table', build_url('pivot'))
    pivot.add_class('slim')
    let plot = new WRLinkButton('Plotter', build_url('plot'))
    plot.add_class('slim')
    let notes = new WRLinkButton('Note Viewer', build_url('note-viewer'))
    notes.add_class('slim')
    let lists = new WRLinkButton('Pick Lists', build_url('multipicklists'))
    lists.add_class('slim')

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
    let pull_tba = new WRButton('Pull from TBA', () => preload_event(populate))
    pull_tba.add_class('slim')
    let export_cfg = new WRButton('Export Config', ZipHandler.export_setup)
    export_cfg.add_class('transfer')
    export_cfg.add_class('slim')
    let import_res = new WRButton('Import Results', () => ZipHandler.import_results(populate))
    import_res.add_class('transfer')
    import_res.add_class('slim')
    let export_dat = new WRButton('Export Data', ZipHandler.export_data)
    export_dat.add_class('transfer')
    export_dat.add_class('slim')

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
    let top_page = new WRPage('', [new WRColumn('', [new WRStack([ranker, coach]), status_stack]),
                                   new WRColumn('', [new WRStack([pivot, plot]), summary_card]),
                                   new WRColumn('', [new WRStack([notes, lists]), new WRStack([pull_tba, export_cfg, import_res, export_dat])])])
    let bottom_page = new WRPage('', [new WRColumn('', [breakdown_card, teams_card]), new WRColumn('', [matches_card])])
    preview.replaceChildren(top_page, bottom_page)

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

    // determine the last match that has been scouted
    let last_match = ''
    for (let match_key of matches)
    {
        for (let team_num in dal.matches[match_key].results)
        {
            if (Object.keys(dal.matches[match_key].results[team_num].results).length > 0)
            {
                last_match = match_key
                break
            }
        }
    }
    if (last_match.length > 0)
    {
        summary_card.numbers[2].value_el.innerText = dal.matches[last_match].short_name
    }

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