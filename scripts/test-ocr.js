/**
 * Script para testar a configuração do OCR localmente
 * 
 * Uso: node scripts/test-ocr.js <caminho-do-arquivo>
 * 
 * Exemplo: node scripts/test-ocr.js ./test.pdf
 */

const fs = require('fs');
const path = require('path');

// Verificar se a chave está configurada
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ Erro: ANTHROPIC_API_KEY não está configurada');
  console.log('\nPara testar localmente:');
  console.log('1. Crie um arquivo .env.local na raiz do projeto');
  console.log('2. Adicione: ANTHROPIC_API_KEY=sk-ant-sua-chave-aqui');
  console.log('3. Execute: node scripts/test-ocr.js <arquivo>\n');
  process.exit(1);
}

const filePath = process.argv[2];

if (!filePath) {
  console.error('❌ Erro: Forneça o caminho do arquivo');
  console.log('\nUso: node scripts/test-ocr.js <caminho-do-arquivo>\n');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`❌ Erro: Arquivo não encontrado: ${filePath}`);
  process.exit(1);
}

console.log('✅ ANTHROPIC_API_KEY configurada');
console.log(`📄 Arquivo: ${filePath}`);
console.log(`📊 Tamanho: ${(fs.statSync(filePath).size / 1024).toFixed(2)} KB`);
console.log('\n⚠️  Para testar o OCR completo, use a interface da aplicação');
console.log('   O script apenas verifica se a configuração está correta.\n');
