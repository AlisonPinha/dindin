"use client"

/**
 * Skip Links para navegação por teclado
 * Permite que usuários de leitores de tela pulem diretamente para o conteúdo principal
 */
export function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="fixed top-4 left-4 z-[100] bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-transform transform -translate-y-16 focus:translate-y-0"
      >
        Pular para o conteúdo principal
      </a>
      <a
        href="#main-navigation"
        className="fixed top-4 left-52 z-[100] bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-transform transform -translate-y-16 focus:translate-y-0"
      >
        Pular para a navegação
      </a>
    </div>
  )
}
