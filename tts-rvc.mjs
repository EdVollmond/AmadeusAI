import FS from "fs";
import { client }  from "@gradio/client";
import { Client } from "@gradio/client";
import { logging } from "./logging.mjs";
import download from "download";
import path from "path";
import LanguageDetect from 'languagedetect';
import https from "https";
import Replicate from "replicate";
import * as fal from "@fal-ai/serverless-client";
import cld from "cld";
import 'dotenv/config'


export async function ttsRvcSend(text_prompt){
	let localHost = "http://localhost:8888";
    text_prompt = removeContentsInBracketsAndAsterisks(text_prompt);
try {
    logging("Отправка сообщения для озвучки на локальном сервере");
    logging(text_prompt);

    let response = await fetch(localHost+"/generate?text_prompt="+text_prompt);
    
    const audioData = await response;
    return audioData;

    } catch (error) {
        logging("Локальная озвучка недоступна");
        return null;
    }
}

//await saveVoiceData("По тупым закоулкам дремучего тела Мутно бродит душа, словно кошка в дыму.", "Max");


export async function saveVoiceData(text_prompt, userId) {


    const dirPath = 'public/audio/tmp/';

    FS.readdir(dirPath, (err, files) => {
    if (err) {
        console.error(err);
        return;
    }

    files.forEach((file) => {
        const filePath = path.join(dirPath, file);
        FS.unlink(filePath, (err) => {
        if (err) {
            console.error(err);
        }
        });
    });
    });


    try {
        const voiceData = await ttsRvcSend(text_prompt);
        let fileId = Math.floor(Math.random() * 1000000).toString();
        
        if (voiceData != null) {
            // Дождитесь завершения промиса и получите ArrayBuffer из voiceData
            let arrayBuffer = await voiceData.arrayBuffer();

            // Теперь, когда у вас есть arrayBuffer, создайте Buffer из него
            let buffer = Buffer.from(arrayBuffer);

            // Запишите buffer в файл синхронно, без использования callback
            FS.writeFileSync(dirPath + userId + fileId + '.wav', buffer);
            logging('Файл успешно сохранён.');
            logging(dirPath + userId + fileId + '.wav')

            return dirPath + userId + fileId + '.wav';
        } else {
            logging("Отправка сообщения для озвучки на удаленном сервере");
            logging(text_prompt);
            let lang = "en";

            let langDetected;

            try {
                langDetected = await cld.detect(text_prompt);
                let langCode = langDetected.chunks[0].code;

                if (langCode=="ru"){
                    lang = langCode;
                }
                // if (langCode=="ja"){
                //     lang = langCode;
                // }
            } catch (err) {
                try{
                    langDetected = lngDetector.detect(text_prompt,1)
                    if (langDetected[0][0].length>0){
                        langDetected = langDetected[0][0];
    
                        if (langDetected=="russian"){
                            lang = "ru";
                        }
    
                        // if (langDetected=="japanese"){
                        //     lang = "ja";
                        // }
                    }
                } catch (err) {
                    lang = "en";
                }

            }

            fal.config({
                credentials: process.env.FAL_CREDENTIALS
            });

            let falLanguage = 'English';

            if (lang == 'ru') {
                falLanguage = 'Russian';
            }

            if (lang == 'ja') {
                falLanguage = 'Japanese';
            }

            const result = await fal.subscribe("fal-ai/xtts", {
                input: {
                  prompt: text_prompt,
                  audio_url: "https://huggingface.co/Eadweard/xtts_kurisu/resolve/main/kurisu_"+lang+"_example.wav",
                  repetition_penalty: 5,
                  language: falLanguage,
                  temperature: 0.4,
                  gpt_cond_len: 30,
                  gpt_cond_chunk_len: 4,
                  max_ref_length: 60,
                  sample_rate: 24000
                },
                logs: false,
              });

            let fileUrl = result.audio_file.url;
            const destination = dirPath + userId + fileId + '.wav';
            //logging(result.data);

            FS.writeFileSync(destination, await download(fileUrl));
            
            
            logging('Файл успешно сохранён.');
            logging(dirPath + userId + fileId + '.wav')


            return dirPath + userId + fileId + '.wav';
        }
    } catch (err) {
        console.error('Произошла ошибка при сохранении файла:', err);
    }
}



function removeContentsInBracketsAndAsterisks(str) {

    try {
        // Удаление содержимого в скобках: (...)
        str = str.replace(/\([^)]*\)/g, '');
    
        // Удаление содержимого в звездочках: *...*
        str = str.replace(/\*[^*]*\*/g, '');
    
        return str;
    } catch {
        return str;
    }

  }