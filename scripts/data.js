/**
 * file:        new-dal.js
 * description: Contains Data object for handling all results and other data from TBA.
 * author:      Liam Fruzyna
 * date:        2025-04-26
 */

/**
 * Parse a team number out of a team key (i.e. frcXYZ).
 * @param {String} team_key Team key
 * @returns Integer team key
 */
function parse_team_number(team_key)
{
    return parseInt(team_key.substring(3))
}

/**
 * Ensures the given value is a list of teams.
 * @param {*} teams "all", team number, or list of teams
 * @returns A list of the desired team numbers.
 */
function parse_team_list(teams)
{
    if (teams === 'all')
    {
        return dal.team_numbers
    }
    else if (typeof teams === 'string')
    {
        return [parseInt(teams)]
    }
    else if (typeof teams === 'number')
    {
        return [teams]
    }
    return teams
}

/**
 * Builds a new result object.
 * @param {String} scout_mode Result scouting mode
 * @param {Number} start_time Scouting start timestamp
 * @param {Boolean} unsure Scouter unsure
 * @param {String} unsure_reason Explaination for being unsure
 * @param {Boolean} ignore Ignore result
 * @param {Object} result Actual result data
 * @returns Raw result object
 */
function new_result(scout_mode, start_time, unsure, unsure_reason, result)
{
    return {
        meta: {
            result: {
                scout_mode: scout_mode,
                event_id: cfg.user.state.event_id
            },
            scouter: {
                user_id: parseInt(cfg.user.state.user_id),
                position: parseInt(cfg.get_selected_position()),
                start_time: start_time,
                duration: Math.round((Date.now() - start_time) / 1000),
                config_version: cfg.scout.version,
                app_version: cfg.app_version
            },
            status: {
                unsure: unsure,
                unsure_reason: unsure_reason,
                ignore: false
            }
        },
        result: result
    }
}

/**
 * Generates a semi-random result name using the current time.
 * @returns Semi-random result name
 */
function create_result_name()
{
    return `result-${(new Date()).getTime()}${Math.floor(Math.random() * 1000)}`
}

/**
 * Base class containing functions for both MatchResult and TeamResult.
 */
class BaseResult
{
    /**
     * Base class constructor, do not use.
     * @param {Number} team_num Team number
     * @param {Function} keys_func Function to call to get keys from the config for the respective mode.
     */
    constructor(team_num, keys_func=cfg.get_match_keys.bind(cfg))
    {
        this.team_num = team_num
        this.get_keys = keys_func

        this.file_names = {}
        this.meta = {}
        this.fms_results = {}
        this.results = {}
        this.smart_results = {}
    }

    /**
     * Adds FMS results to the current result.
     * @param {Object} fms_result Result from the FMS. An alliance score breakdown for matches or a ranking for teams.
     */
    add_fms_result(fms_result)
    {
        let fms_keys = this.get_keys(false, true, false)
        for (let key of Object.keys(fms_result))
        {
            // add fms kind to the key of the result
            let full_key = `fms.${key}`
            if (fms_keys.includes(full_key))
            {
                this.fms_results[key] = fms_result[key]
            }
            // special handling for results out of arrays and objects
            else if (typeof fms_result[key] === 'object')
            {
                // look for key_subkey
                for (let i in fms_result[key])
                {
                    if (fms_keys.includes(`${full_key}_${i}`))
                    {
                        this.fms_results[`${key}_${i}`] = fms_result[key][i]
                    }
                }
            }
            // special handling for match keys ending in RobotX
            else if (this.hasOwnProperty('index') && key.endsWith(this.index + 1) && fms_keys.includes(full_key.substring(0, full_key.length - 1)))
            {
                this.fms_results[key.substring(0, key.length - 1)] = fms_result[key]
            }
        }
    }

    /**
     * Add a scouted result to the object.
     * @param {String} file_name localStorage key
     * @param {Object} result Raw match or team result object.
     */
    add_result(file_name, result)
    {
        let mode = result.meta.result.scout_mode
        if (this.results.hasOwnProperty(mode))
        {
            this.file_names[mode].push(file_name)
            this.results[mode].push(result.result)
            this.meta[mode].push(result.meta)
        }
        else
        {
            this.file_names[mode] = [file_name]
            this.results[mode] = [result.result]
            this.meta[mode] = [result.meta]
        }
    }

    /**
     * Computes and adds each smart result for the single result.
     */
    compute_smart_results()
    {
        for (let key of this.get_keys(false, false, true))
        {
            let smart_result = cfg.get_result_from_key(key)
            let value = smart_result.compute_smart_result(this)
            if (value !== null)
            {
                this.smart_results[smart_result.id] = value
            }
        }
    }

    /**
     * Gets a result/fms/smart using the full key.
     * @param {String} key Requested full key (with kind.)
     * @returns Value from the current match or team result.
     */
    get_value(key)
    {
        let level = key.substring(0, key.indexOf('.'))
        let sub_key = key.substring(level.length + 1)
        switch (level)
        {
            case 'result':
                let scout_mode = sub_key.substring(0, sub_key.indexOf('_'))
                if (this.results.hasOwnProperty(scout_mode))
                {
                    let meta = this.meta[scout_mode]
                    let results = this.results[scout_mode]

                    // find the latest result, that is not ignored, and prefer not unsure results
                    let index = -1
                    for (let i in results)
                    {
                        if (!meta[i].status.ignore && (index < 0 || !meta[i].status.unsure || meta[index].status.unsure))
                        {
                            index = i
                        }
                    }

                    // if a result is available and the key exists, return it
                    if (index >= 0 && results[index].hasOwnProperty(sub_key))
                    {
                        return results[index][sub_key]
                    }
                }
                break
            case 'fms':
                if (this.fms_results.hasOwnProperty(sub_key))
                {
                    let value = this.fms_results[sub_key]
                    if (cfg.get_result_from_key(key).type === 'yes_no')
                    {
                        return value === 'Yes'
                    }
                    return value
                }
                break
            case 'smart':
                if (this.smart_results.hasOwnProperty(sub_key))
                {
                    return this.smart_results[sub_key]
                }
                break
            default:
                console.log(`Unrecognized result type, ${level}`)
        }
        return null
    }

    /**
     * Determine if any of the scouted result types are entirely unsure.
     */
    get unsure()
    {
        return Object.values(this.meta).some(m => Object.values(m).every(r => r.status.unsure))
    }
}

/**
 * Result representing a single match-team.
 */
class MatchResult extends BaseResult
{
    /**
     * Constructs a MatchResult.
     * @param {Object} match Raw match from TBA
     * @param {String} alliance Alliance color
     * @param {Number} index Index of the team inside the alliance
     */
    constructor(match, alliance, index)
    {
        super(parse_team_number(match.alliances[alliance].team_keys[index]), cfg.get_match_keys.bind(cfg))
        this.match_key = match.key
        this.alliance = alliance
        this.index = index

        // if a score breakdown is available, parse it for FMS results
        if (match.score_breakdown)
        {
            this.add_fms_result(match.score_breakdown[alliance])
        }
    }
}

/**
 * Result representing a single team.
 */
class TeamResult extends BaseResult
{
    /**
     * Constructs a TeamResult.
     * @param {Object} match Raw team from TBA
     */
    constructor(team)
    {
        super(team.team_number, cfg.get_team_keys.bind(cfg))

        this.name = team.nickname
        this.matches = []
    }

    /**
     * Gets an avatar from localStorage for the current team, defaults to dozer.
     */
    get avatar()
    {
        const avatar = localStorage.getItem(`avatar-${cfg.year}-${this.team_num}`)
        if (avatar !== null)
        {
            return `data:image/png;base64,${avatar}`
        }
        else
        {
            return 'assets/dozer.png'
        }
    }

    /**
     * Produce an img element containing the team's avatar.
     */
    get avatar_el()
    {
        let avatar_el = document.createElement('img')
        avatar_el.className = 'avatar'
        avatar_el.src = this.avatar
        return avatar_el
    }
}

/**
 * Object containing all data fetched from TBA and scouted results.
 */
class Data
{
    constructor(event_id)
    {
        this.event_id = event_id
        this.event_name = event_id
        this.double_elim_event = false

        this.teams = {}
        this.matches = {}
        this.cache = {}
        this.picklists = {}
    }

    //
    // Data Loading Functions
    //

    /**
     * Resets the result cache and loads all data in.
     */
    load_data()
    {
        this.cache = {}
        this.load_event()
        this.load_teams()
        this.load_rankings()
        this.load_matches()
        this.load_results()
        this.compute_smart_results()
        this.load_picklists()
    }

    /**
     * Loads event data in from localStorage.
     */
    load_event()
    {
        const event_file = `event-${this.event_id}`
        const tba_event = JSON.parse(localStorage.getItem(event_file))
        if (tba_event === null)
        {
            console.log(`No event file "${event_file}"`)
            return
        }

        this.event_name = tba_event.name
        this.double_elim_event = tba_event.playoff_type === 10
    }

    /**
     * Loads team list in from localStorage and creates TeamResults.
     */
    load_teams()
    {
        const team_file = `teams-${this.event_id}`
        const tba_teams = JSON.parse(localStorage.getItem(team_file))
        if (tba_teams === null)
        {
            console.log(`No team file "${team_file}"`)
            return
        }

        this.teams = {}
        for (let team of tba_teams)
        {
            this.teams[team.team_number] = new TeamResult(team)
        }
    }

    /**
     * Loads team rankings in from localStorage and adds to TeamResults. 
     */
    load_rankings()
    {
        const rank_file = `rankings-${this.event_id}`
        const tba_rankings = JSON.parse(localStorage.getItem(rank_file))
        if (tba_rankings === null)
        {
            console.log(`No ranking file "${rank_file}"`)
            return
        }

        if (tba_rankings !== null)
        {
            for (let ranking of tba_rankings)
            {
                const team_num = parse_team_number(ranking.team_key)
                if (team_num in this.teams)
                {
                    this.teams[team_num].add_fms_result(ranking)
                }
                else
                {
                    console.log(`Couldn't find team ${team_num} from rankings`)
                }
            }
        }
    }

    /**
     * Loads matches in from localStorage and creates MatchResults for each team.
     */
    load_matches()
    {
        const match_file = `matches-${this.event_id}`
        const tba_matches = JSON.parse(localStorage.getItem(match_file))
        if (tba_matches === null)
        {
            console.log(`No matches file "${match_file}"`)
            return
        }

        this.matches = {}
        for (let match of tba_matches)
        {
            // determine if match is complete by there being a post result time
            // time priorities are actual time, predicted time, scheduled time
            let time = match.time
            let complete = false
            if (match.actual_time)
            {
                time = match.actual_time
                if (match.post_result_time)
                {
                    complete = true
                }
            }
            else if (match.predicted_time)
            {
                time = match.predicted_time
            }

            // construct a match name and short name
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
            else if (this.double_elim_event)
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

            this.matches[match.key] = {
                comp_level: match.comp_level,
                set_num: match.set_number,
                match_num: match.match_number,
                name: match_name,
                short_name: short_match_name,
                red_alliance: match.alliances.red.team_keys.map(t => parse_team_number(t)),
                blue_alliance: match.alliances.blue.team_keys.map(t => parse_team_number(t)),
                time: time,
                complete: complete,
                videos: match.videos,
                results: {}
            }

            // build MatchResults for each team in each alliance
            this.add_match_team(match, 'red')
            this.add_match_team(match, 'blue')
        }
    }

    /**
     * Create MatchResult for each team in a specified alliance.
     * @param {Object} match Raw match object
     * @param {String} alliance Alliance color
     */
    add_match_team(match, alliance)
    {
        for (let i in match.alliances[alliance].team_keys)
        {
            // create a new MatchResult
            const team_num = parse_team_number(match.alliances[alliance].team_keys[i])
            this.matches[match.key].results[team_num] = new MatchResult(match, alliance, parseInt(i))

            // add match key to team
            if (team_num in this.teams)
            {
                this.teams[team_num].matches.push(match.key)
            }
            else
            {
                console.log(`Couldn't find team ${team_num} from matches`)
            }
        }
    }

    /**
     * Loads results in from localStorage and adds the values to MatchResults and TeamResults.
     */
    load_results()
    {
        for (let key of Object.keys(localStorage))
        {
            if (key.startsWith('result-'))
            {
                // determine scouting type from scouting mode in result metadata
                let res = JSON.parse(localStorage.getItem(key))
                let scout_type = cfg.get_scout_config(res.meta.result.scout_mode).type

                // add match results for the current event
                if (scout_type.startsWith('match-') && res.meta.result.event_id === this.event_id)
                {
                    const match_key = res.meta.result.match_key
                    const team_num = res.meta.result.team_num
                    if (match_key in this.matches)
                    {
                        if (team_num in this.matches[match_key].results)
                        {
                            this.matches[match_key].results[team_num].add_result(key, res)
                        }
                        else
                        {
                            console.log(`Couldn't find team ${team_num} from match result`)
                        }
                    }
                    else
                    {
                        console.log(`Couldn't find match ${match_key} from match result`)
                    }
                }
                // add team results for the current event
                else if (scout_type === 'team' && res.meta.result.event_id === this.event_id)
                {
                    const team_num = res.meta.result.team_num
                    if (team_num in this.teams)
                    {
                        this.teams[team_num].add_result(key, res)
                    }
                    else
                    {
                        console.log(`Couldn't find team ${team_num} from match result`)
                    }
                }
            }
        }
    }

    /**
     * Compute smart results on all Match and TeamResults.
     */
    compute_smart_results()
    {
        for (let team_num of this.team_numbers)
        {
            this.teams[team_num].compute_smart_results()
        }
        for (let match_key of this.match_keys)
        {
            for (let result of Object.values(this.matches[match_key].results))
            {
                result.compute_smart_results()
            }
        }
    }

    /**
     * Builds the picklist file name for the current event.
     */
    get picklist_file()
    {
        return `picklists-${this.event_id}`
    }

    /**
     * Loads picklists in from localStorage.
     */
    load_picklists()
    {
        const picklists = JSON.parse(localStorage.getItem(this.picklist_file))
        if (picklists === null)
        {
            console.log(`No picklist file "${this.picklist_file}"`)
            return
        }

        this.picklists = picklists
    }
    /**
     * Store picklists into localStorage.
     */
    save_picklists()
    {
        localStorage.setItem(this.picklist_file, JSON.stringify(this.picklists))
    }

    //
    // Match and Team Keys
    //

    /**
     * Gets an array of all team numbers.
     */
    get team_numbers()
    {
        return Object.keys(this.teams)
    }

    /**
     * Gets an array of all match keys.
     */
    get match_keys()
    {
        return this.get_match_keys()
    }

    /**
     * Builds a sorted array of available match keys.
     * @param {Boolean} include_elims Whether to include elims matches
     * @returns Array of match keys
     */
    get_match_keys(include_elims=true)
    {
        // get matches
        let keys = Object.keys(this.matches)
        if (!include_elims)
        {
            keys = keys.filter(k => ['qm', 'cm'].includes(this.matches[k].comp_level))
        }

        // sort matches
        const cl_sort = ['cm', 'qm', 'qf', 'sf', 'f']
        return keys.sort((a, b) => {
            const a_match = this.matches[a]
            const b_match = this.matches[b]
            if (a_match.comp_level === b_match.comp_level)
            {
                if (a_match.set_num !== b_match.set_num)
                {
                    return a_match.set_num - b_match.set_num
                }
                return a_match.match_num - b_match.match_num
            }
            return cl_sort.indexOf(a_match.comp_level) - cl_sort.indexOf(b_match.comp_level)
        })
    }

    /**
     * Counts the number of available match-team results.
     * @param {Boolean} include_elims Whether to include elims matches
     * @returns The number of matching results.
     */
    count_match_results(include_elims=true)
    {
        let count = 0
        let modes = cfg.match_scouting_modes
        for (let match_key of this.get_match_keys(include_elims))
        {
            let teams = this.get_match_teams(match_key)
            for (let team_num of Object.values(teams))
            {
                for (let mode_id of modes)
                {
                    if (this.is_match_scouted(match_key, team_num, mode_id))
                    {
                        count += this.get_match_result(match_key, team_num).results[mode_id].length
                    }
                }
            }
        }
        return count
    }

    /**
     * Coulds the number of available team results.
     * @returns The number of results.
     */
    count_team_results()
    {
        let count = 0
        let modes = cfg.team_scouting_modes
        for (let team_num in this.teams)
        {
            for (let mode_id of modes)
            {
                if (this.is_team_scouted(team_num, mode_id))
                {
                    count += this.teams[team_num].results[mode_id].length
                }
            }
        }
        return count
    }

    //
    // Match Info
    //

    /**
     * Determines whether a specified match-team is scouted.
     * @param {String} match_key Match key
     * @param {Number} team_num Team number
     * @param {String} scout_mode Scouting mode
     * @returns Whether or not a specified match-team is scouted.
     */
    is_match_scouted(match_key, team_num, scout_mode)
    {
        return this.get_match_result(match_key, team_num) !== null && this.matches[match_key].results[team_num].results.hasOwnProperty(scout_mode)
    }

    /**
     * Determines whether a specified team is scouted.
     * @param {Number} team_num Team number
     * @param {String} scout_mode Scouting mode
     * @returns Whether or not a specified team is scouted.
     */
    is_team_scouted(team_num, scout_mode)
    {
        return this.teams.hasOwnProperty(team_num) && this.teams[team_num].results.hasOwnProperty(scout_mode)
    }

    /**
     * Builds a map of team numbers.
     * @param {String} match_key Match key
     * @returns A map of position keys to team numbers.
     */
    get_match_teams(match_key)
    {
        let red_teams = this.matches[match_key].red_alliance
        let blue_teams = this.matches[match_key].blue_alliance
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
     * Gets the team for the given match and scouting position.
     * @param {String} match_key Match key
     * @param {Number} position Scouting position
     * @returns The corresponding team number.
     */
    get_match_team(match_key, position)
    {
        if (position < 3)
        {
            return this.matches[match_key].red_alliance[position]
        }
        else
        {
            return this.matches[match_key].blue_alliance[position - 3]
        }
    }

    /**
     * Gets the alliance teams for the given match and scouting position.
     * @param {String} match_key Match key
     * @param {Number} position Scouting position
     * @returns The corresponding team number.
     */
    get_match_alliance(match_key, position)
    {
        if (position < 3)
        {
            return this.matches[match_key].red_alliance
        }
        else
        {
            return this.matches[match_key].blue_alliance
        }
    }

    //
    // Match Result Getters
    //

    /**
     * Gets a requested match-team result.
     * @param {String} match_key Match key
     * @param {Number} team_num Team number
     * @returns The corresponding MatchResult or null if it can't be found.
     */
    get_match_result(match_key, team_num)
    {
        if (match_key in this.matches && team_num in this.matches[match_key].results)
        {
            return this.matches[match_key].results[team_num]
        }
        return null
    }

    /**
     * Gets the metadata for a requested match-team result.
     * @param {String} match_key Match key
     * @param {Number} team_num Team number
     * @returns The corresponding MatchResult or null if it can't be found.
     */
    get_match_meta(match_key, team_num, scout_mode)
    {
        let result = this.get_match_result(match_key, team_num)
        if (result !== null && result.meta.hasOwnProperty(scout_mode))
        {
            return result.meta[scout_mode]
        }
        return
    }

    /**
     * Gets a specific value from a requested match-team result.
     * @param {String} match_key Match key
     * @param {Number} team_num Team number
     * @param {String} key Full result key
     * @returns The corresponding MatchResult or null if it can't be found.
     */
    get_match_value(match_key, team_num, key)
    {
        let result = this.get_match_result(match_key, team_num)
        if (result !== null)
        {
            return result.get_value(key)
        }
        return
    }

    /**
     * Gets a specific value from a requested team result.
     * @param {Number} team_num Team number
     * @param {String} key Full result key
     * @returns The corresponding TeamResult or null if it can't be found.
     */
    get_team_value(team_num, key)
    {
        if (this.teams.hasOwnProperty(team_num))
        {
            return this.teams[team_num].get_value(key)
        }
        return
    }

    //
    // Result Summaries
    //

    /**
     * Gets an Array of match-team result values for the specified teams. 
     * @param {String} result_id Full result key
     * @param {*} teams "all", team number, or an Array of teams
     * @param {Boolean} filter_null Whether to filter out null results
     * @returns Array of values
     */
    get_match_results(result_id, teams='all', filter_null=true)
    {
        // ensure teams is a list of numbers
        teams = parse_team_list(teams)

        // get each result
        let results = []
        for (let team_num of teams)
        {
            for (let match_key of this.teams[team_num].matches)
            {
                results.push(this.get_match_value(match_key, team_num, result_id))
            }
        }

        // filter out null results
        if (filter_null)
        {
            results = results.filter(r => r !== null)
        }
        return results
    }

    /**
     * Gets an Array of team result values for the specified teams.
     * @param {String} result_id Full result key
     * @param {*} teams "all", team number, or an Array of teams
     * @param {Boolean} filter_null Whether to filter out null results
     * @returns Array of values
     */
    get_team_results(result_id, teams='all', filter_null=true)
    {
        // ensure teams is a list of numbers
        teams = parse_team_list(teams)

        // get each result
        let results = []
        for (let team_num of teams)
        {
            results.push(this.get_team_value(team_num, result_id))
        }

        // filter out null results
        if (filter_null)
        {
            results = results.filter(r => r !== null)
        }
        return results
    }

    /**
     * Computes a statistical method for all results for the specified set of teams.
     * @param {String} result_id Full result key
     * @param {*} teams "all", team number, or an Array of teams
     * @param {String} stat Statistical method to use
     * @returns Computed stat value
     */
    compute_stat(result_id, teams='all', stat='')
    {
        // check if already cached
        if (result_id in this.cache && !Array.isArray(teams))
        {
            if (teams in this.cache[result_id])
            {
                return this.cache[result_id][teams]
            }
        }

        // get the results and compute a stat
        let value = null
        let result = cfg.get_result_from_key(result_id)
        // some smart results need to be recomputed when used across matches
        if (result.recompute)
        {
            value = result.compute_smart_result(null, teams)
        }
        // compute stat for team results
        else if (cfg.get_team_keys().includes(result_id))
        {
            value = result.compute_stat(this.get_team_results(result_id, teams), stat)
        }
        // compute stat for match-team results
        else
        {
            value = result.compute_stat(this.get_match_results(result_id, teams), stat)
        }

        // cache and return the value
        if (!Array.isArray(teams))
        {
            if (!(result_id in this.cache))
            {
                this.cache[result_id] = {}
            }
            this.cache[result_id][teams] = value
        }
        return value
    }
}