const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const AUTHORIZATION_CODE = '3_539480_UAkwSMOWNrCnSSYXWCywOxzG1089'; // gere um novo agora

const APP_KEY = process.env.ALIEXPRESS_APP_KEY;
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET;

if (!APP_KEY || !APP_SECRET) {
    console.error('❌ Chaves do AliExpress não configuradas no .env');
    process.exit(1);
}

async function obterToken() {
    console.log('📤 Enviando requisição para /auth/token/create (POST com query params)...');

    try {
        const response = await axios.post('https://api-sg.aliexpress.com/auth/token/create', null, {
            params: {
                app_key: APP_KEY,
                app_secret: APP_SECRET,
                code: AUTHORIZATION_CODE
            },
            timeout: 30000
        });

        console.log('📥 Resposta:', JSON.stringify(response.data, null, 2));

        const data = response.data;

        if (data.access_token) {
            const tokensFile = path.join(__dirname, 'aliexpress_tokens.json');
            fs.writeFileSync(tokensFile, JSON.stringify({
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                expires_in: data.expires_in,
                refresh_expires_in: data.refresh_expires_in,
                user_id: data.user_id || data.seller_id,
                saved_at: new Date().toISOString()
            }, null, 2));
            console.log('✅ TOKEN SALVO COM SUCESSO!');
            console.log('🔑 Access Token:', data.access_token.substring(0, 20) + '...');
        } else {
            console.error('❌ Nenhum access_token recebido:', data);
        }

    } catch (error) {
        console.error('❌ Erro na requisição:', error.message);
        if (error.response) {
            console.error('📥 Status:', error.response.status);
            console.error('📥 Headers:', JSON.stringify(error.response.headers, null, 2));
            console.error('📥 Resposta de erro:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

obterToken();