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
    document.getElementById('header_info').innerHTML = 'Config Debug'
    
    let keys = new StatusTile('keys', 'Keys')
    let defaults = new StatusTile('defaults', 'Defaults')
    let theme = new StatusTile('theme', 'Theme')
    let dark_theme = new StatusTile('dark_theme', 'Dark Theme')
    let users = new StatusTile('users', 'Users')
    let settings = new StatusTile('settings', 'Settings')
    
    let pit = new StatusTile('pit', 'Pit')
    let match = new StatusTile('match', 'Match')
    let smart_stats = new StatusTile('smart_stats', 'Smart Stats')
    let coach = new StatusTile('coach', 'Coach')
    let whiteboard = new StatusTile('whiteboard', 'Whiteboard')
    let version = new StatusTile('version', 'Version')

    let keys_result = cfg.validate_keys('keys', true)
    keys.description = keys_result[1]
    let defaults_result = cfg.validate_defaults('defaults', true)
    defaults.description = defaults_result[1]
    let theme_result = cfg.validate_theme('theme', true)
    theme.description = theme_result[1]
    let dark_theme_result = cfg.validate_theme('dark_theme', true)
    dark_theme.description = dark_theme_result[1]
    let users_result = cfg.validate_users('users', true)
    users.description = users_result[1]
    let settings_result = cfg.validate_settings('settings', true)
    settings.description = settings_result[1]
    
    let pit_result = cfg.validate_mode('pit', true)
    pit.description = pit_result[1]
    if (pit_result[2].length > 0)
    {
        pit.description += ` (${pit_result[2]})`
    }
    let match_result = cfg.validate_mode('match', true)
    match.description = match_result[1]
    if (match_result[2].length > 0)
    {
        match.description += ` (${match_result[2]})`
    }
    let smart_stats_result = cfg.validate_smart_stats('smart_stats', true)
    smart_stats.description = smart_stats_result[1]
    if (smart_stats_result[2].length > 0)
    {
        smart_stats.description += ` (${smart_stats_result[2]})`
    }
    let coach_result = cfg.validate_coach('coach', true)
    coach.description = coach_result[1]
    if (coach_result[2].length > 0)
    {
        coach.description += ` (${coach_result[2]})`
    }
    let whiteboard_result = cfg.validate_whiteboard('whiteboard', true)
    whiteboard.description = whiteboard_result[1]
    let version_result = cfg.validate_version('version', true)
    version.description = version_result[1]

    document.body.innerHTML += new PageFrame('', '', [new ColumnFrame('settings_col', 'Settings Config', [keys, defaults, theme, dark_theme, users, settings]), new ColumnFrame('game_col', `${cfg.year} Config`, [pit, match, smart_stats, coach, whiteboard, version])]).toString
    
    keys.status = keys_result[0]
    defaults.status = defaults_result[0]
    theme.status = theme_result[0]
    dark_theme.status = dark_theme_result[0]
    users.status = users_result[0]
    settings.status = settings_result[0]
    
    pit.status = pit_result[0]
    match.status = match_result[0]
    smart_stats.status = smart_stats_result[0]
    coach.status = coach_result[0]
    whiteboard.status = whiteboard_result[0]
    version.status = version_result[0]
}