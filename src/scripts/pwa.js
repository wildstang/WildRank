/**
 * file:        pwa.js
 * description: Used to implement offline mode for PWAs. 
 * author:      Liam Fruzyna
 * date:        2022-01-21
 */

const CACHE_NAME = 'wildrank-s5-250622'
const CACHE_LIST = [
    // html files
    '/',
    '/index.html',
    '/updater.html',
    // styles
    '/styles/inputs.css',
    '/styles/selection.css',
    '/styles/style.css',
    // scripts
    '/scripts/lib/external/jszip.min.js',
    '/scripts/lib/external/Vibrant.min.js',
    '/scripts/lib/bracket-obj.js',
    '/scripts/lib/input-builder.js',
    '/scripts/lib/mini-picklists.js',
    '/scripts/lib/picklists-core.js',
    '/scripts/lib/stat-builders.js',
    '/scripts/lib/transfer.js',
    '/scripts/lib/whiteboard-obj.js',
    /* don't cache misc scripts that rely on tba or are out of date
    '/scripts/page/misc/district-counter.js',
    '/scripts/page/misc/event-planner.js',
    '/scripts/page/misc/international-counter.js',
    '/scripts/page/misc/match-counter.js',
    '/scripts/page/misc/max-score.js',
    '/scripts/page/misc/revival-counter.js',
    '/scripts/page/misc/score-counter.js',
    '/scripts/page/misc/socials.js',
    '/scripts/page/misc/sponsor-counter.js',
    '/scripts/page/misc/team-profile.js',
    '/scripts/page/misc/top-partners.js',
    '/scripts/page/misc/verde.js'*/
    '/scripts/page/misc/2025-score-calculator.js',
    '/scripts/page/misc/test.js',
    '/scripts/page/about.js',
    '/scripts/page/bracket.js',
    '/scripts/page/cache.js',
    '/scripts/page/coach.js',
    '/scripts/page/config-debug.js',
    '/scripts/page/config-generator.js',
    '/scripts/page/custom-match.js',
    '/scripts/page/cycles.js',
    '/scripts/page/dashboard.js',
    '/scripts/page/edit-coach.js',
    '/scripts/page/edit-stats.js',
    '/scripts/page/event-generator.js',
    '/scripts/page/events.js',
    '/scripts/page/export.js',
    '/scripts/page/home.js',
    '/scripts/page/match-overview.js',
    '/scripts/page/matches.js',
    '/scripts/page/multipicklists.js',
    '/scripts/page/note-viewer.js',
    '/scripts/page/pits.js',
    '/scripts/page/pivot.js',
    '/scripts/page/plot.js',
    '/scripts/page/random.js',
    '/scripts/page/ranker.js',
    '/scripts/page/results.js',
    '/scripts/page/scatter.js',
    '/scripts/page/scout.js',
    '/scripts/page/settings.js',
    '/scripts/page/setup.js',
    '/scripts/page/storage.js',
    '/scripts/page/teams.js',
    '/scripts/page/users.js',
    '/scripts/page/whiteboard.js',
    '/scripts/config.js',
    '/scripts/data.js',
    '/scripts/elements.js',
    '/scripts/init.js',
    '/scripts/inputs.js',
    '/scripts/selection-pages.js',
    '/scripts/selection.js',
    '/scripts/utils.js',
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
    '/config/2025/analysis-config.json',
    '/config/2025/game-config.json',
    '/config/2025/scout-config.json',
    '/config/app-config.json',
    '/config/user-config.json',
    '/config/user-list.csv',
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

            // TODO: handle cache file somewhere else
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
