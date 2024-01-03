/**
 * file:        2023-score-estimator.js
 * description: Page for estimating charged up match score.
 *              Adds charging station to last posted score.
 * author:      Liam Fruzyna
 * date:        2023-02-04
 */

const CLIMB_OPTIONS = ['No', 'Prk', 'Dok', 'Eng']

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    // set header
    document.getElementById('header_info').innerText = 'Score Estimator'

    // build red score column
    let red_col = new ColumnFrame('', 'Red Alliance')
    let red_base = new Entry('red_base_score', 'Base Score', 0)
    red_base.type = 'number'
    red_base.on_text_change = 'calc_score()'
    red_col.add_input(red_base)
    let red_climb_1 = new Select('red_climb_1', 'Climb 1', CLIMB_OPTIONS, 'No')
    red_climb_1.on_change = 'calc_score()'
    red_col.add_input(red_climb_1)
    let red_climb_2 = new Select('red_climb_2', 'Climb 2', CLIMB_OPTIONS, 'No')
    red_climb_2.on_change = 'calc_score()'
    red_col.add_input(red_climb_2)
    let red_climb_3 = new Select('red_climb_3', 'Climb 3', CLIMB_OPTIONS, 'No')
    red_climb_3.on_change = 'calc_score()'
    red_col.add_input(red_climb_3)
    red_col.add_input(new Number('red_final_score', 'Red Score', 0))

    // build blue score column
    let blue_col = new ColumnFrame('', 'Blue Alliance')
    let blue_base = new Entry('blue_base_score', 'Base Score', 0)
    blue_base.type = 'number'
    blue_base.on_text_change = 'calc_score()'
    blue_col.add_input(blue_base)
    let blue_climb_1 = new Select('blue_climb_1', 'Climb 1', CLIMB_OPTIONS, 'No')
    blue_climb_1.on_change = 'calc_score()'
    blue_col.add_input(blue_climb_1)
    let blue_climb_2 = new Select('blue_climb_2', 'Climb 2', CLIMB_OPTIONS, 'No')
    blue_climb_2.on_change = 'calc_score()'
    blue_col.add_input(blue_climb_2)
    let blue_climb_3 = new Select('blue_climb_3', 'Climb 3', CLIMB_OPTIONS, 'No')
    blue_climb_3.on_change = 'calc_score()'
    blue_col.add_input(blue_climb_3)
    blue_col.add_input(new Number('blue_final_score', 'Blue Score', 0))

    // build page
    document.body.append(new PageFrame('', '', [red_col, blue_col]).element)
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
        case 1:
            return 2
        case 2:
            return 6
        case 3:
            return 10
    }
    return 0
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