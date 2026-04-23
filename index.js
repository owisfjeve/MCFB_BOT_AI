const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require('express');

// 1. تشغيل سيرفر ويب بسيط لضمان استمرارية العمل على Render
const app = express();
app.get('/', (req, res) => res.send('بوت لوريس الصغير 2.0 جاهز! 🚀'));
const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`سيرفر الاستضافة شغال على منفذ ${port}`));

// 2. إعداد المفاتيح (تأكد من وضعها في Environment Variables في Render)
const token = process.env.TELE_TOKEN;
const apiKey = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(apiKey);
// استخدمنا gemini-pro لأنه الأكثر استقراراً وقبولاً لكل النسخ
const model = genAI.getGenerativeModel({ 
    model: "gemini-pro",
    systemInstruction: "أنت لوريس الصغير، مساعد ذكي ومرح وخبير لفريق UMFB. تحدث باللهجة السعودية العفوية وساعد الجميع في التقنية والألعاب والوناسة."
});

// 3. تشغيل البوت بنظام Polling نظيف
const bot = new TelegramBot(token, { polling: true });

console.log("جاري تشغيل لوريس الصغير...");

bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;

    const chatId = msg.chat.id;
    
    // إرسال إشعار "يكتب الآن"
    bot.sendChatAction(chatId, 'typing');

    try {
        const result = await model.generateContent(msg.text);
        const response = await result.response;
        const text = response.text();
        
        bot.sendMessage(chatId, text);
    } catch (error) {
        console.error("خطأ في Gemini:", error.message);
        // رسالة لطيفة للمستخدم في حال تعثر الذكاء الاصطناعي
        bot.sendMessage(chatId, "يا غالي، مخي علّق شوي من الحماس، ممكن تعيد كلامك؟");
    }
});

// معالجة أخطاء الاتصال بالتيليجرام لمنع توقف البوت
bot.on('polling_error', (error) => {
    console.log("Polling error:", error.code); 
});
