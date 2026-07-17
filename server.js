// server.js - Voltz Gear - VERSÃO COMPLETA CORRIGIDA
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// ARQUIVO DE PEDIDOS
const PEDIDOS_FILE = path.join(__dirname, 'pedidos.json');
if (!fs.existsSync(PEDIDOS_FILE)) {
    fs.writeFileSync(PEDIDOS_FILE, JSON.stringify([], null, 2));
}

// ==========================================
// CONFIGURAÇÃO DO E-MAIL (GMAIL)
// ==========================================
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: { rejectUnauthorized: false },
    timeout: 30000,
    connectionTimeout: 30000,
    socketTimeout: 30000
});

// ==========================================
// FUNÇÃO PARA ENVIAR E-MAIL DE CONFIRMAÇÃO
// ==========================================
async function enviarEmailConfirmacao(pedido) {
    try {
        const { cliente, idPedido, itens, total, endereco, metodoPagamento } = pedido;

        const produtosLista = itens.map(item =>
            `<tr>
                <td style="padding:10px 8px; border-bottom:1px solid #e5e7eb; color:#374151;">${item.nome}</td>
                <td style="padding:10px 8px; border-bottom:1px solid #e5e7eb; text-align:center; color:#374151;">1</td>
                <td style="padding:10px 8px; border-bottom:1px solid #e5e7eb; text-align:right; color:#374151; font-weight:600;">R$ ${Number(item.preco).toFixed(2).replace('.', ',')}</td>
            </tr>`
        ).join('');

        const metodoPagamentoTexto = metodoPagamento === 'cartao'
            ? '💳 Cartão de Crédito'
            : '⚡ PIX';

        const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pedido Confirmado - Voltz Gear</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6; font-family:'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6; padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding:40px 30px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:28px; font-weight:800; letter-spacing:-0.5px;">⚡ VOLTZ GEAR</h1>
              <p style="margin:8px 0 0; color:#c4b5fd; font-size:14px;">Tecnologia que surpreende</p>
            </td>
          </tr>

          <!-- CONFIRMAÇÃO -->
          <tr>
            <td style="padding:36px 36px 20px; text-align:center;">
              <div style="width:70px; height:70px; background:#d1fae5; border-radius:50%; margin:0 auto 16px; display:flex; align-items:center; justify-content:center; font-size:36px; line-height:70px;">✅</div>
              <h2 style="margin:0 0 8px; color:#111827; font-size:22px; font-weight:700;">Pedido Confirmado!</h2>
              <p style="margin:0; color:#6b7280; font-size:15px;">Obrigado pela sua compra, <strong>${cliente.nome.split(' ')[0]}</strong>!</p>
            </td>
          </tr>

          <!-- NÚMERO DO PEDIDO -->
          <tr>
            <td style="padding:0 36px 24px;">
              <div style="background:#f5f3ff; border:2px solid #7c3aed; border-radius:12px; padding:16px 24px; text-align:center;">
                <p style="margin:0 0 4px; color:#6b7280; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Número do Pedido</p>
                <p style="margin:0; color:#7c3aed; font-size:20px; font-weight:800; font-family:monospace;">#${idPedido}</p>
              </div>
            </td>
          </tr>

          <!-- ITENS DO PEDIDO -->
          <tr>
            <td style="padding:0 36px 24px;">
              <h3 style="margin:0 0 14px; color:#374151; font-size:15px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; border-bottom:2px solid #e5e7eb; padding-bottom:10px;">Resumo do Pedido</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr style="background:#f9fafb;">
                  <th style="padding:8px; text-align:left; color:#6b7280; font-size:12px; font-weight:600; text-transform:uppercase;">Produto</th>
                  <th style="padding:8px; text-align:center; color:#6b7280; font-size:12px; font-weight:600; text-transform:uppercase;">Qtd.</th>
                  <th style="padding:8px; text-align:right; color:#6b7280; font-size:12px; font-weight:600; text-transform:uppercase;">Preço</th>
                </tr>
                ${produtosLista}
                <tr>
                  <td colspan="2" style="padding:14px 8px 0; text-align:right; color:#374151; font-weight:700; font-size:16px;">Total:</td>
                  <td style="padding:14px 8px 0; text-align:right; color:#7c3aed; font-weight:800; font-size:18px;">R$ ${Number(total).toFixed(2).replace('.', ',')}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MÉTODO DE PAGAMENTO -->
          <tr>
            <td style="padding:0 36px 24px;">
              <div style="background:#f9fafb; border-radius:10px; padding:14px 20px; display:flex;">
                <p style="margin:0; color:#6b7280; font-size:13px;">
                  <strong style="color:#374151;">Método de pagamento:</strong> ${metodoPagamentoTexto}
                </p>
              </div>
            </td>
          </tr>

          <!-- ENDEREÇO DE ENTREGA -->
          <tr>
            <td style="padding:0 36px 24px;">
              <h3 style="margin:0 0 10px; color:#374151; font-size:15px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; border-bottom:2px solid #e5e7eb; padding-bottom:10px;">Endereço de Entrega</h3>
              <div style="background:#f9fafb; border-radius:10px; padding:14px 20px;">
                <p style="margin:0; color:#374151; font-size:14px; line-height:1.7;">
                  ${endereco.rua || ''}, ${endereco.numero || ''}<br>
                  ${endereco.bairro || ''}<br>
                  ${endereco.cidade || ''} - ${endereco.estado || ''}<br>
                  CEP: ${endereco.cep || ''}
                </p>
              </div>
            </td>
          </tr>

          <!-- PRÓXIMOS PASSOS -->
          <tr>
            <td style="padding:0 36px 30px;">
              <div style="background:linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%); border-radius:12px; padding:20px 24px;">
                <h4 style="margin:0 0 10px; color:#4f46e5; font-size:14px; font-weight:700;">📦 Próximos Passos</h4>
                <ul style="margin:0; padding:0 0 0 18px; color:#4b5563; font-size:13px; line-height:2;">
                  <li>Seu pedido foi recebido e está sendo processado</li>
                  <li>Você receberá uma confirmação de envio em breve</li>
                  <li>Prazo estimado de entrega: 7 a 15 dias úteis</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f9fafb; padding:24px 36px; text-align:center; border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 6px; color:#6b7280; font-size:13px;">Dúvidas? Entre em contato: <a href="mailto:${process.env.EMAIL_USER}" style="color:#7c3aed; text-decoration:none;">${process.env.EMAIL_USER}</a></p>
              <p style="margin:0; color:#9ca3af; font-size:11px;">© ${new Date().getFullYear()} Voltz Gear - Todos os direitos reservados</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        const mailOptions = {
            from: `Voltz Gear <${process.env.EMAIL_USER}>`,
            to: cliente.email,
            subject: `✅ Pedido Confirmado! #${idPedido} - Voltz Gear`,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('📧 E-mail enviado para:', cliente.email, '| ID:', info.messageId);
        return { sucesso: true, messageId: info.messageId };

    } catch (error) {
        console.error('❌ Erro ao enviar e-mail:', error.message);
        return { sucesso: false, erro: error.message };
    }
}

// ==========================================
// MIDDLEWARES
// ==========================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// ROTA PARA PÁGINAS INDIVIDUAIS DE PRODUTO
// ==========================================
app.get('/produto/:slug', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==========================================
// ROTA: PÁGINA DE SUCESSO
// ==========================================
app.get('/success', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

// ==========================================
// ROTA: GERAR URL DE AUTORIZAÇÃO ALIEXPRESS
// ==========================================
app.get('/api/aliexpress/auth-url', (req, res) => {
    try {
        const appKey = process.env.ALIEXPRESS_APP_KEY;
        if (!appKey) {
            return res.status(500).json({ sucesso: false, erro: 'ALIEXPRESS_APP_KEY não configurada.' });
        }
        const redirectUri = encodeURIComponent('https://voltzgear.com/api/aliexpress/callback');
        const authUrl = `https://auth.aliexpress.com/oauth/authorize?response_type=code&client_id=${appKey}&redirect_uri=${redirectUri}&state=voltz_gear&view=web`;
        res.json({ sucesso: true, authUrl, mensagem: 'Copie esta URL e cole no navegador para autorizar o aplicativo' });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// ==========================================
// ROTA: CALLBACK DO ALIEXPRESS (OBTER TOKEN)
// ==========================================
app.get('/api/aliexpress/callback', async (req, res) => {
    try {
        const { code, state } = req.query;

        if (!code) {
            return res.status(400).send('<h2>❌ Código de autorização não recebido.</h2>');
        }

        const appKey    = process.env.ALIEXPRESS_APP_KEY;
        const appSecret = process.env.ALIEXPRESS_APP_SECRET;

        if (!appKey || !appSecret) {
            return res.status(500).send('<h2>❌ Chaves AliExpress não configuradas no servidor.</h2>');
        }

        // Troca o code pelo access_token
        const tokenUrl = 'https://api-sg.aliexpress.com/rest';
        const params = {
            method:       'aliexpress.system.oauth.token',
            app_key:      appKey,
            code:         code,
            grant_type:   'authorization_code',
            redirect_uri: 'https://voltzgear.com/api/aliexpress/callback',
            timestamp:    new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12) + '00',
            sign_method:  'md5',
            format:       'json',
            v:            '2.0'
        };

        params.sign = gerarAssinaturaAliExpress(params, appSecret);

        const response = await axios.post(tokenUrl, null, {
            params,
            timeout: 15000
        });

        const data = response.data;

        if (data.error_response) {
            console.error('❌ Erro AliExpress OAuth:', data.error_response);
            return res.status(400).send(`<h2>❌ Erro: ${data.error_response.msg}</h2>`);
        }

        const tokenData = data.aliexpress_system_oauth_token_response || data;
        const tokensFile = path.join(__dirname, 'aliexpress_tokens.json');
        fs.writeFileSync(tokensFile, JSON.stringify({
            access_token:  tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expire_time:   tokenData.expire_time,
            user_id:       tokenData.user_id,
            saved_at:      new Date().toISOString()
        }, null, 2));

        console.log('✅ Token AliExpress salvo com sucesso! User ID:', tokenData.user_id);

        res.send(`
            <html>
            <body style="font-family:Arial; text-align:center; padding:60px;">
                <h1 style="color:#22c55e;">✅ AliExpress autorizado com sucesso!</h1>
                <p>Token salvo. Você já pode fechar esta janela.</p>
                <p style="color:#6b7280; font-size:14px;">User ID: ${tokenData.user_id}</p>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('❌ Erro no callback AliExpress:', error.message);
        res.status(500).send(`<h2>❌ Erro interno: ${error.message}</h2>`);
    }
});

// ==========================================
// ROTA: OBTER DADOS DE UM PRODUTO ESPECÍFICO
// ==========================================
app.get('/api/produto/:slug', (req, res) => {
    const { slug } = req.params;

    const produtos = [
        { id: 1,  slug: "power-bank-20000mah",         nome: "Power Bank 20000mAh Lanterna",          preco: 129.90, desc: "Bateria externa de alta performance com design robusto favo de mel e lanterna integrada de emergência.",                          tag: "Mais Vendido",     img: "https://ae-pic-a1.aliexpress-media.com/kf/Sf8bdc60bb8974ed9b10f6116ce132783v.jpg", aliexpressId: "1005010755900045" },
        { id: 2,  slug: "mini-projetor-portatil",       nome: "Mini Projetor Portátil Smart",           preco: 289.90, desc: "Transforme qualquer parede branca em um cinema em segundos. Conexão Wi-Fi, som integrado e sistema inteligente.",              tag: "Super Novidade",   img: "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=500",               aliexpressId: "1005005886477123" },
        { id: 3,  slug: "carregador-magnetico-3-em-1",  nome: "Carregador Magnético Sem Fio 3 em 1",    preco: 169.90, desc: "Elimine cabos na mesa. Carrega simultaneamente seu Smartphone, Fone de Ouvido e Relógio inteligente por indução.",            tag: "Destaque",         img: "https://target.scene7.com/is/image/Target/GUEST_976f13d3-e2f8-48eb-8d52-1e9af0f3e93f",               aliexpressId: "1005006123456789" },
        { id: 4,  slug: "mini-ventilador-gamer",        nome: "Mini Ventilador de Celular Gamer",       preco: 79.90,  desc: "Evite superaquecimento e quedas de FPS nas suas partidas mais intensas. Cooler RGB portátil ultra-silencioso.",                tag: "Edição Limitada",  img: "https://p16-common-sign.tiktokcdn-us.com/tos-maliva-p-0068/f040dfad6dd24ae8828e018d16d8145c_1712887119~tplv-tiktokx-origin.image?dr=9636&x-expires=1784390400&x-signature=0Ncv5fxF0umnU8FLh0BIj4rWMhc%3D&t=4d5b0474&ps=13740610&shp=81f88b70&shcp=55bbe6a9&idc=useast5",               aliexpressId: "1005006090123456" },
        { id: 5,  slug: "umidificador-nuvem-chuva",     nome: "Umidificador Difusor Nuvem de Chuva",    preco: 149.90, desc: "Estilo e conforto acústico para o seu setup. Efeito visual relaxante de chuva com luzes LED customizáveis.",                  tag: "Viral TikTok",     img: "https://images.unsplash.com/photo-1519183071298-a2962feb14f4?w=500",               aliexpressId: "1005005777123456" },
        { id: 6,  slug: "teclado-mecanico-rgb",         nome: "Teclado Mecânico RGB Compacto",          preco: 199.90, desc: "Switches macios de alta resposta tátil, conexão rápida e iluminação dinâmica que reage aos seus comandos.",                  tag: "Melhor Preço",     img: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500",               aliexpressId: "1005005999999999" },
        { id: 7,  slug: "fone-noise-cancelling",        nome: "Fone de Ouvido Noise Cancelling",        preco: 189.90, desc: "Foco total onde quer que esteja. Isolamento acústico ativo e bateria de longa duração para o dia todo.",                      tag: "Premium",          img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",               aliexpressId: "1005005666666666" },
        { id: 8,  slug: "barra-luz-monitor",            nome: "Barra de Luz Monitor LED Smart",         preco: 119.90, desc: "Iluminação profissional e assimétrica para o seu espaço de trabalho que reduz a fadiga ocular em telas.",                   tag: "Ergonômico",       img: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500",               aliexpressId: "1005005555555555" },
        { id: 9,  slug: "suporte-veicular-carregador",  nome: "Suporte Veicular Carregador Sem Fio",    preco: 99.90,  desc: "Fixação automática inteligente por sensor de presença e carregamento rápido para suas viagens e deslocamentos.",            tag: "Mais Vendido",     img: "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=500",               aliexpressId: "1005005444444444" },
        { id: 10, slug: "mouse-gamer-wireless",         nome: "Mouse Gamer Wireless Ergonômico",        preco: 139.90, desc: "Sem fios, sem atrasos. Precisão cirúrgica de DPI ajustável e design ergonômico anatômico para uso prolongado.",             tag: "Novidade",         img: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500",               aliexpressId: "1005005333333333" }
    ];

    const produto = produtos.find(p => p.slug === slug);
    if (!produto) {
        return res.status(404).json({ sucesso: false, mensagem: 'Produto não encontrado' });
    }
    res.json({ sucesso: true, produto });
});

// ==========================================
// ROTA: VERIFICAR STATUS DO PEDIDO (FRONTEND)
// ==========================================
app.get('/api/pedidos/:id/status', (req, res) => {
    try {
        const { id } = req.params;
        const pedidos = JSON.parse(fs.readFileSync(PEDIDOS_FILE));
        const pedido = pedidos.find(p => p.idPedido === id);
        if (!pedido) {
            return res.status(404).json({ sucesso: false, mensagem: 'Pedido não encontrado' });
        }
        res.json({ sucesso: true, status: pedido.status, total: pedido.total, idPedido: pedido.idPedido });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// ==========================================
// FUNÇÃO PARA GERAR ASSINATURA ALIEXPRESS
// ==========================================
function gerarAssinaturaAliExpress(params, secret) {
    const keysSorted = Object.keys(params).sort();
    let queryStr = secret;
    for (const key of keysSorted) {
        queryStr += key + params[key];
    }
    queryStr += secret;
    return crypto.createHash('md5').update(queryStr, 'utf8').digest('hex').toUpperCase();
}

// ==========================================
// FUNÇÃO PARA DESCOBRIR O payment_method_id
// A partir dos 6 primeiros dígitos do cartão (BIN)
// ==========================================
async function obterPaymentMethodId(token, bin) {
    try {
        // Tenta identificar a bandeira pelos primeiros dígitos
        const firstDigit = bin.charAt(0);
        const firstTwo   = bin.substring(0, 2);
        const firstFour  = bin.substring(0, 4);

        // Mapeamento comum de BINs
        if (firstDigit === '4') return 'visa';
        if (['51','52','53','54','55'].includes(firstTwo)) return 'master';
        if (firstTwo === '36' || firstTwo === '38' || firstTwo === '34' || firstTwo === '37') return 'amex';
        if (firstFour === '6011' || firstTwo === '65') return 'discover';
        if (firstTwo === '30' || firstTwo === '38') return 'diners';
        if (firstTwo === '35') return 'jcb';
        if (firstTwo === '50' || ['60','63','67'].includes(firstTwo)) return 'elo';
        if (firstTwo === '62') return 'hipercard';

        // Se não conseguir identificar, tenta via API do Mercado Pago
        const response = await axios.get('https://api.mercadopago.com/v1/payment_methods', {
            headers: { 'Authorization': `Bearer ${token}` },
            timeout: 10000
        });

        if (response.data && response.data.length > 0) {
            const creditCards = response.data.filter(m => m.payment_type_id === 'credit_card');
            for (const card of creditCards) {
                if (card.bin && bin.startsWith(card.bin)) {
                    console.log(`💳 Bandeira detectada via API: ${card.id}`);
                    return card.id;
                }
            }
        }

        console.warn('⚠️ Não foi possível identificar bandeira, usando "visa" como fallback');
        return 'visa';
    } catch (err) {
        console.warn('⚠️ Erro ao identificar bandeira, usando "visa" como fallback:', err.message);
        return 'visa';
    }
}

// ==========================================
// ROTA: CHECKOUT — CARTÃO + PIX (CORRIGIDO)
// ==========================================
app.post('/api/checkout', async (req, res) => {
    console.log('\n📦 Nova requisição de checkout recebida!');
    console.log('📝 Dados:', JSON.stringify(req.body, null, 2));

    try {
        const { cliente, endereco, itens, total, metodoPagamento, detalhesCartao } = req.body;

        // ----- Validação básica -----
        if (!cliente || !endereco || !itens || !total) {
            return res.status(400).json({ sucesso: false, mensagem: 'Dados incompletos. Verifique cliente, endereço, itens e total.' });
        }

        const token = process.env.MERCADO_PAGO_TOKEN;
        if (!token) {
            return res.status(500).json({ sucesso: false, mensagem: 'Token do Mercado Pago não configurado.' });
        }

        const idPedido   = `VOLTZ-${Date.now()}`;
        const valorTotal = parseFloat(total);
        const isTestMode = token.startsWith('TEST-');

        console.log(`🔑 Modo: ${isTestMode ? 'TESTE' : 'PRODUÇÃO'}`);
        console.log(`💰 Valor: R$ ${valorTotal}`);
        console.log(`🆔 Pedido: ${idPedido}`);
        console.log(`💳 Método: ${metodoPagamento || 'pix'}`);

        // ----- Monta payload base -----
        const paymentData = {
            transaction_amount: valorTotal,
            description: `Pedido ${idPedido} - Voltz Gear`,
            payer: {
                email: cliente.email || 'cliente@teste.com',
                first_name: cliente.nome ? cliente.nome.split(' ')[0] : 'Cliente',
                last_name:  cliente.nome ? cliente.nome.split(' ').slice(1).join(' ') || 'Sobrenome' : 'Sobrenome',
                identification: {
                    type:   'CPF',
                    number: (cliente.cpf || '00000000000').replace(/\D/g, '')
                },
                address: {
                    zip_code:     (endereco.cep    || '00000000').replace(/\D/g, ''),
                    street_name:  endereco.rua     || 'Rua Teste',
                    street_number: String(endereco.numero || '0'),
                    neighborhood: endereco.bairro  || 'Bairro',
                    city:         endereco.cidade  || 'Cidade',
                    federal_unit: endereco.estado  || 'SP'
                }
            }
        };

        // ==========================================
        // PIX
        // ==========================================
        if (metodoPagamento !== 'cartao') {
            paymentData.payment_method_id = 'pix';
            paymentData.installments = 1;

            console.log('📤 Enviando PIX para o Mercado Pago...');

            const API_URL = isTestMode
                ? 'https://api.mercadopago.com/sandbox/v1/payments'
                : 'https://api.mercadopago.com/v1/payments';

            const response = await axios.post(API_URL, paymentData, {
                headers: {
                    'Authorization':       `Bearer ${token}`,
                    'Content-Type':        'application/json',
                    'X-Idempotency-Key':   idPedido
                }
            });

            const pResponse = response.data;
            console.log('✅ PIX criado! Status:', pResponse.status);

            const pixCopiaCola = pResponse.point_of_interaction?.transaction_data?.qr_code       || '';
            const pixBase64Img = pResponse.point_of_interaction?.transaction_data?.qr_code_base64 || '';

            if (!pixCopiaCola) {
                return res.status(500).json({ sucesso: false, mensagem: 'Erro ao gerar QR Code PIX. Tente novamente.' });
            }

            const novoPedido = {
                idPedido, status: pResponse.status || 'pendente',
                cliente, endereco, itens, total: valorTotal,
                metodoPagamento: 'pix', mercadoPagoId: pResponse.id,
                modoTeste: isTestMode, data: new Date().toISOString(), enviadoAliExpress: false
            };
            const pedidos = JSON.parse(fs.readFileSync(PEDIDOS_FILE));
            pedidos.push(novoPedido);
            fs.writeFileSync(PEDIDOS_FILE, JSON.stringify(pedidos, null, 2));

            enviarEmailConfirmacao(novoPedido).catch(err => console.error('❌ E-mail:', err.message));

            return res.status(200).json({
                sucesso: true, idPedido, total: valorTotal,
                pixCopiaCola, pixQRCode: pixBase64Img ? `data:image/png;base64,${pixBase64Img}` : null,
                metodoPagamento: 'pix', modoTeste: isTestMode, status: pResponse.status
            });
        }

        // ==========================================
        // CARTÃO DE CRÉDITO  ← BUGFIX PRINCIPAL
        // ==========================================
        if (!detalhesCartao || !detalhesCartao.token) {
            return res.status(400).json({ sucesso: false, mensagem: '❌ Token do cartão não enviado. Verifique o frontend.' });
        }

        const cardToken  = detalhesCartao.token;
        const installments = parseInt(detalhesCartao.parcelas) || 1;

        // ==========================================
        // CORREÇÃO: USAR paymentMethodId DO FRONTEND
        // ==========================================
        let paymentMethodId = detalhesCartao.paymentMethodId;

        // Se o frontend não enviou, tenta detectar pelo BIN
        if (!paymentMethodId) {
            const bin = detalhesCartao.bin || detalhesCartao.primeirosSeis || '';
            console.log(`🔢 BIN para detecção: ${bin}`);
            
            if (bin && bin.length >= 6) {
                paymentMethodId = await obterPaymentMethodId(token, bin);
            } else {
                // Fallback: tenta extrair do número do cartão se disponível
                const cardNumber = detalhesCartao.cardNumber || '';
                if (cardNumber && cardNumber.length >= 6) {
                    const binFromCard = cardNumber.replace(/\D/g, '').slice(0, 6);
                    paymentMethodId = await obterPaymentMethodId(token, binFromCard);
                } else {
                    paymentMethodId = 'visa'; // Fallback final
                }
            }
        }

        console.log(`💳 Bandeira identificada: ${paymentMethodId}`);

        // Validação: se ainda não tiver bandeira, usa fallback
        if (!paymentMethodId) {
            paymentMethodId = 'visa';
            console.warn('⚠️ Usando "visa" como fallback');
        }

        // ==========================================
        // CORREÇÃO: Adicionar token no paymentData
        // ==========================================
        paymentData.payment_method_id = paymentMethodId;
        paymentData.token             = cardToken;           // ← BUG CORRIGIDO: token do cartão
        paymentData.installments      = installments;

        // issuer_id opcional — ajuda o MP a identificar a bandeira
        if (detalhesCartao.issuerId) {
            paymentData.issuer_id = detalhesCartao.issuerId;
        }

        console.log('📤 Enviando CARTÃO para o Mercado Pago...');
        console.log('📦 paymentData:', JSON.stringify(paymentData, null, 2));

        const API_URL = isTestMode
            ? 'https://api.mercadopago.com/sandbox/v1/payments'
            : 'https://api.mercadopago.com/v1/payments';

        const response = await axios.post(API_URL, paymentData, {
            headers: {
                'Authorization':      `Bearer ${token}`,
                'Content-Type':       'application/json',
                'X-Idempotency-Key':  idPedido
            }
        });

        const pResponse = response.data;
        console.log('✅ Pagamento no cartão criado! Status:', pResponse.status);

        const novoPedido = {
            idPedido, status: pResponse.status || 'pendente',
            cliente, endereco, itens, total: valorTotal,
            metodoPagamento: 'cartao', mercadoPagoId: pResponse.id,
            modoTeste: isTestMode, data: new Date().toISOString(), enviadoAliExpress: false,
            bandeira: paymentMethodId,
            parcelas: installments
        };
        const pedidos = JSON.parse(fs.readFileSync(PEDIDOS_FILE));
        pedidos.push(novoPedido);
        fs.writeFileSync(PEDIDOS_FILE, JSON.stringify(pedidos, null, 2));
        console.log('✅ Pedido salvo!');

        enviarEmailConfirmacao(novoPedido).catch(err => console.error('❌ E-mail:', err.message));

        return res.status(200).json({
            sucesso: true, idPedido, total: valorTotal,
            metodoPagamento: 'cartao', modoTeste: isTestMode,
            status: pResponse.status,
            statusDetail: pResponse.status_detail,
            bandeira: paymentMethodId,
            parcelas: installments
        });

    } catch (error) {
        console.error('❌ ERRO NO CHECKOUT:');

        if (error.response) {
            console.error('Status HTTP:', error.response.status);
            console.error('Resposta MP:', JSON.stringify(error.response.data, null, 2));

            let mensagem = 'Erro ao processar pagamento.';
            const cause  = error.response.data?.cause;

            if (error.response.status === 401) {
                mensagem = '❌ Token do Mercado Pago inválido ou expirado.';
            } else if (error.response.status === 400) {
                // Mensagens amigáveis para erros comuns do MP
                if (cause) {
                    const codes = Array.isArray(cause) ? cause.map(c => c.code) : [];
                    if (codes.includes('2001') || codes.includes('E201')) mensagem = '❌ Token do cartão inválido ou expirado. Tente novamente.';
                    else if (codes.includes('2002')) mensagem = '❌ Número do cartão inválido.';
                    else if (codes.includes('2003')) mensagem = '❌ Data de validade inválida.';
                    else if (codes.includes('2004')) mensagem = '❌ CVV inválido.';
                    else if (codes.includes('329')) mensagem = '❌ Bandeira do cartão não suportada. Tente outro cartão.';
                    else mensagem = '❌ Dados inválidos: ' + (error.response.data?.message || JSON.stringify(codes));
                } else {
                    mensagem = '❌ Dados inválidos: ' + (error.response.data?.message || '');
                }
            } else if (error.response.status === 403) {
                mensagem = '❌ Acesso negado. Verifique o token.';
            } else if (error.response.status === 422) {
                mensagem = '❌ Cartão recusado: ' + (error.response.data?.message || 'Verifique os dados e tente novamente.');
            }

            return res.status(500).json({ sucesso: false, mensagem, detalhes: error.response.data });
        }

        if (error.request) {
            return res.status(500).json({ sucesso: false, mensagem: 'Servidor do Mercado Pago não respondeu. Tente novamente.' });
        }

        res.status(500).json({ sucesso: false, mensagem: 'Erro interno: ' + error.message });
    }
});

// ==========================================
// WEBHOOK DO MERCADO PAGO
// ==========================================
app.post('/api/webhook/mercadopago', async (req, res) => {
    try {
        console.log('📨 Webhook recebido:', JSON.stringify(req.body, null, 2));
        const { data, type } = req.body;

        if (type === 'payment' || type === 'payment.legacy') {
            const paymentId = data?.id;
            if (!paymentId) {
                console.log('⚠️ Nenhum paymentId no webhook');
                return res.status(200).json({ sucesso: true });
            }

            console.log(`🔍 Buscando pagamento ID: ${paymentId}`);
            const response = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { 'Authorization': `Bearer ${process.env.MERCADO_PAGO_TOKEN}` },
                timeout: 10000
            });

            const payment = response.data;
            console.log(`📊 Status do pagamento: ${payment.status}`);

            const pedidos = JSON.parse(fs.readFileSync(PEDIDOS_FILE));
            const pedido  = pedidos.find(p => p.mercadoPagoId?.toString() === paymentId?.toString());

            if (payment.status === 'approved') {
                if (pedido) {
                    pedido.status = 'pago';
                    pedido.dataPagamento = new Date().toISOString();
                    fs.writeFileSync(PEDIDOS_FILE, JSON.stringify(pedidos, null, 2));
                    console.log(`✅ Pedido ${pedido.idPedido} marcado como PAGO!`);
                } else {
                    console.log(`❌ Pedido com mercadoPagoId ${paymentId} NÃO ENCONTRADO!`);
                }
            } else {
                console.log(`⏳ Pagamento com status: ${payment.status}`);
            }
        }

        res.status(200).json({ sucesso: true });
    } catch (error) {
        console.error('❌ Erro no webhook:', error.message);
        res.status(200).json({ sucesso: false, erro: error.message });
    }
});

// ==========================================
// ROTA: ENVIAR PEDIDO PARA O ALIEXPRESS
// ==========================================
app.post('/api/aliexpress/enviar-pedido', async (req, res) => {
    try {
        const { pedidoId } = req.body;

        if (!pedidoId) {
            return res.status(400).json({ sucesso: false, mensagem: 'Envie o pedidoId.' });
        }

        // Carrega pedido
        const pedidos = JSON.parse(fs.readFileSync(PEDIDOS_FILE));
        const pedido  = pedidos.find(p => p.idPedido === pedidoId);

        if (!pedido) {
            return res.status(404).json({ sucesso: false, mensagem: 'Pedido não encontrado.' });
        }
        if (pedido.status !== 'pago') {
            return res.status(400).json({ sucesso: false, mensagem: 'Só é possível enviar pedidos com status "pago".' });
        }
        if (pedido.enviadoAliExpress) {
            return res.status(400).json({ sucesso: false, mensagem: 'Pedido já foi enviado para o AliExpress.' });
        }

        // Carrega token AliExpress
        const tokensFile = path.join(__dirname, 'aliexpress_tokens.json');
        if (!fs.existsSync(tokensFile)) {
            return res.status(500).json({ sucesso: false, mensagem: 'Token AliExpress não configurado. Faça a autorização OAuth primeiro.' });
        }

        const tokens = JSON.parse(fs.readFileSync(tokensFile));
        if (!tokens.access_token) {
            return res.status(500).json({ sucesso: false, mensagem: 'access_token AliExpress inválido. Refaça a autorização OAuth.' });
        }

        const appKey    = process.env.ALIEXPRESS_APP_KEY;
        const appSecret = process.env.ALIEXPRESS_APP_SECRET;

        if (!appKey || !appSecret) {
            return res.status(500).json({ sucesso: false, mensagem: 'Chaves AliExpress não configuradas.' });
        }

        const endereco = pedido.endereco;
        const cliente  = pedido.cliente;

        // Para cada item do pedido, cria um pedido no AliExpress
        const resultados = [];

        for (const item of pedido.itens) {
            if (!item.aliexpressId) {
                resultados.push({ item: item.nome, sucesso: false, erro: 'aliexpressId não definido para este produto.' });
                continue;
            }

            const timestamp  = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
            const orderItems = JSON.stringify([{
                product_id:    item.aliexpressId,
                product_count: 1,
                sku_attr:      ''
            }]);

            const logisticsAddress = JSON.stringify({
                contact_person: cliente.nome,
                address:        `${endereco.rua}, ${endereco.numero}, ${endereco.bairro}`,
                city:           endereco.cidade,
                province:       endereco.estado,
                zip:            (endereco.cep || '').replace(/\D/g, ''),
                country:        'BR',
                phone_country:  '55',
                phone:          cliente.telefone || '11999999999',
                mobile_no:      cliente.telefone || '11999999999'
            });

            const params = {
                method:               'aliexpress.trade.buy.placeorder',
                app_key:              appKey,
                session:              tokens.access_token,
                timestamp,
                sign_method:          'md5',
                format:               'json',
                v:                    '2.0',
                param_place_order_request4_open_api_d_t_o: JSON.stringify({
                    out_order_id:     `${pedidoId}-${item.aliexpressId}`,
                    product_items:    JSON.parse(orderItems),
                    logistics_address: JSON.parse(logisticsAddress)
                })
            };

            params.sign = gerarAssinaturaAliExpress(params, appSecret);

            try {
                const response = await axios.post('https://api-sg.aliexpress.com/rest', null, {
                    params,
                    timeout: 20000
                });

                const data = response.data;
                const result = data.aliexpress_trade_buy_placeorder_response;

                if (result && result.is_success) {
                    resultados.push({ item: item.nome, sucesso: true, orderId: result.order_id });
                } else {
                    const erro = data.error_response?.msg || 'Resposta inesperada do AliExpress';
                    console.error(`❌ Erro AliExpress para ${item.nome}:`, erro);
                    resultados.push({ item: item.nome, sucesso: false, erro });
                }
            } catch (itemErr) {
                console.error(`❌ Erro HTTP ao enviar ${item.nome}:`, itemErr.message);
                resultados.push({ item: item.nome, sucesso: false, erro: itemErr.message });
            }
        }

        // Atualiza pedido se pelo menos um item foi enviado
        const algumSucesso = resultados.some(r => r.sucesso);
        if (algumSucesso) {
            pedido.enviadoAliExpress = true;
            pedido.envioAliExpressData = new Date().toISOString();
            pedido.resultadosAliExpress = resultados;
            fs.writeFileSync(PEDIDOS_FILE, JSON.stringify(pedidos, null, 2));
        }

        res.json({
            sucesso: algumSucesso,
            mensagem: algumSucesso ? 'Pedido enviado para o AliExpress!' : 'Falha ao enviar todos os itens.',
            resultados
        });

    } catch (error) {
        console.error('❌ Erro ao enviar pedido para AliExpress:', error.message);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// ==========================================
// ROTA: LISTAR PEDIDOS
// ==========================================
app.get('/api/pedidos', (req, res) => {
    try {
        const pedidos = JSON.parse(fs.readFileSync(PEDIDOS_FILE));
        res.json({ total: pedidos.length, pedidos });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// ==========================================
// ROTA: ATUALIZAR STATUS DO PEDIDO
// ==========================================
app.put('/api/pedidos/:id/status', (req, res) => {
    try {
        const { id }     = req.params;
        const { status } = req.body;
        const pedidos    = JSON.parse(fs.readFileSync(PEDIDOS_FILE));
        const pedido     = pedidos.find(p => p.idPedido === id);

        if (!pedido) {
            return res.status(404).json({ sucesso: false, mensagem: 'Pedido não encontrado' });
        }
        pedido.status = status;
        fs.writeFileSync(PEDIDOS_FILE, JSON.stringify(pedidos, null, 2));
        res.json({ sucesso: true, mensagem: `Status atualizado para ${status}` });
    } catch (error) {
        res.status(500).json({ sucesso: false, mensagem: error.message });
    }
});

// ==========================================
// ROTA: STATUS DO SERVIDOR
// ==========================================
app.get('/api/status', (req, res) => {
    const token = process.env.MERCADO_PAGO_TOKEN;

    let aliAccessToken = false;
    try {
        const tokensFile = path.join(__dirname, 'aliexpress_tokens.json');
        if (fs.existsSync(tokensFile)) {
            const tokens = JSON.parse(fs.readFileSync(tokensFile));
            aliAccessToken = !!tokens.access_token;
        }
    } catch (e) {}

    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        tokenConfigurado: !!token,
        tokenModoTeste: token ? token.startsWith('TEST-') : false,
        aliExpressConfigurado: !!process.env.ALIEXPRESS_APP_KEY,
        aliAccessTokenConfigurado: aliAccessToken,
        emailConfigurado: !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS,
        servidor: 'Node.js + Express',
        versao: process.version
    });
});

// ==========================================
// ROTA: TESTE MANUAL DO WEBHOOK
// ==========================================
app.post('/api/webhook/test', async (req, res) => {
    try {
        const { paymentId, pedidoId } = req.body;

        if (!paymentId || !pedidoId) {
            return res.status(400).json({ sucesso: false, mensagem: 'Envie paymentId e pedidoId' });
        }

        const response = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { 'Authorization': `Bearer ${process.env.MERCADO_PAGO_TOKEN}` }
        });

        const payment = response.data;

        if (payment.status === 'approved') {
            const pedidos = JSON.parse(fs.readFileSync(PEDIDOS_FILE));
            const pedido  = pedidos.find(p => p.idPedido === pedidoId);

            if (pedido) {
                pedido.status = 'pago';
                pedido.dataPagamento = new Date().toISOString();
                fs.writeFileSync(PEDIDOS_FILE, JSON.stringify(pedidos, null, 2));
                console.log(`✅ [TESTE] Pedido ${pedidoId} marcado como PAGO!`);
                return res.json({ sucesso: true, mensagem: 'Pedido atualizado para "pago"', pedido });
            }
        }

        res.json({ sucesso: false, mensagem: 'Pagamento não aprovado ou pedido não encontrado', status: payment.status });

    } catch (error) {
        console.error('❌ Erro no webhook de teste:', error.message);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('⚡ VOLTZ GEAR - SERVIDOR ONLINE');
    console.log('='.repeat(50));
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🔑 Token MP: ${process.env.MERCADO_PAGO_TOKEN ? '✅ Configurado' : '❌ NÃO CONFIGURADO'}`);
    console.log(`🧪 Modo: ${process.env.MERCADO_PAGO_TOKEN?.startsWith('TEST-') ? 'TESTE' : 'PRODUÇÃO'}`);
    console.log(`📦 AliExpress App Key: ${process.env.ALIEXPRESS_APP_KEY ? '✅ Configurado' : '❌ NÃO CONFIGURADO'}`);

    let aliTokenStatus = '❌ NÃO CONFIGURADO';
    try {
        const tokensFile = path.join(__dirname, 'aliexpress_tokens.json');
        if (fs.existsSync(tokensFile)) {
            const tokens = JSON.parse(fs.readFileSync(tokensFile));
            if (tokens.access_token) aliTokenStatus = '✅ Configurado';
        }
    } catch (e) {}
    console.log(`🔑 AliExpress Token: ${aliTokenStatus}`);
    console.log(`📧 E-mail: ${process.env.EMAIL_USER ? '✅ Configurado (' + process.env.EMAIL_USER + ')' : '❌ NÃO CONFIGURADO'}`);
    console.log(`📁 Pedidos: ${PEDIDOS_FILE}`);
    console.log('='.repeat(50) + '\n');
});