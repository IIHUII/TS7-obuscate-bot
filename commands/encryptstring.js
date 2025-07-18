const { createEmbed } = require("../utils/embed")
const { sendErrorMessage } = require("../utils/command")
const { Colors, codeBlock, hyperlink, Collection } = require("discord.js")
const { getEmoji } = require("../utils/misc")
const config = require("../.config")
const {
    parseCodeblock,
    hasCodeblock,
    createSession,
    manualObfuscateScript,
    createFileAttachment
} = require("../utils/obfuscate-util")

const ratelimits = new Collection()

module.exports = {
    enabled: true,
    category: "LUA OBFUSCATOR",
    command: "encryptstrings",
    aliases: ["estr", "ecstr", "encstr", "es"],
    arguments: "<كود أو ملف>",

    allow_dm: true,
    ignore_arguments: true,

    callback: async function (arg) {
        const client = global.client,
            message = arg.message || arg

        if (!message) return

        let script = null
        const iscodeblock = hasCodeblock(arg.rawargs)
        if (message.content.includes("```") && iscodeblock) {
            script = parseCodeblock(arg.rawargs)
        } else if ([...message.attachments].length > 0) {
            const attachment = message.attachments.first()
            const url = attachment ? attachment.url : null
            if (!url) {
                let error_embed = createEmbed({
                    title: `${getEmoji("error")} خطأ`,
                    description: `${codeBlock("تعذر الحصول على رابط الملف.")}`,
                    color: Colors.Red,
                    timestamp: true
                })
                return message.reply({ embeds: [error_embed] })
            }

            await fetch(url).then(async res => {
                const reader = res.body.getReader()
                await reader.read().then(({ done, value }) => {
                    script = Buffer.from(value).toString()
                })
            })
        } else {
            let usage_args = arg.props.arguments.length > 0 ? "`" + `${arg.props.arguments}` + "`" : ""
            let usage_cmd = "`" + `${config.prefix}${arg.cmd}` + "`"
            let error_embed = createEmbed({
                title: `${getEmoji("error")} خطأ في الصياغة`,
                description: `${codeBlock("يرجى تزويد سكربت Lua ككود أو ملف.")}`,
                color: Colors.Red,
                timestamp: true,
                fields: [
                    { name: "الصيغة الصحيحة:", value: `${usage_cmd} ${usage_args}` },
                    { name: "ملاحظة:", value: `للمساعدة توجه إلى الدعم الفني.` }
                ],
                footer: {
                    text: "LuaObfuscator Bot • made by sefo.php",
                    iconURL: config.ICON_URL
                }
            })
            return message.reply({ embeds: [error_embed] })
        }

        if (ratelimits.has(message.author.id)) {
            return sendErrorMessage(["🚫 أنت تقوم بالفعل بعملية تشفير. يرجى الانتظار!", "خطأ", "حد السرعة"], message)
        }

        let process_embed = createEmbed({
            fields: [
                { name: `عملية التشفير`, value: `${getEmoji("loading")} جاري إنشاء الجلسة...` }
            ],
            timestamp: true,
            color: Colors.Yellow,
            footer: {
                text: "LuaObfuscator Bot • made by sefo.php",
                iconURL: config.ICON_URL
            }
        })

        let response = await message.reply({ embeds: [process_embed] })
        const session = await createSession(script)

        ratelimits.set(message.author.id, true)
        if (session.message && !session.sessionId) {
            process_embed.data.fields[0].value = `${getEmoji("error")} فشل في التشفير!`
            process_embed.data.color = Colors.Red
            await response.edit({ embeds: [process_embed] })
            ratelimits.delete(message.author.id)
            return sendErrorMessage([session.message || "فشل التشفير!", "خطأ", "تشفير"], message)
        }

        process_embed.data.fields[0].value = `${getEmoji("check")} تم إنشاء الجلسة! ${hyperlink("[فتح]", config.SESSION_URL + session.sessionId)}\n${getEmoji("loading")} جاري تشفير السكربت...`
        await response.edit({ embeds: [process_embed] })

        const obfuscated_script = await manualObfuscateScript(session.sessionId, {
            "MinifiyAll": true,
            "CustomPlugins": {
                "EncryptStrings": [100]
            }
        }, message)

        if (obfuscated_script.message && !obfuscated_script.code) {
            process_embed.data.fields[0].value = `${getEmoji("error")} فشل في التشفير!`
            process_embed.data.color = Colors.Red
            await response.edit({ embeds: [process_embed] })
            ratelimits.delete(message.author.id)
            return sendErrorMessage([obfuscated_script.message || "فشل التشفير!", "خطأ", "تشفير"], message)
        }

        console.log(`Script by ${message.author.tag} تم تشفيره بنجاح: ${session.sessionId}`)

        process_embed.data.fields[0].value = `${getEmoji("check")} تم إنشاء الجلسة! ${hyperlink("[فتح]", config.SESSION_URL + obfuscated_script.sessionId)}\n${getEmoji("check")} تم تشفير السكربت!\n${getEmoji("loading")} جاري إنشاء الملف...`
        await response.edit({ embeds: [process_embed] })

        const file_attachment = createFileAttachment(Buffer.from(obfuscated_script.code))
        if (typeof file_attachment != "object") {
            process_embed.data.fields[0].value = `${getEmoji("check")} تم إنشاء الجلسة! ${hyperlink("[فتح]", config.SESSION_URL + obfuscated_script.sessionId)}\n${getEmoji("check")} تم تشفير السكربت!\n${getEmoji("error")} فشل إنشاء الملف!`
            process_embed.data.color = Colors.Red
            ratelimits.delete(message.author.id)
            return sendErrorMessage([file_attachment.error || "تعذر إنشاء الملف.", "خطأ", file_attachment.error_name], message)
        }

        // حذف الرد إذا فيه undefined أو عبارات معينة
        if (
            process_embed.data.fields[0].value.includes("undefined") ||
            process_embed.data.fields[0].value.includes("Script obfuscated!") ||
            process_embed.data.fields[0].value.includes("Attachment file created!")
        ) {
            return response.delete().catch(() => { })
        }

        process_embed.data.fields[0].value = `${getEmoji("check")} تم إنشاء الجلسة! ${hyperlink("[فتح]", config.SESSION_URL + obfuscated_script.sessionId)}\n${getEmoji("check")} تم تشفير السكربت!\n${getEmoji("check")} تم إنشاء الملف!`
        process_embed.data.color = Colors.Green
        await response.edit({ embeds: [process_embed] })

        await message.reply({ files: [file_attachment] })
        ratelimits.delete(message.author.id)
    }
}

global.ratelimits = ratelimits
