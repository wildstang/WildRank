/**
 * file:        pwa.js
 * description: Used to implement offline mode for PWAs. 
 * author:      Liam Fruzyna
 * date:        2022-01-21
 */

const CACHE_NAME = 'wildrank-4.1.1'
const CACHE_LIST = [
    // html files
    '/',
    '/index.html',
    '/selection.html',
    '/updater.html',
    // styles
    '/styles/style.css',
    '/styles/inputs.css',
    '/styles/selection.css',
    // scripts
    '/scripts/about.js',
    '/scripts/blank.js',
    '/scripts/bracket-obj.js',
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
    '/scripts/elements.js',
    '/scripts/event-generator.js',
    '/scripts/events.js',
    '/scripts/export.js',
    '/scripts/home.js',
    '/scripts/init.js',
    '/scripts/input-builder.js',
    '/scripts/inputs.js',
    '/scripts/keys.js',
    '/scripts/links.js',
    '/scripts/match-overview.js',
    '/scripts/matches.js',
    '/scripts/mini-picklists.js',
    '/scripts/multipicklists.js',
    '/scripts/note-viewer.js',
    '/scripts/note.js',
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
    '/scripts/setup.js',
    '/scripts/sides.js',
    '/scripts/stat-builders.js',
    '/scripts/storage.js',
    '/scripts/teams.js',
    '/scripts/transfer-raw.js',
    '/scripts/transfer.js',
    '/scripts/users.js',
    '/scripts/utils.js',
    '/scripts/whiteboard-obj.js',
    '/scripts/whiteboard.js',
    '/scripts/libs/jszip.min.js',
    '/scripts/libs/Vibrant.min.js',
    /* don't cache misc scripts that rely on tba
    '/scripts/misc/2022-score-estimator.js',
    '/scripts/misc/2023-score-estimator.js',
    '/scripts/misc/district-counter.js',
    '/scripts/misc/event-planner.js',
    '/scripts/misc/international-counter.js',
    '/scripts/misc/match-counter.js',
    '/scripts/misc/revival-counter.js',
    '/scripts/misc/score-counter.js',
    '/scripts/misc/team-profile.js',*/
    '/scripts/misc/2025-audit.js',
    '/scripts/misc/2025-score-calculator.js',
    '/scripts/misc/test.js',
    // assets
    '/assets/2025/algae.png',
    '/assets/2025/coral.png',
    '/assets/2025/field-2025.png',
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
    '/assets/wheels/Colson.png',
    '/assets/wheels/KOP.png',
    '/assets/wheels/Other.png',
    '/assets/wheels/REV.png',
    '/assets/wheels/TPU.png',
    '/assets/wheels/Treaded.png',
    // configs
    '/config/2025-config.json',
    '/config/settings-config.json',
    // other files
    '/favicon.ico',
    '/manifest.webmanifest',
    //'/pwa.js',
    '/about'
]

self.addEventListener('install', e => {
    e.waitUntil((async () => {
        // store files to cache on install
        const CACHE = await caches.open(CACHE_NAME)
        let requests = CACHE_LIST.map(url => new Request(url, { cache: 'reload' }))
        await CACHE.addAll(requests)
    })())

    // don't wait for the app to be exited, force activation now
    self.skipWaiting()
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
                let requests = CACHE_LIST.map(url => new Request(url, { cache: 'reload' }))
                await cache.addAll(requests)
                break
            }
        }
        return res
    })())
})

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keyList => {
        // take over all existing clients
        clients.claim()

        // remove old caches
        return Promise.all(keyList.map(key => {
            if (key != CACHE_NAME)
            {
                return caches.delete(key)
            }
        }))
    }))
})

self.addEventListener('message', e => {
    if (e.data.msg === 'get_version')
    {
        self.clients.matchAll().then(clients => {
            clients.forEach(client => client.postMessage({msg: 'version', version: CACHE_NAME}));
        })
    }
    else if (e.data.msg === 'get_files')
    {
        self.clients.matchAll().then(clients => {
            clients.forEach(client => client.postMessage({msg: 'files', files: CACHE_LIST}));
        })
    }
    // TODO: technically skipWaiting should get called in response to a message
})
