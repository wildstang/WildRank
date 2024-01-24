/**
 * file:        data.js
 * description: Contains the DAL class which loads in all data and computes stats.                          
 * author:      Liam Fruzyna
 * date:        2022-04-30
 */

include('libs/Vibrant.min')

class DAL
{
    constructor(event_id)
    {
        this.event_id = event_id
        this.year = event_id.substr(0,4)
        this.alliance_size = 0
        this.max_alliance_size = 0

        // data structures
        this.meta = {}
        this.teams = {}
        this.matches = {}
        this.picklists = {}
        this.event = {}
    }

    /**
     * function:    load_config
     * parameters:  scouting mode
     * returns:     none
     * description: Populate the meta data structure for a scouting config.
     */
    load_config(mode)
    {
        // go over each input in config
        let config = cfg[mode]
        let prefix = `${mode}.`
        if (mode === MATCH_MODE || mode === NOTE_MODE)
        {
            prefix = 'results.'
        }
        if (config != null)
        {
            let meta = {}

            for (let page of config)
            {
                for (let column of page.columns)
                {
                    // add the cycle column as an input
                    let cycle = column.cycle
                    if (cycle)
                    {
                        meta[prefix + column.id] = {
                            name: column.name,
                            type: 'cycle',
                            negative: false,
                            options: [],
                            options_index: [],
                            cycle: cycle
                        }
                        cycle = column.id
                    }
                    for (let input of column.inputs)
                    {
                        let id = input.id
                        let name = input.name
                        let type = input.type
                        let ops = input.options
                        let neg = input.negative

                        // make sure no values are missing / empty
                        if (typeof neg === 'undefined')
                        {
                            if (type === 'select' || type === 'multiselect' || type === 'dropdown' || type === 'multicounter')
                            {
                                neg = new Array(ops.length).fill(false)
                            }
                            else
                            {
                                neg = false
                            }
                        }
                        if (type === 'checkbox')
                        {
                            ops = ['No', 'Yes']
                        }
                        if (typeof ops === 'undefined')
                        {
                            ops = []
                        }

                        // add each counter in a multicounter
                        if (type === 'multicounter')
                        {
                            for (let i in ops)
                            {
                                meta[`${prefix}${id}_${ops[i].toLowerCase()}`] = {
                                    name: `${name} ${ops[i]}`,
                                    type: 'counter',
                                    negative: neg[i],
                                    options: [],
                                    options_index: [],
                                    cycle: cycle
                                }
                            }
                        }
                        else if (type === 'multiselect')
                        {
                            for (let i in ops)
                            {
                                meta[`${prefix}${id}_${ops[i].toLowerCase()}`] = {
                                    name: `${name} ${ops[i]}`,
                                    type: 'checkbox',
                                    negative: neg[i],
                                    options: ['No', 'Yes'],
                                    options_index: [],
                                    cycle: cycle
                                }
                            }
                        }
                        else
                        {
                            meta[prefix + id] = {
                                name: name,
                                type: type,
                                negative: neg,
                                options: ops,
                                options_index: Object.keys(ops),
                                cycle: cycle
                            }
                        }
                    }
                }
            }
            
            // add on smart stats
            if (mode == MATCH_MODE)
            {
                let stats = cfg.smart_stats
                for (let stat of stats)
                {
                    let neg = stat.negative
                    if (typeof neg === 'undefined')
                    {
                        neg = false
                    }
            
                    let type = 'number'
                    if (stat.type === 'min' || stat.type === 'max')
                    {
                        type = 'string'
                    }

                    meta[prefix + stat.id] = {
                        name: stat.name,
                        type: type,
                        negative: neg,
                        options: [],
                        options_index: [],
                        cycle: stat.type === 'count'
                    }
                }
            }

            this.meta = Object.assign(this.meta, meta)
        }
    }

    /**
     * function:    get_keys
     * parameters:  toggles for each section of data, types to filter by
     * returns:     none
     * description: Return a list of all single team keys, with filters.
     */
    get_keys(include_stats=true, include_pit=true, include_ranking=true, include_meta=true, types=[], include_strings=true)
    {
        let keys = Object.keys(this.meta).filter(k => !k.startsWith('results.'))
        if (!include_stats)
        {
            keys = keys.filter(k => !k.startsWith('stats.'))
        }
        if (!include_pit)
        {
            keys = keys.filter(k => !k.startsWith('pit.'))
        }
        if (!include_ranking)
        {
            keys = keys.filter(k => !k.startsWith('rank.'))
        }
        if (!include_meta)
        {
            keys = keys.filter(k => !k.startsWith('meta.'))
        }
        if (types.length > 0)
        {
            keys = keys.filter(k => types.includes(this.meta[k].type))
        }
        if (!include_strings)
        {
            keys = keys.filter(k => this.meta[k].type !== 'string' && this.meta[k].type !== 'text')
        }
        return keys
    }

    /**
     * function:    get_placeholder_keys
     * parameters:  none
     * returns:     none
     * description: Return a list of all single team keys with placeholders.
     */
    get_placeholder_keys()
    {
        return this.get_keys(true, false, false, false).filter(k => find_team_placeholders(k).length > 0)
    }

    /**
     * function:    get_results_keys
     * parameters:  if cycles should be searched, types to filter by
     * returns:     none
     * description: Return a list of all result team keys, with filters.
     */
    get_result_keys(cycle=true, types=[])
    {
        let keys = Object.keys(this.meta).filter(k => k.startsWith('results.'))
        if (!cycle)
        {
            keys = keys.filter(k => typeof this.meta[k].cycle === 'undefined' || this.meta[k].cycle === false)
        }
        else if (cycle !== true)
        {
            keys = keys.filter(k => this.meta[k].cycle === cycle)
        }
        if (types.length > 0)
        {
            keys = keys.filter(k => types.includes(this.meta[k].type))
        }
        return keys
    }

    /**
     * function:    get_results
     * parameters:  teams to filter by, sort matches
     * returns:     list of matches
     * description: Returns a list of matches sorted first by match then position.
     */
    get_results(teams=[], sort=true)
    {
        // build flat list of matches
        let results = []
        for (let team_num in this.teams)
        {
            if (teams.length === 0 || teams.includes(team_num))
            {
                results = results.concat(this.teams[team_num].results)
            }
        }

        if (sort)
        {
            // sort matches first by comp level, then match number, then set number, and finally position
            results.sort(function (a, b)
            {
                if (a.meta_comp_level !== b.meta_comp_level)
                {
                    if (a.meta_comp_level === 'qm')
                    {
                        return -1
                    }
                    else if (b.meta_comp_level === 'qm')
                    {
                        return 1
                    }
                    else if (a.meta_comp_level === 'ef')
                    {
                        return -1
                    }
                    else if (b.meta_comp_level === 'ef')
                    {
                        return 1
                    }
                    else if (a.meta_comp_level === 'qf')
                    {
                        return -1
                    }
                    else if (b.meta_comp_level === 'qf')
                    {
                        return 1
                    }
                    else if (a.meta_comp_level === 'sf')
                    {
                        return -1
                    }
                    else if (b.meta_comp_level === 'sf')
                    {
                        return 1
                    }
                }
                else if (a.meta_match !== b.meta_match)
                {
                    return a.meta_match - b.meta_match
                }
                else if (a.meta_set_number !== b.meta_set_number)
                {
                    return a.meta_set_number - b.meta_set_number
                }
                return a.meta_position - b.meta_position
            })
        }
        
        return results
    }

    /**
     * function:    get_result_keys
     * parameters:  teams to filter by, sort matches
     * returns:     list of match keys
     * description: Returns a list of match keys sorted first by match then position.
     */
    get_result_names(teams=[], sort=true)
    {
        let results = this.get_results(teams, sort)
        return results.map(r => `${r.meta_match_key}-${r.meta_team}`)
    }

    /**
     * function:    get_pits
     * parameters:  teams to filter by, sort pits
     * returns:     none
     * description: Returns a list of pits sorted by team.
     */
    get_pits(teams=[], sort=true)
    {
        // build flat list of matches
        let results = []
        for (let team_num in this.teams)
        {
            if ((teams.length === 0 || teams.includes(team_num)) && this.is_pit_scouted(team_num))
            {
                results = results.concat(this.teams[team_num].pit)
            }
        }

        if (sort)
        {
            results.sort((a, b) => a.meta_team - b.meta_team)
        }
        
        return results
    }

    /**
     * function:    get_match_teams
     * parameters:  match key
     * returns:     none
     * description: Returns a map of positions to team keys for a given match.
     */
    get_match_teams(match_key)
    {
        let red_teams = this.get_match_value(match_key, 'red_alliance')
        let blue_teams = this.get_match_value(match_key, 'blue_alliance')
        let teams = {}
        for (let i in red_teams)
        {
            teams[`red_${i}`] = red_teams[i]
        }
        for (let i in blue_teams)
        {
            teams[`blue_${i}`] = blue_teams[i]
        }
        return teams
    }

    /**
     * function:    get_team_keys
     * parameters:  none
     * returns:     none
     * description: Returns a map of position keys to names.
     */
    get_team_keys()
    {
        let positions = {}
        for (let i = 0; i < this.max_alliance_size; i++)
        {
            positions[`red_${i}`] = `Red ${i+1}`
        }
        for (let i = 0; i < this.max_alliance_size; i++)
        {
            positions[`blue_${i}`] = `Blue ${i+1}`
        }
        return positions
    }

    /**
     * function:    build_teams
     * parameters:  print times
     * returns:     teams data structure
     * description: Build the teams data structure and return.
     */
    build_teams(debug=false)
    {
        let start = Date.now()

        // load in teams
        let teams_str = localStorage.getItem(`teams-${this.event_id}`)
        if (teams_str != null && teams_str != false)
        {
            let tba_teams = JSON.parse(teams_str)
            for (let team of tba_teams)
            {
                // build core data structure
                let team_num = team.team_number.toString()
                this.teams[team_num] = {
                    meta: {},
                    rank: {},
                    pit: {},
                    stats: {},
                    matches: [],
                    results: [],
                    pictures: {}
                }

                // add meta data
                this.teams[team_num].meta = {
                    name: team.nickname,
                    city: team.city,
                    state_prov: team.state_prov,
                    country: team.country,
                    color: cfg.theme['primary-color']
                }
            }

            // build meta of meta
            this.meta['meta.name'] = {
                name: 'Team Name',
                type: 'string'
            }
            this.meta['meta.city'] = {
                name: 'City',
                type: 'string'
            }
            this.meta['meta.state_prov'] = {
                name: 'State',
                type: 'string'
            }
            this.meta['meta.country'] = {
                name: 'Country',
                type: 'string'
            }
        }
        else
        {
            // attempt to get teams from matches
            this.pull_teams_from_matches()
        }
        
        // fail if there were no teams
        if (Object.keys(this.teams).length === 0)
        {
            console.log('No event teams found!')
            return
        }

        let start_rankings = Date.now()

        // load in rankings
        let ranks_str = localStorage.getItem(`rankings-${this.event_id}`)
        if (ranks_str != null && ranks_str != false)
        {
            let tba_ranks = JSON.parse(ranks_str)
            // add ranking data
            for (let team of tba_ranks)
            {
                let team_num = team.team_key.substring(3)
                this.teams[team_num].rank.rank = team.rank
                this.teams[team_num].rank.wins = team.record.wins
                this.teams[team_num].rank.losses = team.record.losses
                this.teams[team_num].rank.ties = team.record.ties
                this.teams[team_num].rank.ranking_points = team.extra_stats[0]
                this.teams[team_num].rank.ranking_score = team.sort_orders[0]
                this.teams[team_num].rank.tie_breaker = team.sort_orders[1]
            }

            // build meta of ranking data
            this.meta['rank.rank'] = {
                name: 'Ranking',
                type: 'number',
                negative: true
            }
            this.meta['rank.wins'] = {
                name: 'Wins',
                type: 'number'
            }
            this.meta['rank.losses'] = {
                name: 'Losses',
                type: 'number',
                negative: true
            }
            this.meta['rank.ties'] = {
                name: 'Ties',
                type: 'number'
            }
            this.meta['rank.ranking_points'] = {
                name: 'Ranking Points',
                type: 'number'
            }
            this.meta['rank.ranking_score'] = {
                name: 'Ranking Score',
                type: 'number'
            }
            this.meta['rank.tie_breaker'] = {
                name: 'Tie Breaker',
                type: 'number'
            }
        }

        // load in event
        let start_event = Date.now()
        let event_str = localStorage.getItem(`event-${this.event_id}`)
        if (event_str != null && event_str != false)
        {
            this.event = JSON.parse(event_str)
        }

        // load in matches
        let start_matches = Date.now()
        // add match data
        if (Object.keys(this.matches).length === 0)
        {
            this.build_matches()
        }
        
        for (let match_key in this.matches)
        {
            let match = this.matches[match_key]
            for (let team of match.red_alliance)
            {
                if (Object.keys(this.teams).includes(team))
                {
                    this.teams[team].matches.push({
                        key: match_key,
                        comp_level: match.comp_level,
                        set_number: match.set_number,
                        match_number: match.match_number,
                        alliance: 'red'
                    })
                }
            }
            for (let team of match.blue_alliance)
            {
                if (Object.keys(this.teams).includes(team))
                {
                    this.teams[team].matches.push({
                        key: match_key,
                        comp_level: match.comp_level,
                        set_number: match.set_number,
                        match_number: match.match_number,
                        alliance: 'blue'
                    })
                }
            }
        }

        // find pictures
        let start_pictures = Date.now()
        let pics_str = localStorage.getItem(`photos-${this.event_id}`)
        let pics = {}
        if (pics_str != null && pics_str != false)
        {
            pics = JSON.parse(pics_str)
        }

        let teams = Object.keys(this.teams)
        for (let team of teams)
        {
            let avatar = localStorage.getItem(`avatar-${this.year}-${team}`)
            if (avatar === null || avatar === 'undefined')
            {
                avatar = 'assets/dozer.png'
            }
            else
            {
                avatar = `data:image/png;base64,${avatar}`

                // pull out color from avatar
                let img = document.createElement('img')
                img.setAttribute('src', avatar)
                img.addEventListener('load', () => {
                    try {
                        let vibrant = new Vibrant(img)
                        let color = vibrant.swatches().Vibrant
                        if (typeof color !== 'undefined')
                        {
                            this.teams[team].meta.color = `#${to_hex(color.rgb[0])}${to_hex(color.rgb[1])}${to_hex(color.rgb[2])}`
                        }
                    }
                    catch {}
                })
            }

            let photos = []
            if (Object.keys(pics).includes(team))
            {
                photos = pics[team]
            }

            this.teams[team].pictures = {
                avatar: avatar,
                photos: photos
            }
        }

        // load in pit results
        let start_pits = Date.now()
        let files = Object.keys(localStorage)
        // populate meta
        this.load_config(PIT_MODE)

        // add pit results
        let pit_files = files.filter(f => f.startsWith(`pit-${this.event_id}`))
        for (let file of pit_files)
        {
            let pit = JSON.parse(localStorage.getItem(file))
            let team = pit.meta_team.toString()
            if (teams.includes(team))
            {
                this.teams[team].pit = pit
            }
        }

        // load in match results
        let start_results = Date.now()
        // populate meta
        this.load_config(MATCH_MODE)
        this.load_config(NOTE_MODE)

        // add match results
        let stats = cfg.smart_stats
        let match_files = files.filter(f => f.startsWith(`match-${this.event_id}`))
        for (let file of match_files)
        {
            let match = JSON.parse(localStorage.getItem(file))
            let team = match.meta_team.toString()

            // add match key to pre-WR2 results
            if (!match.hasOwnProperty('meta_match_key') && match.hasOwnProperty('meta_match') && match.hasOwnProperty('meta_event_id'))
            {
                match.meta_match_key = `${match.meta_event_id}_qm${match.meta_match}`
            }
            if (!match.hasOwnProperty('meta_comp_level') && match.hasOwnProperty('meta_match_key'))
            {
                match.meta_comp_level = 'qm'
            }
            if (!match.hasOwnProperty('meta_set_number') && match.hasOwnProperty('meta_match_key'))
            {
                match.meta_set_number = 1
            }

            // add notes if available
            let note_file = file.replace(MATCH_MODE, NOTE_MODE)
            if (files.includes(note_file))
            {
                let note = JSON.parse(localStorage.getItem(note_file))
                match = Object.assign(note, match)
                match.meta_both_scouted = true
            }
            else
            {
                match.meta_both_scouted = false
            }

            // only add team if it is in the team list
            if (teams.includes(team))
            {
                // add TBA data to results
                // TODO: do this the "right" way be adding it as a separate section and supporting that
                if (this.matches.hasOwnProperty(match.meta_match_key))
                {
                    let match_info = this.matches[match.meta_match_key]
                    if (match_info.hasOwnProperty('red_score') && match_info.red_score >= 0 &&
                        match_info.hasOwnProperty('blue_score') && match_info.blue_score >= 0)
                    {
                        if (match_info.blue_alliance.includes(team))
                        {
                            match.meta_score = match_info.blue_score
                            match.meta_opp_score = match_info.red_score
                            match.meta_driver_station = match_info.blue_alliance.indexOf(team)
                            if (match_info.score_breakdown !== null)
                            {
                                for (let key in match_info.score_breakdown.blue)
                                {
                                    match[`meta_${key.toLowerCase()}`] = match_info.score_breakdown.blue[key]
                                }
                                for (let key in match_info.score_breakdown.red)
                                {
                                    match[`meta_opp_${key.toLowerCase()}`] = match_info.score_breakdown.red[key]
                                }
                            }
                        }
                        else if (match_info.red_alliance.includes(team))
                        {
                            match.meta_score = match_info.red_score
                            match.meta_opp_score = match_info.blue_score
                            match.meta_driver_station = match_info.red_alliance.indexOf(team)
                            if (match_info.score_breakdown !== null)
                            {
                                for (let key in match_info.score_breakdown.red)
                                {
                                    match[`meta_${key.toLowerCase()}`] = match_info.score_breakdown.red[key]
                                }
                                for (let key in match_info.score_breakdown.blue)
                                {
                                    match[`meta_opp_${key.toLowerCase()}`] = match_info.score_breakdown.blue[key]
                                }
                            }
                        }
                    }
                }

                // add smart stats, then add to results
                this.teams[team].results.push(this.add_smart_stats(match, stats))
            }
        }
        // add remaining notes
        let note_files = files.filter(f => f.startsWith(`note-${this.event_id}`))
        for (let file of note_files)
        {
            let match = JSON.parse(localStorage.getItem(file))
            let team = match.meta_team.toString()
            if (teams.includes(team))
            {
                if (!this.teams[team].results.some(m => m.meta_match_key === match.meta_match_key))
                {
                    match.meta_both_scouted = false
                    this.teams[team].results.push(this.add_smart_stats(match, stats))
                }
            }
        }

        // build in stats
        let start_stats = Date.now()
        let keys = Object.keys(this.meta).filter(k => k.startsWith('results.'))
        for (let key of keys)
        {
            if (!this.meta[key].cycle)
            {
                // compute stats for each match results
                let teams = Object.keys(this.teams)
                for (let team of teams)
                {
                    this.compute_stat(team, key)
                }

                // add stats to meta
                let k = key.replace('results.', 'stats.')
                this.meta[k] = this.meta[key]
            }
        }

        // load in picklists
        let start_lists = Date.now()
        let lists_str = localStorage.getItem(`picklists-${this.event_id}`)
        if (lists_str != null && lists_str != false)
        {
            this.picklists = JSON.parse(lists_str)
        }
        let end = Date.now()

        // print times to load
        if (debug)
        {
            console.log('Meta', start_rankings - start)
            console.log('Rankings', start_event - start_rankings)
            console.log('Events', start_matches - start_event)
            console.log('Matches', start_pictures - start_matches)
            console.log('Pictures', start_pits - start_pictures)
            console.log('Pits', start_results - start_pits)
            console.log('Results', start_stats - start_results)
            console.log('Stats', start_lists - start_stats)
            console.log('Picklists', end - start_lists)
            console.log('Total', end - start)
        }

        return this.teams
    }

    /**
     * function:    pull_teams_from_matches
     * parameters:  none
     * returns:     none
     * description: Build the teams data structure from match data.
     */
    pull_teams_from_matches()
    {
        // read in matches
        let matches_str = localStorage.getItem(`matches-${this.event_id}`)
        if (matches_str != null && matches_str != false)
        {
            let tba_matches = JSON.parse(matches_str)
            
            for (let match of tba_matches)
            {
                let match_teams = match.alliances.red.team_keys.map(k => k.substring(3)).concat(match.alliances.blue.team_keys.map(k => k.substring(3)))
                for (let team of match_teams)
                {
                    if (!Object.keys(this.teams).includes(team))
                    {
                        this.teams[team] = {
                            meta: {},
                            rank: {},
                            pit: {},
                            stats: {},
                            matches: [],
                            results: [],
                            pictures: {}
                        }

                        // add meta data
                        this.teams[team].meta = {
                            name: `Team #${team}`,
                            city: 'Unknown',
                            state_prov: 'Unknown',
                            country: 'Unknown',
                            color: cfg.theme['primary-color']
                        }
                    }
                }
            }
        
            // build meta of meta
            this.meta['meta.name'] = {
                name: 'Team Name',
                type: 'string'
            }
            this.meta['meta.city'] = {
                name: 'City',
                type: 'string'
            }
            this.meta['meta.state_prov'] = {
                name: 'State',
                type: 'string'
            }
            this.meta['meta.country'] = {
                name: 'Country',
                type: 'string'
            }
        }
    }

    /**
     * function:    generate_score
     * parameters:  match key
     * returns:     Score element
     * description: Generates HTML elements to display the score of a given match.
     */
    generate_score(match_key)
    {
        let span = document.createElement('span')
        let red = dal.get_match_value(match_key, 'red_score')
        let blue = dal.get_match_value(match_key, 'blue_score')
        if (red !== '' && blue !== '' && red >= 0 && blue >= 0)
        {
            let red_score = document.createElement('span')
            red_score.innerText = red
            red_score.className = 'red'
            let blue_score =  document.createElement('span')
            blue_score.innerText = blue
            blue_score.className = 'blue'
            if (dal.get_match_value(match_key, 'winner') === 'red')
            {
                span.append(red_score, ' - ', blue_score)
            }
            else
            {
                span.append(blue_score, ' - ', red_score)
            }
        }
        return span
    }

    /**
     * function:    build_matches
     * parameters:  none
     * returns:     none
     * description: Build the matches data structure.
     */
    build_matches()
    {
        // read in matches
        let matches_str = localStorage.getItem(`matches-${this.event_id}`)
        if (matches_str != null && matches_str != false)
        {
            let tba_matches = JSON.parse(matches_str)
            // pull necessary data into data structure
            for (let match of tba_matches)
            {
                let match_name = ''
                let short_match_name = ''
                if (match.comp_level === 'qm')
                {
                    match_name = `Qual ${match.match_number}`
                    short_match_name = `${match.match_number}`
                }
                else if (match.comp_level === 'cm')
                {
                    match_name = `Custom ${match.match_number}`
                    short_match_name = `C${match.match_number}`
                }
                // convert TBA structure to double-elim
                else if (this.event.playoff_type === 10)
                {
                    switch (match.comp_level)
                    {
                        case 'sf':
                            let round = 1
                            let match_num = match.set_number
                            if (match_num > 4 && match_num <= 8)
                            {
                                round = 2
                            }
                            else if (match_num === 9 || match_num === 10)
                            {
                                round = 3
                            }
                            else if (match_num === 11 || match_num === 12)
                            {
                                round = 4
                            }
                            else if (match_num === 13)
                            {
                                round = 5
                            }
                            match_name = `Round ${round} Match ${match_num}`
                            short_match_name = `M${match_num}`
                            break
                        case 'f':
                            match_name = `Final ${match.match_number}`
                            short_match_name = `F${match.match_number}`
                            break
                    }
                }
                else
                {
                    match_name = `${match.comp_level.toUpperCase()} ${match.set_number}-${match.match_number}`
                    short_match_name = `${match.comp_level.toUpperCase()}${match.set_number}${match.match_number}`
                }

                let display_time = ''
                if (match.actual_time > 0)
                {
                    display_time = `${unix_to_match_time(match.actual_time)}`
                }
                else if (match.predicted_time > 0)
                {
                    display_time = `${unix_to_match_time(match.predicted_time)} (Projected)`
                }
                else if (match.time > 0)
                {
                    display_time = `${unix_to_match_time(match.time)} (Scheduled)`
                }

                let score_str = ''
                let complete = false
                let winner = match.winning_alliance
                if (match.alliances.red.score !== '' && match.alliances.blue.score !== '' && match.alliances.red.score >= 0 && match.alliances.blue.score >= 0)
                {
                    complete = true
                    if (winner === '')
                    {
                        winner = 'tie'
                    }
                }
                this.matches[match.key] = {
                    match_name: match_name,
                    short_match_name: short_match_name,
                    comp_level: match.comp_level,
                    set_number: match.set_number,
                    match_number: match.match_number,
                    scheduled_time: match.time,
                    predicted_time: match.predicted_time,
                    started_time: match.actual_time,
                    display_time: display_time,
                    red_alliance: match.alliances.red.team_keys.map(k => k.substring(3)),
                    blue_alliance: match.alliances.blue.team_keys.map(k => k.substring(3)),
                    complete: complete,
                    red_score: match.alliances.red.score,
                    blue_score: match.alliances.blue.score,
                    score_str: score_str,
                    videos: match.videos,
                    score_breakdown: match.score_breakdown,
                    winner: winner
                }
                if (this.matches[match.key].red_alliance.length > this.max_alliance_size)
                {
                    this.max_alliance_size = this.matches[match.key].red_alliance.length
                }
                if (this.matches[match.key].blue_alliance.length > this.max_alliance_size)
                {
                    this.max_alliance_size = this.matches[match.key].blue_alliance.length
                }
            }

            let matches = Object.values(this.matches)
            if (this.matches.hasOwnProperty(`${this.event_id}_qm1`))
            {
                this.alliance_size = this.matches[`${this.event_id}_qm1`].red_alliance.length
            }
            else if (matches.length > 0)
            {
                this.alliance_size = matches[0].red_alliance.length
            }
        }
        
        if (Object.keys(this.matches).length === 0)
        {
            console.log('No event matches found!')
        }
    }

    /**
     * function:    add_smart_stats
     * parameters:  result to add to, stats to add
     * returns:     return modified result
     * description: Add given smart stats to a given match.
     */
    add_smart_stats(result, stats)
    {
        for (let stat of stats)
        {
            let id = stat.id
            switch (stat.type)
            {
                case 'sum':
                    let total = 0
                    for (let k of stat.keys)
                    {
                        if (!result.hasOwnProperty(k))
                        {
                            break
                        }
                        total += result[k]
                    }
                    result[id] = total
                    break
                case 'math':
                    let math_fn = stat.math
                    // pull constants first so they aren't picked up as 2 keys
                    let constants = math_fn.match(/[a-z]+\.[a-z0-9_]+/g)
                    if (constants)
                    {
                        let team = result['meta_team']
                        for (let c of constants)
                        {
                            let parts = c.split('.')
                            if (this.teams[team].hasOwnProperty(parts[0]) && this.teams[team][parts[0]].hasOwnProperty(parts[1]))
                            {
                                math_fn = math_fn.replace(c, this.get_value(team, c))
                            }
                        }
                    }
                    let keys = math_fn.match(/[a-z][a-z0-9_]+/g)
                    if (keys)
                    {
                        for (let k of keys)
                        {
                            if (result.hasOwnProperty(k))
                            {
                                math_fn = math_fn.replace(k, result[k])
                            }
                        }
                    }
                    try
                    {
                        result[id] = eval(math_fn)
                    }
                    // if the JS is not valid just make it 0
                    catch (err)
                    {
                        result[id] = 0
                    }
                    break
                case 'percent':
                    if (result.hasOwnProperty(stat.numerator) && result.hasOwnProperty(stat.denominator))
                    {
                        result[id] = result[stat.numerator] / (result[stat.numerator] + result[stat.denominator])
                        if (isNaN(result[id]))
                        {
                            result[id] = 0
                        }
                    }
                    break
                case 'ratio':
                    if (result.hasOwnProperty(stat.numerator) && result.hasOwnProperty(stat.denominator))
                    {
                        if (result[stat.denominator] != 0)
                        {
                            result[id] = result[stat.numerator] / result[stat.denominator]
                        }
                        else
                        {
                            result[id] = result[stat.numerator]
                        }
                    }
                    break
                // exclusively for cycle
                case 'where':
                    let count = typeof stat.sum === 'undefined' || !stat.sum
                    let value = 0
                    let denominator = 0
                    let percent = typeof stat.denominator !== 'undefined'
                    if (stat.cycle && result.hasOwnProperty(stat.cycle))
                    {
                        for (let cycle of result[stat.cycle])
                        {
                            if (typeof cycle === 'undefined')
                            {
                                break
                            }
                            let passed = true
                            for (let key of Object.keys(stat.conditions))
                            {
                                if (cycle.hasOwnProperty(key))
                                {
                                    if (this.meta['results.' + key].type === 'checkbox')
                                    {
                                        if (stat.conditions[key] !== cycle[key])
                                        {
                                            passed = false
                                        }
                                    }
                                    else if (cycle[key] !== this.meta['results.' + key].options.indexOf(stat.conditions[key]))
                                    {
                                        passed = false
                                    }
                                }
                            }
                            if (passed)
                            {
                                if (count)
                                {
                                    value++
                                }
                                else if (cycle.hasOwnProperty(stat.sum))
                                {
                                    value += cycle[stat.sum]
                                }
                                if (percent && cycle.hasOwnProperty(stat.denominator))
                                {
                                    denominator += cycle[stat.denominator]
                                }
                            }
                        }
                    }

                    // store smart stat
                    if (percent)
                    {
                        result[id] = value / (value + denominator)
                        if (isNaN(result[id]))
                        {
                            result[id] = 0
                        }
                    }
                    else
                    {
                        result[id] = value
                    }
                    break
                case 'min':
                case 'max':
                    let extreme = [stat.keys[0]]
                    for (let k of stat.keys)
                    {
                        if (!result.hasOwnProperty(k))
                        {
                            break
                        }
                        if (stat.type === 'min' && result[k] < result[extreme[0]])
                        {
                            extreme = [k]
                        }
                        if (stat.type === 'max' && result[k] > result[extreme[0]])
                        {
                            extreme = [k]
                        }
                        else if (result[k] === result[extreme[0]] && k != stat.keys[0])
                        {
                            extreme.push(k)
                        }
                    }
                    result[id] = extreme.map(k => this.get_name(k, '')).join(', ')
                    break
                case 'filter':
                    if (result.hasOwnProperty(stat.filter) && result.hasOwnProperty(stat.key))
                    {
                        let val = result[stat.filter]
                        let passes = false
                        switch (stat.compare_type)
                        {
                            case 0:
                                passes = val > stat.value
                                break
                            case 1:
                                passes = val >= stat.value
                                break
                            case 2:
                                passes = val === stat.value
                                break
                            case 3:
                                passes = val !== stat.value
                                break
                            case 4:
                                passes = val <= stat.value
                                break
                            case 5:
                                passes = val < stat.value
                                break
                        }
                        if (passes)
                        {
                            result[id] = result[stat.key]
                        }
                        else
                        {
                            delete result[id]
                        }
                    }
                    break
                case 'wrank':
                    /**
                     * This stat is a special case, but I am building it to be as flexible as possible.
                     * To calculate Thee WildRank we first need to compute a ranking offset for each match.
                     * That is the average partner ranking minus the expected partner ranking.
                     * Then we add that difference to the team's ranking for the current match to get the weight rank.
                     * When these rated ranks are averaged we get the WildRank.
                     * Technically this smart stat mode can be used with any numeric stat, however,
                     * if that stat isn't a number 1 -> alliance_size it will likely produce meaningless values.
                     */
                    if (result.hasOwnProperty(stat.stat))
                    {
                        // determine each partner's event average
                        let partner_vals = []
                        let teams = this.get_match_teams(result.meta_match_key)
                        for (let i = 0; i < this.alliance_size; i++)
                        {
                            if (i != result.meta_position)
                            {
                                let team = teams[`${result.meta_alliance}_${i}`]
                                partner_vals.push(dal.teams[team].stats[`${stat.stat}.mean`])
                            }
                        }

                        // calculate the weighted stat
                        let num_partners = partner_vals.length
                        let expected_average_ranking = (num_partners / 2 + 1) * num_partners
                        let average_ranking = partner_vals.reduce((a, b) => a + b, 0)
                        result.meta_wildrank_partner_weight = average_ranking - expected_average_ranking
                        result[id] = result[stat.stat] + result.meta_wildrank_partner_weight

                        if (isNaN(result[id]))
                        {
                            result[id] = 0
                        }
                    }
                    break
            }
        }
        return result
    }

    /**
     * function:    build_relative_alliances
     * parameters:  team number, match id
     * returns:     opponent and partner alliance team numbers
     * description: Builds an object with opponent and partner alliance team numbers.
     */
    build_relative_alliances(team_num, match_id)
    {
        let red = this.matches[match_id].red_alliance
        let blue = this.matches[match_id].blue_alliance
        let alliances = {}
        if (red.includes(team_num))
        {
            alliances['opponent'] = blue
            alliances['partner'] = red
        }
        else if (blue.includes(team_num))
        {
            alliances['opponent'] = red
            alliances['partner'] = blue
        }
        return alliances
    }

    /**
     * function:    find_matches
     * parameters:  two arrays of teams
     * returns:     match IDs of matching matches
     * description: Finds all matches where the given teams are in the alliances.
     */
    find_matches(alliance_a, alliance_b=[])
    {
        let matches = this.matches
        return Object.keys(matches).filter(function (m)
        {
            let red = matches[m].red_alliance
            let blue = matches[m].blue_alliance
            if (alliance_b.length > 0)
            {
                return (alliance_a.every(t => red.includes(t)) && alliance_b.every(t => blue.includes(t))) ||
                    (alliance_a.every(t => blue.includes(t)) && alliance_b.every(t => red.includes(t)))
            }
            else
            {
                return alliance_a.every(t => red.includes(t)) || alliance_a.every(t => blue.includes(t))
            }
        })
    }

    /**
     * function:    num_complete_matches
     * parameters:  none
     * returns:     the number of fully scouted matches
     * description: Determines how many matches have been completely scouted.
     */
    num_complete_matches()
    {
        let matches = Object.keys(this.matches)
        matches.sort((a, b) => this.get_match_value(a, 'scheduled_time') - this.get_match_value(b, 'scheduled_time'))
        let complete = 0
        for (let match of matches)
        {
            let teams = Object.values(this.get_match_teams(match))
            for (let team of teams)
            {
                if (!this.is_match_scouted(match, team))
                {
                    return complete
                }
            }
            complete++
        }
        return complete
    }

    /**
     * function:    num_quali_matches
     * parameters:  none
     * returns:     the number of qualification matches
     * description: Determines how many qualification matches are at the event.
     */
    num_quali_matches()
    {
        return Object.values(this.matches).filter(m => m.comp_level === 'qm').length
    }

    /**
     * function:    fill_team_numbers
     * parameters:  text to replace, opponent and partner teams
     * returns:     text with team numbers instead of keys
     * description: Replaces opponentX and partnerX with the appropriate team number.
     */
    fill_team_numbers(text, alliances)
    {
        if (typeof text !== 'string')
        {
            return text
        }
        let new_text = text
        let matches = find_team_placeholders(new_text)
        for (let match of matches)
        {
            if (match.length === 3)
            {
                let type = match[1]
                let idx = match[2] - 1
                if (alliances[type].length > idx)
                {
                    new_text = new_text.replace(match[0], alliances[type][idx])
                }
            }
        }
        return new_text
    }

    /**
     * function:    get_name
     * parameters:  id, stat to use if an option
     * returns:     friendly name for stat
     * description: Get the friendly name for a given stat.
     */
    get_name(id, stat='mean')
    {
        stat = stat.toLowerCase()
        // add stat only to stats and if provided
        if (id.startsWith('stats.') && stat !== '')
        {
            stat = stat.substring(0, 1).toUpperCase() + stat.substring(1)
            return `${stat} ${this.meta[id].name}`
        }
        else if (this.meta.hasOwnProperty(id))
        {
            return this.meta[id].name
        }
        else
        {
            if (id.includes('.'))
            {
                let parts = id.split('.')
                id = parts[1]
            }
            let parts = id.split('_')
            for (let i in parts)
            {
                parts[i] = parts[i].substring(0, 1).toUpperCase() + parts[i].substring(1)
            }
            return parts.join(' ')
        }
    }

    /**
     * function:    get_photo
     * parameters:  team number
     * returns:     src for team picture
     * description: Gets a picture of a given team's robot.
     */
    get_photo(team_num)
    {
        if (cfg.settings.use_images && this.teams.hasOwnProperty(team_num) && this.teams[team_num].pictures.hasOwnProperty('photos'))
        {
            let pics = this.teams[team_num].pictures.photos
            if (pics.length > 0)
            {
                return pics[0]
            }
        }
        return ''
    }

    /**
     * function:    get_photo_carousel
     * parameters:  team numbers
     * returns:     a carousel of images
     * description: Builds a carousel of a team's images.
     */
    get_photo_carousel(team_nums, width='500px')
    {
        let center = document.createElement('center')
        if (cfg.settings.use_images)
        {
            // if a single team string was given, put it in an array
            if (!Array.isArray(team_nums))
            {
                team_nums = [team_nums]
            }

            // add each team picture to the carousel
            let added = false
            let carousel = create_element('div', 'carousel')
            carousel.style.width = width
            carousel.classList.add('photo-carousel')

            for (let team_num of team_nums)
            {
                // don't add the team if it has no pictures
                if (this.teams.hasOwnProperty(team_num) && this.teams[team_num].pictures.hasOwnProperty('photos'))
                {
                    let pics = this.teams[team_num].pictures.photos
                    if (pics.length > 0)
                    {
                        added = true
                        for (let pic of pics)
                        {
                            let image = document.createElement('img')
                            image.src = pic
                            carousel.append(image)
                        }
                    }
                }
            }

            // return the carousel if any pictures were added
            if (added)
            {
                center.append(carousel)
            }
        }
        return center
    }

    /**
     * function:    add_photo
     * parameters:  team number, photo url, add to front of list
     * returns:     none
     * description: Adds a photo url to a team.
     */
    add_photo(team_num, url, front=false)
    {
        if (this.teams.hasOwnProperty(team_num))
        {
            if (!this.teams[team_num].pictures.hasOwnProperty('photos'))
            {
                this.teams[team_num].pictures.photos = []
            }
            if (!this.teams[team_num].pictures.photos.includes(url))
            {
                if (front)
                {
                    this.teams[team_num].pictures.photos.unshift(url)
                }
                else
                {
                    this.teams[team_num].pictures.photos.push(url)
                }
            }

            let photos = {}
            let teams = Object.keys(this.teams)
            for (let team of teams)
            {
                if (this.teams[team].pictures.hasOwnProperty('photos'))
                {
                    photos[team] = this.teams[team].pictures.photos
                }
            }
            localStorage.setItem(`photos-${this.event_id}`, JSON.stringify(photos))
        }
        return ''
    }

    /**
     * function:    get_rank_str
     * parameters:  team number
     * returns:     a string containing rank, ranking score, and record
     * description: Gets a friendly string containing important ranking information.
     */
    get_rank_str(team_num)
    {
        if (this.teams.hasOwnProperty(team_num) && this.teams[team_num].rank.hasOwnProperty('rank'))
        {
            let rank = this.teams[team_num].rank
            return `#${rank.rank} (${rank.ranking_score}, ${rank.wins}-${rank.losses}-${rank.ties})`
        }
        return ''
    }

    /**
     * function:    is_pit_scouted
     * parameters:  team number
     * returns:     if the given teams pit is scouted
     * description: Determines if the pit of a given team number has been scouted.
     */
    is_pit_scouted(team)
    {
        return this.teams.hasOwnProperty(team.toString()) && Object.keys(this.teams[team.toString()].pit).length > 0
    }

    /**
     * function:    is_match_scouted
     * parameters:  match key, team number
     * returns:     if the match for the given team is scouted
     * description: Determines if a match for a given team number has been scouted.
     */
    is_match_scouted(match_id, team)
    {
        let match_key = match_id.toLowerCase()
        if (!match_key.startsWith(this.event_id))
        {
            match_key = `${this.event_id}_${match_key}`
        }
        return this.teams.hasOwnProperty(team.toString()) && this.teams[team.toString()].results.some(r => r.meta_match_key === match_key && (r.meta_scout_mode === MATCH_MODE || r.meta_both_scouted))
    }

    /**
     * function:    is_note_scouted
     * parameters:  match key, team number
     * returns:     if the match for the given team is note scouted
     * description: Determines if a match for a given team number has been note scouted.
     */
    is_note_scouted(match_id, team)
    {
        let match_key = match_id.toLowerCase()
        if (!match_key.startsWith(this.event_id))
        {
            match_key = `${this.event_id}_${match_key}`
        }
        return this.teams.hasOwnProperty(team.toString()) && this.teams[team.toString()].results.some(r => r.meta_match_key === match_key && (r.meta_scout_mode === NOTE_MODE || r.meta_both_scouted))
    }

    /**
     * function:    is_both_scouted
     * parameters:  match key, team number
     * returns:     if the match for the given team is completely scouted
     * description: Determines if a match for a given team number has been completely scouted.
     */
    is_both_scouted(match_id, team)
    {
        let match_key = match_id.toLowerCase()
        if (!match_key.startsWith(this.event_id))
        {
            match_key = `${this.event_id}_${match_key}`
        }
        return this.teams.hasOwnProperty(team.toString()) && this.teams[team.toString()].results.some(r => r.meta_match_key === match_key && r.meta_both_scouted)
    }

    /**
     * function:    is_unsure
     * parameters:  team number
     * returns:     if any match results are unsure
     * description: Determines if any match results for a given team are unsure.
     */
    is_unsure(team)
    {
        for (let match of dal.teams[team].results)
        {
            if (match.meta_unsure)
            {
                return true
            }
        }
        return false
    }

    /**
     * function:    get_match_value
     * parameters:  match id, value id
     * returns:     requested value
     * description: Get a given single stat from the matches data structure
     */
    get_match_value(match_id, id)
    {
        let match_key = match_id.toLowerCase()
        if (!match_key.startsWith(this.event_id))
        {
            match_key = `${this.event_id}_${match_key}`
        }
        if (this.matches.hasOwnProperty(match_key) && this.matches[match_key].hasOwnProperty(id))
        {
            return this.matches[match_key][id]
        }
        return ''
    }

    /**
     * function:    get_result_value
     * parameters:  team number, match id, value id, if it should be a friendly value
     * returns:     requested value
     * description: Get a given single stat from a team's result data structure
     */
    get_result_value(team, match_id, id, map=false)
    {
        let match_key = match_id.toLowerCase()
        if (!match_key.startsWith(this.event_id))
        {
            match_key = `${this.event_id}_${match_key}`
        }
        if (id.includes('.'))
        {
            id = id.split('.')[1]
        }
        if (this.teams.hasOwnProperty(team.toString()))
        {
            let results = this.teams[team.toString()].results.filter(r => r.meta_match_key === match_key)
            if (results.length === 1 && results[0].hasOwnProperty(id))
            {
                let meta = this.meta['results.' + id]
                let val = results[0][id]
                if (map)
                {
                    // map to option if available
                    if ((id === 'meta_scouter_id' || id === 'meta_note_scouter_id') && map)
                    {
                        return cfg.get_name(val, false)
                    }
                    else if (typeof meta !== 'undefined' && typeof val === 'number' && meta.options && val < meta.options.length && (meta.type === 'dropdown' || meta.type === 'select'))
                    {
                        return meta.options[val]
                    }
                    // map numbers to 2 decimal places if they are at least that
                    else if (typeof val === 'number' && val % 1 !== 0)
                    {
                        return val.toFixed(2)
                    }
                    // map booleans to Yes/No
                    else if (typeof val === 'boolean')
                    {
                        return val ? 'Yes' : 'No'
                    }
                    else if (typeof meta !== 'undefined' && meta.cycle === true)
                    {
                        let string = ''
                        for (let i in val)
                        {
                            if (i > 0)
                            {
                                string += '<br>'
                            }
                            let cycle = val[i]
                            let keys = Object.keys(cycle)
                            for (let key of keys)
                            {
                                string += `${this.get_name(`results.${key}`, '')}: ${cycle[key]}<br>`
                            }
                        }
                        return string
                    }
                }
                return val
            }
        }
        return ''
    }
 
    /**
     * function:    get_value
     * parameters:  team, id, stat to use if an option, if it should be a friendly value
     * returns:     a given stat
     * description: Get a given single stat from the teams data structure.
     */
    get_value(team, id, stat='mean', map=false)
    {
        stat = stat.toLowerCase()
        let parts = id.split('.')
        if (parts.length >= 2 && this.teams.hasOwnProperty(team.toString()))
        {
            let category = parts[0]
            let key = parts[1]
            let val = 0

            // return stat if it exists otherwise raw value
            if (this.teams[team][category].hasOwnProperty(`${key}.${stat}`))
            {
                val = this.teams[team][category][`${key}.${stat}`]
            }
            else
            {
                val = this.teams[team][category][key]
            }

            // don't return null values
            if (val === null || typeof val === 'undefined')
            {
                return ''
            }
            // map to option if available
            else if (map && typeof val === 'number' && this.meta[id].options && val < this.meta[id].options.length &&
                    (this.meta[id].type === 'dropdown' || this.meta[id].type === 'select') && stat !== 'stddev')
            {
                // don't map when an option was sent as the step
                let options = this.meta[id].options.map(op => op.toLowerCase())
                if (options.includes(stat))
                {
                    return val.toFixed(2)
                }
                return this.meta[id].options[val]
            }
            // map numbers to 2 decimal places if they are at least that
            else if (map && typeof val === 'number' && val % 0.1 !== 0)
            {
                return val.toFixed(2)
            }
            // map booleans to Yes/No
            else if (map && typeof val === 'boolean')
            {
                return val ? 'Yes' : 'No'
            }
            return val
        }
        return ''
    }

    /**
     * function:    get_global_value
     * parameters:  object of global stats, id, stat to use if an option, if it should be a friendly value
     * returns:     a given global stat
     * description: Get a given single stat from the given global stats data structure.
     */
    get_global_value(global_stats, id, stat='mean', map=false)
    {
        stat = stat.toLowerCase()
        let key = `${id}.${stat}`
        if (global_stats.hasOwnProperty(key))
        {
            let val = global_stats[key]
            // don't return null values
            if (val === null)
            {
                return ''
            }
            // map to option if available
            else if (map && typeof val === 'number' && this.meta[id].options && val < this.meta[id].options.length &&
                    (this.meta[id].type === 'dropdown' || this.meta[id].type === 'select') && stat !== 'stddev')
            {
                // don't map when an option was sent as the step
                let options = this.meta[id].options.map(op => op.toLowerCase())
                if (options.includes(stat))
                {
                    return val.toFixed(2)
                }
                return this.meta[id].options[val]
            }
            // map numbers to 2 decimal places if they are at least that
            else if (map && typeof val === 'number' && val % 0.1 !== 0)
            {
                return val.toFixed(2)
            }
            // map booleans to Yes/No
            else if (map && typeof val === 'boolean')
            {
                return val ? 'Yes' : 'No'
            }
            return val
        }
        return ''
    }

    /**
     * function:    compute_stat
     * parameters:  team, id
     * returns:     a computed stat
     * description: Compute a single stat for a team and return.
     */
    compute_stat(team, id)
    {
        // build list of raw values
        let values = []
        let results = this.teams[team].results.filter(r => r.meta_ignore !== true)

        if (results.length === 0)
        {
            return
        }

        let key = id.replace('results.', '')
        for (let i in results)
        {
            let result = results[i][key]
            if (!isNaN(result))
            {
                values.push(result)
            }
            else if (typeof result === 'string' && result.length > 4)
            {
                let match_key = results[i].meta_match_key
                if (this.matches.hasOwnProperty(match_key))
                {
                    values.push(`<b>${this.matches[match_key].short_match_name}:</b> ${result}`)
                }
                else
                {
                    values.push(`<b>${match_key}:</b> ${result}`)
                }
            }
        }
        values = values.filter(v => v !== '')
        let mean_vals = values

        // calculate where and percent smart stats differently
        let stats = cfg.smart_stats
        let matches = stats.filter(s => s.id === key)
        if (matches.length === 1)
        {
            let stat = matches[0]
            if (stat.type === 'where' && stat.hasOwnProperty('denominator'))
            {
                let cycles = Object.values(results).map(result => result[stat.cycle])
                let result = {'meta_event_id': Object.values(results)[0].meta_event_id}
                result[stat.cycle] = cycles.flat()
                mean_vals = [this.add_smart_stats(result, [stat])[key]]
            }
            else if (stat.type === 'percent' || stat.type === 'ratio')
            {
                let numerators = Object.values(results).map(result => result[stat.numerator])
                let denominators = Object.values(results).map(result => result[stat.denominator])
                let numerator = numerators.reduce((partialSum, a) => partialSum + a, 0)
                let denominator = denominators.reduce((partialSum, a) => partialSum + a, 0)
                mean_vals = [numerator / denominator]
            }
        }

        let meta = this.meta[id]
        switch (meta.type)
        {
            case 'checkbox':
            case 'select':
            case 'multiselect':
            case 'dropdown':
            case 'unknown':
                if (meta.options.length > 0 && values.length > 0)
                {
                    // count instances of each option
                    let counts = {}
                    let options = meta.options
                    for (let i in options)
                    {
                        counts[i] = values.filter(val => val == i).length
                    }

                    // compute stats
                    let min_op = ''
                    let max_op = ''
                    let mode_op = mode(values)
                    let median_op = median(values)
                    let total_op = ''
                    for (let op in counts)
                    {
                        total_op += `${options[op]}: ${counts[op]}<br>`
                        this.teams[team].stats[`${key}.${op}`] = counts[op]
                        if (min_op === '' || counts[op] < counts[min_op])
                        {
                            min_op = parseInt(op)
                        }
                        if (max_op === '' || counts[op] > counts[max_op])
                        {
                            max_op = parseInt(op)
                        }
                    }
                    
                    // build data structure
                    this.teams[team].stats[`${key}.mean`]   = mode_op
                    this.teams[team].stats[`${key}.median`] = median_op
                    this.teams[team].stats[`${key}.mode`]   = mode_op
                    this.teams[team].stats[`${key}.min`]    = min_op
                    this.teams[team].stats[`${key}.max`]    = max_op
                    this.teams[team].stats[`${key}.low`]    = 0
                    this.teams[team].stats[`${key}.high`]   = options.length
                    this.teams[team].stats[`${key}.total`]  = total_op
                    this.teams[team].stats[`${key}.stddev`] = std_dev(values)
                    if (this.meta[`results.${key}`].type === 'select' || this.meta[`results.${key}`].type === 'dropdown')
                    {
                        let total = Object.values(counts).reduce((a, b) => a + b)
                        for (let i in options)
                        {
                            this.teams[team].stats[`${key}.${options[i].toLowerCase()}`] = counts[i] / total
                        }
                    }
                }
                break
            // don't attempt to use strings
            case 'string':
            case 'text':
            case 'cycle':
                // don't compute any stats for text
                this.teams[team].stats[`${key}.mean`]   = '---'
                this.teams[team].stats[`${key}.median`] = '---'
                this.teams[team].stats[`${key}.mode`]   = '---'
                this.teams[team].stats[`${key}.min`]    = '---'
                this.teams[team].stats[`${key}.max`]    = '---'
                this.teams[team].stats[`${key}.low`]    = '---'
                this.teams[team].stats[`${key}.high`]   = '---'
                if (meta.type !== 'cycle')
                {
                    this.teams[team].stats[`${key}.total`] = values.join('<br>')
                }
                else
                {
                    this.teams[team].stats[`${key}.total`] = '---'
                }
                this.teams[team].stats[`${key}.stddev`] = '---'
                break
            case 'counter':
            case 'multicounter':
            case 'number':
            default:
                // compute each stat normally for numbers
                this.teams[team].stats[`${key}.mean`]   = mean(mean_vals)
                this.teams[team].stats[`${key}.median`] = median(values)
                this.teams[team].stats[`${key}.mode`]   = mode(values)
                this.teams[team].stats[`${key}.min`]    = Math.min(... values)
                this.teams[team].stats[`${key}.max`]    = Math.max(... values)
                this.teams[team].stats[`${key}.low`]    = this.teams[team].stats[`${key}.min`]
                this.teams[team].stats[`${key}.high`]   = this.teams[team].stats[`${key}.max`]
                this.teams[team].stats[`${key}.total`]  = values.reduce((a, b) => a + b, 0)
                this.teams[team].stats[`${key}.stddev`] = std_dev(values)
                break
        }
    }

    /**
     * function:    compute_global_stats
     * parameters:  keys, teams
     * returns:     a data structure of stats for all key-teams
     * description: Compute a list of stats across all given teams.
     */
    compute_global_stats(keys, teams, stat='mean')
    {
        // build list of raw values
        let global_stats = {}
        for (let id of keys)
        {
            if (this.meta.hasOwnProperty(id))
            {
                // build list of values to compute on
                let values = []
                for (let team of teams)
                {
                    values.push(this.get_value(team, id, stat))
                }
                values = values.filter(v => v !== '')

                switch (this.meta[id].type)
                {
                    case 'checkbox':
                    case 'select':
                    case 'multiselect':
                    case 'dropdown':
                    case 'unknown':
                        if (this.meta[id].options.length > 0 && values.length > 0)
                        {
                            // count instances of each option
                            let counts = {}
                            let options = this.meta[id].options
                            for (let i in options)
                            {
                                counts[i] = values.filter(val => val == i).length
                            }

                            // compute stats
                            let min_op = ''
                            let max_op = ''
                            let mode_op = mode(values)
                            let median_op = median(values)
                            let total_op = ''
                            for (let op in counts)
                            {
                                total_op += `${options[op]}: ${counts[op]}<br>`
                                global_stats[`${id}.${op}`] = counts[op]
                                if (min_op === '' || counts[op] < counts[min_op])
                                {
                                    min_op = parseInt(op)
                                }
                                if (max_op === '' || counts[op] > counts[max_op])
                                {
                                    max_op = parseInt(op)
                                }
                            }

                            // build data structure
                            global_stats[`${id}.mean`]   = mode_op
                            global_stats[`${id}.median`] = median_op
                            global_stats[`${id}.mode`]   = mode_op
                            global_stats[`${id}.min`]    = min_op
                            global_stats[`${id}.max`]    = max_op
                            global_stats[`${id}.low`]    = 0
                            global_stats[`${id}.high`]   = options.length
                            global_stats[`${id}.total`]  = total_op
                            global_stats[`${id}.stddev`] = std_dev(values)
                            if (this.meta[id.replace('stats.', 'results.')].type === 'select' || this.meta[id.replace('stats.', 'results.')].type === 'dropdown')
                            {
                                let total = Object.values(counts).reduce((a, b) => a + b)
                                for (let i in options)
                                {
                                    global_stats[`${id}.${options[i].toLowerCase()}`] = counts[i] / total
                                }
                            }
                        }
                        break
                    // don't attempt to use strings
                    case 'string':
                    case 'text':
                    case 'cycle':
                        // don't compute any stats for text
                        global_stats[`${id}.mean`]   = '---'
                        global_stats[`${id}.median`] = '---'
                        global_stats[`${id}.mode`]   = '---'
                        global_stats[`${id}.min`]    = '---'
                        global_stats[`${id}.max`]    = '---'
                        global_stats[`${id}.low`]    = '---'
                        global_stats[`${id}.high`]   = '---'
                        global_stats[`${id}.total`]  = '---'
                        global_stats[`${id}.stddev`] = '---'
                        break
                    case 'counter':
                    case 'multicounter':
                    case 'number':
                    default:
                        // compute each stat normally for numbers
                        global_stats[`${id}.mean`]   = mean(values)
                        global_stats[`${id}.median`] = median(values)
                        global_stats[`${id}.mode`]   = mode(values)
                        global_stats[`${id}.min`]    = Math.min(... values)
                        global_stats[`${id}.max`]    = Math.max(... values)
                        global_stats[`${id}.low`]    = global_stats[`${id}.min`]
                        global_stats[`${id}.high`]   = global_stats[`${id}.max`]
                        global_stats[`${id}.total`]  = values.reduce((a, b) => a + b, 0)
                        global_stats[`${id}.stddev`] = std_dev(values)
                        break
                }
            }
        }
        return global_stats
    }

    /**
     * function:    save_picklists
     * parameters:  none
     * returns:     none
     * description: Saves the current picklists to localStorage.
     */
    save_picklists()
    {
        let lists_str = JSON.stringify(this.picklists)
        localStorage.setItem(`picklists-${this.event_id}`, lists_str)
    }
}