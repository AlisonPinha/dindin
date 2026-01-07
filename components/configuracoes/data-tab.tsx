"use client"

import { useState, useRef } from "react"
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  HardDrive,
  Cloud,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface DataStats {
  totalTransactions: number
  totalCategories: number
  totalAccounts: number
  totalGoals: number
  lastBackup?: Date
}

interface DataTabProps {
  stats: DataStats
  onExport: (format: "csv" | "pdf", dataType: string) => Promise<void>
  onImport: (file: File) => Promise<{ success: number; errors: number }>
  onBackup: () => Promise<void>
  onRestore: (file: File) => Promise<void>
}

export function DataTab({
  stats,
  onExport,
  onImport,
  onBackup,
  onRestore,
}: DataTabProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const backupInputRef = useRef<HTMLInputElement>(null)

  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)

  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv")
  const [exportDataType, setExportDataType] = useState("transactions")
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)

  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await onExport(exportFormat, exportDataType)
      toast({
        title: "Exportação concluída",
        description: `Seus dados foram exportados em formato ${exportFormat.toUpperCase()}.`,
      })
      setIsExportDialogOpen(false)
    } catch {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".csv")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo CSV.",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)
    setImportProgress(0)
    setImportResult(null)
    setIsImportDialogOpen(true)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setImportProgress((prev) => Math.min(prev + 10, 90))
    }, 200)

    try {
      const result = await onImport(file)
      clearInterval(progressInterval)
      setImportProgress(100)
      setImportResult(result)
      toast({
        title: "Importação concluída",
        description: `${result.success} transações importadas com sucesso.`,
      })
    } catch {
      clearInterval(progressInterval)
      toast({
        title: "Erro na importação",
        description: "Não foi possível importar o arquivo. Verifique o formato.",
        variant: "destructive",
      })
      setIsImportDialogOpen(false)
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleBackup = async () => {
    setIsBackingUp(true)
    try {
      await onBackup()
      toast({
        title: "Backup criado",
        description: "Seu backup foi criado e baixado com sucesso.",
      })
    } catch {
      toast({
        title: "Erro no backup",
        description: "Não foi possível criar o backup. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsBackingUp(false)
    }
  }

  const handleRestoreClick = () => {
    backupInputRef.current?.click()
  }

  const handleRestoreFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".json")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo de backup válido (.json).",
        variant: "destructive",
      })
      return
    }

    setIsRestoreDialogOpen(true)

    if (backupInputRef.current) {
      backupInputRef.current.value = ""
    }
  }

  const handleRestoreConfirm = async () => {
    setIsRestoring(true)
    try {
      const file = backupInputRef.current?.files?.[0]
      if (file) {
        await onRestore(file)
        toast({
          title: "Restauração concluída",
          description: "Seus dados foram restaurados com sucesso.",
        })
      }
    } catch {
      toast({
        title: "Erro na restauração",
        description: "Não foi possível restaurar o backup.",
        variant: "destructive",
      })
    } finally {
      setIsRestoring(false)
      setIsRestoreDialogOpen(false)
    }
  }

  const formatDate = (date?: Date) => {
    if (!date) return "Nunca"
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date)
  }

  return (
    <div className="space-y-6">
      {/* Data Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-500" />
            <CardTitle>Visão Geral dos Dados</CardTitle>
          </div>
          <CardDescription>
            Resumo dos dados armazenados no aplicativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-blue-500">{stats.totalTransactions}</p>
              <p className="text-sm text-muted-foreground">Transações</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-emerald-500">{stats.totalCategories}</p>
              <p className="text-sm text-muted-foreground">Categorias</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-violet-500">{stats.totalAccounts}</p>
              <p className="text-sm text-muted-foreground">Contas</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-amber-500">{stats.totalGoals}</p>
              <p className="text-sm text-muted-foreground">Metas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-emerald-500" />
            <CardTitle>Exportar Dados</CardTitle>
          </div>
          <CardDescription>
            Baixe seus dados em formato CSV ou PDF
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => {
                setExportFormat("csv")
                setIsExportDialogOpen(true)
              }}
            >
              <FileSpreadsheet className="h-8 w-8 text-emerald-500" />
              <div className="text-center">
                <p className="font-medium">Exportar CSV</p>
                <p className="text-xs text-muted-foreground">
                  Para Excel, Google Sheets
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => {
                setExportFormat("pdf")
                setIsExportDialogOpen(true)
              }}
            >
              <FileText className="h-8 w-8 text-rose-500" />
              <div className="text-center">
                <p className="font-medium">Exportar PDF</p>
                <p className="text-xs text-muted-foreground">
                  Relatório formatado
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-500" />
            <CardTitle>Importar Transações</CardTitle>
          </div>
          <CardDescription>
            Importe transações de um arquivo CSV
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-6 border-2 border-dashed rounded-lg text-center">
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Arraste um arquivo CSV ou clique para selecionar
            </p>
            <Button onClick={handleImportClick} disabled={isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                "Selecionar Arquivo CSV"
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm font-medium mb-2">Formato esperado do CSV:</p>
            <code className="text-xs text-muted-foreground block">
              data,descricao,valor,tipo,categoria
            </code>
            <code className="text-xs text-muted-foreground block">
              2024-01-15,Supermercado,250.00,expense,Alimentação
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Backup & Restore */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-violet-500" />
            <CardTitle>Backup e Restauração</CardTitle>
          </div>
          <CardDescription>
            Faça backup completo dos seus dados ou restaure de um backup anterior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Cloud className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Último backup</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(stats.lastBackup)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={handleBackup}
              disabled={isBackingUp}
            >
              {isBackingUp ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <Download className="h-8 w-8 text-emerald-500" />
              )}
              <div className="text-center">
                <p className="font-medium">Criar Backup</p>
                <p className="text-xs text-muted-foreground">
                  Baixar todos os dados
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={handleRestoreClick}
              disabled={isRestoring}
            >
              {isRestoring ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <RefreshCw className="h-8 w-8 text-amber-500" />
              )}
              <div className="text-center">
                <p className="font-medium">Restaurar Backup</p>
                <p className="text-xs text-muted-foreground">
                  Carregar dados de backup
                </p>
              </div>
            </Button>
            <input
              ref={backupInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleRestoreFileSelect}
            />
          </div>

          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-600">Atenção</p>
                <p className="text-muted-foreground">
                  Restaurar um backup substituirá todos os dados atuais.
                  Certifique-se de fazer um backup antes de restaurar.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar Dados</DialogTitle>
            <DialogDescription>
              Escolha quais dados deseja exportar em {exportFormat.toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de dados</Label>
              <Select value={exportDataType} onValueChange={setExportDataType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transactions">Transações</SelectItem>
                  <SelectItem value="categories">Categorias</SelectItem>
                  <SelectItem value="accounts">Contas</SelectItem>
                  <SelectItem value="goals">Metas</SelectItem>
                  <SelectItem value="all">Todos os dados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Progress Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {importResult ? "Importação Concluída" : "Importando Dados"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-6">
            {!importResult ? (
              <div className="space-y-4">
                <Progress value={importProgress} className="h-2" />
                <p className="text-sm text-center text-muted-foreground">
                  Processando arquivo... {importProgress}%
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">
                    {importResult.success} transações importadas
                  </p>
                  {importResult.errors > 0 && (
                    <p className="text-sm text-amber-500">
                      {importResult.errors} linhas com erro foram ignoradas
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {importResult && (
            <DialogFooter>
              <Button onClick={() => setIsImportDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation */}
      <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar Backup?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação substituirá todos os seus dados atuais pelos dados do backup.
              Esta ação não pode ser desfeita. Recomendamos fazer um backup dos dados
              atuais antes de continuar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestoreConfirm}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restaurando...
                </>
              ) : (
                "Restaurar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
