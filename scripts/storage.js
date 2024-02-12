/**
 * file:        storage.js
 * description: Page for managing the application's storage
 * author:      Liam Fruzyna
 * date:        2023-03-22
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
    header_info.innerHTML = 'Storage Manager'

    populate_page()
}

/**
 * function:    populate_page
 * parameters:  none
 * returns:     none
 * description: Populates the page with localStorage info and buttons.
 */
function populate_page()
{
    let button_col = new ColumnFrame()
    button_col.add_input(new Button('transfer', 'Transfer Data', 'cache_pics()'))

    let keys = Object.keys(localStorage).sort()

    let table = document.createElement('table')
    let header = table.insertRow()

    let file_header = document.createElement('th')
    file_header.innerText = 'File'
    header.appendChild(file_header)

    header.insertCell().innerHTML = `${keys.length} files`

    let cache_str = ''
    
    // add each file in the cache to the table
    for (let key of keys)
    {
        let val = localStorage.getItem(key)

        // create row
        let row = table.insertRow()
        row.insertCell().innerText = key
        row.insertCell().innerText = format_bytes(val.length)
        row.insertCell().innerText = hash(val)

        let del = document.createElement('a')
        del.onclick = () => delete_file(key)
        del.innerText = 'delete'
        row.insertCell().appendChild(del)

        cache_str += val
    }
    header.insertCell().innerText = hash(cache_str)

    let card = new Card('table', table)
    let page = new PageFrame('', '', [new ColumnFrame('', '', [card]), button_col])
    body.replaceChildren(page.element)
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
 * function:    delete_file
 * parameters:  file name
 * returns:     none
 * description: Deletes a given file from localStorage.
 */
function delete_file(file_name)
{
    localStorage.removeItem(file_name)
    populate_page()
}