/**
 * file:        edit-stats.js
 * description: Allows deleting smart results.
 * author:      Liam Fruzyna
 * date:        2023-02-25
 */


/**
 * Populates the body of the page.
 */
function init_page()
{
    build_buttons()
}

/**
 * Populates the body of the page with a single column of buttons, one to delete each smart result.
 */
function build_buttons()
{
    let column = new WRColumn('Delete Smart Result')
    for (let i in cfg.analysis.smart_results)
    {
        let stat = cfg.analysis.smart_results[i]
        column.add_input(new WRButton(`${stat.name} (${stat.type})`, () => delete_val(i)))
    }

    // build template
    preview.replaceChildren(new WRPage('', [column]))
}

/**
 * Deletes the smart result corresponding to the given index, then rebuilds the page.
 * @param {Number} idx Index of smart result
 */
function delete_val(idx)
{
    cfg.analysis.smart_results.splice(idx, 1)
    cfg.analysis.store_config()

    build_buttons()
}