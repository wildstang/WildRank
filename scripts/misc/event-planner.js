/**
 * file:        event-planner.js
 * description: Helps a team plan their events.
 *              TODO:
 *                  - add map (plot and select)
 *                  - add travel time filters
 * author:      Liam Fruzyna
 * date:        2022-09-17
 */

// TBA event types
const REGIONAL = 0
const DISTRICT = 1
const DISTRICT_CMP = 2
const CMP_DIVISION = 3
const CMP_FINALS = 4
const DISTRICT_CMP_DIVISION = 5
const FOC = 6

const OFFSEASON = 99
const PRESEASON = 100

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    // read year from URL or use current year
    let urlParams = new URLSearchParams(window.location.search)
    let year = urlParams.get('year')
    if (year === null)
    {
        year = cfg.year
    }

    let range = new Entry('range', 'Range (mi)', 250)
    range.type = 'number'
    let latitude = new Entry('latitude', 'Latitude', 42.109243)
    latitude.type = 'number'
    let longitude = new Entry('longitude', 'Longitude', -87.949200)
    longitude.type = 'number'
    let states = new Entry('states', 'States', '')
    let regionals = new Checkbox('regionals', 'Show Regionals', true)
    let districts = new Checkbox('districts', 'Show District Events', false)
    let offseasons = new Checkbox('offseasons', 'Show Offseason Events', false)
    let championships = new Checkbox('championships', 'Show Championships', false)
    let search = new Button('search', 'Search', `process_year(${year})`)
    let filters = new PageFrame('', '', [new ColumnFrame('', '', [range, states]), new ColumnFrame('', '', [latitude, regionals, districts, search]), new ColumnFrame('', '', [longitude, championships, offseasons])])

    let card = new Card('card', '<div id="summary">Loading data....</div><table id="weeks" style="text-align: left"></table>')
    document.body.innerHTML += filters.toString + '<br>' + new PageFrame('', '', [card]).toString

    if ('geolocation' in navigator)
    {
        navigator.geolocation.getCurrentPosition(position => {
            console.log(position)
            document.getElementById('latitude').value = position.coords.latitude
            document.getElementById('longitude').value = position.coords.longitude
        }, e => {
            console.log('Failed to get location', e)
        }, {timeout: 10000})
    }

    process_year(year)
}

/**
 * function:    process_year
 * parameters:  year to build the table for
 * returns:     none
 * description: Builds the tables of events based on the filters.
 */
function process_year(year)
{
    if (!TBA_KEY)
    {
        let file = cfg.keys
        if (file != null)
        {
            if (cfg.keys.hasOwnProperty('tba'))
            {
                TBA_KEY = cfg.keys.tba
            }
        }
        if (!TBA_KEY)
        {
            alert('No API key found for TBA!')
            return
        }
    }

    let weeks = {}
    let count = 0

    // fetch list of all events in the year
    fetch(`https://www.thebluealliance.com/api/v3/events/${year}${build_query({[TBA_AUTH_KEY]: TBA_KEY})}`)
        .then(response => {
            if (response.status === 401) {
                alert('Invalid API Key Suspected')
            }
            return response.json()
        })
        .then(events => {
            // sort all events by start date
            events.sort((a, b) => new Date(a.start_date) - new Date(b.start_date))

            // build data structure of events sorted by week
            for (let event of events)
            {
                let week = event.week
                if (event.event_type === PRESEASON)
                {
                    week = 'Week 0'
                }
                else if (event.event_type === OFFSEASON)
                {
                    week = 'Offseason'
                }
                else if (event.event_type == CMP_DIVISION || event.event_type == CMP_FINALS || event.event_type == FOC)
                {
                    week = 'Championship'
                }
                else
                {
                    week = `Week ${parseInt(week) + 1}`
                }
                if (!weeks.hasOwnProperty(week))
                {
                    weeks[week] = []
                }
                weeks[week].push(event)
            }

            // add a table for each week
            document.getElementById('weeks').innerHTML = ''
            for (let week in weeks)
            {
                document.getElementById('weeks').innerHTML += `<tr><td></td><td><h3>${week}</h3></td></tr>`
                for (let event of weeks[week])
                {
                    let latitude = parseFloat(document.getElementById('latitude').value)
                    let longitude = parseFloat(document.getElementById('longitude').value)
                    let range = parseInt(document.getElementById('range').value) / 69 // convert to degrees
                    let states = document.getElementById('states').value.split(',').map(s => s.trim().toUpperCase()).filter(s => s !== '')
                    let regionals = document.getElementById('regionals').checked
                    let districts = document.getElementById('districts').checked
                    let offseasons = document.getElementById('offseasons').checked
                    let championships = document.getElementById('championships').checked

                    // apply filters
                    if (event.lat > latitude - range && event.lat < latitude + range &&
                        event.lng > longitude - range && event.lng < longitude + range &&
                        (states.length === 0 || states.includes(event.state_prov)) &&
                        (districts || (event.event_type !== DISTRICT && event.event_type !== DISTRICT_CMP && event.event_type !== DISTRICT_CMP_DIVISION)) &&
                        (offseasons || (event.event_type !== PRESEASON && event.event_type !== OFFSEASON)) &&
                        (championships || (event.event_type !== CMP_DIVISION && event.event_type !== CMP_FINALS && event.event_type !== FOC && event.event_type !== DISTRICT_CMP && event.event_type !== DISTRICT_CMP_DIVISION)) &&
                        (regionals || (event.event_type !== REGIONAL)))
                    {
                        count++
                        document.getElementById('weeks').innerHTML += `<tr><td>${event.key}</td><td>${event.name}</td><td>${event.city}, ${event.state_prov}, ${event.country}</td><td>${event.start_date}</td></tr>`
                    }
                }
            }
            
            document.getElementById('summary').innerHTML = `There are ${count} events within your parameters.`
        })
        .catch(err => {
            console.log(`Error fetching ${year} events, ${err}`)
        })
}