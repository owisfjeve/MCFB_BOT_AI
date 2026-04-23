const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require('express');
const axios = require('axios');

const app = express();
app.get('/', (req, res) => res.send('لوريس الصغير: أنا صاحي وجاهز! 🚀'));
app.listen(process.env.PORT || 10000);

const token = process.env.TELE_TOKEN;
const apiKey = process.env.GEMINI_API_KEY;

// تحديد الإصدار v1 لضمان الاستقرار
const genAI = new GoogleGenerativeAI(apiKey);

const bot = new TelegramBot(token, { polling: true });

bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    bot.sendChatAction(msg.chat.id, 'typing');

    try {
        // نستخدم الموديل المستقر جداً gemini-1.5-flash
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const result = await model.generateContent(msg.text);
        const text = result.response.text();
        bot.sendMessage(msg.chat.id, text);
    } catch (error) {
        console.error("Error Details:", error.message);
        
        // إذا فشل، نحاول بطريقة الـ API المباشرة (خطة إنقاذ)
        try {
            const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            const response = await axios.post(fallbackUrl, {
                contents: [{ parts: [{ text: msg.text }] }]
            });
            const fallbackText = response.data.candidates[0].content.parts[0].text;
            bot.sendMessage(msg.chat.id, fallbackText);
        } catch (err) {
            bot.sendMessage(msg.chat.id, "يا غالي، جوجل مسوية زحمة على السيرفر، جرب ترسل بعد ثواني.");
        }
    }
});
