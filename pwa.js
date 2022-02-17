/**
 * file:        pwa.js
 * description: Used to implement offline mode for PWAs. 
 * author:      Liam Fruzyna
 * date:        2022-01-21
 */

const CACHE_NAME = 'wildrank-rc16'
const CACHE_LIST = [
    // html files
    '/index.html',
    '/selection.html',
    // styles
    '/styles/style.css',
    '/styles/inputs.css',
    '/styles/selection.css',
    // scripts
    '/pwa.js',
    '/scripts/about.js',
    '/scripts/advanced.js',
    '/scripts/coach.js',
    '/scripts/config-generator.js',
    '/scripts/config.js',
    '/scripts/distro.js',
    '/scripts/event-generator.js',
    '/scripts/events.js',
    '/scripts/home.js',
    '/scripts/init.js',
    '/scripts/index.js',
    '/scripts/jszip.min.js',
    '/scripts/keys.js',
    '/scripts/links.js',
    '/scripts/match-overview.js',
    '/scripts/matches.js',
    '/scripts/note.js',
    '/scripts/picklists-core.js',
    '/scripts/picklists.js',
    '/scripts/pits.js',
    '/scripts/pivot.js',
    '/scripts/plot.js',
    '/scripts/progress.js',
    '/scripts/random.js',
    '/scripts/ranker.js',
    '/scripts/results.js',
    '/scripts/scout.js',
    '/scripts/selection-pages.js',
    '/scripts/selection.js',
    '/scripts/settings.js',
    '/scripts/sides.js',
    '/scripts/teams.js',
    '/scripts/transfer-raw.js',
    '/scripts/transfer.js',
    '/scripts/users.js',
    '/scripts/utils.js',
    '/scripts/validation.js',
    '/scripts/whiteboard.js',
    // assets
    '/config/blue-cargo.png',
    '/config/cargo.png',
    '/config/config.json',
    '/config/dozer.png',
    '/config/field-2019.png',
    '/config/field-2020.png',
    '/config/field-2022.png',
    '/config/hatch_panel.png',
    '/config/icon-192x192.png',
    '/config/icon-256x256.png',
    '/config/icon-384x384.png',
    '/config/icon-512x512.png',
    '/config/menu-white-18dp.svg',
    '/config/power_cell.png',
    '/config/red-cargo.png',
    '/config/scout-config.json',
    // other files
    '/favicon.ico'
]

// store files to cache on install
self.addEventListener('install', e => {
    e.waitUntil((async () => {
        const CACHE = await caches.open(CACHE_NAME)
        await CACHE.addAll(CACHE_LIST)
    })())
})

// use cache instead of server
self.addEventListener('fetch', e => {
    e.respondWith((async () => {
        // attempt to pull resource from cache
        const R = await caches.match(e.request, {ignoreSearch: true})
        if (R)
        {
            return R
        }
        
        // if not there pull from server
        const RES = await fetch(e.request)
        const URL = e.request.url
        for (let file of CACHE_LIST)
        {
            if (URL.endsWith(file))
            {
                console.log('updating', file, 'to', CACHE_NAME)
                const CACHE = await caches.open(CACHE_NAME)
                CACHE.put(e.request, RES.clone())
            }
        }
        return RES
    })())
})

// remove old caches
self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keyList => {
        return Promise.all(keyList.map(key => {
            if (key != CACHE_NAME)
            {
                return caches.delete(key)
            }
        }))
    }))
})