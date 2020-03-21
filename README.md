# LiamRank

## Intro
LiamRank is a FIRST Robotics Competition scouting app designed for the web. It is a spiritual successor to the WildRank Android App I helped develop when I was on FRC team 111 in high school. The idea of this app is not to host a webpage on a server and scout on remote clients at a competition but rather to run lightweight servers on the clients themselves so that the majority of the app is platform agnostic.

## Disconnected Nature
It should be noted that an internet connection is required to preload event data before scouting begins. In order to transfer data between clients without an internet connection, the app allows users to push results up to the either local or remote server. This can be acheived without a wireless connection by manual file transfer, temporary ethernet connections, or leaving the arena (during or after the event). QR codes were explored for transfering data, but it was found only 5-10 matches of data could be transferred at a time. While this would have been reasonable, if the limit was ever exceeded it would be very difficult to recover from.

## Data Aggregation and Analysis
Currently data is stored in JavaScript LocalStorage as JSON strings which are exported as JSON files via upload. Data is to be shared with a master client either via normal file transfer or upload via a LAN connection. All available pits/matches are displayed and individual results are compared with averages of all available results for the match, team, event, and scouter. Numeric results as compared with mean and non-numeric with mode. Team can also be ranked based on their cummulative stats. Again, for non-numeric results the mode is used, but numeric results can use Mean, Median, Mode, Minimum Value, or Maximum Value. Teams can also be ranked with multiple stat points either directly against one another or in combination for a proportion of the total.

## Workflow
### Index
The index of the app is more of a control panel not intended for everyday scouters to interact with. It allows a user to:
- Preload event data
- Enter a scouting mode (Pit, Match, Note)
- View local results
- Rank teams
- Create pick lists
- Prepare for matches on a whiteboard
- Upload results
- Import results (using post-server only)

### Scouting Modes
When entering a scouting mode pit, match, and note modes will present the user with a list of options to scout, team pits and matches respectively. In match scouting, a position would be assigned to automatically assign a user a team for each match. Once scouting has begun for the user they are presented with a set of "pages" of "columns" of "items" to enter observations with. These items consist of:
- Checkbox
- Counter
- Selection
- Dropdown
- String (one-line text)
- Number
- Text (multi-line)

and can be easily configured via a JSON file in /config.

## Environments
The page should work on most broswers but has not been extensively tested. These setups have tested with general success:
- Firefox Desktop (primary)
- Firefox Android
- Chromium Desktop
- Safari iPad (iOS 13)

These setups have been tested and do not work:
- Safari iPad (iOS 10)

## Execution
In general any web server should be able to host this app out of the box, but the upload feature requires some more complexity. A simple fork of the built-in Python webserver is included which allows a user to upload results back to the host but this requires a desktop platform or remote host at this time. It can be launched with `sudo python3 post-server.py`.