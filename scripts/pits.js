/**
 * file:        pits.js
 * description: Contains functions for the pit selection page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

const OPEN_RESULT = build_button('edit_result', 'Edit Results', `start_scouting(true)`) + build_button('open_result', 'View Results', `open_result('RESULT')`)

const CONTENTS = `<img id="avatar"> <h2><span id="team_num">No Team Selected</span> <span id="team_name"></span></h2>
                    <img id="photo" alt="No image available">`
    
const BUTTONS = `${build_button('scout_pit', 'Scout Pit!', 'start_scouting(false)')}
                <div id="view_result"></div>
                <video id="prevue" height="0">Video stream not available</video>
                ${build_button('capture', 'Capture Robot', 'capture()')}`

var teams
var team = ''

var streaming = false
var full_canvas
var low_canvas

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
    navigator.mediaDevices.getUserMedia({video: true, audio: false})
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
        let file = get_team_image_name(team, event_id)
        localStorage.setItem(file, low_res)
        
        // post file to server
        fetch(get_cookie(UPLOAD_COOKIE, UPLOAD_DEFAULT), {method: 'POST', body: `${file}|||${full_res}`})
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
    document.getElementById('avatar').src = get_avatar(team_num, event_id.substr(0, 4))
    document.getElementById('team_num').innerHTML = team_num
    document.getElementById('team_name').innerHTML = get_team_name(team_num, event_id)
    document.getElementById(`option_${team_num}`).classList.add('selected')
    teams.forEach(function (team, index) {
        let number = team.team_number
        if (number != team_num && document.getElementById(`option_${number}`).classList.contains('selected'))
        {
            document.getElementById(`option_${number}`).classList.remove('selected')
        }
    })

    if (document.getElementById('open_result_container') !== null)
    {
        document.getElementById('open_result_container').remove()
    }
    
    let file = get_pit_result(team_num, event_id)
    if (file_exists(file))
    {
        document.getElementById('view_result').innerHTML = OPEN_RESULT.replace(/RESULT/g, file)
    }
    else
    {
        document.getElementById('view_result').innerHTML = ''
    }

    let photo = document.getElementById('photo')
    photo.setAttribute('onerror', `use_cached_image(${team_num}, "photo")`)
    file = get_team_image_name(team_num, event_id)
    photo.setAttribute('src', `/uploads/${file}.png`)
}

/**
 * function:    open_result
 * parameters:  file to open
 * returns:     none
 * description: Opens result page for selected team.
 */
function open_result(file)
{
    document.location.href = `selection.html${build_query({'page': 'results', [TYPE_COOKIE]: PIT_MODE, [EVENT_COOKIE]: event_id, 'file': file})}`
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
    window.open(`scout.html${build_query({[TYPE_COOKIE]: PIT_MODE, 'team': team_num, 'alliance': 'white', [EVENT_COOKIE]: event_id, [POSITION_COOKIE]: 0, [USER_COOKIE]: user_id, 'edit': edit})}`, '_self')
}

/**
 * function:    build_team_list
 * parameters:  none
 * returns:     none
 * description: Completes left select team pane with teams from event data.
 */
function build_team_list()
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
 * function:    load_event
 * parameters:  none
 * returns:     none
 * description: Fetch simple event teams and from localStorage.
 *              Build team list on load completion.
 */
function load_event()
{
    let file_name = get_event_teams_name(event_id)
    let preview = document.getElementById('preview')

    if (localStorage.getItem(file_name) != null)
    {
        preview.innerHTML = preview.innerHTML.replace(/CONTENTS/g, CONTENTS)
                                             .replace(/BUTTONS/g, BUTTONS)
        
        teams = JSON.parse(localStorage.getItem(file_name))
        build_team_list()
    }
    else
    {
        preview.innerHTML = preview.innerHTML.replace(/CONTENTS/g, '<h2>No Team Data Found</h2>Please preload event')
                                             .replace(/BUTTONS/g, '')
    }
    init_camera()
}

// read parameters from URL
const event_id = get_parameter(EVENT_COOKIE, EVENT_DEFAULT)
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

// load event data on page load
load_event()