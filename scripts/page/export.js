/**
 * file:        export.js
 * description: Page transfering data from one server to another.
 * author:      Liam Fruzyna
 * date:        2022-06-20
 */

var event_cb, config_cb, results_cb, smart_stats_cb, coach_cb, picklists_cb, pictures_cb, settings_cb, whiteboard_cb, avatars_cb
var from_entry, to_entry, password_entry

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    // set header
    header_info.innerHTML = 'Server Export'

    let server = parse_server_addr(document.location.href)
    if (!check_server(server))
    {
        server = ''
    }

    // add column of checkboxes
    let check_col = new WRColumn()
    event_cb = new WRCheckbox('Event Data')
    check_col.add_input(event_cb)
    config_cb = new WRCheckbox('Scouting Configs')
    check_col.add_input(config_cb)
    results_cb = new WRCheckbox('Results')
    check_col.add_input(results_cb)
    smart_stats_cb = new WRCheckbox('Smart Stats')
    check_col.add_input(smart_stats_cb)
    coach_cb = new WRCheckbox('Coach Config')
    check_col.add_input(coach_cb)
    picklists_cb = new WRCheckbox('Pick Lists')
    check_col.add_input(picklists_cb)
    pictures_cb = new WRCheckbox('Pictures')
    check_col.add_input(pictures_cb)
    settings_cb = new WRCheckbox('Settings')
    check_col.add_input(settings_cb)
    whiteboard_cb = new WRCheckbox('Whiteboard')
    check_col.add_input(whiteboard_cb)
    avatars_cb = new WRCheckbox('Avatars')
    check_col.add_input(avatars_cb)

    from_entry = new WREntry('From Server', server)
    to_entry = new WREntry('To Server')
    password_entry = new WREntry('Server Password')
    let submit_button = new WRButton('Export', submit)

    let page = new WRPage('', [check_col, new WRColumn('', [from_entry, to_entry, password_entry, submit_button])])
    body.replaceChildren(page)
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
    let from = parse_server_addr(from_entry.element.value)
    let to = parse_server_addr(to_entry.element.value)
    let password = password_entry.element.value

    let use_event       = event_cb.checked
    let use_results     = results_cb.checked
    let use_config      = config_cb.checked
    let use_smart_stats = smart_stats_cb.checked
    let use_coach       = coach_cb.checked
    let use_settings    = settings_cb.checked
    let use_avatars     = avatars_cb.checked
    let use_picklists   = picklists_cb.checked
    let use_whiteboard  = whiteboard_cb.checked
    let use_pictures    = pictures_cb.checked

    // check servers
    if (!check_server(from))
    {
        return
    }
    // NOTE: to server cannot be checked because cross site policies

    // make request to from server
    fetch(`${from}/export?to=${to}&password=${password}&event_id=${event_id}&event_data=${use_event}&results=${use_results}&scout_configs=${use_config}&smart_stats=${use_smart_stats}&coach_config=${use_coach}&settings=${use_settings}&picklists=${use_picklists}&whiteboard=${use_whiteboard}&avatars=${use_avatars}&pictures=${use_pictures}`)
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