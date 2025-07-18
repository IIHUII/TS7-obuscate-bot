const { createEmbed } = require("../utils/embed.js")
const { Colors, hyperlink, inlineCode } = require("discord.js")
const { formatUptime } = require("../utils/misc.js")
const { ICON_URL, SUPPORT_URL } = require("../.config.js")

module.exports = {
    enabled: true,

    category: "BOT",
    command: "info",

    arguments: "",

    allow_dm: true,
    ignore_arguments: true,

    callback: async function (arg) {
        const client = global.client,
            message = arg.message || arg

        if (!message) return

        let embed = createEmbed({
            title: `بوت تشفير Lua`,
            description: `وت مصمم لتشفير سكربتات روبلكس`,
            fields: [
                { name: "• مدة التشغيل", value: inlineCode(formatUptime(client?.uptime)), inline: true },
                { name: "• سيرفر الدعم", value: `${SUPPORT_URL}`, inline: true },
            ],
            color: Colors.Green,
            footer: {
                text: "luna - obf • made by sefo.php",
                iconURL: ICON_URL
            },
            thumbnail: ICON_URL
        })

        await message.reply({ embeds: [embed] })
    }
}
