// IMPORTS
require('dotenv').config();

// MODULES
const
    {Client, Events, GatewayIntentBits, PermissionsBitField, Collection} = require('discord.js'),
    fs = require('fs'),
    path = require('path'),
    util = require(`minecraft-server-util`);


// FILE CHECKS
if (!fs.existsSync(path.resolve(__dirname, '..', 'errors'))) fs.mkdirSync(path.resolve(__dirname, '..', 'errors'));
if (!fs.existsSync(path.resolve(__dirname, '..', 'data'))) fs.mkdirSync(path.resolve(__dirname, '..', 'data'));

if (!process.env.TOKEN) {
    console.error(`.env file not found, creating and initializing...`);

    const
        {writeFileSync} = require("fs"),
        path = require("path");

    // create at root
    writeFileSync(
        path.resolve(__dirname, '..', '.env'),
        `TOKEN="" 
ID=""`);

    console.error(`.env file created, please fill in the required information.`);
    process.exit(1);
}

// VARIABLES
const
    token = process.env.TOKEN,
    client = new Client({
        intents: Object.values(GatewayIntentBits).reduce((a, b) => a | b, 0),
    }),
    command_dir = path.resolve(__dirname, '..', 'commands'),
    host = "34.22.208.234",
    port = 25565,
    uptime_channel = "1098714437801742366",
    ping_channel = "1100168375935709315",
    players_channel = "1100169835956142160";

let
    total_ping = 0,
    ping_times = 0,
    ping_avg = 0,
    players = {},
    players_online = 0;

const {writeFileSync} = require("fs");

// FUNCTIONS
function log_error(error) {

    // Get time + date
    const
        time = `${new Date().getTime()}-${new Date().toLocaleString()}`,
        error_file = path.resolve(__dirname, '..', 'errors', `${time.replace(",", "").replace("/", "-").replace("/", "-")}.log`);

    // Create file
    fs.writeFileSync(error_file,
        `${time}
=====================   
${error}`);
}

async function load_commands() {

    client.commands = new Collection();
    const command_files = fs.readdirSync(command_dir).filter(file => file.endsWith('.js'));

    for (const file of command_files) {
        const command = require(`${command_dir}/${file}`);
        client.commands.set(command.data.name, command);
    }
}

// EVENTS
client.once(Events.ClientReady, () => {
    load_commands().then(r =>
        console.log(`Loaded ${client.commands.size} command(s)!`)
    );
});
client.on(Events.InteractionCreate, async interaction => {

    switch (interaction.type) {
        case 2:

            let pt_error;

            try {
                await client.commands.get(interaction.commandName).execute(interaction);
            } catch (error) {
                try {
                    console.error(error);
                    pt_error = "lol"

                    await interaction.reply({
                        content: 'There was an error while executing this command! This incident has been logged.',
                        ephemeral: true
                    });
                } catch (e) {
                    console.error(e);
                    pt_error = error;
                    await interaction.followUp({
                        content: 'There was an error while executing this command! This incident has been logged.',
                        ephemeral: true
                    })
                } finally {
                    const
                        time = new Date().getTime(),
                        error_file = path.resolve(__dirname, '..', 'errors', `${time}.log`);

                    log_error(pt_error);

                }
            }

            break;

        //button
        case 3:

            const
                button = interaction.customId.split(`-`),
                id = button[1],
                action = button[0];

            const
                suggestions = require(`../data/suggestions.json`),
                message_id = suggestions[id].msg,
                message = await interaction.channel.messages.fetch(message_id),
                has_upvoted = suggestions[id].votes.upvotes.includes(interaction.user.id),
                has_downvoted = suggestions[id].votes.downvotes.includes(interaction.user.id);

            let
                upvotes = suggestions[id].votes.upvotes.length,
                downvotes = suggestions[id].votes.downvotes.length,
                overall = upvotes - downvotes,
                upvotePercentage = Math.round(upvotes / (upvotes + downvotes) * 100),
                downvotePercentage = Math.round(downvotes / (upvotes + downvotes) * 100);

            if (action === `upvote`) {
                if (has_upvoted) {
                    suggestions[id].votes.upvotes = suggestions[id].votes.upvotes.filter(e => e !== interaction.user.id);
                    interaction.reply({content: `You have removed your upvote`, ephemeral: true})
                } else {
                    suggestions[id].votes.upvotes.push(interaction.user.id);
                    if (has_downvoted) suggestions[id].votes.downvotes = suggestions[id].votes.downvotes.filter(e => e !== interaction.user.id);
                    interaction.reply({content: `You have upvoted this suggestion`, ephemeral: true})
                }
            }

            if (action === `downvote`) {
                if (has_downvoted) {
                    suggestions[id].votes.downvotes = suggestions[id].votes.downvotes.filter(e => e !== interaction.user.id);
                    interaction.reply({content: `You have removed your downvote`, ephemeral: true})
                } else {
                    suggestions[id].votes.downvotes.push(interaction.user.id);
                    if (has_upvoted) suggestions[id].votes.upvotes = suggestions[id].votes.upvotes.filter(e => e !== interaction.user.id);
                    interaction.reply({content: `You have downvoted this suggestion`, ephemeral: true})
                }
            }

            upvotes = suggestions[id].votes.upvotes.length;
            downvotes = suggestions[id].votes.downvotes.length;
            overall = upvotes - downvotes;
            upvotePercentage = Math.round(upvotes / (upvotes + downvotes) * 100);
            downvotePercentage = Math.round(downvotes / (upvotes + downvotes) * 100);

            const embed = message.embeds[0];
            embed.fields[0].value = `${upvotes} (${upvotePercentage}%)`;
            embed.fields[1].value = `${downvotes} (${downvotePercentage}%)`;
            embed.fields[2].value = `${overall}`;
            message.edit({embeds: [embed]});

            fs.writeFileSync(`./data/suggestions.json`, JSON.stringify(suggestions, null, 4));

    }
})
client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;
});

// EVERY 60 SECONDS

setInterval(async () => {

    const status = await util.status(host, port)
        .catch(console.error);

    if (status) {

        const temp_avg = ping_avg;

        ping_times++;
        total_ping += status.roundTripLatency;
        ping_avg = total_ping / ping_times;

        client.channels.cache.get(ping_channel).setName(`PING: ${Math.round(ping_avg)}ms  (${Math.round(status.roundTripLatency)}ms now)`);
        if (ping_avg > temp_avg * 1.5) client.channels.cache.get(uptime_channel).send(`The server's average ping has increased from ${temp_avg} to ${ping_avg}ms (%${Math.round((ping_avg - temp_avg) / temp_avg * 100)}% increase)`);
        if (ping_avg < temp_avg * 0.5) client.channels.cache.get(uptime_channel).send(`The server's average ping has decreased from ${temp_avg} to ${ping_avg}ms (%${Math.round((temp_avg - ping_avg) / temp_avg * 100)}% decrease)`);

        if (status.players.online !== players_online) {
            const player_list = status.players.sample.map(player => `> ${player.name}`).join(', ');
            client.channels.cache.get(uptime_channel).send(`The server's player count has changed from ${players_online} to ${status.players.online} (${status.players.max} max)\n\n${player_list}`);
            players_online = status.players.online;
            client.channels.cache.get(players_channel).setName(`PLAYERS: ${players_online}/${status.players.max}`);

            if (status.players.online === 0) {
                client.channels.cache.get(uptime_channel).send(`The server is now empty`);
            }
        }
    }
}, 5000);


// LOGIN
    try {
        client.login(token).then(r => console.log('Logged in!'));
    } catch (e) {
        console.log('Failed to log in!')
        log_error(e);
    }

// ERROR HANDLING
    process.on('uncaughtException', function (error) {
        console.log(error.stack);
        log_error(error);
    });
