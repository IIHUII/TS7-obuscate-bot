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

    category: "أداة تصغير LUA",
    command: "minify",
    aliases: ["mf", "min"],

    arguments: "<كود | ملف>",

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
                const error_embed = createEmbed({
                    title: `${getEmoji("error")} خطأ`,
                    description: `${codeBlock("تعذر الحصول على رابط الملف المرفق.")}`,
                    color: Colors.Red,
                    timestamp: true
                })
                return message.reply({ embeds: [error_embed] })
            }

            await fetch(url).then(async res => {
                const reader = res.body.getReader()
                await reader.read().then(({ value }) => {
                    script = Buffer.from(value).toString()
                })
            })
        } else {
            const usage_args = arg.props.arguments.length > 0 ? "`" + `${arg.props.arguments}` + "`" : ""
            const usage_cmd = "`" + `${config.prefix}${arg.cmd}` + "`"
            const error_embed = createEmbed({
                title: `${getEmoji("error")} خطأ في الاستخدام`,
                description: `${codeBlock("يرجى تقديم سكربت LUA صالح كمربع كود أو ملف مرفق.")}`,
                color: Colors.Red,
                timestamp: true,
                fields: [
                    { name: "الصيغة الصحيحة:", value: `${usage_cmd} ${usage_args}` },
                    { name: "ملاحظة:", value: `للمساعدة توجه إلى <1392639277258637345#> أو اسأل في <# <#1350550712521592912>` }
                ],
                footer: {
                    text: "luna - obf Bot • made by sefo.php",
                    iconURL: config.ICON_URL
                }
            })
            return message.reply({ embeds: [error_embed] })
        }

        if (ratelimits.has(message.author.id)) {
            return sendErrorMessage(["أنت تقوم بتصغير سكربت حاليًا. الرجاء الانتظار!", "خطأ", "معدل التنفيذ"], message)
        }

        const process_embed = createEmbed({
            fields: [
                { name: `🔄 العملية`, value: `${getEmoji("loading")} جاري إنشاء الجلسة...` }
            ],
            timestamp: true,
            color: Colors.Yellow,
            footer: {
                text: "luna - obf Bot • made by sefo.php",
                iconURL: config.ICON_URL
            }
        })

        const response = await message.reply({ embeds: [process_embed] })
        const session = await createSession(script)

        ratelimits.set(message.author.id, true)

        if (session.message && !session.sessionId) {
            process_embed.data.fields[0].value = `${getEmoji("error")} فشل في إنشاء الجلسة!`
            process_embed.data.color = Colors.Red
            await response.edit({ embeds: [process_embed] })
            ratelimits.delete(message.author.id)
            return sendErrorMessage([session.message || "فشل في التصغير!", "خطأ", "minifying"], message)
        }

        process_embed.data.fields[0].value = `${getEmoji("check")} تم إنشاء الجلسة بنجاح: ${hyperlink("[فتح الجلسة]", config.SESSION_URL + session.sessionId)}\n${getEmoji("loading")} جاري تصغير السكربت...`
        await response.edit({ embeds: [process_embed] })

        const minified_script = await manualObfuscateScript(session.sessionId, {
            "MinifiyAll": true
        }, message)

        if (minified_script.message && !minified_script.code) {
            process_embed.data.fields[0].value = `${getEmoji("error")} فشل في تصغير السكربت!`
            process_embed.data.color = Colors.Red
            await response.edit({ embeds: [process_embed] })
            ratelimits.delete(message.author.id)
            return sendErrorMessage([minified_script.message || "فشل في التصغير!", "خطأ", "minifying"], message)
        }

        console.log(`تم تصغير سكربت من ${message.author.tag}: ${session.sessionId}`)

        process_embed.data.fields[0].value = `${getEmoji("check")} تم إنشاء الجلسة: ${hyperlink("[فتح الجلسة]", config.SESSION_URL + minified_script.sessionId)}\n${getEmoji("check")} تم تصغير السكربت!\n${getEmoji("loading")} جاري تجهيز الملف...`
        await response.edit({ embeds: [process_embed] })

        const file_attachment = createFileAttachment(Buffer.from(minified_script.code))
        if (typeof file_attachment !== "object") {
            process_embed.data.fields[0].value = `${getEmoji("check")} تم إنشاء الجلسة\n${getEmoji("check")} السكربت تم تصغيره\n${getEmoji("error")} فشل في إنشاء الملف!`
            process_embed.data.color = Colors.Red
            ratelimits.delete(message.author.id)
            return sendErrorMessage([file_attachment.error || "تعذر إنشاء الملف.", "خطأ", "file attachment"], message)
        }

        process_embed.data.fields[0].value = `${getEmoji("check")} تم إنشاء الجلسة: ${hyperlink("[فتح الجلسة]", config.SESSION_URL + minified_script.sessionId)}\n${getEmoji("check")} السكربت تم تصغيره بنجاح!\n${getEmoji("check")} الملف تم إنشاؤه!`
        process_embed.data.color = Colors.Green
        await response.edit({ embeds: [process_embed] })

        await message.reply({ files: [file_attachment] })

        ratelimits.delete(message.author.id)
    }
}

global.ratelimits = ratelimits
