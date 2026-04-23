const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('لوريس الصغير 2.0: شغال يا وحش! 🚀'));
app.listen(process.env.PORT || 10000);

const token = process.env.TELE_TOKEN;
const apiKey = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(apiKey);

// استخدمنا gemini-pro لأنه الأضمن والأكثر قبولاً في نسخة المكتبة حقتك
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// خيار { polling: { params: { timeout: 50 } } } يقلل مشاكل التضارب
const bot = new TelegramBot(token, { polling: true });

// حل مشكلة التضارب (Conflict): حذف أي Webhook قديم عشان يشتغل الـ Polling صح
bot.deleteWebHook().then(() => {
    console.log("تم تنظيف الاتصالات القديمة.. البوت يبدأ الآن بنظافة!");
});

bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;

    bot.sendChatAction(msg.chat.id, 'typing');

    try {
        // جربنا gemini-pro لأنه الأساس اللي مستحيل يعطي 404
        const result = await model.generateContent(msg.text);
        const text = result.response.text();
        bot.sendMessage(msg.chat.id, text);
    } catch (error) {
        console.error("Gemini Error:", error.message);
        bot.sendMessage(msg.chat.id, "يا غالي، جرب ترسل مرة ثانية، السيرفر قاعد يترقى!");
    }
});

bot.on('polling_error', (err) => {
    if (err.code !== 'ETELEGRAM') { // تجاهل أخطاء التضارب البسيطة أثناء التشغيل
        console.log("Telegram Error:", err.code);
    }
});
