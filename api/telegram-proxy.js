export default async function handler(req, res) {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
        return res.status(500).json({ ok: false, error: 'Missing env vars' });
    }

    try {
        const contentType = req.headers['content-type'] || '';

        if (contentType.includes('multipart/form-data')) {
            const { endpoint, caption, audio, photo, document } = req.body;
            const fileField = audio || photo || document;

            if (!endpoint || !fileField) {
                return res.status(400).json({ ok: false, error: 'Missing endpoint or file' });
            }

            const FormData = require('form-data');
            const form = new FormData();
            form.append('chat_id', CHAT_ID);
            if (caption) form.append('caption', Array.isArray(caption) ? caption[0] : caption);
            const file = Array.isArray(fileField) ? fileField[0] : fileField;
            form.append(audio ? 'audio' : photo ? 'photo' : 'document', Buffer.from(file), { filename: file.name || 'file' });

            const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${endpoint}`, {
                method: 'POST',
                headers: form.getHeaders(),
                body: form
            });
            return res.status(200).json(await response.json());
        }

        const { endpoint, data } = req.body;
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: CHAT_ID, ...data })
        });
        return res.status(200).json(await response.json());

    } catch (e) {
        return res.status(500).json({ ok: false, error: e.message });
    }
}
