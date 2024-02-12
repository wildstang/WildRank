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
    header_info.innerHTML = 'Config Debug'
    
    let keys = new StatusTile('keys', 'Keys')
    let defaults = new StatusTile('defaults', 'Defaults')
    let theme = new StatusTile('theme', 'Theme')
    let dark_theme = new StatusTile('dark_theme', 'Dark Theme')
    let users = new StatusTile('users', 'Users')
    let settings = new StatusTile('settings', 'Settings')
    
    let pit = new StatusTile('pit', 'Pit')
    let match = new StatusTile('match', 'Match')
    let note = new StatusTile('note', 'Note')
    let smart_stats = new StatusTile('smart_stats', 'Smart Stats')
    let coach = new StatusTile('coach', 'Coach')
    let whiteboard = new StatusTile('whiteboard', 'Whiteboard')
    let version = new StatusTile('version', 'Version')

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

    let page = new PageFrame('', '', [new ColumnFrame('settings_col', 'Settings Config', [keys, defaults, theme, dark_theme, users, settings]),
                                      new ColumnFrame('game_col', `${cfg.year} Config`, [pit, match, note, smart_stats, coach, whiteboard, version])]).element
    body.replaceChildren(page)
    
    keys.status = keys_result.result
    defaults.status = defaults_result.result
    theme.status = theme_result.result
    dark_theme.status = dark_theme_result.result
    users.status = users_result.result
    settings.status = settings_result.result
    
    pit.status = pit_result.result
    match.status = match_result.result
    note.status = note_result.result
    smart_stats.status = smart_stats_result.result
    coach.status = coach_result.result
    whiteboard.status = whiteboard_result.result
    version.status = version_result.result
}