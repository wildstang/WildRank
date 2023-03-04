/**
 * file:        team-profile.js
 * description: A prototype page meant to replicate https://team3020.com/robots using what is on TBA.
 * author:      Liam Fruzyna
 * date:        2022-09-25
 */

// TBA event types
const REGIONAL = 0

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    process_team([111, 112])
}

/**
 * function:    process_team
 * parameters:  array of teams to use
 * returns:     none
 * description: Finds every robot for each provided team.
 */
function process_team(team_nums)
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

    let robots = {}
    let count = 0
    let goal = 0

    for (let team_num of team_nums)
    {
        // fetch list of all events in the year
        fetch(`https://www.thebluealliance.com/api/v3/team/frc${team_num}/years_participated${build_query({[TBA_AUTH_KEY]: TBA_KEY})}`)
            .then(response => {
                if (response.status === 401) {
                    alert('Invalid API Key Suspected')
                }
                return response.json()
            })
            .then(years => {
                goal += years.length * 2
                for (let year of years)
                {
                    let modifier = ''
                    if (year > 2015)
                    {
                        modifier = '_robot'
                    }
                    if (year > 2021)
                    {
                        modifier = `_${team_num}${modifier}`
                    }
                    let title = `${year} - ${team_num}`
                    robots[title] = {
                        code: `https://github.com/wildstang/${year}${modifier}_software`,
                        photos: [],
                        awards: {}
                    }
                    
                    // fetch list of team-year's awards
                    fetch(`https://www.thebluealliance.com/api/v3/team/frc${team_num}/awards/${year}${build_query({[TBA_AUTH_KEY]: TBA_KEY})}`)
                        .then(response => {
                            if (response.status === 401) {
                                alert('Invalid API Key Suspected')
                            }
                            return response.json()
                        })
                        .then(awards => {
                            for (let award of awards)
                            {
                                if (!robots[title].awards.hasOwnProperty(award.event_key))
                                {
                                    robots[title].awards[award.event_key] = []
                                }
                                robots[title].awards[award.event_key].push({
                                    type: award.award_type,
                                    name: award.name
                                })
                            }

                            if (++count === goal)
                            {
                                build_cards(robots)
                            }
                        })
                        .catch(err => {
                            console.log(`Error fetching ${year} awards, ${err}`)
                        })
                    
                    // fetch list of team-year's media
                    fetch(`https://www.thebluealliance.com/api/v3/team/frc${team_num}/media/${year}${build_query({[TBA_AUTH_KEY]: TBA_KEY})}`)
                        .then(response => {
                            if (response.status === 401) {
                                alert('Invalid API Key Suspected')
                            }
                            return response.json()
                        })
                        .then(media => {
                            for (let m of media)
                            {
                                if (m.type === 'imgur' || m.type === 'cdphotothread')
                                {
                                    robots[title].photos.push(m.direct_url)
                                }
                            }

                            if (++count === goal)
                            {
                                build_cards(robots)
                            }
                        })
                        .catch(err => {
                            console.log(`Error fetching ${year} media, ${err}`)
                        })
                }
            })
            .catch(err => {
                console.log(`Error fetching ${year} events, ${err}`)
            })
    }
}

/**
 * function:    build_cards
 * parameters:  array of robot info
 * returns:     none
 * description: Builds a card for each robot.
 */
function build_cards(robots)
{
    let left_cards = []
    let right_cards = []
    let left = true
    let years = Object.keys(robots)
    years.sort((a, b) => b.localeCompare(a))
    for (let year of years)
    {
        let parts = year.split(' - ')
        let image = `No pictures found. <a href="https://www.thebluealliance.com/suggest/team/media?team_key=frc${parts[1]}&year=${parts[0]}">Add one to TBA.</a>`
        if (robots[year].photos.length > 0)
        {
            image = `<img src="${robots[year].photos[0]}" height="400px">`
        }
        let code = `<a href="${robots[year].code}">Source Code</a>`
        let tba = `<a href="https://www.thebluealliance.com/team/${parts[1]}/${parts[0]}">Season Stats</a>`
        let awards = ''
        let events = Object.keys(robots[year].awards)
        for (let event of events)
        {
            let event_awards = robots[year].awards[event]
            awards += `<br><b>${event}</b><br>`
            awards += event_awards.map(a => a.name).join('<br>')
        }
        let card = new Card(year, `<h1>${year}</h1>${image}<div class="card_body"><div class="links">${code}${tba}</div><div class="awards">${awards}</div></div>`)
        card.add_class('profile')
        if (left)
        {
            left_cards.push(card)
        }
        else
        {
            right_cards.push(card)
        }
        left = !left
    }

    document.body.innerHTML += new PageFrame('', '', [new ColumnFrame('', '', left_cards), new ColumnFrame('', '', right_cards)]).toString
}