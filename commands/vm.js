const { createEmbed } = require("../utils/embed") // استيراد دالة إنشاء الرسائل المدمجة
const { sendErrorMessage } = require("../utils/command") // استيراد دالة إرسال رسالة خطأ
const { Colors, codeBlock, blockQuote, inlineCode, hyperlink, Attachment, Collection } = require("discord.js") // استيراد أدوات من مكتبة ديسكورد
const { getEmoji } = require("../utils/misc") // استيراد دالة إحضار الإيموجي
const config = require("../.config") // استيراد الإعدادات
const {
  parseCodeblock, hasCodeblock, hasWebhook,
  createSession, parseWebhooks,
  manualObfuscateScript, obfuscateScript, createFileAttachment
} = require("../utils/obfuscate-util") // استيراد أدوات التشفير

const ratelimits = new Collection() // إنشاء مجموعة لتحديد المعدلات (منع السبام)

module.exports = {
    enabled: true, // الأمر مفعل

    category: "LUA OBFUSCATOR", // التصنيف

    command: "demovm", // اسم الأمر

    aliases: ["vm"], // الأسماء البديلة

    arguments: "<codeblock | file>", // الوسائط المطلوبة

    allow_dm: true, // السماح بالأمر في الخاص

    ignore_arguments: true, // تجاهل أخطاء الوسائط

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
                    description: `${codeBlock("تعذر الحصول على رابط الملف المرفق.")}`,
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
                title: `${getEmoji("error")} خطأ في الصيغة`,
                description: `${codeBlock("يرجى تقديم سكربت Lua صحيح ككود داخل الرسالة أو كملف مرفق.")}`,
                color: Colors.Red,
                timestamp: true,
                fields: [
                    { name: "الصيغة:", value: `${usage_cmd} ${usage_args}` },
                    { name: "تذكير:", value: `إذا كنت تحتاج مساعدة، توجه إلى <#1392639277258637345> أو اسأل في <#1350550712521592912>` }
                ],
                footer: {
                    text: "LuaObfuscator Bot • تم إنشاؤه بواسطة mopsfl#4588",
                    iconURL: config.ICON_URL
                }
            })
            return message.reply({ embeds: [error_embed] })
        }

        if (ratelimits.has(message.author.id)) {
            return sendErrorMessage(["أنت تقوم بالفعل بتشفير سكربت. الرجاء الانتظار!", "خطأ", "معدل الاستخدام"], message)
        }

        let process_embed = createEmbed({
            fields: [
                { name: `عملية التشفير`, value: `${getEmoji("loading")} يتم إنشاء جلسة...` }
            ],
            timestamp: true,
            color: Colors.Yellow,
            footer: {
                text: "luna - obf Bot • تم إنشاؤه بواسطة Sefo.php",
                iconURL: config.ICON_URL
            }
        })

        let response = await message.reply({ embeds: [process_embed] })
        const session = await createSession(script)

        ratelimits.set(message.author.id, true)
        if (session.message && !session.sessionId) {
            process_embed.data.fields[0].value = `${getEmoji("error")} فشل في التشفير!`
            process_embed.data.color = Colors.Red
            await response.edit({
                embeds: [process_embed]
            })
            ratelimits.delete(message.author.id)
            return sendErrorMessage([obfuscated_script.message || "فشل التشفير!", "خطأ", "تشفير"], message)
        }

        process_embed.data.fields[0].value = `${getEmoji("check")} تم إنشاء الجلسة! ${hyperlink("[فتح]", config.SESSION_URL + session.sessionId)}\n${getEmoji("loading")} يتم تشفير السكربت...`
        await response.edit({
            embeds: [process_embed]
        })

        const obfuscated_script = await manualObfuscateScript(session.sessionId, {
            "Virtualize": true,
            "MinifiyAll": true
        }, message)

        if (obfuscated_script.message && !obfuscated_script.code) {
            process_embed.data.fields[0].value = `${getEmoji("error")} فشل في التشفير!`
            process_embed.data.color = Colors.Red
            await response.edit({
                embeds: [process_embed]
            })
            ratelimits.delete(message.author.id)
            return sendErrorMessage([obfuscated_script.message || "فشل التشفير!", "خطأ", "minifying"], message)
        }

        console.log(`السكربت بواسطة ${message.author.tag} تم تشفيره بنجاح (vm): ${session.sessionId}`)
        process_embed.data.fields[0].value = `${getEmoji("check")} تم إنشاء الجلسة! ${hyperlink("[فتح]", config.SESSION_URL + obfuscated_script.sessionId)}\n${getEmoji("check")} تم تشفير السكربت!\n${getEmoji("loading")} يتم إنشاء ملف المرفق...`
        await response.edit({
            embeds: [process_embed]
        })

        const file_attachment = createFileAttachment(Buffer.from(obfuscated_script.code))
        if (typeof file_attachment != "object") {
            process_embed.data.fields[0].value = `${getEmoji("check")} تم إنشاء الجلسة! ${hyperlink("[فتح]", config.SESSION_URL + obfuscated_script.sessionId)}\n${getEmoji("check")} تم تشفير السكربت!\n${getEmoji("error")} فشل في إنشاء ملف المرفق!`
            process_embed.data.color = Colors.Red
            ratelimits.delete(message.author.id)
            return sendErrorMessage([file_attachment.error || "تعذر إنشاء ملف المرفق.", "خطأ", file_attachment.error_name], message)
        }

        process_embed.data.fields[0].value = `${getEmoji("check")} تم إنشاء الجلسة! ${hyperlink("[فتح]", config.SESSION_URL + obfuscated_script.sessionId)}\n${getEmoji("check")} تم تشفير السكربت!\n${getEmoji("check")} تم إنشاء ملف المرفق!`
        process_embed.data.color = Colors.Green
        await response.edit({
            embeds: [process_embed]
        })
        await message.reply({
            files: [file_attachment],
        })
        ratelimits.delete(message.author.id)
    }
}

global.ratelimits = ratelimits
