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
            this.id = label.toLowerCase().split().join('_')
        }
        this.label = label
        this.classes = []
    }

    add_class(style_class)
    {
        this.classes.push(style_class)
    }

    set onsecondary(onsecondary)
    {
        this.onright = onsecondary.length > 0 ? onsecondary + '; return false' : ''
        this.onhold = onsecondary.replace(/'/g, '\\\'')
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
        return this.description ? `<small class="wr_description">${this.description}</small>` : ''
    }
}

class PageFrame extends Element
{
    constructor(id, label, columns=[])
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
                ${this.html_label}
                ${this.columns.map(i => i.toString).join('')}
            </div>`
    }
}

class ColumnFrame extends Element
{
    constructor(id, label, inputs=[])
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
        return `<div id="${this.id}" class="column">
                ${this.html_label}
                ${this.inputs.map(i => i.toString).join('')}
            </div>`
    }
}

class Button extends Element
{
    constructor(id, label, onclick='')
    {
        super(id, label)
        this.onclick = onclick
    }

    set link(url)
    {
        this.onclick = `window_open('${url}', '_self')`
        this.onsecondary = `window_open('${url}', '_blank')`
    }

    set onsecondary(onsecondary)
    {
        this.onright = onsecondary.length > 0 ? onsecondary + '; return false' : ''
        this.onhold = onsecondary.replace(/'/g, '\\\'')
    }

    get toString()
    {
        let actions = ''
        if (this.onclick)
        {
            actions += `onclick="${this.onclick}"`
        }
        if (this.onhold || this.onright)
        {
            actions += `oncontextmenu="return false" onauxclick="${this.onright}; return false" ontouchstart="touch_button(false)" ontouchend="touch_button('${this.onhold}')"`
        }
        return `<div id="${this.id}-container" class="wr_button ${this.classes.join(' ')}" ${actions}>
                <label id="${this.id}">${this.label}</label>
            </div>`
    }
}

class MultiButton extends Element
{
    constructor(id, label)
    {
        super(id, label)
        this.options = []
        this.onclicks = []
        this.onrights = []
        this.onholds = []
    }

    add_option(option, onclick, onsecondary='')
    {
        this.options.push(option)
        this.onclicks.push(onclick)
        this.onrights.push(onsecondary.length > 0 ? onsecondary + '; return false' : '')
        this.onholds.push(onsecondary.replace(/'/g, '\\\''))
    }

    get html_options()
    {
        let options = ''
        let rows = ['']
        for (let i in this.options)
        {
            let op_name = this.options[i]
            if (this.options.length > 3 && !this.vertical && i % 2 == 0 && i != 0)
            {
                rows.push('')
            }
            rows[rows.length - 1] += `<span class="wr_select_option ${this.vertical ? 'vertical' : ''}" id="${this.id}-${i}" onclick="${this.onclicks[i]}" oncontextmenu="return false" onauxclick="${this.onrights[i]}; return false" ontouchstart="touch_button(false)" ontouchend="touch_button('${this.onholds[i]}')">
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
        return `${this.html_label}<div class="wr_select ${this.classes.join(' ')}" id="${this.id}">${this.html_options}</div>`
    }
}

class StatusTile extends Element
{
    constructor(id, label, color)
    {
        super(id, label)
        this.color = color
    }

    get toString()
    {
        return `<div class="wr_status"><label class="status_text">${this.label}</label><span class="color_box" id="${this.id}" style="background-color: ${this.color}"></span></div>`
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
    }

    get toString()
    {
        let onclick = ''
        if (this.onclick)
        {
            onclick += `onclick="${this.onclick}"`
        }
        if (this.def)
        {
            this.classes.push('selected')
        }
        return `<div id="${this.id}-container" class="wr_checkbox ${this.classes.join(' ')}" onclick="check('${this.id}'); ${this.onclick}">
                <input type="checkbox" onclick="check('${this.id}'); ${onclick}" id="${this.id}" name="${this.label}" ${this.def ? 'checked' : ''}>
                <label for="${this.id}" onclick="check('${this.id}')">${this.label}</label>
            </div>`
    }
}

class Counter extends Input
{
    constructor(id, label, def=0)
    {
        super(id, label, def)
        this.onincr = ''
        this.ondecr = ''
    }

    set onincrement(onincrement)
    {
        this.onincr = onincrement.replace(/'/g, '\\\'')
    }

    set ondecrement(ondecrement)
    {
        this.ondecr = ondecrement.replace(/'/g, '\\\'')
    }

    get toString()
    {
        return `<div class="wr_counter ${this.classes.join(' ')}" onclick="increment('${this.id}', false, '${this.onincr}')" oncontextmenu="return false" onauxclick="increment('${this.id}', true, '${this.ondecr}'); return false" ontouchstart="touch_button(false)" ontouchend="touch_button('increment(\\'${this.id}\\', true, \\'${this.ondecr.replace(/'/g, '\\\\\'')}\\')')">
                <label class="wr_counter_count" id="${this.id}">${this.def}</label>
                <label>${this.label}</label>
            </div>`
    }
}

class MultiCounter extends Input
{
    constructor(id, label, options=[], def=0)
    {
        super(id, label, def)
        this.options = options
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
            if (this.options.length > 3 && !this.vertical && i % 2 == 0 && i != 0)
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
        return `${this.html_label}<div class="wr_select ${this.classes.join(' ')}" id="${this.id}">${this.html_options}</div>`
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
        return this.type === 'number' ? `${this.min ? `min="${this.min}"` : ''} ${this.max ? `max="${this.max}"` : ''} ${this.incr ? `step="${this.incr}"` : ''}` : ''
    }

    get toString()
    {
        return `${this.html_label}${this.html_description}<input class="wr_string ${this.classes.join(' ')}" type="${this.type}" id="${this.id}" value="${this.def}" onKeyUp="${this.on_text_change}" ${this.bounds}>`
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
        if (def < this.min)
        {
            this.def = this.min
        }
    }

    get html_label()
    {
        return this.label !== '' ? `<h4 class="input_label" id="${this.id}_label">${this.label} - <span id="${this.id}_value">${this.def}</span></h4>` : ''
    }

    get toString()
    {
        return `${this.html_label}${this.html_description}<div id="${this.id}_container" class="wr_slider ${this.classes.join(' ')}"><input id="${this.id}" type="range" class="wr_slider_range" value="${this.def}" oninput="update_slider_text('${this.id}'); ${this.oninput}" ${this.bounds}></div>`
    }
}

class ColorEntry extends Input
{
    constructor(id, label, def='')
    {
        super(id, label, def)
    }

    get toString()
    {
        return `${this.html_label}${this.html_description}
        <div class="wr_color">
            <input class="color_text ${this.classes.join(' ')}" type="text" id="${this.id}" value="${this.def}" onKeyUp="update_color('${this.id}')">
            <span class="color_box" id="${this.id}_color" style="background-color: ${this.def}"></span>
        </div>`
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
    }

    set onselect(onselect)
    {
        this.onclick = onselect
    }

    get html_options()
    {
        let options = ''
        let rows = ['']
        for (let index in this.options)
        {
            let op_name = this.options[index]
            if (this.options.length > 3 && !this.vertical && index % 2 == 0 && index != 0)
            {
                rows.push('')
            }
            rows[rows.length - 1] += `<span class="wr_select_option ${this.vertical ? 'vertical' : ''} ${op_name == this.def ? 'selected' : ''}" id="${this.id}-${index}" onclick="select_option('${this.id}', '${index}'); ${this.onclick}">
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
        return `${this.html_label}${this.html_description}<div class="wr_select ${this.classes.join(' ')}" id="${this.id}">${this.html_options}</div>`
    }
}

class Dropdown extends OptionedInput
{
    constructor(id, label, options=[], def='')
    {
        super(id, label, options, def)
    }

    set onselect(onselect)
    {
        this.onclick = onselect
    }

    get html_options()
    {
        let options = ''
        for (let op_name of this.options)
        {
            options += `<option class="wr_dropdown_op" value="${op_name}" ${op_name == this.def ? 'selected' : ''}>${op_name}</option>`
        }
        return options
    }

    get toString()
    {
        return `${this.html_label}${this.html_description}<select class="wr_dropdown ${this.classes.join(' ')}" id="${this.id}" onchange="${this.onclick}">${this.html_options}</select>`
    }
}

class Option extends Element
{
    constructor(id, label)
    {
        super(id, label)
        this.primary_list = primary_list
        this.primary_list = true
        this.selected = ''
        this.style = ''
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
                    <span class="long_option_val">${this.label}</span>
                </div>`
    }
}

class DescriptiveOption extends Option
{
    constructor(id, label, description)
    {
        super(id, label, primary_list)
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
        return `<div id="${this.id}" class="pit_option ${this.selected}" onclick="${on_click}" style="${this.style}">
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
        return `<div id="match_${id}" class="match_option ${this.selected}" onclick="${on_click}">
                    <span class="option_number">${this.label}</span>
                    <span>
                        <div class="alliance red">${this.red_teams.join(' ')}</div>
                        <div class="alliance blue">${this.blue_teams.join(' ')}</div>
                    </span>
                </div>`
    }
}