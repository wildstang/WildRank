/**
 * file:        edit-stats.js
 * description: Allows deleting smart stats
 * author:      Liam Fruzyna
 * date:        2023-02-25
 */


/**
 * function:    init_page
 * parameters:  none
 * returns:     none
 * description: Populate body
 */
function init_page()
{
    build_buttons()
}

/**
 * function:    build_buttons
 * parameters:  none
 * returns:     none
 * description: Populates the body with buttons to create and delete coach values.
 */
function build_buttons()
{
    let column = new WRColumn('Delete Smart Stat')
    for (let i in cfg.smart_stats)
    {
        let stat = cfg.smart_stats[i]
        column.add_input(new WRButton(`${stat.name} (${stat.type})`, () => delete_val(i)))
    }

    // build template
    body.replaceChildren(new WRPage('', [column]))
}

/**
 * function:    delete_val
 * parameters:  index of coach value
 * returns:     none
 * description: Delete a coach value of a given index.
 */
function delete_val(idx)
{
    cfg.smart_stats.splice(idx, 1)
    localStorage.setItem(`config-${cfg.year}-smart_stats`, JSON.stringify(cfg.smart_stats))

    build_buttons()
}