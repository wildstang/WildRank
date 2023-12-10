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

var avatar_el, team_num_el, team_name_el, photos_el, buttons_el, preview_el, capture_el

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
        avatar_el = document.createElement('img')
        avatar_el.onclick = (event) => generate = 'random'
        avatar_el.ontouchstart = (event) => touch_button(false)
        avatar_el.ontouchend = (event) => touch_button('generate="random"', true)

        team_el = document.createElement('h2')
        team_num_el = document.createElement('span')
        team_name_el = document.createElement('span')
        team_el.append(team_num_el, ' ', team_name_el)

        photos_el = document.createElement('span')
        contents_card.append(avatar_el, team_el, photos_el)

        let camera_el = document.createElement('div')
        camera_el.style.display = 'none'
        preview_el = document.createElement('video')
        preview_el.innerText = 'Video stream not available.'
        capture_el = document.createElement('span')
        camera_el.append(preview_el, capture_el)

        buttons_el = document.createElement('div')
        buttons_container.append(buttons_el, camera_el)
        
        open_option(first)

        // setup camera feed
        if (cfg.settings.use_images && navigator.mediaDevices)
        {    
            // get video stream
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })
                .then(function(stream)
                {
                    preview_el.srcObject = stream
                    preview_el.play()
                })
                .catch(function(err)
                {
                    console.log(err)
                })
    
            // initialize camera dimensions, when available
            preview_el.addEventListener('canplay', function(e)
            {
                if (!streaming)
                {
                    // apply dimensions
                    preview_el.setAttribute('width', preview_el.videoWidth)
                    preview_el.setAttribute('height', preview_el.videoHeight)
                    streaming = true

                    // show camera when available
                    camera_el.style.display = 'block'
                }
            }, false)
        }
    }
    else
    {
        let header = document.createElement('h2')
        header.textContent = 'No Team Data Found'
        let details = document.createElement('span')
        details.textContent = 'Please preload event'
        contents_card.append(header, details)
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
    avatar_el.src = dal.get_value(team_num, 'pictures.avatar')
    team_num_el.innerText = team_num
    team_name_el.innerText = dal.get_value(team_num, 'meta.name')
    document.getElementById(`pit_option_${team_num}`).classList.add('selected')
    photos_el.replaceChildren(dal.get_photo_carousel(team_num))
    
    // show edit/view result buttons
    let scout = new Button('scout_pit', 'Scout Pit!')
    scout.link = `start_scouting('${team_num}', false)`
    buttons_el.replaceChildren(scout.element)
    if (dal.is_pit_scouted(team_num))
    {
        let page = new PageFrame()

        let edit = new Button('edit_result', 'Edit Result')
        edit.link = `start_scouting('${team_num}', true)`
        edit.add_class('slim')
        page.add_column(new ColumnFrame('', '', [edit]))

        let renumber = new Button('renumber', 'Renumber Result')
        renumber.link = `renumber_pit('${team_num}')`
        renumber.add_class('slim')
        page.add_column(new ColumnFrame('', '', [renumber]))

        let del = new Button('delete', 'Delete Result')
        del.link = `delete_pit('${team_num}')`
        del.add_class('slim')
        page.add_column(new ColumnFrame('', '', [del]))

        buttons_el.append(page.element)
    }

    // update capture button for new team
    let capture = new Button('capture', 'Capture', `capture('${team_num}')`)
    capture.add_class('slim')
    capture_el.replaceChildren(capture.element)

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
    let canvas = document.createElement('canvas')
    let context = canvas.getContext('2d')
    if (streaming)
    {
        // get image
        canvas.width = preview_el.videoWidth
        canvas.height = preview_el.videoHeight
        context.drawImage(preview_el, 0, 0, preview_el.videoWidth, preview_el.videoHeight)
        let data = canvas.toDataURL('image/png')

        // place image in carousel
        let carousel = document.getElementById(`${team_num}-carousel`)
        if (carousel !== null)
        {
            carousel.innerHTML += `<img src="${data}">` + carousel.innerHTML
        }

        // upload image
        let addr = parse_server_addr(document.location.href)
        if (check_server(addr, notify=false))
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
                            alert('Invalid password!')
                        }
                        cache_image(addr, team_num, data)
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
        open_option(team_num)
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
 * function:    delete_pit
 * parameters:  existing team number
 * returns:     none
 * description: Prompts to delete a pit result.
 */
function delete_pit(team_num)
{
    if (confirm(`Are you sure you want to delete ${team_num}?`))
    {
        localStorage.removeItem(`${PIT_MODE}-${event_id}-${team_num}`)
        location.reload()
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
    handler.server = parse_server_addr(document.location.href)
    handler.export_zip()
}