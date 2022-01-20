/**
 * file:        transfer-raw.js
 * description: Page for importing and exporting raw data using zip archives.
 * author:      Liam Fruzyna
 * date:        2022-01-19
 */

// read parameters from URL
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

const year = event_id.substr(0,4)
const start = Date.now()

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    // set header
    document.getElementById('header_info').innerHTML = 'Raw Data Zip Transfer'

    document.body.innerHTML += build_page_frame('', [
        build_column_frame('', [
            build_checkbox('event', 'Event Data'), // teams, matches, rankings
            build_checkbox('results', 'Results'), // pits, matches, picklists
            build_checkbox('config', 'Scouting Config'),
            build_checkbox('smart-stats', 'Smart Stats'),
            build_checkbox('coach-vals', 'Coach Values'),
            build_checkbox('settings', 'Settings'),
            build_multi_button('direction', 'Import or Export', ['Import', 'Export'], ['import_zip()', 'export_zip()'])
        ])
    ])
}

/**
 * function:    export_zip
 * paramters:   none
 * returns:     none
 * description: Creates and downloads a zip archive containing all localStorage files.
 */
function export_zip()
{
    let use_event       = document.getElementById('event').checked
    let use_results     = document.getElementById('results').checked
    let use_config      = document.getElementById('config').checked
    let use_smart_stats = document.getElementById('smart-stats').checked
    let use_coach_vals  = document.getElementById('coach-vals').checked
    let use_settings    = document.getElementById('settings').checked
    
    let zip = JSZip()

    // determine which files to use
    let files = Object.keys(localStorage).filter(function(file)
    {
        return ((file.includes(event_id) &&
            ((use_event && (file.startsWith('teams-') || file.startsWith('matches-') || file.startsWith('rankings-'))) ||
            (use_results && (file.startsWith('match-') || file.startsWith('pit-') || file.startsWith('picklists-') || file.startsWith('note-'))))) ||
            (use_config && file.startsWith(`config-${year}-`)) ||
            (use_smart_stats && file == 'config-smart-stats') ||
            (use_coach_vals && file == 'config-coach-vals') ||
            (use_settings && file.startsWith('config-') && !file.startsWith(`config-2`) && file != 'config-smart-stats' && file != 'config-coach-vals'))
    })

    // add each file to the zip
    for (let file of files)
    {
        let name = file
        let base64 = false
        let data = localStorage.getItem(file)
        if (data.startsWith('data:image/png;base64,'))
        {
            name += '.png'
            base64 = true
            data = data.substr(data.indexOf(',') + 1)
        }
        else if (name.startsWith('avatar-'))
        {
            // JSZip doesn't seem to like avatars' base64
            name += '.b64'
            base64 = false
        }
        else 
        {
            name += '.json'
        }
        zip.file(name, data, { base64: base64 })
    }

    // download zip
    zip.generateAsync({ type: 'base64' })
        .then(function(base64)
        {
            let element = document.createElement('a')
            element.setAttribute('href', `data:application/zip;base64,${base64}`)
            element.setAttribute('download', `${user_id}-${event_id}-export.zip`)

            element.style.display = 'none'
            document.body.appendChild(element)

            element.click()

            document.body.removeChild(element)
        })
}

/**
 * function:    import_zip
 * paramters:   none
 * returns:     none
 * description: Creates a file prompt to upload a zip of JSON results.
 */
function import_zip()
{
    var input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/zip'
    input.onchange = import_zip_from_event
    input.click()
}

/**
 * function:    import_zip_from_event
 * paramters:   response containing zip file
 * returns:     none
 * description: Extracts a zip archive containing all JSON results.
 */
function import_zip_from_event(event)
{
    let file = event.target.files[0]

    let overwrite = confirm('Files may overwrite, press ok to continue')
    if (!overwrite)
    {
        return
    }

    // process each files details
    JSZip.loadAsync(file).then(function (zip)
    {
        let files = Object.keys(zip.files)
        for (let name of files)
        {
            let parts = name.split('.')
            let n = parts[0]
            let type = n.split('-')[0]

            // only import JSON files for the current event
            if (parts[1] == 'json')
            {
                // get blob of files text
                zip.file(name).async('blob').then(function (content)
                {
                    content.text().then(function (text) {
                        let use_event       = document.getElementById('event').checked
                        let use_results     = document.getElementById('results').checked
                        let use_config      = document.getElementById('config').checked
                        let use_smart_stats = document.getElementById('smart-stats').checked
                        let use_coach_vals  = document.getElementById('coach-vals').checked
                        let use_settings    = document.getElementById('settings').checked
                    
                        // determine which files to use
                        if ((n.includes(event_id) &&
                            ((use_event && (n.startsWith('teams-') || n.startsWith('matches-') || n.startsWith('rankings-'))) ||
                            (use_results && (n.startsWith('match-') || n.startsWith('pit-') || n.startsWith('picklists-') || n.startsWith('note-'))))) ||
                            (use_config && n.startsWith(`config-${year}-`)) ||
                            (use_smart_stats && n == 'config-smart-stats') ||
                            (use_coach_vals && n == 'config-coach-vals') ||
                            (use_settings && n.startsWith('config-') && !n.startsWith(`config-2`) && n != 'config-smart-stats' && n != 'config-coach-vals'))
                        {
                            console.log(`Importing ${n}`)
                            localStorage.setItem(n, text)
                        }
                    })
                })
            }
        }
    })
}