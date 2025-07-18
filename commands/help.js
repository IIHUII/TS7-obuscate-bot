const { createEmbed } = require("../utils/embed.js")
const { Colors } = require("discord.js")
const commandList = require("../utils/commandList")
const { getEmoji } = require("../utils/misc")
const { ICON_URL } = require("../.config")

module.exports = {
    enabled: true,

    category: "BOT",
    command: "help",

    arguments: "",

    allow_dm: true,
    ignore_arguments: true,

    callback: async function (arg) {
        const client = global.client,
            message = arg.message || arg

        if (!message) return

        const list = commandList.create()

        let embed = createEmbed({
            title: `${getEmoji("info")} 📜 قائمة الأوامر`,
            color: Colors.Green,
            fields: list,
            timestamp: true,
            footer: {
                text: "LuaObfuscator Bot • made by sefo.php",
                iconURL: ICON_URL
            }
        })
        return await message.reply({ embeds: [embed] })
    }
}
