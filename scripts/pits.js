/**
 * file:        pits.js
 * description: Contains functions for the pit selection page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

// read parameters from URL
const user_id = get_parameter(USER_COOKIE, USER_DEFAULT)

var generate = ''
var streaming = false

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch event teams from localStorage. Initialize page contents.
 */
function init_page()
{
    let first = populate_teams(false, true)
    if (first)
    {
        let capture = new Button('capture', 'Capture', 'capture()')
        capture.add_class('slim')

        contents_card.innerHTML = `<img id="avatar" onclick="generate='random'" ontouchstart="touch_button(false)" ontouchend="touch_button('generate=\\'random\\', true)')">
            <h2><span id="team_num">No Team Selected</span> <span id="team_name"></span></h2>
            <span id="photos"></span>`
        buttons_container.innerHTML = `<div id="view_result"></div>
            <div id="camera-container" style="display: none">
                <video id="camera-preview">Video stream not available.</video>
                ${capture.toString}
            </div>`
        
        open_option(first)
    }
    else
    {
        contents_card.innerHTML = '<h2>No Team Data Found</h2>Please preload event'
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

    // fill team info
    document.getElementById('avatar').src = dal.get_value(team_num, 'pictures.avatar')
    document.getElementById('team_num').innerHTML = team_num
    document.getElementById('team_name').innerHTML = dal.get_value(team_num, 'meta.name')
    document.getElementById(`option_${team_num}`).classList.add('selected')
    document.getElementById('photos').innerHTML = dal.get_photo_carousel(team_num)

    if (document.getElementById('open_result_container') !== null)
    {
        document.getElementById('open_result_container').remove()
    }
    
    // show edit/view result buttons
    let result_buttons = document.getElementById('view_result')
    let scout = new Button('scout_pit', 'Scout Pit!')
    scout.link = `start_scouting('${team_num}', false)`
    result_buttons.innerHTML = scout.toString
    if (dal.is_pit_scouted(team_num))
    {
        let edit = new Button('edit_result', 'Edit Results')
        edit.link = `start_scouting('${team_num}', true)`
        result_buttons.innerHTML += edit.toString
    }

    // setup camera feed
    if (navigator.mediaDevices)
    {
        document.getElementById('capture-container').onclick = function () { capture(`${team_num}`) }
        document.getElementById('camera-container').style.display = 'block'
        let video = document.getElementById('camera-preview')

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
                // apply dimensions
                video.setAttribute('width', video.videoWidth)
                video.setAttribute('height', video.videoHeight)
                streaming = true
            }
        }, false)
    }
}

/**
 * function:    capture
 * parameters:  captured team number
 * returns:     none
 * description: Saves the current frame of the video, uploads, then adds the pictures list.
 */
function capture(team_num)
{
    let video = document.getElementById('camera-preview')
    let canvas = document.createElement('canvas')
    let context = canvas.getContext('2d')
    if (streaming)
    {
        // get image
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
        let data = canvas.toDataURL('image/png')

        // place image in carousel
        let carousel = document.getElementById(`${team_num}-carousel`)
        carousel.innerHTML = `<img src="${data}">` + carousel.innerHTML

        // upload image
        let addr = parse_server_addr(document.location.href)
        if (check_server(addr))
        {
            let base64 = data.substring(data.indexOf(','))
            // post string to server
            fetch(`${addr}/photo/${team_num}`, {method: 'POST', body: base64})
                .then(response => response.json())
                .then(result => {
                    if (result.success)
                    {
                        // add image to team photos
                        dal.add_photo(team_num, `${addr}/${result.name}`, true)
                        alert('Upload successful!')
                    }
                    else
                    {
                        alert('Upload unsuccessful!')
                    }
                })
                .catch(e => {
                    alert('Error uploading!')
                    console.error(e)
                })
        }
        // TODO cache away image for later upload if no server available
    }
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
 * parameters:  team number, dit existing results
 * returns:     none
 * description: Open scouting mode for the desired team in the current tab.
 */
function start_scouting(team_num, edit)
{
    return build_url('index', {'page': 'scout', [TYPE_COOKIE]: PIT_MODE, 'team': team_num, 'alliance': 'white', [EVENT_COOKIE]: event_id, [POSITION_COOKIE]: 0, [USER_COOKIE]: user_id, 'edit': edit, 'generate': generate })
}