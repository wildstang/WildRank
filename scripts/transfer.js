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

    if (!TBA_KEY)
    {
        let file = localStorage.getItem('config-keys')
        if (file != null)
        {
            let keys = JSON.parse(file)
            if (keys.hasOwnProperty('tba'))
            {
                TBA_KEY = keys.tba
            }
        }
        if (!TBA_KEY)
        {
            alert('No API key found for TBA!')
            return
        }
    }
    
    let count = 0
    // fetch simple event matches
    fetch(`https://www.thebluealliance.com/api/v3/event/${event_id}/matches${build_query({[TBA_AUTH_KEY]: TBA_KEY})}`)
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
                process_files()
                if (++count === 3)
                {
                    alert('Preload complete!')
                    dal.build_teams()
                }
            }
            else
            {
                alert('No matches received!')
            }
        })
        .catch(err => {
            alert('Error loading matches!')
            console.log(err)
        })

    // fetch simple event teams
    fetch(`https://www.thebluealliance.com/api/v3/event/${event_id}/teams/simple${build_query({[TBA_AUTH_KEY]: TBA_KEY})}`)
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
                process_files()

                // fetch team's avatar for whiteboard
                for (let team of teams)
                {
                    let year = get_event().substr(0, 4)
                    fetch(`https://www.thebluealliance.com/api/v3/team/frc${team.team_number}/media/${year}${build_query({[TBA_AUTH_KEY]: TBA_KEY})}`)
                        .then(response => {
                            return response.json()
                        })
                        .then(data => {
                            localStorage.setItem(get_team_avatar_name(team.team_number, year), data[0].details.base64Image)
                        })
                        .catch(err => {
                        })
                }
                if (++count === 3)
                {
                    alert('Preload complete!')
                    dal.build_teams()
                }
            }
            else
            {
                alert('No teams received!')
            }
        })
        .catch(err => {
            alert('Error loading teams!')
            console.log(err)
        })

    // fetch event rankings
    fetch(`https://www.thebluealliance.com/api/v3/event/${event_id}/rankings${build_query({[TBA_AUTH_KEY]: TBA_KEY})}`)
        .then(response => {
            return response.json()
        })
        .then(data => {
            if (data && data.hasOwnProperty('rankings') && data.rankings.length > 0)
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
            }
            if (++count === 3)
            {
                alert('Preload complete!')
                dal.build_teams()
            }
        })
        .catch(err => {
            alert('Error loading rankings!')
            console.log(err)
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
        // clear storage
        localStorage.clear()

        // clear cookies
        let cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++)
        {
            let cookie = cookies[i];
            let eqPos = cookie.indexOf('=');
            let name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }

        // clear offline pages
        caches.keys().then(keyList => {
            let ret = Promise.all(keyList.map(key => {
                return caches.delete(key)
            }))
            location.reload()
            return ret
        })
    }
}

/**
 * function:    reset_storage
 * parameters:  none
 * returns:     none
 * description: Reset local storage.
 */
function reset_storage()
{
    if (confirm('Delete all configuration and results?'))
    {
        // clear storage
        localStorage.clear()
    }
}

/**
 * function:    reset_results
 * parameters:  none
 * returns:     none
 * description: Reset results in local storage.
 */
function reset_results()
{
    if (confirm('Delete all results?'))
    {
        // remove all match and pit results
        let files = Object.keys(localStorage).filter(f => f.startsWith(`match-`) || f.startsWith(`pit-`))
        for (let file of files)
        {
            localStorage.removeItem(file)
        }
    }
}

/**
 * function:    clear_events
 * parameters:  none
 * returns:     none
 * description: Clear other events from local storage.
 */
function clear_events()
{
    if (confirm('Delete all configuration and results for other events?'))
    {
        // remove all files containing uother event ids
        let event_id = get_event()
        let files = Object.keys(localStorage).filter(f => !f.includes(event_id))
        for (let file of files)
        {
            localStorage.removeItem(file)
        }
    }
}

/**
 * HELPER FUNCTIONS
 */

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
    let files = Object.keys(localStorage)
    for (let name of files)
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
                let results = Object.keys(resultJSON)
                for (let key of results)
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
                }
                combined[name] = result
            }
        }
    }

    // build csv
    let lines = [keys.join()]
    let results = Object.keys(combined)
    for (let name of results)
    {
        let obj_keys = Object.keys(combined[name])
        let values = []
        for (let key of keys)
        {
            if (obj_keys.includes(key))
            {
                let val = combined[name][key]
                if (typeof val === 'string')
                {
                    values.push(`"${val}"`)
                }
                else
                {
                    values.push(val)
                }
            }
            else
            {
                values.push(NaN)
            }
        }
        lines.push(values.join())
    }
    return lines.join('\n').replace(/,NaN/g, ',')
}