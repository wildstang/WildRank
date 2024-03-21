/**
 * file:        elements.js
 * description: Contains classes to build HTML string for UI elements in app.
 * author:      Liam Fruzyna
 * date:        2023-04-29
 */

class Element
{
    constructor(id, label)
    {
        if (id !== '')
        {
            this.id = id
        }
        else if (typeof label === 'string')
        {
            this.id = label.toLowerCase().replaceAll(/ /g, '_')
        }
        this.label = label
        this.description = '' 
        this.classes = []
    }

    add_class(style_class)
    {
        this.classes.push(style_class)
    }

    get element()
    {
        return document.createElement('div')
    }

    get label_element()
    {
        if (this.label)
        {
            let label = document.createElement('h4')
            label.className = 'input_label'
            label.id = `${this.id}_label`
            label.append(this.label)
            return label
        }
        return ''
    }

    get description_element()
    { 
        if (this.description)
        {
            let description = document.createElement('small')
            description.className = 'wr_description'
            description.id = `${this.id}_desc`
            description.append(this.description)
            return description
        }
        return ''
    }
    
    get header()
    {
        let header = document.createElement('span')
        header.append(this.label_element)
        header.append(this.description_element)
        return header
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

    get label_element()
    {
        if (this.label)
        {
            let label = document.createElement('h2')
            label.className = 'page_header'
            label.id = `${this.id}_label`
            label.append(this.label)
            return label
        }
        return ''
    }

    get element()
    {
        let page = document.createElement('div')
        page.id = this.id
        page.className = 'page'
        if (!this.top_margin)
        {
            page.classList.add('no_top_margin')
        }
        page.classList.add(...this.classes)
        page.append(this.label_element)
        for (let c of this.columns)
        {
            if (c instanceof Element)
            {
                page.append(c.element)
            }
            else
            {
                page.append(c)
            }
        }
        return page
    }
}

class ColumnFrame extends Element
{
    constructor(id='', label='', inputs=[])
    {
        super(id, label)
        this.inputs = inputs
        this.max = 0
    }

    add_input(input)
    {
        this.inputs.push(input)
    }

    get label_element()
    {
        if (this.label)
        {
            let label = document.createElement('h2')
            label.className = 'column_header'
            label.id = `${this.id}_label`
            label.append(this.label)
            return label
        }
        return ''
    }

    get element()
    {
        if (this.max > 0 && this.inputs.length > this.max)
        {
            let cols = document.createElement('span')
            for (let i = 0; i < Math.ceil(this.inputs.length / this.max); i++)
            {
                let col = document.createElement('div')
                col.id = `${this.id}_${i}`
                col.className = 'column'
                col.classList.add(...this.classes)
                col.append(this.label_element)
                for (let j = i * this.max; j < (i + 1) * this.max && j < this.inputs.length; j++)
                {
                    let input = this.inputs[j]
                    col.append(input instanceof Element ? input.element : input)
                }
                cols.append(col)
            }
            return cols
        }
        else
        {
            let col = document.createElement('div')
            col.id = this.id
            col.className = 'column'
            col.classList.add(...this.classes)
            col.append(this.label_element)
            for (let i of this.inputs)
            {
                col.append(i instanceof Element ? i.element : i)
            }
            return col
        }
    }
}

class Input extends Element
{
    constructor(id, label, value='')
    {
        super(id, label)
        this.value = value
    }

    set default(value)
    {
        this.value = value
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

    set external_link(url)
    {
        this.on_click = `window_open('${url}', '_blank')`
        this.on_secondary = `window_open('${url}', '_blank')`
    }

    set on_secondary(on_secondary)
    {
        this.on_right = on_secondary
        this.on_hold = on_secondary
    }

    get element()
    {
        let label = document.createElement('label')
        label.id = this.id
        label.append(this.label)

        let button = document.createElement('div')
        button.id = `${this.id}-container`
        button.className = 'wr_button'
        button.classList.add(...this.classes)
        button.append(label)
        if (this.on_click)
        {
            button.onclick = (event) => eval(this.on_click)
        }
        if (this.on_hold || this.on_right)
        {
            button.oncontextmenu = (event) => false
            button.onauxclick = (event) => {
                eval(this.on_right)
                return false
            }
            button.ontouchstart = (event) => eval(touch_button(false))
            button.ontouchend = (event) => eval(touch_button(`${this.on_hold}`))
        }

        let container = document.createElement('span')
        container.append(this.description_element)
        container.append(button)
        return container
    }
}

class Number extends Input
{
    constructor(id, label, value=0)
    {
        super(id, label, value)
    }

    get element()
    {
        let label = document.createElement('label')
        label.append(this.label)

        let value = document.createElement('label')
        value.className = 'wr_number_num'
        value.id = this.id
        value.append(this.value)

        let number = document.createElement('div')
        number.className = 'wr_number'
        number.classList.add(...this.classes)
        number.append(label)
        number.append(value)

        let container = document.createElement('span')
        container.append(this.description_element)
        container.append(number)
        return container
    }
}

class Card extends Element
{
    constructor(id, label)
    {
        super(id, label)
        this.limitWidth = false
        this.custom_width = 0
        this.space_after = true
    }

    get element()
    {
        let label = document.createElement('span')
        if (Array.isArray(this.label))
        {
            label.append(...this.label)
        }
        else
        {
            label.append(this.label)
        }

        let card = document.createElement('div')
        card.id = this.id
        card.className = 'wr_card'
        card.classList.add(...this.classes)
        card.append(label)

        if (this.limitWidth)
        {
            card.style.width = 'calc(var(--input-width) - 2*var(--input-padding))'
        }
        else if (this.custom_width > 0)
        {
            card.style.width = `calc(${this.custom_width}*var(--input-width) - 2*var(--input-padding))`
        }

        let container = document.createElement('span')
        container.append(card)
        if (this.space_after)
        {
            container.append(br())
        }
        return container
    }
}

class StatusTile extends Element
{
    constructor(id, label, color='red')
    {
        super(id, label)
        this.color = color
        this.on_click = ''
    }

    get element()
    {
        let label = document.createElement('label')
        label.id = `${this.id}-label`
        label.className = 'color_text'
        label.append(this.label)

        let status = document.createElement('label')
        status.id = this.id
        status.className = 'color_box'
        status.style.backgroundColor = this.color
        if (this.on_click)
        {
            status.onclick = event => eval(this.on_click)
        }

        let tile = document.createElement('div')
        tile.className = 'wr_status'
        tile.classList.add(...this.classes)
        tile.append(label)
        tile.append(status)

        let container = document.createElement('span')
        container.append(tile)
        container.append(this.description_element)
        return container
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

class Checkbox extends Input
{
    constructor(id, label, value=false)
    {
        super(id, label, value)
        this.on_click = ''
    }

    get element()
    {
        if (this.value)
        {
            this.classes.push('selected')
        }

        let box = document.createElement('input')
        box.id = this.id
        box.type = 'checkbox'
        box.checked = this.value

        let label = document.createElement('label')
        label.for = this.id
        label.append(this.label)

        let checkbox = document.createElement('div')
        checkbox.id = `${this.id}-container`
        checkbox.className = 'wr_checkbox'
        checkbox.classList.add(...this.classes)
        if (this.value)
        {
            checkbox.classList.add('selected')
        }
        checkbox.onclick = (event) => {
            Checkbox.check(this.id)
            eval(this.on_click)
        }
        checkbox.append(box)
        checkbox.append(' ')
        checkbox.append(label)

        box.onclick = (event) => checkbox.click()

        let container = document.createElement('span')
        container.append(this.description_element)
        container.append(checkbox)
        return container
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

class Timer extends Input
{
    constructor(id, label)
    {
        super(id, label, 0)
        this.on_incr = ''
        this.on_decr = ''
        this.start = -1
        this.value = 0
        this.last_touch = -1
    }

    on_click()
    {
        let duration = Date.now() - this.last_touch
        if (this.last_touch < 0 || duration < 500)
        {
            if (this.start < 0)
            {
                this.start = Date.now()
                let t = this
                this.counter = setInterval(function () { t.update() }, 100);
            }
            else if (this.value === 0)
            {
                this.value = (Date.now() - this.start) / 1000
                clearInterval(this.counter)
            }
            document.getElementById(this.id).innerHTML = parseFloat(this.value).toFixed(1)
        }
        else if (duration > 500)
        {
            this.on_right_click()
        }
    }

    on_right_click()
    {
        if (typeof this.counter !== 'undefined')
        {
            clearInterval(this.counter)
        }
        this.start = -1
        this.value = 0
        document.getElementById(this.id).innerHTML = this.value
        return false
    }

    on_touch()
    {
        this.last_touch = Date.now()
    }

    update()
    {
        let val = ((Date.now() - this.start) / 1000).toFixed(1)
        document.getElementById(this.id).innerHTML = val
    }

    get element()
    {
        let label = document.createElement('label')
        label.append(this.label)

        let value = document.createElement('label')
        value.id = this.id
        value.className = 'wr_counter_count'
        value.append(this.value)

        let timer = document.createElement('div')
        timer.className = 'wr_counter'
        timer.classList.add(...this.classes)
        timer.append(value)
        timer.append(' ')
        timer.append(label)
        timer.onclick = (event) => this.on_click()
        timer.oncontextmenu = (event) => false
        timer.onauxclick = (event) => this.on_right_click()
        timer.ontouchstart = (event) => this.on_touch()
        return timer
    }
}

class Extended extends Input
{
    constructor(id, label, value='')
    {
        super(id, label, value)
        this.on_text_change = ''
    }

    get element()
    {
        let text = document.createElement('textarea')
        text.id = this.id
        text.className = 'wr_text'
        text.classList.add(...this.classes)
        text.onkeyup = (event) => eval(this.on_text_change)
        text.append(this.value)

        let container = document.createElement('span')
        container.append(this.header)
        container.append(text)
        return container
    }
}

class Entry extends Input
{
    constructor(id, label, value='')
    {
        super(id, label, value)
        this.type = 'text'
        this.on_text_change = ''
        this.show_color = false
        this.show_status = false
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
        if (this.value < this.min)
        {
            this.value = this.min
        }
    }

    get element()
    {
        if (this.show_color)
        {
            this.add_class('color_text')
            this.on_text_change = `Entry.update_color('${this.id}')`
            if (!this.value)
            {
                this.value = '#'
            }
        }
        else if (this.show_status)
        {
            this.add_class('color_text')
        }
        else
        {
            this.add_class('wr_string')
        }

        let input = document.createElement('input')
        input.id = this.id
        input.type = this.type
        input.value = this.value
        input.classList.add(...this.classes)
        input.onkeyup = (event) => eval(this.on_text_change)
        if (this.type === 'number')
        {
            if (this.min || this.min === 0)
            {
                input.min = this.min
            }
            if (this.max || this.max === 0)
            {
                input.max = this.max
            }
            if (this.incr || this.incr === 0)
            {
                input.step = this.incr
            }
        }

        let container = document.createElement('span')
        container.append(this.header)
        if (this.show_color || this.show_status)
        {
            let color = document.createElement('span')
            color.id = `${this.id}_color`
            color.className = 'color_box'
            color.style.backgroundColor = this.value

            let color_container = document.createElement('div')
            color_container.className = 'wr_color'
            color_container.appendChild(input)
            color_container.appendChild(color)
            container.append(color_container)
        }
        else
        {
            container.append(input)
        }
        return container
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
        if (color.startsWith('#') && color.length === 7)
        {
            document.getElementById(`${id}_color`).style.backgroundColor = color
        }
        else if (!color.startsWith('#'))
        {
            document.getElementById(id).value = `#${color}`
        }
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

class MultiInput extends Input
{
    constructor(id, label, options=[], value='')
    {
        super(id, label, value)
        this.options = options
        this.columns = MultiInput.calc_num_columns(options)
    }

    get element()
    {
        let select = document.createElement('div')
        select.id = this.id
        select.className = 'wr_select'
        select.classList.add(...this.classes)
        if (this.on_click)
        {
            select.onclick = (event) => eval(this.on_click)
        }
        select.append(...this.option_elements)

        let container = document.createElement('span')
        container.append(this.header)
        container.append(select)
        return container
    }

    /**
     * function:    calc_num_columns
     * parameters:  options
     * returns:     number of columns
     * description: Determines the number of columns based on maximum option size.
     */
    static calc_num_columns(options)
    {
        let max = 0
        for (let op of options)
        {
            if (op.length > max)
            {
                max = op.length
            }
        }

        return Math.max(4 - Math.floor(max / 4), 1)
    }
}

class MultiButton extends MultiInput
{
    constructor(id, label, options=[], on_clicks=[])
    {
        super(id, label, options)
        this.on_clicks = on_clicks
        this.on_rights = []
        this.on_holds = []
    }

    add_option(option, on_click, on_secondary='')
    {
        this.options.push(option)
        this.on_clicks.push(on_click)
        this.on_rights.push(on_secondary.length > 0 ? on_secondary + '; return false' : '')
        this.on_holds.push(on_secondary.replace(/'/g, '\\\''))
        this.columns = MultiInput.calc_num_columns(this.options)
    }

    get option_elements()
    {
        let rows = [[]]
        for (let i in this.options)
        {
            let op_name = this.options[i]
            if (this.options.length >= this.columns && !this.vertical && i % this.columns == 0 && i != 0)
            {
                rows.push([])
            }

            let label = document.createElement('label')
            label.append(op_name)

            let option = document.createElement('span')
            option.id = `${this.id}-${i}`
            option.className = 'wr_select_option'
            option.classList.add(...this.classes)
            if (this.vertical)
            {
                option.classList.add('vertical')
            }
            option.onclick = (event) => eval(this.on_clicks[i])
            option.oncontextmenu = (event) => false
            option.onauxclick = (event) => {
                eval(this.on_rights[i])
                return false
            }
            option.ontouchstart = (event) => touch_button(false)
            option.ontouchend = (event) => touch_button(`'${this.on_holds[i]}'`)
            option.append(label)
            rows[rows.length - 1].push(option)
        }

        let options = []
        if (rows.length > 1)
        {
            for (let row of rows)
            {
                let container = document.createElement('div')
                container.style.display = 'table-row'
                for (let op of row)
                {
                    container.append(op)
                }
                options.push(container)
            }
        }
        else
        {
            options = rows[0]
        }
        return options
    }
}

class MultiNumber extends MultiInput
{
    constructor(id, label, options=[], values=[])
    {
        super(id, label, options, values)
    }

    add_option(option, value=0)
    {
        this.value.push(value)
        this.options.push(option)
        this.columns = MultiInput.calc_num_columns(this.options)
    }

    get option_elements()
    {
        let rows = [[]]
        for (let i in this.options)
        {
            let op_name = this.options[i]
            if (this.options.length >= this.columns && !this.vertical && i % this.columns == 0 && i != 0)
            {
                rows.push([])
            }

            let dval = this.value
            if (Array.isArray(this.value) && this.value.length == this.options.length)
            {
                dval = this.value[i]
            }
            else if (Array.isArray(this.value))
            {
                dval = this.value[0]
            }

            let name = `${this.id}_${op_name.toLowerCase().split().join('_')}`
            let value = document.createElement('label')
            value.id = `${name}-value`
            value.className = 'wr_multi_number_num'
            value.append(dval)

            let label = document.createElement('label')
            label.append(op_name)

            let option = document.createElement('span')
            option.id = `${this.id}-${i}`
            option.className = 'wr_select_option'
            option.classList.add(...this.classes)
            if (this.vertical)
            {
                option.classList.add('vertical')
            }
            option.append(value)
            option.append(' ')
            option.append(label)
            rows[rows.length - 1].push(option)
        }

        let options = []
        if (rows.length > 1)
        {
            for (let row of rows)
            {
                let container = document.createElement('div')
                container.style.display = 'table-row'
                for (let op of row)
                {
                    container.append(op)
                }
                options.push(container)
            }
        }
        else
        {
            options = rows[0]
        }
        return options
    }
}

class Slider extends Entry
{
    constructor(id, label, value=0)
    {
        super(id, label, value)
        this.min = 1
        this.max = 10
        this.incr = 1
        this.type = 'number'
        this.on_change = ''
    }

    get label_element()
    {
        if (this.label)
        {
            let count = document.createElement('span')
            count.id = `${this.id}_value`
            count.append(this.value)

            let header = document.createElement('h4')
            header.className = 'input_label'
            header.id = `${this.id}_label`
            header.append(`${this.label} - `)
            header.append(count)
            return header
        }
        return ''
    }

    get element()
    {
        let label = document.createElement('label')
        label.id = this.id
        label.append(this.label)

        let slider = document.createElement('input')
        slider.id = this.id
        slider.type = 'range'
        slider.className = 'wr_slider_range'
        slider.value = this.value
        slider.oninput = (event) => {
            Slider.update_slider_text(this.id)
            eval(this.on_change)
        }
        if (this.min || this.min === 0)
        {
            slider.min = this.min
        }
        if (this.max || this.max === 0)
        {
            slider.max = this.max
        }
        if (this.incr || this.incr === 0)
        {
            slider.step = this.incr
        }

        let box = document.createElement('div')
        box.id = `${this.id}-container`
        box.className = 'wr_slider'
        box.classList.add(...this.classes)
        box.append(slider)

        let container = document.createElement('span')
        container.append(this.header)
        container.append(box)
        return container
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
        Slider.update_slider_text(id)
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

class Counter extends Input
{
    constructor(id, label, value=0)
    {
        super(id, label, value)
        this.on_increment = ''
        this.on_decrement = ''
    }

    get element()
    {
        let label = document.createElement('label')
        label.append(this.label)

        let value = document.createElement('label')
        value.id = this.id
        value.className = 'wr_counter_count'
        value.append(this.value)

        let number = document.createElement('div')
        number.className = 'wr_counter'
        number.classList.add(...this.classes)
        number.onclick = (event) => increment(this.id, false, this.on_increment)
        number.oncontextmenu = (event) => false
        number.onauxclick = (event) => {
            increment(this.id, true, this.on_decrement)
            return false
        }
        number.ontouchstart = (event) => touch_button(false)
        number.ontouchend = (event) => touch_button(`increment('${this.id}', true, '${this.on_decrement.replace(/'/g, '\\\'')}')`)
        number.append(value)
        number.append(' ')
        number.append(label)

        let container = document.createElement('span')
        container.append(this.description_element)
        container.append(number)
        return container
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
    }

    static on_decrement(id)
    {
        let val = parseInt(document.getElementById(`${id}-value`).innerHTML)
        if (val > 0)
        {
            document.getElementById(`${id}-back`).style.display = 'table-cell'
        }
        else
        {
            document.getElementById(`${id}-back`).style.display = 'none'
        }
        document.getElementById(`${id}-label`).innerHTML = 'Next Cycle'
    }

    get element()
    {
        let on_incr = `if (${this.on_increment}) Cycler.on_increment('${this.id}')`
        let on_decr = `if (${this.on_decrement}) Cycler.on_decrement('${this.id}')`

        let back = document.createElement('span')
        back.id = `${this.id}-back`
        back.className = 'wr_select_option'
        back.innerHTML = 'Last'
        back.style.display = this.value ? 'table-cell' : 'none'
        back.onclick = (event) => increment(`${this.id}-value`, true, on_decr)
        back.oncontextmenu = (event) => false
        back.onauxclick = (event) => {
            increment(`${this.id}-value`, true, on_decr)
            return false
        }
        back.ontouchstart = (event) => touch_button(false)
        back.ontouchend = (event) => touch_button(`increment('${this.id}-value', true, '${on_decr}')`)

        let value = document.createElement('label')
        value.id = `${this.id}-value`
        value.className = 'wr_counter_count'
        value.append(this.value)

        let max = document.createElement('label')
        max.id = `${this.id}-max`
        max.className = 'wr_counter_count'
        max.style.display = 'none'
        max.append(this.value)

        let count = document.createElement('span')
        count.id = `${this.id}-count`
        count.className = 'wr_select_option'
        count.append(value)
        count.append(max)

        let save_text = document.createElement('b')
        save_text.id = `${this.id}-label`
        save_text.append('Save Cycle')

        let save = document.createElement('span')
        save.id = `${this.id}-save`
        save.className = 'wr_select_option'
        save.onclick = (event) => increment(`${this.id}-value`, false, on_incr)
        save.oncontextmenu = (event) => false
        save.onauxclick = (event) => {
            increment(`${this.id}-value`, false, on_incr)
            return false
        }
        save.ontouchstart = (event) => touch_button(false)
        save.ontouchend = (event) => touch_button(`increment('${this.id}-value', false, '${on_incr}')`)
        save.append(save_text)

        let cycler = document.createElement('div')
        cycler.id = this.id
        cycler.className = 'wr_select'
        cycler.classList.add(...this.classes)
        cycler.append(back, count, save)

        let container = document.createElement('span')
        container.append(this.description_element)
        container.append(cycler)
        return container
    }
}

class MultiCounter extends MultiInput
{
    constructor(id, label, options=[], value=0)
    {
        super(id, label, options, value)
    }

    add_option(option, value=0)
    {
        if (Array.isArray(this.value) && this.value.length === this.options.length)
        {
            this.value.push(value)
        }
        this.options.push(option)
        this.columns = MultiInput.calc_num_columns(this.options)
    }

    get option_elements()
    {
        let rows = [[]]
        for (let i in this.options)
        {
            let op_name = this.options[i]
            if (this.options.length >= this.columns && !this.vertical && i % this.columns == 0 && i != 0)
            {
                rows.push([])
            }

            let dval = this.value
            if (Array.isArray(this.value) && this.value.length == this.options.length)
            {
                dval = this.value[i]
            }
            else if (Array.isArray(this.value))
            {
                dval = this.value[0]
            }

            let name = `${this.id}_${op_name.toLowerCase().split().join('_')}`
            let value = document.createElement('label')
            value.id = `${name}-value`
            value.className = 'wr_counter_count'
            value.append(dval)

            let label = document.createElement('label')
            label.append(op_name)

            let option = document.createElement('span')
            option.id = `${this.id}-${i}`
            option.className = 'wr_select_option'
            option.classList.add(...this.classes)
            if (this.vertical)
            {
                option.classList.add('vertical')
            }
            option.onclick = (event) => increment(`${name}-value`, false)
            option.oncontextmenu = (event) => false
            option.onauxclick = (event) => {
                increment(`${name}-value`, true)
                return false
            }
            option.ontouchstart = (event) => touch_button(false)
            option.ontouchend = (event) => touch_button(`increment('${name}-value', true)`)
            option.append(value)
            option.append(' ')
            option.append(label)
            rows[rows.length - 1].push(option)
        }

        let options = []
        if (rows.length > 1)
        {
            for (let row of rows)
            {
                let container = document.createElement('div')
                container.style.display = 'table-row'
                for (let op of row)
                {
                    container.append(op)
                }
                options.push(container)
            }
        }
        else
        {
            options = rows[0]
        }
        return options
    }
}

class OptionedInput extends MultiInput
{
    constructor(id, label, options=[], value='')
    {
        super(id, label, options, value)
        if (options.length > 0 && !options.includes(value))
        {
            this.value = options[0]
        }
        this.on_change = ''
    }

    add_option(option)
    {
        if (this.options.length === 0)
        {
            this.value = option
        }
        this.options.push(option)
        MultiInput.calc_num_columns(this.options)
    }
}

class Select extends OptionedInput
{
    constructor(id, label, options=[], value='', images=[])
    {
        super(id, label, options, value)
        this.images = images
    }

    get option_elements()
    {
        if (typeof this.value === 'undefined')
        {
            this.value = ''
        }

        let rows = [[]]
        for (let i in this.options)
        {
            // add a new row the column limit is reached
            if (this.options.length >= this.columns && !this.vertical && i % this.columns == 0 && i != 0)
            {
                rows.push([])
            }

            let op_name = this.options[i]
            let option = document.createElement('span')
            option.id = `${this.id}-${i}`

            if (op_name.toLowerCase() === this.value.toLowerCase())
            {
                option.classList.add('selected')
            }
            if (this.vertical)
            {
                option.classList.add('vertical')
            }
            option.classList.add(...this.classes)

            // only add labels if the option name isn't empty
            if (op_name)
            {
                option.classList.add('wr_select_option')

                option.onclick = (event) => {
                    Select.select_option(this.id, i)
                    eval(this.on_change)
                }

                let label = document.createElement('label')
                label.append(op_name)

                if (this.images.length)
                {
                    option.classList.add('wr_select_img')

                    label = document.createElement('img')
                    label.src = this.images[i]
                }

                option.append(label)
            }
            else
            {
                option.classList.add('wr_select_filler')
            }

            rows[rows.length - 1].push(option)
        }

        let options = []
        if (rows.length > 1)
        {
            for (let row of rows)
            {
                let container = document.createElement('div')
                container.style.display = 'table-row'
                for (let op of row)
                {
                    container.append(op)
                }
                options.push(container)
            }
        }
        else
        {
            options = rows[0]
        }
        return options
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
    constructor(id, label, options=[], value='')
    {
        super(id, label, options, value)
    }

    get option_elements()
    {
        if (typeof this.value === 'undefined')
        {
            this.value = ''
        }

        let options = []
        for (let op_name of this.options)
        {
            let option = document.createElement('option')
            option.id = this.id
            option.className = 'wr_dropdown_op'
            if (op_name.toLowerCase() === this.value.toLowerCase())
            {
                option.selected = true
            }
            option.value = op_name
            option.innerText = op_name
            options.push(option)
        }
        return options
    }

    get element()
    {
        let select = document.createElement('select')
        select.id = this.id
        select.className = 'wr_dropdown'
        select.classList.add(...this.classes)
        // NOTE: quick fix for sort taking over in pivot
        select.onclick = (event) => event.stopPropagation()
        select.onchange = (event) => eval(this.on_change)
        select.append(...this.option_elements)

        let container = document.createElement('span')
        container.append(this.header)
        container.append(select)
        return container
    }
}

class MultiSelect extends MultiInput
{
    constructor(id, label, options=[], value=[], images=[])
    {
        super(id, label, options, value)
        this.on_change = ''
        this.images = images
    }

    add_option(option)
    {
        if (this.options.length === 0)
        {
            this.value = option
        }
        this.options.push(option)
        this.columns = MultiInput.calc_num_columns(options)
    }

    get option_elements()
    {
        let rows = [[]]
        for (let i in this.options)
        {
            let op_name = this.options[i]
            if (this.options.length >= this.columns && !this.vertical && i % this.columns == 0 && i != 0)
            {
                rows.push([])
            }

            let option = document.createElement('span')
            option.id = `${this.id}-${i}`
            if (this.value.length > i && this.value[i])
            {
                option.classList.add('selected')
            }
            if (this.vertical)
            {
                option.classList.add('vertical')
            }
            option.classList.add(...this.classes)

            // only add labels if the option name isn't empty
            if (op_name)
            {
                option.classList.add('wr_select_option')

                option.onclick = (event) => {
                    MultiSelect.select_option(this.id, i)
                    eval(this.on_change)
                }

                let label = document.createElement('label')
                label.append(op_name)

                if (this.images.length)
                {
                    option.classList.add('wr_select_img')

                    label = document.createElement('img')
                    label.src = this.images[i]
                }

                option.append(label)
            }
            else
            {
                option.classList.add('wr_select_filler')
            }

            rows[rows.length - 1].push(option)
        }

        let options = []
        if (rows.length > 1)
        {
            for (let row of rows)
            {
                let container = document.createElement('div')
                container.style.display = 'table-row'
                for (let op of row)
                {
                    container.append(op)
                }
                options.push(container)
            }
        }
        else
        {
            options = rows[0]
        }
        return options
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
     * function:    reset_selection
     * parameters:  ID of the selector, index of the selected option to reset
     * returns:     none
     * description: Clears the option is selected.
     */
    static reset_selection(id, index)
    {
        document.getElementById(`${id}-${index}`).classList.remove('selected')
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
        this.type = 'pit_option'
    }

    get label_element()
    {
        let label = document.createElement('span')
        label.className = 'long_option_val'
        // TODO: switch to innerHTML/Text elsewhere instead of append
        // innerHTML so character entities like &nbsp; will encode
        label.innerHTML = this.label
        return [label]
    }

    get element()
    {
        let option = document.createElement('div')
        if (this.primary_list)
        {
            option.id = `${this.type}_${this.id}`
            option.onclick = (event) => open_option(this.id)
            option.onauxclick = (event) => {
                touch_button(`alt_option('${this.id}')`)
                return false
            }
            option.ontouchend = (event) => touch_button(`alt_option('${this.id}')`)
        }
        else
        {
            option.id = `soption_${this.id}`
            option.onclick = (event) => open_secondary_option(this.id)
            option.onauxclick = (event) => {
                touch_button(`alt_secondary_option('${this.id}')`)
                return false
            }
            option.ontouchend = (event) => touch_button(`alt_secondary_option('${this.id}')`)
        }
        option.oncontextmenu = (event) => false
        option.ontouchstart = (event) => touch_button(false)
        option.className = this.type
        option.classList.add(...this.classes)
        if (this.selected)
        {
            option.classList.add(this.selected)
        }
        option.append(...this.label_element)
        // TODO: style
        return option
    }
}

class DescriptiveOption extends Option
{
    constructor(id, label, description)
    {
        super(id, label)
        this.description = description
    }

    get label_element()
    {
        let label = document.createElement('span')
        label.className = 'long_option_number'
        label.append(this.label)

        let description = document.createElement('span')
        description.className = 'long_option_description'
        description.append(this.description)

        return [label, br(), description]
    }
}

class MatchOption extends Option
{
    constructor(id, label, red_teams, blue_teams)
    {
        super(id, label)
        this.red_teams = red_teams
        this.blue_teams = blue_teams
        this.type = 'match_option'
    }

    get label_element()
    {
        let label = document.createElement('span')
        label.className = 'option_number'
        label.append(this.label)

        let red = document.createElement('div')
        red.className = 'alliance red'
        red.append(this.red_teams.join(' '))

        let blue = document.createElement('div')
        blue.className = 'alliance blue'
        blue.append(this.blue_teams.join(' '))

        let teams = document.createElement('span')
        teams.append(red, blue)

        return [label, teams]
    }
}

class Stack extends Element
{
    constructor(id, elements, horizontal=false)
    {
        super(id, '')
        this.elements = elements
        this.horizontal = horizontal
    }

    add_element(element)
    {
        this.elements.push(element)
    }

    get element()
    {
        this.elements[0].add_class('stack_top')
        for (let i = 1; i < this.elements.length; i++)
        {
            this.elements[i].add_class('slim')
            if (this.horizontal)
            {
                this.elements[i].add_class('stack_horizontal')
            }
            if (i === this.elements.length - 1)
            {
                this.elements[i].add_class('stack_bottom')
            }
            else
            {
                this.elements[i].add_class('stack_middle')
            }
        }

        let stack = document.createElement('div')
        stack.className = 'stack'
        stack.append(...this.elements.map(e => e.element))

        return stack
    }
}

/**
 * Aux Funcs
 */

/**
 * function:    create_header
 * parameters:  label text
 * returns:     HTML th
 * description: Creates a header element with a given label.
 */
function create_header(label)
{
    let th = document.createElement('th')
    th.innerText = label
    return th
}

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

/**
 * Creates a new br element.
 * 
 * @returns {HTMLBRElement} br
 */
function br()
{
    return document.createElement('br')
}

/**
 * Calls createElement and adds a id and class.
 * 
 * @param {string} tag Tag name
 * @param {string} id ID
 * @param {string} class_name Class name
 * @returns {HTMLElement} element
 */
function create_element(tag, id, class_name='')
{
    let el = document.createElement(tag)
    el.id = id
    if (class_name)
    {
        el.className = class_name
    }
    return el
}