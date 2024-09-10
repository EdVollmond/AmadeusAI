import ollama from 'ollama';
import OpenAI from "openai";
import {removeStarredText} from "./llm.mjs";

let translatorHost = "http://localhost:5000";

export async function ollamaSend(chat){
  try {
    console.log("Отправка запроса языковой модели:");
    console.log(chat);
    const response = await ollama.chat({
      model: chat.model,
      messages: chat.messages,
    });
    console.log("Получен ответ от языковой модели:");
    console.log(response);
    return response;
  }
  catch(error) {
    console.log("Ошибка запроса");
    console.log(error);
    return error;
  }
}

export async function detectLanguage(message){
  try {
    console.log("Проверка языка для сообщения:");
    console.log(message);
    const res = await fetch(translatorHost+"/detect", {
      method: "POST",
      body: JSON.stringify({
        q: message,
        api_key: ""
      }),
      headers: { "Content-Type": "application/json" }
    });
    let response = await res.json();
    let language = response[0].language;
    
    console.log("Язык сообщения: "+language);
    return language;
  } catch (error) {
    console.log("Ошибка проверки:");
    console.log(error);
    return error;
  }
}

export async function translate(message,sourceLanguage,targetLanguage){
  try {
    message = removeStarredText(message);
    console.log("Перевод сообщения:");
    console.log(message);
    const res = await fetch(translatorHost+"/translate", {
      method: "POST",
      body: JSON.stringify({
        q: message,
        source: sourceLanguage,
        target: targetLanguage,
        format: "text",
        alternatives: 0,
        api_key: ""
      }),
      headers: { "Content-Type": "application/json" }
    });
    let response = await res.json();
    let translatedText = response.translatedText;
    
    console.log("Переведенное сообщение: "+translatedText);
    return translatedText;
  } catch (error) {
    console.log("Ошибка перевода:");
    console.log(error);
    return error;
  }
}
