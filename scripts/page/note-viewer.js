/**
 * file:        note-viewer.js
 * description: A page for viewing, filtering, and searching notes.
 * author:      Liam Fruzyna
 * date:        2023-04-12
 */

const SESSION_TEAMS_KEY = 'note-selected-teams'
const SESSION_SCOUTER_KEY = 'note-selected-scouter'
const SESSION_SEARCH_KEY = 'note-selected-search'

let scouters = []

let team_entry, scouter_drop, search_entry, mode_drop, notes_page

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
    let default_teams = ''
    let session_teams = sessionStorage.getItem(SESSION_TEAMS_KEY)
    if (session_teams !== null)
    {
        default_teams = session_teams
    }
    let default_scouter = ''
    let session_scouter = sessionStorage.getItem(SESSION_SCOUTER_KEY)
    if (session_scouter !== null)
    {
        default_scouter = cfg.get_name(session_scouter, false)
    }
    let default_search = ''
    let session_search = sessionStorage.getItem(SESSION_SEARCH_KEY)
    if (session_search !== null)
    {
        default_search = session_search
    }

    // get all scouters
    let matches = dal.get_results([], false)
    let pits = dal.get_pits([], false)
    let match_users = matches.map(m => m.meta_scouter_id).filter(id => typeof id !== 'undefined')
    let note_users = matches.map(m => m.meta_note_scouter_id).filter(id => typeof id !== 'undefined')
    let pit_users = pits.map(p => p.meta_scouter_id).filter(id => typeof id !== 'undefined')
    scouters = match_users.concat(note_users, pit_users)
    scouters = [... new Set(scouters)]
    scouters.sort()
    let names = scouters.map(id => '' + cfg.get_name(id, false))
    names = [''].concat(names)

    // build filters
    team_entry = new WREntry('Teams (comma-separated)', default_teams)
    team_entry.on_text_change = filter_notes
    let teams_col = new WRColumn('', [team_entry])
    scouter_drop = new WRDropdown('Scouter', names, default_scouter)
    scouter_drop.on_change = filter_notes
    let scouter_col = new WRColumn('', [scouter_drop])
    mode_drop = new WRDropdown('Scout Mode', ['All', 'Pit', 'Match', 'Alliance'], default_scouter)
    mode_drop.on_change = filter_notes
    let mode_col = new WRColumn('', [mode_drop])
    search_entry = new WREntry('Search', default_search)
    search_entry.on_text_change = filter_notes
    let search_col = new WRColumn('', [search_entry])
    notes_page = new WRPage()
    body.append(new WRPage('', [teams_col, scouter_col, mode_col, search_col]), notes_page)
    filter_notes()
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
    let scout_mode = mode_drop.element.selectedIndex
    sessionStorage.setItem(SESSION_SCOUTER_KEY, scouter)
    let search = search_entry.element.value.trim().toLowerCase()
    sessionStorage.setItem(SESSION_SEARCH_KEY, search)

    let team_cols = []
    for (let team of teams)
    {
        if (team in dal.teams)
        {
            let notes = {}

            // get all results
            let results = dal.teams[team].results
            results.sort((a, b) => a.meta_scout_time - b.meta_scout_time)
            if (dal.is_pit_scouted(team))
            {
                results = [dal.teams[team].pit].concat(results)
            }
            for (let result of results)
            {
                let keys = Object.keys(result)
                for (let key of keys)
                {
                    // only look at results ending in "notes" that use at least 5 characters
                    if (!key.endsWith('notes') || result[key].length < 5)
                    {
                        continue
                    }

                    // skip if the selected scouter did not take the note
                    if (scouter !== ''  && ((key.startsWith(PIT_MODE) && result.meta_scouter_id !== scouter) ||
                                            (key.startsWith(MATCH_MODE) && result.meta_scouter_id !== scouter) ||
                                            (key.startsWith(NOTE_MODE) && result.meta_note_scouter_id !== scouter)))
                    {
                        continue
                    }

                    // skip if the result is not the selected mode
                    if (scout_mode > 0 && ((scout_mode === 1 && !key.startsWith(PIT_MODE)) ||
                                            (scout_mode === 2 && !key.startsWith(MATCH_MODE)) ||
                                            (scout_mode === 3 && !key.startsWith(NOTE_MODE))))
                    {
                        continue
                    }

                    // skip teams that don't match search
                    if (search !== '' && !result[key].toLowerCase().includes(search))
                    {
                        continue
                    }

                    // determine note ID
                    let result_key = PIT_MODE
                    if (result.meta_scout_mode !== PIT_MODE)
                    {
                        result_key = result.meta_match_key
                    }

                    // collect note
                    if (!(result_key in notes))
                    {
                        notes[result_key] = []
                    }

                    let name = ''
                    if (scouter === '')
                    {
                        if (!key.startsWith(NOTE_MODE))
                        {
                            name = cfg.get_name(result.meta_scouter_id)
                        }
                        else if (key.startsWith(NOTE_MODE))
                        {
                            name = cfg.get_name(result.meta_note_scouter_id)
                        }
                    }

                    let note = result[key]
                    if (result.meta_scout_mode !== NOTE_MODE && result.meta_unsure)
                    {
                        note = `[UNSURE] ${note}`
                    }
                    notes[result_key].push([name, note, key.startsWith(NOTE_MODE)])
                }
            }

            // build table of notes
            let name = dal.get_value(team, 'meta.name')
            let result_keys = Object.keys(notes)
            let results_el = document.createElement('span')
            let header = document.createElement('center')
            let team_el = document.createElement('h2')
            team_el.innerText = team
            let name_el = document.createElement('h3')
            name_el.innerText = name
            header.append(team_el, name_el)
            let table = document.createElement('table')
            results_el.append(header, table)
            for (let key of result_keys)
            {
                let name = PIT_MODE
                if (key in dal.matches)
                {
                    name = `Match ${dal.matches[key].short_match_name}`
                }
                table.append(create_header_row(['', name]))
                for (let note of notes[key])
                {
                    let row = table.insertRow()
                    row.insertCell().innerHTML = note[2] ? `<i>${note[0]}</i>` : note[0]
                    row.insertCell().innerText = note[1]
                }
            }

            // add notes to new card
            let card = new WRCard(results_el)
            card.add_class('scalable_card')

            team_cols.push(new WRColumn('', [card]))
        }
    }
    notes_page.replaceChildren(...team_cols)
}