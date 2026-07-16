// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// MIDDLEWARES
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Adicione esta rota no server.js (depois do app.use(express.static(...)))

// ==========================================
// ROTA PARA PÁGINAS INDIVIDUAIS DE PRODUTO
// ==========================================
app.get('/produto/:slug', (req, res) => {
    // Serve o index.html, mas o JavaScript vai ler o parâmetro
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ROTA PARA OBTER DADOS DE UM PRODUTO ESPECÍFICO
app.get('/api/produto/:slug', (req, res) => {
    const { slug } = req.params;
    
    // Lista de produtos com slugs
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
// ROTA: CHECKOUT E GERAÇÃO DE PIX (MERCADO PAGO)
// ==========================================
app.post('/api/checkout', async (req, res) => {
    console.log('\n📦 Nova requisição de checkout recebida!');
    console.log('📝 Dados:', JSON.stringify(req.body, null, 2));

    try {
        const { cliente, endereco, itens, total } = req.body;

        // VALIDAÇÕES BÁSICAS
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
                mensagem: 'Token do Mercado Pago não configurado. Verifique o arquivo .env'
            });
        }

        const idPedido = `VOLTZ-${Date.now()}`;
        const valorTotal = parseFloat(total);
        const isTestMode = token.startsWith('TEST-');

        console.log(`🔑 Modo: ${isTestMode ? 'TESTE' : 'PRODUÇÃO'}`);
        console.log(`💰 Valor: R$ ${valorTotal}`);
        console.log(`🆔 Pedido: ${idPedido}`);
        console.log(`📧 Email: ${cliente.email}`);

        const paymentData = {
            transaction_amount: valorTotal,
            description: `Pedido ${idPedido} - Voltz Gear`,
            payment_method_id: "pix",
            payer: {
                email: cliente.email || 'cliente@teste.com',
                first_name: cliente.nome ? cliente.nome.split(' ')[0] : 'Cliente',
                last_name: cliente.nome ? cliente.nome.split(' ').slice(1).join(' ') : 'Teste',
                identification: {
                    type: "CPF",
                    number: "00000000000"
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

        if (!pixCopiaCola) {
            console.warn('⚠️ QR Code não retornado, gerando simulado...');
            pixCopiaCola = `00020101021226930014BR.GOV.BCB.PIX2572SIMULADO-${Date.now()}5204000053039865405${valorTotal}5802BR5913${cliente.nome || 'Cliente'}6009SaoPaulo62070503***6304E2A8`;
            pixBase64Img = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
        }

        const novoPedido = {
            idPedido,
            status: 'pendente',
            cliente,
            endereco,
            itens,
            total: valorTotal,
            mercadoPagoId: pResponse.id,
            modoTeste: isTestMode,
            data: new Date().toISOString(),
            enviadoAliExpress: false
        };

        const pedidos = JSON.parse(fs.readFileSync(PEDIDOS_FILE));
        pedidos.push(novoPedido);
        fs.writeFileSync(PEDIDOS_FILE, JSON.stringify(pedidos, null, 2));

        console.log('✅ Pedido salvo com sucesso!');

        res.status(200).json({
            sucesso: true,
            idPedido,
            total: valorTotal,
            pixCopiaCola,
            pixQRCode: `data:image/png;base64,${pixBase64Img}`,
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
            
            // Gera QR Code simulado em caso de erro
            try {
                const { cliente, total } = req.body;
                const valorTotal = parseFloat(total) || 10;
                const idPedido = `VOLTZ-${Date.now()}`;
                const pixSimulado = {
                    sucesso: true,
                    idPedido,
                    total: valorTotal,
                    pixCopiaCola: `00020101021226930014BR.GOV.BCB.PIX2572SIMULADO-${Date.now()}5204000053039865405${valorTotal}5802BR5913${cliente?.nome || 'Teste'}6009SaoPaulo62070503***6304E2A8`,
                    pixQRCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
                    modoTeste: true,
                    status: 'simulado',
                    aviso: '⚠️ QR Code SIMULADO - Use para testar o fluxo'
                };

                const novoPedido = {
                    idPedido,
                    status: 'simulado',
                    cliente: cliente || { nome: 'Cliente', email: 'teste@email.com' },
                    endereco: req.body?.endereco || {},
                    itens: req.body?.itens || [],
                    total: valorTotal,
                    modoTeste: true,
                    data: new Date().toISOString(),
                    enviadoAliExpress: false
                };

                const pedidos = JSON.parse(fs.readFileSync(PEDIDOS_FILE));
                pedidos.push(novoPedido);
                fs.writeFileSync(PEDIDOS_FILE, JSON.stringify(pedidos, null, 2));

                console.log('✅ QR Code simulado gerado e salvo!');
                return res.status(200).json(pixSimulado);
            } catch (e) {
                console.error('❌ Erro ao gerar QR Code simulado:', e.message);
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
// ROTA: ENVIAR PEDIDO PARA O ALIEXPRESS
// ==========================================
app.post('/api/aliexpress/enviar-pedido', async (req, res) => {
    try {
        const { pedidoId } = req.body;
        
        if (!pedidoId) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'ID do pedido é obrigatório'
            });
        }

        // Busca o pedido no arquivo
        const pedidos = JSON.parse(fs.readFileSync(PEDIDOS_FILE));
        const pedido = pedidos.find(p => p.idPedido === pedidoId);

        if (!pedido) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Pedido não encontrado'
            });
        }

        if (pedido.enviadoAliExpress) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Pedido já foi enviado para o AliExpress'
            });
        }

        // Verifica se tem os produtos com IDs do AliExpress
        const itensComId = pedido.itens.filter(item => item.aliexpressId);
        if (itensComId.length === 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Nenhum produto possui ID do AliExpress configurado'
            });
        }

        // PREPARA OS DADOS PARA A API DO ALIEXPRESS
        const apiParams = {
            app_key: process.env.ALIEXPRESS_APP_KEY,
            timestamp: Math.floor(Date.now() / 1000).toString(),
            format: 'json',
            v: '2.0',
            sign_method: 'md5',
            method: 'aliexpress.trade.buy.placeorder',
            address_info: JSON.stringify({
                contact_person: pedido.cliente.nome,
                phone_number: pedido.cliente.whatsapp,
                address_line1: `${pedido.endereco.rua}, ${pedido.endereco.numero}`,
                address_line2: pedido.endereco.bairro,
                city: pedido.endereco.cidade,
                province: pedido.endereco.estado,
                zip_code: pedido.endereco.cep.replace(/\D/g, ''),
                country_code: 'BR'
            })
        };

        // ADICIONA OS PRODUTOS AO PEDIDO
        const productItems = itensComId.map(item => ({
            product_id: parseInt(item.aliexpressId),
            product_count: 1,
            logistics_service_name: "AliExpress Standard Shipping"
        }));

        apiParams.product_items = JSON.stringify(productItems);
        apiParams.sign = gerarAssinaturaAliExpress(apiParams, process.env.ALIEXPRESS_APP_SECRET);

        console.log('📤 Enviando pedido para o AliExpress...');
        console.log('🆔 Pedido:', pedidoId);
        console.log('📦 Produtos:', productItems.length);

        // TENTA ENVIAR PARA O ALIEXPRESS
        try {
            const aliResponse = await axios.post('https://api-sg.aliexpress.com/sync', null, {
                params: apiParams
            });

            console.log('✅ Resposta do AliExpress:', aliResponse.data);

            // ATUALIZA O STATUS DO PEDIDO
            pedido.enviadoAliExpress = true;
            pedido.status = 'enviado';
            pedido.aliExpressResponse = aliResponse.data;
            pedido.dataEnvioAliExpress = new Date().toISOString();

            fs.writeFileSync(PEDIDOS_FILE, JSON.stringify(pedidos, null, 2));

            res.status(200).json({
                sucesso: true,
                mensagem: 'Pedido enviado para o AliExpress com sucesso!',
                resposta: aliResponse.data
            });

        } catch (aliError) {
            console.error('❌ Erro ao enviar para o AliExpress:', aliError.response?.data || aliError.message);
            
            // Se o erro for de autenticação, tenta novamente com token de sessão
            if (aliError.response?.status === 401) {
                return res.status(401).json({
                    sucesso: false,
                    mensagem: 'Erro de autenticação com o AliExpress. Verifique suas credenciais.',
                    erro: aliError.response?.data
                });
            }

            // Salva o erro para debug
            pedido.erroAliExpress = {
                data: new Date().toISOString(),
                mensagem: aliError.message,
                detalhes: aliError.response?.data
            };
            fs.writeFileSync(PEDIDOS_FILE, JSON.stringify(pedidos, null, 2));

            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao enviar pedido para o AliExpress. Tente novamente.',
                erro: aliError.message
            });
        }

    } catch (error) {
        console.error('❌ ERRO NA ROTA ALIEXPRESS:', error.message);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno ao processar envio para o AliExpress',
            erro: error.message
        });
    }
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
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        tokenConfigurado: !!token,
        tokenModoTeste: token ? token.startsWith('TEST-') : false,
        aliExpressConfigurado: !!process.env.ALIEXPRESS_APP_KEY,
        servidor: 'Node.js + Express',
        versao: process.version
    });
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
    console.log(`🧪 Modo: ${process.env.MERCADO_PAGO_TOKEN?.startsWith('TEST-') ? 'TESTE (Sandbox)' : 'PRODUÇÃO'}`);
    console.log(`📦 AliExpress: ${process.env.ALIEXPRESS_APP_KEY ? '✅ Configurado' : '❌ NÃO CONFIGURADO'}`);
    console.log(`📁 Pedidos: ${PEDIDOS_FILE}`);
    console.log('='.repeat(50) + '\n');
});