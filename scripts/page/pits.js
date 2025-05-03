/**
 * file:        pits.js
 * description: Contains functions for the pit selection page of the web app.
 *              Primarily for building the interface from event data.
 * author:      Liam Fruzyna
 * date:        2020-02-15
 */

// read parameters from URL
const scout_mode = get_parameter(MODE_QUERY, '')

var streaming = false

var avatar_el, team_num_el, team_name_el, photos_el, buttons_el, preview_el, capture_el

var scout_type

include('transfer')

/**
 * Populates the team selector and builds the structure of the page.
 */
function init_page()
{
    header_info.innerText = 'Team Select'

    let scout_config = cfg.get_scout_config(scout_mode)
    let first = populate_teams(false, true)
    add_button_filter(`Export ${scout_config.name} Results`, () => ZipHandler.export_results(scout_mode), true)
    if (first)
    {
        scout_type = scout_config.scout_type
        avatar_el = document.createElement('img')
        avatar_el.className = 'avatar'

        team_el = document.createElement('h2')
        team_num_el = document.createElement('span')
        team_name_el = document.createElement('span')
        team_el.append(team_num_el, ' ', team_name_el)

        photos_el = document.createElement('span')
        let card = new WRCard([avatar_el, team_el, photos_el])
        card.add_class('body_card')

        let camera_el = document.createElement('div')
        camera_el.style.display = 'none'
        preview_el = document.createElement('video')
        preview_el.innerText = 'Video stream not available.'
        capture_el = document.createElement('span')
        camera_el.append(preview_el, capture_el)

        buttons_el = document.createElement('div')
        preview.append(card, buttons_el, camera_el)
        
        open_option(first)

        // setup camera feed
        if (cfg.user.settings.use_images && navigator.mediaDevices)
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
        add_error_card('No Team Data Found', 'Please preload event')
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
    buttons_el.replaceChildren()

    // fill team info
    avatar_el.src = dal.teams[team_num].avatar
    team_num_el.innerText = team_num
    team_name_el.innerText = dal.teams[team_num].name
    document.getElementById(`left_pit_option_${team_num}`).classList.add('selected')

    // TODO: update photo carousel
    //photos_el.replaceChildren(dal.get_photo_carousel(team_num))

    // build buttons
    const scout_url = build_url('scout', {[MODE_QUERY]: scout_mode, index: team_num, edit: false})
    buttons_el.append(new WRLinkButton('Scout Team', scout_url))

    if (dal.is_team_scouted(team_num, scout_mode))
    {
        let page = new WRPage()

        const edit_url = build_url('scout', {[MODE_QUERY]: scout_mode, index: team_num, edit: true})
        page.add_column(new WRColumn('', [new WRLinkButton('Edit Result', edit_url)]))

        if (cfg.is_admin())
        {
            let renumber = new WRButton('Renumber Result', () => renumber_result(team_num))
            renumber.add_class('slim')
            page.add_column(new WRColumn('', [renumber]))
    
            let del = new WRButton('Delete Result', () => delete_result(team_num))
            del.add_class('slim')
            page.add_column(new WRColumn('', [del]))
        }

        buttons_el.append(page)
    }

    // update capture button for new team
    // TODO: photos
    /*let capture_button = new WRButton('Capture', () => capture(team_num))
    capture_button.add_class('slim')
    capture_el.replaceChildren(capture_button)*/

    ws(team_num)
}

/**
 * Captures an image with the camera and attempts to upload it to the server.
 * @param {Number} team_num Team number
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
                fetch(`${addr}/photo/${team_num}?password=${cfg.user.settings.server_key}`, {method: 'POST', body: formData})
                    .then(response => response.json())
                    .then(result => {
                        if (result.success)
                        {
                            // add image to team photos
                            cache_image(`${addr}/${result.name}`, team_num, data)
                            alert('Upload successful!')
                        }
                        else if (result.name === 'Invalid password')
                        {
                            alert('Invalid password!')
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
 * Stores a given image in the cache.
 * @param {String} server Server address
 * @param {Number} team_num Team number
 * @param {String} base64 Base 64 image string
 */
function cache_image(server, team_num, base64)
{
    fetch(base64)
    .then(response => response.blob())
    .then(blob => {
        // assign a number 100-999 to avoid overlap with other devices
        let url = ''
        if (server.includes(team_num) && server.endsWith('.png'))
        {
            url = server
        }
        else
        {
            url = `${server}/uploads/${team_num}-${Math.floor(899 * Math.random() + 100)}.png`
        }
        dal.add_photo(team_num, url, true)
        cache_file(url, blob)
        open_option(team_num)
    })
}

/**
 * Renumbers a result with a new team number.
 * @param {Number} team_num Original match key
 */
function renumber_result(team_num)
{
    let input = prompt('New team number')
    if (input !== null)
    {
        let new_team = parseInt(input)
        if (!dal.team_numbers.includes(input))
        {
            alert('Invalid team number!')
            return
        }

        let result = dal.teams[team_num]
        let index = prompt_for_result(result.meta[scout_mode], 'renumber')

        if (index >= 0)
        {
            // change result
            let new_result = {
                meta: result.meta[scout_mode][index],
                result: result.results[scout_mode][index]
            }
            new_result.meta.result.team_num = new_team
            localStorage.setItem(result.file_names[scout_mode][index], JSON.stringify(new_result))
        }
        location.reload()
    }
}

/**
 * Prompts to, then deletes the result for the specified team.
 * @param {Number} team Team number to delete
 */
function delete_result(team_num)
{
    if (confirm(`Are you sure you want to delete ${scout_mode} results for ${team_num}?`))
    {
        let result = dal.teams[team_num]
        if (scout_mode in result.results)
        {
            let index = prompt_for_result(result.meta[scout_mode], 'delete')
            if (index >= 0)
            {
                localStorage.removeItem(result.file_names[scout_mode][index])
                location.reload()
            }
        }
    }
}