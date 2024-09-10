import OpenAI from "openai";

export async function llmTranslate(text, lang){
    console.log("Изначальный текст: " + text);
    
    let apiKey = process.env.DEEPINFRA_API_KEY;

    const openai = new OpenAI({
        baseURL: 'https://api.deepinfra.com/v1/openai',
        apiKey: apiKey,
    });


    let content = "";

    if (lang == "ru"){
        content = "You are the professional translator of fiction. PLEASE, WRITE ONLY TRANSLATION WITHOUT ANY ADDITONAL TEXT OR YOUR COMMENTS. Do not add any comments or notes under any circumstances. Translate the following text to Russian. If text has the text from different languages, you mus to translate all of it to Russian. If the text is already in Russian, then simply repeat it without changes.";
    } else if (lang == "en"){
        content = "You are the professional translator of fiction. PLEASE, WRITE ONLY TRANSLATION WITHOUT ANY ADDITONAL TEXT OR YOUR COMMENTS. Do not add any comments or notes under any circumstances. Translate the following text to English. If text has the text from different languages, you mus to translate all of it to English. If the text is already in English, then simply repeat it without changes.";
    }

    let data = {
        messages: [{ role: "system", content: content },{ role: "user", content: text }],
        model: "meta-llama/Meta-Llama-3.1-70B-Instruct",
        temperature: 0.3,
        max_tokens: 512
    }


    const completion = await openai.chat.completions.create(data);

    let translation = completion.choices[0].message.content;

    console.log("Перевод на язык " + lang + ": " + translation);

    return translation;
}

