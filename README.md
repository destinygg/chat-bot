# Destiny.gg Chat Bot

## Runnin' it

You'll need a configuration file, there's a sample configuration under ./configuration, rename this to prod.config.json
and enter in your own keys to hit the APIs. Documentation on configuration coming eventually. 

You shouldn't need api keys for most commands, but you will definitely need them to run the bot against twitch.

See below for local development of the bot.

```
npm install
npm start
```

## Contribution And Development

Contribution is welcome, but please get in contact with me before you start contributing to make sure we're not stepping on each others toes
or you're not doing something that the bot shouldn't be doing. 

In order to get up and running, the easiest way is to cd on into the /.tools directory and run
```bash
node index.js
```
This will open up a very basic web socket server on localhost:8420. Set your dgg config url to ws://localhost:8420 and you should connect right up.

If you open the html file within the same directory in a browser, it serves as a tiny chat page with connected to the tiny chat server that you can use to test commands.

More to come once the bot is, you know, actually live and not in a constant state of rapid development.

## Command References
The below table is the standard list of non static commands.

{} = required parameter


() = optional parameter

All commands are case insentivie.

Durations are in the format of the number, followed by h,m,s or d.

10m

20h

500d



| Command                                        | Input                        | What it does                                                                            | Requires Admin | Example                                             |
|------------------------------------------------|------------------------------|-----------------------------------------------------------------------------------------|----------------|-----------------------------------------------------|
| !stalk                                         | {user} (postnumber)          | Overrustle logs posts                                                                   | Yes            | !stalk Destiny 5                                    |
| !time                                          | None                         | Current Steven Time                                                                     | No             | !time                                               |
| !addcommand                                    | {command} {text}             | Adds a static command that can be called by anyone.                                     | Yes            | !addcommand !hello HEY HOWDY THERE PAL HOW YOU DOIN |
| !deletecommand                                 | {commandToDelete}            | Deletes a static command                                                                | Yes            | !deleteCommand !hello                               |
| !listcommands                                  | None                         | Lists all static database stored commands                                               | Yes            | !listcommands                                       |
| !mute                                          | (duration) {user}            | Mutes a user                                                                            | Yes            | !mute 10m MrMouton                                  |
| !unmute                                        | {user}                       | Unmutes a user                                                                          | Yes            | !unmute MrMouton                                    |
| !ban or !ipban                                 | (duration) {user} (reason)   | Bans a user                                                                             | Yes            | !ban 1024h JAYL For being too cute                  |
| !unban                                         | {user}                       | Unbans a user                                                                           | Yes            | !unban JAYL                                         |
| !nuke                                          | (duration) {phrase or regex} | The total users nuked.                                                                  | Yes            | !nuke 30m KING MOUTON !nuke 30d /[A-Z]+\s?420/      |
| !aegis                                         | None                         | Undoes the last nuke                                                                    | Yes            | !aegis                                              |
| !love                                          | None                         | Gives you love                                                                         | No             | !love Linusred                                      |
| !addschcmd !asc                                | (commandToAdd)               | Schedules a static command to be sent from the bot every few minutes.                   | Yes            | !asc !hello                                         |
| !deleteschcmd !dsc                             | (commandToDelete)            | Deletes a scheduled command so its not longer sent.                                     | Yes            | !dsc !hello                                         |
| !song                                          | None                         | Current song being played on Last.fm                                                    | No             | !song                                               |
| !lastsong !pastsong !previoussong !earlierSong | None                         | Previous song before the current one being played on last.fm                            | No             | !lastsong                                           |
| !youtube !yt !lastvideo                        | None                         | Last video posted on Destiny's youtube channel                                          | No             | !yt                                                 |
| !addban !addmute                               | (duration) {banned phrase}   | Adds a banned phrase that will auto mute/ban upon a user posting it.                    | Yes            | !addban 10d HAHA GNOMED                             |
| !deleteban                                     | {banned phrase}              | Removes a banned phrase                                                                 | Yes            | !deleteban HAHA GNOMED                              |
| !live                                          | None                         | Reports the last time a stream was live, or how long the stream has been going. | No             | !live                                               |
|                                                |                              |                                                                                         |                |                                                     |




## Todo
- Can always add more testing
