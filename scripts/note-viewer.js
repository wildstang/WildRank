/**
 * file:        note-viewer.js
 * description: A page for viewing, filtering, and searching notes.
 * author:      Liam Fruzyna
 * date:        2023-04-12
 */

let scouters = []

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    // get all scouters
    let matches = dal.get_results([], false)
    let pits = dal.get_pits([], false)
    let match_users = matches.map(m => m.meta_scouter_id).filter(id => typeof id !== 'undefined')
    let note_users = matches.map(m => m.meta_note_scouter_id).filter(id => typeof id !== 'undefined')
    let pit_users = pits.map(p => p.meta_scouter_id).filter(id => typeof id !== 'undefined')
    scouters = match_users.concat(note_users, pit_users)
    scouters = [... new Set(scouters)]
    scouters.sort()
    let names = scouters.map(id => cfg.get_name(id, false))
    names = [''].concat(names)

    // build filters
    let teams = new Entry('teams', 'Teams (comma-separated)')
    teams.on_text_change = 'filter_notes()'
    let teams_col = new ColumnFrame('', '', [teams])
    let scouter = new Dropdown('scouter', 'Scouter', names, '')
    scouter.on_change = 'filter_notes()'
    let scouter_col = new ColumnFrame('', '', [scouter])
    let search = new Entry('search', 'Search')
    search.on_text_change = 'filter_notes()'
    let search_col = new ColumnFrame('', '', [search])
    document.body.innerHTML += new PageFrame('', '', [teams_col, scouter_col, search_col]).toString + new PageFrame('notes', '').toString
}

/**
 * function:    filter_notes
 * parameters:  none
 * returns:     none
 * description: Populates the page with notes fitting the filter.
 */
function filter_notes()
{
    let teams_str = document.getElementById('teams').value
    let teams = teams_str.split(',').map(t => t.trim()) 
    let scouter_idx = document.getElementById('scouter').selectedIndex - 1
    let scouter = ''
    if (scouter_idx >= 0)
    {
        scouter = scouters[scouter_idx]
    }
    let search = document.getElementById('search').value.trim().toLowerCase()

    // clear previous notes
    let page = document.getElementById('notes')
    page.innerHTML = ''

    for (let team of teams)
    {
        if (team in dal.teams)
        {
            let notes = {}

            // get all results
            let results = dal.teams[team].results
            if (dal.is_pit_scouted(team))
            {
                results = [dal.teams[team].pit].concat(results)
            }
            results.push()
            for (let result of results)
            {
                // only look at pit notes from the filtered scouter
                if (result.meta_scout_mode !== 'pit' || (scouter === '' || result.meta_scouter_id === scouter))
                {
                    let keys = Object.keys(result)
                    for (let key of keys)
                    {
                        // find results ending in notes from the filtered scouter
                        if (key.endsWith('notes') && result[key].length > 5 && (scouter === '' ||
                            (!key.startsWith('note') && result.meta_scouter_id === scouter) ||
                            (key.startsWith('note') && result.meta_note_scouter_id === scouter)))
                        {
                            // apply search
                            if (search !== '' && !result[key].toLowerCase().includes(search))
                            {
                                continue
                            }

                            // determine note ID
                            let result_key = 'pit'
                            if (result.meta_scout_mode !== 'pit')
                            {
                                result_key = result.meta_match_key
                            }

                            // collect note
                            if (!(result_key in notes))
                            {
                                notes[result_key] = []
                            }
                            notes[result_key].push(result[key])
                        }
                    }
                }
            }

            // build table of notes
            let images = dal.get_photo_carousel(team, '200px')
            let name = dal.get_value(team, 'meta.name')
            let result_keys = Object.keys(notes)
            let table = `<center><h2>${team}</h2><h3>${name}</h3></center>${images}<table>`
            for (let key of result_keys)
            {
                let name = 'pit'
                if (key in dal.matches)
                {
                    name = dal.matches[key].short_match_name
                }
                let row = `<tr><th>${name}</th><td></td></tr>`
                for (let note of notes[key])
                {
                    row += `<tr><td></td><td>${note}</td>`
                }
                table += row
            }
            table += '</table>'

            // add notes to new card
            let card = new Card(team, table)
            card.limitWidth = true
            page.innerHTML += new ColumnFrame('', '', [card]).toString
        }
    }
}