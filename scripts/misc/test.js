/**
 * file:        test.js
 * description: Test page, used for testing inputs.
 * author:      Liam Fruzyna
 * date:        2022-04-03
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
    header_info.innerText = 'Test Page'

    let page = new PageFrame('', 'Test Page')
    let buttons = new ColumnFrame('', 'Button Column')
    page.add_column(buttons)

    let button = new Button('', 'Test Button')
    button.on_click = `alert('Button clicked')`
    button.on_secondary = `alert('Button right clicked')`
    buttons.add_input(button)

    let link = new Button('', 'Link Button')
    link.link = `'https://fruzyna.net'`
    buttons.add_input(link)


    let multibuttons = new ColumnFrame('', 'Multi-Button Column')
    page.add_column(multibuttons)

    let multibutton = new MultiButton('', 'Test Multi-Button')
    multibutton.add_option('A', `alert('A')`)
    multibutton.add_option('B', `alert('B')`)
    multibutton.add_option('C', `alert('C')`)
    multibutton.columns = 3
    multibuttons.add_input(multibutton)

    let wrapmultibutton = new MultiButton('', 'Wrapping Multi-Button')
    wrapmultibutton.add_option('A', `alert('A')`, `alert('rA')`)
    wrapmultibutton.add_option('B', `alert('B')`, `alert('rB')`)
    wrapmultibutton.add_option('C', `alert('C')`, `alert('rC')`)
    wrapmultibutton.add_option('D', `alert('D')`, `alert('rD')`)
    multibuttons.add_input(wrapmultibutton)

    let vertmultibutton = new MultiButton('', 'Vertical Multi-Button')
    vertmultibutton.add_option('A', `alert('A')`)
    vertmultibutton.add_option('B', `alert('B')`)
    vertmultibutton.add_option('C', `alert('C')`)
    vertmultibutton.add_option('D', `alert('D')`)
    vertmultibutton.vertical = true
    multibuttons.add_input(vertmultibutton)


    let checkboxes = new ColumnFrame('', 'Checkbox Column')
    page.add_column(checkboxes)

    let checkbox = new Checkbox('', 'Test Checkbox')
    checkboxes.add_input(checkbox)

    let alertbox = new Checkbox('', 'Alert Checkbox', true)
    alertbox.on_click = `alert('Hi!')`
    checkboxes.add_input(alertbox)


    let counters = new ColumnFrame('', 'Counter Column')
    page.add_column(counters)

    let counter = new Counter('', 'Test Counter')
    counters.add_input(counter)

    let cycler = new Cycler('', 'Test Cycler')
    cycler.on_decrement = `alert('decrement cycle')`
    counters.add_input(cycler)

    let alertcounter = new Counter('', 'Alert Counter', 5)
    alertcounter.on_increment = `alert('Up')`
    alertcounter.on_decrement = `alert('Down')`
    counters.add_input(alertcounter)


    let multicounters = new ColumnFrame('', 'Multi-Counter Column')
    page.add_column(multicounters)

    let multicounter = new MultiCounter('', 'Test Multi-Counter')
    multicounter.add_option('A')
    multicounter.add_option('B')
    multicounter.add_option('C')
    multicounter.columns = 3
    multicounters.add_input(multicounter)

    let wrapmulticounter = new MultiCounter('', 'Wrapping Multi-Counter', ['A', 'B', 'C', 'D'], [0, 1, 2, 3])
    multicounters.add_input(wrapmulticounter)

    let vertmulticounter = new MultiCounter('', 'Vertical Multi-Counter', ['A', 'B', 'C', 'D'], [0])
    vertmulticounter.vertical = true
    multicounters.add_input(vertmulticounter)


    let entries = new ColumnFrame('', 'Entry Column')
    page.add_column(entries)

    let entry = new Entry('', 'Test Entry')
    entries.add_input(entry)

    let alertentry = new Entry('', 'Alert Entry', 'Test')
    alertentry.on_text_change = `alert('Changed')`
    entries.add_input(alertentry)

    let numentry = new Entry('', 'Number Entry')
    numentry.type = 'number'
    entries.add_input(numentry)

    let boundentry = new Entry('', 'Bounded Entry', 5)
    boundentry.type = 'number'
    boundentry.bounds = [4, 6]
    entries.add_input(boundentry)

    let color_entry = new Entry('', 'Color Entry', '#00FF00')
    color_entry.show_color = true
    entries.add_input(color_entry)

    let extentry = new Extended('', 'Extended Entry')
    entries.add_input(extentry)

    let selects = new ColumnFrame('', 'Select Column')
    page.add_column(selects)

    let select = new Select('', 'Test Select', ['A', 'B', 'C'], 'C')
    select.columns = 3
    selects.add_input(select)

    let alertselect = new Select('', 'Alert Select')
    alertselect.add_option('A')
    alertselect.add_option('B')
    alertselect.add_option('C')
    alertselect.default = 'B'
    alertselect.on_change = `alert('Select')`
    selects.add_input(alertselect)

    let wrapselect = new Select('', 'Wrapping Select', ['A', 'B', 'C', 'D'], 'C')
    selects.add_input(wrapselect)

    let vertselect = new Select('', 'Vertical Select', ['A', 'B', 'C', 'D'], 'C')
    vertselect.vertical = true
    selects.add_input(vertselect)

    let multiselects = new ColumnFrame('', 'MultiSelect Column')
    page.add_column(multiselects)

    let multiselect = new MultiSelect('', 'Test MultiSelect', ['A', 'B', 'C'], ['C'])
    multiselect.columns = 3
    multiselects.add_input(multiselect)

    let dropdowns = new ColumnFrame('', 'Dropdown Column')
    page.add_column(dropdowns)

    let dropdown = new Dropdown('', 'Test Dropdown', ['A', 'B', 'C'], 'C')
    dropdowns.add_input(dropdown)

    let alertdropdown = new Dropdown('', 'Alert Dropdown')
    alertdropdown.add_option('A')
    alertdropdown.add_option('B')
    alertdropdown.add_option('C')
    alertdropdown.default = 'B'
    alertdropdown.on_change = `alert('Select')`
    dropdowns.add_input(alertdropdown)

    let others = new ColumnFrame('', 'Other Column')
    page.add_column(others)

    let teststatus = new StatusTile('', 'Test Status', 'red')
    others.add_input(teststatus)

    let testslider = new Slider('', 'Test Slider')
    others.add_input(testslider)

    let alertslider = new Slider('', 'Alert Slider', 5)
    alertslider.bounds = [3, 7, 2]
    alertslider.on_change = `alert('Slid')`
    others.add_input(alertslider)

    body.append(page.element)

    let timer = new Timer('', 'Test Timer')
    document.getElementById('counter_column').append(timer.get())
}