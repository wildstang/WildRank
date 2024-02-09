/**
 * file:        bracket.js
 * description: Lists all double elim matches and the teams.
 *              Allows manual advancement of teams if no network.
 * author:      Liam Fruzyna
 * date:        2024-02-08
 */

include('transfer')

// an array representing the matches in the bracket and which lead where
const BRACKET = [
    [6, 'r', 4, 'r'], [6, 'b', 4, 'b'], [7, 'r', 5, 'r'], [7, 'b', 5, 'b'],
    [9, 'b'], [8, 'b'], [10, 'r', 8, 'r'], [10, 'b', 9, 'r'],
    [11, 'b'], [11, 'r'],
    [13, 'r', 12, 'r'], [12, 'b'],
    [13, 'b'],
    []
]

class ElimMatch
{
    /**
     * Constructor of ElimMatch.
     * 
     * @param {number} idx Match index (number - 1)
     */
    constructor(idx)
    {
        this.idx = idx
        this.red_alliance = -1
        this.blue_alliance = -1
        this.winner = -1
        this.loser = -1
    }

    /**
     * Populates the winner and loser fields using the given winning alliance color.
     * Then attempts to populate the teams in the following matches.
     * 
     * @param {string} alliance Winning alliance color 
     */
    mark_winner(alliance)
    {
        // marks the winner and loser fields
        this.winner = alliance === 'red' ? this.red_alliance : this.blue_alliance
        this.loser = alliance === 'red' ? this.blue_alliance : this.red_alliance

        // gets the matches populated by these alliances
        let next_matches = BRACKET[this.idx]

        // populate the winners next match with the winning alliance
        if (next_matches.length >= 2)
        {
            if (next_matches[1] === 'r')
            {
                matches[next_matches[0]].red_alliance = this.winner
            }
            else
            {
                matches[next_matches[0]].blue_alliance = this.winner
            }
        }

        // if this is an upper bracket math, populate the losers next match with the losing alliance
        if (next_matches.length === 4)
        {
            if (next_matches[3] === 'r')
            {
                matches[next_matches[2]].red_alliance = this.loser
            }
            else
            {
                matches[next_matches[2]].blue_alliance = this.loser
            }
        }
    }

    /**
     * The match number.
     */
    get number()
    {
        return this.idx + 1
    }

    /**
     * The full name of the match.
     */
    get name()
    {
        if (this.number === matches.length)
        {
            return 'Finals'
        }
        return `Match ${this.number}`
    }

    /**
     * A short name describing the match.
     */
    get short_name()
    {
        if (this.number === matches.length)
        {
            return 'F'
        }
        return `M${this.number}`
    }
}

/**
 * Represents an alliance in the double-elim tournament.
 */
class Alliance
{
    /**
     * Constructor of Alliance.
     * 
     * @param {number} idx Alliance index (number - 1)
     * @param {array} teams List of team numbers
     */
    constructor(idx, teams)
    {
        this.idx = idx
        this.teams = teams
    }

    /**
     * Determines if a given array of teams is the current alliance.
     * 
     * @param {array} teams A set of team numbers.
     * @returns True if any of the given teams are in this alliance.
     */
    is(teams)
    {
        for (let team of teams)
        {
            if (this.teams.includes(team))
            {
                return true
            }
        }
        return false
    }

    /**
     * Determines which match this alliance is a part of.
     * Returns the match object or a string describing their fate.
     */
    get match()
    {
        let match = [match1, match2, match3, match4][3.5 - Math.abs(alliances - 4.5)]
        while (true)
        {
            next_match = match.get_next_match(match.winner)
            if (next_match !== null)
            {
                match = next_match
            }
            if (match === 'Elim')
            {
                match = `Eliminated in match ${match.id}`
                break
            }
            else if (match === 'Win')
            {
                match = `Won Event`
                break
            }
        }
    }

    /**
     * The alliance number.
     */
    get number()
    {
        return this.idx + 1
    }

    /**
     * The alliance number and teams as a string.
     */
    get team_str()
    {
        return `(${this.number}) ${this.teams.join(', ')}`
    }
}


// initialize two arrays representing the matches and alliance
var matches = new Array(BRACKET.length)
var alliances = new Array(8)


/**
 * Initializes the contents of the page on page load.
 */
function init_page()
{
    if (dal.event.playoff_type !== 10)
    {
        document.getElementById('body').innerText = 'Not a double-elimination event.'
    }
    else
    {
        // populate matches with bare ElimMatches
        for (let i = 0; i < BRACKET.length; i++)
        {
            matches[i] = new ElimMatch(i)
        }

        // populate alliances with Alliances of teams
        for (let i in dal.matches)
        {
            let match = dal.matches[i]
            if (match.short_match_name.startsWith('M'))
            {
                // determine alliance number based off match number and alliance color
                let idx = [0, 3, 1, 2][match.set_number - 1]
                if (idx < 4)
                {
                    if (match.red_alliance.length)
                    {
                        alliances[idx] = new Alliance(idx, match.red_alliance)
                    }
                    if (match.blue_alliance.length)
                    {
                        idx = 7 - idx
                        alliances[idx] = new Alliance(idx, match.blue_alliance)
                    }
                }
            }
        }

        // populate matches with alliances
        for (let i in dal.matches)
        {
            let match = dal.matches[i]
            if (match.short_match_name.startsWith('M'))
            {
                let idx = match.set_number - 1
                if (match.red_alliance.length)
                {
                    matches[idx].red_alliance = alliances.filter(a => a.is(match.red_alliance))[0].idx
                }
                if (match.blue_alliance.length)
                {
                    matches[idx].blue_alliance = alliances.filter(a => a.is(match.blue_alliance))[0].idx
                }
                if (match.winner)
                {
                    matches[idx].mark_winner(match.winner)
                }
            }
        }

        build_page()
    }
}

/**
 * Populates the page with all available matches.
 */
function build_page()
{
    let p = document.createElement('p')
    for (let match of matches)
    {
        p.append(build_match(match))
    }
    document.getElementById('body').replaceChildren(p)
}

/**
 * Builds an Element containing the match teams of a given ElimMatch
 * 
 * @param {ElimMatch} match Object representation of the match to build.
 * @returns {Element} Populated Element
 */
function build_match(match)
{
    // add match name
    let title = document.createElement('h3')
    title.innerText = match.name

    // build each alliance
    let red = build_alliance(match, 'red')
    let blue = build_alliance(match, 'blue')

    let container = document.createElement('div')
    container.append(title, red, br(), blue)
    return container
}

/**
 * Builds an Element containing an alliance of a given ElimMatch.
 * 
 * @param {ElimMatch} match Object representation of the match to build.
 * @param {string} color Color of the alliance to build.
 * @returns {Element} Populated Element
 */
function build_alliance(match, color)
{
    // create the based Element with an appropriate color
    let alliance = document.createElement('label')
    alliance.className = color

    // get the alliance index of the match-color
    let idx = match[`${color}_alliance`]

    // if the alliance is populated
    if (idx > -1)
    {
        // populate the alliance with its string of teams
        alliance.innerText = alliances[idx].team_str

        // if the alliance is the winner, bold the alliance and specify which match they will play in next
        if (match.winner === idx)
        {
            alliance.style.fontWeight = 'bold'
            alliance.innerText += ` to ${matches[BRACKET[match.idx][0]].short_name}`
        }
        // if the alliance is the loser in a lower bracket match, strike-through the alliance
        else if (BRACKET[match.idx].length === 2 && match.loser === idx)
        {
            alliance.style.textDecoration = 'line-through'
        }
        // if the alliance is the loser in an upper bracket match, specify which match they will play in next
        else if (match.loser === idx)
        {
            alliance.innerText += ` to ${matches[BRACKET[match.idx][2]].short_name}`
        }
        // if there is no winner yet and both teams are present, place a button to choose the alliance as the winner
        else if (match.red_alliance > -1 && match.blue_alliance > -1 && BRACKET[match.idx].length > 0)
        {
            let button = document.createElement('button')
            button.onclick = e => {
                match.mark_winner(color)
                build_page()
            }
            button.innerText = 'Winner'
            alliance.append(' ', button)
        }
    }
    // if the alliance is not populated
    else
    {
        // iterate over previous matches to find the match filling that spot
        for (let i = 0; i < match.idx; i++)
        {
            let prev_match = matches[i]
            let next_matches = BRACKET[i]
            let pos = next_matches.indexOf(match.idx)
            // if the match number is found in the previous match and the alliance color matches
            // specify which match fills the position and what teams are playing in the match
            if (pos === 0 && next_matches[1] === color[0])
            {
                add_speculative_teams(alliance, prev_match, 'Winner')
            }
            if (pos === 2 && next_matches[3] === color[0])
            {
                add_speculative_teams(alliance, prev_match, 'Loser')
            }
        }
    }
    return alliance
}

/**
 * Adds to a given match element who the potential next players are.
 * 
 * @param {Element} alliance An Element to append information to.
 * @param {ElimMatch} prev_match The match determining determining this spot.
 * @param {string} state Winner/Loser of the previous match. 
 */
function add_speculative_teams(alliance, prev_match, state)
{
    // state which match determines who will play here
    alliance.innerText = `${state} of ${prev_match.short_name}`

    // determine which teams could play here next
    let alliance_idcs = [prev_match.red_alliance, prev_match.blue_alliance].filter(i => i >= 0)
    if (alliance_idcs.length > 0)
    {
        let teams = alliance_idcs.map(i => alliances[i].team_str).join(' or ')
        alliance.append(br(), teams)
    }
}