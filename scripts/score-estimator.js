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

    // build page
    document.body.innerHTML += 
        build_page_frame('', [
            build_column_frame('Red Alliance', [
                build_num_entry('red_base_score', 'Base Score', 0),
                build_select('red_climb_1', 'Climb 1', ['No', 'Low', 'Med', 'High', 'Trav'], 'No', 'calc_score()'),
                build_select('red_climb_2', 'Climb 2', ['No', 'Low', 'Med', 'High', 'Trav'], 'No', 'calc_score()'),
                build_select('red_climb_3', 'Climb 3', ['No', 'Low', 'Med', 'High', 'Trav'], 'No', 'calc_score()'),
                build_counter('red_final_score', 'Red Score', 0)
            ]),
            build_column_frame('Blue Alliance', [
                build_num_entry('blue_base_score', 'Base Score', 0),
                build_select('blue_climb_1', 'Climb 1', ['No', 'Low', 'Med', 'High', 'Trav'], 'No', 'calc_score()'),
                build_select('blue_climb_2', 'Climb 2', ['No', 'Low', 'Med', 'High', 'Trav'], 'No', 'calc_score()'),
                build_select('blue_climb_3', 'Climb 3', ['No', 'Low', 'Med', 'High', 'Trav'], 'No', 'calc_score()'),
                build_counter('blue_final_score', 'Blue Score', 0)
            ])
        ])
}

/**
 * function:    get_climb_points
 * parameters:  select id
 * returns:     number of climb points
 * description: Returns the climb points for a select.
 */
function get_climb_points(id)
{
    switch (get_selected_option(id))
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
    console.log(red_points, blue_points)
    document.getElementById('red_final_score').innerHTML = red_points
    document.getElementById('blue_final_score').innerHTML = blue_points
}