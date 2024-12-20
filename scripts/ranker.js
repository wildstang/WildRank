/**
 * file:        ranker.js
 * description: Selection page which sorts a list of teams based off a given smart stat criteria.
 *              Can also be used to build picklists and new smart stats.
 * author:      Liam Fruzyna
 * date:        2020-03-13
 *              2021-11-19
 */

const STAT_TYPES = ['Math', 'Percent', 'Ratio', 'Where', 'Min/Max', 'Filter', 'Wgtd Rank', 'Map']

var params_el, picklist_filter, name_entry, stat_type
var math_entry, negative_box, keys_dropdown, constants_dropdown
var numerator_drop, denominator_drop

var keylist, key_drop, min_or_max

/**
 * function:    init_page
 * parameters:  contents card, buttons container
 * returns:     none
 * description: Fetch results from localStorage. Initialize page contents.
 */
function init_page()
{
    header_info.innerText = 'Stat Builder'

    // build picklist filter
    picklist_filter = add_dropdown_filter(['None'].concat(Object.keys(dal.picklists)), update_params, true)

    // build static components
    let page = new WRPage()
    let builder_col = new WRColumn('Build Stat')
    page.add_column(builder_col)

    name_entry = new WREntry('Name', 'New Stat')
    builder_col.add_input(name_entry)

    stat_type = new WRSelect('Type', STAT_TYPES, 'Math')
    stat_type.on_change = update_params
    builder_col.add_input(stat_type)

    params_el = document.createElement('div')
    builder_col.add_input(params_el)

    let button_col = new WRColumn('Save')
    page.add_column(button_col)

    let save_stat_el = new WRButton('Save Stat to Config', save_stat)
    button_col.add_input(save_stat_el)

    let save_list_el = new WRButton('Save Rankings as Picklist', save_list)
    button_col.add_input(save_list_el)

    let edit_stats = new WRLinkButton('Edit Stats', open_page('edit-stats'))
    button_col.add_input(edit_stats)

    preview.replaceChildren(page)

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
    let type = stat_type.selected_option

    // add appropriate inputs for the selected type
    let page = new WRPage()
    let keys = dal.get_result_keys(false, ['number', 'counter', 'slider'])
    let constants = dal.get_keys(false, true, true, true, ['number'])
    switch (type)
    {
        case 'Sum':
            let left = new WRColumn()
            let right = new WRColumn()
            page.add_column(left)
            page.add_column(right)
            for (let i in keys)
            {
                let cb = new WRCheckbox(dal.get_name(keys[i]), false, calculate())
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
            math_entry = new WRExtended('Math Function')
            math_entry.on_text_change = calculate
            let operators = new WRMultiButton('Operators', ['+', '-', '*', '/', '%', 'π', ',', ')', 'b^n', '√x', 'Min', 'Max'],
                [() => add_operator('+'), () => add_operator('-'), () => add_operator('*'), () => add_operator('/'),
                 () => add_operator('%'), () => add_operator('Math.PI'), () => add_operator(','), () => add_operator(')'),
                 () => add_operator('Math.pow('), () => add_operator('Math.sqrt('), () => add_operator('Math.min('), () => add_operator('Math.max(')])
            operators.description = 'Math stats do not exclusively require these operators. Any valid JS operations should work.'
            operators.columns = 4
            keys_dropdown = new WRDropdown('Match Keys', [''])
            keys_dropdown.on_change = add_key_math
            constants_dropdown = new WRDropdown('Team Constants', [''])
            constants_dropdown.on_change = add_constant
            for (let i in keys)
            {
                keys_dropdown.add_option(dal.get_name(keys[i]))
            }
            for (let i in constants)
            {
                constants_dropdown.add_option(dal.get_name(constants[i]))
            }
            negative_box = new WRCheckbox('Negative')
            negative_box.on_click = calculate
            page.add_column(new WRColumn('', [math_entry]))
            page.add_column(new WRColumn('', [operators]))
            page.add_column(new WRColumn('', [keys_dropdown, constants_dropdown, negative_box]))
            break
        case 'Percent':
            keys = keys.map(k => dal.get_name(k))
            numerator_drop = new WRDropdown('Percent Value', keys)
            numerator_drop.on_change = calculate
            numerator_drop.description = 'The value being measured in the percentage.'
            denominator_drop = new WRDropdown('Remaining Value', keys)
            denominator_drop.on_change = calculate
            denominator_drop.description = 'The remaining value used to complete the percentage.'
            page.add_column(new WRColumn('', [numerator_drop, denominator_drop]))
            break
        case 'Ratio':
            keys = keys.map(k => dal.get_name(k))
            numerator_drop = new WRDropdown('Numerator', keys)
            numerator_drop.on_change = calculate
            denominator_drop = new WRDropdown('Denominator', keys)
            denominator_drop.on_change = calculate
            page.add_column(new WRColumn('', [numerator_drop, denominator_drop]))
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

            let cycle_filter = new WRDropdown('Cycle', cycles, cycle)
            cycle_filter.on_change = update_params
            cycle_filter.description = 'The ID of the cycle you would like to count.'
            let count = new WRDropdown('Count', ['Count'].concat(counters))
            count.on_change = calculate
            count.description = 'The cycle-counter you would like to add up as part of the stat. "Count" means count matching cycles.'
            let cycle_percent = new WRDropdown('Percent: Remaining Value', [''].concat(counters))
            cycle_percent.on_change = calculate
            cycle_percent.description = 'The remaining value used to complete a percentage. "" means percentage won\'t be calculated.'
            let column = new WRColumn('', [cycle_filter, count, cycle_percent])
            for (let s of selects)
            {
                let options = dal.meta[s].options
                if (dal.meta[s].type === 'checkbox')
                {
                    options = ['Yes', 'No']
                }
                let filter = new WRDropdown(dal.get_name(s), [''].concat(options))
                filter.on_change = calculate
                filter.description = 'Optional, choose value of the above select to filter cycles by.'
                column.add_input(filter)
            }
            page.add_column(column)
            break
        case 'Min/Max':
            keylist = new WRExtended('Keys')
            keylist.on_text_change = calculate
            key_drop = new WRDropdown('Match Keys', [''])
            key_drop.on_change = add_key_minmax
            for (let i in keys)
            {
                key_drop.add_option(dal.get_name(keys[i]))
            }
            keys = keys.map(k => dal.get_name(k))
            min_or_max = new WRSelect('Min/Max', ['Min', 'Max'])
            min_or_max.on_change = calculate
            page.add_column(new WRColumn('', [keylist, key_drop, min_or_max]))
            break
        case 'Filter':
            keys = dal.get_result_keys(false, ['number', 'counter', 'slider', 'checkbox', 'select', 'dropdown'])
            keys = keys.map(k => dal.get_name(k))
            let primary_stat = new WRDropdown('Primary Stat', keys)
            primary_stat.on_change = calculate
            let filter = new WRDropdown('Filter By', keys)
            filter.on_change = update_filter

            let filter_ops = create_element('span', 'filter_ops')
            page.add_column(new WRColumn('', [primary_stat, filter, filter_ops]))
            break
        case 'Wgtd Rank':
            keys = keys.map(k => dal.get_name(k))
            let stat = new WRDropdown('Stat', keys)
            stat.on_change = calculate
            page.add_column(new WRColumn('', [stat]))
            break
        case 'Map':
            let select_keys = dal.get_keys(true, true, false, false, ['select', 'dropdown'], false)
            select_keys = select_keys.map(k => dal.get_name(k))
            let input = new WRDropdown('Input Stat', select_keys)
            input.on_change = populate_options
            let neg = new WRCheckbox('Negative')
            neg.on_click = calculate
            page.add_column(new WRColumn('', [input, create_element('div', 'values'), neg]))
            break
    }
    params_el.replaceChildren(page)

    if (type === 'Filter')
    {
        update_filter()
    }
    else if (type === 'Map')
    {
        populate_options()
    }

    // always update the calculations on any change
    calculate()
}

/**
 * Populate the column of options when a new Select is created for a Map stat.
 */
function populate_options()
{
    let key = dal.get_keys(true, true, false, false, ['select', 'dropdown'], false)[document.getElementById('stat').selectedIndex]
    let options = dal.meta[key].options
    let entries = []
    for (let option of options)
    {
        let entry = new WREntry(dal.get_name(option))
        entry.type = 'number'
        entry.on_text_change = calculate
        entries.push(entry)
    }
    document.getElementById('values').replaceChildren(...entries)
}

/**
 * function:    add_operator
 * parameters:  operator string
 * returns:     none
 * description: Adds a given operator to the text box then calculates.
 */
function add_operator(op)
{
    math_entry.element.value += op
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
    let index = keys_dropdown.element.selectedIndex
    if (index === 0)
    {
        return
    }
    math_entry.element.value += dal.get_result_keys(false, ['number', 'counter', 'slider'])[index-1].split('.')[1]
    calculate()
    keys_dropdown.element.selectedIndex = 0
}

/**
 * function:    add_constant
 * parameters:  none
 * returns:     none
 * description: Adds the selected key to the text box then calculates.
 */
function add_constant()
{
    let index = constants_dropdown.element.selectedIndex
    if (index === 0)
    {
        return
    }
    math_entry.element.value += dal.get_keys(false, true, true, true, ['number'])[index-1]
    calculate()
    constants_dropdown.element.selectedIndex = 0
}

/**
 * function:    add_key_minmax
 * parameters:  none
 * returns:     none
 * description: Adds the selected key to the text box then calculates.
 */
function add_key_minmax()
{
    let index = key_drop.element.selectedIndex
    if (index === 0)
    {
        return
    }
    if (keylist.element.value !== '')
    {
        keylist.element.value += ', '
    }
    keylist.element.value += dal.get_result_keys(false, ['number', 'counter', 'slider'])[index-1].split('.')[1]
    calculate()
    key_drop.element.selectedIndex = 0
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
    let value = new WREntry('')
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
            value = new WRSelect('', ['True', 'False'])
            value.on_change = calculate
            break
        case 'select':
        case 'dropdown':
            value = new WRDropdown('', dal.meta[filter].options)
            value.on_change = calculate
            break
    }
    let comparitors = new WRSelect('When', comps)
    comparitors.columns = comps.length
    if (comps.length > 5)
    {
        comparitors.columns = Math.ceil(comps.length / 2)
    }
    comparitors.on_change = calculate

    document.getElementById('filter_ops').replaceChildren(comparitors, value)
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
    let name = name_entry.value
    let id = create_id_from_name(name)
    let type = STAT_TYPES[stat_type.selected_index]
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
            let math_fn = math_entry.element.value.replace(/\s/g, '')
            // pull constants first so they aren't picked up as 2 keys
            let constants = math_fn.match(/[a-z]+\.[a-z0-9_]+/g)
            if (constants)
            {
                for (let c of constants)
                {
                    math_fn = math_fn.replace(c, '')
                }
            }
            // determine if pit stat based on if there are any match keys
            stat.pit = math_fn.match(/[a-z][a-z0-9_]+/g) === null
            stat.math = math_fn
            stat.negative = negative_box.checkbox.checked
            break
        case 'Percent':
        case 'Ratio':
            let numerator = numeric[numerator_drop.element.selectedIndex]
            let denominator = numeric[denominator_drop.element.selectedIndex]
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
            stat.keys = keylist.element.value.replace(/\s/g, '').split(',')
            if (stat.keys.length === 1 && !stat.keys[0])
            {
                stat.keys = []
            }
            stat.type = min_or_max.selected_option.toLowerCase()
            stat.negative = stat.keys.some(k => dal.meta[`results.${k}`].negative) 
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
        case 'Map':
            let select_keys = dal.get_keys(true, true, false, false, ['select', 'dropdown'], false)
            let selected_key = select_keys[document.getElementById('stat').selectedIndex]
            let options = dal.meta[selected_key].options
            let values = []
            for (let option of options)
            {
                let val = document.getElementById(option).value
                if (val.length > 0)
                {
                    values.push(parseInt(document.getElementById(option).value))
                }
                else
                {
                    return false
                }
            }
            stat.stat = selected_key.replace('results.', '').replace('pit.', '')
            stat.values = values
            stat.pit = selected_key.startsWith('pit.')
            stat.negative = negative_box.checkbox.checked
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
    let name = name_entry.value
    let id = create_id_from_name(name)
    let stat = build_stat()
    if (!stat)
    {
        return
    }
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
    else if (!stat)
    {
        alert('Missing inputs!')
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
    let name = name_entry.value
    dal.picklists[name] = team_order
    dal.save_picklists()
    alert(`${name} Created`)
}