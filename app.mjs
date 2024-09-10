import HTTP from "http";
import crypto from 'crypto';
import FS from "fs";
import BODY_PARSER from "body-parser";
import { encode } from 'gpt-tokenizer';
import { Telegraf }from 'telegraf';
import { message } from 'telegraf/filters';
import { logging } from "./logging.mjs";
import { llmTranslate } from "./translate.mjs";
import { imageSend } from "./llm.mjs";
import { telegramSendPhoto } from "./session.mjs";
import { speechRecognition } from "./llm.mjs";
import { delooping } from "./llm.mjs";
import EXPRESS from 'express';
import PATH from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = PATH.dirname(__filename);

import { ollamaSend } from "./llm_local.mjs";
import { translate } from "./llm_local.mjs";
import { llmGenerate } from "./llm.mjs";

import { saveVoiceData } from "./tts-rvc.mjs";

import { sessionProcess } from "./session.mjs";
import { scheduleProcess } from "./session.mjs";

import 'dotenv/config'

let currentCharacter = "amadeus_kurisu";
if (process.argv.length>2){
	currentCharacter = process.argv[2];
}

const PORT = 8000;
const HOST = 'localhost';

const APP = EXPRESS();

const OPTIONS = {
	key: FS.readFileSync(__dirname+"/server.key"),
	cert: FS.readFileSync(__dirname+"/server.crt"),
	
};
//console.log(OPTIONS);

HTTP.createServer(OPTIONS, APP)
  .listen(PORT, function (req, res) {
	logging(`Запущен сервер на http://${HOST}:${PORT}`)
});


const sessionTime = 120 * 60000;

const instervalTime = 60000;

let chars = FS.readdirSync(__dirname+"/JSON/chars");

for (let i = 0; i < chars.length; i++){
	let charId = chars[i].replace(".json", "");
	await sessionProcess(instervalTime,charId);
	await scheduleProcess(instervalTime,charId);
}

let sessionJob = setInterval(async function(){


	for (let i = 0; i < chars.length; i++){
		let charId = chars[i].replace(".json", "");
		await sessionProcess(instervalTime,charId);
		await scheduleProcess(instervalTime,charId);
	}

}, instervalTime);
APP.use(BODY_PARSER.urlencoded({ extended: false }));
APP.use(BODY_PARSER.json({ limit: '100mb' }));

APP.set('view engine', 'ejs');
APP.set('views', PATH.join(__dirname, 'views'));

APP.use(EXPRESS.urlencoded({ extended: true }));

APP.use('/public', EXPRESS.static(PATH.join(__dirname, 'public')));

APP.get('/', function(req, res){
	logging("Запрос на главную: "+ JSON.stringify(req.headers));
	res.sendFile(__dirname+'/public/index.html');
});

APP.get('/chat', function(req, res){
	logging("Запрос на чат: "+ JSON.stringify(req.headers));
	res.sendFile(__dirname+'/public/chat.html');
});

APP.post('/token_check', function(req, res){
	logging("Запрос на проверку токена: "+ JSON.stringify(req.headers)+" "+JSON.stringify(req.body));

	res.statusCode = 200
	let token = req.body.token;
	logging("Токен: " + token);


	
	const USERS_DATA = JSON.parse(FS.readFileSync(__dirname+"/JSON/users.json"));
	const SESSION_DATA = JSON.parse(FS.readFileSync(__dirname+"/JSON/session_data.json"));

	const CHAR_ID = req.body.charId;
	
	let responseBody = {};

	let checkingUser = findUserByToken(USERS_DATA, token);

	const USER_DATA = JSON.parse(FS.readFileSync(__dirname+"/JSON/user_data/"+checkingUser+".json"));

	let remaining = false;

	if (checkingUser == null){
		logging("Токен не найден");
		responseBody = {user: null, code: 401, error: "Unauthorized"};
		res.end(JSON.stringify(responseBody));
	} else {
		logging("Токен найден. Юзер: " + checkingUser);
		const USER = JSON.parse(FS.readFileSync('JSON/user_data/'+ checkingUser +'.json'));
		responseBody.user = checkingUser;
		responseBody.username = USERS_DATA[checkingUser].name;
		responseBody.chat = USER;
		responseBody.code = 200;

		let remainingTime = new Date (SESSION_DATA[checkingUser][CHAR_ID].remaining);

		if (remainingTime > Date.now()){
			logging("Юзеру осталось времени до доступности: " + (remainingTime - Date.now()) / 1000 + " секунд");
			remaining = true;
		}

		let settings = USER_DATA[CHAR_ID].settings;

		responseBody.settings = JSON.stringify(settings);

		responseBody.remaining = remaining;

		logging("Посылаем ответ на фронт: " + JSON.stringify(responseBody));
		res.end(JSON.stringify(responseBody));
	};
});

APP.get('/favicon.ico', function(req, res){
	res.statusCode = 200;
	res.sendFile(__dirname+'/favicon.ico');
});

APP.get('/login', function(req, res){
	logging("Запрос на логин: "+ JSON.stringify(req.headers));
	res.statusCode = 200;
	console.log("LOGGING")
	res.sendFile(__dirname+'/public/login.html');
});


APP.post('/login', function(req, res){
	logging("Запрос на логин: "+ JSON.stringify(req.headers)+" "+JSON.stringify(req.body));
	res.statusCode = 200;
	let body = req.body;
	let user = body.userId;
	let loginPassword = body.password;
	let token = generateToken(user,loginPassword);
	let usersData = JSON.parse(FS.readFileSync(__dirname+"/JSON/users.json"));
	
	logging("Данные пользователя: " + usersData);
	let error = "";
	if (usersData[user]) {
		if (token == usersData[user].token){
			logging("Пароль и логин верны. Токен: " + token);
			res.redirect("/?token=" + token);
		} else {
			logging("Пароль и логин не верны");
			error = "password"; //"AUTHENTIFICATION ERROR: INCORRECT PASSWORD"
			res.redirect('/login/?error='+error);
			
		};
	} else {
		logging("Пользователь не найден");
		error = "user"; //"AUTHENTIFICATION ERROR: USER ID NOT FOUND"
		res.redirect('/login/?error='+error);
	};

});


APP.post('/translate', async function (req,res){
	
	let token = req.body.token;

	res.statusCode = 200;

	const USERS_DATA = JSON.parse(FS.readFileSync(`JSON/users.json`));
	

	let checkingUser = findUserByToken(USERS_DATA, token);


	console.log("Проверка токена для запроса чата")
	if (checkingUser == null){
		console.log("Токен не найден");
		responseBody = {code: 401, error: "Unauthorized"};
		return res.end(JSON.stringify(responseBody));

	} else {
		console.log("Токен найден. Юзер: " + checkingUser);
	};


	//вытаскиваем данные из запроса
	let reqBody = req.body;
	let target = reqBody.target;
	let text = reqBody.text;
	let source = reqBody.source;

	let translated = await translate(text,source,target);

	let body = {};

	body.translatedText = translated;

	return res.end(JSON.stringify(body));


});

APP.post('/chat', async function(req, res){
	logging("Запрос на чат: "+ JSON.stringify(req.headers)+" "+JSON.stringify(req.body));
	try {
		
		const LLM_SETTINGS_LOCAL = JSON.parse(FS.readFileSync(`JSON/llm_settings_local.json`));
		let token = req.body.token;
		res.statusCode = 200;
		const USERS_DATA = JSON.parse(FS.readFileSync(`JSON/users.json`));
		let checkingUser = findUserByToken(USERS_DATA, token);
		const SESSION_DATA = JSON.parse(FS.readFileSync(__dirname+"/JSON/session_data.json"));
		const CHAR_ID = req.body.charId;
		let responseBody = {};

		logging("Проверка токена для запроса чата: " + checkingUser)
		if (checkingUser == null){
			logging("Токен не найден");
			responseBody = {code: 401, error: "Unauthorized"};
			return res.end(JSON.stringify(responseBody));

		} else {
			logging("Токен найден. Юзер: " + checkingUser);
			const USER = JSON.parse(FS.readFileSync('JSON/user_data/'+ checkingUser +'.json'));
			
			responseBody.user = checkingUser;
			responseBody.username = USERS_DATA[checkingUser].name;
			responseBody.chat = USER;
			responseBody.code = 200;
	
			let remainingTime = new Date (SESSION_DATA[checkingUser][CHAR_ID].remaining);
			let remaining = false;
			if (remainingTime > Date.now() && !req.body.remainingQuestion){
				logging("Осталось времени до доступности: " + (remainingTime - Date.now()) / 1000 + " секунд");
				remaining = true;
				responseBody.remaining = remaining;
				responseBody.code = 403;
				return res.end(JSON.stringify(responseBody));
			}
		};


		//вытаскиваем данные из запроса
		let reqBody = req.body
		
		let text = reqBody.text;
		let charId = reqBody.charId;
		let userId = reqBody.userId;
		let lastEmotion = reqBody.lastEmotion;
		let lastMessage = reqBody.lastMessage;
		let regeneration = JSON.parse(reqBody.regeneration);
		let mode = reqBody.mode;
		let voicing = JSON.parse(reqBody.voicing);
		let connectionType = reqBody.connectionType;

		let fromCharacter = false;
		if (reqBody.fromCharacter){
			fromCharacter = true;
		}

		let remainingQuestion = false;
		if (reqBody.remainingQuestion){
			remainingQuestion = true;
		}

		let noAss = false;
		if (reqBody.noAss){
			noAss = true;
		}

		let deloopingEnabled = false;
		if (reqBody.delooping){
			deloopingEnabled = true;
		}
		
		const USER = USERS_DATA[userId];
		let userName = USER.name;
		let initiator;

		const CHATS = JSON.parse(FS.readFileSync('JSON/user_data/'+ userId +'.json'));
		const CHAR = JSON.parse(FS.readFileSync('JSON/chars/'+ charId +'.json'));

		let remaining = false;
		let remainingTime = new Date(SESSION_DATA[checkingUser][charId].remaining);

		if (remainingTime > Date.now()&& !req.body.remainingQuestion){
			remaining = true;
			let data = {
				remaining: remaining,
			};
			return res.end(JSON.stringify(data));
		}

		let isEnd = false;
		let llmResponse = "";




		
		if (reqBody.audioData!=undefined){
			logging('Пришло аудио с микрофона пользователя');
			let audioData = reqBody.audioData;
			let recognized = await speechRecognition(audioData);

			if (recognized == null){
				let data = {
					emotion: "ERROR",
					text: "ERROR",
					error: "RECOGNITION_ERROR"
				};
				return res.end(JSON.stringify(data));
			} else {
				text = recognized;
			}
		}



		logging("Запрос к языковой модели: " + text);
		if (mode == "test"){ //посылает запрос на тестовую API
			llmResponse = testLLM();
		} else {
			if (mode == "deepinfra"){
				llmResponse = await llmGenerate(userId,charId,connectionType,fromCharacter,text,regeneration,remainingQuestion,noAss);
			}else if (mode == "local"){
				llmResponse = await ollamaSend(gptBody);
			}
			if (llmResponse == "ERROR") {
				logging("ОШИБКА ЗАПРОСА К ЯЗЫКОВОЙ МОДЕЛИ: " + JSON.stringify(llmResponse));
				let data = {
					emotion: "ERROR",
					text: "ERROR"
				};
				return res.end(JSON.stringify(data));
			}
		};
		
		
		if (llmResponse == "ERROR") {
			logging("ОШИБКА ЗАПРОСА К ЯЗЫКОВОЙ МОДЕЛИ: " + JSON.stringify(llmResponse));
			let responseData = {
				emotion: "ERROR",
				text: "ERROR"
			};
			return res.end(JSON.stringify(responseData));
		} else {
			logging("Запрос к языковой модели выполнен успешно: " + JSON.stringify(llmResponse));

			if (remainingQuestion){

				responseBody.user = checkingUser;
				responseBody.username = USERS_DATA[checkingUser].name;
				responseBody.chat = USER;
				responseBody.code = 200;
				responseBody.text = llmResponse.text;
				
				return res.end(JSON.stringify(responseBody));

			}

			let stopWordsFinded = stopWordsFind(llmResponse,true);
			isEnd = stopWordsFinded.isEnd;
			llmResponse.text = stopWordsFinded.text;
			initiator = stopWordsFinded.initiator;

			let chat = [];

			responseBody.text = llmResponse.text;
			responseBody.emotion = llmResponse.emotion;
			responseBody.isEnd = isEnd;
			responseBody.remaining = remaining;
			responseBody.isPhotoSended = false;
			
			let base64Image = "";
			let messageAboutPhoto = "";

			if (llmResponse.base64Image != undefined&& messageAboutPhoto != undefined) {
				base64Image = llmResponse.base64Image;
				let userData = JSON.parse(FS.readFileSync('JSON/user_data/'+ userId +'.json'));
				if (llmResponse.messageAboutPhoto != undefined) {
					messageAboutPhoto = llmResponse.messageAboutPhoto;
				}

				if (llmResponse.text != ""&&llmResponse.text != " "&&messageAboutPhoto!="") {
					messageAboutPhoto = messageAboutPhoto + "\n\n"
				}
				if (!regeneration) {

					userData[charId].current_chat.push(
						{role: "user", content: llmResponse.userText}
					);

					userData[charId].current_chat.push(
						{role: "assistant", content: "[" + llmResponse.emotion + "] " + messageAboutPhoto + llmResponse.text}
					);
				} else {

					userData[charId].current_chat.pop();
					userData[charId].current_chat.pop();

					userData[charId].current_chat.push(
						{role: "user", content: llmResponse.userText}
					);

					userData[charId].current_chat.push(
						{role: "assistant", content: "[" + llmResponse.emotion + "] " + messageAboutPhoto + llmResponse.text}
					);
				}

				try{
					const USERS_DATA = JSON.parse(FS.readFileSync(`JSON/users.json`));
					const TELEGRAM_CHAT_ID = USERS_DATA[userId].telegram_chat_ids[charId];
					await telegramSendPhoto(base64Image, TELEGRAM_CHAT_ID, charId, llmResponse.text);
					logging("Telegram send photo success");
					FS.writeFileSync('JSON/user_data/'+ userId +'.json', JSON.stringify(userData));
					responseBody.isPhotoSended = true;
					return res.end(JSON.stringify(responseBody));
				} catch (error) {
					logging("Telegram send photo error: " + error);
				}

				

			}


			



			let currentChat = CHATS[charId].current_chat;
			let deloopedText = '';
			logging("Текущий чат: " + JSON.stringify(currentChat));

			if (currentChat.length == 0) { //если чат пустой
				deloopedText = llmResponse.text;
				if (llmResponse.systemMessage != "") {
					chat.push({role: "system", content: llmResponse.systemMessage});
				}
				chat.push({role: "user", content: llmResponse.userText});
				chat.push({role: "assistant", content: "[" + llmResponse.emotion + "] " + llmResponse.text});
			} else {

				let oldPart = currentChat;
				oldPart.pop();

				let newPart = [];
				if (!regeneration) {
					newPart.push({role: "assistant", content: "[" + lastEmotion + "] " + lastMessage});
					newPart.push({role: "user", content: llmResponse.userText});
					newPart.push({role: "assistant", content: "[" + llmResponse.emotion + "] " + llmResponse.text});
				} else {
					
					newPart.push({role: "assistant", content: "[" + llmResponse.emotion + "] " + llmResponse.text});
				};

				chat = oldPart.concat(newPart);

				deloopedText = await delooping(chat,llmResponse.text,deloopingEnabled);

				chat[chat.length - 1].content = "[" + llmResponse.emotion + "] " + deloopedText;
				
			};

			CHATS[charId].current_chat = chat;

			responseBody.chat = chat;

			let currentSessionTime = sessionTime;

			if (isEnd) {
				currentSessionTime = 0;
			}

			if (voicing){

				logging("Генерация голоса...");

				//let textToVoice = "";
				// ПЕРЕВОД НА ЯПОНСКИЙ
				//textToVoice = await translate(llmResponse.text,"auto","ja");
				//textToVoice = llmResponse.text;
				responseBody.audioUrl = await saveVoiceData(deloopedText, userId);
				
			}

			let sessionData = SESSION_DATA;
			
			sessionData[userId][charId].time = currentSessionTime;
			sessionData[userId][charId].initiator = initiator;

			let scheduleFile = JSON.parse(FS.readFileSync('JSON/schedule.json'));
			let schedule = scheduleFile[charId];

			for (let i = 0; i < schedule.length; i++) {
				let task = schedule[i];
				if (task.user == userId) {
					schedule.splice(i, 1);
				}
			}

			scheduleFile[charId] = schedule;

			let settings = USERS_DATA[userId].settings;
			responseBody.settings = settings;

			responseBody.text = deloopedText;

			FS.writeFileSync('JSON/schedule.json', JSON.stringify(scheduleFile));

			FS.writeFileSync('JSON/session_data.json', JSON.stringify(sessionData));

			// запись в файлик
			FS.writeFileSync('JSON/user_data/'+ userId +'.json', JSON.stringify(CHATS));
		
			
			//возврат респонса на фронт
			logging("ОТПРАВКА РЕСПОНСА НА ФРОНТ: " + JSON.stringify(responseBody))
			
			

			return res.end(JSON.stringify(responseBody));
		};	
	} catch (error) {
		logging(error);
		console.log(error);
		return res.end(JSON.stringify({error: error}));
	}
	
});



APP.post('/change_history', async function(req, res){
	
	logging("ЗАПРОС НА РЕДАКТИРОВАНИЕ ИСТОРИИ")

	let reqBody = req.body;
	let token = reqBody.token;

	let settings = JSON.parse(reqBody.settings);
	
	res.statusCode = 200;

	const USERS_DATA = JSON.parse(FS.readFileSync(`JSON/users.json`));
	

	let charId = reqBody.charId;
	let userId = reqBody.userId;
	let type = reqBody.type;
	const USER = USERS_DATA[userId];
	let username = USER.name;

	let checkingUser = findUserByToken(USERS_DATA, token);

	let responseBody = {}


	const CHATS = JSON.parse(FS.readFileSync('JSON/user_data/'+ userId +'.json'));

	logging("Проверка токена для запроса чата")
	if (checkingUser == null){
		logging("Токен не найден");
		responseBody = {code: 401, error: "Unauthorized"};
		return res.end(JSON.stringify(responseBody));

	} else {
		logging("Токен найден. Юзер: " + checkingUser);
	};


	//проверка, есть ли история сообщений с пользователем
	if (charId in CHATS){
		logging("ИСТОРИЯ НЕ ПУСТАЯ");
		
		let currentChat = CHATS[charId].current_chat;
		logging("ТЕКУЩИЙ ЧАТ: " + currentChat);
		
		let lastMessFromUser = '';
		let lastMessFromCharCount = 0;

		logging("ТИП РЕДАКТИРОВАНИЯ: "+type)
		
		if (type == "remove") {
			if (currentChat.length>0){
				
				
				let lastMessFromChar = currentChat.pop().content;
				let lastMessFromUser = currentChat.pop().content;


				if (currentChat[currentChat.length-1].role == "system"||currentChat[currentChat.length-1].role == "user"){
					currentChat.pop();
				}
				
				let lastEmotion = lastMessFromChar.split("]")[0].split("[")[1];
				let text = lastMessFromChar.split("]")[1];

				responseBody = {
					chat: currentChat,
					lastRequest: lastMessFromUser,
					text: text,
					emotion: lastEmotion,
					error:""

				};
			}


			CHATS[charId].current_chat = currentChat;
			// запись в файлик
			FS.writeFileSync('JSON/user_data/'+userId+'.json', JSON.stringify(CHATS));

			return res.end(JSON.stringify(responseBody));

		} else if (type == "clear") {

			currentChat = [];
			
			responseBody = {
				chat: currentChat,
				error:""
			};

			CHATS[charId].current_chat = currentChat
			// запись в файлик
			FS.writeFileSync('JSON/user_data/'+userId+'.json', JSON.stringify(CHATS));

			return res.end(JSON.stringify(responseBody));

			
		} else if (type == "settingsSave") {
			
			let lastMessFromChar = currentChat[currentChat.length-1].content;
			let lastMessFromUser = currentChat[currentChat.length-2].content;

			let lastEmotion = lastMessFromChar.split("]")[0].split("[")[1];
			let text = lastMessFromChar.split("]")[1];

			CHATS[charId].settings = settings;

			responseBody = {
				chat: currentChat,
				lastRequest: lastMessFromUser,
				text: text,
				emotion: lastEmotion,
				settings: settings,
				error:""
			};
			FS.writeFileSync('JSON/user_data/'+userId+'.json', JSON.stringify(CHATS));

			return res.end(JSON.stringify(responseBody));

		} else if (type == "settingsDefault") {
				
			let lastMessFromChar = currentChat[currentChat.length-1].content;
			let lastMessFromUser = currentChat[currentChat.length-2].content;

			let lastEmotion = lastMessFromChar.split("]")[0].split("[")[1];
			let text = lastMessFromChar.split("]")[1];
			
			CHATS[charId].settings = null;

			responseBody = {
				chat: currentChat,
				lastRequest: lastMessFromUser,
				text: text,
				emotion: lastEmotion,
				settings: null,
				error:""
			};
			FS.writeFileSync('JSON/user_data/'+userId+'.json', JSON.stringify(CHATS));

			return res.end(JSON.stringify(responseBody));
		
		
		} else {
			responseBody = {error: "Unknown type"};
			return res.end(JSON.stringify(responseBody));
		};


	}else{
		responseBody = {error: "History not found"};
		return res.end(JSON.stringify(responseBody));
	}
	

	
});


if (currentCharacter == "amadeus_kurisu"){

	const KURISU = JSON.parse(FS.readFileSync(__dirname+"/JSON/chars/amadeus_kurisu.json"));

	const KURISU_BOT_TOKEN = process.env.KURISU_BOT_TOKEN;
	const kurisu_bot = new Telegraf(KURISU_BOT_TOKEN);

	kurisu_bot.on('message',async (ctx) => {
		console.log(ctx.message.chat.id);
		try {
			botMessageProcess(ctx, 'amadeus_kurisu');
		} catch (error) {
			console.log(error);
		}
	});
	kurisu_bot.launch()


	process.once('SIGINT', () => kurisu_bot.stop('SIGINT'))
	process.once('SIGTERM', () => kurisu_bot.stop('SIGTERM'))

	logging("Kurisu bot started");

} else if (currentCharacter == "amadeus_kurtis"){


	const KURTIS = JSON.parse(FS.readFileSync(__dirname+"/JSON/chars/amadeus_kurtis.json"));
	const KURTIS_BOT_TOKEN = process.env.KURTIS_BOT_TOKEN;
	const kurtis_bot = new Telegraf(KURTIS_BOT_TOKEN);
	kurtis_bot.on('message',async (ctx) => {
		console.log(ctx.message.chat.id);
		try {
			await botMessageProcess(ctx, 'amadeus_kurtis');
		} catch (error) {
			console.log(error);
		}
	});
	kurtis_bot.launch()


	process.once('SIGINT', () => kurtis_bot.stop('SIGINT'))
	process.once('SIGTERM', () => kurtis_bot.stop('SIGTERM'))

	logging("Kurtis bot started");
}





async function botMessageProcess(ctx, charId){


	let translationHistoryFile = JSON.parse(FS.readFileSync(`JSON/telegram_translation.json`));

	const USERS_DATA = JSON.parse(FS.readFileSync(`JSON/users.json`));
	const USER_ID = findUserByTelegram(USERS_DATA, ctx.from.username,);

	if (USER_ID == null){
		console.log('Error:', "USER NOT FOUND OR NOT REGISTERED");
		return
	}

	const CURRENT_CHAT = JSON.parse(FS.readFileSync('JSON/user_data/'+ USER_ID +'.json'))[charId].current_chat;
	const USER_NAME = USERS_DATA[USER_ID].name;
	const SCENARIOS = JSON.parse(FS.readFileSync('JSON/scenarios.json'));

	let text = '';

	if (ctx.message.photo != undefined){

		logging("В сообщении есть картинка");

		if (ctx.message.caption != undefined){
			text = ctx.message.caption;
		}
		const fileId = ctx.msg.photo[1].file_id;
		const file = await ctx.telegram.getFileLink(fileId);
		const url = file.href;

		console.log("Ссылка на картинку: "+url);

		let desciption = await imageSend(url, USER_ID);
		
		if (desciption != ""&&text!=""&&text != " "&&text != "."&&text != null&&text != undefined){
			text = "\n\n" + text;
		}

		text = "*" + USER_NAME + " has attached an image. " + desciption + "*" + text;
	

	} else {
		text = ctx.message.text;
	}


	
	let reply = "";
	let chatId = ctx.message.chat.id.toString();

	if (text == '/start'){
		reply = SCENARIOS.connection_established.replaceAll("{{USER}}", USER_NAME);
		let userData = USERS_DATA;
		userData[USER_ID].telegram_username = ctx.from.username;
		let ids = userData[USER_ID].telegram_chat_ids;
		logging("Запрос начала телеграм чата от пользователя " + ctx.from.username + ", id чата: " + chatId);
		ids[charId] = chatId;
		userData[USER_ID].telegram_chat_ids = ids;
		FS.writeFileSync('JSON/users.json', JSON.stringify(userData));

		ctx.reply(reply);
	} else if (text == '/translate'){

		let previosMessage = translationHistoryFile[USER_ID][charId];
		ctx.deleteMessage(ctx.message.message_id);
		let translatedText = await llmTranslate(previosMessage,"ru");
		let translation = SCENARIOS.translation_message.replaceAll("{{MESSAGE}}", translatedText);
		ctx.reply(translation);

	} else {
		let lastEmotion = '';
		let lastMessage = '';
		let regeneration = false;
		let delay = 60;

		if (CURRENT_CHAT.length>0){
			lastEmotion = CURRENT_CHAT[CURRENT_CHAT.length-1].content.split("]")[0].split("[")[1];
			lastMessage = CURRENT_CHAT[CURRENT_CHAT.length-1].content.split("]")[1];
		}

		if (text == '/regenerate'){
			let userData = JSON.parse(FS.readFileSync('JSON/user_data/'+ USER_ID +'.json'));
			let currentChat = userData[charId].current_chat;
			let lastMessageRole = currentChat[currentChat.length-1].role;
			let prelastMessageRole = currentChat[currentChat.length-2].role;
			if (lastMessageRole == 'assistant' && prelastMessageRole == 'assistant'){
				return
			} else {
				regeneration = true;
			}
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
			charId: charId,
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

				if (!result.isPhotoSended){
					if (regeneration){
						try {
							ctx.deleteMessage(ctx.message.message_id);
							ctx.deleteMessage(ctx.message.message_id-1);
						} catch(error) {
							logging("Error: ", error);
						}
					}

					if (result.text != "."&&result.text != " "&&result.text != ""){
						translationHistoryFile[USER_ID][charId] = result.text;
						FS.writeFileSync('JSON/telegram_translation.json', JSON.stringify(translationHistoryFile));
	
						ctx.sendChatAction('typing');
						let typeTime = delay * result.text.length;
						//ctx.reply(translated);
						ctx.reply(result.text);
						// setTimeout(function(){
						// 	ctx.reply(result.text);
						// },typeTime);
					}
				} else {
					console.log("Фото уже отправлено");
				}


			} else if (result.code == 403||result.remaining){
				ctx.reply(SCENARIOS.remaining);
			}

			//logging("Ответ языковой модели: "+ JSON.stringify(result));
			console.log(result);
			logging("ТЕКСТ ОТВЕТА ПЕРСОНАЖА: " + JSON.stringify(result.text));
			logging("ЭМОЦИЯ ПЕРСОНАЖА: " + JSON.stringify(result.emotion));
		
		} else {
			logging('Error:', response.status, response.statusText);
		}
	}

}

function generateToken(data, key) {
	// Создаем инстанс HMAC с алгоритмом (например, "sha256") и ключом
	const hmac = crypto.createHmac('sha256', key);
  
	// Обновляем HMAC данными для хеширования
	hmac.update(data);
  
	// Получаем и возвращаем хеш в шестнадцатеричном формате
	return btoa(hmac.digest('hex'));
}

function findUserByToken(users, token) {
	for (let key in users) {
	  if (users[key].token == token) {
		return key;
	  }
	}
	return null;
}

function findUserByTelegram(users, username) {
	for (let key in users) {
	  if (users[key].telegram_username == username) {
		return key;
	  }
	}
	return null;
}



function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}

function testLLM(){

	const EMOTIONS_ARRAY = ['angry','apathetic','blushed','happy','playful','serious','thoughtful','calm','displeased','glad','moody','sad','skeptical','surprised','neutral','glitchy'];

	let randomEmotion = EMOTIONS_ARRAY[getRandomInt(EMOTIONS_ARRAY.length)];
	let abc = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvXxYyZz";
    let randomMessage = "";
    while (randomMessage.length < 64) {
        randomMessage += abc[Math.floor(Math.random() * abc.length)];
    }

	let data = {
		text: randomMessage,
		emotion: randomEmotion
	
	}
	
	return data;
};



function stopWordsFind(llmResponse,needToDelete) {
	logging("Проверка стоп-слов");
	let stopWords = [
		"END_OF_DIALOGUE","END OF DIALOGUE","END OF DIALOG","END_OF_DIALOG","End_of_dialogue","End of dialogue","End of dialog","End_of_dialog","end_of_dialogue","end of dialogue","end of dialog","end_of_dialog"
	];
	let result = {};
	for (let i = 0; i < stopWords.length; i++) {
		let stopWord = stopWords[i];
		
		if (llmResponse.text.includes(stopWord)) {
			if (needToDelete) {

				result.text = llmResponse.text.replace(stopWord,"");

				return result;
			} else {
				logging("Стоп-слово найдено: " + stopWord+ ", диалог будет завершен");
				result.isEnd = true;
				result.text = llmResponse.text;
			}
			
			if (llmResponse.emotion == "glitchy") {
				result.initiator = "system";
			} else {
				result.initiator = "assistant";
			}
			return result;

		} else {
			result.text = llmResponse.text;
			result.isEnd = false;
			result.initiator = "user";
		}
	}

	return result;
}
