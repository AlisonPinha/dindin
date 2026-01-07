import "dotenv/config"
import { prisma } from '../lib/prisma'

async function testConnection() {
  try {
    // Teste de conexão
    await prisma.$connect()
    console.log('✅ Conexão com banco OK')

    // Teste de leitura
    const users = await prisma.user.findMany()
    console.log(`✅ Leitura OK - ${users.length} usuários encontrados`)

    // Teste de escrita
    const testCategory = await prisma.category.create({
      data: {
        nome: 'TESTE_DELETE',
        tipo: 'DESPESA',
        cor: '#000000',
        icone: 'test',
        grupo: 'LIVRE'
      }
    })
    console.log('✅ Escrita OK')

    // Cleanup
    await prisma.category.delete({ where: { id: testCategory.id } })
    console.log('✅ Delete OK')

    console.log('\n🎉 Todos os testes passaram!')
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
