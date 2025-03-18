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

    let keys = new WRStatusTile('Keys')
    let defaults = new WRStatusTile('Defaults')
    let theme = new WRStatusTile('Theme')
    let dark_theme = new WRStatusTile('Dark Theme')
    let users = new WRStatusTile('Users')
    let settings = new WRStatusTile('Settings')

    let pit = new WRStatusTile('Pit')
    let match = new WRStatusTile('Match')
    let note = new WRStatusTile('Note')
    let smart_stats = new WRStatusTile('Smart Stats')
    let coach = new WRStatusTile('Coach')
    let whiteboard = new WRStatusTile('Whiteboard')
    let version = new WRStatusTile('Version')

    let keys_result = cfg.validate_keys('keys', true)
    keys.description = keys_result.description
    let defaults_result = cfg.validate_defaults('defaults', true)
    defaults.description = defaults_result.description
    let theme_result = cfg.validate_theme('theme', true)
    theme.description = theme_result.description
    let dark_theme_result = cfg.validate_theme('dark_theme', true)
    dark_theme.description = dark_theme_result.description
    let users_result = cfg.validate_users('users', true)
    users.description = users_result.description
    let settings_result = cfg.validate_settings('settings', true)
    settings.description = settings_result.description

    let pit_result = cfg.validate_mode('pit', true)
    pit.description = pit_result.description
    if ('id' in pit_result > 0)
    {
        pit.description += ` (${pit_result.id})`
    }
    let match_result = cfg.validate_mode('match', true)
    match.description = match_result.description
    if ('id' in match_result > 0)
    {
        match.description += ` (${match_result.id})`
    }
    let note_result = cfg.validate_mode('match', true)
    note.description = note_result.description
    if ('id' in note_result > 0)
    {
        note.description += ` (${note_result.id})`
    }
    let smart_stats_result = cfg.validate_smart_stats('smart_stats', true)
    smart_stats.description = smart_stats_result.description
    if ('id' in smart_stats_result > 0)
    {
        smart_stats.description += ` (${smart_stats_result.id})`
    }
    let coach_result = cfg.validate_coach('coach', true)
    coach.description = coach_result.description
    if ('id' in coach_result > 0)
    {
        coach.description += ` (${coach_result.id})`
    }
    let whiteboard_result = cfg.validate_whiteboard('whiteboard', true)
    whiteboard.description = whiteboard_result.description
    let version_result = cfg.validate_version('version', true)
    version.description = version_result.description

    let page = new WRPage('', [new WRColumn('Settings Config', [keys, defaults, theme, dark_theme, users, settings]),
                               new WRColumn(`${cfg.year} Config`, [pit, match, note, smart_stats, coach, whiteboard, version])])
    body.replaceChildren(page)

    keys.set_status(keys_result.result)
    defaults.set_status(defaults_result.result)
    theme.set_status(theme_result.result)
    dark_theme.set_status(dark_theme_result.result)
    users.set_status(users_result.result)
    settings.set_status(settings_result.result)
    
    pit.set_status(pit_result.result)
    match.set_status(match_result.result)
    note.set_status(note_result.result)
    smart_stats.set_status(smart_stats_result.result)
    coach.set_status(coach_result.result)
    whiteboard.set_status(whiteboard_result.result)
    version.set_status(version_result.result)
}