const moment = require('moment');
const formatDuration = require('../../chat-utils/format-duration');
const Command = require('../command-interface');
const CommandOutput = require('../command-output');

function patchnotes(input, services) {
    return services.GithubApi.getGuiReleaseInfo().then((data) => {
        const now = moment();
        const releaseVersion = data.name;
        const publishedAt = data.published_at;
        const releaseUrl = data.html_url;
        const publishedDuration = formatDuration(moment.duration(now.diff(publishedAt)));
        const reply = `Chat gui ${releaseVersion} released ${publishedDuration} ago. ${releaseUrl}`;
        return new CommandOutput(null, reply);
    });
}

module.exports = new Command(patchnotes, true, false, null);
