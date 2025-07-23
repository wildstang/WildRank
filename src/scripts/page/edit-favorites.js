/**
 * file:        edit-favorites.js
 * description: Allows the user to add and delete favorites.
 * author:      Liam Fruzyna
 * date:        2025-07-22
 */

var new_key, keys


/**
 * Get possible keys and populate page.
 */
function init_page()
{
    keys = cfg.get_keys()

    build_buttons()
}

/**
 * Builds the page with an add column and a delete column.
 */
function build_buttons()
{
    let key = new_key !== undefined ? keys[new_key.element.selectedIndex] : keys[0]
    let res = cfg.get_result_from_key(key)

    new_key = new WRDropdown('New Key', cfg.get_names(keys), res.name)
    new_key.on_change = build_buttons
    let button = new WRButton('Add Favorite', create)

    let column = new WRColumn('Delete Favorite')
    for (let i in cfg.analysis.favorites)
    {
        let f = cfg.analysis.favorites[i]
        column.add_input(new WRButton(cfg.get_result_from_key(f).name, () => delete_val(i)))
    }

    // build template
    let page = new WRPage('', [new WRColumn('New Favorite', [new_key, button]), column])
    preview.replaceChildren(page)
}

/**
 * Create a new favorite for the selected key.
 */
function create()
{
    let key = keys[new_key.element.selectedIndex]
    if (cfg.analysis.favorites.includes(key))
    {
        alert(`${cfg.get_result_from_key(f).name} already a favorite`)
    }
    else
    {
        cfg.analysis.favorites.push(key)
        cfg.analysis.store_config()
    }

    build_buttons()
}

/**
 * Delete the favorite at the given index.
 * @param {Number} idx Favorite index
 */
function delete_val(idx)
{
    cfg.analysis.favorites.splice(idx, 1)
    cfg.analysis.store_config()

    build_buttons()
}