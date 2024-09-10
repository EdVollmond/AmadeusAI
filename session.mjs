import FS from "fs";
import {openaiSend} from "./llm.mjs";

import {encode} from 'gpt-tokenizer'
import { logging } from "./logging.mjs";


export async function scheduleProcess(instervalTime,charId){

    const REMAINING_TIME = 60 * 60 * 1000;

	let scheduleFile = JSON.parse(FS.readFileSync('JSON/schedule.json'));
    let schedule = scheduleFile[charId];

    for (let i = 0; i < schedule.length; i++){
        let task = schedule[i];
        if (task.remaining>0){
            task.remaining -= instervalTime;
            schedule[i] = task;
            scheduleFile[charId] = schedule;
            FS.writeFileSync('JSON/schedule.json', JSON.stringify(scheduleFile));
        } else {
            if (task.type == "send_telegram_message"){

                logging("Персонаж " + charId + " выполняет задачу "+ task.type + " для " + task.user);

                sendTelegramMessage(task.user,charId);
            }
        }


    }

}


function extractDigitsAndConvertToInt(str) {
    const digits = str.replace(/\D+/g, "");
    return parseInt(digits, 10);
  }

export async function sessionProcess(instervalTime,charId){
    
    const REMAINING_TIME = 60 * 60 * 1000;
    const USERS_DATA = JSON.parse(FS.readFileSync('JSON/users.json'));
	let sessionData = JSON.parse(FS.readFileSync('JSON/session_data.json'));

    
	for (let userId in sessionData){
        const USER_DATA = JSON.parse(FS.readFileSync('JSON/user_data/'+ userId +'.json'));

        if (USER_DATA[charId].current_chat.length > 0){
            let charSessionData = sessionData[userId][charId];
            if (charSessionData.time > 0){
                charSessionData.time -= instervalTime;
                FS.writeFileSync('JSON/session_data.json', JSON.stringify(sessionData));
            } else { //конец текущей сессии, архивация и создание тасок в шедулере
                charSessionData.time = null;
                charSessionData.remaining = new Date(REMAINING_TIME + Date.now());

                sessionData[userId][charId] = charSessionData;
                
                FS.writeFileSync('JSON/session_data.json', JSON.stringify(sessionData));
                await archiveCurrentChat(userId,charId,charSessionData.initiator);

                let scheduleFile = JSON.parse(FS.readFileSync('JSON/schedule.json'));
                let schedule = scheduleFile[charId];

                let remainingText = await answerRemainingTime(userId,charId);

                let remaining = extractDigitsAndConvertToInt(remainingText);

                if (remaining>1440||remaining<60){
                
                    //Рандомный выбор времени, через которое персонаж напишет сам
                    let remainingMin = 2 * 60 * 60 * 1000;
                    let remainingMax = 24 * 60 * 60 * 1000;

                    remaining = Math.floor(Math.random() * (remainingMax - remainingMin + 1) + remainingMin);
                
                } else {
                    remaining = remaining * 60 * 1000;
                }

                logging("Время ожидания следующего сообщения от персонажа " + charId + " для пользователя " + userId + ": " + remaining / 60 / 1000 + " минут");


                if (USERS_DATA[userId].telegram_chat_ids[charId]!=null&&USERS_DATA[userId].telegram_chat_ids[charId]!=undefined){
                    schedule.push({
                        type: "send_telegram_message",
                        user: userId,
                        remaining: remaining
                    });
                    scheduleFile[charId] = schedule;
                    FS.writeFileSync('JSON/schedule.json', JSON.stringify(scheduleFile));
                }

            }
		}
	}
}


async function archiveCurrentChat(userId,charId,initiator){

    logging("АРХИВАЦИЯ ЧАТА: " + userId + " " + charId);
	const USER = JSON.parse(FS.readFileSync('JSON/users.json'))[userId];
	const CHAR = JSON.parse(FS.readFileSync('JSON/chars/'+ charId +'.json'));
	let userData = JSON.parse(FS.readFileSync('JSON/user_data/'+ userId +'.json'));
	const SCENARIOS = JSON.parse(FS.readFileSync('JSON/scenarios.json'));
	let charData = userData[charId];
	let currentChat = charData.current_chat;
	let lastChats = charData.last_chats;
	let oldChats = charData.old_chats;
	let lastDialogue = [];
	let maxTokens = 16000;

    let userPersona = "";
    let longTermMemory = "";

    let expiredContent = SCENARIOS.telegram_online.replaceAll("{{USER}}",USER.name);

    let isExpired = false;
    if (currentChat.length == 3 && currentChat[1].content == expiredContent){
        isExpired = true;
    }

	while (currentChat.length>0){
		lastDialogue.push(currentChat[0]);
		currentChat.shift();
	}

    if (initiator == undefined){
        initiator = "assistant";
    }
    
    let role = initiator;
    let content;
    if (initiator == "assistant"){
        content = SCENARIOS.disconnect.replaceAll("{{USER}}", CHAR.name)
    } else if (initiator == "user"){
        if (isExpired){
            content = SCENARIOS.expired.replaceAll("{{USER}}", USER.name)
        } else {
            content = SCENARIOS.disconnect.replaceAll("{{USER}}", USER.name)
        }       
    } else {
        lastDialogue.pop();
        content = SCENARIOS.disconnect_maintenance.replaceAll("{{USER}}", CHAR.name)
    }

    let disconnectMessage = {
        role: role,
        content: content
    }

    lastDialogue.push(disconnectMessage);

    lastChats.push(lastDialogue);
	//считаем количество токенов в последних чатах

	let allLastChatsContent = "";
	for (let i = 0; i < lastChats.length; i++){
		for (let j = 0; j < lastChats[i].length; j++){
			allLastChatsContent += lastChats[i][j].content;
		}
	}
	let lastChatsTokens = encode(allLastChatsContent).length;

	//перекидываем половину диалогов в архив и формируем мнение о пользователе
	if (lastChatsTokens + 3000 > maxTokens){

        logging("Чат последних сообщений переполнен. Архивируем диалоги: " + userId + " " + charId);

        let oldChatsTokens;
		
        let llmSettings = {
            max_tokens: 512,
            tempeture: 0.2
        };

        let allOldChatsContent = '';

        let lastChatsSummary = '';

		for (let i = 0; i < lastChats.length/2; i++){
			
			for (let j = 0; j < lastChats[i].length; j++){
				let roleName = '';
				if (lastChats[i][j].role == "assistant"){
					roleName = CHAR.name;
				} else {
					roleName = USER.name;
				}
				lastChatsSummary += roleName + ": " + lastChats[i][j].content + "\n";
			}
			lastChatsSummary += "\n\n";
            oldChats.push(lastChats[i]);
            lastChats.shift();
		}

        //формируем долговременную память
        for (let i = 0; i < oldChats.length; i++){
            for (let j = 0; j < oldChats[i].length; j++){
                allOldChatsContent += oldChats[i][j].content;
            }
        }
        oldChatsTokens = encode(allOldChatsContent).length;

        while (oldChatsTokens > 32000){
            logging("Долговременная память переполнена. формируем выдержку из нее: " + userId + " " + charId);
            oldChats.shift();
            allOldChatsContent = ""
            for (let i = 0; i < oldChats.length; i++){
                for (let j = 0; j < oldChats[i].length; j++){
                    allOldChatsContent += oldChats[i][j].content;
                }
            }
            oldChatsTokens = encode(allOldChatsContent).length;
        }
        
        let oldChatsSummary = "";
        for (let i = 0; i < oldChats.length; i++){
            for (let j = 0; j < oldChats[i].length; j++){
                let roleName;
                if (oldChats[i][j].role == "assistant"){
                    roleName = CHAR.name;
                } else {
                    roleName = USER.name;
                }
                oldChatsSummary += roleName + ": " + oldChats[i][j].content + "\n";
            }
            oldChatsSummary += "\n\n";
        }

        let previousMemory = charData.long_term_memory;
        if (previousMemory != ""){
            previousMemory = "This is the previous one, you can add to it or correct it:\n" + previousMemory + "\nIf there are no changes or additions to the previous summary then return 'NO_CHANGES'";
        }

        let oldChatsMessages = [
            {role: "system", content: CHAR.prompts.create_memory.replaceAll("{{USER}}", USER.name)},
            {role: "user", content: oldChatsSummary},
        ];

        let allChatsSummary = lastChatsSummary;

        let previousPersona = charData.user_persona;
        if (previousPersona != ""){
            previousPersona = "This is the previous one, you can add to it or correct it:\n" + previousPersona + "\nIf there are no changes or additions to the previous personality breakdown then return 'NO_CHANGES'. Remember: only breakdown or 'NO_CHANGES', no additional replys.";
        } else {
            previousPersona = "Remember: only breakdown, no additional replys.";
        }

        let llmAllChatsMessages = [
            {role: "system", content: CHAR.prompts.user_persona.replaceAll("{{USER}}", USER.name)},
            {role: "user", content: allChatsSummary},
        ];
        
        
        userPersona = await openaiSend(llmAllChatsMessages, llmSettings, userId);

        logging("Персона пользователя " + userId + " для персонажа " + charId + ": " + userPersona);

        longTermMemory = await openaiSend(oldChatsMessages, llmSettings, userId);
        logging("Долговременная память персонажа " + charId + " о пользователе " + userId + ": " + longTermMemory);

        if (!longTermMemory.includes("NO_CHANGES")&&longTermMemory!=""){
            charData.long_term_memory = longTermMemory;
        }

        if (!userPersona.includes("NO_CHANGES")&&userPersona!=""){
            charData.user_persona = userPersona;
        }
	}


	charData.old_chats = oldChats;
	charData.last_chats = lastChats;

	userData[charId] = charData;

	FS.writeFileSync('JSON/user_data/'+ userId +'.json', JSON.stringify(userData));
}

export async function answerRemainingTime(userId,charId){

    logging("Узнаем время ожидания следующего сообщения от персонажа " + charId + " для пользователя " + userId);

	try {
        const PORT = 8000;
        const HOST = 'localhost';
		const CHAR_ID = charId;
		const USERS_DATA = JSON.parse(FS.readFileSync(`JSON/users.json`));
		const USER_ID = userId;
		const CURRENT_CHAT = JSON.parse(FS.readFileSync('JSON/user_data/'+ USER_ID +'.json'))[CHAR_ID].current_chat;
        const TELEGRAM_CHAT_ID = USERS_DATA[USER_ID].telegram_chat_ids[CHAR_ID];

		let text = "";

        let lastEmotion = '';
        let lastMessage = '';
        let regeneration = false;
        let delay = 60;

        if (CURRENT_CHAT.length>0){
            lastEmotion = CURRENT_CHAT[CURRENT_CHAT.length-1].content.split("]")[0].split("[")[1];
            lastMessage = CURRENT_CHAT[CURRENT_CHAT.length-1].content.split("]")[1];
        }

        let body = {
            token: USERS_DATA[USER_ID].token,
            connectionType: 'telegram',
            mode: 'deepinfra',
            //mode: 'test',
            regeneration: regeneration,
            voicing: false,
            lastEmotion: lastEmotion,
            lastMessage: lastMessage,
            userId: USER_ID,
            text: text,
            charId: CHAR_ID,
            fromCharacter: true,
            remainingQuestion: true,
        }

        let response = await fetch(`http://${HOST}:${PORT}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })

        if (response.ok) {
            const result = await response.json();
            if (result.code == 200){
                
                return result.text;
                
            } 
            logging(result);
        
        } else {
            logging('Error:', response.status, response.statusText);
            return "3000";
        }
	} catch (error) {
		logging(error);
        return "3000";
	}

}

async function sendTelegramMessage(userId,charId){
    
	try {
        const PORT = 8000;
        const HOST = 'localhost';
		const CHAR_ID = charId;
		const USERS_DATA = JSON.parse(FS.readFileSync(`JSON/users.json`));
		const USER_ID = userId;
		const CURRENT_CHAT = JSON.parse(FS.readFileSync('JSON/user_data/'+ USER_ID +'.json'))[CHAR_ID].current_chat;
        const TELEGRAM_CHAT_ID = USERS_DATA[USER_ID].telegram_chat_ids[CHAR_ID];

		let text = "";
		let reply = "";

        let lastEmotion = '';
        let lastMessage = '';
        let regeneration = false;
        let delay = 60;

        if (CURRENT_CHAT.length>0){
            lastEmotion = CURRENT_CHAT[CURRENT_CHAT.length-1].content.split("]")[0].split("[")[1];
            lastMessage = CURRENT_CHAT[CURRENT_CHAT.length-1].content.split("]")[1];
        }

        

        let body = {
            token: USERS_DATA[USER_ID].token,
            connectionType: 'telegram',
            mode: 'deepinfra',
            //mode: 'test',
            regeneration: regeneration,
            voicing: false,
            lastEmotion: lastEmotion,
            lastMessage: lastMessage,
            userId: USER_ID,
            text: text,
            charId: CHAR_ID,
            fromCharacter: true
        }

        let response = await fetch(`http://${HOST}:${PORT}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })

        if (response.ok) {
            const result = await response.json();
                if (result.code == 200){

                    sendMessage(TELEGRAM_CHAT_ID, CHAR_ID, USER_ID, result.text);

                } 
            logging(result);
        
        } else {
            logging('Error:', response.status, response.statusText);
        }
		

	} catch (error) {
		logging(error);
	}

}


export async function telegramSendPhoto(base64Image, chatId, charId, caption) {
  
    const KURISU = JSON.parse(FS.readFileSync("./JSON/chars/amadeus_kurisu.json"));
    const KURISU_BOT_TOKEN = KURISU.bot_token;
    
    const KURTIS = JSON.parse(FS.readFileSync("./JSON/chars/amadeus_kurtis.json"));
    const KURTIS_BOT_TOKEN = KURTIS.bot_token;

    
    let botToken = '';
    if (charId == 'amadeus_kurisu'){
        botToken = KURISU_BOT_TOKEN;
    } else if (charId == 'amadeus_kurtis'){
        botToken = KURTIS_BOT_TOKEN;
    }
    
    let file = dataURLtoFile(base64Image, 'image.jpeg');
    var data = new FormData()
    data.append('photo',file);
    data.append('chat_id', chatId);
    if (caption != ""&&caption != " "&&caption != "."&&caption != null&&caption != undefined){
        data.append('caption', caption);
    }
    const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;
    
    try {
      const response = await fetch(url, {
        method: "POST",
        processData: false,
        contentType: false,
        body: data,
      });
    
      if (response.ok) {
        console.log("Message sent successfully");
      } else {
        console.error("Error sending message:", await response.text());
      }
    } catch (error) {
        console.error("Error sending message:", error);
    }
    
    function dataURLtoFile(dataurl, filename = 'file') {
      let arr = dataurl.split(','),
          mime = arr[0].match(/:(.*?);/)[1],
          bstr = atob(arr[1]),
          n = bstr.length,
          u8arr = new Uint8Array(n);
    
      while(n--){
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, {type: mime});
    }
    
    
  
}

async function sendMessage(chatId, charId, userId, text) {

    const KURISU = JSON.parse(FS.readFileSync("./JSON/chars/amadeus_kurisu.json"));
    const KURISU_BOT_TOKEN = process.env.KURISU_BOT_TOKEN;
    
    const KURTIS = JSON.parse(FS.readFileSync("./JSON/chars/amadeus_kurtis.json"));
    const KURTIS_BOT_TOKEN =  process.env.KURTIS_BOT_TOKEN;


    /// КОСТЫЛИК реши вопрос
    if (text == ''){
        text = '...'
    } 

    let botToken = '';
    if (charId == 'amadeus_kurisu'){
        botToken = KURISU_BOT_TOKEN;
    } else if (charId == 'amadeus_kurtis'){
        botToken = KURTIS_BOT_TOKEN;
    }

    const USER_ID = userId;
    const CHAR_ID = charId;

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const data = { chat_id: chatId, text: text };
  
    let userData = JSON.parse(FS.readFileSync('JSON/user_data/'+ USER_ID +'.json'));
    let sessionData = JSON.parse(FS.readFileSync('JSON/session_data.json'));

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
  
      if (response.ok) {
        console.log("Message sent successfully");
        sessionData[USER_ID][CHAR_ID].time = 24 * 60 * 60 * 1000;
        FS.writeFileSync('JSON/session_data.json', JSON.stringify(sessionData));
      } else {
        console.error("Error sending message:", await response.text());
        userData[CHAR_ID].current_chat = [];
        FS.writeFileSync('JSON/user_data/'+ USER_ID +'.json', JSON.stringify(userData));
      }
    } catch (error) {
        console.error("Error sending message:", error);
        userData[CHAR_ID].current_chat = [];
        FS.writeFileSync('JSON/user_data/'+ USER_ID +'.json', JSON.stringify(userData));
    }
}