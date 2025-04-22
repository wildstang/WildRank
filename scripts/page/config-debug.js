/**
 * file:        config-debug.js
 * description: Page displaying config debug information.
 * author:      Liam Fruzyna
 * date:        2022-06-21
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
    header_info.innerText = 'Config Debug'

    let app = new WRStatusTile('App')
    let user = new WRStatusTile('User')

    let analysis = new WRStatusTile('Analysis')
    let game = new WRStatusTile('Game')
    let scout = new WRStatusTile('Scout')

    validate(app, cfg.app)
    validate(user, cfg.user)
    validate(analysis, cfg.analysis)
    validate(game, cfg.game)
    validate(scout, cfg.scout)

    let page = new WRPage('', [new WRColumn('Settings', [app, user])])
    if (cfg.year)
    {
        page.add_column(new WRColumn(`${cfg.year} Config`, [analysis, game, scout]))
    }

    body.replaceChildren(page)
}

/**
 * Runs a validation of the given config and applies the result to the given status tile.
 * @param {WRStatusTile} tile Status tile to update
 * @param {Object} config Config object to validate
 */
function validate(tile, config)
{
    let errors = config.validate(false).filter(t => t !== true)
    tile.set_status(errors.every(b => b === true) ? 1 : -1)
    tile.description = errors.join('\n\n')
}