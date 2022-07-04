/**
 * file:        score-estimator.js
 * description: Page for estimating rapid react match score.
 *              Adds climb points to last posted score.
 * author:      Liam Fruzyna
 * date:        2022-04-16
 */

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    // set header
    document.getElementById('header_info').innerHTML = 'Score Estimator'

    // build red score column
    let red_col = new ColumnFrame('', 'Red Alliance')
    let red_base = new Entry('red_base_score', 'Base Score', 0)
    red_base.type = 'number'
    red_col.add_input(red_base)
    let red_climb_1 = new Select('red_climb_1', 'Climb 1', ['No', 'Low', 'Med', 'High', 'Trav'], 'No')
    red_climb_1.onselect = 'calc_score()'
    red_col.add_input(red_climb_1)
    let red_climb_2 = new Select('red_climb_2', 'Climb 2', ['No', 'Low', 'Med', 'High', 'Trav'], 'No')
    red_climb_2.onselect = 'calc_score()'
    red_col.add_input(red_climb_2)
    let red_climb_3 = new Select('red_climb_3', 'Climb 3', ['No', 'Low', 'Med', 'High', 'Trav'], 'No')
    red_climb_3.onselect = 'calc_score()'
    red_col.add_input(red_climb_3)
    red_col.add_input(new Counter('red_final_score', 'Red Score', 0))

    // build blue score column
    let blue_col = new ColumnFrame('', 'Red Alliance')
    let blue_base = new Entry('blue_base_score', 'Base Score', 0)
    blue_base.type = 'number'
    blue_col.add_input(blue_base)
    let blue_climb_1 = new Select('blue_climb_1', 'Climb 1', ['No', 'Low', 'Med', 'High', 'Trav'], 'No')
    blue_climb_1.onselect = 'calc_score()'
    blue_col.add_input(blue_climb_1)
    let blue_climb_2 = new Select('blue_climb_2', 'Climb 2', ['No', 'Low', 'Med', 'High', 'Trav'], 'No')
    blue_climb_2.onselect = 'calc_score()'
    blue_col.add_input(blue_climb_2)
    let blue_climb_3 = new Select('blue_climb_3', 'Climb 3', ['No', 'Low', 'Med', 'High', 'Trav'], 'No')
    blue_climb_3.onselect = 'calc_score()'
    blue_col.add_input(blue_climb_3)
    blue_col.add_input(new Counter('blue_final_score', 'Blue Score', 0))

    // build page
    document.body.innerHTML += new PageFrame('', '', [red_col, blue_col]).toString
}

/**
 * function:    get_climb_points
 * parameters:  select id
 * returns:     number of climb points
 * description: Returns the climb points for a select.
 */
function get_climb_points(id)
{
    switch (Select.get_selected_option(id))
    {
        case 0:
            return 0
        case 1:
            return 4
        case 2:
            return 6
        case 3:
            return 10
        case 4:
            return 15
    }
}

/**
 * function:    calc_score
 * parameters:  none
 * returns:     none
 * description: Calculate score when an input changes and update counter.
 */
function calc_score()
{
    let red_points = parseInt(document.getElementById('red_base_score').value) + get_climb_points('red_climb_1') + get_climb_points('red_climb_2') + get_climb_points('red_climb_3')
    let blue_points = parseInt(document.getElementById('blue_base_score').value) + get_climb_points('blue_climb_1') + get_climb_points('blue_climb_2') + get_climb_points('blue_climb_3')
    document.getElementById('red_final_score').innerHTML = red_points
    document.getElementById('blue_final_score').innerHTML = blue_points
}