/**
 * file:        watch.js
 * description: Fetches the latest matches from TBA, then plays the latest match video.
 *              Match videos automatically update and switch to the next latest on completion.
 *              Unavailable videos are automatically skipped.
 *              A button is available for rotating through multiple videos for a match.
 *              TODO: intelligently choose the most interesting match to watch based off of OPR or something.
 *              Auto skip end (and maybe beginning)
 * author:      Liam Fruzyna
 * date:        2026-03-12
 */

var events = {}

var read = 0
var matches = []

var video_index = 0
var current_match = ''
var played_matches = []
var state_error = false
var unavailable_matches = []
var switching = false
var firstStarted = false

var video, contents, player, video_toggle, description

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const NUM_ROWS = 100
const LS_KEY = 'played-matches'
const SORT = 'total fuel count'

var country_filter = ''
var district_filter = ''
var event_filter = ''

// fetch new matches every 60 seconds
setInterval(get_all_matches, 60 * 1000)

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    header_info.innerText = 'WildZone'

    video = document.createElement('div')
    video.id = 'player'
    
    // import YouTube embedded player API
    let tag = document.createElement('script')
    tag.src = "https://www.youtube.com/iframe_api";
    let firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // button to rotate between available videos, only shown if a match has multiple
    video_toggle = document.createElement('div')
    video_toggle.onclick = switch_video

    // add a description of the current filter
    description = document.createElement('div')
    let filter = 'all current events'
    if (event_filter)
    {
        filter = event_filter
    }
    else if (district_filter)
    {
        filter = `current ${district_filter} events`
    }
    else if (country_filter)
    {
        filter = `current ${country_filter} events`
    }
    description.innerText = `Showing the ${NUM_ROWS} latest matches from ${filter}. Playing by in order of ${SORT}.`
    description.style.padding = '8px'

    contents = document.createElement('span')
    contents.innerText = 'Fetching matches...'
    card = new WRCard([video, video_toggle, description, contents])
    preview.replaceChildren(card)

    // read stored played_matches from localStorage
    let stored_plays = localStorage.getItem(LS_KEY)
    if (stored_plays !== null)
    {
        played_matches = JSON.parse(stored_plays)
    }

    // warn about autoplay
    if (navigator.getAutoplayPolicy('mediaelement') !== 'allowed' && sessionStorage.getItem('dismiss_warning') !== 'true')
    {
        let notification = document.getElementById('warning_notification')
        notification.innerText = 'Autoplay is not enabled; select a match to start playback.'
        notification.style.transform = 'translate(0%)'
        notification.style.visibility = 'visible'
        notification.onclick = _ => {
            // dismiss the warning for this session
            sessionStorage.setItem('dismiss_warning', true)
            notification.style.transform = 'translate(0%, 100%)'
            notification.style.visibility = 'collapse'
        }
    }

    // get TBA key from config, prompt for it if not available
    let key_query = cfg.tba_query
    if (!key_query)
    {
        return
    }
    fetch(`https://www.thebluealliance.com/api/v3/events/${cfg.year}/simple${key_query}`)
        .then(response => {
            if (response.status == 401) {
                alert('Invalid API Key Suspected')
            }
            return response.json()
        })
        .then(data => {
            let current_events = []
            let current_date = Date.now()
            for (let d of data)
            {
                // get end of day by adding 1 day in ms
                let end_date = Date.parse(d.end_date) + 86400000
                // find all events currently taking place
                if (current_date > Date.parse(d.start_date) && current_date < end_date)
                {
                    let event_id = `${cfg.year}${d.event_code}`
                    current_events.push(event_id)

                    // apply event search filters
                    if ((!event_filter || d.event_code.startsWith(event_filter.toLowerCase())) &&
                        (!country_filter || d.country.toUpperCase() === country_filter.toUpperCase()) &&
                        (!district_filter || (d.district && d.district.abbreviation === district_filter.toLowerCase()) ||
                                             (district_filter === 'none' && d.district === null)))
                    {
                        events[event_id] = clean_event_name(d.name)
                    }
                }
            }

            // remove played matches for events that have passed
            played_matches = played_matches.filter(m => current_events.includes(m.split('_')[0]))

            // fetch matches for each event
            get_all_matches(events)
        })
}

/**
 * Builds a list of completed matches from the current list of events.
 */
function get_all_matches()
{
    console.log('Updating matches')
    if (read > 0)
    {
        console.log('Update already in progress, aborting')
        return
    }

    // reset match list
    matches = []
    for (let event of Object.keys(events))
    {
        fetch(`https://www.thebluealliance.com/api/v3/event/${event}/matches${cfg.tba_query}`)
            .then(response => {
                if (response.status == 401) {
                    alert('Invalid API Key Suspected')
                }
                return response.json()
            })
            .then(data => {
                // add matches to a running list
                matches = matches.concat(data.filter(m => m.winning_alliance))
                count_matches()
            })
            .catch(err => {
                count_matches()
            })
    }
}

/**
 * Increments the count of events whose matches has been received (or failed).
 * Populates the table when all have been received.
 */
function count_matches()
{
    // wait until each event is accounted for
    if (++read === Object.keys(events).length)
    {
        // sort matches in descending time order
        matches.sort((a, b) => b.actual_time - a.actual_time)
        build_table()
        read = 0
    }
}

/**
 * Function called by the embedded YouTube player when its container is ready.
 * Used to setup the player size.
 */
function onYouTubeIframeAPIReady()
{
    console.log('Creating YouTube player')
    player = new YT.Player('player', {
        width: '854',
        height: '480',
        videoId: '',
        playerVars: {
            'playsinline': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    })
}

/**
 * Function called by the embedded YouTube player when it is done loading.
 * There is a race between this an the matches loading, hence checking if there is a current match.
 * @param {Event} event 
 */
function onPlayerReady(event)
{
    if (current_match)
    {
        console.log('Player loaded after matches, playing first match')
        // find the match corresponding to the current match key
        let match = matches.filter(m => m.key === current_match)
        if (match.length)
        {
            // load and start playing its video
            let key = get_yt_videos(match[0])[video_index]
            player.loadVideoById(key)
        }
    }
}

/**
 * Function called by the embedded YouTube player when the playing state changes.
 * Used primarily to determine if a match video has successfully started, failed to start, or finished.
 * @param {Event} event 
 */
function onPlayerStateChange(event)
{
    switch (event.data)
    {
        case YT.PlayerState.PLAYING:
            console.log('Video started')
            state_error = false
            firstStarted = true

            // detect if the selected video is being started for the first time
            if (current_match && !played_matches.includes(current_match))
            {
                // find the corresponding match
                let match = matches.filter(m => m.key === current_match)
                if (match.length)
                {
                    let m = match[0]

                    // update the header to contain the event ID and match name
                    header_info.innerText = `${m.event_key.toUpperCase()} ${get_short_name(m)}`

                    // display the switch video button only if there are multiple YouTube videos
                    if (get_yt_videos(m).length > 1)
                    {
                        video_toggle.innerText = 'Switch Video'
                    }
                    else
                    {
                        video_toggle.innerText = ''
                    }
                }

                // mark the match as played
                played_matches.push(current_match)
                localStorage.setItem(LS_KEY, JSON.stringify(played_matches))

                // update the table so the current match is shown as selected
                build_table()
            }
            break
        case YT.PlayerState.ENDED:
            console.log('Video complete')
            state_error = false

            // video is complete, clear the selected match and look for a new video
            current_match = ''
            unavailable_matches = []
            get_all_matches()
            break
        case -1:
            console.log('STATE ERROR')
            // unknown state errors are triggered until the user interaction when autoload is disabled, ignore these
            if (firstStarted || navigator.getAutoplayPolicy('mediaelement') === 'allowed')
            {
                // this unknown state occurs both before a video starts playing and if it fails to play (i.e. is still processing)
                // it also occurs an extra time when a video is given a start time, which is used when switching between a single match's videos
                // so, ignore the first time this happens, if we are switching videos also ignore the second
                // if it happens a third time, mark the video as unavailable and try to select another video
                if (state_error && !switching)
                {
                    console.log('Considering match unavailable,', current_match)
                    unavailable_matches.push(current_match)
                    current_match = ''
                    // try to select another video
                    build_table()
                }
                else if (switching)
                {
                    // starting a video from a set point causes a third error
                    switching = false
                }
                else
                {
                    state_error = true
                }
            }
            break
    }
}

/**
 * Builds a table of the most recent matches. Selects a video to play if none is selected.
 */
function build_table()
{
    console.log('Building table')

    let table = document.createElement('table')
    table.id = 'live_matches'
    let header = create_header_row(['Event', 'Match', 'BD', 'Time', 'Red Teams', 'Red Score', 'Blue Score', 'Blue Teams', 'Video'])
    header.className = 'sticky_header'
    table.append(header)
    contents.replaceChildren(table)

    let priorities = {}
    for (let i in matches)
    {
        // only show the specified number of matches
        if (i >= NUM_ROWS)
        {
            break
        }

        let m = matches[i]
        let row = table.insertRow()

        // flash the currently playing match yellow
        if (m.key === current_match)
        {
            row.className = 'playing_match'
        }

        // open the TBA event page when the event name is clicked
        let event = row.insertCell()
        event.innerText = events[m.event_key]
        event.onclick = () => window_open(`https://thebluealliance.com/event/${m.event_key}`, true)
        event.title = `Open ${events[m.event_key]} in TBA`

        // open the TBA match page when the match name is clicked
        let match_num = row.insertCell()
        match_num.innerText = get_short_name(m)
        match_num.onclick = () => window_open(`https://thebluealliance.com/match/${m.key}`, true)
        match_num.title = `Open ${get_short_name(m)} in TBA`

        // open the TBA match page when the breakdown is clicked
        let breakdown = row.insertCell()
        let has_breakdown = m.score_breakdown !== null
        breakdown.innerText = has_breakdown ? '✅' : '❌'
        breakdown.onclick = () => window_open(`https://thebluealliance.com/match/${m.key}`, true)
        breakdown.title = `Open ${get_short_name(m)} in TBA`

        let match_date = new Date(m.actual_time * 1000)
        let minutes = `${match_date.getMinutes()}`.padStart(2, '0')
        row.insertCell().innerText = `${DAYS[match_date.getDay()]} ${match_date.getHours()}:${minutes}`

        let red_teams = row.insertCell()
        red_teams.innerText = m.alliances.red.team_keys.map(t => t.substring(3)).join(' ')
        red_teams.style.color = 'var(--red-alliance-color)'

        let red_score = row.insertCell()
        red_score.innerText = m.alliances.red.score
        red_score.style.color = 'var(--red-alliance-color)'
        if (m.winning_alliance == 'red')
        {
            red_teams.style.fontWeight = 'bold'
            red_score.style.fontWeight = 'bold'
        }

        let blue_score = row.insertCell()
        blue_score.innerText = m.alliances.blue.score
        blue_score.style.color = 'var(--blue-alliance-color)'

        let blue_teams = row.insertCell()
        blue_teams.innerText = m.alliances.blue.team_keys.map(t => t.substring(3)).join(' ')
        blue_teams.style.color = 'var(--blue-alliance-color)'
        if (m.winning_alliance == 'blue')
        {
            blue_teams.style.fontWeight = 'bold'
            blue_score.style.fontWeight = 'bold'
        }

        // get the match's YouTube videos
        let vidLink = row.insertCell()
        let videos = get_yt_videos(m)
        if (videos.length > 0)
        {
            video_index = 0
            let video_key = videos[video_index]

            // add a green play button if there is at least 1 video
            vidLink.innerText = 'Play'
            // clicking the button plays it immediately
            vidLink.onclick = () => {
                if (player.getCurrentTime() < 30 && played_matches.includes(current_match))
                {
                    played_matches.splice(played_matches.indexOf(current_match), 1)
                }

                console.log('Playing selected match,', m.key)
                current_match = m.key
                video_index = 0
                unavailable_matches = []
                player.loadVideoById(video_key)
            }
            // right clicking the button opens the video in a new tab
            vidLink.oncontextmenu = () => {
                window.open(`https://www.youtube.com/watch?v=${video_key}`, '_blank')
                played_matches.push(m.key)
                localStorage.setItem(LS_KEY, JSON.stringify(played_matches))
                build_table()
                return false
            }

            // if the video failed to load recently, make the play button green
            if (unavailable_matches.includes(m.key))
            {
                vidLink.style.backgroundColor = '#FFF200'
                vidLink.title = 'Match failed to play'
            }
            // don't color the button for played matches
            else if (!played_matches.includes(m.key))
            {
                vidLink.style.backgroundColor = 'var(--green-alliance-color)'
            }

            // if no video is currently playing, build a list of unplayed and available matches
            if (!played_matches.includes(m.key) && !unavailable_matches.includes(m.key) && !current_match && has_breakdown)
            {
                priorities[m.key] = { 'video': video_key, 'priority': calculate_match_priority(m) }
            }
        }

        // remove all text color from played matches
        if (played_matches.includes(m.key))
        {
            row.style.color = 'gray'
            red_teams.style.color = 'gray'
            red_score.style.color = 'gray'
            blue_teams.style.color = 'gray'
            blue_score.style.color = 'gray'
        }
    }

    // select the highest priority video to play
    let keys = Object.keys(priorities).filter(k => priorities[k].priority >= 0)
    if (keys.length)
    {
        // get match with the highest priority
        keys.sort((a, b) => priorities[b].priority - priorities[a].priority)
        current_match = keys[0]
        console.log(`Match with highest priority is ${current_match} with ${priorities[current_match].priority}`)

        // sometimes the video player loads after the matches
        // check before immediately playing the video
        if (player && player.hasOwnProperty('loadVideoById'))
        {
            console.log(`Player loaded before matches, playing selected match, ${current_match}`)
            player.loadVideoById(priorities[current_match].video)
        }
    }
}

/**
 * Calculates a score used to rank match video priorities.
 * Currently it is total fuel.
 * @param {Object} match Match object from TBA
 * @returns Calculated priority score or -1 if no breakdown
 */
function calculate_match_priority(match)
{
    if (match.score_breakdown !== null)
    {
        if (SORT === 'total fuel count')
        {
            let red_fuel = match.score_breakdown.red.hubScore.totalCount
            let blue_fuel = match.score_breakdown.blue.hubScore.totalCount
            return red_fuel + blue_fuel
        }
        else
        {
            return match.actual_time
        }
    }
    return -1
}

/**
 * Rotates between available videos for the current match.
 */
function switch_video()
{
    console.log(`Switching to next match video for ${current_match} ${video_index}`)
    let match = matches.filter(m => m.key === current_match)
    if (match.length)
    {
        // increment the selected video, wrap back to zero
        let videos = get_yt_videos(match[0])
        if (videos.length <= ++video_index)
        {
            video_index = 0
        }

        // start the next video where the first one left off
        switching = true
        player.loadVideoById(videos[video_index], startSeconds=player.getCurrentTime())
    }
}

/**
 * Gets all YouTube videos for the given match.
 * @param {Object} match Match object from TBA
 * @returns Array of video keys
 */
function get_yt_videos(match)
{
    return match.videos.filter(v => v.type === 'youtube').map(v => v.key)
}

/**
 * Builds a short match name for the given match.
 * Just the match number for quals, M # for elims, and F # for finals.
 * @param {Object} match Match object from TBA
 * @returns Short match name
 */
function get_short_name(match)
{
    if (match.comp_level === 'qm')
    {
        return match.match_number
    }
    else if (match.comp_level == 'f')
    {
        return `F ${match.match_number}`
    }
    else
    {
        return `M ${match.set_number}`
    }
}
