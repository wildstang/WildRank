/**
 * file:        cache.js
 * description: Page for managing the application's cache
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
    header_info.innerHTML = 'Cache Manager'

    if (typeof caches !== 'undefined')
    {
        populate_page()
    }
    else
    {
        alert('Caches not available via this connection. (Must be encrypted or localhost)')
    }
}

/**
 * function:    populate_page
 * parameters:  none
 * returns:     none
 * description: Populates the page with cache info and buttond.
 */
async function populate_page()
{
    let server = parse_server_addr(document.location.href)

    let button_col = new ColumnFrame()
    button_col.add_input(new Button('cache_pics', 'Cache Pictures', 'cache_pics()'))
    button_col.add_input(new Button('import_app', 'Update App from Zip', 'import_from_zip()'))

    // make a table for each cache
    let names = await caches.keys()
    if (names.length > 0)
    {
        current = names[0]
    }
    else
    {
        let card = new Card('table', 'No caches found')
        let page = new PageFrame('', '', [new ColumnFrame('', '', [card]), button_col])
        body.replaceChildren(page.element)
    }

    for (let name of names)
    {
        let cache = await caches.open(name)
        let keys = await cache.keys()

        let table = document.createElement('table')
        let header = table.insertRow()
    
        let name_header = document.createElement('th')
        name_header.innerText = name
        header.appendChild(name_header)
    
        header.insertCell().innerHTML = `${keys.length} files`

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
            let row = table.insertRow()
            row.insertCell().innerText = file
            row.insertCell().innerText = format_bytes(bytes)
            row.insertCell().innerText = hash(str)
    
            let del = document.createElement('a')
            del.onclick = () => delete_file(name, file)
            del.innerText = 'delete'
            row.insertCell().appendChild(del)

            cache_str += str
        }
        header.insertCell().innerText = hash(cache_str)

        let card = new Card('table', table)
        let page = new PageFrame('', '', [new ColumnFrame('', '', [card]), button_col])
        body.replaceChildren(page.element)

        button_col.add_input(new Button(`purge_${name}`, `Purge ${name}`, `purge_cache('${name}')`))
    }
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
 * function:    delete_file
 * parameters:  cache name, file name
 * returns:     none
 * description: Deletes a given file from the cache.
 */
async function delete_file(cache_name, file_name)
{
    let c = await caches.open(cache_name)
    let server = parse_server_addr(document.location.href)
    c.delete(new URL(`${server}${file_name}`))
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

    // process each files details
    JSZip.loadAsync(file).then(function (zip)
    {
        let files = Object.keys(zip.files)
        let count = 0
        for (let name of files)
        {
            let parts = name.split('.')

            // only import files
            if (parts.length > 1 && !name.includes('docker/') && !name.includes('docs/') && !name.includes('python/') && !name.includes('uploads/') && !name.endsWith('/'))
            {
                // virtually move files which aren't stored in the same path
                let path = name 
                if (name.includes('markup/'))
                {
                    path = name.replace('markup/', '')
                }
                else if (name.includes('manifest.webmanifest'))
                {
                    path = name.replace('config/', '')
                }
                else if (name.includes('pwa.js'))
                {
                    path = name.replace('scripts/', '')
                }
                else if (name.includes('favicon.ico'))
                {
                    path = name.replace('assets/icons/', '')
                }

                // get blob of files text
                zip.file(name).async('blob').then(function (content)
                {
                    let url = `${server}/${path}`
                    cache_file(url, content)

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