// test-email.js - Teste de envio de e-mail
require('dotenv').config();
const nodemailer = require('nodemailer');

// ==========================================
// CONFIGURAÇÃO DO E-MAIL
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
    timeout: 60000,
    connectionTimeout: 60000,
    socketTimeout: 60000
});

// ==========================================
// TESTE 1: VERIFICAR CONEXÃO
// ==========================================
console.log('🧪 === TESTE DE E-MAIL ===');
console.log('📧 Email User:', process.env.EMAIL_USER || '❌ NÃO CONFIGURADO');
console.log('🔑 Email Pass:', process.env.EMAIL_PASS ? '✅ CONFIGURADO' : '❌ NÃO CONFIGURADO');

transporter.verify(function(error, success) {
    if (error) {
        console.error('❌ Erro na conexão SMTP:', error.message);
        console.log('\n🔧 Possíveis soluções:');
        console.log('1. Verifique se o EMAIL_USER está correto');
        console.log('2. Verifique se o EMAIL_PASS é uma "Senha de App" do Gmail');
        console.log('3. Ative o "Acesso a aplicativos menos seguros" no Gmail');
        console.log('4. Verifique se a conta Gmail tem 2FA ativado (precisa de senha de app)');
        return;
    }
    console.log('✅ Conexão SMTP estabelecida com sucesso!');
    enviarEmailTeste();
});

// ==========================================
// TESTE 2: ENVIAR E-MAIL DE TESTE
// ==========================================
function enviarEmailTeste() {
    console.log('\n📤 Enviando e-mail de teste...');
    
    const emailDestino = process.env.EMAIL_USER; // Envia para si mesmo
    // OU use um email específico:
    // const emailDestino = 'ftj230291@gmail.com';
    
    const mailOptions = {
        from: `Voltz Gear <${process.env.EMAIL_USER}>`,
        to: emailDestino,
        subject: '🧪 Teste de E-mail - Voltz Gear',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; background: #f3f4f6; padding: 40px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
                    .header { background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; margin: -40px -40px 30px; }
                    .header h1 { margin: 0; font-size: 28px; }
                    .status { background: #d1fae5; border: 1px solid #bbf7d0; padding: 16px; border-radius: 12px; text-align: center; color: #065f46; }
                    .status h2 { margin: 0; font-size: 20px; }
                    .info { background: #f9fafb; padding: 16px; border-radius: 12px; margin: 20px 0; }
                    .info p { margin: 8px 0; color: #374151; }
                    .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>⚡ VOLTZ GEAR</h1>
                        <p style="margin:8px 0 0; color:#c4b5fd;">Teste de Configuração</p>
                    </div>
                    
                    <div class="status">
                        <h2>✅ E-mail enviado com sucesso!</h2>
                        <p style="margin:4px 0 0;">Se você recebeu esta mensagem, a configuração está funcionando!</p>
                    </div>
                    
                    <div class="info">
                        <p><strong>📅 Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                        <p><strong>📧 De:</strong> ${process.env.EMAIL_USER}</p>
                        <p><strong>📧 Para:</strong> ${emailDestino}</p>
                        <p><strong>🔧 Status:</strong> Configuração SMTP funcionando perfeitamente</p>
                    </div>
                    
                    <p style="color:#374151; text-align:center; font-size:15px;">
                        Este é um e-mail de teste da sua loja <strong>Voltz Gear</strong>.
                    </p>
                    
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Voltz Gear - Todos os direitos reservados</p>
                        <p>Este é um e-mail automático, por favor não responda.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    transporter.sendMail(mailOptions)
        .then(info => {
            console.log('✅ E-mail enviado com sucesso!');
            console.log('📧 Para:', emailDestino);
            console.log('📧 ID da mensagem:', info.messageId);
            console.log('📧 Resposta:', info.response);
            console.log('\n🎉 Tudo funcionando! Agora você pode integrar no servidor.');
        })
        .catch(error => {
            console.error('❌ Erro ao enviar e-mail:', error.message);
            console.error('🔍 Detalhes:', error);
            
            console.log('\n🔧 Possíveis causas:');
            if (error.message.includes('Invalid login')) {
                console.log('❌ Login inválido - Verifique EMAIL_USER e EMAIL_PASS');
                console.log('   💡 Dica: Use uma "Senha de App" do Gmail');
            } else if (error.message.includes('ECONNECTION')) {
                console.log('❌ Erro de conexão - Verifique sua internet');
            } else if (error.message.includes('535')) {
                console.log('❌ Erro de autenticação - Ative "Acesso a aplicativos menos seguros"');
                console.log('   🔗 https://myaccount.google.com/lesssecureapps');
            } else if (error.message.includes('550')) {
                console.log('❌ E-mail bloqueado - Tente enviar para outro endereço');
            }
        });
}

// ==========================================
// TESTE 3: ENVIAR E-MAIL COM HTML PERSONALIZADO
// ==========================================
function enviarEmailPersonalizado() {
    console.log('\n📤 Teste 3: E-mail com HTML personalizado...');
    
    const emailDestino = process.env.EMAIL_USER;
    
    // E-mail de confirmação de pedido (simplificado)
    const mailOptions = {
        from: `Voltz Gear <${process.env.EMAIL_USER}>`,
        to: emailDestino,
        subject: '✅ Pedido Confirmado! #TESTE-123 - Voltz Gear',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; background: #f3f4f6; padding: 40px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
                    .header { background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; margin: -40px -40px 30px; }
                    .header h1 { margin: 0; font-size: 24px; }
                    .pedido { background: #f5f3ff; border: 2px solid #7c3aed; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0; }
                    .pedido p { margin: 4px 0; }
                    .itens { border-collapse: collapse; width: 100%; margin: 16px 0; }
                    .itens th { background: #f3f4f6; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
                    .itens td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
                    .total { text-align: right; font-size: 18px; font-weight: 700; color: #7c3aed; margin-top: 16px; }
                    .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>⚡ VOLTZ GEAR</h1>
                        <p style="margin:8px 0 0; color:#c4b5fd;">Pedido Confirmado!</p>
                    </div>
                    
                    <div class="pedido">
                        <p><strong>Número do Pedido:</strong> #TESTE-123</p>
                        <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                    </div>
                    
                    <h3 style="margin:20px 0 12px;">Resumo do Pedido</h3>
                    <table class="itens">
                        <tr>
                            <th>Produto</th>
                            <th style="text-align:center;">Qtd</th>
                            <th style="text-align:right;">Preço</th>
                        </tr>
                        <tr>
                            <td>Power Bank 20000mAh com Lanterna</td>
                            <td style="text-align:center;">1</td>
                            <td style="text-align:right;">R$ 5,90</td>
                        </tr>
                    </table>
                    
                    <div class="total">
                        Total: R$ 5,90
                    </div>
                    
                    <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:16px; margin:20px 0;">
                        <p style="margin:0; color:#065f46; font-weight:600;">📦 Próximos Passos</p>
                        <p style="margin:4px 0 0; font-size:14px; color:#374151;">
                            Seu pedido foi recebido e está sendo processado.
                            Você receberá uma confirmação de envio em breve.
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Voltz Gear - Todos os direitos reservados</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    transporter.sendMail(mailOptions)
        .then(info => {
            console.log('✅ E-mail personalizado enviado com sucesso!');
            console.log('📧 ID:', info.messageId);
        })
        .catch(error => {
            console.error('❌ Erro:', error.message);
        });
}

// ==========================================
// EXECUTAR TESTES
// ==========================================
console.log('\n' + '='.repeat(50));
console.log('📧 TESTE DE E-MAIL - VOLTZ GEAR');
console.log('='.repeat(50) + '\n');

// Verificar se as variáveis de ambiente existem
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Variáveis de ambiente não configuradas!');
    console.log('📌 Crie um arquivo .env com:');
    console.log('EMAIL_USER=seuemail@gmail.com');
    console.log('EMAIL_PASS=suasenhaapp');
    process.exit(1);
}

// Executar após 2 segundos
setTimeout(() => {
    console.log('⏳ Aguardando configuração...\n');
}, 1000);