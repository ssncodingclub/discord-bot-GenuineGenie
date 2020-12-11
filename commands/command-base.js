const { prefix } = require('../config.json');

const validatePermissions = (permissions) => {
    const validPermissions = [
        'CREATE_INSTANT_INVITE',
        'KICK_MEMBERS',
        'BAN_MEMBERS',
        'ADMINISTRATOR',
        'MANAGE_CHANNELS',
        'MANAGE_GUILD',
        'ADD_REACTIONS',
        'VIEW_AUDIT_LOG',
        'PRIORITY_SPEAKER',
        'STREAM',
        'VIEW_CHANNEL',
        'SEND_MESSAGES',
        'SEND_TTS_MESSAGES',
        'MANAGE_MESSAGES',
        'EMBED_LINKS',
        'ATTACH_FILES',
        'READ_MESSAGE_HISTORY',
        'MENTION_EVERYONE',
        'USE_EXTERNAL_EMOJIS',
        'VIEW_GUILD_INSIGHTS',
        'CONNECT',
        'SPEAK',
        'MUTE_MEMBERS',
        'DEAFEN_MEMBERS',
        'MOVE_MEMBERS',
        'USE_VAD',
        'CHANGE_NICKNAME',
        'MANAGE_NICKNAMES',
        'MANAGE_ROLES',
        'MANAGE_WEBHOOKS',
        'MANAGE_EMOJIS',
    ];

    for (const permission of permissions) {
        if (!validPermissions.includes(permission)) {
            throw new Error(`unknown permsission node "${permission}"`);
        }
    }
};

const getTimespan = (date_now, date_future) => {
    // get total seconds between the times
    var delta = Math.abs(date_future - date_now) / 1000;

    // calculate (and subtract) whole days
    var days = Math.floor(delta / 86400);
    delta -= days * 86400;

    // calculate (and subtract) whole hours
    var hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;

    // calculate (and subtract) whole minutes
    var minutes = Math.floor(delta / 60) % 60;
    delta -= minutes * 60;

    // what's left is seconds
    return delta;
};

let recently = new Map(); //guild-userId-command-time

module.exports = (client, commandOptions) => {
    let {
        commands,
        expectedArgs = '',
        permissionError = 'You do not have permission to run this command.',
        minArgs = 0,
        maxArgs = null,
        cooldown = -1,
        repeats = 1,
        permissions = [],
        requiredRoles = [],
        callback,
    } = commandOptions;

    console.log(`Registering command "${commands[0]}"`);
    // Ensure the command and aliases are in an array
    if (typeof commands === 'string') {
        commands = [commands];
    }

    // Ensure the permissions are in an array and are all valid
    if (permissions.length) {
        if (typeof permissions === 'string') {
            permissions = [permissions];
        }
        validatePermissions(permissions);
    }

    client.on('message', (message) => {
        const { member, content, guild } = message;

        const currentDate = new Date();

        for (const alias of commands) {
            if (content.toLowerCase().startsWith(`${prefix} ${alias.toLowerCase()}`)) {
                // A command has to be run

                // Ensure the user has the required permissions
                for (const permission of permissions) {
                    if (!member.hasPermission(permission)) {
                        message.reply(permissionError);
                        return;
                    }
                }

                // Enusre the user has the required roles
                for (const requiredRole of requiredRoles) {
                    const role = guild.rold.cache.find((role) => role.name === requiredRole);

                    if (!role || !member.roles.cache.has(role.id)) {
                        message.reply(`You must have the "${requiredRole}" role to use this command.`);
                        return;
                    }
                }

                // Ensure that the user has not run the command very frequently
                let cooldownString = `${guild.id}-${member.id}-${commands}`;
                if (cooldown > 0 && recently.has(cooldownString)) {
                    const parsedArray = recently.get(cooldownString).split(' ');
                    const [currentrepeats, oldTime] = parsedArray;
                    console.log(currentrepeats, oldTime);
                    if (currentrepeats <= 0) {
                        const timeElapsed = getTimespan(currentDate.getTime(), Number(oldTime));
                        const waitingTime = cooldown - timeElapsed;

                        message.reply(`You can use this command in \`${+waitingTime.toFixed(2)} secs\`. Please wait!`);
                        return;
                    }
                }

                // Split on any number of spaces
                const arguments = content.split(/[ ]+/);
                // Remove the command which is the first index
                arguments.shift();
                arguments.shift();

                // Ensure we have the correct number of arguments
                if (arguments.length < minArgs || (maxArgs !== null && arguments.length > maxArgs)) {
                    message.reply(`Incorrect syntax! use ${prefix} ${alias} ${expectedArgs}`);
                    return;
                }

                if (cooldown > 0) {
                    if (recently.has(cooldownString)) {
                        const parsedArray = recently.get(cooldownString).split(' ');
                        const [currentrepeats, ...others] = parsedArray;
                        recently.set(cooldownString, `${currentrepeats - 1} ${currentDate.getTime()}`);

                        if (currentrepeats <= 1) {
                            setTimeout(() => {
                                recently.delete(cooldownString);
                            }, 1000 * cooldown);
                        }
                    } else {
                        if (repeats === 1) {
                            recently.set(cooldownString, `${repeats - 1} ${currentDate.getTime()}`);
                            setTimeout(() => {
                                recently.delete(cooldownString);
                            }, 1000 * cooldown);
                        } else {
                            recently.set(cooldownString, `${repeats - 1} ${currentDate.getTime()}`);
                        }
                    }
                }

                // Handle the custom command code
                callback(message, arguments, arguments.join(' '), client);

                // commands issued ++
                //incCommandsIssued(dbclient, message, arguments, arguments.join(' '));

                return;
            }
        }
    });
};
