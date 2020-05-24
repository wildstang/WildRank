# LiamRank

## Intro
LiamRank is a FIRST Robotics Competition scouting web app and a spiritual successor to the [WildRank Android](https://github.com/wildstang/wildrank-android) platform I helped develop while I was a part of FRC team 111 in high school. Despite being a web app, the goal is not to host a webpage on a remote server while scouting on clients at a competition but rather to run generic lightweight servers on each of the clients themselves so that the majority of the app is platform agnostic.

## Disconnected Nature

### Python Web Server
Before moving on it is important to understand that this application includes a custom implementation of the [Python 3 HTTP Server](https://docs.python.org/3/library/http.server.html). While this server does not absolutely need to be used, it does significantly improve the quality of life. It enables "uploading" results to local or remote clients and importing these results from file. Only a single "central server" needs to be using this web server to use these features, but if manual file transfer is desired to avoid a wireless connection, all clients must be running this web server.

### Internet
An internet connection is required to preload event data before scouting begins, but this can be performed without an external server. Once all teams and matches are downloaded from TBA, an internet connection is no longer required and won't be until the next event.

### Data Storage
Data is stored in JavaScript LocalStorage as JSON strings. Results may be exported as either individual JSON files or a bulk CSV.

## Synchronization Concepts
Depending on your desired frequency of synchronization and abidance to the rules (I do not condone breaking of any FIRST rules nor intend to provide any interpretation of said rules), there are many ways to transfer data between clients. These concepts are listed below...

### Central Server
A single client can act as a central server and receive results uploaded from other clients. This requires only the central server to use the Python web server, but limits only Python web server clients to data analysis. The central server would then occasionally import these results to read them from file.

### External Transfer
If all clients are using the Python web server, they can each upload results to themselves, leaving JSON files in /uploads. These files may then be transferred by any means, including flash drives, network storage, email, etc. This process is not as seemless as the above system, but can allow rapid synchronization without a continuous network connection.

### Data Export (In Progress)
If no clients run the Python web server, results can be exported in bulk to a CSV file which then is downloaded and may be transferred by any means. Work is curently in progress to then intelligently combine these CSV files into an Excel Spreadsheet. This again is not the most seamless method, but does not require any Python web servers. It does, however, require any analysis to be done in Excel, but this may be seen as an advantage for some users.

### QR Codes (Abandoned)
QR codes were originally planned to be used to transfer results between clients. While this would allow for smooth, network-free, wireless data transfer, I found the size of the QR code to be extremely limiting (5-10 matches). Plus, not every device has a camera. 

## Workflow
### Index
The index (or homepage) of the app is more of a control panel, not intended for everyday scouters to interact with. It provides access to pages allowing users to:
- Enter a scouting mode (Pit, Match, Note)
- View local results
- Rank teams
- Compare teams side-by-side
- Create pick lists
- Prepare for matches on a whiteboard

and functions allowing users to:
- Preload event data from TBA
- Upload results to a Python web server
- Import results from JSON (Python web server only)
- Export results to CSV

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

and can be easily configured via a JSON file in /config.

## Configuration
The /config directory contains all necessary configuration files.

## Environments
The application should work on most broswers but has not been extensively tested on all. These setups have tested with general success:
- Firefox Desktop (primary)
- Firefox Android
- Chromium Desktop
- Safari iPad (iOS 13)

These setups have been tested and do not work:
- Safari iPad (iOS 10)

## Execution
In general any web server should be able to host this app out of the box, but some features requires some more complexity. A simple implementation of the built-in Python webserver is included which allows a user to upload results back to the host but this requires a desktop platform or remote host at this time. It can be launched with `sudo python3 post-server.py`. To use a different web server, use this repository as the root of the server's assets.