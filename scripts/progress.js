/**
 * file:        progress.js
 * description: Page to display what results exist.
 * author:      Liam Fruzyna
 * date:        2022-01-31
 */

include('transfer')

/**
 * function:    build_key
 * parameters:  color string, label string
 * returns:     th element
 * description: Builds a header cell with a given background color and label.
 */
function build_key(color, label)
{
    let k = document.createElement('th')
    k.style.backgroundColor = color
    k.innerText = label
    return k
}

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    // set header
    document.getElementById('header_info').innerText = 'Scouting Progress'

    let match_table = document.createElement('table')
    let pit_table = document.createElement('table')

    let key = document.createElement('table')
    let key_row = key.insertRow()
    key_row.append(build_key('green', 'Complete'))
    key_row.append(build_key('yellowgreen', 'Match Only'))
    key_row.append(build_key('yellow', 'Note Only'))
    key_row.append(build_key('orange', 'Unsure'))
    key_row.append(build_key('red', 'Unscouted'))

    // build match result table
    let matches = Object.keys(dal.matches)
    matches.sort((a, b) => dal.get_match_value(a, 'scheduled_time') - dal.get_match_value(b, 'scheduled_time'))
    let keys = Object.values(dal.get_team_keys(event_id))
    let header_row = match_table.insertRow()
    header_row.insertCell()
    for (let k of keys)
    {
        let th = document.createElement('th')
        th.innerText = k
        header_row.append(th)
    }
    for (let match of matches)
    {
        let row = match_table.insertRow()
        let th = document.createElement('th')
        th.innerText = dal.get_match_value(match, 'short_match_name')
        row.append(th)

        let teams = dal.get_match_teams(match)
        for (let team_key of Object.keys(teams))
        {
            let team = teams[team_key]
            let alliance = team_key.substring(0, team_key.indexOf('_'))
            let color = 'red'
            let link = ''
            let match_scouted = dal.is_match_scouted(match, team)
            let note_scouted = dal.is_note_scouted(match, team)
            if (match_scouted || note_scouted)
            {
                if (dal.get_result_value(team, match, 'meta_unsure'))
                {
                    color = 'orange'
                    link = open_page('scout', {type: MATCH_MODE, match: match, team: team, alliance: alliance, edit: true})
                }
                else if (match_scouted && note_scouted)
                {
                    color = 'green'
                    link = open_page('results', {'file': `${match}-${team}`})
                }
                else if (match_scouted)
                {
                    color = 'yellowgreen'
                    link = open_page('results', {'file': `${match}-${team}`})
                }
                else if (note_scouted)
                {
                    color = 'yellow'
                    link = open_page('results', {'file': `${match}-${team}`})
                }
            }
            else
            {
                color = 'red'
                link = open_page('scout', {type: MATCH_MODE, match: match, team: team, alliance: alliance, edit: false})
            }

            let td = row.insertCell()
            td.innerText = team
            td.style.backgroundColor = color
            td.onclick = (event) => window_open(link, '_self')
        }
    }

    // build pit result table
    let teams = Object.keys(dal.teams)
    teams.sort((a, b) => a.team_number - b.team_number)
    let pit_row
    for (let i in teams)
    {
        if (i % 7 == 0)
        {
            pit_row = pit_table.insertRow()
        }
        let color = 'red'
        let link = ''
        if (dal.is_pit_scouted(teams[i]))
        {
            color = 'green'
            link = open_page('scout', {type: PIT_MODE, team: teams[i], edit: true})
        }
        else
        {
            color = 'red'
            link = open_page('scout', {type: PIT_MODE, team: teams[i], edit: false})
        }

        let td = pit_row.insertCell()
        td.style.backgroundColor = color
        td.onclick = (event) => window_open(link, '_self')
        td.innerText = teams[i]
    }

    // add both tables to the page in cards
    let page = new PageFrame('', '')

    let pit = new ColumnFrame('pit_page', 'Pit Progress')
    page.add_column(pit)
    let pit_card = new Card('pits', pit_table)
    pit.add_input(pit_card)
    
    let import_all = new Button('import', 'Import All Results', 'import_results()')
    pit.add_input(import_all)
    
    let export_all = new Button('export', 'Export All Results', 'export_results()')
    pit.add_input(export_all)

    let match = new ColumnFrame('match_page', 'Match Progress')
    page.add_column(match)
    let match_content = document.createElement('span')
    match_content.append(key, match_table)
    let match_card = new Card('matches', match_content)
    match.add_input(match_card)

    document.getElementById('body').replaceChildren(page.element)
}

/**
 * function:    import_results
 * parameters:  none
 * returns:     none
 * description: Starts the zip import process for results.
 */
function import_results()
{
    // allow page reload to be run on complete
    const callback = window.location.reload.bind(window.location)

    let handler = new ZipHandler()
    handler.match     = true
    handler.note      = true
    handler.pit       = true
    handler.on_complete = callback
    handler.import_zip_from_file()
}

/**
 * function:    export_results
 * parameters:  none
 * returns:     none
 * description: Starts the zip export process for results.
 */
function export_results()
{
    let handler = new ZipHandler()
    handler.match     = true
    handler.note      = true
    handler.pit       = true
    handler.pictures  = true
    handler.user = get_cookie(USER_COOKIE, USER_DEFAULT)
    handler.export_zip()
}