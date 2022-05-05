/**
 * file:        data.js
 * description: Contains the DAL class which loads in all data and computes stats.                          
 * author:      Liam Fruzyna
 * date:        2022-04-30
 */

class DAL
{
    constructor(event_id)
    {
        this.event_id = event_id
        this.year = event_id.substr(0,4)
        this.alliance_size = 0

        // data structures
        this.meta = {}
        this.teams = {}
        this.matches = {}

        // parameters to limit what data is loaded
        this.load_meta      = true
        this.load_results   = true
        this.load_pits      = true
        this.load_rankings  = true
        this.load_matches   = true
        this.load_pictures  = true
        this.compute_stats  = true
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
        let config = cfg.match
        let prefix = 'results.'
        if (mode === PIT_MODE)
        {
            config = cfg.pit
            prefix = 'pit.'
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
                            if (type == 'select' || type == 'dropdown' || type == 'multicounter')
                            {
                                neg = new Array(ops.length).fill(false)
                            }
                            else
                            {
                                neg = false
                            }
                        }
                        if (type == 'checkbox')
                        {
                            ops = [false, true]
                        }
                        if (typeof ops === 'undefined')
                        {
                            ops = []
                        }

                        // add each counter in a multicounter
                        if (type == 'multicounter')
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
            
                    meta[prefix + stat.id] = {
                        name: stat.name,
                        type: 'number',
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
    get_keys(include_stats=true, include_pit=true, include_ranking=true, include_meta=true, types=[])
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
        return keys
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
                    pictures: []
                }

                // add meta data
                if (this.load_meta)
                {
                    this.teams[team_num].meta = {
                        name: team.nickname,
                        city: team.city,
                        state_prov: team.state_prov,
                        country: team.country
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
        
        // fail if there were no teams
        if (Object.keys(this.teams).length === 0)
        {
            console.log('No event teams found!')
            return
        }

        let start_rankings = Date.now()

        // load in rankings
        if (this.load_rankings)
        {
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
                    type: 'number'
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
        }

        // load in matches
        let start_matches = Date.now()
        if (this.load_matches)
        {
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
                    this.teams[team].matches.push({
                        key: match_key,
                        comp_level: match.comp_level,
                        set_number: match.set_number,
                        match_number: match.match_number,
                        alliance: 'red'
                    })
                }
                for (let team of match.blue_alliance)
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

        // TODO pictures aren't supported
        // TODO avatar
        let start_pictures = Date.now()
        if (this.load_pictures)
        {
            let pics_str = localStorage.getItem(`pictures-${this.event_id}`)
            if (pics_str != null && pics_str != false)
            {
                let pics = JSON.parse(pics_str)
            }
        }

        // load in pit results
        let start_pits = Date.now()
        let files = Object.keys(localStorage)
        if (this.load_pits)
        {
            // populate meta
            this.load_config(PIT_MODE)

            // add pit results
            let pit_files = files.filter(f => f.startsWith(`pit-${this.event_id}`))
            for (let file of pit_files)
            {
                let pit = JSON.parse(localStorage.getItem(file))
                this.teams[pit.meta_team.toString()].pit = pit
            }
        }

        // load in match results
        let start_results = Date.now()
        if (this.load_results)
        {
            // populate meta
            this.load_config(MATCH_MODE)

            // add match results
            let stats = cfg.smart_stats
            let match_files = files.filter(f => f.startsWith(`match-${this.event_id}`))
            for (let file of match_files)
            {
                let match = JSON.parse(localStorage.getItem(file))
                // add match key to pre-WR2 results
                if (!match.hasOwnProperty('meta_match_key') && match.hasOwnProperty('meta_match') && match.hasOwnProperty('meta_event_id'))
                {
                    match.meta_match_key = `${match.meta_event_id}_qm${match.meta_match}`
                }
                this.teams[match.meta_team.toString()].results.push(this.add_smart_stats(match, stats))
            }
        }

        // build in stats
        let start_stats = Date.now()
        if (this.compute_stats)
        {
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
        }
        let end = Date.now()

        // print times to load
        if (debug)
        {
            console.log('Meta', start_rankings - start)
            console.log('Rankings', start_matches - start_rankings)
            console.log('Matches', start_pictures - start_matches)
            console.log('Pictures', start_pits - start_pictures)
            console.log('Pits', start_results - start_pits)
            console.log('Results', start_stats - start_results)
            console.log('Stats', end - start_stats)
            console.log('Total', end - start)
        }

        return this.teams
    }

    /**
     * function:    build_matches
     * parameters:  none
     * returns:     none
     * description: Build the m tches data structure.
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
                this.matches[match.key] = {
                    comp_level: match.comp_level,
                    set_number: match.set_number,
                    match_number: match.match_number,
                    scheduled_time: match.time,
                    predicted_time: match.predicted_time,
                    started_time: match.actual_time,
                    red_alliance: match.alliances.red.team_keys.map(k => k.substring(3)),
                    blue_alliance: match.alliances.blue.team_keys.map(k => k.substring(3)),
                    red_score: match.alliances.red.score,
                    blue_score: match.alliances.blue.score,
                    videos: match.videos,
                    score_breakdown: match.score_breakdown,
                    winner: match.winning_alliance
                }
            }

            this.alliance_size = this.matches[`${this.event_id}_qm1`].red_alliance.length
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
                        total += result[k]
                    }
                    result[id] = total
                    break
                case 'percent':
                    result[id] = result[stat.numerator] / (result[stat.numerator] + result[stat.denominator])
                    if (isNaN(result[id]))
                    {
                        result[id] = 0
                    }
                    break
                case 'ratio':
                    if (result[stat.denominator] != 0)
                    {
                        result[id] = result[stat.numerator] / result[stat.denominator]
                    }
                    else
                    {
                        result[id] = result[stat.numerator]
                    }
                    break
                // exclusively for cycle
                case 'where':
                    let count = typeof stat.sum === 'undefined' || !stat.sum
                    let value = 0
                    let denominator = 0
                    let percent = typeof stat.denominator !== 'undefined'
                    for (let cycle of result[stat.cycle])
                    {
                        let passed = true
                        for (let key of Object.keys(stat.conditions))
                        {
                            if (cycle[key] != this.meta['results.' + key].options.indexOf(stat.conditions[key]))
                            {
                                passed = false
                            }
                        }
                        if (passed)
                        {
                            if (count)
                            {
                                value++
                            }
                            else
                            {
                                value += cycle[stat.sum]
                            }
                            if (percent)
                            {
                                denominator += cycle[stat.denominator]
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
            }
        }
        return result
    }

    /**
     * function:    get_name
     * parameters:  id, stat to use if an option
     * returns:     friendly name for stat
     * description: Get the friendly name for a given stat.
     */
    get_name(id, stat='mean')
    {
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
     * function:    get_value
     * parameters:  team, id, stat to use if an option, if it should be a friendly value
     * returns:     a given stat
     * description: Get a given single stat from the teams data structure.
     */
    get_value(team, id, stat='mean', map=false)
    {
        let parts = id.split('.')
        if (parts.length >= 2)
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
            if (val === null)
            {
                return ''
            }
            // map to option if available
            else if (map && typeof val === 'number' && this.meta[id].options && val < this.meta[id].options.length && (this.meta[id].type === 'dropdown' || this.meta[id].type === 'select'))
            {
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
        let val = global_stats[`${id}.${stat}`]
        // don't return null values
        if (val === null)
        {
            return ''
        }
        // map to option if available
        else if (map && typeof val === 'number' && this.meta[id].options && val < this.meta[id].options.length && (this.meta[id].type === 'dropdown' || this.meta[id].type === 'select'))
        {
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
        let results = this.teams[team].results

        if (results.length === 0)
        {
            return
        }

        let keys = Object.keys(results)
        let key = id.replace('results.', '')
        for (let name of keys)
        {
            if (!isNaN(results[name][key]))
            {
                values.push(results[name][key])
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
                    // convert checkbox values to booleans
                    if (meta.type === 'checkbox')
                    {
                        min_op = min_op == 'true'
                        max_op = max_op == 'true'
                    }
                    
                    // build data structure
                    this.teams[team].stats[`${key}.mean`]   = mode_op
                    this.teams[team].stats[`${key}.median`] = median_op
                    this.teams[team].stats[`${key}.mode`]   = mode_op
                    // TODO most and least common or highest and lowest achieved
                    this.teams[team].stats[`${key}.min`]    = min_op
                    this.teams[team].stats[`${key}.max`]    = max_op
                    this.teams[team].stats[`${key}.total`]  = total_op
                    this.teams[team].stats[`${key}.stddev`] = '---'
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
                this.teams[team].stats[`${key}.total`]  = '---'
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
    compute_global_stats(keys, teams)
    {
        // build list of raw values
        let global_stats = {}
        for (let id of keys)
        {
            // build list of values to compute on
            let values = []
            for (let team of teams)
            {
                values.push(this.get_value(team, id))
            }
            values = values.filter(v => v !== '')
    
            switch (this.meta[id].type)
            {
                case 'checkbox':
                case 'select':
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
                                min_op = op
                            }
                            if (max_op === '' || counts[op] > counts[max_op])
                            {
                                max_op = op
                            }
                        }
                        // convert checkbox values to booleans
                        if (this.meta[id].type === 'checkbox')
                        {
                            min_op = min_op == 'true'
                            max_op = max_op == 'true'
                        }
                        
                        // build data structure
                        global_stats[`${id}.mean`]   = mode_op
                        global_stats[`${id}.median`] = median_op
                        global_stats[`${id}.mode`]   = mode_op
                        // TODO determine most and least common or highest and lowest achieved
                        global_stats[`${id}.min`]    = min_op
                        global_stats[`${id}.max`]    = max_op
                        global_stats[`${id}.total`]  = total_op
                        global_stats[`${id}.stddev`] = '---'
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
                    global_stats[`${id}.total`]  = values.reduce((a, b) => a + b, 0)
                    global_stats[`${id}.stddev`] = std_dev(values)
                    break
            }
        }
        return global_stats
    }
}