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

In order to get up and running, create a config file from the sample with

```bash
cp lib/configuration/sample.config.json lib/configuration/prod.config.json
```

and start the mock chat and chat bot with

```bash
npm run start:dev
```

The mock chat is a very basic web socket server on localhost:8420.

After running the `start:dev` script, an HTML file will open in your default web browser to serve as a tiny chat page with connected to the tiny chat server that you can use to test commands.

> Note that Chromium-based web browsers block insecure WebSocket connections to `localhost`, so you'll have to use a different web browser, such as Firefox, to circumvent.

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

(Note on adding commands/scheduled commands for admins, when you add the commands to twitch/dgg, you need to !restart the bot in the other chat to pick these changes up. This will change with a future update.)

| Command                                        | Input                                   | What it does                                                                                                                                          | Requires Admin | Example                                                                 |
| ---------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------- |
| !restart                                       | None                                    | Restarts the dgg or Twitch.tv bot. Don't overuse the command, it resets caches.                                                                       | Yes            | !restart                                                                |
| !stalk                                         | {user} (postnumber)                     | Overrustle logs posts                                                                                                                                 | Yes            | !stalk Destiny 5                                                        |
| !time                                          | None                                    | Current Steven Time                                                                                                                                   | No             | !time                                                                   |
| !schedule !sch                                 | None                                    | Show next upcoming scheduled event, and a link to the schedule calendar.                                                                              | No             | !schedule                                                               |
| !addcommand !ac                                | {command} {text}                        | Adds a static command that can be called by anyone. `{%n%}` can be used in text to get arguments.                                                     | Yes            | !addcommand !hello HEY HOWDY THERE PAL HOW YOU DOIN {%1%}               |
| !deletecommand !delcommand !removecommand !dc  | {commandToDelete}                       | Deletes a static command                                                                                                                              | Yes            | !deleteCommand !hello                                                   |
| !listcommands !lc                              | None                                    | Lists all static database stored commands                                                                                                             | Yes            | !listcommands                                                           |
| !listscheduled !lsc                            | None                                    | Lists all currently scheduled commands. Youtube and Calendar are always scheduled.                                                                    | Yes            | !lsc                                                                    |
| !mute !mu                                      | (duration) {user}                       | Mutes a user                                                                                                                                          | Yes            | !mute 10m MrMouton                                                      |
| !unmute !um !unm                               | {user}                                  | Unmutes a user                                                                                                                                        | Yes            | !unmute MrMouton                                                        |
| !ban or !ipban (alias !ip)                     | (duration) {user} (reason)              | Bans a user                                                                                                                                           | Yes            | !ban 1024h JAYL For being too cute                                      |
| !voteban !voteipban                            | (duration) {user} (reason)              | Starts a poll in DGG chat, if there's a majority yes the user is banned.                                                                              | Yes            | !voteban 1024h JAYL being too cute                                      |
| !svoteban !svoteipban                          | (duration) {user} (reason)              | SUB WEIGHTED - Same as voteban, but subs votes count for more, increasing with sub tier.                                                              | Yes            | !voteban 1024h JAYL being too cute                                      |
| !unban                                         | {user}                                  | Unbans a user                                                                                                                                         | Yes            | !unban JAYL                                                             |
| !nuke                                          | (duration) {phrase or regex}            | Mutes anyone using the nuked phrase for 10m by default.                                                                                               | Yes            | !nuke 30m KING MOUTON !nuke 30d /[A-Z]+\s?420/                          |
| !meganuke                                      | (duration) {phrase or regex}            | IPBans anyone using the nuked phrase for 10m by default.                                                                                              | Yes            | !nuke 30m KING MOUTON !nuke 30d /[A-Z]+\s?420/                          |
| !aegis                                         | None                                    | Removes any nukes that have been fired in the last 10 minutes and unmutes all users muted                                                             | Yes            | !aegis                                                                  |
| !aegisSingle !an !unnuke !as                   | (nukePhrase)                            | Removes single a Nuke by the phrase that was nuked                                                                                                    | Yes            | !as KING MOUTON                                                         |
| !love                                          | None                                    | Gives you love                                                                                                                                        | No             | !love Linusred                                                          |
| !addschcmd !asc                                | (commandToAdd)                          | Schedules a static command to be sent from the bot every few minutes.                                                                                 | Yes            | !asc !hello                                                             |
| !deleteschcmd !dsc !unschedule                 | (commandToDelete)                       | Deletes a scheduled command so its not longer sent.                                                                                                   | Yes            | !dsc !hello                                                             |
| !song                                          | None                                    | Current song being played on Last.fm                                                                                                                  | No             | !song                                                                   |
| !lastsong !pastsong !previoussong !earlierSong | None                                    | Previous song before the current one being played on last.fm                                                                                          | No             | !lastsong                                                               |
| !youtube !yt !lastvideo                        | None                                    | Last video posted on Destiny's youtube channel                                                                                                        | No             | !yt                                                                     |
| !addban !addmute                               | (duration) {banned phrase}              | Adds a banned phrase that will auto mute/ban upon a user posting it.                                                                                  | Yes            | !addban 10d HAHA GNOMED !addmute /\bwee(woo)?\b/                        |
| !mutelinks !mutelink !linksmute !linkmute      | {on,off,all,repeat(ed)} (duration)      | auto mute linkers. `on` only mutes links that mention the command sender. `all` mutes all links. `repeat` mutes users who post recently posted links. | yes            | !mutelinks on !mutelinks on 10m !mutelinks all 10m !mutelinks repeat 5m |
| !breakingnews !breaking !bn                    | {on,off,all} (max link age)             | Breaking news mode. `on` only mutes old links (5m by default) that mention the command sender. `all` mutes all old links.                             | Yes            | !breakingnews on 5m                                                     |
| !deleteban !dban !deletemute !mute             | {banned phrase}                         | Removes a banned or muted phrase. Works for both.                                                                                                     | Yes            | !deleteban HAHA GNOMED                                                  |
| !live                                          | None                                    | Reports the last time a stream was live, or how long the stream has been going.                                                                       | No             | !live                                                                   |
| !ud !updateduo !duoupdate                      | Any text                                | Updates the !duo command with whatever text you type.                                                                                                 | Yes            | !ud Lilypichu AYAYA                                                     |
| !duo                                           | None                                    | Outputs whatever is current stored using !ud                                                                                                          | No             | !duo                                                                    |
| !deaths !death !died                           | None                                    | Outputs the current death counter                                                                                                                     | No             | !death !died                                                            |
| !incdeaths !ideaths !incd !id                  | None                                    | Adds 1 to the current death counter. Can only be updated once every 15 seconds to prevent 2 people updating                                           | Yes            | !id !ideaths !incd                                                      |
| !setdeaths !setd !sdeaths                      | (number to set deaths to)               | Sets the death counter to the value specified                                                                                                         | Yes            | !setd 50 !sdeaths 100                                                   |
| !gulag                                         | (duration) {user1} (user2) ... (user n) | Voteban between all included users. `random` as a username will select a recent random chatter.                                                       | Yes            | !gulag 30m derDeidra Dan                                                |

## Todo

- Can always add more testing
