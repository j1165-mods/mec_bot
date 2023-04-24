require('dotenv').config();

const
    {Client, Events, GatewayIntentBits, Collection} = require('discord.js'),
    fs = require('node:fs'),
    {REST, Routes} = require('discord.js'),
    path = require('path'),
    command_dir = path.resolve(__dirname, '..', 'commands');

// VARIABLES
const
    token = process.env.TOKEN,
    id = process.env.ID,
    commands = [];

fs.readdirSync(`${command_dir}`).forEach(file => {
    if (!file.endsWith('.js')) return;
    console.log(`Loading command ${file}`)
    file = require(`${command_dir}/${file}`)
    commands.push(JSON.parse(JSON.stringify(file.data)))
    console.log(`Loaded command ${file.data.name}`)
});

const rest = new REST({version: '10'}).setToken(token);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // Fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationCommands(id),
            {body: commands},
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();
