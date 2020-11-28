/**
 * file:        pits.js
 * description: Contains functions for the pit selection page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

// read parameters from URL
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

var team = ''
var generate = ''

var streaming = false
var full_canvas
var low_canvas

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch event teams from localStorage. Initialize page contents.
 */
function init_page(contents_card, buttons_container)
{
    let file_name = get_event_teams_name(event_id)
    if (localStorage.getItem(file_name) != null)
    {
        contents_card.innerHTML = `<img id="avatar" onclick="generate='random'" ontouchstart="touch_button(false)" ontouchend="touch_button('generate=\\'random\\', true)')"> <h2><span id="team_num">No Team Selected</span> <span id="team_name"></span></h2>
                                    <img id="photo" alt="No image available">`
        buttons_container.innerHTML = `${build_link_button('scout_pit', 'Scout Pit!', 'start_scouting(false)')}
                                        <div id="view_result"></div>
                                        <video id="prevue" height="0">Video stream not available</video>
                                        ${build_button('capture', 'Capture Robot', 'capture()')}`
        
        if (navigator.mediaDevices) {
            init_camera()
        }
        
        build_options_list(JSON.parse(localStorage.getItem(file_name)))
    }
    else
    {
        contents_card.innerHTML = '<h2>No Team Data Found</h2>Please preload event'
    }
}

/**
 * function:    build_options_list
 * parameters:  teams
 * returns:     none
 * description: Completes left select team pane with matches from teams data.
 */
function build_options_list(teams)
{
    let first = ''
    // iterate through team objs
    teams.forEach(function (team, index) {
        let number = team.team_number
        // determine if the team has already been scouted
        let scouted = 'not_scouted'
        if (file_exists(get_pit_result(number, event_id)))
        {
            first = ''
            scouted = 'scouted'
        }
        else if (first == '')
        {
            first = number
        }

        // replace placeholders in template and add to screen
        document.getElementById('option_list').innerHTML += build_option(number, scouted)
    })
    open_option(first)
    scroll_to('option_list', `option_${first}`)
}

/**
 * function:    init_camera
 * parameters:  none
 * returns:     none
 * description: Initializes camera preview
 */
function init_camera()
{
    let video = document.getElementById('prevue')
    full_canvas = document.createElement('canvas')
    low_canvas = document.createElement('canvas')

    // get video stream
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })
        .then(function(stream)
        {
            video.srcObject = stream
            video.play()
        })
        .catch(function(err)
        {
            console.log(err)
        })

    // initialize camera dimensions, when available
    video.addEventListener('canplay', function(e)
    {
        if (!streaming)
        {
            // calculate preview width
            let width = 320 // default resolution is low bc localStorage has a limit
            let height = video.videoHeight / (video.videoWidth/width)
            if (isNaN(height))
            {
                height = width / (4/3)
            }

            // apply dimensions
            video.setAttribute('width', video.videoWidth)
            video.setAttribute('height', video.videoHeight)
            low_canvas.setAttribute('width', width)
            low_canvas.setAttribute('height', height)
            full_canvas.setAttribute('width', video.videoWidth)
            full_canvas.setAttribute('height', video.videoHeight)
            streaming = true
        }
    }, false)
}

/**
 * function:    capture
 * parameters:  none
 * returns:     none
 * description: Captures an image from the camera.
 */
function capture()
{
    if (streaming)
    {
        // capture image to canvas
        let video = document.getElementById('prevue')
        low_canvas.getContext('2d').drawImage(video, 0, 0, low_canvas.width, low_canvas.height)
        full_canvas.getContext('2d').drawImage(video, 0, 0, full_canvas.width, full_canvas.height)

        // place canvas on frame
        let photo = document.getElementById('photo')
        let low_res = low_canvas.toDataURL('image/png')
        let full_res = full_canvas.toDataURL('image/png')
        photo.setAttribute('src', full_res)

        // save image to file
        localStorage.setItem(get_team_image_name(team, event_id), low_res)
        
        // post file to server
        fetch(get_cookie(UPLOAD_COOKIE, UPLOAD_DEFAULT), {method: 'POST', body: `${get_team_image_name(team, event_id, true)}|||${full_res}`})
    }
    else
    {
        alert('Camera not found! Have you allowed the camera permission?')
    }
}

/**
 * function:    open_option
 * parameters:  Selected team number
 * returns:     none
 * description: Completes right info pane for a given team number.
 */
function open_option(team_num)
{
    deselect_all()
    document.getElementById('prevue').play()

    // fill team info
    team = team_num
    document.getElementById('avatar').src = get_avatar(team_num, event_id.substr(0, 4))
    document.getElementById('team_num').innerHTML = team_num
    document.getElementById('team_name').innerHTML = get_team_name(team_num, event_id)
    document.getElementById(`option_${team_num}`).classList.add('selected')

    if (document.getElementById('open_result_container') !== null)
    {
        document.getElementById('open_result_container').remove()
    }
    
    // show edit/view result buttons
    let file = get_pit_result(team_num, event_id)
    let result_buttons = document.getElementById('view_result')
    if (file_exists(file))
    {
        result_buttons.innerHTML = build_link_button('edit_result', 'Edit Results', `start_scouting(true)`) + 
            build_link_button('open_result', 'View Results', `open_result('${file}')`)
    }
    else
    {
        result_buttons.innerHTML = ''
    }

    // load photo
    use_cached_image(team_num, 'photo', '', false)
}

/**
 * function:    open_result
 * parameters:  file to open
 * returns:     none
 * description: Opens result page for selected team.
 */
function open_result(file)
{
    return build_url('selection', {'page': 'results', [TYPE_COOKIE]: PIT_MODE, [EVENT_COOKIE]: event_id, 'file': file})
}

/**
 * function:    start_scouting
 * parameters:  Edit existing results
 * returns:     none
 * description: Open scouting mode for the desired team in the current tab.
 */
function start_scouting(edit)
{
    let team_num = document.getElementById('team_num').innerHTML
    return build_url('index', {'page': 'scout', [TYPE_COOKIE]: PIT_MODE, 'team': team_num, 'alliance': 'white', [EVENT_COOKIE]: event_id, [POSITION_COOKIE]: 0, [USER_COOKIE]: user_id, 'edit': edit, 'generate': generate })
}