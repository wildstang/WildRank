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

    let range = new Entry('range', 'Range (mi)', 300)
    range.type = 'number'
    let latitude = new Entry('latitude', 'Latitude', 0)
    latitude.type = 'number'
    let longitude = new Entry('longitude', 'Longitude', 0)
    longitude.type = 'number'
    let states = new Entry('states', 'States', '')
    let regionals = new Checkbox('regionals', 'Show Regionals', true)
    let districts = new Checkbox('districts', 'Show District Events', false)
    let offseasons = new Checkbox('offseasons', 'Show Offseason Events', false)
    let championships = new Checkbox('championships', 'Show Championships', false)
    let search = new Button('search', 'Search', `process_year(${year})`)
    let map_el = document.createElement('div')
    map_el.id = 'map'
    map_el.style.height = '300px'
    map_el.style.width = '400px'
    let filters = new PageFrame('', '', [new ColumnFrame('', '', [range, states]),
                                         new ColumnFrame('', '', [latitude, regionals, districts]),
                                         new ColumnFrame('', '', [longitude, championships, offseasons, search]),
                                         new ColumnFrame('mapcol', 'Map', [map_el])])

    let card_container = document.createElement('span')
    summary = document.createElement('div')
    summary.innerText = 'Loading data...'
    week_tab = document.createElement('table')
    week_tab.style.textAlign = 'left'
    card_container.append(summary, week_tab)
    let card = new Card('card', card_container)
    document.body.append(filters.element, br(), new PageFrame('', '', [card]).element)

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
    document.getElementById('latitude').value = lat
    document.getElementById('longitude').value = lon

    if (typeof scope !== 'undefined')
    {
        map.removeLayer(scope)
    }
    scope = L.circle([lat, lon], {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius: parseInt(document.getElementById('range').value) * 1609.34
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

            // read filters
            let latitude = parseFloat(document.getElementById('latitude').value)
            let longitude = parseFloat(document.getElementById('longitude').value)
            let center = new L.LatLng(latitude, longitude)
            let range = parseInt(document.getElementById('range').value) * 1609.34 // convert to meters
            let states = document.getElementById('states').value.split(',').map(s => s.trim().toUpperCase()).filter(s => s !== '')
            let regionals = document.getElementById('regionals').checked
            let districts = document.getElementById('districts').checked
            let offseasons = document.getElementById('offseasons').checked
            let championships = document.getElementById('championships').checked

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
                            let row = week_tab.insertRow()
                            row.insertCell()
                            row.append(create_header(week))
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
            changeLoc(latitude, longitude)
        })
        .catch(err => {
            console.log(`Error fetching ${year} events, ${err}`)
        })
}