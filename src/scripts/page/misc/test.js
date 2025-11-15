
function init_page()
{
    // set header
    header_info.innerText = 'Test Page'

    let page = new WRPage('Page')

    let buttons = new WRColumn('Buttons')
    page.add_column(buttons)

    let alert_1 = () => {
        console.log('Alert 1')
        alert('Alert 1')
    }
    let alert_2 = () => {
        console.log('Alert 2')
        alert('Alert 2')
    }
    let button = new WRButton('Button', alert_1)
    button.on_right = alert_2
    buttons.add_input(button)

    let link_button = new WRLinkButton('Link Button', 'https://wildstang.org')
    buttons.add_input(link_button)

    let timer = new WRTimer('Timer')
    buttons.add_input(timer)

    let counter = new WRCounter('Counter', 5)
    buttons.add_input(counter)

    let cycler = new WRCycler('Cycler', 1)
    buttons.add_input(cycler)


    let clickables = new WRColumn('Clickables')
    page.add_column(clickables)

    let checkbox = new WRCheckbox('Checkbox')
    checkbox.on_click = alert_1
    checkbox.check() // TODO: needs to be done after adding to page
    clickables.add_input(checkbox)

    let slider = new WRSlider('Slider', 5)
    slider.min = 0
    slider.max = 100
    slider.incr = 10
    slider.on_change = alert_1
    clickables.add_input(slider)

    let dropdown = new WRDropdown('Dropdown', ['Option 1', 'Option 2', 'Option 3', 'Option 4'])
    dropdown.on_change = alert_1
    clickables.add_input(dropdown)


    let text = new WRColumn('Text')
    page.add_column(text)

    let number = new WRNumber('Number', 5)
    text.add_input(number)

    let card = new WRCard('This is a card with lots of text.')
    card.limitWidth = true
    card.space_after = false
    text.add_input(card)

    let tile = new WRStatusTile('Status Tile')
    tile.set_status(0)
    tile.on_click = alert_1
    text.add_input(tile)


    let text_boxes = new WRColumn('Text Boxes')
    page.add_column(text_boxes)

    let extended = new WRExtended('Extended', 'This is an extended text box with lots of text.')
    extended.on_text_change = alert_1
    text_boxes.add_input(extended)

    let entry = new WREntry('Entry', 'This is a text box')
    entry.on_text_change = alert_1
    text_boxes.add_input(entry)

    let number_entry = new WREntry('Number Entry', 5)
    number_entry.type = 'number'
    number_entry.on_text_change = alert_1
    text_boxes.add_input(number_entry)

    let color_entry = new WREntry('Color Entry', '#00FF00')
    color_entry.show_color = true
    text_boxes.add_input(color_entry)


    let selects = new WRColumn('Selects')
    page.add_column(selects)

    let select = new WRSelect('Select', ['1', '2'])
    let selected_idx_alert = () => {
        console.log(select.selected_index)
        alert(select.selected_index)
    }
    select.on_change = selected_idx_alert
    selects.add_input(select)

    let vert_select = new WRSelect('Vertical Select', ['1', '2'])
    vert_select.vertical = true
    let selected_op_alert = () => {
        console.log(vert_select.selected_option)
        alert(vert_select.selected_option)
    }
    vert_select.on_change = selected_op_alert
    selects.add_input(vert_select)

    let large_select = new WRSelect('Large Select', ['Option 1', 'Option 2', 'Option 3', 'Option 4'])
    large_select.on_change = alert_1
    selects.add_input(large_select)

    let custom_select = new WRSelect('3 Column Select', ['1', '2', '3', '4'])
    custom_select.columns = 3
    custom_select.on_change = alert_1
    selects.add_input(custom_select)

    let image_select = new WRSelect('Image Select', ['1', '2', '3', '4'], '2',
        ['assets/wheels/Colson.png', 'assets/wheels/KOP.png', 'assets/wheels/Other.png', 'assets/wheels/Treaded.png'])
    image_select.on_change = alert_1
    selects.add_input(image_select)



    let slim_page = new WRPage('Slim Page')

    let slim_buttons = new WRColumn('Buttons')
    slim_page.add_column(slim_buttons)

    let slim_button = new WRButton('Button', alert_1)
    slim_button.add_class('slim')
    slim_button.on_right = alert_2
    slim_buttons.add_input(slim_button)

    let slim_link_button = new WRLinkButton('Link Button', 'https://wildstang.org')
    slim_link_button.add_class('slim')
    slim_buttons.add_input(slim_link_button)

    let slim_timer = new WRTimer('Timer')
    slim_timer.add_class('slim')
    slim_buttons.add_input(slim_timer)

    let slim_counter = new WRCounter('Counter', 5)
    slim_counter.add_class('slim')
    slim_buttons.add_input(slim_counter)


    let slim_clickables = new WRColumn('Clickables')
    slim_page.add_column(slim_clickables)

    let slim_checkbox = new WRCheckbox('Checkbox')
    slim_checkbox.add_class('slim')
    slim_checkbox.on_click = alert_1
    slim_checkbox.check() // TODO: needs to be done after adding to page
    slim_clickables.add_input(slim_checkbox)

    let slim_slider = new WRSlider('Slider', 5)
    slim_slider.add_class('slim')
    slim_slider.min = 0
    slim_slider.max = 100
    slim_slider.incr = 10
    slim_slider.on_change = alert_1
    slim_clickables.add_input(slim_slider)

    let slim_dropdown = new WRDropdown('Dropdown', ['Option 1', 'Option 2', 'Option 3', 'Option 4'])
    slim_dropdown.add_class('slim')
    slim_dropdown.on_change = alert_1
    slim_clickables.add_input(slim_dropdown)


    let slim_text = new WRColumn('Text')
    slim_page.add_column(slim_text)

    let slim_number = new WRNumber('Number', 5)
    slim_number.add_class('slim')
    slim_text.add_input(slim_number)

    let slim_entry = new WREntry('Entry', 'This is a text box')
    slim_entry.on_text_change = alert_1
    slim_entry.add_class('slim')
    slim_text.add_input(slim_entry)

    let slim_number_entry = new WREntry('Number Entry', 5)
    slim_number_entry.add_class('slim')
    slim_number_entry.type = 'number'
    slim_number_entry.on_text_change = alert_1
    slim_text.add_input(slim_number_entry)


    let slim_selects = new WRColumn('Selects')
    slim_page.add_column(slim_selects)

    let slim_select = new WRSelect('Select', ['1', '2'])
    slim_select.add_class('slim')
    let slim_selected_idx_alert = () => {
        console.log(slim_select.selected_index)
        alert(slim_select.selected_index)
    }
    slim_select.on_change = slim_selected_idx_alert
    slim_selects.add_input(slim_select)

    let slim_vert_select = new WRSelect('Vertical Select', ['1', '2'])
    slim_vert_select.add_class('slim')
    slim_vert_select.vertical = true
    let slim_selected_op_alert = () => {
        console.log(slim_vert_select.selected_option)
        alert(slim_vert_select.selected_option)
    }
    slim_vert_select.on_change = slim_selected_op_alert
    slim_selects.add_input(slim_vert_select)

    let slim_large_select = new WRSelect('Large Select', ['Option 1', 'Option 2', 'Option 3', 'Option 4'])
    slim_large_select.add_class('slim')
    slim_large_select.on_change = alert_1
    slim_selects.add_input(slim_large_select)

    let slim_custom_select = new WRSelect('3 Column Select', ['1', '2', '3', '4'])
    slim_custom_select.add_class('slim')
    slim_custom_select.columns = 3
    slim_custom_select.on_change = alert_1
    slim_selects.add_input(slim_custom_select)


    let multi_page = new WRPage('Multi-Inputs')

    let multi_buttons = new WRColumn('Multi-Buttons')
    multi_page.add_column(multi_buttons)

    let multi_button = new WRMultiButton('Multi-Button')
    multi_button.add_option('1', alert_1, alert_2)
    multi_button.add_option('2', alert_2, alert_1)
    multi_buttons.add_input(multi_button)

    let vert_multi_button = new WRMultiButton('Vertical Multi-Button')
    vert_multi_button.add_option('1', alert_1, alert_2)
    vert_multi_button.add_option('2', alert_2, alert_1)
    vert_multi_button.vertical = true
    multi_buttons.add_input(vert_multi_button)

    let large_multi_button = new WRMultiButton('Large Multi-Button')
    large_multi_button.add_option('Button 1', alert_1, alert_2)
    large_multi_button.add_option('Button 2', alert_2, alert_1)
    large_multi_button.add_option('Button 3', alert_1, alert_2)
    large_multi_button.add_option('Button 4', alert_2, alert_1)
    multi_buttons.add_input(large_multi_button)

    let custom_multi_button = new WRMultiButton('3 Column Multi-Button')
    custom_multi_button.add_option('1', alert_1, alert_2)
    custom_multi_button.add_option('2', alert_2, alert_1)
    custom_multi_button.add_option('3', alert_1, alert_2)
    custom_multi_button.add_option('4', alert_2, alert_1)
    custom_multi_button.columns = 3
    multi_buttons.add_input(custom_multi_button)


    let multi_numbers = new WRColumn('Multi-Numbers')
    multi_page.add_column(multi_numbers)

    let multi_number = new WRMultiNumber('Multi-Number')
    multi_number.add_option('A')
    multi_number.add_option('B', 50)
    multi_numbers.add_input(multi_number)

    let vert_multi_number = new WRMultiNumber('Vertical Multi-Number')
    vert_multi_number.add_option('A')
    vert_multi_number.add_option('B', 50)
    vert_multi_number.vertical = true
    multi_numbers.add_input(vert_multi_number)

    let large_multi_number = new WRMultiNumber('Large Multi-Number')
    large_multi_number.add_option('Numb A')
    large_multi_number.add_option('Numb B', 5)
    large_multi_number.add_option('Numb C', 25)
    large_multi_number.add_option('Numb D', 50)
    multi_numbers.add_input(large_multi_number)

    let custom_multi_number = new WRMultiNumber('3 Column Multi-Number')
    custom_multi_number.add_option('A')
    custom_multi_number.add_option('B', 5)
    custom_multi_number.add_option('C', 25)
    custom_multi_number.add_option('D', 50)
    custom_multi_number.columns = 3
    multi_numbers.add_input(custom_multi_number)


    let multi_counters = new WRColumn('Multi-Counter')
    multi_page.add_column(multi_counters)

    let multi_counter = new WRMultiCounter('Multi-Counter')
    multi_counter.add_option('A')
    multi_counter.add_option('B', 50)
    multi_counters.add_input(multi_counter)

    let vert_multi_counter = new WRMultiCounter('Vertical Multi-Counter')
    vert_multi_counter.add_option('A')
    vert_multi_counter.add_option('B', 50)
    vert_multi_counter.vertical = true
    multi_counters.add_input(vert_multi_counter)

    let large_multi_counter = new WRMultiCounter('Large Multi-Counter')
    large_multi_counter.add_option('Cnt A')
    large_multi_counter.add_option('Cnt B', 5)
    large_multi_counter.add_option('Cnt C', 25)
    large_multi_counter.add_option('Cnt D', 50)
    multi_counters.add_input(large_multi_counter)

    let custom_multi_counter = new WRMultiCounter('3 Column Multi-Counter')
    custom_multi_counter.add_option('A')
    custom_multi_counter.add_option('B', 5)
    custom_multi_counter.add_option('C', 25)
    custom_multi_counter.add_option('D', 50)
    custom_multi_counter.columns = 3
    multi_counters.add_input(custom_multi_counter)


    let multi_selects = new WRColumn('Selects')
    multi_page.add_column(multi_selects)

    let multi_select = new WRMultiSelect('Multi-Select', ['1', '2'])
    let multi_selected_idx_alert = () => {
        console.log(multi_select.selected_indices)
        alert(multi_select.selected_indices)
    }
    multi_select.on_change = multi_selected_idx_alert
    multi_selects.add_input(multi_select)

    let vert_multi_select = new WRMultiSelect('Vertical Multi-Select', ['1', '2'])
    vert_multi_select.vertical = true
    let multi_selected_op_alert = () => {
        console.log(vert_multi_select.selected_option)
        alert(vert_multi_select.selected_option)
    }
    vert_multi_select.on_change = multi_selected_op_alert
    multi_selects.add_input(vert_multi_select)

    let large_multi_select = new WRMultiSelect('Large Multi-Select', ['Option 1', 'Option 2', 'Option 3', 'Option 4'])
    large_multi_select.on_change = alert_1
    multi_selects.add_input(large_multi_select)

    let custom_multi_select = new WRMultiSelect('3 Column Multi-Select', ['1', '2', '3', '4'])
    custom_multi_select.columns = 3
    custom_multi_select.on_change = alert_1
    multi_selects.add_input(custom_multi_select)

    let image_multi_select = new WRMultiSelect('Image Multi Select', ['1', '2', '3', '4'], '2',
        ['assets/wheels/Colson.png', 'assets/wheels/KOP.png', 'assets/wheels/Other.png', 'assets/wheels/Treaded.png'])
        image_multi_select.on_change = alert_1
    multi_selects.add_input(image_multi_select)


    preview.replaceChildren(page, slim_page, multi_page)
}