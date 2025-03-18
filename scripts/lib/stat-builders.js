/**
 * file:        stat-builder.js
 * description: A collection of elements used to represent the stat building interface for ranker.
 * author:      Liam Fruzyna
 * date:        2025-01-03
 */

class Stat
{
    constructor(name)
    {
        this.name = name
    }

    initialize() {}
}

class SumStat extends Stat
{
    constructor()
    {
        super('sum')

        this.keys = dal.get_result_keys(false, ['number', 'counter', 'slider'])
        this.checkboxes = []
        for (let k of keys)
        {
            this.checkboxes.push(new WRCheckbox(dal.get_name(k), false, calculate))
        }
    }

    build_interface()
    {
        let left = new WRColumn()
        let right = new WRColumn()
        for (let i in this.checkboxes)
        {
            if (i < this.checkboxes.length / 2)
            {
                left.add_input(this.checkboxes[i])
            }
            else
            {
                right.add_input(this.checkboxes[i])
            }
        }
        return [left, right]
    }

    build_stat()
    {
        let keys = []
        let pos = false
        for (let i in this.keys)
        {
            if (this.checkboxes[i].checked)
            {
                let k = this.keys[i]
                keys.push(k.replace('results.', ''))
                if (typeof dal.meta[k].negative === 'undefined' || !dal.meta[k].negative)
                {
                    pos = true
                }
            }
        }

        return {
            type: this.name.toLowerCase(),
            negative: !pos,
            keys: keys
        }
    }
}

class MathStat extends Stat
{
    constructor()
    {
        super('math')

        this.math_entry = new WRExtended('Math Function')
        this.math_entry.on_text_change = calculate

        let add_operator = this.add_operator.bind(this)
        this.operators = new WRMultiButton('Operators', ['+', '-', '*', '/', '%', 'π', ',', ')', 'b^n', '√x', 'Min', 'Max'],
            [() => add_operator('+'), () => add_operator('-'), () => add_operator('*'), () => add_operator('/'),
             () => add_operator('%'), () => add_operator('Math.PI'), () => add_operator(','), () => add_operator(')'),
             () => add_operator('Math.pow('), () => add_operator('Math.sqrt('), () => add_operator('Math.min('), () => add_operator('Math.max(')])
        this.operators.description = 'Math stats do not exclusively require these operators. Any valid JS operations should work.'
        this.operators.columns = 4

        this.keys = dal.get_result_keys(false, ['number', 'counter', 'slider'])
        this.keys_dropdown = new WRDropdown('Match Keys', [''])
        this.keys_dropdown.on_change = this.add_key.bind(this)
        for (let k of this.keys)
        {
            this.keys_dropdown.add_option(dal.get_name(k))
        }

        this.constants = dal.get_keys(false, true, true, true, ['number'])
        this.constants_dropdown = new WRDropdown('Team Constants', [''])
        this.constants_dropdown.on_change = this.add_constant.bind(this)
        for (let c of this.constants)
        {
            this.constants_dropdown.add_option(dal.get_name(c))
        }

        this.negative_box = new WRCheckbox('Negative')
        this.negative_box.on_click = calculate
    }

    build_interface()
    {
        return [
            new WRColumn('', [this.math_entry]),
            new WRColumn('', [this.operators]),
            new WRColumn('', [this.keys_dropdown, this.constants_dropdown, this.negative_box])
        ]
    }

    add_operator(op)
    {
        this.math_entry.element.value += op
        calculate()
    }    

    add_key()
    {
        let index = this.keys_dropdown.element.selectedIndex
        if (index === 0)
        {
            return
        }
        this.math_entry.element.value += this.keys[index-1].split('.')[1]
        calculate()
        this.keys_dropdown.element.selectedIndex = 0
    }

    add_constant()
    {
        let index = this.constants_dropdown.element.selectedIndex
        if (index === 0)
        {
            return
        }
        this.math_entry.element.value += this.constants[index-1]
        calculate()
        this.constants_dropdown.element.selectedIndex = 0
    }

    build_stat()
    {
        let math_fn = this.math_entry.element.value.replace(/\s/g, '')

        // pull constants first so they aren't picked up as 2 keys
        let no_constants = math_fn
        let constants = no_constants.match(/[a-z]+\.[a-z0-9_]+/g)
        if (constants)
        {
            for (let c of constants)
            {
                no_constants = no_constants.replace(c, '')
            }
        }

        return {
            type: this.name.toLowerCase(),
            // determine if pit stat based on if there are any match keys
            pit: no_constants.match(/[a-z][a-z0-9_]+/g) === null,
            math: math_fn,
            negative: this.negative_box.checkbox.checked
        }
    }
}

class RatioStat extends Stat
{
    constructor()
    {
        super('ratio')

        this.keys = dal.get_result_keys(false, ['number', 'counter', 'slider'])
        let names = this.keys.map(k => dal.get_name(k))

        this.numerator_drop = new WRDropdown('Numerator', names)
        this.numerator_drop.on_change = calculate

        this.denominator_drop = new WRDropdown('Denominator', names)
        this.denominator_drop.on_change = calculate
    }

    build_interface()
    {
        return [
            new WRColumn('', [this.numerator_drop, this.denominator_drop])
        ]
    }

    build_stat()
    {
        let numerator = this.keys[this.numerator_drop.element.selectedIndex]
        let denominator = this.keys[this.denominator_drop.element.selectedIndex]

        return {
            type: this.name.toLowerCase(),
            numerator: numerator.replace('results.', ''),
            denominator: denominator.replace('results.', ''),
            negative: dal.meta[numerator].negative
        }
    }
}

class PercentStat extends RatioStat
{
    constructor()
    {
        super()
        this.name = 'percent'

        this.numerator_drop.label = 'Percent Value'
        this.numerator_drop.description = 'The value being measured in the percentage.'

        this.denominator_drop.label = 'Remaining Value'
        this.denominator_drop.description = 'The remaining value used to complete the percentage.'
    }
}

class MinMaxStat extends Stat
{
    constructor()
    {
        super('min/max')
        
        this.keylist = new WRExtended('Keys')
        this.keylist.on_text_change = calculate

        this.keys = dal.get_result_keys(false, ['number', 'counter', 'slider'])
        this.key_drop = new WRDropdown('Match Keys', [''])
        this.key_drop.on_change = this.add_key.bind(this)
        for (let k of this.keys)
        {
            this.key_drop.add_option(dal.get_name(k))
        }
        //keys = keys.map(k => dal.get_name(k))
        
        this.min_or_max = new WRSelect('Min/Max', ['Min', 'Max'])
        this.min_or_max.on_change = calculate
    }

    build_interface()
    {
        return [
            new WRColumn('', [this.keylist, this.key_drop, this.min_or_max])
        ]
    }

    add_key()
    {
        let index = this.key_drop.element.selectedIndex
        if (index === 0)
        {
            return
        }

        if (this.keylist.element.value !== '')
        {
            this.keylist.element.value += ', '
        }
        this.keylist.element.value += this.keys[index-1].split('.')[1]
        calculate()
        this.key_drop.element.selectedIndex = 0
    }

    build_stat()
    {
        let keys = this.keylist.element.value.replace(/\s/g, '').split(',')
        if (keys.length === 1 && !keys[0])
        {
            keys = []
        }

        return {
            type: this.min_or_max.selected_option.toLowerCase(),
            keys: keys,
            negative: keys.some(k => dal.meta[`results.${k}`].negative) 
        }
    }
}

class WeightedRankStat extends Stat
{
    constructor()
    {
        super('wrank')
        
        this.keys = dal.get_result_keys(false, ['number', 'counter', 'slider'])
        let keys = this.keys.map(k => dal.get_name(k))
        this.stat = new WRDropdown('Stat', keys)
        this.stat.on_change = calculate
    }

    build_interface()
    {
        return [
            new WRColumn('', [this.stat])
        ]
    }

    build_stat()
    {
        let key = this.keys[this.stat.element.selectedIndex]
        return {
            type: this.name,
            stat: key.replace('results.', ''),
            negative: dal.meta[key].negative
        }
    }
}

class MapStat extends Stat
{
    constructor()
    {
        super('map')
        
        this.select_keys = dal.get_result_keys(false, ['select', 'dropdown']).concat(
            dal.get_keys(false, true, false, false, ['select', 'dropdown'], false)
        )
        let select_keys = this.select_keys.map(k => dal.get_name(k))

        this.input = new WRDropdown('Input Stat', select_keys)
        this.input.on_change = this.populate_options.bind(this)

        this.values = document.createElement('div')

        this.neg = new WRCheckbox('Negative')
        this.neg.on_click = calculate

        this.entries = []

        this.initialize = this.populate_options
    }

    build_interface()
    {
        return [
            new WRColumn('', [this.input, this.values, this.neg])
        ]
    }

    populate_options()
    {
        let key = this.select_keys[this.input.element.selectedIndex]
        let options = dal.meta[key].options
        this.entries = []
        for (let option of options)
        {
            let entry = new WREntry(dal.get_name(option))
            entry.type = 'number'
            entry.on_text_change = calculate
            this.entries.push(entry)
        }
        this.values.replaceChildren(...this.entries)
    }

    build_stat()
    {
        let selected_key = this.select_keys[this.input.element.selectedIndex]
        let values = []
        for (let entry of this.entries)
        {
            let val = entry.element.value
            if (val.length > 0)
            {
                values.push(parseInt(val))
            }
            else
            {
                return false
            }
        }

        return {
            type: this.name,
            stat: selected_key.replace('results.', '').replace('pit.', ''), // TODO: key has stats
            values: values,
            pit: selected_key.startsWith('pit.'),
            negative: this.neg.checked
        }
    }
}

class FilterStat extends Stat
{
    constructor()
    {
        super('filter')

        this.keys = dal.get_result_keys(false, ['number', 'counter', 'slider', 'checkbox', 'select', 'dropdown'])
        let keys = this.keys.map(k => dal.get_name(k))

        this.primary_stat = new WRDropdown('Primary Stat', keys)
        this.primary_stat.on_change = calculate

        this.filter_stat = new WRDropdown('Filter By', keys)
        this.filter_stat.on_change = this.update_filter.bind(this)

        this.filter_ops = document.createElement('span')

        this.filter_comparison = null
        this.filter_value = null

        this.initialize = this.update_filter
    }

    build_interface()
    {
        return [
            new WRColumn('', [this.primary_stat, this.filter_stat, this.filter_ops])
        ]
    }

    update_filter()
    {
        let filter = this.keys[this.filter_stat.element.selectedIndex]
        let type = dal.meta[filter].type

        let comps = ['>', '≥', '=', '≠', '≤', '<']
        switch (type)
        {
            case 'number':
            case 'counter':
            case 'slider':
                this.filter_value = new WREntry('')
                this.filter_value.on_text_change = calculate
                this.filter_value.type = 'number'
                break
            case 'checkbox':
                comps = ['=']
                this.filter_value = new WRSelect('', ['True', 'False'])
                this.filter_value.on_change = calculate
                break
            case 'select':
            case 'dropdown':
                this.filter_value = new WRDropdown('', dal.meta[filter].options)
                this.filter_value.on_change = calculate
                break
        }
        
        this.filter_comparison = new WRSelect('When', comps)
        this.filter_comparison.columns = comps.length
        if (comps.length > 5)
        {
            this.filter_comparison.columns = Math.ceil(comps.length / 2)
        }
        this.filter_comparison.on_change = calculate

        this.filter_ops.replaceChildren(this.filter_comparison, this.filter_value)
        calculate()
    }

    build_stat()
    {
        let primary = this.keys[this.primary_stat.element.selectedIndex]
        let filter = this.keys[this.filter_stat.element.selectedIndex]
         
        // parse string value
        let value = 0
        let compare_type = 0
        switch (dal.meta[filter].type)
        {
            case 'number':
            case 'counter':
            case 'slider':
                value = parseFloat(this.filter_value.element.value)
                compare_type = this.filter_comparison.selected_index
                break
            case 'checkbox':
                value = this.filter_value.selected_index === 0
                compare_type = 2
                break
            case 'select':
            case 'dropdown':
                value = dal.meta[filter].options.indexOf(this.filter_value.selected_index)
                compare_type = this.filter_comparison.selected_index
                break
        }

        return {
            type: this.name,
            key: primary.replace('results.', ''),
            filter: filter.replace('results.', ''),
            negative: dal.meta[primary].negative,
            compare_type: compare_type,
            value: value
        }
    }
}

class WhereStat extends Stat
{
    constructor()
    {
        super('where')

        this.cycles = dal.get_result_keys(true, ['cycle'])
        let cycles = this.cycles.map(c => dal.meta[c].name)

        this.cycle_filter = new WRDropdown('Cycle', cycles)
        this.cycle_filter.description = 'The ID of the cycle you would like to count.'

        this.container = document.createElement('div')

        if (cycles.length > 0)
        {
            this.cycle_filter.on_change = this.select_cycle.bind(this)
            this.initialize = this.select_cycle
        }
    }

    build_interface()
    {
        return [new WRColumn('', [this.cycle_filter, this.container])]
    }

    select_cycle()
    {
        let cycle_id = this.cycles[this.cycle_filter.element.selectedIndex].replace('results.', '')
        this.counters = dal.get_result_keys(cycle_id, ['counter'])
        let counters = this.counters.map(c => dal.get_name(c))
        this.selects = dal.get_result_keys(cycle_id, ['dropdown', 'select', 'checkbox'])

        this.count = new WRDropdown('Count', ['Count'].concat(counters))
        this.count.on_change = calculate
        this.count.description = 'The cycle-counter you would like to add up as part of the stat. "Count" means count matching cycles.'

        this.cycle_percent = new WRDropdown('Percent: Remaining Value', [''].concat(counters))
        this.cycle_percent.on_change = calculate
        this.cycle_percent.description = 'The remaining value used to complete a percentage. "" means percentage won\'t be calculated.'

        this.filters = []
        for (let s of this.selects)
        {
            let options = dal.meta[s].options
            if (dal.meta[s].type === 'checkbox')
            {
                options = ['Yes', 'No']
            }
            let filter = new WRDropdown(dal.get_name(s), [''].concat(options))
            filter.on_change = calculate
            filter.description = 'Optional, choose value of the above select to filter cycles by.'
            this.filters.push(filter)
        }

        this.container.replaceChildren(this.count, this.cycle_percent, ...this.filters)
    }

    build_stat()
    {
        if (this.cycle_filter.element.selectedIndex < 0)
        {
            return {}
        }

        let cycle = this.cycles[this.cycle_filter.element.selectedIndex].replace('results.', '')
        let count = this.count.element.selectedIndex
        let wdenominator = this.cycle_percent.element.selectedIndex
        let vals = {}
        for (let i in this.selects)
        {
            let s = this.selects[i]
            let val = this.filters[i].element.value
            if (val)
            {
                if (dal.meta[s].type === 'checkbox')
                {
                    val = val === 'Yes'
                }
                vals[s.replace('results.', '')] = val
            }
        }

        let stat = {
            type: this.name,
            conditions: vals,
            cycle: cycle
        }
        if (count != 0)
        {
            stat.sum = this.counters[count-1].replace('results.', '')
            stat.negative = dal.meta[this.counters[count-1]].negative
        }
        else
        {
            stat.negative = false
        }
        if (wdenominator != 0)
        {
            stat.denominator = this.counters[wdenominator-1].replace('results.', '')
        }
        return stat
    }
}