const { createEmbed } = require("../utils/embed");
const { Colors } = require("discord.js");

module.exports = {
    enabled: true,
    category: "OWNER",
    command: "rest", // الأمر يكون !rest
    allow_dm: true,
    ignore_arguments: true,

    callback: async function(arg) {
        const message = arg.message || arg;

        // تأكد إنه صاحب البوت
        if (message.author.id !== "1387961270065696811") {
            return message.reply({
                embeds: [createEmbed({
                    description: "❌ ليس لديك صلاحية استخدام هذا الأمر.",
                    color: Colors.Red
                })]
            });
        }

        await message.reply({
            embeds: [createEmbed({
                description: "🔁 يتم الآن إعادة تشغيل البوت...",
                color: Colors.Yellow
            })]
        });

        setTimeout(() => {
            process.exit(0); // يطفي البوت، وPM2 أو سكربت بيرجعه
        }, 1000);
    }
};
