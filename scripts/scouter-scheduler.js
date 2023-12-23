/**
 * file:        scouter-scheduler.js
 * description: Generate and tweak a schedule of scouters from a list of names.
 *              The original goal of this was to incorperate match schedules but I don't think thats very necessary.
 * author:      Liam Fruzyna
 * date:        2023-01-08
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
    document.getElementById('header_info').innerText = 'Scouter Scheduler'

    // build inputs
    let scouters = new Extended('scouters', 'Enter Scouters')
    let teams = dal.alliance_size * 2
    if (teams === 0)
    {
        teams = 6
    }
    let per_shift = new Entry('per_shift', 'Scouters Per Shift', teams)
    per_shift.type = 'number'
    per_shift.bounds = [1, 25, 1]
    let min_break = new Entry('min_break', 'Min Hours Between Shifts', 1)
    min_break.type = 'number'
    min_break.bounds = [0, 10, 0.5]
    let shift_len = new Entry('shift_len', 'Shift Length (Hours)', 1)
    shift_len.type = 'number'
    shift_len.bounds = [0, 10, 0.5]
    let generate = new Button('generate', 'Generate', 'generate_shifts()')
    let export_shifts = new Button('export', 'Export', 'export_shifts()')

    let columns = [new ColumnFrame('', '', [scouters, per_shift, min_break, shift_len, generate, export_shifts])]

    document.body.append(new PageFrame('', '', columns).element)
}

/**
 * function:    generate_shifts
 * parameters:  none
 * returns:     none
 * description: Populates shifts with a random selection of scouters.
 */
let shifts = []
function generate_shifts()
{
    let scouters = document.getElementById('scouters').value.split(',').map(s => s.trim())
    let per_shift = parseInt(document.getElementById('per_shift').value)
    let min_break = parseFloat(document.getElementById('min_break').value)
    let shift_len = parseFloat(document.getElementById('shift_len').value)

    let num_shifts = Math.floor(min_break / shift_len) + 1
    let min_scouters = (num_shifts) * per_shift

    // check that enough scouters are provided
    if (min_scouters > scouters.length)
    {
        alert(`Not enough scouters! ${min_scouters} are required, ${scouters.length} are available.`)
        build_shifts()
        return
    }
    else if (scouters.length > min_scouters)
    {
        num_shifts = Math.floor(scouters.length / per_shift)
    }

    // make array of empty arrays
    shifts = []
    for (let i = 0; i < num_shifts; i++)
    {
        shifts.push([])
    }

    // build array of shifts
    let shift = 0
    while (scouters.length > 0 && shifts[num_shifts - 1].length < per_shift)
    {
        let idx = random_int(0, scouters.length-1)
        shifts[shift++].push(scouters.splice(idx, 1)[0])

        if (shift === num_shifts)
        {
            shift = 0
        }
    }

    // add remaining scouters to spare lists
    if (scouters.length > 0)
    {
        for (let i in scouters)
        {
            if (i % per_shift === 0)
            {
                shifts.push([])
            }
            shifts[shifts.length - 1].push(scouters[i])
        }

    }

    build_shifts()
}

/**
 * function:    swap
 * parameters:  team to swap
 * returns:     none
 * description: Swaps or prepares to swap scouters.
 */
let swapping = ''
function swap(team)
{
    if (swapping === '')
    {
        swapping = team
        for (let shift of shifts)
        {
            for (let scouter of shift)
            {
                if (scouter !== team)
                {
                    document.getElementById(scouter).innerText = `Swap w/ ${scouter}`
                }
                else
                {
                    document.getElementById(scouter).innerText = 'Cancel'
                }
            }
        }
        return
    }
    else if (swapping !== team)
    {
        for (let shift of shifts)
        {
            let team_idx = shift.indexOf(team)
            let swap_idx = shift.indexOf(swapping)
            if (team_idx >= 0)
            {
                shift.splice(team_idx, 1, swapping)
            }
            if (swap_idx >= 0)
            {
                shift.splice(swap_idx, 1, team)
            }
        }
    }
    
    swapping = ''
    build_shifts()
}

/**
 * function:    build_shifts
 * parameters:  none
 * returns:     none
 * description: Builds the page of shifts.
 */
function build_shifts()
{
    // remove existing shifts page
    let e = document.getElementById('shifts')
    if (e)
    {
        e.remove()
    }

    let shifts_page = new PageFrame('shifts')
    for (let i in shifts)
    {
        let shift = shifts[i]
        let name = `Shift ${parseInt(i)+1}`
        if (shift.length < document.getElementById('per_shift').value)
        {
            name = 'Spares'
        }
        let shift_col = new ColumnFrame('', name)
        for (let scouter of shift)
        {
            let button = new Button(scouter, scouter, `swap('${scouter}')`)
            shift_col.add_input(button)
        }
        shifts_page.add_column(shift_col)
    }

    // text area gets cleared, keep it populated
    let scouters = document.getElementById('scouters').value
    document.body.append(shifts_page.element)
    document.getElementById('scouters').value = scouters
}

/**
 * function:    export_shifts
 * parameters:  none
 * returns:     none
 * description: Builds a csv file of shifts.
 */
function export_shifts()
{
    let lines = ''
    for (let i in shifts)
    {
        let shift = shifts[i]
        let line = `Shift ${parseInt(i)+1}`
        if (shift.length < shifts[0].length)
        {
            line = 'Spares'
        }
        for (let scouter of shift)
        {
            line += `,${scouter}`
        }
        lines += `${line}\n`
    }

    // download csv
    let element = document.createElement('a')
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines))
    element.setAttribute('download', `scouter-schedule.csv`)

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    document.body.removeChild(element)
}
