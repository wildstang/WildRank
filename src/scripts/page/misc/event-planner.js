/**
 * file:        event-planner.js
 * description: Helps a team plan their events.
 *              TODO:
 *                - fix broken map tiles
 *                - add travel time filters
 * author:      Liam Fruzyna
 * date:        2022-09-17
 */

link('https://unpkg.com/leaflet@1.8.0/dist/leaflet.css')
include('https://unpkg.com/leaflet@1.8.0/dist/leaflet.js')

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

// map objects
var map
var scope
var locs = []

var summary, week_tab

var range_el, latitude, longitude, states_el, regionals_el, districts_el, offseasons_el, championships_el, card

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

    range_el = new WREntry('Range (mi)', 300)
    range_el.type = 'number'
    latitude = new WREntry('Latitude', 0)
    latitude.type = 'number'
    longitude = new WREntry('Longitude', 0)
    longitude.type = 'number'
    states_el = new WREntry('States', '')
    regionals_el = new WRCheckbox('Show Regionals', true)
    districts_el = new WRCheckbox('Show District Events', false)
    offseasons_el = new WRCheckbox('Show Offseason Events', false)
    championships_el = new WRCheckbox('Show Championships', false)
    let search = new WRButton('Search', () => process_year(year))
    let map_el = create_element('div', 'map')
    map_el.style.height = '300px'
    map_el.style.width = '400px'
    let filters = new WRPage('', [new WRColumn('', [range_el, states_el]),
                                         new WRColumn('', [latitude, regionals_el, districts_el]),
                                         new WRColumn('', [longitude, championships_el, offseasons_el, search]),
                                         new WRColumn('Map', [map_el])])

    let card_container = document.createElement('span')
    summary = document.createElement('div')
    summary.innerText = 'Loading data...'
    week_tab = document.createElement('table')
    week_tab.style.textAlign = 'left'
    card_container.append(summary, week_tab)
    card = new WRCard(card_container)
    preview.append(filters, br(), new WRPage('', [card]))

    if ('geolocation' in navigator)
    {
        navigator.geolocation.getCurrentPosition(position => {
            console.log(position)
            latitude.element.value = position.coords.latitude
            longitude.element.value = position.coords.longitude
        }, e => {
            console.log('Failed to get location', e)
        }, {timeout: 10000})
    }

    // setup map
    map = L.map('map')
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 15,
        attribution: '© OpenStreetMap'
    }).addTo(map);
    map.on('click', onMapClick)
    map.setView([42.109243, -87.949200], 1)
    changeLoc(42.109243, -87.949200)

    process_year(year)
}

/**
 * function:    onMapClick
 * parameters:  click event
 * returns:     none
 * description: Responds to a click on the map.
 */
function onMapClick(e)
{
    changeLoc(e.latlng.lat, e.latlng.lng)
}

/**
 * function:    changeLoc
 * parameters:  latitude, longitude
 * returns:     none
 * description: Selects a given position and updates the map.
 */
function changeLoc(lat, lon)
{
    latitude.element.value = lat
    longitude.element.value = lon

    if (typeof scope !== 'undefined')
    {
        map.removeLayer(scope)
    }
    scope = L.circle([lat, lon], {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius: parseInt(range_el.element.value) * 1609.34
    }).addTo(map);

    map.flyToBounds(scope.getBounds())
}

/**
 * function:    process_year
 * parameters:  year to build the table for
 * returns:     none
 * description: Builds the tables of events based on the filters.
 */
function process_year(year)
{
    for (let loc of locs)
    {
        map.removeLayer(loc)
    }
    locs = []

    // request the TBA key if it doesn't already exist
    let key_query = cfg.tba_query
    if (!key_query)
    {
        return
    }

    let weeks = {}
    let count = 0

    // fetch list of all events in the year
    fetch(`https://www.thebluealliance.com/api/v3/events/${year}?${key_query}`)
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

            // read filters
            let lat = parseFloat(latitude.element.value)
            let lon = parseFloat(longitude.element.value)
            let center = new L.LatLng(lat, lon)
            let range = parseInt(range_el.element.value) * 1609.34 // convert to meters
            let states = states_el.element.value.split(',').map(s => s.trim().toUpperCase()).filter(s => s !== '')
            let regionals = regionals_el.checked
            let districts = districts_el.checked
            let offseasons = offseasons_el.checked
            let championships = championships_el.checked

            // add a table for each week
            week_tab.replaceChildren()
            for (let week in weeks)
            {
                let header = false
                for (let event of weeks[week])
                {
                    // apply filters
                    let distance = center.distanceTo(new L.LatLng(event.lat, event.lng))
                    if (distance < range &&
                        (states.length === 0 || states.includes(event.state_prov)) &&
                        (districts || (event.event_type !== DISTRICT && event.event_type !== DISTRICT_CMP && event.event_type !== DISTRICT_CMP_DIVISION)) &&
                        (offseasons || (event.event_type !== PRESEASON && event.event_type !== OFFSEASON)) &&
                        (championships || (event.event_type !== CMP_DIVISION && event.event_type !== CMP_FINALS && event.event_type !== FOC && event.event_type !== DISTRICT_CMP && event.event_type !== DISTRICT_CMP_DIVISION)) &&
                        (regionals || (event.event_type !== REGIONAL)))
                    {
                        if (!header)
                        {
                            week_tab.append(create_header_row(['', week]))
                            header = true
                        }
                        count++

                        let row = week_tab.insertRow()
                        row.insertCell().innerText = event.key
                        row.insertCell().innerText = event.name
                        row.insertCell().innerText = `${event.city}, ${event.state_prov}, ${event.country}`
                        row.insertCell().innerText = event.start_date

                        locs.push(L.marker([event.lat, event.lng]).addTo(map)
                                   .bindTooltip(event.name)
                                   .bindPopup(`${(distance / 1609.34).toFixed(1)} mi`))
                    }
                }
            }

            summary.innerText = `There are ${count} events within your parameters.`
            changeLoc(lat, lon)
        })
        .catch(err => {
            console.log(`Error fetching ${year} events, ${err}`)
        })
}