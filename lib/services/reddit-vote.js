const childProcess = require('child_process');
const util = require('util');
const readFile = util.promisify(require('fs').readFile);
const writeFile = util.promisify(require('fs').writeFile);

function writeJsonToFile(path, jsonToWrite, logger) {
  const fileContent = JSON.stringify(jsonToWrite);
  return writeFile(path, fileContent, 'utf8')
    .then(() => true)
    .catch((err) => {
      logger.error(`Error while writing reddit file. Path: ${path} Err: ${err}`);
      return new Error('did not write');
    });
}

class RedditVote {
  constructor(config, logger) {
    // config properties
    this.scriptPath = config.scriptPath;
    this.threadFilePath = config.threadFilePath || `${__dirname}/../configuration/thread-content.json`;
    this.stateStoreFilePath = config.stateStoreFilePath || `${__dirname}/../configuration/thread-state.json`;
    this.logger = logger;
    // state properties
    this.childProcess = null;
    this.threadId = null;
    this.threadTier = null;
    this.isShuttingDown = false;
    if (config.enabled) {
      return this.startUp();
    }
  }

  startUp() {
    return this.readThreadStateStore()
      .then((fileContent) => {
        if (fileContent === false) {
          return this.writeThreadStateStore(false)
            .then(() => this.startUp())
            .catch(() => {
              this.logger('Tried to start up reddit thread service, but a failure happened reading the startup state and so its it a bad state.');
              return false;
            });
        }
        const fileState = JSON.parse(fileContent);
        if (fileState.running === true) {
          this.threadTier = fileState.minTier;
          this.threadId = fileState.threadId;
          return this.newThread();
        }
        return true;
      });
  }

  async startNewThread(title, body, minTier) {
    const didWrite = await this.writeThreadContents(title, body).catch(() => {
      this.logger.err('Thread did not start. oof.');
      return false;
    });
    if (didWrite === true) {
      if (this.threadId !== null) {
        this.stopProcess();
        this.threadId = null;
      }
      this.threadTier = minTier;
      const didProcessStart = await this.newThread();
      if (didProcessStart !== false) {
        return true;
      }
    }
    return false;
  }

  writeThreadContents(title, body) {
    return writeJsonToFile(this.threadFilePath, { title, body }, this.logger);
  }

  writeThreadStateStore(running, minTier, threadId) {
    return writeJsonToFile(this.stateStoreFilePath, { running, minTier, threadId }, this.logger);
  }

  readThreadStateStore() {
    return readFile(this.stateStoreFilePath, 'utf8')
      .then(content => content)
      .catch((err) => {
        this.logger.error(`Error while reading state file. Path: ${this.stateStoreFilePath} Err: ${err}`);
        return false;
      });
  }

  newThread() {
    return new Promise((accept) => {
      let threadHasBeenSet = false;
      if (this.threadId === null) {
        // the args passed are safely escaped by the spawn method.
        this.childProcess = childProcess.spawn('python3', [
          this.scriptPath, '--thread-contents', this.threadFilePath,
          '--min-tier', this.threadTier,
        ]);
      } else {
        this.childProcess = childProcess.spawn('python3',
          [
            this.scriptPath, '--thread-id',
            this.threadId, '--min-tier', this.threadTier,
          ]);
      }

      this.childProcess.on('error', (err) => {
        this.logger.error(`Error from python script: ${err}`);
      });

      this.childProcess.stdout.on('data', (data) => {
        this.logger.info(`Reddit Script stdout: ${data.toString()}`);
        if (threadHasBeenSet === false) {
          this.threadId = data.toString('utf8').replace('\n', '');
          this.writeThreadStateStore(true, this.threadTier, this.threadId)
            .then(() => {
              this.logger.info('Thread state written to file.');
              this.logger.info(`Question submission script now running with thread id: ${this.threadId}`);
            }).catch(() => {
              this.logger.error('Did not write thread state. oof ouch why.');
            });
          threadHasBeenSet = true;
        }
        accept(true);
      });

      this.childProcess.stderr.on('data', (data) => {
        this.logger.error(`stderr from python script: ${data.toString('utf8')}`);
      });

      this.childProcess.on('close', () => {
        if (threadHasBeenSet === false) {
          accept(false);
        }
        if (this.isShuttingDown === false) {
          this.startUp().then();
        } else {
          this.isShuttingDown = false;
        }
        this.logger.warn('Reddit submission sub-process closed.');
      });
    });
  }

  stopProcess() {
    this.isShuttingDown = true;
    this.childProcess.kill();
    return this.writeThreadStateStore(false)
      .then(() => 'Question submission is now closed! FeelsAmazingMan ')
      .catch(() => 'Something broke. Contact Linus. It is probably fucked now.');
  }

  threadOutput() {
    if (this.threadId !== null) {
      return `Current Sub Tier Allowed to Submit Questions: ${this.threadTier === '0' ? 'plebs' : this.threadTier} 
       Submit questions as your message here: https://www.reddit.com/message/compose/?subject=Q:${this.threadId}&to=DestinyBot
       Note that to submit a question you must have your DGG account linked to your reddit account. 
       You can do so here: https://www.destiny.gg/profile/authentication
       Upvote questions here: https://www.reddit.com/r/destiny/comments/${this.threadId}
      `;
    }
    return 'No reddit question submissions running at the moment.';
  }
}

module.exports = RedditVote;
