const { createEmbed } = require("../utils/embed")
const { sendErrorMessage } = require("../utils/command")
const { Colors, codeBlock, hyperlink, Collection, AttachmentBuilder } = require("discord.js")
const { getEmoji } = require("../utils/misc")
const config = require("../.config")

const {
    parseCodeblock,
    hasCodeblock,
    hasWebhook,
    parseWebhooks,
    obfuscateScript
} = require("../utils/obfuscate-util")

const ratelimits = new Collection()

module.exports = {
    enabled: true,

    category: "أداة تشفير LUA",
    command: "obfuscate",
    aliases: ["obf"],

    arguments: "<كود | ملف>",

    allow_dm: true,
    ignore_arguments: true,

    callback: async function (arg) {
        const client = global.client,
            message = arg.message || arg

        if (!message) return

        let script = null, haswebhook
        const iscodeblock = hasCodeblock(arg.rawargs)

        if (message.content.includes("```") && iscodeblock) {
            haswebhook = hasWebhook(arg.rawargs)
            script = parseCodeblock(arg.rawargs)
        } else if ([...message.attachments].length > 0) {
            const attachment = message.attachments.first()
            const url = attachment ? attachment.url : null
            if (!url) {
                return message.reply({
                    embeds: [createEmbed({
                        title: `${getEmoji("error")} خطأ`,
                        description: codeBlock("تعذر الحصول على رابط الملف المرفق."),
                        color: Colors.Red,
                        timestamp: true
                    })]
                })
            }

            try {
                const res = await fetch(url)
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                script = await res.text()
                haswebhook = hasWebhook(script)
            } catch (error) {
                return message.reply({
                    embeds: [createEmbed({
                        title: `${getEmoji("error")} خطأ في جلب الملف`,
                        description: codeBlock(`فشل في تحميل المرفق: ${error.message}`),
                        color: Colors.Red,
                        timestamp: true
                    })]
                })
            }
        } else {
            const usage_cmd = `\`${config.prefix}${arg.cmd} ${arg.props.arguments || "<كود | ملف>"}\``
            return message.reply({
                embeds: [createEmbed({
                    title: `${getEmoji("error")} خطأ في الاستخدام`,
                    description: codeBlock("يرجى تقديم سكربت LUA صالح كمربع كود أو ملف مرفق."),
                    color: Colors.Red,
                    timestamp: true,
                    fields: [
                        { name: "الصيغة الصحيحة:", value: usage_cmd },
                        { name: "ملاحظة:", value: `للمساعدة توجه إلى <#1392639277258637345> أو اسأل في <#1350550712521592912>` }
                    ],
                    footer: {
                        text: "luna - obf Bot • made by sefo.php",
                        iconURL: config.ICON_URL
                    }
                })]
            })
        }

        if (ratelimits.has(message.author.id)) {
            return sendErrorMessage(["أنت تقوم بتشفير سكربت حاليًا. الرجاء الانتظار!", "خطأ", "معدل التنفيذ"], message)
        }

        const process_embed = createEmbed({
            fields: [{ name: `🔄 عملية التشفير`, value: `${getEmoji("loading")} جاري التشفير...` }],
            timestamp: true,
            color: Colors.Yellow,
            footer: {
                text: "luna - obf Bot • made by sefo.php",
                iconURL: config.ICON_URL
            }
        })

        if (haswebhook) {
            const webhooks = parseWebhooks(script)
            if (!webhooks) return

            const embed_webhook_string = [...new Set(webhooks.map(w => codeBlock("lua", w.trim())))].join("\n")

            if (config.script_scan_options.discord_webhooks === "block") {
                return message.author.send({
                    embeds: [createEmbed({
                        title: `${getEmoji("failed")} تم إلغاء التشفير`,
                        fields: [
                            { name: "المشكلة:", value: codeBlock("diff", "- الرجاء إزالة جميع روابط Webhook من سكربتك.") },
                            { name: `تم العثور على Webhooks (${webhooks.length})`, value: embed_webhook_string }
                        ],
                        color: Colors.Red,
                        timestamp: true,
                        footer: {
                            text: "luna - obf Bot • made by sefo.php",
                            iconURL: config.ICON_URL
                        }
                    })]
                })
            }

            if (config.script_scan_options.discord_webhooks === "warn") {
                message.author.send({
                    embeds: [createEmbed({
                        title: `${getEmoji("warn")} تم الكشف عن Webhook`,
                        fields: [
                            { name: "تنبيه:", value: "تم اكتشاف أن سكربتك تحتوي على روابط Webhook.\nاستخدامها لأغراض خبيثة مثل سرقة الحسابات أو تتبع الـ IP قد يؤدي إلى حظرك." },
                            { name: `تم العثور على Webhooks (${webhooks.length})`, value: embed_webhook_string }
                        ],
                        color: Colors.Yellow,
                        timestamp: true,
                        footer: {
                            text: "luna - obf Bot • made by sefo.php",
                            iconURL: config.ICON_URL
                        }
                    })]
                })
            }
        }

        const response = await message.reply({ embeds: [process_embed] })
        ratelimits.set(message.author.id, true)

        try {
            const obfuscate_script = await obfuscateScript(script, message)

            if ((obfuscate_script.message && !obfuscate_script.code) || !obfuscate_script.sessionId) {
                throw new Error(obfuscate_script.message || "فشل في التشفير")
            }

            process_embed.data.fields[0].value = `${getEmoji("check")} تم تشفير السكربت بنجاح: ", ${getEmoji("loading")} جاري تجهيز الملف...`
            await response.edit({ embeds: [process_embed] })

            // Create in-memory buffer and attachment
            const buffer = Buffer.from(obfuscate_script.code, 'utf-8')
            const fileName = `obfuscated_${message.author.id}_${Date.now()}.txt`
            const attachment = new AttachmentBuilder(buffer, { name: fileName })

            process_embed.data.fields[0].value = `${getEmoji("check")} تم تشفير السكربت بنجاح!\n${getEmoji("check")} تم تجهيز الملف!`
            process_embed.data.color = Colors.Green
            await response.edit({ embeds: [process_embed] })

            await message.reply({
                files: [attachment],
                content: `✅ تمت عملية التشفير بنجاح!`
            })
        } catch (error) {
            process_embed.data.fields[0].value = `${getEmoji("error")} فشل في التشفير!`
            process_embed.data.color = Colors.Red
            await response.edit({ embeds: [process_embed] })
            sendErrorMessage([error.message || "حدث خطأ غير متوقع", "خطأ", "obfuscation"], message)
        } finally {
            ratelimits.delete(message.author.id)
        }
    }
}

global.ratelimits = ratelimits
