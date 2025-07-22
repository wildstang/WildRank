/**
 * file:        note-viewer.js
 * description: A page for viewing, filtering, and searching notes.
 * author:      Liam Fruzyna
 * date:        2023-04-12
 */

const SESSION_TEAMS_KEY = 'note-selected-teams'
const SESSION_SCOUTER_KEY = 'note-selected-scouter'
const SESSION_MODE_KEY = 'note-selected-mode'
const SESSION_SEARCH_KEY = 'note-selected-search'

var scouters = []
var team_modes = []
var match_modes = []

var team_entry, scouter_drop, search_entry, mode_drop, notes_page

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    header_info.innerText = 'Note Viewer'

    // pull previously selected filters
    let session_teams = sessionStorage.getItem(SESSION_TEAMS_KEY)
    let default_teams = session_teams !== null ? session_teams : ''
    let session_scouter = sessionStorage.getItem(SESSION_SCOUTER_KEY)
    let default_scouter = session_scouter !== null ? cfg.get_name(session_scouter, true, false) : ''
    let session_mode = sessionStorage.getItem(SESSION_MODE_KEY)
    let default_mode = session_mode !== null ? parseInt(session_mode) : ''
    let session_search = sessionStorage.getItem(SESSION_SEARCH_KEY)
    let default_search = session_search !== null ? session_search : ''

    // get all scouters
    scouters = dal.get_all_scouters()
    scouters.sort((a, b) => cfg.get_name(a).localeCompare(cfg.get_name(b)))
    let names = scouters.map(id => '' + cfg.get_name(id))
    names = [''].concat(names)

    team_modes = cfg.team_scouting_modes
    match_modes = cfg.match_scouting_modes
    let mode_names = ['All'].concat(team_modes.map(m => cfg.get_scout_config(m).name), match_modes.map(m => cfg.get_scout_config(m).name))

    // build filters
    team_entry = new WREntry('Teams (comma-separated)', default_teams)
    team_entry.on_text_change = filter_notes
    let teams_col = new WRColumn('', [team_entry])
    scouter_drop = new WRDropdown('Scouter', names, default_scouter)
    scouter_drop.on_change = filter_notes
    let scouter_col = new WRColumn('', [scouter_drop])
    mode_drop = new WRDropdown('Scout Mode', mode_names, mode_names[default_mode])
    mode_drop.on_change = filter_notes
    let mode_col = new WRColumn('', [mode_drop])
    search_entry = new WREntry('Search', default_search)
    search_entry.on_text_change = filter_notes
    let search_col = new WRColumn('', [search_entry])
    notes_page = new WRPage()
    preview.append(new WRPage('', [teams_col, scouter_col, mode_col, search_col]), notes_page)
    filter_notes()
}

/**
 * Finds notes from given results.
 * @param {Object} team Team or match-team object
 * @param {String} mode Scouting mode
 * @param {Array} keys Note keys to search for
 * @param {Number} scouter Scouter ID
 * @param {String} search Search term
 * @returns Array of array of scouters and their notes
 */
function find_notes(team, mode, keys, scouter, search)
{
    let notes = []
    for (let i in team.results[mode])
    {
        let result_scouter = team.meta[mode][i].scouter.user_id
        if (scouter && scouter !== result_scouter)
        {
            continue
        }

        let result = team.results[mode][i]
        for (let key of keys)
        {
            if (!result.hasOwnProperty(key))
            {
                continue
            }
            let note = result[key]
            if (!key.includes('note') || note.length < 5)
            {
                continue
            }
            if (search.length > 0 && !note.toLowerCase().includes(search.toLocaleLowerCase()))
            {
                continue
            }

            let name = cfg.get_name(result_scouter)
            if (team.meta[mode][i].status.unsure)
            {
                note = `[UNSURE] ${note}`
            }
            notes.push([name, note])
        }
    }
    return notes
}

/**
 * function:    filter_notes
 * parameters:  none
 * returns:     none
 * description: Populates the page with notes fitting the filter.
 */
function filter_notes()
{
    // read and store filters
    let teams_str = team_entry.element.value
    sessionStorage.setItem(SESSION_TEAMS_KEY, teams_str)
    let teams = teams_str.split(',').map(t => t.trim()) 
    let scouter_idx = scouter_drop.element.selectedIndex - 1
    let scouter = ''
    if (scouter_idx >= 0)
    {
        scouter = scouters[scouter_idx]
    }
    sessionStorage.setItem(SESSION_SCOUTER_KEY, scouter)
    let scout_mode = mode_drop.element.selectedIndex
    sessionStorage.setItem(SESSION_MODE_KEY, scout_mode)
    let search = search_entry.element.value.trim().toLowerCase()
    sessionStorage.setItem(SESSION_SEARCH_KEY, search)

    let team_keys = cfg.filter_keys(cfg.get_team_keys(true, false, false), 'string').map(k => k.substring(7))
    let match_keys = cfg.filter_keys(cfg.get_match_keys(true, false, false), 'string').map(k => k.substring(7))

    let team_cols = []
    for (let team of teams)
    {
        if (team in dal.teams)
        {
            let notes = {}
            for (let mode of team_modes)
            {
                let selected_mode = scout_mode === 0 || (scout_mode <= team_modes.length && team_modes[scout_mode - 1] === mode)
                if (selected_mode && dal.is_team_scouted(team, mode))
                {
                    let team_notes = find_notes(dal.teams[team], mode, team_keys, scouter, search)
                    if (team_notes.length)
                    {
                        notes[mode] = team_notes
                    }
                }
            }
            for (let match_key of dal.teams[team].matches)
            {
                for (let mode of match_modes)
                {
                    let selected_mode = scout_mode === 0 || (scout_mode > team_modes.length && match_modes[scout_mode - team_modes.length - 1] === mode)
                    if (selected_mode && dal.is_match_scouted(match_key, team, mode))
                    {
                        let match_notes = find_notes(dal.matches[match_key].results[team], mode, match_keys, scouter, search)
                        if (match_notes.length)
                        {
                            notes[match_key] = match_notes
                        }
                    }
                }
            }

            // build table of notes
            let name = dal.teams[team].name
            let results_el = document.createElement('span')
            let header = document.createElement('center')
            let team_el = document.createElement('h2')
            team_el.innerText = team
            let name_el = document.createElement('h3')
            name_el.innerText = name
            header.append(team_el, name_el)
            let table = document.createElement('table')
            results_el.append(header, table)
            for (let key of Object.keys(notes))
            {
                let name = ''
                if (key in dal.matches)
                {
                    name = `Match ${dal.matches[key].short_name}`
                }
                else
                {
                    name = cfg.get_scout_config(key).name
                }
                table.append(create_header_row(['', name]))
                for (let note of notes[key])
                {
                    let row = table.insertRow()
                    row.insertCell().innerHTML = note[0]
                    row.insertCell().innerText = note[1]
                }
            }

            // add notes to new card
            let card = new WRCard(results_el, true)

            team_cols.push(new WRColumn('', [card]))
        }
    }
    notes_page.replaceChildren(...team_cols)
}