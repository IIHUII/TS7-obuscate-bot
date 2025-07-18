const { createEmbed } = require("../utils/embed.js")
const { Colors } = require("discord.js")

module.exports = {
    enabled: true,

    category: "البوت",
    command: "ping",

    arguments: "",

    allow_dm: true,
    ignore_arguments: true, // لن يظهر أي خطأ في حال كانت الوسائط خاطئة

    callback: async function(arg) {
        const client = global.client,
              message = arg.message || arg

        if (!message) return

        const embed = createEmbed({
            description: "🔄 جاري قياس سرعة الاستجابة...",
            color: Colors.Yellow,
        })

        await message.reply({ embeds: [embed] }).then(async (msg) => {
            const ping = msg.createdTimestamp - message.createdTimestamp
            const resultEmbed = createEmbed({
                description: `🏓 سرعة الاستجابة: \`${ping}ms\``,
                color: Colors.Green
            })
            return await msg.edit({ embeds: [resultEmbed] })
        })
    }
}
