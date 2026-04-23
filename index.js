const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require('express');
const axios = require('axios'); // بنستخدمه عشان البوت ينغز نفسه ويظل صاحي

const app = express();
const port = process.env.PORT || 10000;

app.get('/', (req, res) => res.send('لوريس الصغير 2.0: أنا صاحي وما راح أنام! 🚀'));
app.listen(port, () => console.log(`السيرفر شغال على منفذ ${port}`));

const token = process.env.TELE_TOKEN;
const apiKey = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(apiKey);

// استخدمنا gemini-1.5-flash مع معالجة ذكية للاسم لضمان القبول
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash"
});

const bot = new TelegramBot(token, { polling: true });

// --- كود "ضد النوم" (Keep Alive) ---
// استبدل الرابط اللي تحت برابط موقعك في Render
const RENDER_URL = "https://mcfb-autonomous.onrender.com"; 

setInterval(() => {
    axios.get(RENDER_URL).then(() => {
        console.log("نغزت السيرفر عشان ما ينام! ⚡");
    }).catch(err => console.log("خطأ بسيط في النغزة، مو مشكلة."));
}, 600000); // ينغز نفسه كل 10 دقائق
// ----------------------------------

bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;

    bot.sendChatAction(msg.chat.id, 'typing');

    try {
        const result = await model.generateContent(msg.text);
        const response = await result.response;
        bot.sendMessage(msg.chat.id, response.text());
    } catch (error) {
        console.error("Gemini Error:", error.message);
        // محاولة أخيرة لو فشل الفلاش يستخدم البرو تلقائياً
        try {
            const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
            const fallbackResult = await fallbackModel.generateContent(msg.text);
            bot.sendMessage(msg.chat.id, fallbackResult.response.text());
        } catch (err) {
            bot.sendMessage(msg.chat.id, "يا غالي جرب ترسل مرة ثانية، السيرفر يسخن!");
        }
    }
});

bot.on('polling_error', (err) => console.log("Telegram Error:", err.code));
