/**
 * file:        event-planner.js
 * description: Helps a team plan their events.
 *              TODO:
 *                  - add location filters to page
 *                  - filter by normal unit
 *                  - add state filters
 *                  - add map (plot and select)
 *                  - add type filters (regionals vs districts, official vs offseason)
 *                  - line up tables
 *                  - add time filters
 * author:      Liam Fruzyna
 * date:        2022-09-17
 */

// TBA event types
const CMP_DIVISION = 3
const CMP_FINALS = 4
const FOC = 6

const OFFSEASON = 99
const PRESEASON = 100

var filt_lat = 42.109243
var filt_lon = -87.949200
var filt_mi = 300

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    let card = new Card('card', '<div id="summary">Loading data....</div><div id="weeks"></div>')
    document.body.innerHTML += new PageFrame('', '', [card]).toString

    // read year from URL or use current year
    let urlParams = new URLSearchParams(window.location.search)
    let year = urlParams.get('year')
    if (year === null)
    {
        year = cfg.year
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
            for (let week in weeks)
            {
                document.getElementById('weeks').innerHTML += `<h3>${week}</h3><table id="${week}" style="text-align: left"></table>`
                for (let event of weeks[week])
                {
                    // apply filters
                    let range = filt_mi / 69 // convert to degrees
                    if (event.lat > filt_lat - range && event.lat < filt_lat + range &&
                        event.lng > filt_lon - range && event.lng < filt_lon + range)
                    {
                        count++
                        document.getElementById(week).innerHTML += `<tr><td>${event.key}</td><td>${event.name}</td><td>${event.city}, ${event.state_prov}, ${event.country}</td><td>${event.start_date}</td></tr>`
                    }
                }
            }
            
            document.getElementById('summary').innerHTML = `There are ${count} events within your parameters.`
        })
        .catch(err => {
            console.log(`Error fetching ${year} events, ${err}`)
        })
}