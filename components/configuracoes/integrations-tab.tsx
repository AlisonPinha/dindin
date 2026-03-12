"use client"

import { useState, useEffect } from "react"
import {
  Key,
  Copy,
  RefreshCw,
  Trash2,
  Check,
  Loader2,
  Smartphone,
  Eye,
  EyeOff,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useStore } from "@/hooks/use-store"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function IntegrationsTab() {
  const { toast } = useToast()
  const { accounts } = useStore()
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [rawApiKey, setRawApiKey] = useState<string | null>(null) // Only set right after generation
  const [hasKey, setHasKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showRevokeDialog, setShowRevokeDialog] = useState(false)

  // Buscar API key ao montar
  useEffect(() => {
    fetchApiKey()
  }, [])

  const fetchApiKey = async () => {
    try {
      setIsFetching(true)
      const res = await fetch("/api/usuarios/api-key")
      const data = await res.json()
      setApiKey(data.apiKey || null)
      setHasKey(data.hasKey || false)
      setRawApiKey(null) // Clear any previously shown raw key
    } catch {
      // Silenciar erro
    } finally {
      setIsFetching(false)
    }
  }

  const generateKey = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/usuarios/api-key", { method: "POST" })
      const data = await res.json()
      setRawApiKey(data.apiKey) // Store raw key temporarily for display
      setApiKey(data.apiKey)
      setHasKey(true)
      setShowKey(true)
      toast({
        title: "API Key gerada",
        description: "Copie e salve em local seguro. Ela não será exibida novamente.",
      })
    } catch {
      toast({ title: "Erro", description: "Não foi possível gerar a key.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const revokeKey = async () => {
    try {
      setIsLoading(true)
      await fetch("/api/usuarios/api-key", { method: "DELETE" })
      setApiKey(null)
      setRawApiKey(null)
      setHasKey(false)
      setShowKey(false)
      setShowRevokeDialog(false)
      toast({ title: "API Key revogada", description: "A key foi removida. Shortcuts que a usam vão parar de funcionar." })
    } catch {
      toast({ title: "Erro", description: "Não foi possível revogar a key.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: "Copiado!" })
  }

  // Encontrar primeiro cartão de crédito para exemplo
  const creditCard = accounts.find((a) => a.type === "credit")

  // URL base do app
  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://seu-app.vercel.app"

  return (
    <div className="space-y-6">
      {/* API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key
          </CardTitle>
          <CardDescription>
            Chave de autenticação para integrações externas (iOS Shortcuts, automações)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isFetching ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando...
            </div>
          ) : hasKey ? (
            <>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    value={showKey && rawApiKey ? rawApiKey : (apiKey || "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022")}
                    readOnly
                    className="pr-10 font-mono text-sm"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => rawApiKey && copyToClipboard(rawApiKey)}
                  disabled={!rawApiKey}
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateKey}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Regenerar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowRevokeDialog(true)}
                  disabled={isLoading}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Revogar
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Nenhuma API key configurada. Gere uma para usar com iOS Shortcuts.
              </p>
              <Button onClick={generateKey} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Key className="h-4 w-4 mr-2" />
                )}
                Gerar API Key
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guia iOS Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            iOS Shortcuts
          </CardTitle>
          <CardDescription>
            Registre compras automaticamente via Apple Pay ou SMS do banco
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Apple Pay Shortcut */}
          <div className="rounded-lg border p-4 space-y-3">
            <h4 className="font-medium text-sm">Apple Pay</h4>
            <p className="text-xs text-muted-foreground">
              Registra automaticamente cada compra feita via Apple Pay.
              Requer iOS 17+ com trigger &quot;Transaction&quot;.
            </p>
            <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>Abra o app <strong>Atalhos</strong> no iPhone</li>
              <li>Toque em <strong>Automação</strong> &gt; <strong>+</strong> &gt; <strong>Transação</strong></li>
              <li>Adicione ação <strong>Obter Conteúdo do URL</strong></li>
              <li>
                URL: <code className="bg-muted px-1 py-0.5 rounded text-[11px]">{appUrl}/api/quick-add</code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1 ml-1"
                  onClick={() => copyToClipboard(`${appUrl}/api/quick-add`)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </li>
              <li>Método: <strong>POST</strong></li>
              <li>Headers: <code className="bg-muted px-1 py-0.5 rounded text-[11px]">Authorization: Bearer {rawApiKey ? rawApiKey.slice(0, 10) + "..." : "<sua-key>"}</code></li>
              <li>Body (JSON):
                <pre className="bg-muted p-2 rounded text-[11px] mt-1 overflow-x-auto">{JSON.stringify({
                  descricao: "Merchant Name (variavel)",
                  valor: "Amount (variavel)",
                  tipo: "SAIDA",
                  accountId: creditCard?.id || "<uuid-do-cartao>",
                }, null, 2)}</pre>
              </li>
            </ol>
            {creditCard && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Account ID do {creditCard.name}:</span>
                <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">{creditCard.id}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1"
                  onClick={() => copyToClipboard(creditCard.id)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* SMS Bradesco Shortcut */}
          <div className="rounded-lg border p-4 space-y-3">
            <h4 className="font-medium text-sm">SMS Bradesco</h4>
            <p className="text-xs text-muted-foreground">
              Captura valor e estabelecimento de SMS de compra do Bradesco.
            </p>
            <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>Abra <strong>Atalhos</strong> &gt; <strong>Automação</strong> &gt; <strong>Mensagem</strong></li>
              <li>Remetente: <strong>Bradesco</strong></li>
              <li>Adicione <strong>Corresponder Texto</strong> no corpo com regex</li>
              <li>Extraia valor e estabelecimento da mensagem</li>
              <li>POST para o mesmo endpoint com os dados extraídos</li>
            </ol>
          </div>

          {/* Endpoint info */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <p className="text-xs font-medium">Endpoint</p>
            <p className="text-xs text-muted-foreground font-mono">
              POST {appUrl}/api/quick-add
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Campos: <code>descricao</code> (obrigatório), <code>valor</code> (obrigatório),
              {" "}<code>tipo</code> (SAIDA/ENTRADA), <code>accountId</code>, <code>categoryId</code>, <code>tags</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Revoke Dialog */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os Shortcuts e automações que usam esta key vão parar de funcionar imediatamente.
              Você pode gerar uma nova key depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={revokeKey} className="bg-destructive text-destructive-foreground">
              Revogar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
