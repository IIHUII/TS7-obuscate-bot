# LuaObfuscator Bot

LuaObfuscator Bot is a Discord bot designed to obfuscate Lua scripts using the [luaobfuscator](https://luaobfuscator.com/) API. It provides an easy way for users to protect their Lua code directly from Discord.

## Features

- Obfuscate Lua scripts via Discord commands
- Supports custom obfuscation options
- Handles file uploads and code snippets
- Provides error handling and feedback

## Setup

1. **Clone the repository:**
   ```
   git clone https://github.com/IIHUII/TS7-obuscate-bot.git
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Configure environment variables:**
   - Create a `.env` file with your Discord bot token and any required API keys.

4. **Run the bot:**
   ```
   node index.js
   ```

## Usage

- Use the bot in your Discord server by typing commands such as:
  ```
  !obfuscate <your Lua code or attach a file>
  ```
- The bot will reply with the obfuscated Lua script.

## Contributing

Pull requests and suggestions are welcome! Please open an issue for any bugs or feature requests.

## License

This project is licensed under the MIT License.
