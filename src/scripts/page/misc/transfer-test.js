/**
 * file:        transfer-test.js
 * description: Allows quick testing of the different import/export functions.
 * author:      Liam Fruzyna
 * date:        2025-07-30
 */

/**
 * Builds a page of buttons to import and export.
 */
function init_page()
{
    header_info.innerText = 'Transfer Test'

    let export_col = new WRColumn('Export', [
        build_export_setup().build_button('Export Setup'),
        build_export_results().build_button('Export Results'),
        build_export_data().build_button('Export Data'),
        build_export_all().build_button('Export All')
    ])

    let import_col = new WRColumn('Import', [
        build_import_setup(init_page).build_button('Import Setup'),
        build_import_results(init_page).build_button('Import Results'),
        build_import_data(init_page).build_button('Import Data'),
        build_import_all(init_page).build_button('Import All'),
        build_import_picklist(init_page).build_button('Import Picklist')
    ])

    let teams = dal.team_numbers
    let matches = dal.match_keys

    let event_config = new WRStatusTile(dal.event_name)
    event_config.set_status((teams.length > 0 ? 1 : 0) + (matches.length > 0 ? 1 : 0) - 1)
    let scout_config_valid = new WRStatusTile(cfg.scout.version)
    scout_config_valid.set_status(cfg.validate() ? 1 : -1)
    let analysis_config_valid = new WRStatusTile(cfg.analysis.version)
    analysis_config_valid.set_status(cfg.validate() ? 1 : -1)
    let status_stack = new WRStack([event_config, scout_config_valid, analysis_config_valid])

    let team_labels = ['Teams'].concat(cfg.team_scouting_mode_names)
    let team_values = [teams.length].concat(cfg.team_scouting_modes.map(mode => dal.count_team_results(mode)))
    let team_results = new WRMultiNumber('', team_labels, team_values)
    team_results.columns = 1

    let match_labels = ['Matches'].concat(cfg.match_scouting_mode_names)
    let match_values = [matches.length].concat(cfg.match_scouting_modes.map(mode => dal.count_match_results(mode)))
    let match_results = new WRMultiNumber('', match_labels, match_values)
    match_results.columns = 1

    let picklists = new WRNumber('Picklists', Object.keys(dal.picklists).length)

    let status_col = new WRColumn('Status', [status_stack, team_results, match_results, picklists])

    let reset_col = new WRColumn('Reset', [
        new WRButton('Reset App', reset),
        new WRButton('Reset Config', reset_config),
        new WRButton('Reset Results', reset_results)
    ])

    let page = new WRPage('', [export_col, import_col, status_col, reset_col])
    preview.replaceChildren(page)
}