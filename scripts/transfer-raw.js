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
            build_checkbox('results', 'Results'), // pits, matches
            build_checkbox('config', 'Scouting Config'),
            build_checkbox('smart-stats', 'Smart Stats'),
            build_checkbox('coach-vals', 'Coach Values'),
            build_checkbox('settings', 'Settings'),
            build_checkbox('picklists', 'Pick Lists'),
            build_checkbox('avatars', 'Avatars')
        ]),
        build_column_frame('', [
            build_str_entry('server', 'Server URL', parse_server_addr(document.location.href)),
            build_select('method', 'Local or Server', ['Local', 'Server'], 'Local'),
            build_multi_button('direction', 'Import or Export', ['Import', 'Export'], ['get_zip()', 'export_zip()']),
            '<progress id="progress" class="wr_progress" value="0" max="100"></progress>'
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
    let use_avatars     = document.getElementById('avatars').checked
    let use_picklists   = document.getElementById('picklists').checked
    
    let zip = JSZip()

    // determine which files to use
    let files = Object.keys(localStorage).filter(function(file)
    {
        return (file.includes(event_id) &&
            ((use_event && (file.startsWith('teams-') || file.startsWith('matches-') || file.startsWith('rankings-'))) ||
            (use_results && (file.startsWith('match-') || file.startsWith('pit-') || file.startsWith('note-'))))) ||
            (use_config && file.startsWith(`config-${year}-`)) ||
            (use_smart_stats && file == 'config-smart-stats') ||
            (use_coach_vals && file == 'config-coach-vals') ||
            (use_settings && file.startsWith('config-') && !file.startsWith(`config-2`) && file != 'config-smart-stats' && file != 'config-coach-vals') ||
            (use_avatars && file.startsWith('avatar-')) ||
            (use_picklists && file.startsWith('picklists-'))
    })

    // add each file to the zip
    for (let i in files)
    {
        let file = files[i]
        let name = file + '.json'
        let base64 = false
        let data = localStorage.getItem(file)
        zip.file(name, data, { base64: base64 })

        // update progress bar
        document.getElementById('progress').innerHTML = `${i}/${files.length + 1}`
        document.getElementById('progress').value = i
        document.getElementById('progress').max = files.length + 1   
    }

    // download zip
    zip.generateAsync({ type: 'base64' })
        .then(function(base64)
        {
            if (get_selected_option('method') == 0)
            {
                let element = document.createElement('a')
                element.setAttribute('href', `data:application/zip;base64,${base64}`)
                element.setAttribute('download', `${user_id}-${event_id}-export.zip`)
    
                element.style.display = 'none'
                document.body.appendChild(element)
    
                element.click()
    
                document.body.removeChild(element)
            }
            else // upload
            {
                let addr = document.getElementById('server').value
                if (check_server(addr))
                {                    
                    // post string to server
                    fetch(addr, {method: 'POST', body: base64})
                        .then(response => response.json())
                        .then(result => {
                            if (result.success && result.count == files.length)
                            {
                                alert('Upload successful!')
                            }
                            else
                            {
                                alert('Upload unsuccessful!')
                            }
                        })
                        .catch(e => {
                            alert('Error uploading!')
                            console.error(e)
                        })
                }
            }

            // update progress bar for zip complete
            document.getElementById('progress').innerHTML = `${files.length + 1}/${files.length + 1}`
            document.getElementById('progress').value = files.length + 1
            document.getElementById('progress').max = files.length + 1
        })
}

/**
 * function:    get_zip
 * paramters:   none
 * returns:     none
 * description: Calls the appropriate import zip function based on the selected method.
 */
function get_zip()
{
    if (get_selected_option('method') == 0)
    {
        import_zip_from_file()
    }
    else
    {
        import_zip_from_server()
    }
}

/**
 * function:    import_zip_from_file
 * paramters:   none
 * returns:     none
 * description: Creates a file prompt to upload a zip of JSON results.
 */
function import_zip_from_file()
{
    var input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/zip'
    input.onchange = import_zip_from_event
    input.click()
}

/**
 * function:    import_zip_from_server
 * paramters:   none
 * returns:     none
 * description: Request a zip of JSON results from the server.
 */
function import_zip_from_server()
{
    let addr = document.getElementById('server').value
    if (check_server(addr))
    {
        fetch(`${addr}/getZip`)
            .then(transfer => {
                return transfer.blob();
            })
            .then(bytes => {
                import_zip(bytes)
            })
            .catch(err => {
                alert('Error requesting results')
                console.log(err)
            })
    }
}

/**
 * function:    import_zip_from_event
 * paramters:   response containing zip file
 * returns:     none
 * description: Extracts a zip archive containing all JSON results.
 */
function import_zip_from_event(event)
{
    import_zip(event.target.files[0])
}

/**
 * function:    import_zip
 * paramters:   response containing zip file
 * returns:     none
 * description: Extracts a zip archive containing all JSON results.
 */
function import_zip(file)
{
    let overwrite = confirm('Files may overwrite, press ok to continue')
    if (!overwrite)
    {
        return
    }

    // process each files details
    JSZip.loadAsync(file).then(function (zip)
    {
        let use_event       = document.getElementById('event').checked
        let use_results     = document.getElementById('results').checked
        let use_config      = document.getElementById('config').checked
        let use_smart_stats = document.getElementById('smart-stats').checked
        let use_coach_vals  = document.getElementById('coach-vals').checked
        let use_settings    = document.getElementById('settings').checked
        let use_avatars     = document.getElementById('avatars').checked
        let use_picklists   = document.getElementById('picklists').checked

        let files = Object.keys(zip.files)
        let complete = 0
        for (let name of files)
        {
            let parts = name.split('.')
            let n = parts[0]

            // only import JSON files for the current event
            if (parts[1] == 'json')
            {
                // get blob of files text
                zip.file(name).async('blob').then(function (content)
                {
                    content.text().then(function (text) {
                        // determine which files to use
                        if ((n.includes(event_id) &&
                            ((use_event && (n.startsWith('teams-') || n.startsWith('matches-') || n.startsWith('rankings-'))) ||
                            (use_results && (n.startsWith('match-') || n.startsWith('pit-') || n.startsWith('note-'))))) ||
                            (use_config && n.startsWith(`config-${year}-`)) ||
                            (use_smart_stats && n == 'config-smart-stats') ||
                            (use_coach_vals && n == 'config-coach-vals') ||
                            (use_settings && n.startsWith('config-') && !n.startsWith(`config-2`) && n != 'config-smart-stats' && n != 'config-coach-vals') ||
                            (use_avatars && n.startsWith('avatar-')) ||
                            (use_picklists && n.startsWith('picklists-')))
                        {
                            console.log(`Importing ${n}`)
                            localStorage.setItem(n, text)
                        }
                        
                        // update progress bar
                        document.getElementById('progress').innerHTML = `${++complete}/${files.length}`
                        document.getElementById('progress').value = complete
                        document.getElementById('progress').max = files.length

                        if (complete == files.length)
                        {
                            alert('Import Complete')
                        }
                    })
                })
            }
            else if (++complete == files.length)
            {
                alert('Import Complete')
            }
        }
    })
}