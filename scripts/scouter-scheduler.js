/**
 * file:        scouter-scheduler.js
 * description: Generate and tweak a schedule of scouters from a list of names.
 *              The original goal of this was to incorperate match schedules but I don't think thats very necessary.
 * author:      Liam Fruzyna
 * date:        2023-01-08
 */

var scouters_entry, per_shift_entry, min_break_entry, shift_len_entry
var shifts_page

/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Runs onload to fill out the page.
 */
function init_page()
{
    // set header
    header_info.innerText = 'Scouter Scheduler'

    // build inputs
    scouters_entry = new WRExtended('Enter Scouters')
    let teams = dal.alliance_size * 2
    if (teams === 0)
    {
        teams = 6
    }
    per_shift_entry = new WREntry('Scouters Per Shift', teams)
    per_shift_entry.type = 'number'
    per_shift_entry.bounds = [1, 25, 1]
    min_break_entry = new WREntry('Min Hours Between Shifts', 1)
    min_break_entry.type = 'number'
    min_break_entry.bounds = [0, 10, 0.5]
    shift_len_entry = new WREntry('Shift Length (Hours)', 1)
    shift_len_entry.type = 'number'
    shift_len_entry.bounds = [0, 10, 0.5]
    let generate = new WRButton('Generate', generate_shifts)
    let export_shifts_button = new WRButton('Export', export_shifts)

    let columns = [new WRColumn('', [scouters_entry, per_shift_entry, min_break_entry, shift_len_entry, generate, export_shifts_button])]

    body.append(new WRPage('', columns))
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
    let scouters = scouters_entry.element.value.split(',').map(s => s.trim())
    let per_shift = parseInt(per_shift_entry.element.value)
    let min_break = parseFloat(min_break_entry.element.value)
    let shift_len = parseFloat(shift_len_entry.element.value)

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
 * Builds the table of scouter shifts. Also manages swapping scouters between shifts.
 * 
 * @param {string} swap Optional team selected to swap
 */
function build_shifts(swap='')
{
    if (swap !== '')
    {
        if (swapping === '')
        {
            swapping = swap
        }
        else
        {
            console.log(`Swapping ${swapping} with ${swap}`)

            for (let shift of shifts)
            {
                let team_idx = shift.indexOf(swap)
                let swap_idx = shift.indexOf(swapping)
                if (team_idx >= 0)
                {
                    shift.splice(team_idx, 1, swapping)
                }
                if (swap_idx >= 0)
                {
                    shift.splice(swap_idx, 1, swap)
                }
            }

            swapping = ''
            swap = ''
        }
    }
    else
    {
        swapping = ''
    }

    // remove existing shifts page
    if (shifts_page)
    {
        shifts_page.remove()
    }

    shifts_page = new WRPage()
    for (let i in shifts)
    {
        let shift = shifts[i]
        let name = `Shift ${parseInt(i)+1}`
        if (shift.length < per_shift_entry.element.value)
        {
            name = 'Spares'
        }
        let shift_col = new WRColumn(name)
        for (let scouter of shift)
        {
            let text = scouter
            let param = scouter
            if (swap === scouter)
            {
                text = 'Cancel'
                param = ''
            }
            else if (swap !== '')
            {
                text = `Swap w/ ${scouter}`
            }
            let button = new WRButton(text, () => build_shifts(param))
            shift_col.add_input(button)
        }
        shifts_page.add_column(shift_col)
    }

    // text area gets cleared, keep it populated
    let scouters = scouters_entry.element.value
    body.append(shifts_page)
    scouters_entry.element.value = scouters
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
    body.appendChild(element)

    element.click()

    body.removeChild(element)
}
