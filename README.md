# LiamRank

## Intro
LiamRank is a FIRST Robotics Competition scouting app designed for the web. It is a spiritual successor to the WildRank Android App I helped develop when I was on FRC team 111 in high school. The idea of this app is not to host a webpage on a server and scout on remote clients at a competition but rather to run lightweight servers on the clients themselves so that the majority of the app is platform agnostic.

## Disconnected Nature
It should be noted that an internet connection is required to preload event data before scouting begins. In order to transfer data between clients without an internet connection, the app allows users to push results up to the local server for normal file transfer or to allow other clients to quickly capture results by exporting them to a QR code. I'm planning to add an option to upload to a remote server if the user is able to obtain an internet connection even temporarily but for now it assumes localhost.

## Data Aggregation and Analysis
At the moment, result aggregation and analysis is the most lacking portion of the app. The most likely application of these tasks will be via another desktop app of sorts which will rely more on a desktop-strict platform than the scouting app. Currently data is stored in JavaScript LocalStorage as JSON strings which are exported as JSON files via upload or CSV strings via QR code. The most likely scenario for the desktop application is a Python script or notebook that could ingest one or both of these formats and produce some kind of analysis. Ideally, this condensed and analyzed data could be returned to the web app for easier in-the-field analysis.

## Workflow
### Index
The index of the app is more of a control panel not intended for everyday scouters to interact with. It allows a user to:
- Preload event data
- Enter a scouting mode
- View local results (very rudimentary)
- Upload results
- Produce a QR code from results

### Scouting Modes
When entering a scouting mode both pit and match modes will present the user with a list of options to scout, team pits and matches respectively. In match scouting, a position would be assigned when entering scouting to automatically assign a user a team for each match. Once scouting has begun for the user the are presented with a set of "pages" of "columns" of "items" to enter observations with. These items consist of:
- Checkbox
- Counter
- Selection
- Dropdown
- String (one-line text)
- Number
- Text (multi-line)
and can be easily configured via a JSON file in /config.

## Environments
I have been primarily testing this app on Firefox for desktop but have also tried it on Firefox for Android and Chromium for desktop with general success. The scripts and styles are relatively basic so I don't see why it wouldn't work on most platforms, but extensive testing will be needed. I have also tried it on an iPad running iOS 10.3 (last version it received RIP) and had very little success there. I'm hoping Apple has improved the browser in later versions. I have been unable to try other browsers due to its aging OS, but from my understanding they all use Safari's engine.

## Execution
In general any web server should be able to host this app out of the box, but the upload feature requires some more complexity. A simple fork of the built-in Python webserver is included which allows a user to upload results back to the host but this requires a desktop platform or remote host at this time.