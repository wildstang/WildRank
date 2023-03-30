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

include('transfer')

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch event teams from localStorage. Initialize page contents.
 */
function init_page()
{
    let first = populate_teams(false, true)
    add_button_filter('transfer', 'Export Pit Results', `export_results()`, true)
    if (first)
    {
        contents_card.innerHTML = `<img id="avatar" onclick="generate='random'" ontouchstart="touch_button(false)" ontouchend="touch_button('generate=\\'random\\', true)')">
            <h2><span id="team_num">No Team Selected</span> <span id="team_name"></span></h2>
            <span id="photos"></span>`
        buttons_container.innerHTML = `<div id="view_result"></div>
            <div id="camera-container" style="display: none">
                <video id="camera-preview">Video stream not available.</video>
                <span id="capture-button"></span>
            </div>`
        
        open_option(first)

        // setup camera feed
        if (cfg.settings.use_images && navigator.mediaDevices)
        {
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

                    // show camera when available
                    document.getElementById('camera-container').style.display = 'block'
                }
            }, false)
        }
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
    
    // show edit/view result buttons
    let result_buttons = document.getElementById('view_result')
    let scout = new Button('scout_pit', 'Scout Pit!')
    scout.link = `start_scouting('${team_num}', false)`
    result_buttons.innerHTML = scout.toString
    if (dal.is_pit_scouted(team_num))
    {
        let edit = new Button('edit_result', 'Edit Results')
        edit.link = `start_scouting('${team_num}', true)`
        edit.add_class('slim')

        let renumber = new Button('renumber', 'Renumber Result')
        renumber.link = `renumber_pit('${team_num}')`
        renumber.add_class('slim')

        result_buttons.innerHTML += edit.toString + renumber.toString
    }

    // update capture button for new team
    let capture = new Button('capture', 'Capture', `capture('${team_num}')`)
    capture.add_class('slim')
    document.getElementById('capture-button').innerHTML = capture.toString

    ws(team_num)
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
            canvas.toBlob(function (blob)
            {
                // post string to server
                let formData = new FormData()
                formData.append('upload', blob)
                fetch(`${addr}/photo/${team_num}?password=${cfg.keys.server}`, {method: 'POST', body: formData})
                    .then(response => response.json())
                    .then(result => {
                        if (result.success)
                        {
                            // add image to team photos
                            dal.add_photo(team_num, `${addr}/${result.name}`, true)
                            alert('Upload successful!')
                        }
                        else if (result.name === 'Invalid password')
                        {
                            cache_image(addr, team_num, data)
                            alert('Invalid password!')
                        }
                        else
                        {
                            cache_image(addr, team_num, data)
                        }
                    })
                    .catch(e => {
                        cache_image(addr, team_num, data)
                        console.error(e)
                    })
            })
        }
        else
        {
            cache_image(addr, team_num, data)
        }
    }
}

/**
 * function:    cache_image
 * parameters:  server address, team number, base64 image
 * returns:     none
 * description: If server upload failed, generate a random url and put in the cache.
 */
function cache_image(server, team_num, base64)
{
    fetch(base64)
    .then(response => response.blob())
    .then(blob => {
        // assign a number 100-999 to avoid overlap with other devices
        let url = `${server}/uploads/${team_num}-${Math.floor(899 * Math.random() + 100)}.png`
        dal.add_photo(team_num, url, true)
        cache_file(url, blob)
    })
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

/**
 * function:    renumber_pit
 * parameters:  existing team number
 * returns:     none
 * description: Prompts to renumber a pit result.
 */
function renumber_pit(team_num)
{
    let input = prompt('New team number')
    if (input !== null)
    {
        let new_num = parseInt(input)
        let pit = localStorage.getItem(`${PIT_MODE}-${event_id}-${team_num}`)
        if (pit !== null)
        {
            let jpit = JSON.parse(pit)
            jpit.meta_team = new_num
            localStorage.setItem(`${PIT_MODE}-${event_id}-${new_num}`, JSON.stringify(jpit))
            localStorage.removeItem(`${PIT_MODE}-${event_id}-${team_num}`)

            location.reload()
        }
    }
}

/**
 * function:    export_results
 * parameters:  none
 * returns:     none
 * description: Starts the zip export process for pit results and pictures.
 */
function export_results()
{
    let handler = new ZipHandler()
    handler.pit = true
    handler.pictures = true
    handler.user = user_id
    handler.export_zip()
}