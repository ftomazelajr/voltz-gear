// server.js
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
    tls: {
        rejectUnauthorized: false
    },
    timeout: 30000,
    connectionTimeout: 30000,
    socketTimeout: 30000
});

// ==========================================
// FUNÇÃO PARA ENVIAR E-MAIL DE CONFIRMAÇÃO
// ==========================================
async function enviarEmailConfirmacao(pedido) {
    try {
        const { cliente, idPedido, itens, total, endereco } = pedido;
        
        const produtosLista = itens.map(item => 
            `<tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.nome}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">1</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">R$ ${item.preco.toFixed(2).replace('.', ',')}</td>
            </tr>`
        ).join('');

        const html = `...`; // Mantenha o HTML do e-mail igual ao seu

        const mailOptions = {
            from: `Voltz Gear <${process.env.EMAIL_USER}>`,
            to: cliente.email,
            subject: `✅ Pedido Confirmado! #${idPedido} - Voltz Gear`,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('📧 E-mail enviado para:', cliente.email);
        console.log('📧 Message ID:', info.messageId);
        
        return { sucesso: true, messageId: info.messageId };

    } catch (error) {
        console.error('❌ Erro ao enviar e-mail:', error.message);
        return { sucesso: false, erro: error.message };
    }
}

// MIDDLEWARES
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
        const redirectUri = 'https://voltzgear.com/api/aliexpress/callback';
        
        const authUrl = `https://auth.aliexpress.com/oauth/authorize?response_type=code&client_id=${appKey}&redirect_uri=${redirectUri}&state=voltz_gear&view=web`;
        
        res.json({ 
            sucesso: true, 
            authUrl,
            mensagem: 'Copie esta URL e cole no navegador para autorizar o aplicativo'
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// ==========================================
// ROTA: CALLBACK DO ALIEXPRESS (OBTER TOKEN)
// ==========================================
app.get('/api/aliexpress/callback', async (req, res) => {
    // ... mantenha o código do callback
});

// ==========================================
// ROTA: OBTER DADOS DE UM PRODUTO ESPECÍFICO
// ==========================================
app.get('/api/produto/:slug', (req, res) => {
    const { slug } = req.params;
    
    const produtos = [
        { id: 1, slug: "power-bank-20000mah", nome: "Power Bank 20000mAh Lanterna", preco: 129.90, desc: "Bateria externa de alta performance com design robusto favo de mel e lanterna integrada de emergência.", tag: "Mais Vendido", img: "https://ae-pic-a1.aliexpress-media.com/kf/Sf8bdc60bb8974ed9b10f6116ce132783v.jpg", aliexpressId: "1005010755900045" },
        { id: 2, slug: "mini-projetor-portatil", nome: "Mini Projetor Portátil Smart", preco: 289.90, desc: "Transforme qualquer parede branca em um cinema em segundos. Conexão Wi-Fi, som integrado e sistema inteligente.", tag: "Super Novidade", img: "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=500", aliexpressId: "1005005886477123" },
        { id: 3, slug: "carregador-magnetico-3-em-1", nome: "Carregador Magnético Sem Fio 3 em 1", preco: 169.90, desc: "Elimine cabos na mesa. Carrega simultaneamente seu Smartphone, Fone de Ouvido e Relógio inteligente por indução.", tag: "Destaque", img: "https://images.unsplash.com/photo-1622445262465-2481c4574875?w=500", aliexpressId: "1005006123456789" },
        { id: 4, slug: "mini-ventilador-gamer", nome: "Mini Ventilador de Celular Gamer", preco: 79.90, desc: "Evite superaquecimento e quedas de FPS nas suas partidas mais intensas. Cooler RGB portátil ultra-silencioso.", tag: "Edição Limitada", img: "https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?w=500", aliexpressId: "1005006090123456" },
        { id: 5, slug: "umidificador-nuvem-chuva", nome: "Umidificador Difusor Nuvem de Chuva", preco: 149.90, desc: "Estilo e conforto acústico para o seu setup. Efeito visual relaxante de chuva com luzes LED customizáveis.", tag: "Viral TikTok", img: "https://images.unsplash.com/photo-1519183071298-a2962feb14f4?w=500", aliexpressId: "1005005777123456" },
        { id: 6, slug: "teclado-mecanico-rgb", nome: "Teclado Mecânico RGB Compacto", preco: 199.90, desc: "Switches macios de alta resposta tátil, conexão rápida e iluminação dinâmica que reage aos seus comandos.", tag: "Melhor Preço", img: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500", aliexpressId: "1005005999999999" },
        { id: 7, slug: "fone-noise-cancelling", nome: "Fone de Ouvido Noise Cancelling", preco: 189.90, desc: "Foco total onde quer que esteja. Isolamento acústico ativo e bateria de longa duração para o dia todo.", tag: "Premium", img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500", aliexpressId: "1005005666666666" },
        { id: 8, slug: "barra-luz-monitor", nome: "Barra de Luz Monitor LED Smart", preco: 119.90, desc: "Iluminação profissional e assimétrica para o seu espaço de trabalho que reduz a fadiga ocular em telas.", tag: "Ergonômico", img: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500", aliexpressId: "1005005555555555" },
        { id: 9, slug: "suporte-veicular-carregador", nome: "Suporte Veicular Carregador Sem Fio", preco: 99.90, desc: "Fixação automática inteligente por sensor de presença e carregamento rápido para suas viagens e deslocamentos.", tag: "Mais Vendido", img: "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=500", aliexpressId: "1005005444444444" },
        { id: 10, slug: "mouse-gamer-wireless", nome: "Mouse Gamer Wireless Ergonômico", preco: 139.90, desc: "Sem fios, sem atrasos. Precisão cirúrgica de DPI ajustável e design ergonômico anatômico para uso prolongado.", tag: "Novidade", img: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500", aliexpressId: "1005005333333333" }
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
        
        res.json({ 
            sucesso: true, 
            status: pedido.status,
            total: pedido.total,
            idPedido: pedido.idPedido
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// ARQUIVO DE PEDIDOS
const PEDIDOS_FILE = path.join(__dirname, 'pedidos.json');

if (!fs.existsSync(PEDIDOS_FILE)) {
    fs.writeFileSync(PEDIDOS_FILE, JSON.stringify([], null, 2));
}

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
// ROTA: CHECKOUT - APENAS PRODUÇÃO (SEM SIMULAÇÃO)
// ==========================================
app.post('/api/checkout', async (req, res) => {
    console.log('\n📦 Nova requisição de checkout recebida!');
    console.log('📝 Dados:', JSON.stringify(req.body, null, 2));

    try {
        const { cliente, endereco, itens, total, metodoPagamento, detalhesCartao } = req.body;

        if (!cliente || !endereco || !itens || !total) {
            console.error('❌ Dados incompletos');
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Dados incompletos. Verifique cliente, endereço, itens e total.'
            });
        }

        const token = process.env.MERCADO_PAGO_TOKEN;
        if (!token) {
            console.error('❌ Token não configurado');
            return res.status(500).json({
                sucesso: false,
                mensagem: 'Token do Mercado Pago não configurado.'
            });
        }

        // VERIFICA SE É TOKEN DE PRODUÇÃO
        if (token.startsWith('TEST-')) {
            console.warn('⚠️ ATENÇÃO: Token de TESTE detectado! Use token de PRODUÇÃO para pagamentos reais.');
        }

        const idPedido = `VOLTZ-${Date.now()}`;
        const valorTotal = parseFloat(total);
        const isTestMode = token.startsWith('TEST-');

        console.log(`🔑 Modo: ${isTestMode ? 'TESTE' : 'PRODUÇÃO'}`);
        console.log(`💰 Valor: R$ ${valorTotal}`);
        console.log(`🆔 Pedido: ${idPedido}`);
        console.log(`📧 Email: ${cliente.email}`);
        console.log(`📋 CPF: ${cliente.cpf || 'Não informado'}`);
        console.log(`💳 Método: ${metodoPagamento || 'pix'}`);

        // ==========================================
        // DEFINE O MÉTODO DE PAGAMENTO
        // ==========================================
        let paymentMethodId = "pix";
        let installments = 1;

        if (metodoPagamento === 'cartao') {
            paymentMethodId = "credit_card";
            installments = parseInt(detalhesCartao?.parcelas) || 1;
            console.log(`📦 Parcelas: ${installments}x`);
        }

        // ==========================================
        // PREPARA OS DADOS PARA O MERCADO PAGO
        // ==========================================
        const paymentData = {
            transaction_amount: valorTotal,
            description: `Pedido ${idPedido} - Voltz Gear`,
            payment_method_id: paymentMethodId,
            payer: {
                email: cliente.email || 'cliente@teste.com',
                first_name: cliente.nome ? cliente.nome.split(' ')[0] : 'Cliente',
                last_name: cliente.nome ? cliente.nome.split(' ').slice(1).join(' ') : 'Teste',
                identification: {
                    type: "CPF",
                    number: cliente.cpf || "00000000000"
                },
                address: {
                    zip_code: endereco.cep ? endereco.cep.replace(/\D/g, '') : '00000000',
                    street_name: endereco.rua || 'Rua Teste',
                    street_number: endereco.numero || '0',
                    neighborhood: endereco.bairro || 'Bairro',
                    city: endereco.cidade || 'Cidade',
                    federal_unit: endereco.estado || 'SP'
                }
            }
        };

        // SE FOR CARTÃO, ADICIONA PARCELAS
        if (metodoPagamento === 'cartao') {
            paymentData.installments = installments;
        }

        console.log('📤 Enviando para o Mercado Pago...');

        const API_URL = isTestMode 
            ? 'https://api.mercadopago.com/sandbox/v1/payments'
            : 'https://api.mercadopago.com/v1/payments';

        const response = await axios.post(API_URL, paymentData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': idPedido
            }
        });

        console.log('✅ Pagamento criado com sucesso!');
        console.log('📊 Status:', response.data.status);

        const pResponse = response.data;
        let pixCopiaCola = pResponse.point_of_interaction?.transaction_data?.qr_code || '';
        let pixBase64Img = pResponse.point_of_interaction?.transaction_data?.qr_code_base64 || '';

        // SE FOR PIX E NÃO TIVER QR CODE, retorna erro (NÃO SIMULA)
        if (metodoPagamento === 'pix' && !pixCopiaCola) {
            console.error('❌ QR Code não retornado pelo Mercado Pago');
            return res.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao gerar QR Code PIX. Tente novamente.'
            });
        }

        // SALVA O PEDIDO
        const novoPedido = {
            idPedido,
            status: pResponse.status || 'pendente',
            cliente,
            endereco,
            itens,
            total: valorTotal,
            metodoPagamento: metodoPagamento || 'pix',
            mercadoPagoId: pResponse.id,
            modoTeste: isTestMode,
            data: new Date().toISOString(),
            enviadoAliExpress: false
        };

        const pedidos = JSON.parse(fs.readFileSync(PEDIDOS_FILE));
        pedidos.push(novoPedido);
        fs.writeFileSync(PEDIDOS_FILE, JSON.stringify(pedidos, null, 2));

        console.log('✅ Pedido salvo com sucesso!');

        // ENVIA E-MAIL DE CONFIRMAÇÃO (NÃO BLOQUEIA)
        enviarEmailConfirmacao(novoPedido)
            .then(resultado => {
                if (resultado.sucesso) {
                    console.log('📧 E-mail enviado com sucesso!');
                } else {
                    console.log('⚠️ Falha ao enviar e-mail:', resultado.erro);
                }
            })
            .catch(err => console.error('❌ Erro no envio de e-mail:', err));

        // RETORNA A RESPOSTA
        res.status(200).json({
            sucesso: true,
            idPedido,
            total: valorTotal,
            pixCopiaCola: pixCopiaCola || null,
            pixQRCode: pixBase64Img ? `data:image/png;base64,${pixBase64Img}` : null,
            metodoPagamento: metodoPagamento || 'pix',
            modoTeste: isTestMode,
            status: pResponse.status
        });

    } catch (error) {
        console.error('❌ ERRO NO CHECKOUT:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Mensagem:', error.response.data?.message || error.response.data);
            
            let mensagem = 'Erro ao processar pagamento. ';
            
            if (error.response.status === 401) {
                mensagem = '❌ Token do Mercado Pago inválido ou expirado.';
            } else if (error.response.status === 400) {
                mensagem = '❌ Dados inválidos: ' + (error.response.data?.message || '');
            } else if (error.response.status === 403) {
                mensagem = '❌ Acesso negado. Verifique se o token é válido.';
            }
            
            res.status(500).json({
                sucesso: false,
                mensagem: mensagem,
                detalhes: error.response.data
            });
        } else if (error.request) {
            console.error('❌ Sem resposta do servidor');
            res.status(500).json({
                sucesso: false,
                mensagem: 'Servidor do Mercado Pago não respondeu. Tente novamente.'
            });
        } else {
            console.error('❌ Erro interno:', error.message);
            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro interno: ' + error.message
            });
        }
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
                console.log('⚠️ Nenhum paymentId encontrado');
                return res.status(200).json({ sucesso: true });
            }
            
            console.log(`🔍 Buscando pagamento ID: ${paymentId}`);
            
            const response = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.MERCADO_PAGO_TOKEN}`
                },
                timeout: 10000
            });
            
            const payment = response.data;
            console.log(`📊 Status do pagamento: ${payment.status}`);
            
            const pedidos = JSON.parse(fs.readFileSync(PEDIDOS_FILE));
            console.log(`📋 Total de pedidos salvos: ${pedidos.length}`);
            
            const pedido = pedidos.find(p => p.mercadoPagoId?.toString() === paymentId?.toString());
            
            if (payment.status === 'approved') {
                if (pedido) {
                    pedido.status = 'pago';
                    pedido.dataPagamento = new Date().toISOString();
                    fs.writeFileSync(PEDIDOS_FILE, JSON.stringify(pedidos, null, 2));
                    console.log(`✅ Pedido ${pedido.idPedido} foi pago!`);
                } else {
                    console.log(`❌ Pedido com mercadoPagoId ${paymentId} NÃO ENCONTRADO!`);
                }
            } else {
                console.log(`⏳ Pagamento ainda não aprovado. Status: ${payment.status}`);
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
    // ... mantenha o código do AliExpress
});

// ==========================================
// ROTA: LISTAR PEDIDOS
// ==========================================
app.get('/api/pedidos', (req, res) => {
    try {
        const pedidos = JSON.parse(fs.readFileSync(PEDIDOS_FILE));
        res.json({
            total: pedidos.length,
            pedidos: pedidos
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// ==========================================
// ROTA: ATUALIZAR STATUS DO PEDIDO
// ==========================================
app.put('/api/pedidos/:id/status', (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const pedidos = JSON.parse(fs.readFileSync(PEDIDOS_FILE));
        const pedido = pedidos.find(p => p.idPedido === id);
        
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
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: 'Envie paymentId e pedidoId' 
            });
        }
        
        const response = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
                'Authorization': `Bearer ${process.env.MERCADO_PAGO_TOKEN}`
            }
        });
        
        const payment = response.data;
        
        if (payment.status === 'approved') {
            const pedidos = JSON.parse(fs.readFileSync(PEDIDOS_FILE));
            const pedido = pedidos.find(p => p.idPedido === pedidoId);
            
            if (pedido) {
                pedido.status = 'pago';
                pedido.dataPagamento = new Date().toISOString();
                fs.writeFileSync(PEDIDOS_FILE, JSON.stringify(pedidos, null, 2));
                console.log(`✅ Pedido ${pedidoId} foi pago!`);
                
                return res.json({ 
                    sucesso: true, 
                    mensagem: 'Pedido atualizado para "pago"',
                    pedido 
                });
            }
        }
        
        res.json({ 
            sucesso: false, 
            mensagem: 'Pagamento não aprovado ou pedido não encontrado',
            status: payment.status 
        });
        
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
    console.log(`📦 AliExpress: ${process.env.ALIEXPRESS_APP_KEY ? '✅ Configurado' : '❌ NÃO CONFIGURADO'}`);
    
    let aliTokenStatus = '❌ NÃO CONFIGURADO';
    try {
        const tokensFile = path.join(__dirname, 'aliexpress_tokens.json');
        if (fs.existsSync(tokensFile)) {
            const tokens = JSON.parse(fs.readFileSync(tokensFile));
            if (tokens.access_token) {
                aliTokenStatus = '✅ Configurado';
            }
        }
    } catch (e) {}
    console.log(`🔑 AliExpress Token: ${aliTokenStatus}`);
    
    console.log(`📧 E-mail: ${process.env.EMAIL_USER ? '✅ Configurado (' + process.env.EMAIL_USER + ')' : '❌ NÃO CONFIGURADO'}`);
    console.log(`📁 Pedidos: ${PEDIDOS_FILE}`);
    console.log('='.repeat(50) + '\n');
});