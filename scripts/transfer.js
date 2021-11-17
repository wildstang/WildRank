/**
 * file:        transfer.js
 * description: Contains data management functions for the index of the web app.
 * author:      Liam Fruzyna
 * date:        2021-05-24
 */

/**
 * BUTTON RESPONSES
 */

/**
 * function:    preload_event
 * parameters:  none
 * returns:     none
 * description: Fetch simple event matches and team from TBA.
 *              Store results in localStorage.
 */
function preload_event()
{
    // get event id from the text box
    let event_id = get_event()
    status('Requesting event data...')

    if (!API_KEY)
    {
        alert('No API key found for TBA!')
        status('No API key found for TBA!')
    }
    else
    {
        // fetch simple event matches
        fetch(`https://www.thebluealliance.com/api/v3/event/${event_id}/matches/simple${build_query({[TBA_KEY]: API_KEY})}`)
            .then(response => {
                if (response.status == 401) {
                    alert('Invalid API Key Suspected')
                }
                return response.json()
            })
            .then(data => {
                if (data.length > 0)
                {
                    // sort match objs by match number
                    let matches = data.sort(function (a, b)
                    {
                        return b.match_number < a.match_number ? 1
                                : b.match_number > a.match_number ? -1
                                : 0
                    })

                    // store matches as JSON string in matches-[event-id]
                    localStorage.setItem(get_event_matches_name(event_id), JSON.stringify(matches))
                    status(`${data.length} matches received`)

                    hide_buttons()
                }
                else
                {
                    status('No matches received!')
                }
            })
            .catch(err => {
                status('Error loading matches!')
                console.log(err)
            })

        // fetch simple event teams
        fetch(`https://www.thebluealliance.com/api/v3/event/${event_id}/teams/simple${build_query({[TBA_KEY]: API_KEY})}`)
            .then(response => {
                return response.json()
            })
            .then(data => {
                if (data.length > 0)
                {
                    // sort team objs by team number
                    let teams = data.sort(function (a, b)
                    {
                        return b.team_number < a.team_number ? 1
                            : b.team_number > a.team_number ? -1
                                : 0;
                    })
                    // store teams as JSON string in teams-[event_id]
                    localStorage.setItem(get_event_teams_name(event_id), JSON.stringify(teams))
                    status(`${data.length} teams received`)
                    hide_buttons()

                    // fetch team's avatar for whiteboard
                    var avatars = 0
                    var success = 0
                    teams.forEach(function (team, index)
                    {
                        let year = get_event().substr(0, 4)
                        fetch(`https://www.thebluealliance.com/api/v3/team/frc${team.team_number}/media/${year}${build_query({[TBA_KEY]: API_KEY})}`)
                            .then(response => {
                                return response.json()
                            })
                            .then(data => {
                                localStorage.setItem(get_team_avatar_name(team.team_number, year), data[0].details.base64Image)
                                ++avatars
                                ++success
                                if (avatars == teams.length)
                                {
                                    status(`${success} avatars received`)
                                }
                            })
                            .catch(err =>
                                {
                                console.log(`Error loading avatar: ${err}!`)
                                ++avatars
                                if (avatars == teams.length)
                                {
                                    status(`${success} avatars received`)
                                }
                            })
                    })
                }
                else
                {
                    status('No teams received!')
                }
            })
            .catch(err => {
                status('Error loading teams!')
                console.log(err)
            })

        // fetch simple event teams
        fetch(`https://www.thebluealliance.com/api/v3/event/${event_id}/rankings${build_query({[TBA_KEY]: API_KEY})}`)
            .then(response => {
                return response.json()
            })
            .then(data => {
                if (data.hasOwnProperty('rankings'))
                {
                    data = data.rankings

                    // sort rankings objs by team number
                    let rankings = data.sort(function (a, b)
                    {
                        return b.rank < a.rank ? 1
                                : b.rank > a.rank ? -1
                                : 0;
                    })
                    // store rankings as JSON string in rankings-[event_id]
                    localStorage.setItem(get_event_rankings_name(event_id), JSON.stringify(rankings))
                    status(`${data.length} rankings received`)
                    hide_buttons()
                }
                else
                {
                    status('No rankings received!')
                }
            })
            .catch(err => {
                status('Error loading rankings!')
                console.log(err)
            })
    }
}

/**
 * function:    upload_all
 * parameters:  none
 * returns:     none
 * description: Uploads all files of the currently selected type via POST to the listed server.
 */
async function upload_all()
{
    let addr = get_upload_addr()
    if (check_server(addr))
    {
        let type = get_selected_type()
        status(`Uploading ${type} results...`)
        // get all files in localStorage
        for (let file of Object.keys(localStorage))
        {
            // determine files which start with the desired type
            if (file.startsWith(`${type}-`) || (type == 'pit' && file.startsWith(`image-${get_event()}-`)))
            {
                // TODO don't overwrite higher resolution images
                let content = localStorage.getItem(file)
                // append file name to data, separated by '|||'
                upload = `${file}|||${content}`
                status(` ${file}`, newLine = false)
                // post string to server
                fetch(addr, {method: 'POST', body: upload})

                // give the server some breathing room
                await new Promise(r => setTimeout(r, 5));
            }
        }
        status('') // add newline at end
    }
}

/**
 * function:    import_all
 * parameters:  none
 * returns:     none
 * description: Import results from the local /uploads file to localStorage.
 */
function import_all()
{
    if (check_server(document.location.href))
    {
        // determine appropriate request for selected mode
        let request = ''
        switch (get_selected_type())
        {
            case MATCH_MODE:
                request = 'getMatchResultNames'
                break
            case PIT_MODE:
                request = 'getPitResultNames'
                break
            case NOTE_MODE:
                request = 'getNoteNames'
                break
        }

        // request list of available results
        status('Requesting local result data...')
        fetch(request)
            .then(response => {
                return response.text()
            })
            .then(data => {
                // get requested results for current event
                console.log(data)
                let results = data.split(',').filter(function (r) {
                    return r.includes(get_event()) && localStorage.getItem(r.replace('.json', '')) === null
                })
                console.log(results)
                status(`${results.length} ${get_selected_type()} results found`)

                // request each desired result
                results.forEach(function (file, index)
                {
                    fetch(`${get_upload_addr()}/uploads/${file}`)
                        .then(response => {
                            return response.json()
                        })
                        .then(data => {
                            // save file
                            localStorage.setItem(file.replace('.json', ''), JSON.stringify(data))
                            status(`Got ${file}`)
                            hide_buttons()
                        })
                        .catch(err => {
                            status('Error requesting result')
                            console.log(err)
                        })
                })
            })
            .catch(err => {
                status('Error requesting results')
                console.log(err)
            })
    }
}

/**
 * function:    export_zip
 * paramters:   none
 * returns:     none
 * description: Creates and downloads a zip archive containing all localStorage files.
 */
function export_zip()
{
    let zip = JSZip()

    // determine which files to use
    let files = Object.keys(localStorage).filter(function(file)
    {
        if (!file.startsWith('avatar-') && file.includes(get_event()))
        {
            return true
        }
        return false
    })

    // add each file to the zip
    files.forEach(function(file)
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
    })

    // download zip
    zip.generateAsync({ type: 'base64' })
        .then(function(base64)
        {
            let event = get_event()
            let element = document.createElement('a')
            element.setAttribute('href', `data:application/zip;base64,${base64}`)
            element.setAttribute('download', `${get_user()}-${event}-export.zip`)

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
 * description: Extracts a zip archive containing all JSON results.
 */
function import_zip(event)
{
    let file = event.target.files[0]

    // process each files details
    JSZip.loadAsync(file).then(function (zip) {
        Object.keys(zip.files).forEach(function (name) {
            let parts = name.split('.')
            let n = parts[0]
            let type = n.split('-')[0]

            // only import JSON files for the current event
            if (parts[1] == 'json' && n.includes(get_event()))
            {
                // get blob of files text
                zip.file(name).async('blob').then(function (content) {
                    content.text().then(function (text) {
                        // save to localStorage if result or event data is missing
                        if ((type == MATCH_MODE || type == PIT_MODE || type == NOTE_MODE || type == 'picklists') ||
                            (!has_event() && (type == 'rankings' || type == 'matches' || type == 'teams')))
                        {
                            localStorage.setItem(n, text)
                        }
                        hide_buttons()
                    })
                })
            }
        })
    })
}

/**
 * function:    download_csv
 * parameters:  none
 * returns:     none
 * description: Export results to a CSV file and download.
 */
function download_csv()
{
    let event = get_event()
    let element = document.createElement('a')
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(export_spreadsheet(event)))
    element.setAttribute('download', `${get_user()}-${event}-export.csv`)

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    document.body.removeChild(element)
}

/**
 * function:    reset
 * parameters:  none
 * returns:     none
 * description: Reset local storage.
 */
function reset()
{
    if (confirm('Delete all configuration, results, and other app data?'))
    {
        localStorage.clear()
        fetch_config(function() { location.reload() }, true)
    }
}

/**
 * HELPER FUNCTIONS
 */

/**
 * function:    import_zip
 * paramters:   none
 * returns:     none
 * description: Creates a file prompt to upload a zip of JSON results.
 */
function prompt_zip()
{
    var input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/zip'
    input.onchange = import_zip
    input.click()
}

/**
 * function:    export_spreadsheet
 * parameters:  event id
 * returns:     CSV string
 * description: Exports all results to a CSV file, which can be turned into a complex spreadsheet with a corresponding Python script.
 */
function export_spreadsheet(event_id)
{
    let combined = {}
    let keys = ['name', 'event', 'kind', 'match', 'team']
    Object.keys(localStorage).forEach(function (name, index)
    {
        let parts = name.split('-')
        let kind = parts[0]
        let event = parts[1]
        if (event == event_id)
        {
            let cont = true
            let result = {'name': name, 'event': event, 'kind': kind}
            // confirm valid result type
            switch (kind)
            {
                case MATCH_MODE:
                case NOTE_MODE:
                    result['match'] = parts[2]
                    result['team'] = parts[3]
                    break
                case PIT_MODE:
                    result['team'] = parts[2]
                    break
                default:
                    cont = false
                    break
            }

            if (cont)
            {
                // add object to combined
                let resultJSON = JSON.parse(localStorage.getItem(name))
                Object.keys(resultJSON).forEach(function (key, index)
                {
                    let val = resultJSON[key]
                    // look for cycles (arrays of objects)
                    if (typeof val === 'object' && Array.isArray(val))
                    {
                        for (let i in val)
                        {
                            let v = val[i]
                            if (typeof v === 'object')
                            {
                                for (let j in v)
                                {
                                    // add each cycle-value as its own column
                                    let k = `${key}-${j}-${i}`
                                    if (!keys.includes(k))
                                    {
                                        keys.push(k)
                                    }
                                    result[k] = v[j]
                                }
                            }
                        }
                    }
                    else
                    {
                        if (!keys.includes(key))
                        {
                            keys.push(key)
                        }
                        result[key] = val
                    }
                })
                console.log(result)
                combined[name] = result
            }
        }
    })

    // build csv
    var lines = [keys.join()]
    Object.keys(combined).forEach(function (name, index)
    {
        let obj_keys = Object.keys(combined[name])
        let values = []
        keys.forEach(function (key, index)
        {
            if (obj_keys.includes(key))
            {
                values.push(combined[name][key])
            }
            else
            {
                values.push(NaN)
            }
        })
        lines.push(values.join())
    })
    return lines.join('\n').replace(/,NaN/g, ',')
}

/**
 * function:    check_server
 * parameters:  Server address, whether to notify on error
 * returns:     If the server is the custom Python web server.
 * description: Determines if the server is the custom Python web server, if it is not alerts the user.
 */
function check_server(server, notify=true)
{
    try
    {
        // send request to /about
        let check_addr = `${parse_server_addr(server)}/about`
        var req = new XMLHttpRequest()
        req.open('GET', check_addr, false)
        req.send(null)

        // confirm Python server
        if (req.responseText.includes('POST server'))
        {
            return true
        }
        else
        {
            console.log('Feature is only supported on Python server.')
            if (notify)
            {
                alert('This server does not support this feature!')
            }
            return false
        }
    }
    catch (e)
    {
        console.log('Unable to communicate with this server.')
        if (notify)
        {
            alert('Unable to find a compatible server!')
        }
        return false
    }
}