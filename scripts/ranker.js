/**
 * file:        ranker.js
 * description: Selection page which sorts a list of teams based off a given smart stat criteria.
 *              Can also be used to build picklists and new smart stats.
 * author:      Liam Fruzyna
 * date:        2020-03-13
 *              2021-11-19
 */

const STAT_TYPES = ['Math', 'Percent', 'Ratio', 'Where', 'Min/Max', 'Filter', 'Wgtd Rank']

var params_el

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch results from localStorage. Initialize page contents.
 */
function init_page()
{
    // build picklist filter
    add_dropdown_filter('picklist_filter', ['None'].concat(Object.keys(dal.picklists)), 'update_params()', true)

    // build static components
    let page = new PageFrame()
    let builder_col = new ColumnFrame('', 'Build Stat')
    page.add_column(builder_col)

    let name = new Entry('name', 'Name', 'New Stat')
    builder_col.add_input(name)

    let type = new Select('type', 'Type', STAT_TYPES, 'Math')
    type.on_change = 'update_params()'
    builder_col.add_input(type)

    params_el = document.createElement('div')
    builder_col.add_input(params_el)

    let button_col = new ColumnFrame('', 'Save')
    page.add_column(button_col)

    let save_stat = new Button('save_stat', 'Save Stat to Config', 'save_stat()')
    button_col.add_input(save_stat)

    let save_list = new Button('save_list', 'Save Rankings as Picklist', 'save_list()')
    button_col.add_input(save_list)

    let edit_stats = new Button('edit_stats', 'Edit Stats')
    edit_stats.link = `open_page('edit-stats')`
    button_col.add_input(edit_stats)

    buttons_container.replaceChildren(page.element)
    contents_card.style.display = 'none'

    // build dynamic components
    update_params()
}

/**
 * function:    update_params
 * parameters:  none
 * returns:     none
 * description: Updates the inputs at the bottom of the page corresponding to the static inputs' values.
 */
function update_params()
{
    let type = STAT_TYPES[Select.get_selected_option('type')]

    // add appropriate inputs for the selected type
    let page = new PageFrame()
    let keys = dal.get_result_keys(false, ['number', 'counter', 'slider'])
    let constants = dal.get_keys(false, true, true, true, ['number'])
    switch (type)
    {
        case 'Sum':
            let left = new ColumnFrame()
            let right = new ColumnFrame()
            page.add_column(left)
            page.add_column(right)
            for (let i in keys)
            {
                let cb = new Checkbox(keys[i], dal.get_name(keys[i]), false)
                cb.on_click = 'calculate()'
                // split column in 2
                if (i < keys.length / 2)
                {
                    left.add_input(cb)
                }
                else
                {
                    right.add_input(cb)
                }
            }
            break
        case 'Math':
            let math = new Extended('math', 'Math Function')
            math.on_text_change = 'calculate()'
            let operators = new MultiButton('operators', 'Operators', ['+', '-', '*', '/', '%', 'π', ',', ')', 'b^n', '√x', 'Min', 'Max'],
                [`add_operator('+')`, `add_operator('-')`, `add_operator('*')`, `add_operator('/')`,
                `add_operator('%')`, `add_operator('Math.PI')`, `add_operator(',')`, `add_operator(')')`,
                `add_operator('Math.pow(')`, `add_operator('Math.sqrt(')`, `add_operator('Math.min(')`, `add_operator('Math.max(')`])
            operators.description = 'Math stats do not exclusively require these operators. Any valid JS operations should work.'
            operators.columns = 4
            let keys_dropdown = new Dropdown('keys', 'Match Keys', [''])
            keys_dropdown.on_change = 'add_key_math()'
            let constants_dropdown = new Dropdown('constants', 'Team Constants', [''])
            constants_dropdown.on_change = 'add_constant()'
            for (let i in keys)
            {
                keys_dropdown.add_option(dal.get_name(keys[i]))
            }
            for (let i in constants)
            {
                constants_dropdown.add_option(dal.get_name(constants[i]))
            }
            let negative = new Checkbox('negative', 'Negative')
            negative.on_click = 'calculate()'
            page.add_column(new ColumnFrame('', '', [math]))
            page.add_column(new ColumnFrame('', '', [operators]))
            page.add_column(new ColumnFrame('', '', [keys_dropdown, constants_dropdown, negative]))
            break
        case 'Percent':
            keys = keys.map(k => dal.get_name(k))
            let percent = new Dropdown('numerator', 'Percent Value', keys)
            percent.on_change = 'calculate()'
            percent.description = 'The value being measured in the percentage.'
            let remain = new Dropdown('denominator', 'Remaining Value', keys)
            remain.on_change = 'calculate()'
            remain.description = 'The remaining value used to complete the percentage.'
            page.add_column(new ColumnFrame('', '', [percent, remain]))
            break
        case 'Ratio':
            keys = keys.map(k => dal.get_name(k))
            let numerator = new Dropdown('numerator', 'Numerator', keys)
            numerator.on_change = 'calculate()'
            let denominator = new Dropdown('denominator', 'Denominator', keys)
            denominator.on_change = 'calculate()'
            page.add_column(new ColumnFrame('', '', [numerator, denominator]))
            break
        case 'Where':
            let cycles = dal.get_result_keys(true, ['cycle'])//.map(c => dal.meta[c].name)
            let cycle = cycles[0]
            if (document.getElementById('cycle'))
            {
                cycle = document.getElementById('cycle').value
            }
            let cycle_id = cycle.replace('results.', '')
            let counters = dal.get_result_keys(cycle_id, ['counter']).map(c => dal.get_name(c))
            let selects = dal.get_result_keys(cycle_id, ['dropdown', 'select', 'checkbox'])

            let cycle_filter = new Dropdown('cycle', 'Cycle', cycles, cycle)
            cycle_filter.on_change = 'update_params()'
            cycle_filter.description = 'The ID of the cycle you would like to count.'
            let count = new Dropdown('count', 'Count', ['Count'].concat(counters))
            count.on_change = 'calculate()'
            count.description = 'The cycle-counter you would like to add up as part of the stat. "Count" means count matching cycles.'
            let cycle_percent = new Dropdown('denominator', 'Percent: Remaining Value', [''].concat(counters))
            cycle_percent.on_change = 'calculate()'
            cycle_percent.description = 'The remaining value used to complete a percentage. "" means percentage won\'t be calculated.'
            let column = new ColumnFrame('', '', [cycle_filter, count, cycle_percent])
            for (let s of selects)
            {
                let options = dal.meta[s].options
                if (dal.meta[s].type === 'checkbox')
                {
                    options = ['Yes', 'No']
                }
                let filter = new Dropdown(s, dal.get_name(s), [''].concat(options))
                filter.on_change = 'calculate()'
                filter.description = 'Optional, choose value of the above select to filter cycles by.'
                column.add_input(filter)
            }
            page.add_column(column)
            break
        case 'Min/Max':
            let keylist = new Extended('keys', 'Keys')
            keylist.on_text_change = 'calculate()'
            let key = new Dropdown('key_selector', 'Match Keys', [''])
            key.on_change = 'add_key_minmax()'
            for (let i in keys)
            {
                key.add_option(dal.get_name(keys[i]))
            }
            keys = keys.map(k => dal.get_name(k))
            let select = new Select('minmax', 'Min/Max', ['Min', 'Max'])
            select.on_change = 'calculate()'
            page.add_column(new ColumnFrame('', '', [keylist, key, select]))
            break
        case 'Filter':
            keys = dal.get_result_keys(false, ['number', 'counter', 'slider', 'checkbox', 'select', 'dropdown'])
            keys = keys.map(k => dal.get_name(k))
            let primary_stat = new Dropdown('primary_stat', 'Primary Stat', keys)
            primary_stat.on_change = 'calculate()'
            let filter = new Dropdown('filter_by', 'Filter By', keys)
            filter.on_change = 'update_filter()'

            let filter_ops = create_element('span', 'filter_ops')
            page.add_column(new ColumnFrame('', '', [primary_stat, filter, filter_ops]))
            break
        case 'Wgtd Rank':
            keys = keys.map(k => dal.get_name(k))
            let stat = new Dropdown('stat', 'Stat', keys)
            stat.on_change = 'calculate()'
            page.add_column(new ColumnFrame('', '', [stat]))
            break
    }
    params_el.replaceChildren(page.element)

    if (type === 'Filter')
    {
        update_filter()
    }

    // always update the calculations on any change
    calculate()
}

/**
 * function:    add_operator
 * parameters:  operator string
 * returns:     none
 * description: Adds a given operator to the text box then calculates.
 */
function add_operator(op)
{
    let box = document.getElementById('math')
    box.value += op
    calculate()
}

/**
 * function:    add_key_math
 * parameters:  none
 * returns:     none
 * description: Adds the selected key to the text box then calculates.
 */
function add_key_math()
{
    let box = document.getElementById('math')
    let index = document.getElementById('keys').selectedIndex
    if (index === 0)
    {
        return
    }
    box.value += dal.get_result_keys(false, ['number', 'counter', 'slider'])[index-1].split('.')[1]
    calculate()
    document.getElementById('keys').selectedIndex = 0
}

/**
 * function:    add_constant
 * parameters:  none
 * returns:     none
 * description: Adds the selected key to the text box then calculates.
 */
function add_constant()
{
    let box = document.getElementById('math')
    let index = document.getElementById('constants').selectedIndex
    if (index === 0)
    {
        return
    }
    box.value += dal.get_keys(false, true, true, true, ['number'])[index-1]
    calculate()
    document.getElementById('constants').selectedIndex = 0
}

/**
 * function:    add_key_minmax
 * parameters:  none
 * returns:     none
 * description: Adds the selected key to the text box then calculates.
 */
function add_key_minmax()
{
    let box = document.getElementById('keys')
    let index = document.getElementById('key_selector').selectedIndex
    if (index === 0)
    {
        return
    }
    if (box.value !== '')
    {
        box.value += ', '
    }
    box.value += dal.get_result_keys(false, ['number', 'counter', 'slider'])[index-1].split('.')[1]
    calculate()
    document.getElementById('key_selector').selectedIndex = 0
}

/**
 * function:    update_filter
 * parameters:  none
 * returns:     none
 * description: Updates the filter options based on the selected filter.
 */
function update_filter()
{
    let ops = dal.get_result_keys(false, ['number', 'counter', 'slider', 'checkbox', 'select', 'dropdown'])
    let filter = ops[document.getElementById('filter_by').selectedIndex]
    let type = dal.meta[filter].type

    comps = ['>', '≥', '=', '≠', '≤', '<']
    let value = new Entry('value', '')
    value.on_text_change = 'calculate()'
    switch (type)
    {
        case 'number':
        case 'counter':
        case 'slider':
            value.type = 'number'
            break
        case 'checkbox':
            comps = ['=']
            value = new Select('value', '', ['True', 'False'])
            value.on_change = 'calculate()'
            break
        case 'select':
        case 'dropdown':
            value = new Dropdown('value', '', dal.meta[filter].options)
            value.on_change = 'calculate()'
            break
    }
    let comparitors = new Select('comparitors', 'When', comps)
    comparitors.columns = comps.length
    if (comps.length > 5)
    {
        comparitors.columns = Math.ceil(comps.length / 2)
    }
    comparitors.on_change = 'calculate()'

    document.getElementById('filter_ops').replaceChildren(comparitors.element, value.element)
    calculate()
}

/**
 * function:    build_stat
 * parameters:  none
 * returns:     smart stat object
 * description: Builds a smart stat object corresponding to the inputs selected on the page.
 */
function build_stat()
{
    // build core stat object
    let name = document.getElementById('name').value
    let id = create_id_from_name(name)
    let type = STAT_TYPES[Select.get_selected_option('type')]
    let stat = {
        name: name,
        id: id,
        type: type.toLowerCase()
    }

    // fill out the stat object based on the type
    let numeric = dal.get_result_keys(false, ['number', 'counter', 'slider'])
    switch (type)
    {
        case 'Sum':
            let keys = []
            let pos = false
            for (let c of numeric)
            {
                if (document.getElementById(c).checked)
                {
                    keys.push(c.replace('results.', ''))
                    if (typeof dal.meta[c].negative === 'undefined' || !dal.meta[c].negative)
                    {
                        pos = true
                    }
                }
            }
            stat.negative = !pos
            stat.keys = keys
            break
        case 'Math':
            stat.math = document.getElementById('math').value.replace(/\s/g, '')
            stat.negative = document.getElementById('negative').checked
            break
        case 'Percent':
        case 'Ratio':
            let numerator = numeric[document.getElementById('numerator').selectedIndex]
            let denominator = numeric[document.getElementById('denominator').selectedIndex]
            stat.numerator = numerator.replace('results.', '')
            stat.denominator = denominator.replace('results.', '')
            stat.negative = dal.meta[numerator].negative
            break
        case 'Where':
            let cycle = document.getElementById('cycle').value.replace('results.', '')
            let count = document.getElementById('count').selectedIndex
            let wdenominator = document.getElementById('denominator').selectedIndex
            let counters = dal.get_result_keys(cycle, ['counter'])
            let selects = dal.get_result_keys(cycle, ['dropdown', 'select', 'checkbox'])
            let vals = {}
            for (let s of selects)
            {
                let val = document.getElementById(s).value
                if (val)
                {
                    if (dal.meta[s].type === 'checkbox')
                    {
                        val = val === 'Yes'
                    }
                    vals[s.replace('results.', '')] = val
                }
            }
            stat.conditions = vals
            stat.cycle = cycle
            if (count != 0)
            {
                stat.sum = counters[count-1].replace('results.', '')
                stat.negative = dal.meta[counters[count-1]].negative
            }
            else
            {
                stat.negative = false
            }
            if (wdenominator != 0)
            {
                stat.denominator = counters[wdenominator-1].replace('results.', '')
            }
            break
        case 'Min/Max':
            stat.keys = document.getElementById('keys').value.replace(/\s/g, '').split(',')
            stat.type = ['min', 'max'][Select.get_selected_option('minmax')]
            break
        case 'Filter':
            let ops = dal.get_result_keys(false, ['number', 'counter', 'slider', 'checkbox', 'select', 'dropdown'])
            let primary = ops[document.getElementById('primary_stat').selectedIndex]
            let filter = ops[document.getElementById('filter_by').selectedIndex]
            stat.key = primary.replace('results.', '')
            stat.filter = filter.replace('results.', '')
            stat.compare_type = Select.get_selected_option('comparitors')
            stat.value = document.getElementById('value').value
            stat.negative = dal.meta[primary].negative
            
            // parse string value
            switch (dal.meta[filter].type)
            {
                case 'number':
                case 'counter':
                case 'slider':
                    stat.value = parseFloat(stat.value)
                    break
                case 'checkbox':
                    stat.value = Select.get_selected_option('value') === 0
                    stat.compare_type = 2
                    break
                case 'select':
                case 'dropdown':
                    stat.value = dal.meta[filter].options.indexOf(stat.value)
                    break
            }
            break
        case 'Wgtd Rank':
            let key = numeric[document.getElementById('stat').selectedIndex]
            stat.stat = key.replace('results.', '')
            stat.negative = dal.meta[key].negative
            stat.type = 'wrank'
            break
    }
    return stat
}

/**
 * function:    calculate
 * parameters:  none
 * returns:     none
 * description: Calculates each team's stat based on the current inputs.
 */
function calculate()
{
    let name = document.getElementById('name').value
    let id = create_id_from_name(name)
    let stat = build_stat()
    console.log(stat)

    // filter teams
    let picklist = []
    if (Object.keys(dal.picklists).length > 0)
    {
        let selected = document.getElementById('picklist_filter').value
        if (selected !== 'None')
        {
            picklist = dal.picklists[selected]
        }    
    }

    // get team smart stat results
    let team_res = {}
    let result_names = dal.get_results(picklist)
    for (let res of result_names)
    {
        if (typeof team_res[res.meta_team] === 'undefined')
        {
            team_res[res.meta_team] = [] 
        }
        let result = dal.add_smart_stats(res, [stat])[id]
        if (typeof result !== 'undefined')
        {
            team_res[res.meta_team].push(result)
        }
    }

    // average each set of team results
    let team_vals = {}
    for (let team of Object.keys(team_res))
    {
        if (stat.type !== 'min' && stat.type !== 'max')
        {
            team_vals[team] = mean(team_res[team])
        }
        else
        {
            team_vals[team] = median(team_res[team])
        }
    }
    
    // sort teams and populate left
    let teams = Object.keys(team_vals)
    teams.sort((a,b) => team_vals[b] - team_vals[a])
    team_order = [...teams]
    teams = teams.map(function (t, i)
    {
        let val = team_vals[t]
        if (stat.type !== 'min' && stat.type !== 'max')
        {
            val = val.toFixed(2)
            if (isNaN(val))
            {
                val = '0.0'
            }
        }
        if (++i < 10)
        {
            i = `&nbsp;${i}`
        }
        if (t < 10)
        {
            t = `&nbsp;&nbsp;&nbsp;${t}`
        }
        else if (t < 100)
        {
            t = `&nbsp;&nbsp;${t}`
        }
        else if (t < 1000)
        {
            t = `&nbsp;${t}`
        }
        return `${i} ${t} ${val}`
    })

    if (stat.negative)
    {
        teams.reverse()
    }

    populate_other(teams)
}

/**
 * function:    save_stat
 * parameters:  none
 * returns:     none
 * description: Adds the current smart stat to the config for use in other pages.
 */
function save_stat()
{
    let stat = build_stat()
    if (dal.meta.hasOwnProperty(`results.${stat.id}`))
    {
        alert('Stat already exists!')
    }
    else
    {
        cfg.smart_stats.push(stat)
        localStorage.setItem(`config-${cfg.year}-smart_stats`, JSON.stringify(cfg.smart_stats))
        dal.build_teams()
        update_params()
        alert(`${stat.name} Created`)
    }
}

/**
 * function:    save_list
 * parameters:  none
 * returns:     none
 * description: Saves the current order of teams as a picklist.
 */
function save_list()
{
    let name = document.getElementById('name').value
    dal.picklists[name] = team_order
    dal.save_picklists()
    alert(`${name} Created`)
}