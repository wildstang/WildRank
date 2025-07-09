/**
 * file:        2025-score-calculator.js
 * description: Page for estimating Reefscape match score.
 * author:      Liam Fruzyna
 * date:        2025-03-08
 */

/**
 * Represents the score keeping interface of a single alliance.
 */
class Alliance
{
    constructor(color)
    {
        this.color = color
        this.page = new WRPage(`${color} Alliance`)

        this.leaves = new WRCounter('Left')
        this.coral_bonuses = new WRMultiCounter('Coral', ['Top Levels', 'Bottom Levels'])
        this.page.add_column(new WRColumn('Auto', [this.leaves, this.coral_bonuses]))

        this.algae = new WRMultiCounter('Algae', ['Barge', 'Processor'])
        this.coral = new WRMultiCounter('Coral', ['Level 4', 'Level 3', 'Level 2', 'Level 1'])
        this.page.add_column(new WRColumn('Teleop', [this.algae, this.coral]))

        this.climbs = new WRMultiCounter('Climbs', ['Park', 'Shallow Cage', 'Deep Cage'])
        this.penalties = new WRMultiCounter('Penalty', ['Foul', 'Tech'])
        this.page.add_column(new WRColumn('End Game', [this.climbs, this.penalties]))
    }

    get leave_points()
    {
        return parseInt(this.leaves.value_el.innerText) * 3
    }

    get coral_points()
    {
        return parseInt(this.coral.counters[0].value_el.innerText) * 5 +
            parseInt(this.coral.counters[1].value_el.innerText) * 4 +
            parseInt(this.coral.counters[2].value_el.innerText) * 3 +
            parseInt(this.coral.counters[3].value_el.innerText) * 2 +
            parseInt(this.coral_bonuses.counters[0].value_el.innerText) * 2 +
            parseInt(this.coral_bonuses.counters[1].value_el.innerText)
    }

    get algae_points()
    {
        return parseInt(this.algae.counters[0].value_el.innerText) * 4 +
            parseInt(this.algae.counters[1].value_el.innerText) * 6
    }

    get barge_points()
    {
        return parseInt(this.climbs.counters[0].value_el.innerText) * 2 +
            parseInt(this.climbs.counters[1].value_el.innerText) * 6 +
            parseInt(this.climbs.counters[2].value_el.innerText) * 12
    }

    get penalty_points()
    {
        return parseInt(this.penalties.counters[0].value_el.innerText) * 2 +
            parseInt(this.penalties.counters[1].value_el.innerText) * 6
    }

    get score()
    {
        return this.leave_points + this.algae_points + this.coral_points + this.barge_points + this.penalty_points
    }

    get coop()
    {
        return parseInt(this.algae.counters[1].value_el.innerText) >= 2
    }

    get auto_rp()
    {
        let total_coral = parseInt(this.coral_bonuses.counters[0].value_el.innerText) + parseInt(this.coral_bonuses.counters[1].value_el.innerText)
        return this.leave_points === 9 && total_coral >= 1
    }

    coral_rp(coop_bonus=false)
    {
        let levels = coop_bonus ? 3 : 4
        return (parseInt(this.coral.counters[0].value_el.innerText) >= 5) * 1 +
            (parseInt(this.coral.counters[1].value_el.innerText) >= 5) * 1 +
            (parseInt(this.coral.counters[2].value_el.innerText) >= 5) * 1 +
            (parseInt(this.coral.counters[3].value_el.innerText) >= 5) * 1 >= levels
    }

    get barge_rp()
    {
        return this.barge_points >= 14
    }

    get score_card()
    {
        let cell = document.createElement('th')
        cell.style.backgroundColor = this.color
        cell.style.color = 'white'
        cell.width = 175

        let name = document.createElement('div')
        name.innerText = this.color.toUpperCase()
        let score = document.createElement('h1')
        score.innerText = this.score

        cell.append(name, score)
        return cell
    }
}

var red, blue, score

/**
 * Runs on page load to initialize the page.
 */
function init_page()
{
    header_info.innerText = 'Score Calculator'

    blue = new Alliance('Blue')
    red = new Alliance('Red')
    let submit = new WRButton('Calculate', breakdown)
    score = document.createElement('span')
    console.log(submit)
    preview.replaceChildren(blue.page, red.page, new WRPage('', [new WRColumn('', [submit, score])]))
}

/**
 * Adds a row to a given table to represent a component score.
 * @param {HTMLTableElement} table Table to add a row to.
 * @param {String} name Name of the scoring component.
 * @param {Number} blue Blue component score.
 * @param {Number} red Red component score.
 */
function add_score_row(table, name, blue, red)
{
    let row = table.insertRow()

    let blue_el = document.createElement('h2')
    blue_el.innerText = blue
    row.insertCell().append(blue_el)

    row.append(create_header(name))

    let red_el = document.createElement('h2')
    red_el.innerText = red
    row.insertCell().append(red_el)
}

/**
 * Builds a card containing a breakdown of the score, matching the on-screen breakdown.
 */
function breakdown()
{
    let table = document.createElement('table')
    table.style.textAlign = 'center'
    let row = table.insertRow()
    row.append(blue.score_card)
    row.insertCell()
    row.append(red.score_card)

    add_score_row(table, 'LEAVE', blue.leave_points, red.leave_points)
    add_score_row(table, 'CORAL', blue.coral_points, red.coral_points)
    add_score_row(table, 'ALGAE', blue.algae_points, red.algae_points)
    add_score_row(table, 'BARGE', blue.barge_points, red.barge_points)
    add_score_row(table, 'PENALTY', blue.penalty_points, red.penalty_points)

    row = table.insertRow()
    let blue_rps = row.insertCell()
    row.insertCell()
    let red_rps = row.insertCell()

    let coop_bonus = blue.coop + red.coop

    let blue_win = blue.score > red.score
    let red_win = blue.score < red.score

    if (blue_win)
    {
        blue_rps.innerText += '🏆 🏆 🏆 '
    }
    else if (red_win)
    {
        red_rps.innerText += '🏆 🏆 🏆 '
    }
    else
    {
        blue_rps.innerText == '🏆 '
        red_rps.innerText == '🏆 '
    }

    if (blue.auto_rp)
    {
        blue_rps.innerText += '🤖 '
    }
    if (red.auto_rp)
    {
        red_rps.innerText += '🤖 '
    }

    if (blue.coral_rp(coop_bonus))
    {
        blue_rps.innerText += '🪸 '
    }
    if (red.coral_rp(coop_bonus))
    {
        red_rps.innerText += '🪸 '
    }

    if (blue.barge_rp)
    {
        blue_rps.innerText += '🛥️ '
    }
    if (red.barge_rp)
    {
        red_rps.innerText += '🛥️ '
    }

    score.replaceChildren(new WRCard(table, true))
}