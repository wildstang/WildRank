/**
 * file:        new-inputs.js
 * description: Contains classes to build HTML string for UI elements in app.
 * author:      Liam Fruzyna
 * date:        2022-05-05
 */

class Element
{
    constructor(id, label)
    {
        if (id !== '')
        {
            this.id = id
        }
        else
        {
            this.id = label.toLowerCase().replaceAll(/ /g, '_')
        }
        this.label = label
        this.classes = []
    }

    add_class(style_class)
    {
        this.classes.push(style_class)
    }

    set default(def)
    {
        this.def = def
    }

    get toString()
    {
        return ''
    }

    get html_label()
    {
        return this.label !== '' ? `<h4 class="input_label" id="${this.id}_label">${this.label}</h4>` : ''
    }

    get html_description()
    { 
        return this.description ? `<small class="wr_description" id="${this.id}_desc">${this.description}</small>` : ''
    }
    
    get header()
    {
        return this.html_label + this.html_description
    }
}

class PageFrame extends Element
{
    constructor(id='', label='', columns=[])
    {
        super(id, label)
        this.columns = columns
        this.top_margin = true
    }

    add_column(column)
    {
        this.columns.push(column)
    }

    get html_label()
    {
        return this.label !== '' ? `<h2 class="page_header" id="${this.id}_label">${this.label}</h2>` : ''
    }

    get toString()
    {
        return `<div id="${this.id}" class="page ${this.top_margin ? '' : 'no_top_margin'}">
                ${this.header}
                ${this.columns.map(i => typeof i === 'string' ? i : i.toString).join('')}
            </div>`
    }
}

class ColumnFrame extends Element
{
    constructor(id='', label='', inputs=[])
    {
        super(id, label)
        this.inputs = inputs
    }

    add_input(input)
    {
        this.inputs.push(input)
    }

    get html_label()
    {
        return this.label !== '' ? `<h2 class="column_header" id="${this.id}_label">${this.label}</h2>` : ''
    }

    get toString()
    {
        return `<div id="${this.id}" class="column ${this.classes.join(' ')}">
                ${this.header}
                ${this.inputs.map(i => typeof i === 'string' ? i : i.toString).join('')}
            </div>`
    }
}

class Button extends Element
{
    constructor(id, label, on_click='')
    {
        super(id, label)
        this.on_click = on_click
        this.on_right = ''
        this.on_hold = ''
    }

    // NOTE: a function as a string can be passed or a URL wrapped in quotes
    set link(url)
    {
        this.on_click = `window_open(${url}, '_self')`
        this.on_secondary = `window_open(${url}, '_blank')`
    }

    set on_secondary(on_secondary)
    {
        this.on_right = on_secondary.length > 0 ? on_secondary + '; return false' : ''
        this.on_hold = on_secondary.replace(/'/g, '\\\'')
    }

    get toString()
    {
        let actions = ''
        if (this.on_click)
        {
            actions += `onclick="${this.on_click}"`
        }
        if (this.on_hold || this.on_right)
        {
            actions += `oncontextmenu="return false" onauxclick="${this.on_right}; return false" ontouchstart="touch_button(false)" ontouchend="touch_button('${this.on_hold}')"`
        }
        return `${this.html_description}<div id="${this.id}-container" class="wr_button ${this.classes.join(' ')}" ${actions}>
                <label id="${this.id}">${this.label}</label>
            </div>`
    }
}

class MultiButton extends Element
{
    constructor(id, label, options=[], on_clicks=[])
    {
        super(id, label)
        this.options = options
        this.on_clicks = on_clicks
        this.on_rights = []
        this.on_holds = []
        this.columns = 2
    }

    add_option(option, on_click, on_secondary='')
    {
        this.options.push(option)
        this.on_clicks.push(on_click)
        this.on_rights.push(on_secondary.length > 0 ? on_secondary + '; return false' : '')
        this.on_holds.push(on_secondary.replace(/'/g, '\\\''))
    }

    get html_options()
    {
        let options = ''
        let rows = ['']
        for (let i in this.options)
        {
            let op_name = this.options[i]
            if (this.options.length >= this.columns && !this.vertical && i % this.columns == 0 && i != 0)
            {
                rows.push('')
            }
            rows[rows.length - 1] += `<span class="wr_select_option ${this.vertical ? 'vertical' : ''} ${this.classes.join(' ')}" id="${this.id}-${i}" onclick="${this.on_clicks[i]}" oncontextmenu="return false" onauxclick="${this.on_rights[i]}; return false" ontouchstart="touch_button(false)" ontouchend="touch_button('${this.on_holds[i]}')">
                    <label>${op_name}</label>
                </span>`
        }
        for (let row of rows)
        {
            if (rows.length > 1)
            {
                options += `<div style="display: table-row">${row}</div>`
            }
            else
            {
                options += row
            }
        }
        return options
    }

    get toString()
    {
        return `${this.header}<div class="wr_select ${this.classes.join(' ')}" id="${this.id}">${this.html_options}</div>`
    }
}

class Card extends Element
{
    constructor(id, label)
    {
        super(id, label)
        this.limitWidth = false
        this.space_after = true
    }

    get toString()
    {
        let suffix = '<br>'
        if (!this.space_after)
        {
            suffix = ''
        }
        return `<div class="wr_card ${this.classes.join(' ')}" id="${this.id}"${this.limitWidth ? ' style="width: calc(var(--input-width) - 2*var(--input-padding));"' : ''}>${this.label}</div>${suffix}`
    }
}

class StatusTile extends Element
{
    constructor(id, label, color='red')
    {
        super(id, label)
        this.color = color
    }

    get toString()
    {
        return `<div class="wr_status"><label class="status_text">${this.label}</label><span class="color_box" id="${this.id}" style="background-color: ${this.color}"></span></div>${this.html_description}`
    }

    set status(status)
    {
        StatusTile.set_status(this.id, status)
    }

    /**
     * function:    set_status
     * parameters:  element id, boolean/number(-1,0,1) status
     * returns:     none
     * description: Updates the color box with the provided color.
     */
    static set_status(id, status)
    {
        if (typeof status !== 'boolean')
        {
            switch (status)
            {
                case 1:
                    status = 'green'
                    break
                case 0:
                    status = 'orange'
                    break
                case -1:
                default:
                    status = 'red'
                    break
            }
        }
        else
        {
            status = status ? 'green' : 'red'
        }
        document.getElementById(id).style.backgroundColor = status
    }
}

class Input extends Element
{
    constructor(id, label, def='')
    {
        super(id, label)
        this.def = def
    }
}

class Checkbox extends Input
{
    constructor(id, label, def=false)
    {
        super(id, label, def)
        this.on_click = ''
    }

    get toString()
    {
        if (this.def)
        {
            this.classes.push('selected')
        }
        return `${this.html_description}<div id="${this.id}-container" class="wr_checkbox ${this.classes.join(' ')}" onclick="Checkbox.check('${this.id}'); ${this.on_click}">
                <input type="checkbox" onclick="this.parentNode.click()" id="${this.id}" name="${this.label}" ${this.def ? 'checked' : ''}>
                <label for="${this.id}" onclick="this.parentNode.click()">${this.label}</label>
            </div>`
    }

    check()
    {
        Checkbox.check(this.id)
    }

    /**
     * function:    check
     * parameters:  ID of checkbox button
     * returns:     none
     * description: Toggles a checkbox when clicked on.
     */
    static check(id)
    {
        let checked = !document.getElementById(id).checked
        document.getElementById(id).checked = checked
        if (checked)
        {
            document.getElementById(`${id}-container`).classList.add('selected')
        }
        else
        {
            document.getElementById(`${id}-container`).classList.remove('selected')
        }
    }
}

class Number extends Input
{
    constructor(id, label, def=0)
    {
        super(id, label, def)
    }

    get toString()
    {
        return `${this.html_description}<div class="wr_number ${this.classes.join(' ')}">
                <label>${this.label}</label>
                <label class="wr_number_num" id="${this.id}">${this.def}</label>
            </div>`
    }
}

class Counter extends Input
{
    constructor(id, label, def=0)
    {
        super(id, label, def)
        this.on_incr = ''
        this.on_decr = ''
    }

    set on_increment(on_increment)
    {
        this.on_incr = on_increment.replace(/'/g, '\\\'')
    }

    set on_decrement(on_decrement)
    {
        this.on_decr = on_decrement.replace(/'/g, '\\\'')
    }

    get toString()
    {
        return `${this.html_description}<div class="wr_counter ${this.classes.join(' ')}" onclick="increment('${this.id}', false, '${this.on_incr}')" oncontextmenu="return false" onauxclick="increment('${this.id}', true, '${this.on_decr}'); return false" ontouchstart="touch_button(false)" ontouchend="touch_button('increment(\\'${this.id}\\', true, \\'${this.on_decr.replace(/'/g, '\\\\\'')}\\')')">
                <label class="wr_counter_count" id="${this.id}">${this.def}</label>
                <label>${this.label}</label>
            </div>`
    }
}

class Cycler extends Counter
{
    static on_increment(id)
    {
        let val = parseInt(document.getElementById(`${id}-value`).innerHTML)
        let max = parseInt(document.getElementById(`${id}-max`).innerHTML)
        if (val >= max)
        {
            document.getElementById(`${id}-max`).innerHTML = val
            document.getElementById(`${id}-label`).innerHTML = 'Save Cycle'
        }
        else
        {
            document.getElementById(`${id}-label`).innerHTML = 'Next Cycle'
        }
        document.getElementById(`${id}-back`).style.display = 'table-cell'
        document.getElementById(`${id}-back`).innerHTML = 'Last'
    }

    static on_decrement(id)
    {
        let val = parseInt(document.getElementById(`${id}-value`).innerHTML)
        if (val > 0)
        {
            document.getElementById(`${id}-back`).style.display = 'table-cell'
            document.getElementById(`${id}-back`).innerHTML = 'Last'
        }
        else
        {
            document.getElementById(`${id}-back`).style.display = 'none'
            document.getElementById(`${id}-back`).innerHTML = ''
        }
        document.getElementById(`${id}-label`).innerHTML = 'Next Cycle'
    }

    get toString()
    {
        let on_incr = `${this.on_incr}; Cycler.on_increment(\\'${this.id}\\')`
        let on_decr = `${this.on_decr}; Cycler.on_decrement(\\'${this.id}\\')`
        return `${this.header}<div class="wr_select ${this.classes.join(' ')}" id="${this.id}">
                <span class="wr_select_option" id="${this.id}-back" onclick="increment('${this.id}-value', true, '${on_decr}')" oncontextmenu="return false" onauxclick="increment('${this.id}-value', true, '${on_decr}'); return false" ontouchstart="touch_button(false)" ontouchend="touch_button('increment(\\'${this.id}-value\\', true, \\'${on_decr.replace(/'/g, '\\\\\'')}\\')')\" style="display: none"></span>
                <span class="wr_select_option" id="${this.id}-count">
                    <label class="wr_counter_count" id="${this.id}-value">${this.def}</label> <label id="${this.id}-max" style="display: none">${this.def}</label>
                </span>
                <span class="wr_select_option" id="${this.id}-save" onclick="increment('${this.id}-value', false, '${on_incr}')" oncontextmenu="return false" onauxclick="increment('${this.id}-value', false, '${on_incr}'); return false" ontouchstart="touch_button(false)" ontouchend="touch_button('increment(\\'${this.id}-value\\', false, \\'${on_incr.replace(/'/g, '\\\\\'')}\\')')\">
                    <b id="${this.id}-label">Save Cycle</b>
                </span>
            </div>`
    }
}

class MultiCounter extends Input
{
    constructor(id, label, options=[], def=0)
    {
        super(id, label, def)
        this.options = options
        this.columns = 2
    }

    add_option(option, def=0)
    {
        this.options.push(option)
        if (Array.isArray(this.def) && this.def.length == this.options.length)
        {
            this.def.push(def)
        }
    }

    get html_options()
    {
        let options = ''
        let rows = ['']
        for (let i in this.options)
        {
            let op_name = this.options[i]
            if (this.options.length >= this.columns && !this.vertical && i % this.columns == 0 && i != 0)
            {
                rows.push('')
            }
            let dval = this.def
            if (Array.isArray(this.def) && this.def.length == this.options.length)
            {
                dval = this.def[i]
            }
            else if (Array.isArray(this.def))
            {
                dval = this.def[0]
            }
            let name = `${this.id}_${op_name.toLowerCase().split().join('_')}`
            rows[rows.length - 1] += `<span class="wr_select_option ${this.vertical ? 'vertical' : ''}" id="${name}" onclick="increment('${name}-value', false)" oncontextmenu="return false" onauxclick="increment('${name}-value', true); return false" ontouchstart="touch_button(false)" ontouchend="touch_button('increment(\\'${name}-value\\', true)')\">
                    <label class="wr_counter_count" id="${name}-value">${dval}</label> ${op_name}
                </span>`
        }
        for (let row of rows)
        {
            if (rows.length > 1)
            {
                options += `<div style="display: table-row">${row}</div>`
            }
            else
            {
                options += row
            }
        }
        return options
    }

    get toString()
    {
        return `${this.header}<div class="wr_select ${this.classes.join(' ')}" id="${this.id}">${this.html_options}</div>`
    }
}

class Entry extends Input
{
    constructor(id, label, def='')
    {
        super(id, label, def)
        this.type = 'text'
        this.on_text_change = ''
        this.show_color = false
    }

    set bounds(bounds)
    {
        if (bounds.length > 0)
        {
            this.min = bounds[0]
        }
        if (bounds.length > 1)
        {
            this.max = bounds[1]
        }
        if (bounds.length > 2)
        {
            this.incr = bounds[2]
        }
    }

    get bounds()
    {
        return this.type === 'number' ? `${this.min || this.min === 0 ? `min="${this.min}"` : ''} ${this.max ? `max="${this.max}"` : ''} ${this.incr ? `step="${this.incr}"` : ''}` : ''
    }

    get toString()
    {
        let prefix = ''
        let postfix = ''
        if (this.show_color)
        {
            this.add_class('color_text')
            this.on_text_change = `Entry.update_color('${this.id}')`
            prefix = '<div class="wr_color">'
            postfix = `<span class="color_box" id="${this.id}_color" style="background-color: ${this.def}"></span></div>`
        }
        else
        {
            this.add_class('wr_string')
        }
        return `${this.header}${prefix}<input class="${this.classes.join(' ')}" type="${this.type}" id="${this.id}" value="${this.def}" onKeyUp="${this.on_text_change}" ${this.bounds}>${postfix}`
    }

    update_color()
    {
        Entry.update_color(this.id)
    }

    /**
     * function:    update_color
     * parameters:  element id
     * returns:     none
     * description: Updates the color box base on color text.
     */
    static update_color(id)
    {
        let color = document.getElementById(id).value
        if (color.startsWith('#') && color.length == 7)
        {
            document.getElementById(`${id}_color`).style.backgroundColor = color
        }
    }
}

class Extended extends Input
{
    constructor(id, label, def='')
    {
        super(id, label, def)
        this.on_text_change = ''
    }

    get toString()
    {
        return `${this.header}<textarea class="wr_text" id="${this.id}" onKeyUp="${this.on_text_change}">${this.def}</textarea>`
    }
}

class Slider extends Entry
{
    constructor(id, label, def=0)
    {
        super(id, label, def)
        this.min = 1
        this.max = 10
        this.incr = 1
        this.type = 'number'
        this.on_change = ''
    }

    get html_label()
    {
        return this.label !== '' ? `<h4 class="input_label" id="${this.id}_label">${this.label} - <span id="${this.id}_value">${this.def}</span></h4>` : ''
    }

    get toString()
    {
        return `${this.header}<div id="${this.id}_container" class="wr_slider ${this.classes.join(' ')}"><input id="${this.id}" type="range" class="wr_slider_range" value="${this.def}" oninput="Slider.update_slider_text('${this.id}'); ${this.on_change}" ${this.bounds}></div>`
    }

    set slider(value)
    {
        Slider.set_slider(this.id, value)
    }

    /**
     * function:    set_slider
     * parameters:  slider id, value
     * returns:     none
     * description: Set the text and position of a slider.
     */
    static set_slider(id, value)
    {
        document.getElementById(id).value = value
        update_slider_text(id)
    }

    update_text()
    {
        Slider.update_slider_text(this.id)
    }
    
    /**
     * function:    update_slider_text
     * parameters:  slider id
     * returns:     none
     * description: Update the text for a slider.
     */
    static update_slider_text(id)
    {
        document.getElementById(`${id}_value`).innerHTML = document.getElementById(id).value
    }

    set update_max(max)
    {
        this.max = max
        Slider.set_slider_max(this.id, max)
    }
    
    /**
     * function:    set_slider_max
     * parameters:  slider id, max
     * returns:     none
     * description: Set the maximum value of a slider.
     */
    static set_slider_max(id, max)
    {
        document.getElementById(id).max = max
    }
}

class OptionedInput extends Input
{
    constructor(id, label, options=[], def='')
    {
        super(id, label, def)
        this.options = options
        if (options.length > 0 && !options.includes(def))
        {
            this.def = options[0]
        }
        else
        {
            this.def = def
        }
        this.on_change = ''
    }

    add_option(option)
    {
        if (this.options.length === 0)
        {
            this.def = option
        }
        this.options.push(option)
    }
}

class Select extends OptionedInput
{
    constructor(id, label, options=[], def='')
    {
        super(id, label, options, def)
        this.columns = 2
    }

    get html_options()
    {
        let options = ''
        let rows = ['']
        for (let index in this.options)
        {
            let op_name = this.options[index]
            if (this.options.length >= this.columns && !this.vertical && index % this.columns == 0 && index != 0)
            {
                rows.push('')
            }
            rows[rows.length - 1] += `<span class="wr_select_option ${this.vertical ? 'vertical' : ''} ${op_name.toLowerCase() === this.def.toLowerCase() ? 'selected' : ''}" id="${this.id}-${index}" onclick="Select.select_option('${this.id}', '${index}'); ${this.on_change}">
                    <label>${op_name}</label>
                </span>`
        }
        for (let row of rows)
        {
            if (rows.length > 1)
            {
                options += `<div style="display: table-row">${row}</div>`
            }
            else
            {
                options += row
            }
        }
        return options
    }

    get toString()
    {
        return `${this.header}<div class="wr_select ${this.classes.join(' ')}" id="${this.id}">${this.html_options}</div>`
    }

    get selected_option()
    {
        return Select.get_selected_option(this.id)
    }

    /**
     * function:    get_selected_option
     * parameters:  ID of selected item
     * returns:     index of selected option
     * description: Returns the selected index of the given select.
     */
    static get_selected_option(id)
    {
        let children = document.getElementById(id).getElementsByClassName('wr_select_option')
        let i = 0
        for (let option of children)
        {
            if (option.classList.contains('selected'))
            {
                return i
            }
            ++i
        }
        return -1
    }

    set selected_option(index)
    {
        if (typeof index === 'number' && index < this.options.length)
        {
            Select.select_option(this.id, index)
        }
        else
        {
            console.log('Invalid index')
        }
    }

    /**
     * function:    select_option
     * parameters:  ID of the selector, index of the newly selected option
     * returns:     none
     * description: Select a given option in a selector.
     */
    static select_option(id, index)
    {
        let children = document.getElementById(id).getElementsByClassName('wr_select_option')
        for (let option of children)
        {
            option.classList.remove('selected')
        }
        document.getElementById(`${id}-${index}`).classList.add('selected')
    }
}

class Dropdown extends OptionedInput
{
    constructor(id, label, options=[], def='')
    {
        super(id, label, options, def)
    }

    get html_options()
    {
        let options = ''
        for (let op_name of this.options)
        {
            options += `<option class="wr_dropdown_op" value="${op_name}" ${op_name === this.def ? 'selected' : ''}>${op_name}</option>`
        }
        return options
    }

    get toString()
    {
        return `${this.header}<select class="wr_dropdown ${this.classes.join(' ')}" id="${this.id}" onchange="${this.on_change}">${this.html_options}</select>`
    }
}

class MultiSelect extends Input
{
    constructor(id, label, options=[], def=[])
    {
        super(id, label, def)
        this.options = options
        this.def = def
        this.on_change = ''
        this.columns = 2
    }

    add_option(option)
    {
        if (this.options.length === 0)
        {
            this.def = option
        }
        this.options.push(option)
    }

    get html_options()
    {
        let options = ''
        let rows = ['']
        for (let index in this.options)
        {
            let op_name = this.options[index]
            if (this.options.length >= this.columns && !this.vertical && index % this.columns == 0 && index != 0)
            {
                rows.push('')
            }
            rows[rows.length - 1] += `<span class="wr_select_option ${this.vertical ? 'vertical' : ''} ${this.def.includes(op_name) ? 'selected' : ''}" id="${this.id}-${index}" onclick="MultiSelect.select_option('${this.id}', '${index}'); ${this.on_change}">
                    <label>${op_name}</label>
                </span>`
        }
        for (let row of rows)
        {
            if (rows.length > 1)
            {
                options += `<div style="display: table-row">${row}</div>`
            }
            else
            {
                options += row
            }
        }
        return options
    }

    get toString()
    {
        return `${this.header}<div class="wr_select ${this.classes.join(' ')}" id="${this.id}">${this.html_options}</div>`
    }

    get selected_options()
    {
        return Select.get_selected_option(this.id)
    }

    /**
     * function:    get_selected_options
     * parameters:  ID of selected item
     * returns:     list of indices of selected options
     * description: Returns the selected index of the given select.
     */
    static get_selected_options(id)
    {
        let children = document.getElementById(id).getElementsByClassName('wr_select_option')
        let i = 0
        let selected = []
        for (let option of children)
        {
            if (option.classList.contains('selected'))
            {
                selected.push(i)
            }
            ++i
        }
        return selected
    }

    set selected_option(index)
    {
        if (typeof index === 'number' && index < this.options.length)
        {
            Select.select_option(this.id, index)
        }
        else
        {
            console.log('Invalid index')
        }
    }

    /**
     * function:    select_option
     * parameters:  ID of the selector, index of the newly selected option
     * returns:     none
     * description: Select a given option in a selector.
     */
    static select_option(id, index)
    {
        document.getElementById(`${id}-${index}`).classList.toggle('selected')
    }
}

class Option extends Element
{
    constructor(id, label)
    {
        super(id, label)
        this.primary_list = true
        this.selected = ''
        this.style = ''
    }

    get toString()
    {
        // use modified id and function if secondary list
        let id = `option_${this.id}`
        let on_click = `open_option('${this.id}')`
        let on_secondary = `alt_option('${this.id}')`
        if (!this.primary_list)
        {
            id = `soption_${this.id}`
            on_click = `open_secondary_option('${this.id}')`
            on_secondary = `alt_secondary_option(\\'${this.id}\\')`
        }
        let actions = `oncontextmenu="return false" onauxclick="${on_secondary}; return false" ontouchstart="touch_button(false)" ontouchend="touch_button('${on_secondary}')"`
        return `<div id="${id}" class="pit_option ${this.selected}" onclick="${on_click}" ${actions} on style="${this.style}">
                    <span class="long_option_val">${this.label}</span>
                </div>`
    }
}

class DescriptiveOption extends Option
{
    constructor(id, label, description)
    {
        super(id, label)
        this.description = description
    }

    get toString()
    {
        // use modified id and function if secondary list
        let id = `option_${this.id}`
        let on_click = `open_option('${this.id}')`
        if (!this.primary_list)
        {
            id = `soption_${this.id}`
            on_click = `open_secondary_option('${this.id}')`
        }
        return `<div id="${id}" class="pit_option ${this.selected}" onclick="${on_click}" style="${this.style}">
                    <span class="long_option_number">${this.label}</span><br>
                    <span class="long_option_description">${this.description}</span>
                </div>`
    }
}

class MatchOption extends Option
{
    constructor(id, label, red_teams, blue_teams)
    {
        super(id, label)
        this.red_teams = red_teams
        this.blue_teams = blue_teams
    }

    get toString()
    {
        // use modified id and function if secondary list
        let id = `option_${this.id}`
        let on_click = `open_match('${this.id}')`
        if (!this.primary_list)
        {
            id = `soption_${this.id}`
            on_click = `open_secondary_option('${this.id}')`
        }
        return `<div id="match_${id}" class="match_option ${this.selected} ${this.classes.join(' ')}" onclick="${on_click}">
                    <span class="option_number">${this.label}</span>
                    <span>
                        <div class="alliance red">${this.red_teams.join(' ')}</div>
                        <div class="alliance blue">${this.blue_teams.join(' ')}</div>
                    </span>
                </div>`
    }
}

/**
 * Aux Funcs
 */

var last_touch = -1

/**
 * function:    touch_button
 * parameters:  secondary click function
 * returns:     none
 * description: Respond to touch screen event on button.
 */
function touch_button(secondary)
{
    if (secondary !== false)
    {
        if (Date.now() - last_touch > 500)
        {
            eval(secondary)
        }
    }
    else
    {
        last_touch = Date.now()
    }
}

/**
 * function:    increment
 * parameters:  ID of counter button, whether it was a right click
 * returns:     none
 * description: Increases the value of the counter on click, descreases on right.
 */
function increment(id, right, on_increment='')
{
    if (last_touch > 0 && Date.now() - last_touch > 500 && !right)
    {
        return
    }
    let current = document.getElementById(id).innerHTML
    let modifier = right ? -1 : 1
    if (current > 0 || modifier > 0)
    {
        document.getElementById(id).innerHTML = parseInt(current) + modifier
    }
    if (on_increment)
    {
        eval(on_increment)
    }
}