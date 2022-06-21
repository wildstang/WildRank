/**
 * file:        export.js
 * description: Page transfering data from one server to another.
 *              TODO: textbox and checkboxes like transfer raw
 * author:      Liam Fruzyna
 * date:        2022-06-20
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
    document.getElementById('header_info').innerHTML = 'Server Export'

    let server = parse_server_addr(document.location.href)
    if (!check_server(server))
    {
        server = ''
    }

    let from = new Entry('from_server', 'From Server', server)
    let to = new Entry('to_server', 'To Server')
    let password = new Entry('password', 'Server Password')
    let submit = new Button('submit', 'Export', 'submit()')

    document.body.innerHTML += new PageFrame('', '', [new ColumnFrame('', '', [from, to, password, submit])]).toString
}

/**
 * function:    submit
 * paramters:   none
 * returns:     none
 * description: Triggers a export from one server to another
 */
function submit()
{
    // get fields
    let from = parse_server_addr(document.getElementById('from_server').value)
    let to = parse_server_addr(document.getElementById('to_server').value)
    let password = document.getElementById('password').value

    // check servers
    if (!check_server(from))
    {
        return
    }
    // NOTE: to server cannot be checked because cross site policies

    // make request to from server
    fetch(`${from}/export?to=${to}&password=${password}&event_id=${event_id}`)
        .then(response => response.json())
        .then(result => {
            if (result.success)
            {
                alert('Export successful!')
            }
            else if (result.count === -1)
            {
                alert('Incorrect password!')
            }
            else if (result.count === -2)
            {
                alert('Failed to extract archive!')
            }
            else if (result.count === -3)
            {
                alert('To server not found!')
            }
            else if (result.count > 0)
            {
                alert('Data lost in transfer!')
            }
            else
            {
                alert('Unknown server error!')
            }
        })
        .catch(e => {
            alert('Export request failed!')
            console.error(e)
        })
}