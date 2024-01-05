/**
 * file:        pwa.js
 * description: Used to implement offline mode for PWAs. 
 * author:      Liam Fruzyna
 * date:        2022-01-21
 */

const CACHE_NAME = 'wildrank-2.3.1'
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
    '/scripts/bracket.js',
    '/scripts/cache.js',
    '/scripts/coach.js',
    '/scripts/config-debug.js',
    '/scripts/config-generator.js',
    '/scripts/config.js',
    '/scripts/custom-match.js',
    '/scripts/cycles.js',
    '/scripts/data.js',
    '/scripts/distro.js',
    '/scripts/edit-coach.js',
    '/scripts/edit-stats.js',
    '/scripts/event-generator.js',
    '/scripts/events.js',
    '/scripts/export.js',
    '/scripts/home.js',
    '/scripts/index.js',
    '/scripts/init.js',
    '/scripts/inputs.js',
    '/scripts/keys.js',
    '/scripts/links.js',
    '/scripts/match-overview.js',
    '/scripts/matches.js',
    '/scripts/mini-picklists.js',
    '/scripts/multipicklists.js',
    '/scripts/note.js',
    '/scripts/note-viewer.js',
    '/scripts/picklists-core.js',
    '/scripts/pits.js',
    '/scripts/pivot.js',
    '/scripts/plot.js',
    '/scripts/progress.js',
    '/scripts/random.js',
    '/scripts/ranker.js',
    '/scripts/results.js',
    '/scripts/scatter.js',
    '/scripts/schedule-importer.js',
    '/scripts/scout.js',
    '/scripts/scouter-scheduler.js',
    '/scripts/selection-pages.js',
    '/scripts/selection.js',
    '/scripts/settings.js',
    '/scripts/sides.js',
    '/scripts/storage.js',
    '/scripts/teams.js',
    '/scripts/transfer-raw.js',
    '/scripts/transfer.js',
    '/scripts/users.js',
    '/scripts/utils.js',
    '/scripts/whiteboard.js',
    '/scripts/whiteboard-obj.js',
    '/scripts/libs/jszip.min.js',
    '/scripts/libs/Vibrant.min.js',
    //'/scripts/misc/2022-score-estimator.js',
    '/scripts/misc/2023-score-estimator.js',
    /* don't cache misc scripts that rely on tba
    '/scripts/misc/district-counter.js',
    '/scripts/misc/event-planner.js',
    '/scripts/misc/international-counter.js',
    '/scripts/misc/match-counter.js',
    '/scripts/misc/revival-counter.js',
    '/scripts/misc/score-counter.js',
    '/scripts/misc/team-profile.js',*/
    '/scripts/misc/test.js',
    // assets
    '/assets/2023/cone.png',
    '/assets/2023/cube.png',
    '/assets/2023/field-2023.png',
    /* icons should be cached when pwa is installed
    '/assets/icons/icon-192x192-maskable.png',
    '/assets/icons/icon-192x192.png',
    '/assets/icons/icon-256x256-maskable.png',
    '/assets/icons/icon-256x256.png',
    '/assets/icons/icon-384x384-maskable.png',
    '/assets/icons/icon-384x384.png',
    '/assets/icons/icon-512x512-maskable.png',
    '/assets/icons/icon-512x512.png',*/
    '/assets/clipboard-edit-outline.png',
    '/assets/dozer.png',
    '/assets/menu-white-18dp.svg',
    // configs
    '/config/2023-config.json',
    '/config/settings-config.json',
    // other files
    '/favicon.ico',
    '/manifest.webmanifest',
    //'/pwa.js',
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
        // intercept POSTs to /import to cache for later import (used for manifest share_target)
        if (e.request.method === 'POST' && e.request.url.endsWith('/import'))
        {
            const form_data = await e.request.formData()
            let file = form_data.get('import')

            // get latest cache
            let current = 'default'
            let names = await caches.keys()
            if (names.length > 0)
            {
                current = names[0]
            }
            let cache = await caches.open(current)
        
            let headers = new Headers()
            headers.append('Content-Length', file.size)
            headers.append('Content-Type', 'application/zip')
        
            // build response and add to cache
            let res = new Response(file, { statusText: 'OK', headers: headers })
            cache.put(e.request.url, res)

            return Response.redirect('/index.html?page=transfer-raw&cache=true', 303);
        }

        // attempt to pull resource from cache
        let r = await caches.match(e.request, {ignoreSearch: true})
        if (r)
        {
            return r
        }
        
        // if not there pull from server
        let res = await fetch(e.request)
        let url = e.request.url
        for (let file of CACHE_LIST)
        {
            if (url.endsWith(file))
            {
                let cache = await caches.open(CACHE_NAME)
                await cache.addAll(CACHE_LIST)
                break
            }
        }
        return res
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