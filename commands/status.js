// MODULES
const
    {SlashCommandBuilder, EmbedBuilder} = require('discord.js'),
    util = require(`minecraft-server-util`);

const
    host = "34.22.208.234",
    port = 25565;

// MAIN
module.exports = {

    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Get the server status'),

    async execute(interaction) {

        const status = await util.status(host, port)
            .catch(console.error);

        console.log(status)

        if (!status) {
            interaction.reply({content: "The server is offline!", ephemeral: true});
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle("Server is online")
            .setColor("#00ff00")
            .setDescription(
                `**IP:** ${host}:${port}\n` +
                `**Version:** ${status.version.name}\n` +
                `**Ping:** ${status.roundTripLatency}ms\n` +
                `**Players:** ${status.players.online} / ${status.players.max}`
            )

        interaction.reply({embeds: [embed], ephemeral: false});
    }
}
