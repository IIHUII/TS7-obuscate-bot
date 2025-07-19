const prefix = "/"

module.exports = {
    prefix: prefix,
    activity_update_interval: 10000,
    dm_commands: true,

    script_scan_options: {
        discord_webhooks: "warn"
    },

    SUPPORT_URL: "https://discord.com/invite/https://discord.gg/6E72sHEsP7",
    API_URL: "https://luaobfuscator.com/api/obfuscator/",
    ICON_URL: "https://raw.githubusercontent.com/IIHUII/979/refs/heads/main/c82b2c3a3ada17bd5d0e2492ca7fb94d.jpg",

    activities: [
        `${prefix}obf wiht file!`,
        `${prefix}obf in text!`,
    ],
    command_list: {
        "• LUA OBFUSCATOR": [
            "obfuscate",
            "minify",
            "minifit",
            "beautify",
            "demovm",
            "encryptstrings"
        ],
        "• BOT": [
            "help",
            "ping",
            "info"
        ],
    },
    ignored_guilds: [
        "",
    ]
}
