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
        .setName(`player-list`)
        .setDescription(`Get the player list`),

    async execute(interaction) {

        const status = await util.status(host, port)
            .catch(console.error);

        if (!status) {
            interaction.reply({content: "The server is offline!", ephemeral: true});
            return;
        }

        const
            players = status.players.sample, // This is an object
            embed = new EmbedBuilder()
                .setTitle("Player list")
                .setColor(`#00ff00`)
                .setDescription(
                    `**Players:** ${status.players.online} / ${status.players.max}\n\n` +
                    players.map(player => `> ${player.name}`).join("\n")
                )

        interaction.reply({embeds: [embed], ephemeral: false});
    }
}