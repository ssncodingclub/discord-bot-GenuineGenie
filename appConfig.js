const dotenv = require('dotenv');
dotenv.config();

const config = {};

config.guildId = process.env.GUILD_ID;
config.anonymousChannelId = process.env.ANONYMOUS_CHANNEL_ID;
config.mongoURL = process.env.MONGO_URL;
config.token = process.env.TOKEN;
config.enableLocalTesting = process.env.ENABLE_LOCAL_TESTING;
config.dummy = 'dumy';
module.exports = config;

//hello
