const express = require('express');
const fs = require('fs');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

let apiKeyData = fs.readFileSync('keys.json');
let apiKeys = JSON.parse(apiKeyData).api_keys;

let ipTracking = {};

// Função para carregar IPs do arquivo ips.json
const loadIps = () => {
    if (fs.existsSync('ips.json')) {
        const ipData = fs.readFileSync('ips.json', 'utf8');
        return JSON.parse(ipData);
    }
    return {};
};

// Função para salvar IPs no arquivo ips.json
const saveIps = (data) => {
    fs.writeFileSync('ips.json', JSON.stringify(data, null, 2));
};

let ipData = loadIps();

const sendToWebhook = async (apiKey, ip, link = null, result = null) => {
    const webhookUrl = 'https://discord.com/api/webhooks/1276358886491685005/o90b6kXjtzPiWj66uO4cOLAkkM2ZoLggDZ803jXSabS00pt7LqOmBs5ooevNboy5mzb-';
    const message = `Api Key Used: ${apiKey}\nIp: ${ip}`;

    const secondWebhookUrl = 'https://discord.com/api/webhooks/1276434672674537472/_RXTwXJkmy3s3C1jC4HIYQvlbkVRQ5YbQIFc8hHsrh8RfZ7hktkC4Js4W0BlDbNzabbj';
    const secondMessage = `Api Key Used: ${apiKey}\nIp: ${ip}\nLink: ${link}\nResult: ${result}`;

    try {
        // Envia a primeira mensagem
        await axios.post(webhookUrl, { content: message });
        
        // Se o link e o resultado forem fornecidos, envia a segunda mensagem
        if (link !== null && result !== null) {
            await axios.post(secondWebhookUrl, { content: secondMessage });
        }
    } catch (error) {
        console.error("Error sending to webhook:", error);
    }
};

const getIPv4 = (req) => {
    let ip = req.ip;
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
        ip = forwardedFor.split(',')[0].trim();
    }
    const ipv4Match = ip.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
    return ipv4Match ? ipv4Match[0] : ip;
};

const apiKeyMiddleware = (req, res, next) => {
    const apiKey = req.query.api_key;
    const userIp = getIPv4(req);

    if (apiKey && apiKeys.includes(apiKey)) {
        if (!ipTracking[apiKey]) {
            ipTracking[apiKey] = new Set();
        }

        if (!ipTracking[apiKey].has(userIp)) {
            ipTracking[apiKey].add(userIp);
            const ipCount = ipTracking[apiKey].size;
            
            // Atualiza o arquivo ips.json
            if (!ipData[apiKey]) {
                ipData[apiKey] = [];
            }
            if (!ipData[apiKey].includes(userIp)) {
                ipData[apiKey].push(userIp);
                saveIps(ipData);
            }
            
            sendToWebhook(apiKey, userIp, ipCount);
        }

        next();
    } else {
        res.status(403).json({ success: false, result: "invalid api key" });
    }
};

app.set('trust proxy', true);

app.use('/api/bypass', apiKeyMiddleware);

const extractHWIDArceus = (url) => {
    const match = url.match(/[?&]hwid=([a-f0-9]{16,32})/);
    return match ? match[1].toLowerCase() : null;
};

const extractIDDelta = (url) => {
    const match = url.match(/[?&]id=([a-fA-F0-9]+)/);
    return match ? match[1] : null;
};

const getKeyFromHWIDArceus = async (hwid) => {
    try {
        const response = await axios.get(`https://stickx.top/api-arceusx/?hwid=${hwid}&api_key=tUnAZj3sS74DJo9BUb8tshpVhpLJLA`);
        return response.data;
    } catch (error) {
        console.error("Error getting key from Arceus API:", error);
        return null;
    }
};

const getKeyFromIDDelta = async (id) => {
    try {
        const response = await axios.get(`https://stickx.top/api-delta/?hwid=${id}&api_key=tUnAZj3sS74DJo9BUb8tshpVhpLJLA`);
        return response.data;
    } catch (error) {
        console.error("Error getting key from Arceus API:", error);
        return null;
    }
};

const getKeyFromHWIDFluxus = async (url) => {
    try {
        const response = await axios.get(`https://robloxexecutorth-api.vercel.app/fluxus?url=${encodeURIComponent(url)}`);
        return response.data;
    } catch (error) {
        console.error("Error getting key from Fluxus API:", error);
        return null;
    }
};

const Shouko = async (url) => {
    try {
        const response = await axios.get(`https://shouko-api.neyoshiiuem.workers.dev/bypass?link=${encodeURIComponent(url)}&api_key=nysszenkeyriel`);
        return response.data;
    } catch (error) {
        console.error("Error bypassing BypassVip:", error);
        return null;
    }
};

const BypassVip = async (url) => {
    try {
        const response = await axios.get(`https://api.bypass.vip/bypass?url=${encodeURIComponent(url)}`);
        return response.data;
    } catch (error) {
        console.error("Error bypassing BypassVip:", error);
        return null;
    }
};

const EthosBypass = async (url) => {
    try {
        const response = await axios.get(`https://et.goatbypassers.xyz/api/adlinks/bypass?url=${encodeURIComponent(url)}`);
        return response.data;
    } catch (error) {
        console.error("Error bypassing Ethos Bypass:", error);
        return null;
    }
};

const supportedURLs = [
    "Fluxus",
    "Rekonise",
    "Social-Unlock",
    "Arceus X (300 Per Day)",
    "Delta (300 Per Day)",
    "All Platoboost",
    "Linkvertise (All Domains, i Think)",
    "Loot-Link (All Domains, i Think)",
    "Boost.Ink",
    "MBoost.Me",
    "Paster.So",
    "SocialWolvez"
];

app.get('/api/bypass', async (req, res) => {
    const link = req.query.link;
    const apiKey = req.query.api_key; // Captura a API Key utilizada
    const userIp = getIPv4(req); // Captura o IP do usuário

    if (!link) {
        return res.status(400).json({ success: false, result: "link parameter is required" });
    }

    console.log(`Processing link: ${link}`);

    let result;

    if (link.startsWith('https://flux.li')) {
        const keyResponse = await getKeyFromHWIDFluxus(link);
        result = keyResponse && keyResponse.status === "success" ? keyResponse.key : null;
    } else if (link.startsWith('https://rekonise.com') || link.startsWith('https://social-unlock.com')) {
        const bypassResponse = await EthosBypass(link);
        result = bypassResponse && bypassResponse.result ? bypassResponse.result : null;
    } else if (link.startsWith('https://spdmteam.com/key-system-1')) {
        const hwid = extractHWIDArceus(link);
        if (hwid) {
            const keyResponse = await getKeyFromHWIDArceus(hwid);
            result = keyResponse && keyResponse.Status === "Success" ? keyResponse.key : null;
        }
    } else if (link.startsWith('https://gateway.platoboost.com/a/8')) {
        const id = extractIDDelta(link);
        if (id) {
            const keyResponse = await getKeyFromIDDelta(id);
            result = keyResponse && keyResponse.Status === "Success" ? keyResponse.key : null;
        }
    } else if (link.startsWith('https://linkvertise.com')) {
        const bypassResponse = await BypassVip(link);
        result = bypassResponse && bypassResponse.result ? bypassResponse.result : null;
    } else {
        const bypassResponse = await Shouko(link);
        result = bypassResponse && bypassResponse.result ? bypassResponse.result : null;
    }

    if (result) {
        sendToWebhook(apiKey, userIp, link, result); // Passa o link e o resultado corretos
        res.json({ success: true, result });
    } else {
        res.status(500).json({ success: false, result: "Failed to process the link" });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
