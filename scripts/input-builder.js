/**
 * file:        input-builder.js
 * description: A collection of elements used to represent the input building interface for ranker.
 * author:      Liam Fruzyna
 * date:        2025-01-03
 */

class InputBuilder
{
    constructor(name)
    {
        this.name = name
    }

    build_negative_checkbox()
    {
        return new WRCheckbox('Negative')
    }

    build_disallow_checkbox()
    {
        return new WRCheckbox('Disallow Default')
    }

    build_default_entry(description, number_entry)
    {
        let value = ''
        if (number_entry)
        {
            value = '0'
        }
        let def = new WREntry('Default', value)
        if (number_entry)
        {
            def.type = 'number'
        }
        def.description = description
        return def
    }

    build_options_entry()
    {
        let options = new WREntry('Options')
        options.description = 'A comma-separated list of selectable options, all spaces will be deleted.'
        return options
    }

    parse_list(list)
    {
        let items = list.split(',').map(s => s.trim())
        if (items.length === 1 && items[0] === '')
        {
            return []
        }
        return items
    }

    build_inputs() {}

    build_description()
    {
        return {
            type: this.name
        }
    }
}

class CheckboxB extends InputBuilder
{
    constructor()
    {
        super('checkbox')

        this.is_default = new WRCheckbox('Default')
        this.negative = this.build_negative_checkbox()
        this.disallow = this.build_disallow_checkbox()
    }

    build_inputs()
    {
        return [this.is_default, this.negative, this.disallow]
    }

    build_description()
    {
        let desc = super.build_description()
        desc.default = this.is_default.checked
        desc.negative = this.negative.checked
        return desc
    }
}

class CounterB extends InputBuilder
{
    constructor(name='counter')
    {
        super(name)

        this.def_entry = this.build_default_entry('The default value displayed in the box.', true)
        this.negative = this.build_negative_checkbox()
        this.disallow = this.build_disallow_checkbox()
    }

    build_inputs()
    {
        return [this.def_entry, this.negative, this.disallow]
    }

    build_description()
    {
        let desc = super.build_description()
        let def = this.def_entry.element.value
        if (def === '')
        {
            def = '0'
        }
        desc.default = parseInt(def)
        desc.negative = this.negative.checked
        desc.disallow_default = this.disallow.checked
        return desc
    }
}

class NumberB extends CounterB
{
    constructor(name='number')
    {
        super(name)

        this.min = new WREntry('Min', '0')
        this.min.type = 'number'
        this.min.description = 'The minimum allowed value.'

        this.max = new WREntry('Max', '10')
        this.max.type = 'number'
        this.max.description = 'The maximum allowed value.'
    }

    build_inputs()
    {
        return [this.min, this.max].concat(super.build_inputs())
    }

    build_description()
    {
        let desc = super.build_description()

        let min = this.incr.element.value
        if (min === '')
        {
            min = '1'
        }
        let max = this.incr.element.value
        if (max === '')
        {
            max = '10'
        }

        desc.ops = [parseInt(min), parseInt(max)]
        return desc
    }
}

class SliderB extends NumberB
{
    constructor()
    {
        super('slider')

        this.incr = new WREntry('Increment', '1')
        this.incr.type = 'number'
        this.incr.description = 'The size of a single step.'
    }

    build_inputs()
    {
        return [this.incr].concat(super.build_inputs())
    }

    build_description()
    {
        let desc = super.build_description()

        let val = this.incr.element.value
        if (val === '')
        {
            val = '1'
        }

        desc.ops.push(parseInt(val))
        return desc
    }
}

class StringB extends InputBuilder
{
    constructor(name='string')
    {
        super(name)

        this.def_entry = this.build_default_entry('The default text displayed in the box, must not be empty.')
        this.disallow = this.build_disallow_checkbox()
    }

    build_inputs()
    {
        return [this.def_entry, this.disallow]
    }

    build_description()
    {
        let desc = super.build_description()
        let def = this.def_entry.element.value
        if (def === '')
        {
            def = 'N/A'
        }
        desc.default = parseInt(def)
        desc.disallow_default = this.disallow.checked
        return desc
    }
}

class TextB extends StringB
{
    constructor()
    {
        super('text')

        this.def_entry = new WRExtended('Default', '')
        this.def_entry.description = 'The default text displayed in the box, must not be empty.'
    }
}

class MulticounterB extends InputBuilder
{
    constructor()
    {
        super('multicounter')

        this.options = this.build_options_entry()
        this.neg = new WREntry('Negative')
        this.neg.description = 'A comma-separated list of true/false values for each counter.'
        this.def_entry = this.build_default_entry('The single default value for all counters.', true)
        this.disallow = this.build_disallow_checkbox()
    }

    build_inputs()
    {
        return [this.options, this.neg, this.def_entry, this.disallow]
    }

    build_description()
    {
        let desc = super.build_description()
        let def = this.def_entry.element.value
        if (def === '')
        {
            def = '0'
        }
        desc.negative = this.neg.checked
        desc.default = parseInt(def)
        desc.disallow_default = this.disallow.checked
        desc.options = this.parse_list(this.options.element.value)
        return desc
    }
}

class DropdownB extends InputBuilder
{
    constructor(name='dropdown')
    {
        super(name)

        this.options = this.build_options_entry()
        this.def_entry = this.build_default_entry('The default selected option, must exactly match that option.')
        this.disallow = this.build_disallow_checkbox()
    }

    build_inputs()
    {
        return [this.options, this.def_entry, this.disallow]
    }

    build_description()
    {
        let desc = super.build_description()
        let def = this.def_entry.element.value
        if (def === '')
        {
            def = '0'
        }
        desc.default = parseInt(def)
        desc.disallow_default = this.disallow.checked
        desc.options = this.parse_list(this.options.element.value)
        return desc
    }
}

class SelectB extends DropdownB
{
    constructor(name='select')
    {
        super(name)

        this.colors = new WREntry('Colors')
        this.colors.description = 'A comma-separated list of html colors, one for each option, all spaces will be deleted.'
        this.images = new WREntry('Images')
        this.images.description = 'A comma-separated list of image files available in /assets/, one for each option, all spaces will be deleted.'
    }

    build_inputs()
    {
        return [this.options, this.colors, this.images, this.def_entry, this.disallow]
    }

    build_description()
    {
        let desc = super.build_description()
        desc.colors = this.parse_list(this.colors.element.value)
        desc.images = this.parse_list(this.images.element.value)
        return desc
    }
}