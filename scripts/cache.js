/**
 * file:        cache.js
 * description: Page for managing the applications cache
 * author:      Liam Fruzyna
 * date:        2022-06-28
 */


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

    // make a table for each cache
    let text = ''
    let names = await caches.keys()
    for (let name of names)
    {
        let cache = await caches.open(name)
        let keys = await cache.keys()
        let table = `<table><tr><th>${name}</th><td>${keys.length} files</td></tr>`
        
        // add each file in the cache to the table
        for (let key of keys)
        {
            // add up all bytes in file
            let request = await cache.match(key)
            let reader = request.body.getReader()
            let full = false
            let bytes = 0
            while (!full)
            {
                await reader.read().then(({done, value}) =>
                {
                    if (!done)
                    {
                        bytes += value.length
                    }
                    else
                    {
                        full = true
                    }
                })
            }

            // create row
            let file = request.url
            if (file.startsWith(server))
            {
                file = file.replace(server, '')
            }
            table += `<tr><td>${file}</td><td>${format_bytes(bytes)}</td></tr>`
        }
        text += table + '</table>'
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