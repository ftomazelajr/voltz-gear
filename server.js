// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// MIDDLEWARES
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ARQUIVO DE PEDIDOS
const PEDIDOS_FILE = path.join(__dirname, 'pedidos.json');

if (!fs.existsSync(PEDIDOS_FILE)) {
    fs.writeFileSync(PEDIDOS_FILE, JSON.stringify([], null, 2));
}

// ==========================================
// ROTA PRINCIPAL DE CHECKOUT
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

        // PREPARA DADOS PARA O MERCADO PAGO
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

        // ==========================================
        // URL CORRETA DA API DO MERCADO PAGO
        // ==========================================
        // PARA TESTE (SANDBOX): 
        // https://api.mercadopago.com/sandbox/v1/payments
        // 
        // PARA PRODUÇÃO:
        // https://api.mercadopago.com/v1/payments
        // ==========================================
        
        const API_URL = isTestMode 
            ? 'https://api.mercadopago.com/sandbox/v1/payments'
            : 'https://api.mercadopago.com/v1/payments';

        console.log(`🌐 URL: ${API_URL}`);

        const response = await axios.post(API_URL, paymentData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': idPedido
            }
        });

        console.log('✅ Pagamento criado com sucesso!');
        console.log('📊 Status:', response.data.status);
        console.log('🆔 ID:', response.data.id);

        // EXTRAI DADOS DO PIX
        const pResponse = response.data;
        let pixCopiaCola = pResponse.point_of_interaction?.transaction_data?.qr_code || '';
        let pixBase64Img = pResponse.point_of_interaction?.transaction_data?.qr_code_base64 || '';

        // SE NÃO TIVER QR CODE, GERA SIMULADO
        if (!pixCopiaCola) {
            console.warn('⚠️ QR Code não retornado, gerando simulado...');
            pixCopiaCola = `00020101021226930014BR.GOV.BCB.PIX2572SIMULADO-${Date.now()}5204000053039865405${valorTotal}5802BR5913${cliente.nome || 'Cliente'}6009SaoPaulo62070503***6304E2A8`;
            pixBase64Img = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
        }

        // SALVA O PEDIDO
        const novoPedido = {
            idPedido,
            status: pResponse.status || 'pendente',
            cliente,
            endereco,
            itens,
            total: valorTotal,
            mercadoPagoId: pResponse.id,
            modoTeste: isTestMode,
            data: new Date().toISOString()
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
            console.error('Dados completos:', JSON.stringify(error.response.data, null, 2));
            
            let mensagem = 'Erro ao processar pagamento. ';
            
            if (error.response.status === 401) {
                mensagem = '❌ Token do Mercado Pago inválido ou expirado. Gere um novo token no painel do Mercado Pago.';
            } else if (error.response.status === 404) {
                mensagem = '❌ URL da API do Mercado Pago não encontrada. Verifique a URL.';
            } else if (error.response.status === 400) {
                const msg = error.response.data?.message || '';
                if (msg.includes('key') || msg.includes('pix')) {
                    mensagem = '❌ Sua conta do Mercado Pago não tem PIX ativado. Ative o PIX nas configurações.';
                } else {
                    mensagem = '❌ Dados inválidos: ' + msg;
                }
            } else if (error.response.status === 403) {
                mensagem = '❌ Acesso negado. Verifique se o token é válido e tem permissão para criar pagamentos.';
            }
            
            // GERAR QR CODE SIMULADO EM CASO DE ERRO
            console.warn('⚠️ Gerando QR Code SIMULADO para continuar o teste...');
            
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

                // SALVA PEDIDO SIMULADO
                const novoPedido = {
                    idPedido,
                    status: 'simulado',
                    cliente: cliente || { nome: 'Cliente', email: 'teste@email.com' },
                    endereco: req.body?.endereco || {},
                    itens: req.body?.itens || [],
                    total: valorTotal,
                    modoTeste: true,
                    data: new Date().toISOString()
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
            console.error('❌ Sem resposta do servidor:', error.request);
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
// ROTA DE STATUS
// ==========================================
app.get('/api/status', (req, res) => {
    const token = process.env.MERCADO_PAGO_TOKEN;
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        tokenConfigurado: !!token,
        tokenModoTeste: token ? token.startsWith('TEST-') : false,
        servidor: 'Node.js + Express',
        versao: process.version,
        apiUrl: token?.startsWith('TEST-') 
            ? 'https://api.mercadopago.com/sandbox/v1/payments'
            : 'https://api.mercadopago.com/v1/payments'
    });
});

// ==========================================
// ROTA PARA VER PEDIDOS
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
// INICIAR SERVIDOR
// ==========================================
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('⚡ VOLTZ GEAR - SERVIDOR ONLINE');
    console.log('='.repeat(50));
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🔑 Token MP: ${process.env.MERCADO_PAGO_TOKEN ? '✅ Configurado' : '❌ NÃO CONFIGURADO'}`);
    console.log(`🧪 Modo: ${process.env.MERCADO_PAGO_TOKEN?.startsWith('TEST-') ? 'TESTE (Sandbox)' : 'PRODUÇÃO'}`);
    console.log(`📁 Pedidos: ${PEDIDOS_FILE}`);
    console.log('='.repeat(50) + '\n');
});