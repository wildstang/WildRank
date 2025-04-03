/**
 * file:        2025-audit.js
 * description: Performs an audit of the 2025 scouting data.
 * author:      Liam Fruzyna
 * date:        2025-04-03
 */

// read parameters from URL
var urlParams = new URLSearchParams(window.location.search)
const selected = urlParams.get('file')

var match_el, results_tab
var matches = {}
var scouters = {}

/**
 * Generates the page template, computes audit, and opens the summary.
 */
function init_page()
{
    header_info.innerText = 'Result Viewer'

    match_el = document.createElement('h2')
    results_tab = create_element('table', 'results_tab')
    let card = new WRCard([match_el, results_tab], true)
    preview.append(card)

    // compute audit of each match
    for (let match of Object.keys(dal.matches))
    {
        add_match(match)
    }

    // build matches column starting with a summary option
    populate_matches(false, false)
    let option = new WRMatchOption('summary', 'Summary', [], [])
    document.getElementById('option_list').prepend(option)
    open_option('summary')
}

/**
 * Populate the page with the audit of a given match.
 * @param {String} match Selected match key
 */
function open_option(match)
{
    // select the new option
    deselect_all()
    document.getElementById(`left_match_option_${match}`).classList.add('selected')

    results_tab.replaceChildren()

    // populate with summary data
    if (match === 'summary')
    {
        match_el.innerText = 'Event Summary'
        results_tab.append(create_header_row(['', 'Scouted Total', 'Actual Total', 'Net Error', 'Short', 'Extra', 'Percent Error']))

        let match_keys = Object.keys(matches)
        let keys = Object.keys(matches[match_keys[0]]).filter(k => k.startsWith('Red')).map(k => k.substring(4))
        for (let key of keys)
        {
            // compute totals for each stat
            let scouted_total = 0
            let actual_total = 0
            let total_missed = 0
            for (let match of match_keys)
            {
                for (let color of ['Red', 'Blue'])
                {
                    let values = matches[match][`${color} ${key}`]
                    if (values.length === 2)
                    {
                        scouted_total += values[0]
                        actual_total += values[1]
                        total_missed += Math.abs(values[0] - values[1])
                    }
                    else
                    {
                        scouted_total += values[2] ? 1 : 0
                        actual_total += 1
                        total_missed += values[2] ? 0 : 1
                    }
                }
            }

            // build overall summary data
            let row = results_tab.insertRow()
            row.append(create_header(key))
            row.insertCell().innerText = scouted_total
            row.insertCell().innerText = actual_total
            let delta = scouted_total - actual_total
            row.insertCell().innerText = delta
            let cancel = Math.abs(total_missed - Math.abs(delta)) / 2
            if (delta < 0)
            {
                row.insertCell().innerText = -delta + cancel
                row.insertCell().innerText = cancel
            }
            else if (delta > 0)
            {
                row.insertCell().innerText = cancel
                row.insertCell().innerText = delta + cancel
            }
            else
            {
                row.insertCell().innerText = cancel
                row.insertCell().innerText = cancel
            }
            row.insertCell().innerText = (100 * total_missed / scouted_total).toFixed(1) + '%'
        }

        // add a second table of scouter data
        results_tab.append(create_header_row(['', 'Matches', 'Climb Errors', 'Per Match', 'GP Errors', 'Per Match']))
        for (let id of Object.keys(scouters))
        {
            let matches = scouters[id].matches
            let row = results_tab.insertRow()
            row.insertCell().innerText = cfg.get_name(id)
            row.insertCell().innerText = matches
            row.insertCell().innerText = scouters[id].climbs
            row.insertCell().innerText = (scouters[id].climbs / matches).toFixed(1)
            row.insertCell().innerText = (scouters[id].game_pieces / 3).toFixed(1)
            row.insertCell().innerText = (scouters[id].game_pieces / matches / 3).toFixed(1)
        }
    }
    // populate with match data
    else
    {
        match_el.innerText = dal.get_match_value(match, 'match_name')
    
        if (Object.keys(matches).includes(match))
        {
            results_tab.append(create_header_row(['', 'Scouted Value', 'Actual Value', 'Comparison']))
    
            let match_vals = matches[match]
            for (let key of Object.keys(match_vals))
            {
                add_stat(key, ...match_vals[key])
            }
        }
        else
        {
            let red_alliance = dal.get_match_value(match, 'red_alliance')
            let blue_alliance = dal.get_match_value(match, 'blue_alliance')
            let scouted_teams = red_alliance.concat(blue_alliance).filter(t => dal.is_match_scouted(match, t)).length
            results_tab.append(create_header_row([`Only ${scouted_teams} scouted teams in this match`]))
        }
    }
}

/**
 * Computes an audit for a single match and adds to the dictionary.
 * @param {String} match Match key to audit.
 */
function add_match(match)
{
    let red_alliance = dal.get_match_value(match, 'red_alliance')
    let blue_alliance = dal.get_match_value(match, 'blue_alliance')

    // ensure entire match is scouted
    let scouted_teams = red_alliance.concat(blue_alliance).filter(t => dal.is_match_scouted(match, t)).length
    if (scouted_teams < 6)
    {
        console.log(`Skipping ${match}, only ${scouted_teams} scouted teams`)
        return
    }

    // get TBA match data
    let red_breakdown = dal.matches[match].score_breakdown['red']
    let blue_breakdown = dal.matches[match].score_breakdown['blue']

    // compute red processor, net, and auto coral
    let red_proc = 0
    let red_net = 0
    let red_auto_l1 = 0
    let red_auto_l23 = 0
    let red_auto_l4 = 0
    let red_tele_l1 = 0
    let red_tele_l23 = 0
    let red_tele_l4 = 0
    for (let team of red_alliance)
    {
        red_proc += dal.get_result_value(team, match, 'match_auto_algae_scoring_algae_processor') + dal.get_result_value(team, match, 'match_tele_op_algae_scoring_algae_processor')
        red_net += dal.get_result_value(team, match, 'match_auto_algae_scoring_algae_net') + dal.get_result_value(team, match, 'match_tele_op_algae_scoring_algae_net')
        red_auto_l1 += dal.get_result_value(team, match, 'match_auto_coral_scoring_level_scored_level_1')
        red_auto_l23 += dal.get_result_value(team, match, 'match_auto_coral_scoring_level_scored_level_23')
        red_auto_l4 += dal.get_result_value(team, match, 'match_auto_coral_scoring_level_scored_level_4')
        red_tele_l1 += dal.get_result_value(team, match, 'match_tele_op_coral_scoring_level_scored_level_1')
        red_tele_l23 += dal.get_result_value(team, match, 'match_tele_op_coral_scoring_level_scored_level_23')
        red_tele_l4 += dal.get_result_value(team, match, 'match_tele_op_coral_scoring_level_scored_level_4')
    }

    // compute blue processor, net, and auto coral
    let blue_proc = 0
    let blue_net = 0
    let blue_auto_l1 = 0
    let blue_auto_l23 = 0
    let blue_auto_l4 = 0
    let blue_tele_l1 = 0
    let blue_tele_l23 = 0
    let blue_tele_l4 = 0
    for (let team of blue_alliance)
    {
        blue_proc += dal.get_result_value(team, match, 'match_auto_algae_scoring_algae_processor') + dal.get_result_value(team, match, 'match_tele_op_algae_scoring_algae_processor')
        blue_net += dal.get_result_value(team, match, 'match_auto_algae_scoring_algae_net') + dal.get_result_value(team, match, 'match_tele_op_algae_scoring_algae_net')
        blue_auto_l1 += dal.get_result_value(team, match, 'match_auto_coral_scoring_level_scored_level_1')
        blue_auto_l23 += dal.get_result_value(team, match, 'match_auto_coral_scoring_level_scored_level_23')
        blue_auto_l4 += dal.get_result_value(team, match, 'match_auto_coral_scoring_level_scored_level_4')
        blue_tele_l1 += dal.get_result_value(team, match, 'match_tele_op_coral_scoring_level_scored_level_1')
        blue_tele_l23 += dal.get_result_value(team, match, 'match_tele_op_coral_scoring_level_scored_level_23')
        blue_tele_l4 += dal.get_result_value(team, match, 'match_tele_op_coral_scoring_level_scored_level_4')
    }

    // compute red leaves
    let i = 0
    let scouted_red_leaves = 0
    let actual_red_leaves = 0
    for (let team of red_alliance)
    {
        let scouted = dal.get_result_value(team, match, 'match_auto_movement_leave', true)
        let actual = red_breakdown[`autoLineRobot${++i}`]
        scouted_red_leaves += scouted === 'Yes' ? 1 : 0
        actual_red_leaves += actual === 'Yes' ? 1 : 0
    }

    // compute blue leaves
    i = 0
    let scouted_blue_leaves = 0
    let actual_blue_leaves = 0
    for (let team of blue_alliance)
    {
        let scouted = dal.get_result_value(team, match, 'match_auto_movement_leave', true)
        let actual = blue_breakdown[`autoLineRobot${++i}`]
        scouted_blue_leaves += scouted === 'Yes' ? 1 : 0
        actual_blue_leaves += actual === 'Yes' ? 1 : 0
    }

    // complete red climbs
    let red_scouters = []
    i = 0
    let scouted_red_deeps = 0
    let scouted_red_shallows = 0
    let actual_red_deeps = 0
    let actual_red_shallows = 0
    for (let team of red_alliance)
    {
        let scouted_climb = dal.get_result_value(team, match, 'match_tele_op_endgame_barge_scoring', true)
        let actual_climb = red_breakdown[`endGameRobot${++i}`]
        let climbs_match = true
        if (['Deep Climb', 'Shallow Climb'].includes(scouted_climb) || actual_climb.endsWith('Cage'))
        {
            let scouted = scouted_climb.substring(0, scouted_climb.length - 6)
            let actual = actual_climb.substring(0, actual_climb.length - 4)
            climbs_match = scouted === actual
            scouted_red_deeps += scouted === 'Deep' ? 1 : 0
            actual_red_deeps += actual === 'Deep' ? 1 : 0
            scouted_red_shallows += scouted === 'Shallow' ? 1 : 0
            actual_red_shallows += actual === 'Shallow' ? 1 : 0
        }

        let id = dal.get_result_value(team, match, 'meta_scouter_id').toString()
        if (!Object.keys(scouters).includes(id))
        {
            scouters[id] = {
                climbs: 0,
                game_pieces: 0,
                matches: 0,
            }
        }
        red_scouters.push(id)
        scouters[id].climbs += climbs_match ? 0 : 1
        scouters[id].matches++
    }

    // complete blue climbs
    let blue_scouters = []
    i = 0
    let scouted_blue_deeps = 0
    let scouted_blue_shallows = 0
    let actual_blue_deeps = 0
    let actual_blue_shallows = 0
    for (let team of blue_alliance)
    {
        let scouted_climb = dal.get_result_value(team, match, 'match_tele_op_endgame_barge_scoring', true)
        let actual_climb = blue_breakdown[`endGameRobot${++i}`]
        let climbs_match = true
        if (scouted_climb.endsWith('Climb') || actual_climb.endsWith('Cage'))
        {
            let scouted = scouted_climb.substring(0, scouted_climb.length - 6)
            let actual = actual_climb.substring(0, actual_climb.length - 4)
            climbs_match = scouted === actual
            scouted_blue_deeps += scouted === 'Deep' ? 1 : 0
            actual_blue_deeps += actual === 'Deep' ? 1 : 0
            scouted_blue_shallows += scouted === 'Shallow' ? 1 : 0
            actual_blue_shallows += actual === 'Shallow' ? 1 : 0
        }
        add_stat(`${team} Cage`, scouted_climb, actual_climb, climbs_match)

        let id = dal.get_result_value(team, match, 'meta_scouter_id').toString()
        if (!Object.keys(scouters).includes(id))
        {
            scouters[id] = {
                climbs: 0,
                game_pieces: 0,
                matches: 0
            }
        }
        blue_scouters.push(id)
        scouters[id].climbs += climbs_match ? 0 : 1
        scouters[id].matches++
    }

    // add all stats to dictionary
    matches[match] = {
        'Red Leaves': [scouted_red_leaves, actual_red_leaves],
        'Red Shallows': [scouted_red_shallows, actual_red_shallows],
        'Red Deeps': [scouted_red_deeps, actual_red_deeps],

        'Blue Leaves': [scouted_blue_leaves, actual_blue_leaves],
        'Blue Shallows': [scouted_blue_shallows, actual_blue_shallows],
        'Blue Deeps': [scouted_blue_deeps, actual_blue_deeps],

        'Red Auto L1': [red_auto_l1, red_breakdown['autoReef']['trough']],
        'Red Auto L2/3': [red_auto_l23, red_breakdown['autoReef']['tba_botRowCount'] + red_breakdown['autoReef']['tba_midRowCount']],
        'Red Auto L4': [red_auto_l4, red_breakdown['autoReef']['tba_topRowCount']],

        'Red Tele L1': [red_tele_l1, red_breakdown['teleopReef']['trough'] - red_breakdown['autoReef']['trough']],
        'Red Tele L2/3': [red_tele_l23, red_breakdown['teleopReef']['tba_botRowCount'] + red_breakdown['teleopReef']['tba_midRowCount'] - red_breakdown['autoReef']['tba_botRowCount'] - red_breakdown['autoReef']['tba_midRowCount']],
        'Red Tele L4': [red_tele_l4, red_breakdown['teleopReef']['tba_topRowCount'] - red_breakdown['autoReef']['tba_topRowCount']],

        'Red Total L1': [red_auto_l1 + red_tele_l1, red_breakdown['teleopReef']['trough']],
        'Red Total L2/3': [red_auto_l23 + red_tele_l23, red_breakdown['teleopReef']['tba_botRowCount'] + red_breakdown['teleopReef']['tba_midRowCount']],
        'Red Total L4': [red_auto_l4 + red_tele_l4, red_breakdown['teleopReef']['tba_topRowCount']],

        'Red Processor': [red_proc, red_breakdown['wallAlgaeCount']],
        'Red Net': [red_net, red_breakdown['netAlgaeCount']],

        'Blue Auto L1': [blue_auto_l1, blue_breakdown['autoReef']['trough']],
        'Blue Auto L2/3': [blue_auto_l23, blue_breakdown['autoReef']['tba_botRowCount'] + blue_breakdown['autoReef']['tba_midRowCount']],
        'Blue Auto L4': [blue_auto_l4, blue_breakdown['autoReef']['tba_topRowCount']],

        'Blue Tele L1': [blue_tele_l1, blue_breakdown['teleopReef']['trough'] - blue_breakdown['autoReef']['trough']],
        'Blue Tele L2/3': [blue_tele_l23, blue_breakdown['teleopReef']['tba_botRowCount'] + blue_breakdown['teleopReef']['tba_midRowCount'] - blue_breakdown['autoReef']['tba_botRowCount'] - blue_breakdown['autoReef']['tba_midRowCount']],
        'Blue Tele L4': [blue_tele_l4, blue_breakdown['teleopReef']['tba_topRowCount'] - blue_breakdown['autoReef']['tba_topRowCount']],

        'Blue Total L1': [blue_auto_l1 + blue_tele_l1, blue_breakdown['teleopReef']['trough']],
        'Blue Total L2/3': [blue_auto_l23 + blue_tele_l23, blue_breakdown['teleopReef']['tba_botRowCount'] + blue_breakdown['teleopReef']['tba_midRowCount']],
        'Blue Total L4': [blue_auto_l4 + blue_tele_l4, blue_breakdown['teleopReef']['tba_topRowCount']],

        'Blue Processor': [blue_proc, blue_breakdown['wallAlgaeCount']],
        'Blue Net': [blue_net, blue_breakdown['netAlgaeCount']],
    }

    // add game piece error to scouters 
    let red_gp_error = add_deltas(matches[match], ['Red Processor', 'Red Net', 'Red Total L1', 'Red Total L2/3', 'Red Total L4'])
    for (let id of red_scouters)
    {
        scouters[id].game_pieces += red_gp_error
    }

    let blue_gp_error = add_deltas(matches[match], ['Blue Processor', 'Blue Net', 'Blue Total L1', 'Blue Total L2/3', 'Blue Total L4'])
    for (let id of blue_scouters)
    {
        scouters[id].game_pieces += blue_gp_error
    }
}

/**
 * Computes the total delta of desired keys for a given match.
 * @param {Object} match Match audit data
 * @param {Array} keys List of keys to compute deltas of and sum.
 * @returns Total delta of desired keys for given match.
 */
function add_deltas(match, keys)
{
    let total = 0
    for (let key of keys)
    {
        total += Math.abs(match[key][0] - match[key][1])
    }
    return total
}

/**
 * Adds a row to the table to represent a stat.
 * @param {String} name Stat name
 * @param {*} scout_value Scouted value
 * @param {*} fms_value FMS provided value
 * @param {boolean} values_match Optional boolean to override comparison.
 */
function add_stat(name, scout_value, fms_value, values_match='')
{
    let row = results_tab.insertRow()
    row.append(create_header(name))
    row.insertCell().innerText = scout_value
    row.insertCell().innerText = fms_value
    let c = row.insertCell()
    values_match = values_match === '' ? scout_value == fms_value : values_match
    c.style.color = values_match ? 'green' : 'red'
    if (isNaN(scout_value) || isNaN(fms_value))
    {
        c.innerText = values_match
    }
    else
    {
        c.innerText = scout_value - fms_value
    }
}