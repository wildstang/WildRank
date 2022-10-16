/**
 * file:        transfer-raw.js
 * description: Page for importing and exporting raw data using zip archives.
 * author:      Liam Fruzyna
 * date:        2022-01-19
 */

const start = Date.now()
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

include('libs/jszip.min')

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
async function init_page()
{
    // set header
    document.getElementById('header_info').innerHTML = 'Raw Data Zip Transfer'

    let page = new PageFrame()
    let check_col = new ColumnFrame()
    page.add_column(check_col)

    check_col.add_input(new Checkbox('event', 'Event Data'))
    check_col.add_input(new Checkbox('config', 'Scouting Configs'))
    check_col.add_input(new Checkbox('results', 'Results'))
    check_col.add_input(new Checkbox('smart-stats', 'Smart Stats'))
    check_col.add_input(new Checkbox('coach', 'Coach Config'))
    check_col.add_input(new Checkbox('picklists', 'Pick Lists'))
    check_col.add_input(new Checkbox('pictures', 'Pictures'))
    check_col.add_input(new Checkbox('settings', 'Settings'))
    check_col.add_input(new Checkbox('whiteboard', 'Whiteboard'))
    check_col.add_input(new Checkbox('avatars', 'Avatars'))

    let option_col = new ColumnFrame()
    page.add_column(option_col)

    let server = new Entry('server', 'Server URL', parse_server_addr(document.location.href))
    option_col.add_input(server)

    let method = new Select('method', 'Local or Server', ['Local', 'Server'], 'Local')
    option_col.add_input(method)

    // get latest cache
    let current = 'default'
    let names = await caches.keys()
    if (names.length > 0)
    {
        current = names[0]
    }
    let cache = await caches.open(current)
    let r = await cache.match('/import')
    if (r)
    {
        option_col.add_input(`<div id="file_name">Cached file available</div>`)
    }
    else
    {
        current = ''
    }

    let direction = new MultiButton('direction', 'Import or Export')
    direction.add_option('Import', `get_zip('${current}')`)
    direction.add_option('Export', 'export_zip()')
    option_col.add_input(direction)

    option_col.add_input('<progress id="progress" class="wr_progress" value="0" max="100"></progress>')

    document.body.innerHTML += page.toString
}

/**
 * function:    export_zip
 * paramters:   none
 * returns:     none
 * description: Creates and downloads a zip archive containing all localStorage files.
 */
async function export_zip()
{
    let use_event       = document.getElementById('event').checked
    let use_results     = document.getElementById('results').checked
    let use_config      = document.getElementById('config').checked
    let use_smart_stats = document.getElementById('smart-stats').checked
    let use_coach       = document.getElementById('coach').checked
    let use_settings    = document.getElementById('settings').checked
    let use_avatars     = document.getElementById('avatars').checked
    let use_picklists   = document.getElementById('picklists').checked
    let use_whiteboard  = document.getElementById('whiteboard').checked
    let use_pictures    = document.getElementById('pictures').checked
    
    let zip = JSZip()

    // determine which files to use
    let files = Object.keys(localStorage).filter(function(file)
    {
        return (file.includes(dal.event_id) &&
            ((use_event && (file.startsWith('teams-') || file.startsWith('matches-') || file.startsWith('rankings-'))) ||
            (use_results && (file.startsWith('match-') || file.startsWith('pit-'))))) ||
            (use_config && (file === `config-${cfg.year}-pit` || file === `config-${cfg.year}-match`)) ||
            (use_smart_stats && file === `config-${cfg.year}-smart_stats`) ||
            (use_coach && file === `config-${cfg.year}-coach`) ||
            (use_settings && file.startsWith('config-') && !file.startsWith(`config-${cfg.year}`)) ||
            (use_avatars && file.startsWith('avatar-')) ||
            (use_picklists && file.startsWith('picklists-')) ||
            (use_whiteboard && file === `config-${cfg.year}-whiteboard`)
    })
    let num_uploads = files.length

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

    // export pictures from cache
    let names = await caches.keys()
    if (names.length > 0 && use_pictures)
    {
        let server = parse_server_addr(document.location.href)
        let cache = await caches.open(names[0])
        let keys = await cache.keys()
        
        // add each file in the cache to the table
        for (let key of keys)
        {
            // add up all bytes in file
            let response = await cache.match(key)

            // create row
            let file = response.url
            if (file === '')
            {
                file = key.url
            }
            
            // check for pictures and don't put in directory if belonging to server (like server does)
            if ((file.endsWith('.jpg') || file.endsWith('.png')) && !file.startsWith(`${server}/assets/`))
            {
                if (file.startsWith(`${server}/uploads/`))
                {
                    file = file.replace(`${server}/uploads/`, '')
                }
                zip.file(file, response.blob())
                num_uploads++
            }
        }
    }

    // download zip
    zip.generateAsync({ type: 'blob' })
        .then(function(blob)
        {
            if (Select.get_selected_option('method') == 0)
            {
                let element = document.createElement('a')
                element.href = window.URL.createObjectURL(blob)
                element.download = `${user_id}-${dal.event_id}-export.zip`
    
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
                    let formData = new FormData()
                    formData.append('import', blob)
                    fetch(`${addr}/import`, {method: 'POST', body: formData})
                        .then(response => response.json())
                        .then(result => {
                            if (result.success && result.count === num_uploads)
                            {
                                alert('Upload successful!')
                            }
                            else if (result.count === -1)
                            {
                                alert('Incorrect password!')
                            }
                            else if (result.count === -2)
                            {
                                alert('Failed to extract archive!')
                            }
                            else
                            {
                                alert('Unknown server error!')
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
 * paramters:   optional cache name
 * returns:     none
 * description: Calls the appropriate import zip function based on the selected method.
 */
function get_zip(cache_name='')
{
    if (Select.get_selected_option('method') == 0)
    {
        if (cache_name !== '')
        {
            import_zip_from_cache(cache_name)
        }
        else
        {
            import_zip_from_file()
        }
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
 * function:    import_zip_from_cache
 * paramters:   cache name
 * returns:     none
 * description: Import a zip stored in CacheStorage.
 */
async function import_zip_from_cache(cache_name)
{
    let cache = await caches.open(cache_name)
    let r = await cache.match('/import')
    if (r)
    {
        import_zip(r.blob())
        cache.delete(r)
    }
    else
    {
        alert('No cached file available!')
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
async function import_zip(file)
{
    // process each files details
    JSZip.loadAsync(file).then(function (zip)
    {
        let use_event       = document.getElementById('event').checked
        let use_results     = document.getElementById('results').checked
        let use_config      = document.getElementById('config').checked
        let use_smart_stats = document.getElementById('smart-stats').checked
        let use_coach       = document.getElementById('coach').checked
        let use_settings    = document.getElementById('settings').checked
        let use_avatars     = document.getElementById('avatars').checked
        let use_picklists   = document.getElementById('picklists').checked
        let use_whiteboard  = document.getElementById('whiteboard').checked
        let use_pictures    = document.getElementById('pictures').checked

        let server = parse_server_addr(document.location.href) + '/uploads/'

        let files = Object.keys(zip.files)
        let complete = 0
        for (let name of files)
        {
            let parts = name.split('.')
            let n = parts[0]

            // skip directories
            if (name.endsWith('/'))
            {
                // update progress bar
                document.getElementById('progress').innerHTML = `${++complete}/${files.length}`
                document.getElementById('progress').value = complete
                document.getElementById('progress').max = files.length

                if (complete === files.length)
                {
                    alert('Import Complete')
                }
                continue
            }

            // get blob of file
            zip.file(name).async('blob').then(function (content)
            {
                // import pictures to cache
                if (name.endsWith('.jpg') || name.endsWith('.png'))
                {
                    if (use_pictures)
                    {
                        // adjust url
                        let url = name.replace('https:/', 'https://').replace('http:/', 'http://')
                        if (!url.startsWith('http'))
                        {
                            url = server + url
                            let team = url.substring(url.lastIndexOf('/')+1, url.lastIndexOf('-'))
                            dal.add_photo(team, url)
                        }

                        cache_file(url, content)
                    }
                    
                    // update progress bar
                    document.getElementById('progress').innerHTML = `${++complete}/${files.length}`
                    document.getElementById('progress').value = complete
                    document.getElementById('progress').max = files.length

                    if (complete === files.length)
                    {
                        alert('Import Complete')
                    }
                }
                else if (name.endsWith('.json'))
                {
                    // import everything else as strings to localStorage
                    content.text().then(function (text) {
                        // determine which files to use
                        if ((n.includes(dal.event_id) &&
                            ((use_event && (n.startsWith('teams-') || n.startsWith('matches-') || n.startsWith('rankings-'))) ||
                            (use_results && (n.startsWith('match-') || n.startsWith('pit-'))))) ||
                            (use_config && (n === `config-${cfg.year}-pit` || n === `config-${cfg.year}-match`)) ||
                            (use_smart_stats && n === `config-${cfg.year}-smart_stats`) ||
                            (use_coach && n === `config-${cfg.year}-coach`) ||
                            (use_settings && n.startsWith('config-') && !n.startsWith(`config-${cfg.year}`)) ||
                            (use_avatars && n.startsWith('avatar-')) ||
                            (use_picklists && n.startsWith('picklists-')) ||
                            (use_whiteboard && n === `config-${cfg.year}-whiteboard`))
                        {
                            let write = true
                            let existing = localStorage.getItem(n)
                            if (existing !== null)
                            {
                                if (existing !== text && !n.startsWith('avatar-'))
                                {
                                    write = confirm(`"${n}" already exists, overwrite?`)
                                }
                                else
                                {
                                    write = false
                                }
                            }
                            if (write)
                            {
                                console.log(`Importing ${n}`)
                                localStorage.setItem(n, text)
                            }
                        }
                        
                        // update progress bar
                        document.getElementById('progress').innerHTML = `${++complete}/${files.length}`
                        document.getElementById('progress').value = complete
                        document.getElementById('progress').max = files.length

                        if (complete === files.length)
                        {
                            alert('Import Complete')
                        }
                    })
                }
                else
                {
                    // update progress bar
                    document.getElementById('progress').innerHTML = `${++complete}/${files.length}`
                    document.getElementById('progress').value = complete
                    document.getElementById('progress').max = files.length

                    if (complete === files.length)
                    {
                        alert('Import Complete')
                    }
                }
            })
        }
    })
}