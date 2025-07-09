/**
 * file:        config-debug.js
 * description: Page displaying config debug information.
 * author:      Liam Fruzyna
 * date:        2022-06-21
 */

/**
 * Populates the contents of the page.
 */
function init_page()
{
    // set header
    header_info.innerText = 'Config Debug'

    let page = new WRPage('', [new WRColumn('Settings', [validate('App'), validate('User')])])
    if (cfg.year)
    {
        page.add_column(new WRColumn(`${cfg.year} Config`, [validate('Analysis'),
            validate('Game'), validate('Scout')]))
    }

    preview.replaceChildren(page)
}

/**
 * Builds a status tile to represent the config file with the given name.
 * @param {String} config_name Config file name
 * @returns A WRStatusTile representing the config file
 */
function validate(config_name)
{
    let config = cfg[config_name.toLowerCase()]
    let name = `${config_name} ${config.version}`
    if (name.length > 17)
    {
        name = config.version
    }
    let tile = new WRStatusTile(name)
    let errors = config.validate(false).filter(t => t !== true)
    tile.set_status(errors.every(b => b === true) ? 1 : -1)
    tile.description = errors.join('<br>')
    return tile
}