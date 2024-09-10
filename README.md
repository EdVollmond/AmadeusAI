# AmadeusAI


[![](https://github.com/EdVollmond/AmadeusAI/blob/main/screen0.png)](https://github.com/EdVollmond/AmadeusAI/blob/main/screen0.png)

### [VIDEO DEMO](https://youtu.be/nJKQ2mx9Gns?feature=shared)

## About

Node.js application that maximally accurately simulates the Amadeus System from the 'Steins;Gate 0' visual novel

## Installation and Setup

### Requirements

- Node.js
- Some cans of Dr.Pepper

### Installation

1. Clone the repository:

```bash
git clone https://github.com/EdVollmond/AmadeusAI.git
```

2. Create users file:

- In the JSON directory, create a file named `users.json` with the following structure:

```json
{
  "User": {
    "name": "",
    "token": "",
    "telegram_username": "",
    "telegram_chat_ids": {
      "amadeus_kurisu": ""
    },
    "input_tokens": 0,
    "output_tokens": 0
  }
}
```

- "User" is the unique user ID in the system;
- "name" is the name to be used in the chat;
- "token" is a unique key for authorizing access requests, generated using the HMAC SHA256 algorithm where the user ID is used as data, and the user's password as the key. You can generate this in the `tokenizer.mjs` file.

3. Create user's data:

- Create a separate `.json` file (the filename should match the user ID from the previous step) for each user in `JSON/user_data` with the following structure:

```json
{
  "amadeus_kurisu": {
    "user_persona": "",
    "long_term_memory": "",
    "current_chat": [],
    "last_chats": [],
    "old_chats": [],
    "settings": {
      "voicing": false,
      "speechMode": false,
      "noAss": true,
      "delooping": false
    }
  }
}
```

- "amadeus_kurisu" is the unique character ID in the system (you can also edit or create custom characters in the `JSON/chars` folder);
- "user_persona" is a brief user information from the character's point of view (should be automatically filled in when reaching the token limit in a dialogue);
- "long_term_memory" is a summary of old user dialogues (should be automatically filled in when reaching the token limit in a dialogue);
- "current_chat" is the current chat with the character (included in the contextual window);
- "last_chats" are the previous dialogues with the character (included in the contextual window);
- "old_chats" are old dialogues included in the summary (not included in the contextual window);
- "settings" are user settings.

4. Environment configuration:

This is the most ambiguous part. Depending on your preferences for the choice of host for the language model, this option varies greatly. Currently, I am using the DeepInfra API for speech and image recognition, as well as image generation. To access the language model, I use API keys from Google. It is also supposed to run all this as a Telegram bot. Therefore, my `.env` file looks like this:

```
KURISU_BOT_TOKEN = 
PROXY_HOST = 
PROXY_PORT = 
PROXY_USERNAME = 
PROXY_PASSWORD = 
DEEPINFRA_API_KEY = 
GOOGLE_GEN_AI_KEY =
```

Again, in your case, it may be significantly different.

### Launching the Project

After you have configured the environment, created users and characters, you can proceed to launch the project.

- Start the server:

```bash
node app.mjs
```

By default, the server will start at http://localhost:8000/, where you can connect through your browser.

## Usage

WIP

## Contact

Official Telegram channel of the project: https://t.me/kurisu_shrine

![](https://github.com/EdVollmond/AmadeusAI/blob/main/screen1.png)
