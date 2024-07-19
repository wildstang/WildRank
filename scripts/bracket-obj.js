/**
 * file:        bracket-obj.js
 * description: Contains objects for managing a double elim bracket.
 * author:      Liam Fruzyna
 * date:        2024-02-17
 */

// an array representing the matches in the bracket and which lead where
const BRACKET = [
    [6, 'r', 4, 'r'], [6, 'b', 4, 'b'], [7, 'r', 5, 'r'], [7, 'b', 5, 'b'],
    [9, 'b'], [8, 'b'], [10, 'r', 8, 'r'], [10, 'b', 9, 'r'],
    [11, 'b'], [11, 'r'],
    [13, 'r', 12, 'r'], [12, 'b'],
    [13, 'b'],
    []
]

var bracket

class ElimMatch
{
    /**
     * Constructor of ElimMatch.
     * 
     * @param {number} idx Match index (number - 1)
     */
    constructor(idx)
    {
        this.id = -1
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
    mark_winner(alliance, matches)
    {
        // marks the winner and loser fields
        this.winner = alliance === 'red' ? this.red_alliance : this.blue_alliance
        this.loser = alliance === 'red' ? this.blue_alliance : this.red_alliance

        // gets the matches populated by these alliances
        let next_matches = BRACKET[this.idx]

        // populate the winners next match with the winning alliance
        if (next_matches.length >= 2)
        {
            let match = matches[next_matches[0]]
            if (next_matches[1] === 'r')
            {
                match.red_alliance = this.winner
            }
            else
            {
                match.blue_alliance = this.winner
            }
        }

        // if this is an upper bracket math, populate the losers next match with the losing alliance
        if (next_matches.length === 4)
        {
            let match = matches[next_matches[2]]
            if (next_matches[3] === 'r')
            {
                match.red_alliance = this.loser
            }
            else
            {
                match.blue_alliance = this.loser
            }
        }
    }

    /**
     * The winning alliance color.
     */
    get winning_color()
    {
        if (this.winner > -1)
        {
            if (this.winner === this.red_alliance)
            {
                return 'red'
            }
            if (this.winner === this.blue_alliance)
            {
                return 'blue'
            }
        }
        return ''
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
        if (this.number === BRACKET.length)
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
        if (this.number === BRACKET.length)
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
                match = `Eliminated in ${match.name}`
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

/**
 * Determines if a given alliance is valid and can be used.
 * 
 * @param {array} alliance Array of team numbers
 * @returns {boolean} Whether or not the alliance is populated.
 */
function alliance_valid(alliance)
{
    return alliance.length > 0 && alliance.every(t => parseInt(t) > 0)
}


/**
 * Bracket object which manages the bracket page.
 */
class Bracket
{
    /**
     * Initialize the bracket and its two arrays of matches and alliances.
     */
    constructor(event_id, populate_page)
    {
        this.matches = new Array(BRACKET.length)
        this.alliances = new Array(8)
        this.populate_page = populate_page

        // wait until the page is loaded before accessing dal
        this.winners_key = `${event_id}-delim-winners`

        // populate matches with bare ElimMatches
        for (let i = 0; i < BRACKET.length; i++)
        {
            this.matches[i] = new ElimMatch(i)
        }

        // elim matches are given the short name M# and use set_number to store the match number
        // matches are sorted to ensure winner are set in correct order
        let match_keys = Object.keys(dal.matches).filter(m => dal.matches[m].short_match_name.startsWith('M'))
                                                 .sort((a, b) => dal.matches[a].set_number - dal.matches[b].set_number)

        // populate alliances with Alliances of teams
        for (let key of match_keys)
        {
            let match = dal.matches[key]
            // determine alliance number based off match number and alliance color
            let idx = [0, 3, 1, 2][match.set_number - 1]
            if (idx < 4)
            {
                if (match.red_alliance.length)
                {
                    this.alliances[idx] = new Alliance(idx, match.red_alliance)
                }
                if (match.blue_alliance.length)
                {
                    idx = 7 - idx
                    this.alliances[idx] = new Alliance(idx, match.blue_alliance)
                }
            }
        }

        // add the last final match to the end
        for (let i = 3; i >= 0; i--)
        {
            let final_id = `${dal.event_id}_f1m${i}`
            if (final_id in dal.matches)
            {
                match_keys.push(final_id)
                break
            }
        }

        // populate matches with alliances
        let winners = this.get_winners()
        for (let i in match_keys)
        {
            let key = match_keys[i]
            let match = dal.matches[key]
            this.matches[i].id = key
            // get alliances from TBA data
            if (alliance_valid(match.red_alliance))
            {
                this.matches[i].red_alliance = this.alliances.filter(a => a.is(match.red_alliance))[0].idx
            }
            if (alliance_valid(match.blue_alliance))
            {
                this.matches[i].blue_alliance = this.alliances.filter(a => a.is(match.blue_alliance))[0].idx
            }
            // get winner either from TBA data or winner file
            if (match.winner)
            {
                this.matches[i].mark_winner(match.winner, this.matches)
            }
            else if (winners[i])
            {
                this.matches[i].mark_winner(winners[i], this.matches)
            }
        }

        // mark remaining winners using stored values
        for (let i = match_keys.length; i < this.matches.length; i++)
        {
            if (winners[i])
            {
                this.matches[i].mark_winner(winners[i], this.matches)
            }
        }
    }

    /**
     * Builds the bracket page and all of the matches within it.
     * 
     * @param {number} alliance Alliance number where 0 is all alliances.
     * @returns {PageFrame} The built page
     */
    build_page(alliance=0)
    {
        // build a column for each round and a card for each match
        let page = new WRPage()
        let columns = [new WRColumn('Round 1')]
        for (let i in this.matches)
        {
            let match = this.matches[i]
            if (alliance === 0 || [match.red_alliance, match.blue_alliance].includes(alliance - 1))
            {
                let card = this.build_match(match)  
                // if the match is set but not started add a button below to preview in coach mode
                if (match.winner === -1 && match.red_alliance > -1 && match.blue_alliance > -1)
                {
                    let match_num = parseInt(i) + 1
                    let match_key = `${dal.event_id}_sf${match_num}`
                    if (match.id === -1 && !Object.keys(dal.matches).includes(match_key))
                    {
                        // if the match doesn't exist, create it, then open it
                        let red_teams = this.alliances[match.red_alliance].teams
                        let blue_teams = this.alliances[match.blue_alliance].teams
                        add_match(match_num, red_teams, blue_teams)
                    }

                    let button = new WRButton('Preview Match', () => open_option(match_key))

                    let stack = new WRStack([card, button])
                    columns[columns.length - 1].add_input(stack)
                }
                else
                {
                    columns[columns.length - 1].add_input(card)
                }
            }
            if (['3', '7', '9', '11', '12'].includes(i))
            {
                page.add_column(columns[columns.length - 1])
                columns.push(new WRColumn(`Round ${columns.length + 1}`))
            }
        }
        page.add_column(columns[columns.length - 1])
        return page
    }


    /**
     * Builds an Element containing the match teams of a given ElimMatch
     * 
     * @param {ElimMatch} match Object representation of the match to build.
     * @returns {Card} Populated WR Card
     */
    build_match(match)
    {
        // add match name
        let title = document.createElement('h3')
        title.innerText = match.name

        // add bracket name
        let subtitle = document.createElement('h5')
        let len = BRACKET[match.idx].length
        if (len > 2)
        {
            subtitle.innerText = `Upper Bracket`
        }
        else if (len == 2)
        {
            subtitle.innerText = `Lower Bracket`
        }
        else
        {
            subtitle = ''
        }

        // build each alliance
        let red = this.build_alliance(match, 'red')
        let blue = this.build_alliance(match, 'blue')

        let container = document.createElement('span')
        container.append(title, subtitle, red, blue)

        // build card around container
        let card = new WRCard(container)
        card.space_after = false
        card.add_class('elim_match')
        if (match.winner > -1)
        {
            card.add_class('complete')
        }

        return card
    }

    /**
     * Builds an Element containing an alliance of a given ElimMatch.
     * 
     * @param {ElimMatch} match Object representation of the match to build.
     * @param {string} color Color of the alliance to build.
     * @returns {Element} Populated Element
     */
    build_alliance(match, color)
    {
        // create the based Element with an appropriate color
        let alliance = document.createElement('div')
        alliance.className = color

        // get the alliance index of the match-color
        let idx = match[`${color}_alliance`]

        // if the alliance is populated
        if (idx > -1)
        {
            // populate the alliance with its string of teams
            alliance.innerText = this.alliances[idx].team_str

            // if the alliance is the winner, bold the alliance and specify which match they will play in next
            if (match.winner === idx)
            {
                alliance.style.fontWeight = 'bold'
                if (match.idx === BRACKET.length - 1)
                {
                    alliance.append(br(), 'Event Winner!')
                }
                else
                {
                    alliance.append(br(), `Advanced to ${this.matches[BRACKET[match.idx][0]].short_name}`)
                }
            }
            // if the alliance is the loser in a lower bracket match, strike-through the alliance
            else if (BRACKET[match.idx].length <= 2 && match.loser === idx)
            {
                alliance.style.textDecoration = 'line-through'
            }
            // if the alliance is the loser in an upper bracket match, specify which match they will play in next
            else if (match.loser === idx)
            {
                alliance.append(br(), `Advanced to ${this.matches[BRACKET[match.idx][2]].short_name}`)
            }
            // if there is no winner yet and both teams are present, place a button to choose the alliance as the winner
            else if (match.red_alliance > -1 && match.blue_alliance > -1 && BRACKET[match.idx].length > 0)
            {
                let button = document.createElement('button')
                button.onclick = e => {
                    match.mark_winner(color, this.matches)
                    this.save_winners()
                    this.populate_page()
                }
                button.innerText = 'Winner'
                button.className = 'winner_button'
                alliance.append(br(), button)
            }
        }
        // if the alliance is not populated
        else
        {
            // iterate over previous matches to find the match filling that spot
            for (let i = 0; i < match.idx; i++)
            {
                let prev_match = this.matches[i]
                let next_matches = BRACKET[i]
                let pos = next_matches.indexOf(match.idx)
                // if the match number is found in the previous match and the alliance color matches
                // specify which match fills the position and what teams are playing in the match
                if (pos === 0 && next_matches[1] === color[0])
                {
                    this.add_speculative_teams(alliance, prev_match, 'Winner')
                }
                if (pos === 2 && next_matches[3] === color[0])
                {
                    this.add_speculative_teams(alliance, prev_match, 'Loser')
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
    add_speculative_teams(alliance, prev_match, state)
    {
        // state which match determines who will play here
        alliance.innerText = `${state} of ${prev_match.short_name}`

        // determine which teams could play here next
        let alliance_idcs = [prev_match.red_alliance, prev_match.blue_alliance].filter(i => i >= 0)
        if (alliance_idcs.length > 0)
        {
            let teams = alliance_idcs.map(i => this.alliances[i].team_str)
            for (let team of teams)
            {
                alliance.append(br(), team)
            }
        }
    }

    /**
     * Stores the winning color of each map in sessionStorage for recalling later.
     */
    save_winners()
    {
        sessionStorage.setItem(this.winners_key, JSON.stringify(this.matches.map(m => m.winning_color)))
    }

    /**
     * Pulls the list of winning colors from sessionStorage.
     * @returns {Array} Array of winning color strings.
     */
    get_winners()
    {
        let winners = sessionStorage.getItem(this.winners_key)
        if (winners === null)
        {
            return new Array(this.matches.length)
        }
        return JSON.parse(winners)
    }
}