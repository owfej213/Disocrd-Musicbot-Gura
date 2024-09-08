import { QueryType, useMainPlayer } from 'discord-player';
import { ApplicationCommandType, ContextMenuCommandBuilder } from 'discord.js';
import { BaseEmbed, ErrorEmbed } from '../../modules/embeds.js';

export const data = {
    command: new ContextMenuCommandBuilder()
        .setName('Add to queue')
        .setNameLocalization('zh-TW', '加入播放清單')
        .setType(ApplicationCommandType.Message),
    category: 'dev',
    validateVC: true,
};

export async function execute(interaction) {
    await interaction.deferReply();

    const channel = interaction.member.voice.channel;

    const query = interaction.options.getMessage('message').embeds[0].url;

    const player = useMainPlayer();

    const result = await player.search(query, {
        requestedBy: interaction.user,
        searchEngine: QueryType.AUTO,
    });

    if (result.isEmpty())
        return interaction.editReply({
            content: `❌ 沒有任何結果`,
            ephemeral: true,
        });

    try {
        const { queue, track, searchResult } = await player.play(
            channel,
            result,
            {
                nodeOptions: {
                    metadata: {
                        channel: interaction.channel,
                        requestedBy: interaction.user,
                    },
                    volume: 80,
                    selfDeaf: false,
                    leaveOnEmpty: true,
                    leaveOnEnd: false,
                },
                requestedBy: interaction.user,
            },
        );

        try {
            if (!queue.connection) {
                await queue.connect(channel);
            }
        } catch {
            queue.destroy();
            return interaction.editReply({
                content: '❌ 無法加入你的頻道',
                ephemeral: true,
            });
        }

        const embed = BaseEmbed();

        if (searchResult.hasPlaylist()) {
            const playlist = searchResult.playlist;
            embed.setTitle(playlist.title).setURL(playlist.url).setAuthor({
                name: playlist.author.name,
                url: playlist.author.url,
            });
        } else {
            embed
                .setTitle(track.title)
                .setURL(track.url)
                .setAuthor({ name: track.author });
        }

        return await interaction.editReply({
            embeds: [embed],
        });
    } catch (err) {
        return interaction.editReply({
            embeds: [ErrorEmbed(`❌ 播放 \`${query}\` 時發生錯誤`)],
        });
    }
}