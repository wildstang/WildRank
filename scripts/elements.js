/**
 * file:        elements.js
 * description: Contains classes to build HTML string for UI elements in app.
 * author:      Liam Fruzyna
 * date:        2023-04-29
 */

class WRElement extends HTMLElement
{
    constructor()
    {
        super()

        this.description = '' 
        this.class = ''
        this.classes = []

        // randomly generated ID that can be used for accessing input
        // this is designed to be overriden for random access of scouting inputs
        this.input_id = random_hex(4)

        this.description_el = document.createElement('small')
    }

    add_class(style_class)
    {
        this.classes.push(style_class)
    }

    get description_element()
    { 
        if (this.description)
        {
            this.description_el.className = 'wr_description'
            this.description_el.append(this.description)
        }
        return this.description_el
    }
}

class WRPage extends WRElement
{
    constructor(label='', columns=[])
    {
        super()

        this.label = label
        this.columns = columns
        this.top_margin = true

        this.label_el = document.createElement('h2')
    }

    add_column(column)
    {
        this.columns.push(column)
    }

    connectedCallback()
    {
        if (this.label)
        {
            this.label_el.className = 'page_header'
            this.label_el.append(this.label)
            this.append(this.label_el)
        }

        this.className = 'page'
        if (!this.top_margin)
        {
            this.classList.add('no_top_margin')
        }
        this.classList.add(...this.classes)
        for (let c of this.columns)
        {
            this.append(c)
        }
    }
}

customElements.define('wr-page', WRPage)

class WRColumn extends WRElement
{
    constructor(label='', inputs=[])
    {
        super()

        this.label = label
        this.inputs = inputs
        this.max = 0

        this.label_el = document.createElement('h2')
    }

    add_input(input)
    {
        this.inputs.push(input)
    }

    connectedCallback()
    {
        if (this.label)
        {
            this.label_el.className = 'column_header'
            this.label_el.append(this.label)
        }
        else
        {
            this.label_el.style.display = 'none'
        }

        if (this.max > 0 && this.inputs.length > this.max)
        {
            let cols = document.createElement('span')
            for (let i = 0; i < Math.ceil(this.inputs.length / this.max); i++)
            {
                let col = document.createElement('div')
                col.className = 'column'
                col.classList.add(...this.classes)
                col.append(this.label_el)
                for (let j = i * this.max; j < (i + 1) * this.max && j < this.inputs.length; j++)
                {
                    let input = this.inputs[j]
                    col.append(input)
                }
                cols.append(col)
            }
            this.append(cols)
        }
        else
        {
            let col = document.createElement('div')
            col.className = 'column'
            col.classList.add(...this.classes)
            col.append(this.label_el)
            for (let i of this.inputs)
            {
                col.append(i)
            }
            this.append(col)
        }
    }
}

customElements.define('wr-column', WRColumn)

class WRButton extends WRElement
{
    constructor(label, on_click)
    {
        super()

        this.label = label
        this.on_click = on_click
        this.on_right = false
        this.primary_class = 'wr_button'

        this.label_el = document.createElement('label')
        this.element = document.createElement('div')
    }

    connectedCallback()
    {
        this.label_el.append(this.label)

        this.element.className = this.primary_class
        this.element.onclick = this.on_click
        if (this.on_right)
        {
            this.element.oncontextmenu = () => false
            this.element.onauxclick = this.on_right
            this.element.ontouchstart = event => touch_start(event)
            this.element.ontouchend = event => touch_end(event, this.on_right)
        }
        this.element.classList.add(...this.classes)
        this.element.appendChild(this.label_el)

        this.append(this.description_element)
        this.append(this.element)
    }
}

customElements.define('wr-button', WRButton)

class WRLinkButton extends WRButton
{
    constructor(label, link, new_tab=false)
    {
        let on_click = () => {
            // It appeared that the new tab opening was triggering a new onclick call on iPad.
            // So last_touch_time is made negative instead of -1 then we make sure there is a significant delay.
            let since_last_touch = Date.now() + last_touch_time
            if (since_last_touch < 400 || since_last_touch > 1000)
            {
                window_open(link, new_tab ? '_blank' : '_self')
            }
        }
        super(label, on_click)

        // TODO: After holding for about 750 ms this code runs but doesn't do anything on iPad.
        this.on_right = () => window_open(link, '_blank')
    }
}

customElements.define('wr-link-button', WRLinkButton)

class WRNumber extends WRElement
{
    constructor(label, value=0)
    {
        super()

        this.label = label
        this.value = value
        this.primary_class = 'wr_number'

        this.label_el = document.createElement('label')
        this.value_el = document.createElement('label')
        this.element = document.createElement('div')
    }

    connectedCallback()
    {
        this.label_el.append(this.label)

        this.value_el.className = 'wr_number_num'
        this.value_el.append(this.value)

        this.element.className = this.primary_class
        this.element.classList.add(...this.classes)
        this.element.append(this.label_el)
        this.element.append(this.value_el)

        this.append(this.description_element)
        this.append(this.element)
    }

    set_value(value)
    {
        this.value = value
        this.value_el.innerHTML = value
    }
}

customElements.define('wr-number', WRNumber)

class WRCard extends WRElement
{
    constructor(text)
    {
        super()

        this.text = text
        this.limitWidth = false
        this.custom_width = 0
        this.space_after = true

        this.text_el = document.createElement('span')
        this.element = document.createElement('div')
    }

    connectedCallback()
    {
        if (Array.isArray(this.text))
        {
            this.text_el.append(...this.text)
        }
        else
        {
            this.text_el.append(this.text)
        }

        this.element.className = 'wr_card'
        this.element.classList.add(...this.classes)
        this.element.append(this.text_el)

        if (this.limitWidth)
        {
            this.element.style.width = 'calc(var(--input-width) - 2*var(--input-padding))'
        }
        else if (this.custom_width > 0)
        {
            this.element.style.width = `calc(${this.custom_width}*var(--input-width) - 2*var(--input-padding))`
        }

        this.append(this.element)
        if (this.space_after)
        {
            this.append(br())
        }
    }
}

customElements.define('wr-card', WRCard)

class WRStatusTile extends WRElement
{
    constructor(label, color='red')
    {
        super()

        this.label = label
        this.color = color
        this.on_click = false

        this.label_el = document.createElement('label')
        this.tile = document.createElement('label')
        this.element = document.createElement('div')
    }

    connectedCallback()
    {
        this.label_el.className = 'color_text'
        this.label_el.append(this.label)

        this.tile.className = 'color_box'
        this.tile.style.backgroundColor = this.color
        if (this.on_click)
        {
            this.tile.onclick = this.on_click
        }

        this.element.className = 'wr_status'
        this.element.classList.add(...this.classes)
        this.element.append(this.label_el)
        this.element.append(this.tile)

        this.append(this.element)
        this.append(this.description_element)
    }

    set_status(status)
    {
        switch (status)
        {
            case -1:
                this.color = 'red'
                break
            case 0:
                this.color = 'orange'
                break
            case 1:
            default:
                this.color = 'green'
                break
        }

        this.tile.style.backgroundColor = this.color
    }
}

customElements.define('wr-status-tile', WRStatusTile)

class WRCheckbox extends WRElement
{
    constructor(label, value=false)
    {
        super()

        this.label = label
        this.value = value
        this.on_click = false

        this.checkbox = document.createElement('input')
        this.label_el = document.createElement('label')
        this.element = document.createElement('div')
    }

    connectedCallback()
    {
        if (this.value)
        {
            this.classes.push('selected')
        }

        this.checkbox.id = this.input_id
        this.checkbox.type = 'checkbox'
        this.checkbox.checked = this.value

        this.label_el.for = this.input_id
        this.label_el.append(this.label)

        this.element.className = 'wr_checkbox'
        this.element.classList.add(...this.classes)
        if (this.value)
        {
            this.element.classList.add('selected')
        }
        this.element.onclick = event => {
            this.check(event.target.id)
            if (this.on_click)
            {
                this.on_click()
            }
        }
        this.element.append(this.checkbox)
        this.element.append(' ')
        this.element.append(this.label_el)

        this.append(this.description_element)
        this.append(this.element)
    }

    set_checked(checked)
    {
        this.checkbox.checked = checked
        if (checked)
        {
            this.element.classList.add('selected')
        }
        else if (this.element.classList.contains('selected'))
        {
            this.element.classList.remove('selected')
        }
    }

    check(target_id='')
    {
        let checked = this.checkbox.checked
        if (target_id !== this.input_id)
        {
            checked = !checked
            this.checkbox.checked = checked
        }

        if (checked)
        {
            this.element.classList.add('selected')
        }
        else if (this.element.classList.contains('selected'))
        {
            this.element.classList.remove('selected')
        }
    }

    get checked()
    {
        return this.checkbox.checked
    }
}

customElements.define('wr-checkbox', WRCheckbox)

class WRTimer extends WRElement
{
    constructor(label)
    {
        super()

        this.label = label
        this.start = -1
        this.value = 0
        this.last_touch = -1

        this.label_el = document.createElement('label')
        this.value_el = document.createElement('label')
        this.element = document.createElement('div')
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
            this.value_el.innerHTML = parseFloat(this.value).toFixed(1)
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
        this.value_el.innerHTML = this.value
        return false
    }

    on_touch()
    {
        this.last_touch = Date.now()
    }

    update()
    {
        let val = ((Date.now() - this.start) / 1000).toFixed(1)
        this.value_el.innerHTML = val
    }

    connectedCallback()
    {
        this.label_el.append(this.label)

        this.value_el.id = this.input_id
        this.value_el.className = 'wr_counter_count'
        this.value_el.append(this.value)

        this.element.className = 'wr_counter'
        this.element.classList.add(...this.classes)
        this.element.append(this.value_el)
        this.element.append(' ')
        this.element.append(this.label_el)
        this.element.onclick = this.on_click.bind(this)
        this.element.oncontextmenu = () => false
        this.element.onauxclick = this.on_right_click.bind(this)
        this.element.ontouchstart = this.on_touch.bind(this)

        this.append(this.element)
    }
}

customElements.define('wr-timer', WRTimer)

class WRExtended extends WRElement
{
    constructor(label, text='')
    {
        super()

        this.label = label
        this.text = text
        this.on_text_change = false

        this.label_el = document.createElement('h4')
        this.element = document.createElement('textarea')
    }

    connectedCallback()
    {
        this.label_el.className = 'input_label'
        this.label_el.append(this.label)

        this.element.id = this.input_id
        this.element.className = 'wr_text'
        this.element.classList.add(...this.classes)
        if (this.on_text_change)
        {
            this.element.onkeyup = this.on_text_change
        }
        this.element.append(this.text)

        this.append(this.label_el)
        this.append(this.description_element)
        this.append(this.element)
    }
}

customElements.define('wr-extended', WRExtended)

class WREntry extends WRElement
{
    constructor(label, value='')
    {
        super()

        this.label = label
        this.value = value
        this.type = 'text'
        this.on_text_change = false
        this.show_color = false
        this.show_status = false

        this.element = document.createElement('input')
        this.label_el = document.createElement('h4')
        this.color_el = document.createElement('span')
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

    connectedCallback()
    {
        this.label_el.className = 'input_label'
        this.label_el.append(this.label)

        if (this.show_color)
        {
            this.add_class('color_text')
            this.on_text_change = this.update_color.bind(this)
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

        this.element.id = this.input_id
        this.element.type = this.type
        this.element.value = this.value
        this.element.classList.add(...this.classes)
        if (this.on_text_change)
        {
            this.element.onkeyup = this.on_text_change
        }
        if (this.type === 'number')
        {
            if (this.min || this.min === 0)
            {
                this.element.min = this.min
            }
            if (this.max || this.max === 0)
            {
                this.element.max = this.max
            }
            if (this.incr || this.incr === 0)
            {
                this.element.step = this.incr
            }
        }

        this.append(this.label_el)
        this.append(this.description_element)
        if (this.show_color || this.show_status)
        {
            this.color_el.className = 'color_box'
            this.color_el.style.backgroundColor = this.value

            let color_container = document.createElement('div')
            color_container.className = 'wr_color'
            color_container.appendChild(this.element)
            color_container.appendChild(this.color_el)
            this.append(color_container)
        }
        else
        {
            this.append(this.element)
        }
    }

    update_color()
    {
        let color = this.element.value
        if (color.startsWith('#') && color.length === 7)
        {
            this.color_el.style.backgroundColor = color
        }
        else if (!color.startsWith('#'))
        {
            this.element.value = `#${color}`
        }
    }

    set_status(status)
    {
        switch (status)
        {
            case -1:
                this.color = 'red'
                break
            case 0:
                this.color = 'orange'
                break
            case 1:
            default:
                this.color = 'green'
                break
        }

        this.color_el.style.backgroundColor = this.color
    }
}

customElements.define('wr-entry', WREntry)

class WRSlider extends WRElement
{
    constructor(label, value=0)
    {
        super()

        this.label = label
        this.value = value
        this.min = 1
        this.max = 10
        this.incr = 1
        this.on_change = false

        this.label_el = document.createElement('h4')
        this.value_el = document.createElement('span')
        this.slider = document.createElement('input')
        this.element = document.createElement('div')
    }

    connectedCallback()
    {
        if (this.label)
        {
            this.value_el.append(this.value)

            this.label_el.className = 'input_label'
            this.label_el.append(`${this.label} - `)
            this.label_el.append(this.value_el)
        }

        this.slider.id = this.input_id
        this.slider.type = 'range'
        this.slider.className = 'wr_slider_range'
        this.slider.value = this.value
        this.slider.oninput = () => {
            this.update_text()
            if (this.on_change)
            {
                this.on_change()
            }
        }
        if (this.min || this.min === 0)
        {
            this.slider.min = this.min
        }
        if (this.max || this.max === 0)
        {
            this.slider.max = this.max
        }
        if (this.incr || this.incr === 0)
        {
            this.slider.step = this.incr
        }

        this.element.className = 'wr_slider'
        this.element.classList.add(...this.classes)
        this.element.append(this.slider)

        this.append(this.label_el)
        this.append(this.element)
    }

    set position(value)
    {
        this.slider.value = value
        this.update_text()
    }

    update_text()
    {
        this.value_el.innerHTML = this.slider.value
    }

    set maximum(max)
    {
        this.max = max
        this.slider.max = max
    }

    set bounds(bounds)
    {
        if (bounds.length > 1)
        {
            this.min = bounds[0]
            this.max = bounds[1]
            if (bounds.length > 2)
            {
                this.incr = bounds[2]
            }
        }
    }
}

customElements.define('wr-slider', WRSlider)

class WRCounter extends WRElement
{
    constructor(label, value=0)
    {
        super()

        this.label = label
        this.value = value
        this.on_increment = false
        this.on_decrement = false
        this.primary_class = 'wr_counter'

        this.label_el = document.createElement('label')
        this.value_el = document.createElement('label')
        this.element = document.createElement('div')
    }

    connectedCallback()
    {
        this.label_el.append(this.label)

        this.value_el.id = this.input_id
        this.value_el.className = 'wr_counter_count'
        this.value_el.append(this.value)

        this.element.className = this.primary_class
        this.element.classList.add(...this.classes)
        this.element.onclick = () => this.increment(false, this.on_increment)
        this.element.oncontextmenu = () => false
        this.element.onauxclick = () => this.increment(true, this.on_decrement)
        this.element.ontouchstart = event => touch_start(event)
        this.element.ontouchend = event => touch_end(event, () => this.increment(true, this.on_decrement))
        this.element.append(this.value_el)
        this.element.append(' ')
        this.element.append(this.label_el)

        this.append(this.description_element)
        this.append(this.element)
    }

    increment(right, on_increment=false)
    {
        if (last_touch > 0 && Date.now() - last_touch > 500 && !right)
        {
            return
        }
        let current = this.value_el.innerHTML
        let modifier = right ? -1 : 1
        if (current > 0 || modifier > 0)
        {
            this.value = parseInt(current) + modifier
            this.value_el.innerHTML = this.value
        }
        if (on_increment)
        {
            on_increment()
        }
    }
}

customElements.define('wr-counter', WRCounter)

class WRCycler extends WRCounter
{
    constructor(label, value=0)
    {
        super(label, value)

        this.on_advance = false

        this.back_el = document.createElement('span')
        this.value_el = document.createElement('label')
        this.max_el = document.createElement('label')
        this.save_el = document.createElement('span')
        this.element = document.createElement('div')
    }

    connectedCallback()
    {
        this.back_el.className = 'wr_select_option'
        this.back_el.style.display = 'table-cell'
        this.back_el.innerHTML = 'Last'
        this.back_el.style.display = this.value ? 'table-cell' : 'none'
        this.back_el.onclick = () => this.increment(true, this.backward.bind(this))

        this.value_el.id = this.input_id
        this.value_el.className = 'wr_counter_count'
        this.value_el.append(this.value)

        this.max_el.className = 'wr_counter_count'
        this.max_el.style.display = 'none'
        this.max_el.append(this.value)

        let count = document.createElement('span')
        count.className = 'wr_select_option'
        count.style.display = 'table-cell'
        count.append(this.value_el)
        count.append(this.max_el)

        this.save_el.className = 'wr_select_option'
        this.save_el.style.display = 'table-cell'
        this.save_el.onclick = () => this.increment(false, this.forward.bind(this))
        this.save_el.append('Save Cycle')
        this.save_el.style.fontWeight = 'bold'

        this.element.className = 'wr_select'
        this.element.classList.add(...this.classes)
        this.element.append(this.back_el, count, this.save_el)

        this.append(this.description_element)
        this.append(this.element)
    }

    forward()
    {
        let pass = true
        if (this.on_advance)
        {
            pass = this.on_advance(this.input_id, false)
        }

        if (pass)
        {
            let max = parseInt(this.max_el.innerHTML)
            if (this.value >= max)
            {
                this.max_el.innerHTML = this.value
                this.save_el.innerHTML = 'Save Cycle'
            }
            else
            {
                this.save_el.innerHTML = 'Next Cycle'
            }
            this.back_el.style.display = 'table-cell'
        }
        else
        {
            this.increment(true)
        }
    }

    backward()
    {
        let pass = true
        if (this.on_advance)
        {
            pass = this.on_advance(this.input_id, true)
        }

        if (pass)
        {
            if (this.value > 0)
            {
                this.back_el.style.display = 'table-cell'
            }
            else
            {
                this.back_el.style.display = 'none'
            }
            this.save_el.innerHTML = 'Next Cycle'
        }
        else
        {
            this.increment(false)
        }
    }
}

customElements.define('wr-cycler', WRCycler)

class WRMultiInput extends WRElement
{
    constructor(label, options=[], value='')
    {
        super()

        this.label = label
        this.value = value
        this.on_click = false
        this.options = options
        this.vertical = false
        this.columns = WRMultiInput.calc_num_columns(options)

        this.label_el = document.createElement('h4')
        this.element = document.createElement('div')
    }

    connectedCallback()
    {
        this.label_el.className = 'input_label'
        this.label_el.append(this.label)

        this.element.id = this.input_id
        this.element.className = 'wr_select'
        this.element.classList.add(...this.classes)
        if (this.on_click)
        {
            this.element.onclick = this.on_click
        }
        this.element.append(...this.option_elements)

        this.append(this.label_el)
        this.append(this.description_element)
        this.append(this.element)
    }

    get option_elements()
    {
        return []
    }

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

class WRMultiButton extends WRMultiInput
{
    constructor(label, options=[], on_clicks=[])
    {
        super(label, options)
        this.on_clicks = on_clicks
        this.on_rights = []
    }

    add_option(option, on_click, on_secondary=false)
    {
        this.options.push(option)
        this.on_clicks.push(on_click)
        this.on_rights.push(on_secondary)
        this.columns = WRMultiInput.calc_num_columns(this.options)
    }

    get option_elements()
    {
        let rows = [[]]
        for (let i in this.options)
        {
            if (this.options.length >= this.columns && !this.vertical && i % this.columns == 0 && i != 0)
            {
                rows.push([])
            }

            let option = new WRButton(this.options[i], this.on_clicks[i])
            option.primary_class = 'wr_select_option'
            option.on_right = this.on_rights[i]
            if (this.vertical)
            {
                option.classList.add('vertical')
            }
            else
            {
                option.style.display = 'table-cell'
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
}

customElements.define('wr-multi-button', WRMultiButton)

class WRMultiNumber extends WRMultiInput
{
    constructor(label, options=[], values=[])
    {
        super(label, options, values)

        this.numbers = []
    }

    add_option(option, value=0)
    {
        this.value.push(value)
        this.options.push(option)
        this.columns = WRMultiInput.calc_num_columns(this.options.map((op, i) => `${op} - ${i}`))
    }

    get option_elements()
    {
        let rows = [[]]
        for (let i in this.options)
        {
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

            let option = new WRNumber(this.options[i], dval)
            option.primary_class = 'wr_multi_option'
            if (this.vertical)
            {
                option.classList.add('vertical')
            }
            else
            {
                option.style.display = 'table-cell'
            }
            rows[rows.length - 1].push(option)
            this.numbers.push(option)
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

customElements.define('wr-multi-number', WRMultiNumber)

class WRMultiCounter extends WRMultiInput
{
    constructor(label, options=[], value=0)
    {
        super(label, options, value)

        this.counters = []
    }

    add_option(option, value=0)
    {
        if (this.value === 0 && this.options.length === 0)
        {
            this.value = []
        }
        if (Array.isArray(this.value) && this.value.length === this.options.length)
        {
            this.value.push(value)
        }
        this.options.push(option)
        this.columns = WRMultiInput.calc_num_columns(this.options.map((op, i) => {
            return `${op} - ${Array.isArray(this.value) ? this.value[i] : this.value}`
        }))
    }

    get option_elements()
    {
        let rows = [[]]
        for (let i in this.options)
        {
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

            let option = new WRCounter(this.options[i], dval)
            option.input_id = `${this.input_id}_${create_id_from_name(this.options[i])}`
            option.primary_class = 'wr_multi_option'
            if (this.vertical)
            {
                option.classList.add('vertical')
            }
            else
            {
                option.style.display = 'table-cell'
            }
            rows[rows.length - 1].push(option)
            this.counters.push(option)
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

    increment(value, right, on_increment=false)
    {
        if (last_touch > 0 && Date.now() - last_touch > 500 && !right)
        {
            return
        }
        let current = value.innerHTML
        let modifier = right ? -1 : 1
        if (current > 0 || modifier > 0)
        {
            value.innerHTML = parseInt(current) + modifier
        }
        if (on_increment)
        {
            on_increment()
        }
    }
}

customElements.define('wr-multi-counter', WRMultiCounter)

class WROptionedInput extends WRMultiInput
{
    constructor(label, options=[], value='')
    {
        super(label, options, value)
        if (options.length > 0 && !options.includes(value))
        {
            this.value = options[0]
        }
        this.on_change = false
    }

    add_option(option)
    {
        if (this.options.length === 0)
        {
            this.value = option
        }
        this.options.push(option)
        WRMultiInput.calc_num_columns(this.options)
    }
}

class WRSelect extends WROptionedInput
{
    constructor(label, options=[], value='', images=[])
    {
        super(label, options, value)
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

            if (op_name.toLowerCase() === this.value.toLowerCase())
            {
                option.classList.add('selected')
            }
            if (this.vertical)
            {
                option.classList.add('vertical')
            }
            else
            {
                option.style.display = 'table-cell'
            }
            option.classList.add(...this.classes)

            // only add labels if the option name isn't empty
            if (op_name)
            {
                option.classList.add('wr_select_option')

                option.onclick = () => {
                    this.select_option(parseInt(i))
                    if (this.on_change)
                    {
                        this.on_change()
                    }
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

    static get_selected_index(element)
    {
        let children = element.getElementsByClassName('wr_select_option')
        for (let i = 0; i < children.length; i++)
        {
            if (children[i].classList.contains('selected'))
            {
                return i
            }
        }
        return -1
    }

    get selected_index()
    {
        return WRSelect.get_selected_index(this.element)
    }

    get selected_option()
    {
        let idx = this.selected_index
        if (idx >= 0)
        {
            return this.options[idx]
        }
        return ''
    }

    select_option(index)
    {
        let children = this.element.getElementsByClassName('wr_select_option')
        for (let i = 0; i < children.length; i++)
        {
            children[i].classList.remove('selected')
            if (i === index)
            {
                children[i].classList.add('selected')
            }
        }
    }
}

customElements.define('wr-select', WRSelect)

class WRMultiSelect extends WRSelect
{
    constructor(label, options=[], value='', images=[])
    {
        super(label, options, value, images)
    }

    get selected_indices()
    {
        let selected = []
        let children = this.element.getElementsByClassName('wr_select_option')
        for (let i = 0; i < children.length; i++)
        {
            if (children[i].classList.contains('selected'))
            {
                selected.push(i)
            }
        }
        return selected
    }

    get selected_option()
    {
        return this.selected_indices.map(i => this.options[i])
    }

    select_option(index)
    {
        this.element.getElementsByClassName('wr_select_option')[index].classList.toggle('selected')
    }
}

customElements.define('wr-multi-select', WRMultiSelect)

class WRDropdown extends WROptionedInput
{
    constructor(label, options=[], value='')
    {
        super(label, options, value)

        this.element = document.createElement('select')
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

    connectedCallback()
    {
        if (this.label)
        {
            this.label_el.className = 'input_label'
            this.label_el.append(this.label)
            this.append(this.label_el)
        }

        this.element.id = this.input_id
        this.element.className = 'wr_dropdown'
        this.element.classList.add(...this.classes)
        this.element.onclick = event => event.stopPropagation()
        this.element.onchange = this.on_change
        this.element.append(...this.option_elements)

        this.append(this.description_element)
        this.append(this.element)
    }
}

customElements.define('wr-dropdown', WRDropdown)

class WROption extends WRElement
{
    constructor(key, label, primary_list=true, type='pit_option')
    {
        super()

        this.key = key
        this.label = label
        this.primary_list = primary_list
        this.selected = ''
        this.type = type

        this.id = WROption.get_id(this.primary_list, this.type, this.key)

        this.element = document.createElement('div')
    }

    static get_id(primary_list, type, key)
    {
        if (primary_list)
        {
            return `left_${type}_${key}`
        }
        else
        {
            return `right_${type}_${key}`
        }
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

    connectedCallback()
    {
        if (this.primary_list)
        {
            this.onclick = () => open_option(this.key)
            this.onauxclick = event => {
                touch_end(event, () => alt_option(this.key))
                return false
            }
            this.ontouchend = event => touch_end(event, () => alt_option(this.key))
        }
        else
        {
            this.onclick = () => open_secondary_option(this.key)
            this.onauxclick = event => touch_end(event, () => alt_secondary_option(this.key))
            this.ontouchend = event => touch_end(event, () => alt_secondary_option(this.key))
        }
        this.oncontextmenu = () => false
        this.ontouchstart = event => touch_start(event)
        this.className = this.type
        this.classList.add(...this.classes)
        if (this.selected)
        {
            this.classList.add(this.selected)
        }
        this.append(...this.label_element)
    }
}

customElements.define('wr-option', WROption)

class WRDescriptiveOption extends WROption
{
    constructor(key, label, description, primary_list=true)
    {
        super(key, label, primary_list)

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

customElements.define('wr-descriptive-option', WRDescriptiveOption)

class WRMatchOption extends WROption
{
    constructor(key, label, red_teams, blue_teams, primary_list=true)
    {
        super(key, label, primary_list, 'match_option')

        this.red_teams = red_teams
        this.blue_teams = blue_teams
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

customElements.define('wr-match-option', WRMatchOption)

class WRStack extends WRElement
{
    constructor(elements=[], horizontal=false)
    {
        super()

        this.elements = elements
        this.horizontal = horizontal

        this.element = document.createElement('div')
    }

    add_element(element)
    {
        this.elements.push(element)
    }

    connectedCallback()
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

        this.className = 'stack'
        this.append(...this.elements)
    }
}

customElements.define('wr-stack', WRStack)

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

/**
 * function:    create_header_row
 * parameters:  labels text
 * returns:     HTML tr
 * description: Creates a table row element with a set of headers using the provided label text.
 */
function create_header_row(labels)
{
    let tr = document.createElement('tr')
    for (label of labels)
    {
        let th = document.createElement('th')
        th.innerText = label
        tr.append(th)
    }
    return tr
}

var last_touch
var last_touch_time = -1

/**
 * Log the time the screen was touched.
 */
function touch_start(event)
{
    last_touch = event
    last_touch_time = Date.now()
}

/**
 * Execute a given string if it has been 500ms since the screen was touched.
 * @param {TouchEvent} event Event triggered by touch
 * @param {Function} func JS function to execute
 */
function touch_end(event, func)
{
    let deltaX = Math.abs(last_touch.pageX - event.pageX)
    let deltaY = Math.abs(last_touch.pageY - event.pageY)
    if (last_touch_time > 0 && Date.now() - last_touch_time > 400 && deltaX < 10 && deltaY < 10)
    {
        func()
        event.preventDefault()
    }
    last_touch_time = -last_touch_time
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