/**
 * file:        cache.js
 * description: Page for managing the applications cache
 * author:      Liam Fruzyna
 * date:        2022-06-28
 */

include('libs/jszip.min')

let current = 'default'

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    // set header
    document.getElementById('header_info').innerHTML = 'Cache Manager' 
    document.body.innerHTML += `<div id="body"></div>`

    populate_page()
}

/**
 * function:    populate_page
 * parameters:  none
 * returns:     none
 * description: Populates the page with cache info and button.
 */
async function populate_page()
{
    let server = parse_server_addr(document.location.href)

    let button_col = new ColumnFrame()
    button_col.add_input(new Button('cache_pics', 'Cache Pictures', 'cache_pics()'))
    button_col.add_input(new Button('import_app', 'Update App from Zip', 'import_from_zip()'))

    // make a table for each cache
    let text = ''
    let names = await caches.keys()
    if (names.length > 0)
    {
        current = names[0]
    }
    for (let name of names)
    {
        let cache = await caches.open(name)
        let keys = await cache.keys()
        let table = `<table><tr><th>${name}</th><td>${keys.length} files</td><td>CACHE_HASH</td></tr>`
        let cache_str = ''
        
        // add each file in the cache to the table
        for (let key of keys)
        {
            // add up all bytes in file
            let response = await cache.match(key)
            let reader = response.body.getReader()
            let full = false
            let bytes = 0
            let str = ''
            while (!full)
            {
                await reader.read().then(({done, value}) =>
                {
                    if (!done)
                    {
                        bytes += value.length
                        for (let c of value)
                        {
                            str += String.fromCharCode(c)
                        }
                    }
                    else
                    {
                        full = true
                    }
                })
            }

            // create row
            let file = response.url
            if (file === '')
            {
                file = key.url
            }
            if (file.startsWith(server))
            {
                file = file.replace(server, '')
            }
            table += `<tr><td>${file}</td><td>${format_bytes(bytes)}</td><td>${hash(str)}</td></tr>`
            cache_str += str
        }
        text += table.replace('CACHE_HASH', hash(cache_str)) + '</table>'
        button_col.add_input(new Button(`purge_${name}`, `Purge ${name}`, `purge_cache('${name}')`))
    }

    if (text === '')
    {
        text = 'No caches found'
    }

    let card = new Card('', text)
    document.getElementById('body').innerHTML = new PageFrame('', '', [new ColumnFrame('', '', [card]), button_col]).toString
}

/**
 * function:    format_bytes
 * parameters:  length of an array of bytes
 * returns:     none
 * description: Formats a number of bytes nicely.
 */
function format_bytes(length)
{
    if (length > 1024)
    {
        length = length / 1024
        if (length > 1024)
        {
            length = length / 1024
            return `${length.toFixed(1)} MiB`
        }
        return `${length.toFixed(1)} KiB`
    }
    return `${length} B`
}

/**
 * function:    purge_cache
 * parameters:  cache name
 * returns:     none
 * description: Deletes a given cache and rebuilds the page.
 */
function purge_cache(name)
{
    caches.delete(name)
    populate_page()
}

/**
 * function:    import_from_zip
 * paramters:   none
 * returns:     none
 * description: Creates a file prompt to upload a zip of JSON results.
 */
function import_from_zip()
{
    var input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/zip'
    input.onchange = import_zip
    input.click()
}

/**
 * function:    cache_pics
 * paramters:   none
 * returns:     none
 * description: Caches all known robot pictures.
 */
async function cache_pics()
{
    let cache = await caches.open(current)
    let teams = Object.keys(dal.teams)
    let count = 0
    let total = 0
    for (let team of teams)
    {
        let photos = dal.teams[team].pictures.photos
        total += photos.length
        for (let pic of photos)
        {
            fetch(pic).then(function (res)
            {
                if (++count === total)
                {
                    alert('Pictures Cached!')
                }
                if (!res.ok)
                {
                    return
                }
                return cache.put(pic, res)
            })
        }
    }
}

/**
 * function:    import_zip
 * paramters:   response containing zip file
 * returns:     none
 * description: Extracts a zip archive containing all JSON results.
 */
async function import_zip(event)
{
    let file = event.target.files[0]

    let overwrite = confirm('Files may overwrite, press ok to continue')
    if (!overwrite)
    {
        return
    }

    let server = parse_server_addr(document.location.href)
    let cache = await caches.open(current)

    // process each files details
    JSZip.loadAsync(file).then(function (zip)
    {
        let files = Object.keys(zip.files)
        let count = 0
        for (let name of files)
        {
            let parts = name.split('.')
            let ext = parts[parts.length-1]

            // only import files
            if (parts.length > 1 && !name.includes('docker/') && !name.includes('docs/') && !name.includes('python/') && !name.includes('uploads/') && !name.endsWith('/'))
            {
                // get blob of files text
                zip.file(name).async('blob').then(function (content)
                {
                    // TODO override res.url and res.type
                    // set content type by file extension
                    let headers = new Headers()
                    switch (ext)
                    {
                        case 'js':
                            headers.append('Content-Type', 'application/javascript')
                            break
                        case 'html':
                            headers.append('Content-Type', 'text/html; charset=utf-8')
                            break
                        case 'css':
                            headers.append('Content-Type', 'text/css; charset=utf-8')
                            break
                        case 'ico':
                            headers.append('Content-Type', 'image/x-icon')
                            break
                        case 'png':
                            headers.append('Content-Type', 'image/png')
                            break
                        case 'jpg':
                            headers.append('Content-Type', 'image/jpeg')
                            break
                        case 'svg':
                            headers.append('Content-Type', 'image/svg+xml')
                            break
                        case 'json':
                            headers.append('Content-Type', 'application/json')
                            break
                        case 'webmanifest':
                            headers.append('Content-Type', 'application/manifest')
                            break
                        default:
                            if (++count === files.length)
                            {
                                alert('Cache Updated!')
                                populate_page()
                            }
                            return
                    }
                    headers.append('Content-Length', content.size)

                    let res = new Response(content, { statusText: 'OK', headers: headers })
                    cache.put(new URL(`${server}${name.substring(name.indexOf('/'))}`), res)

                    if (++count === files.length)
                    {
                        alert('Cache Updated!')
                        populate_page()
                    }
                })
            }
            else if (++count === files.length)
            {
                alert('Cache Updated!')
                populate_page()
            }
        }
    })
}