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

## Todo

- ~~User Permissions and Validation of command structure~~
- Integration with various APIs (Just need twitch, google calendar)
- ~~Clearly defined spam rules~~
- ~~Scheduling static commands to run on intervals~~
- ~~Punishment features~~
- Can always add more testing
