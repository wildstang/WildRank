# LiamRank

## Intro
LiamRank is a FIRST Robotics Competition scouting web app and a spiritual successor to the [WildRank Android](https://github.com/wildstang/wildrank-android) platform I helped develop while a part of FRC team 111 in high school. Despite being a web app, the goal of LiamRank is not to host a webpage on a remote server while scouting on clients, but rather to run generic lightweight servers on each of the clients themselves so that the majority of the app is platform agnostic.


## Disconnected Nature

### Web Servers
Before moving on it is important to understand the application's relationship with web servers. In order to be both flexible and offline, the application was designed so only a generic web server is needed to use most features. A few features do require a custom web server. These features are uploading and importing results directly from either a local or remote web server. Only a single "central server" needs to be using a custom web server to use these features, but if manual file transfer is desired to avoid a wireless connection, all clients must be running this web server. Further discussion of configurations can be found in the [Synchronization Concepts](#synchronization-concepts) section.

There are a variety of provided custom web servers to enable this functionality. The primary server is a custom implementation of the [Python 3 HTTP Server](https://docs.python.org/3/library/http.server.html). This server will always be up to date with the latest version of the application and can be run with `python3 python/post-server.py`. Out of pure lockdown induced bordem I ported the web server to Rust. It is available in the `rust-webserver` directory, can be built using `cargo build --release`, and run using `rust-webserver/target/release/liamrank-webserver`. This version should give improved performance, but is not as rigorously tested. Of course there are mobile clients are well. Both [LiamRank Android](https://github.com/mail929/liamrank-android) and [LiamRank iOS](https://github.com/mail929/liamrank-ios) run their own custom web server and webviews for their respective mobile operating systems. The Android version is available on the [Play Store](https://play.google.com/store/apps/details?id=net.fruzyna.liamrank.android), but the iOS version will need to be built with Xcode.

### Internet
An internet connection is required to preload event data before scouting begins, but this can be performed without an external server. Once all teams and matches are downloaded from TBA, an internet connection is no longer required and won't be until the next event for most features. Ranking data is also fetched but is obviously not complete before an event. Features using ranking data as well as actual match times are not intended to be used by regular scouters but by strategy leads who may be operating with more flexibility for finding an internet connection.

### Data Storage
Data is stored in JavaScript localStorage as JSON strings. Results may be exported as either individual JSON files or a bulk CSV.

### Image Storage
Pit scouting mode allows a scouter to capture a single image of each robot. Due to limits on localStorage space images stored on the device are limited to 360p (note: this is still likely too big and may have to be reduced later). However, full resolution images are uploaded to a custom server if in use. Images from localStorage can also be backed up to a custom web server later with the normal pit upload results functionality. Warning: pit uploads will overwrite high resolution automatic uploads. Note: image capture is not available on the iOS app due to limitations of WebRTC on WKWebView.


## Data Transfer Functions
Liam Rank provides multiple functions for exporting data from the application.

### Upload/Import
JSON result data and robot images stored in the browser's LocalStorage can be uploaded to a given server, where the address is entered in the "Upload URL" field. When received by the server content is stored in the `/uploads` directory. Once available to the server and client can import these results using the address from the same "Upload URL" field. Some browsers limit what addresses a website can interact with so cross-server data transfer may have limited results.

### Export
The export results functionality exports JSON result data stored in the browser's LocalStorage to a combined CSV file. This file is downloaded and can be run through the provided `python/csv2xls.py` to combine with other exports.


## Synchronization Concepts
Depending on your desired frequency of synchronization and abidance to the rules (I do not condone breaking of any FIRST rules nor intend to provide any interpretation of said rules), there are many ways to transfer data between clients. These concepts are listed below...

### Central Server
A single client can act as a central server and receive results uploaded from other clients. This requires only the central server to use a custom web server, but limits only custom web server clients to perform complete data analysis. The central server (or potentially other custom web server clients) would then occasionally import these results to read them from file into their LocalStorage. This concept requires some kind of temporary network connection. One option is passing around an Ethernet cable with an appropriate adapter for the devices in use.

### Mesh
If every client runs a custom server, the clients can on their own upload their results to the local server, then when ready the remote server could import results from each client. This concept allows either networked or physical file transfer. It is not ideal for a networked connection as it requires a lot of user input and remote importing is not supported on all web browsers.

### External File Transfer
If all clients are using a custom web server, they can each upload results to their local server, leaving JSON files in `/uploads`. These files may then be transferred by any means, including flash drives, network storage, email, etc. This process is not as seemless as the above system, but can allow rapid synchronization without any or an indirect network connection.

### Data Export (In Progress)
If no clients run a custom web server, results can be exported in bulk to a CSV file which then is downloaded and may be transferred by any means. A basic Python script, `python/csv2xls.py` can combine these CSV files into an Excel Spreadsheet. This again is not the most seamless method, but does not require any custom web servers. It does, however, require any analysis to be done in Excel, but this may be seen as an advantage for some users.

### QR Codes (Abandoned)
QR codes were originally planned to be used to transfer results between clients. While this would allow for smooth, network-free, wireless data transfer, I found the size of the QR code to be extremely limiting (5-10 matches). Plus, not every device has a camera. 


## Workflow
### Index
The index (or homepage) of the app is more of a control panel, not intended for everyday scouters to interact with. It provides access to pages allowing users to:
- Enter a scouting mode (Pit, Match, Note)
- Rank teams by results
- Compare teams side-by-side
- Create pick lists
- Prepare for matches on a whiteboard
- View results
- View summaries of teams, matches, or users

and functions allowing users to:
- Preload event data from TBA
- Upload results to a custom web server
- Import results from JSON (custom web server only)
- Export results to CSV
- Reset all app data

It also allows control of the:
- Event
- Scouting position
- Scouting mode
- Upload server
- User ID

Only scouting may be accessed by non-admin users.

### Scouting Modes
When entering a scouting mode pit, match, and note modes will present the user with a list of options to scout, team pits and matches respectively. In match scouting, the position determines which team to assign a user for each match. Once scouting has begun, the user is presented with a set of "pages" of "columns" of "items" to enter observations with. These items consist of:
- Checkbox
- Counter
- Selection
- Dropdown
- String (one-line text)
- Number
- Text (multi-line)

and can be easily configured via a JSON file in `/config`.


## Configuration
The `/assets` directory contains all necessary configuration files and assets and shouldn't need any changes for basic operation. However, if not using a custom web server this directory will have to be changes to `/config` and there is no promise of updates for future competitions.

### config.json
The main configuration file. It supports configuration of general settings, default values, admins, theme, and the whiteboard. Whiteboard configuration allows for easy updating for new games by adding a new entry to the "whiteboard" list with the desired year.

#### Settings
| Category   | Setting     | Description |
| ---------- | ----------- | ----------- |
| settings   |             | Object, contains global app settings |
| settings   | title       | String, name of app displayed in title and header |
| settings   | time_format | Integer, 12 or 24, format to use when displaying times |
| settings   | use_images  | Boolean, whether to display images across the app |
| defaults   |             | Object, contains app defaults |
| defaults   | event_id    | String, default selected event id |
| defaults   | upload_url  | String, default selected upload url |
| defaults   | user_id     | Integer, default selected user id |
| whiteboard |             | List of objects, contains whiteboard configuration objects |
| admins     |             | List of integers, user ids with administrator privileges |
| theme      |             | Object, values to use for various css variables in light theme |
| dark-theme |             | Object, values to use for various css variables in dark theme |

### scout-config.json
Allows configuration of the inputs of each of the scouting mode. The configuration file is organized as a JSON object containing lists with an object for each mode, containing its pages, columns, and inputs for each year.

#### Mode Object
```
"name":    "Mode Name",
"id":      "mode_id",
"pages":   []
```

#### Page Object
```
"name":    "Page Name",
"short":   "Page",
"id":      "page_id",
"columns": []
```

#### Column Object
```
"name":    "Column Name",
"id":      "column_id",
"inputs":  []
```

#### Input Object
```
"name":    "Input Name",
"id":      "input_id",
"type":    "input_type",   # checkbox, dropdown, select, string, number, text, counter
"options": [],             # Only required for dropdowns and selects, [min, max] for number
"default": "Default Value"
```

#### dozer.png
The default robot image, used if TBA does not provide an image for a team. This image can be replaced if you hate dozer.
![#bringBackDozer](/assets/dozer.png)

#### field-XXXX.png
The image to use for the background of the whiteboard, where XXXX is the year of the event. 3000x1600 is the recomended resolution.
![The 2020 (and now 2021) "Infinite Recharge" field](/assets/field-2020.png)

#### menu-white-18dp.svg
"Hamburger Menu" icon, used to open and close the list on selection pages.
![Hamburger Menu icon](/assets/menu-white-18dp.svg)


## Environments
The application should work on most up-to-date broswers but has not been extensively tested on all.


## Execution
In general any web server should be able to host this app out of the box, but some features requires some more complexity. A simple implementation of the built-in Python web server is included which allows a user to upload results back to the host but this requires a desktop platform or remote host at this time. It can be launched with `sudo python3 post-server.py`. To use a different web server, use this repository as the root of the server's assets. In order to fetch match data a new "Read API Key" must be obtained from [The Blue Alliance](https://www.thebluealliance.com/account) and placed in keys.js. There is also an included Dockerfile and docker-compose. A simple `docker-compose up -d` in `/docker` can start an instance of the Python web server.
