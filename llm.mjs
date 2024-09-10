import OpenAI from "openai";
import FS from "fs";
import { CohereClient } from "cohere-ai";
import { Mistral } from '@mistralai/mistralai';
import completion from "litellm";
import { TextToImage } from "deepinfra";
import { HttpProxyAgent } from 'http-proxy-agent';
import url from "url";
import axios from "axios";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {encode} from "gpt-tokenizer"
import { logging } from "./logging.mjs";
import 'dotenv/config'
import Anthropic from "@anthropic-ai/sdk";
import { telegramSendPhoto } from "./session.mjs";
import { ProxyAgent } from 'undici';
const proxy = {
    host: process.env.PROXY_HOST,
    port: process.env.PROXY_PORT,
    username: process.env.PROXY_USERNAME,
    password: process.env.PROXY_PASSWORD
};
const proxyAgent = new ProxyAgent({
    uri: `http://${proxy.host}:${proxy.port}`,
    token: `Basic ${Buffer.from(`${proxy.username}:${proxy.password}`).toString('base64')}`,
});


const deepinfra = new OpenAI({
    baseURL: 'https://api.deepinfra.com/v1/openai',
    apiKey: process.env.DEEPINFRA_API_KEY,
});


export async function llmGenerate(user_id,char_id,connectionType,fromCharacter,newMessage,regeneration,remainingQuestion,noAss) {
    
    if (noAss){

        try {

            logging("Генерация текста в режиме безжоп");
            //NOASS MODE


            const modelType = "gemini";
    
            const CHARACTER = JSON.parse(FS.readFileSync('JSON/chars/'+ char_id +'.json'));
            const USER_DATA = JSON.parse(FS.readFileSync('JSON/user_data/'+ user_id +'.json'));
            const USER = JSON.parse(FS.readFileSync('JSON/users.json'))[user_id];
            const SCENARIOS = JSON.parse(FS.readFileSync('JSON/scenarios.json'));
            const CHARACTER_PROMPTS = CHARACTER.prompts;
            replaceInObject(CHARACTER_PROMPTS, USER.name, CHARACTER.name);
            replaceInObject(SCENARIOS, USER.name, CHARACTER.name);
            const USER_CHAR_DATA = USER_DATA[char_id];


            let systemPromptArray = [];

            let intro = SCENARIOS.noass_intro;

            systemPromptArray.push(intro);

            if (regeneration&USER_CHAR_DATA.current_chat.length > 0){
                USER_CHAR_DATA.current_chat.pop();
                newMessage = USER_CHAR_DATA.current_chat.pop().content;
            }
        
            let isFirstTime = true;
            if (USER_CHAR_DATA.last_chats.length > 0){
                isFirstTime = false;
            }
    
            let isNewDialogue = true;
            if (USER_CHAR_DATA.current_chat.length > 0){
                isNewDialogue = false;
            }
    
            let isHasArchive = true;
            if (USER_CHAR_DATA.old_chats.length == 0){
                isHasArchive = false;
            }
        
            const currentChat = USER_CHAR_DATA.current_chat;
            let messages = [];
        
            

        
            let preMessage = "";
            
            
            if (CHARACTER_PROMPTS.scenario != ""){
                systemPromptArray.push("<main_scenario>");
                systemPromptArray.push(CHARACTER_PROMPTS.scenario);
                systemPromptArray.push("</main_scenario>");
            }
    
            if (CHARACTER_PROMPTS.char_persona != ""){
                systemPromptArray.push("<character_description> <name>"+CHARACTER.name+"</name><personality>");
                systemPromptArray.push(CHARACTER_PROMPTS.char_persona);
                systemPromptArray.push("</personality></character_description>");
            }
    
            if (USER_CHAR_DATA.user_persona != ""){
                systemPromptArray.push("<character_description> <name>"+USER.name+"</name><personality>");
                systemPromptArray.push(USER_CHAR_DATA.user_persona);
                systemPromptArray.push("</personality></character_description>");
            }
    
            if (CHARACTER_PROMPTS.example_dialogue != ""){
                systemPromptArray.push(SCENARIOS.example_dialogue_start);
                systemPromptArray.push(CHARACTER_PROMPTS.example_dialogue);
                systemPromptArray.push(SCENARIOS.example_dialogue_end);
            }
    
            if (USER_CHAR_DATA.long_term_memory != ""){
                systemPromptArray.push("<past_communication_memory>");
                systemPromptArray.push(USER_CHAR_DATA.long_term_memory);
                systemPromptArray.push("</past_communication_memory>");
            }
    
            if (CHARACTER_PROMPTS.extra_info != ""){
                systemPromptArray.push("<additional_info>");
                systemPromptArray.push(CHARACTER_PROMPTS.extra_info);
                systemPromptArray.push("</additional_info>");
            }
    
            
    
                   
            if (isNewDialogue){ 
                if (isFirstTime){
                    if (connectionType == "amadeus_web"){
                        newMessage = SCENARIOS.first_logging;
                    }
    
                    if (connectionType == "telegram"){
                        preMessage = SCENARIOS.messager_from_user;
                    }
    
                } else {
                    if (connectionType == "amadeus_web"){
                        newMessage = SCENARIOS.new_dialogue;
                    }
    
                    if (connectionType == "telegram"){
                        if (fromCharacter){
    
                            if (remainingQuestion){
                                newMessage = SCENARIOS.remaining_question;
                            } else {
                                preMessage = SCENARIOS.char_new_telegram_dialogue;
                                newMessage = SCENARIOS.telegram_online;
                            }
    
                        } else {
                            preMessage = SCENARIOS.messager_from_user;
                        }
                    }
    
                    if (connectionType == "phone"){
                        systemPromptArray.push(SCENARIOS.anwer_by_phone);
                        newMessage = SCENARIOS.anwer_by_phone;
                    }
                }
                
            }
    
            
    
            for (let i = 0; i < USER_CHAR_DATA.last_chats.length; i++) {
            
                for (let j = 0; j < USER_CHAR_DATA.last_chats[i].length; j++) {
                    messages.push(USER_CHAR_DATA.last_chats[i][j]);
                }
            
            }
    
    
            for (let i = 0; i < currentChat.length; i++) {
                messages.push(currentChat[i]);
            }
    
            if (preMessage != ""){
                messages.push({role: "narrator", content: preMessage});
            }
    
            messages.push({role: "narrator", content: SCENARIOS.system});
    
            messages.push({role: "narrator", content: newMessage});

            systemPromptArray.push("<current_dialogue>");
            for (let i = 0; i < messages.length; i++) {
                systemPromptArray.push("<message>");
                if (messages[i].role == "user"){
                    systemPromptArray.push("<name>"+ USER.name +"</name>");
                    systemPromptArray.push("<text>" + messages[i].content + "</text>");
                } else if (messages[i].role == "narrator") {
                    systemPromptArray.push("<name>narrator</name>");
                    systemPromptArray.push("<text>" + messages[i].content + "</text>");
                } else {
                    let text = messages[i].content.split('] ')[1];
                    let emotion = messages[i].content.split('] ')[0].split('[')[1];
                    systemPromptArray.push("<name>"+ CHARACTER.name +"</name>");
                    systemPromptArray.push("<text>" + text + "</text>");
                    systemPromptArray.push("<emotion>" + emotion + "</emotion>");
                }
                
                systemPromptArray.push("</message>");
            }

            systemPromptArray.push("<message><name>"+ CHARACTER.name +"</name><text>")
            let systemPrompt = systemPromptArray.join("");

            let finalMessages = [{role: "user", content: systemPrompt}];

            let response = "";
            response = await geminiSend(finalMessages,undefined,user_id);

            let isMessanger = false;
            if (connectionType == "telegram"){
                isMessanger = true;
            }
    
            let data = await llmEdit(response,CHARACTER.name,isMessanger,user_id,char_id);
    
    
    
            data.userText = newMessage;
            data.systemMessage = preMessage;
    
            return data;


        } catch (error) {
            logging(error);
        }
    } else {
    
        try {
            //ASS MODE

      
            const modelType = "gemini";
    
            const CHARACTER = JSON.parse(FS.readFileSync('JSON/chars/'+ char_id +'.json'));
            const USER_DATA = JSON.parse(FS.readFileSync('JSON/user_data/'+ user_id +'.json'));
            const USER = JSON.parse(FS.readFileSync('JSON/users.json'))[user_id];
            const SCENARIOS = JSON.parse(FS.readFileSync('JSON/scenarios.json'));
            const CHARACTER_PROMPTS = CHARACTER.prompts;
            replaceInObject(CHARACTER_PROMPTS, USER.name, CHARACTER.name);
            replaceInObject(SCENARIOS, USER.name, CHARACTER.name);
    
            SCENARIOS.general = SCENARIOS.general_prompt;
            SCENARIOS.system = SCENARIOS.system_prompt;
    
    
            const USER_CHAR_DATA = USER_DATA[char_id];
    
            if (regeneration&USER_CHAR_DATA.current_chat.length > 0){
                USER_CHAR_DATA.current_chat.pop();
                newMessage = USER_CHAR_DATA.current_chat.pop().content;
            }
        
            let isFirstTime = true;
            if (USER_CHAR_DATA.last_chats.length > 0){
                isFirstTime = false;
            }
    
            let isNewDialogue = true;
            if (USER_CHAR_DATA.current_chat.length > 0){
                isNewDialogue = false;
            }
    
            let isHasArchive = true;
            if (USER_CHAR_DATA.old_chats.length == 0){
                isHasArchive = false;
            }
        
            const currentChat = USER_CHAR_DATA.current_chat;
            let messages = [];
        
            
            let systemPromptArray = [];
            systemPromptArray.push(SCENARIOS.general);
        
            let preMessage = "";
            
            systemPromptArray.push("<roleplay_context>");
            
            if (CHARACTER_PROMPTS.scenario != ""){
                systemPromptArray.push("<main_scenario>");
                systemPromptArray.push(CHARACTER_PROMPTS.scenario);
                systemPromptArray.push("</main_scenario>");
            }
    
            if (CHARACTER_PROMPTS.char_persona != ""){
                systemPromptArray.push("<description> <name>"+CHARACTER.name+"</name><personality>");
                systemPromptArray.push(CHARACTER_PROMPTS.char_persona);
                systemPromptArray.push("</personality></description>");
            }
    
            if (USER_CHAR_DATA.user_persona != ""){
                systemPromptArray.push("<description> <name>"+USER.name+"</name><personality>");
                systemPromptArray.push(USER_CHAR_DATA.user_persona);
                systemPromptArray.push("</personality></description>");
            }
    
            if (CHARACTER_PROMPTS.example_dialogue != ""){
                systemPromptArray.push(SCENARIOS.example_dialogue_start);
                systemPromptArray.push(CHARACTER_PROMPTS.example_dialogue);
                systemPromptArray.push(SCENARIOS.example_dialogue_end);
            }
    
            if (USER_CHAR_DATA.long_term_memory != ""){
                systemPromptArray.push("<past_communication_memory>");
                systemPromptArray.push(USER_CHAR_DATA.long_term_memory);
                systemPromptArray.push("</past_communication_memory>");
            }
    
            if (CHARACTER_PROMPTS.extra_info != ""){
                systemPromptArray.push("<additional_info>");
                systemPromptArray.push(CHARACTER_PROMPTS.extra_info);
                systemPromptArray.push("</additional_info>");
            }
    
            systemPromptArray.push("</roleplay_context>");
            
    
    
            let systemPrompt = systemPromptArray.join("\n\n");
            messages.push({role: "system", content: systemPrompt});
    
                   
            if (isNewDialogue){ 
                if (isFirstTime){
                    if (connectionType == "amadeus_web"){
                        newMessage = SCENARIOS.first_logging;
                    }
    
                    if (connectionType == "telegram"){
                        preMessage = SCENARIOS.messager_from_user;
                    }
    
                } else {
                    if (connectionType == "amadeus_web"){
                        newMessage = SCENARIOS.new_dialogue;
                    }
    
                    if (connectionType == "telegram"){
                        if (fromCharacter){
    
                            if (remainingQuestion){
                                newMessage = SCENARIOS.remaining_question;
                            } else {
                                preMessage = SCENARIOS.char_new_telegram_dialogue;
                                newMessage = SCENARIOS.telegram_online;
                            }
    
                        } else {
                            preMessage = SCENARIOS.messager_from_user;
                        }
                    }
    
                    if (connectionType == "phone"){
                        systemPromptArray.push(SCENARIOS.anwer_by_phone);
                        newMessage = SCENARIOS.anwer_by_phone;
                    }
                }
                
            }
    
    
            for (let i = 0; i < USER_CHAR_DATA.last_chats.length; i++) {
            
                for (let j = 0; j < USER_CHAR_DATA.last_chats[i].length; j++) {
                    messages.push(USER_CHAR_DATA.last_chats[i][j]);
                }
            
            }
    
    
            for (let i = 0; i < currentChat.length; i++) {
                messages.push(currentChat[i]);
            }
    
            if (preMessage != ""){
                messages.push({role: "system", content: preMessage});
            }
    
            messages.push({role: "system", content: SCENARIOS.system});
    
            messages.push({role: "user", content: newMessage});
    
            let response = "";
    
            if (modelType == "mistral"){
                response = await mistralSend(messages,undefined,user_id);
            } else if (modelType == "cohere"){
                response = await cohereSend(messages,undefined,user_id);
            } else if (modelType == "llama"){
                response = await openaiSend(messages,undefined,user_id);
            } else if (modelType == "anthropic"){
                response = await anthropicSend(messages,undefined,user_id);
            } else if (modelType == "gemini"){
                response = await geminiSend(messages,undefined,user_id);
            }
    
    
    
            let isMessanger = false;
            if (connectionType == "telegram"){
                isMessanger = true;
            }
    
            let data = await llmEdit(response,CHARACTER.name,isMessanger,user_id,char_id);
    
    
    
            data.userText = newMessage;
            data.systemMessage = preMessage;
    
            return data;
        }
        catch (error) {
            logging(error);
        }
    }

}


function getLastWordNormalized(text) {
    // Ищем последнее слово с помощью регулярного выражения
    const match = text.match(/[a-zA-Z]+(?:\s[a-zA-Z]+)*$/);
    const lastWord = match ? match[0] : '';
  
    // Нормализуем последнее слово: приводим к нижнему регистру и удаляем все символы кроме латинских букв
    const normalizedWord = lastWord.toLowerCase().replace(/[^a-z]+/g, '');
  
    return normalizedWord;
  }

export async function geminiSend(messages,settings,userId) {
    const APIkey = process.env.GOOGLE_GEN_AI_KEY;
    
    const SCENARIOS = JSON.parse(FS.readFileSync('JSON/scenarios.json'));
    
    let thoughtsEnabled = true;
    let actionsEnabled = true;

    let maxTokens = 32000;

    let messagesSummary = "";
    for (let i = 0; i < messages.length; i++) {
        messagesSummary += messages[i].content;
    }

    let messagesTokens = encode(messagesSummary).length;

    if (messagesTokens > maxTokens){
        return SCENARIOS.maintenance;
    }
    
    logging("GEMINI SEND:");
    logging(messages);

    for (let i = 0; i < messages.length; i++) {
       messages[i].parts = [{ text: messages[i].content }];
       delete messages[i].content;
       if (messages[i].role == "assistant"){
           messages[i].role = "model";
       }
        if (messages[i].role == "system"){
            messages[i].role = "user";
        }
    }
    

    let llmData = {};

    
    //let newMessage = messages.pop().parts[0].text;
    llmData.contents = messages;
    
    let properties = {
        emotion: { type: "string" },
        text: { type: "string" }
    };
    let required = ["emotion", "text"]
    if (thoughtsEnabled){
        required.push("thoughts");
        properties.thoughts = { type: "string" };
    }
    if (actionsEnabled){
        required.push("actions");
        properties.actions = { type: "string" };
    }


    let generationConfig = {
        temperature: 1,
        maxOutputTokens: 512,
        responseMimeType: "application/json",
        responseSchema: {
            type: "object",
            properties: properties,
            required: required
        }
      }
    

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      }
    ];

    llmData.safetySettings = safetySettings;
    let headers = {
        'Content-Type': 'application/json'
    };

    llmData.generationConfig = generationConfig;

    const chat = await fetch ('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key='+APIkey, { 
        dispatcher: proxyAgent,
        headers: headers,
        method: 'POST', 
        body: JSON.stringify(llmData)
    })

    let result = await chat.json();

    let message = result.candidates[0].content.parts[0].text;
    let parsed = JSON.parse(message);
    let emotion = parsed.emotion;
    let text = parsed.text;
    let thoughts = parsed.thoughts;
    let actions = parsed.actions;
    
    console.log( "Emotion: " + emotion);
    console.log( "Text: " + text);
    console.log( "Thoughts: " + thoughts);
    console.log( "Actions: " + actions);

    let finalResult = "["+emotion+"] ";

    // if (actions.length>0){
    //     finalResult += "*"+actions+"*\n\n";
    // }
    if (actionsEnabled){
        text = text.replaceAll("*","'");
    }

    finalResult += text;


    logging("Ответ языковой модели: "+ finalResult);
    return finalResult;
} 


export async function cohereSend(messages,settings,userId) {
    const COHERE_TOKEN = process.env.COHERE_API_KEY;

    const SCENARIOS = JSON.parse(FS.readFileSync('JSON/scenarios.json'));
    
    let maxTokens = 32000;

    let messagesSummary = "";
    for (let i = 0; i < messages.length; i++) {
        messagesSummary += messages[i].content;
    }

    let messagesTokens = encode(messagesSummary).length;

    if (messagesTokens > maxTokens){
        return SCENARIOS.maintenance;
    }
    
    logging("COHERE SEND:");
    logging(messages);


    let llmData = {};

    llmData.message = messages.pop().content;
    llmData.preamble = messages.shift().content;
    llmData.chat_history = messages;
    llmData.model = "command-r-plus-08-2024";
    llmData.frequency_penalty = 0.5;
    llmData.temperature = 1.0,
    llmData.response_format = {
        type: "json_object",
        schema: {
            type: "object",
            properties: {
                emotion: { type: "string" },
                message: { type: "string" }
            },
            required: ["emotion", "message"]
        }
    };


    let llmStr = JSON.stringify(llmData);
    llmStr = llmStr.replaceAll('assistant','chatbot').replaceAll('content','message');
    llmData = JSON.parse(llmStr);
    if (settings!=undefined){
        for (let key in settings) {
            llmData[key] = settings[key];
        }
    }

    logging(llmData);

    let headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + COHERE_TOKEN
    };

    //const completion = await client.chat(llmData);

    const chat = await fetch ('https://api.cohere.com/v1/chat', { 
        dispatcher: proxyAgent,
        connectors:[{id: "web-search"}],
        headers: headers,
        method: 'POST', 
        body: JSON.stringify(llmData)
    })

    console.log(chat);

    let completion = await chat.json();
    console.log(completion);

    let parsed = JSON.parse(completion.text);
    let message = parsed.message;
    let emotion = parsed.emotion;



    let inTokens = completion.meta.tokens.input_tokens;
    let outTokens = completion.meta.tokens.output_tokens;

    let users = JSON.parse(FS.readFileSync('JSON/users.json'));
    users[userId].input_tokens = users[userId].input_tokens + inTokens;
    users[userId].output_tokens = users[userId].output_tokens + outTokens;
    FS.writeFileSync('JSON/users.json', JSON.stringify(users));

    let result = "["+emotion+"] "+message;

    logging("Ответ языковой модели: "+ result);
    return result;
} 

export async function mistralSend(messages,settings,userId) {

    const SCENARIOS = JSON.parse(FS.readFileSync('JSON/scenarios.json'));

    let maxTokens = 16000;

    let messagesSummary = "";
    for (let i = 0; i < messages.length; i++) {
        messagesSummary += messages[i].content;
    }

    let messagesTokens = encode(messagesSummary).length;

    if (messagesTokens > maxTokens){
        return SCENARIOS.maintenance;
    }
    
    logging("MISTRAL SEND:");
    logging(messages);

    const apiKey = process.env.MISTRAL_API_KEY;
    const client = new Mistral({apiKey: apiKey});


    let llmData = {model:"mistral-large-latest"};

    llmData.messages = messages;

    if (settings!=undefined){
        for (let key in settings) {
            llmData[key] = settings[key];
        }
    }

    logging(llmData);

    const completion = await client.chat.complete(llmData);

    
    let inTokens = completion.usage.prompt_tokens;
    let outTokens = completion.usage.completion_tokens;

    let users = JSON.parse(FS.readFileSync('JSON/users.json'));
    users[userId].input_tokens = users[userId].input_tokens + inTokens;
    users[userId].output_tokens = users[userId].output_tokens + outTokens;
    FS.writeFileSync('JSON/users.json', JSON.stringify(users));

    let result = completion.choices[0].message.content.replaceAll('\n\n','\n').replaceAll('\n\n','\n').replaceAll('\n\n','\n');

    logging("Ответ языковой модели: "+ result);
    return result;
} 


export async function anthropicSend(messages,settings,userId) {

    
    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
    });

    const SCENARIOS = JSON.parse(FS.readFileSync('JSON/scenarios.json'));

    let maxTokens = 16000;

    let messagesSummary = "";
    for (let i = 0; i < messages.length; i++) {
        messagesSummary += messages[i].content;
    }

    let messagesTokens = encode(messagesSummary).length;

    if (messagesTokens > maxTokens){
        return SCENARIOS.maintenance;
    }
    
    logging("ANTHTROPIC SEND:");
    logging(messages);

    const LLM_SETTINGS = JSON.parse(FS.readFileSync('JSON/llm_settings.json'));

    
    let llmData = {
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 256,
        temperature: 0.7,
    };

    llmData.messages = messages;

    if (settings!=undefined){
        for (let key in settings) {
            llmData[key] = settings[key];
        }
    }

    logging(llmData);

    const completion = await anthropic.messages.create(llmData);

    
    let inTokens = completion.usage.prompt_tokens;
    let outTokens = completion.usage.completion_tokens;

    let users = JSON.parse(FS.readFileSync('JSON/users.json'));
    users[userId].input_tokens = users[userId].input_tokens + inTokens;
    users[userId].output_tokens = users[userId].output_tokens + outTokens;
    FS.writeFileSync('JSON/users.json', JSON.stringify(users));

    let result = completion.choices[0].message.content.replaceAll('\n\n','\n').replaceAll('\n\n','\n').replaceAll('\n\n','\n');

    logging("Ответ языковой модели: "+ result);
    return result;
} 


export async function openaiSend(messages,settings,userId) {

    const SCENARIOS = JSON.parse(FS.readFileSync('JSON/scenarios.json'));

    let maxTokens = 16000;

    let messagesSummary = "";
    for (let i = 0; i < messages.length; i++) {
        messagesSummary += messages[i].content;
    }

    let messagesTokens = encode(messagesSummary).length;

    if (messagesTokens > maxTokens){
        return SCENARIOS.maintenance;
    }
    
    logging("OPENAI SEND:");
    logging(messages);

    const LLM_SETTINGS = JSON.parse(FS.readFileSync('JSON/llm_settings.json'));

    
    let llmData = LLM_SETTINGS;

    llmData.messages = messages;

    if (settings!=undefined){
        for (let key in settings) {
            llmData[key] = settings[key];
        }
    }

    logging(llmData);

    const completion = await deepinfra.chat.completions.create(llmData);

    
    let inTokens = completion.usage.prompt_tokens;
    let outTokens = completion.usage.completion_tokens;

    let users = JSON.parse(FS.readFileSync('JSON/users.json'));
    users[userId].input_tokens = users[userId].input_tokens + inTokens;
    users[userId].output_tokens = users[userId].output_tokens + outTokens;
    FS.writeFileSync('JSON/users.json', JSON.stringify(users));

    let result = completion.choices[0].message.content.replaceAll('\n\n','\n').replaceAll('\n\n','\n').replaceAll('\n\n','\n');

    logging("Ответ языковой модели: "+ result);
    return result;
} 

export async function generateImage(prompt,userId,charId) {

    logging("IMAGE GENERATION:");
    logging(prompt);

    const DEEPINFRA_API_KEY = process.env.DEEPINFRA_API_KEY;
    const MODEL = "black-forest-labs/FLUX-1-schnell";

    if (charId=="amadeus_kurisu"){
        prompt = prompt + " (anime style)";
    };

    const model = new TextToImage(MODEL, DEEPINFRA_API_KEY);
    const response = await model.generate({
        prompt: prompt,
    });
  
    const image =  response.images[0];
    
    let inTokens = 0;
    let outTokens = 4000;

    let users = JSON.parse(FS.readFileSync('JSON/users.json'));
    users[userId].input_tokens = users[userId].input_tokens + inTokens;
    users[userId].output_tokens = users[userId].output_tokens + outTokens;
    FS.writeFileSync('JSON/users.json', JSON.stringify(users));

    let base64Image = image;
    
    //logging("Ответ языковой модели: "+ imageData);
    return base64Image;
}


export async function imageSend(imageUrl,userId) {

    logging("IMAGE SEND:");
    logging(imageUrl);

    // Получаем изображение и преобразуем в base64
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const base64Image = Buffer.from(response.data, 'binary').toString('base64');

    let llmData = {
        messages: [
            { role: "user", content: [
                    {type: "image_url", image_url: { url: "data:image/jpg;base64," + base64Image }},
                    {type: "text", text: "Please describe in as much detail as possible what is shown in the picture. Start your description with the words 'In this image...'"}
                ] 
            }
        ],
        model: "openbmb/MiniCPM-Llama3-V-2_5",
        max_tokens: 256,
        temperature: 0.3,
    };

    logging(llmData);

    let baseURL = "https://api.deepinfra.com/v1/openai/chat/completions";
    let apiKey = process.env.DEEPINFRA_API_KEY;

    let completion = await fetch(baseURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify(llmData)
    });

    completion = await completion.json();
    
    let inTokens = completion.usage.prompt_tokens;
    let outTokens = completion.usage.completion_tokens;

    let users = JSON.parse(FS.readFileSync('JSON/users.json'));
    users[userId].input_tokens = users[userId].input_tokens + inTokens;
    users[userId].output_tokens = users[userId].output_tokens + outTokens;
    FS.writeFileSync('JSON/users.json', JSON.stringify(users));

    let result = completion.choices[0].message.content.replaceAll('\n','');

    logging("Ответ языковой модели: "+ result);
    return result;
}

function replaceInObject(obj, userName, charName) {
    for (const key in obj) {
        if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
        // Если значение ключа - объект, вызываем функцию рекурсивно
        replaceInObject(obj[key], userName, charName);
        } else if (typeof obj[key] === "string") {
        // Если значение ключа - строка, заменяем {{USER}} на заданное значение
        obj[key] = obj[key].replace(/{{USER}}/g, userName).replace(/{{CHAR}}/g, charName);
        }
    }
}

// logging(await llmEdit("[neutral] [serious] Лара! Я потерял связь на секунду... Как я уже говорил мне нужно подумать над другим планом... Я попробую найти способ получить информацию о том что происходит в Казани и как Cabal могут быть вовлечены... Ты должна остаться на связи и ждать моих инструкций...","Kurtis",true));

function getTextInParentheses(inputString, word) {
    const regex = new RegExp(`${word}\\s*\\(([^)]+)\\)`, 'i');
    const match = inputString.match(regex);
  
    if (match && match[1]) {
      return match[1];
    } else {
      return null;
    }
}
  
async function emotionRequest(response){
    let content = "Please read the part of dialogue and return the main emotion of response from following list: neutral, angry, apathetic, blushed, happy, playful, serious, thoughtful, calm, displeased, glad, moody, sad, skeptical, surprised. Return ONLY ONE WORD which is the most appropriate the emotional coloring of response.\n\n" + "Response: " + response; 
    
    const openai = new OpenAI({
        baseURL: 'https://api.deepinfra.com/v1/openai',
        apiKey: process.env.DEEPINFRA_API_KEY,
    });
    
    let array = ['angry','apathetic','blushed','happy','playful','serious','thoughtful','calm','displeased','glad','moody','sad','skeptical','surprised','neutral'];
    
    let iterations = 0;
    let emotion = '';

    while (!array.includes(emotion)) {

        const message = { role: 'user', content: content }
      
        const completion = await openai.chat.completions.create({
            messages: [message],
            model: "meta-llama/Meta-Llama-3.1-8B-Instruct",
            max_tokens: 32,
        });


        emotion = getLastWordNormalized(completion.choices[0].message.content);

        //logging("Эмоция: " + emotion);
        iterations++;

        if (iterations > 4) {
            return null;
        }
    }

    return emotion;
}

//logging(await llmEdit("*looks up from examining the Chirugai, a hint of curiosity in my eyes* Ah, who's this? You're not exactly calling from a secure line, are you? What's the message? *my gaze drifts back to the Chirugai, my fingers absently tracing the intricate designs on its surface*","Kurtis",true));




async function llmEdit (llmResponce,charname,isMessanger,userId,charId) {

    const SCENARIOS = JSON.parse(FS.readFileSync('JSON/scenarios.json'));
    const USERS_DATA = JSON.parse(FS.readFileSync(`JSON/users.json`));
    const TELEGRAM_CHAT_ID = USERS_DATA[userId].telegram_chat_ids[charId];

    const PICTURE_ARRAY = ["SEND_PICTURE","SEND PICTURE", "send_picture", "Send_Picture", "Send_picture"];
    let isPicture = false;
    let picturePrompt = "";
    let messageAboutPhoto = "";
    let base64Image = "";

    for (let i = 0; i < PICTURE_ARRAY.length; i++) {
        if (llmResponce.includes(PICTURE_ARRAY[i])) {
            isPicture = true;
            picturePrompt = getTextInParentheses(llmResponce, PICTURE_ARRAY[i]);
            llmResponce = llmResponce.replace(PICTURE_ARRAY[i], "").replace("("+picturePrompt+")","").replaceAll("  "," ");
            break;
        }
    }

    if (isPicture&&isMessanger) {
        try {
            //let userData = JSON.parse(FS.readFileSync('JSON/user_data/'+ userId +'.json'));
            messageAboutPhoto = SCENARIOS.image_was_sent.replaceAll("{{CHAR}}", charname).replace("{{desciption}}", picturePrompt);
            // userData[charId].current_chat.push(
            //     {
            //         role: "assistant",
            //         content: messageAboutPhoto
            //     }
            // );

            base64Image = await generateImage(picturePrompt, userId, charId);
            // await telegramSendPhoto(picture, TELEGRAM_CHAT_ID, charId);
            // //FS.writeFileSync('JSON/user_data/'+ userId +'.json', JSON.stringify(userData));
            // logging("Отправлено фото юзеру " + userId + "от персонажа " + charId + ": " + picturePrompt);
        } catch (error) {
            logging(error);
        }

    }


    const EMOTIONS_ARRAY = ['angry','apathetic','blushed','happy','playful','serious','thoughtful','calm','displeased','glad','moody','sad','skeptical','surprised','neutral','glitchy'];

    const EMOJI = {
        "angry": ["😡", "😠", "🤬", "😈", "👿"],
        "apathetic": ["😐", "🫥", "😶‍🌫️"],
        "blushed": ["😇", "🥰", "😍", "😘","😳","😗"],
        "happy": ["😀", "😃", "😄", "😁","🩷","❤️","🧡","💛","💚","💙","🩵","💜","🖤","🩶","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝"],
        "playful": ["😆", "😅", "🤣", "😂", "😉","🤪", "😝","😏"],
        "serious": ["🙁", "😕", "😑"],
        "thoughtful": ["🙄","🤔", "🧐"],
        "calm": ["😌", "😔", "😪", "🥱","🤓","😴"],
        "displeased": ["😖", "😣", "😞", "😓", "😩", "😫"],
        "glad": ["🤗", "🤭", "😌", "😊","😎"],
        "moody": ["🥺","☹️","😬","😒"],
        "sad": ["😢", "😭"],
        "skeptical": ["🤨", "😐", "😑"],
        "surprised": ["😮", "😯", "😲", "🥹","😱","😦","🤩","🤯"],
        "neutral": ["😶", "🙂", "🙃"]
    }
    
    const EMOJIALL = ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","🫠","😉","😊","😇","🥰","😍","🤩","😘","😗","☺️","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🫢","🫣","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😶‍🌫️","😏","😒","🙄","😬","😮‍💨","🤥","🫨","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","😵‍💫","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","🫤","😟","🙁","☹️","😮","😯","😲","😳","🥺","🥹","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿"];

    llmResponce = removeAsterisksIfWholeStringEnclosed(llmResponce);
    llmResponce = removeAsterisksIfWholeStringEnclosed(llmResponce);

    llmResponce = removeWordBeforeColon(llmResponce,charname);

    llmResponce = llmResponce.replaceAll("  "," ").replaceAll("<","*").replaceAll(">","*");

    let data = {}

    let text = findAndRemoveWordInBrackets(llmResponce).string;
    let emotion = findAndRemoveWordInBrackets(llmResponce).word;

    try {
        if (!EMOTIONS_ARRAY.includes(emotion)){
            emotion = findAndRemoveWordInAsterisks(llmResponce).word;
            text = findAndRemoveWordInAsterisks(llmResponce).string;
            if (!EMOTIONS_ARRAY.includes(emotion)){
                emotion = findAndRemoveWord(llmResponce,EMOTIONS_ARRAY).word;
                text = findAndRemoveWord(llmResponce,EMOTIONS_ARRAY).string;
                if (!EMOTIONS_ARRAY.includes(emotion)){
                    emotion = findByEmoji(llmResponce,EMOJI);
                    if (!EMOTIONS_ARRAY.includes(emotion)){
                        emotion = await checkWordOrSynonymInArray(emotion, EMOTIONS_ARRAY);
                        if (!EMOTIONS_ARRAY.includes(emotion)){
                            emotion = await emotionRequest(llmResponce);
                            if (!EMOTIONS_ARRAY.includes(emotion)){
                                emotion = "neutral";
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        logging(error);

        if (!EMOTIONS_ARRAY.includes(emotion)){
            emotion = "neutral";
        }
    }

    // let isEmotionRecognized = EMOTIONS_ARRAY.includes(emotion);
    
    // let recognized = '';
    
    // if (!isEmotionRecognized){
    //     recognized = await checkWordOrSynonymInArray(emotion, EMOTIONS_ARRAY);
    //     if (recognized == null|| recognized == undefined){
    //         emotion = "neutral";
    //     } else {
    //         emotion = recognized;
    //     }
    // }
    
    text = text.replaceAll("[","*").replaceAll("]","*");

    if (text[0] == "."&&text[1] != "."){
        text = text.substr(1);;
        text = text.trim();
    }

    //if (isMessanger&&charname!="Kurtis"){
      //  text = removeStarredText(text);
    //}

    data = {
        text: text,
        emotion: emotion,
        messageAboutPhoto: messageAboutPhoto,
        base64Image: base64Image
    }

    return data;
}

async function checkWordOrSynonymInArray(str, array) {
    const openai = new OpenAI({
        baseURL: 'https://api.deepinfra.com/v1/openai',
        apiKey: "DsRf3Jw1ITorX1CGnpRNYupFjSvHaHn1",
    });
  
    const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: "Please write one word from the list that is closest in meaning to the word. The list is: " + array.join(", ") + ". The word is: " + str + "" }],
        model: "meta-llama/Meta-Llama-3.1-8B-Instruct",
        max_tokens: 32,
    });

    
    const result = await completion;

    for (let i = 0; i < array.length; i++) {
        
        let word = array[i];
        if (result.choices[0].message.content.includes(word)) {
            return word;
        }
    }
  
    return null;
}



function findAndRemoveWord(str, words) {
    const firstWord = str.split(' ')[0];
    if (words.includes(firstWord)) {
        const newString = str.replace(firstWord, '').trim();
        return { word: firstWord, string: newString };
    } else {
        return { word: null, string: str };
    }
}

function removeWordBeforeColon(str, word) {
    const regex = new RegExp(`^${word}:\\s*`);
    const newString = str.replace(regex, '');
    return newString;
}

export function removeStarredText(s) {
    const regex = /\*.*?\*/g;
    const newString = s.replace(regex, '').replace(/\s+/g, ' ').trim();
    return newString;
}

function findAndRemoveWordInBrackets(str) {
    const regex = /^(\[([^\]]+)\]|\(([^\)]+)\))\s*([\s\S]*)/;
    const match = str.match(regex);
  
    if (match) {
      const wordInBrackets = match[2] || match[3];
      const stringWithoutWordInBrackets = match[4];
      
      return {
        word: wordInBrackets,
        string: stringWithoutWordInBrackets,
      };
    }
  
    // Если слово в скобках в начале строки не найдено, вернуть оригинальную строку и `null` для слова
    return {
        word: null,
        string: str,
    };
}

function findAndRemoveWordInAsterisks(str) {
    const regex = /^(\*{1,2}(\w+)\*{1,2})\s*([\s\S]*)/;
    const match = str.match(regex);
  
    if (match) {
      const wordInAsterisks = match[2];
      const stringWithoutWordInAsterisks = match[3];
  
      return {
        word: wordInAsterisks,
        string: stringWithoutWordInAsterisks,
      };
    }
  
    // Если слово в звёздочках в начале строки не найдено, вернуть оригинальную строку и `null` для слова
    return {
      word: null,
      string: str,
    };
}

function findByEmoji(str, object) {

    let keys = Object.keys(object);
		
    for (let keyNum = 0; keyNum<keys.length;keyNum++){ //перебираем эмоции

        let key = keys[keyNum];
        let keyEmos = object[key];

        for (let num = 0; num<keyEmos.length;num++){

            let emo = keyEmos[num];

            if (str.indexOf(emo)!=-1){
                return key;
            };

        
        };
    };

    return null;
}

function removeAsterisksIfWholeStringEnclosed(str) {
    const match = str.match(/^\*{1,2}([^*]+)\*{1,2}$/);
  
    if (match) {
      return match[1];
    }
  
    return str;
}


export async function speechRecognition(audioData) {
    logging('Распознавание речи');
    try{
        const DEEPINFRA_API_KEY = process.env.DEEPINFRA_API_KEY;
        const URL = "https://api.deepinfra.com/v1/inference/openai/whisper-large-v3"
    
        let data = {
            audio: audioData,
           // initial_prompt: "The sentence may be cut off or empty, do not make up words to fill in the rest of the sentence."
        };
        let response = await fetch (URL,{
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + DEEPINFRA_API_KEY
            },
            body: JSON.stringify(data),
        })

        let result = await response.json();
        let text = result.text;
        text = text.replaceAll("Куису", "Курису").replaceAll("куису", "Курису").replaceAll("Куис", "Курису").replaceAll("куис", "Курису").trim();

        return text;
        
    } catch (error) {
        logging('Ошибка при распознавании речи: ', error);
        return null;
    }


}


export async function delooping(dialogue,lastMessage,enabled){

    if(!enabled){
        logging("Проверка ответа на лупы отключена");
        return lastMessage;
    }

    if (dialogue.length < 6) {
        logging("Диалог слишком короткий для делупинга");
        return lastMessage;
    }


    let dialogueEdited = '';

    for (let i = 0; i < dialogue.length; i++) {
        if (dialogue[i].role == "user") {
            dialogueEdited += "<message>";
            dialogueEdited += "<role>user</role>\n<content>" + dialogue[i].content + "</content></message>\n\n";
        } else if (dialogue[i].role == "assistant") {
            dialogueEdited += "<message>";
            dialogueEdited += "<role>character</role>\n<content>" + dialogue[i].content.split("] ")[1] + "</content></message>\n\n";
        }
    }


    const SCENARIOS = JSON.parse(FS.readFileSync("./JSON/scenarios.json"));
    logging("Проверка ответа на лупы: "+lastMessage);

	try {


        let content = SCENARIOS.delooping.replaceAll("{{dialogue}}", dialogueEdited);



        let deloopingMessages = [
            {
                role: "user",
                parts: [{ text: content }]
            }
        ]


        let llmData = {};

    
        //let newMessage = messages.pop().parts[0].text;
        llmData.contents = deloopingMessages;
        
    
        let generationConfig = {
            temperature: 1.5,
            responseMimeType: "application/json",
            responseSchema: {
                type: "object",
                properties: {
                    degree_of_fixation: { type: "integer" },
                    degree_of_repetition: { type: "integer" },
                    edited_last_message: { type: "string" },
                },
                required: ["degree_of_fixation", "degree_of_repetition","edited_last_message"]
            }
          }
        
    
        const safetySettings = [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          }
        ];
    
        llmData.safetySettings = safetySettings;
        let headers = {
            'Content-Type': 'application/json'
        };
    
        llmData.generationConfig = generationConfig;

        let apiKey = process.env.GOOGLE_GEN_AI_KEY;
    
        const chat = await fetch ('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key='+apiKey, { 
            dispatcher: proxyAgent,
            headers: headers,
            method: 'POST', 
            body: JSON.stringify(llmData)
        })
    
        let result = await chat.json();
    
        let text = result.candidates[0].content.parts[0].text;
        let parsed = JSON.parse(text);
        let fixation = parsed.degree_of_fixation;
        let repetition = parsed.degree_of_repetition;
        let edited = parsed.edited_last_message;


        

        
        
        if (text.includes("null")){
            logging("Лупов не обнаружено");
            return lastMessage;
        } else {
            logging("Лупы обнаружены. Степень фиксации: " + fixation + ", cтепень повторения: " + repetition + "\n Редактированное последнее сообщение: " + edited);
            return edited;

        }

	} catch (error) {
		logging(error);
        return secondLine;
	}

}
