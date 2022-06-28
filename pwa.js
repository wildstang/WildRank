/**
 * file:        pwa.js
 * description: Used to implement offline mode for PWAs. 
 * author:      Liam Fruzyna
 * date:        2022-01-21
 */

const CACHE_NAME = 'wildrank-2.0.0-indev'
const CACHE_LIST = [
    // html files
    '/',
    '/index.html',
    '/selection.html',
    // styles
    '/styles/style.css',
    '/styles/inputs.css',
    '/styles/selection.css',
    // scripts
    '/scripts/about.js',
    '/scripts/blank.js',
    '/scripts/cache.js',
    '/scripts/coach.js',
    '/scripts/config-debug.js',
    '/scripts/config-generator.js',
    '/scripts/config.js',
    '/scripts/cycles.js',
    '/scripts/data.js',
    '/scripts/distro.js',
    '/scripts/edit-coach.js',
    '/scripts/event-generator.js',
    '/scripts/events.js',
    '/scripts/export.js',
    '/scripts/home.js',
    '/scripts/index.js',
    '/scripts/init.js',
    '/scripts/inputs.js',
    '/scripts/jszip.min.js',
    '/scripts/keys.js',
    '/scripts/links.js',
    '/scripts/match-overview.js',
    '/scripts/matches.js',
    '/scripts/mini-picklists.js',
    '/scripts/picklists-core.js',
    '/scripts/picklists.js',
    '/scripts/pits.js',
    '/scripts/pivot.js',
    '/scripts/plot.js',
    '/scripts/progress.js',
    '/scripts/random.js',
    '/scripts/ranker.js',
    '/scripts/results.js',
    '/scripts/scatter.js',
    '/scripts/scout.js',
    '/scripts/selection-pages.js',
    '/scripts/selection.js',
    '/scripts/settings.js',
    '/scripts/sides.js',
    '/scripts/teams.js',
    '/scripts/test.js',
    '/scripts/transfer-raw.js',
    '/scripts/transfer.js',
    '/scripts/users.js',
    '/scripts/utils.js',
    '/scripts/whiteboard.js',
    // assets
    '/assets/blue-cargo.png',
    '/assets/cargo.png',
    '/assets/dozer.png',
    '/assets/field-2018.png',
    '/assets/field-2019.png',
    '/assets/field-2020.png',
    '/assets/field-2022.png',
    '/assets/hatch_panel.png',
    '/assets/icon-192x192.png',
    '/assets/icon-256x256.png',
    '/assets/icon-384x384.png',
    '/assets/icon-512x512.png',
    '/assets/menu-white-18dp.svg',
    '/assets/power_cell.png',
    '/assets/red-cargo.png',
    // configs
    '/config/2022-config.json',
    '/config/settings-config.json',
    // other files
    '/favicon.ico',
    '/manifest.webmanifest',
    '/about'
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
                const CACHE = await caches.open(CACHE_NAME)
                await CACHE.addAll(CACHE_LIST)
                break
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