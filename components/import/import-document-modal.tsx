"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import {
  FileText,
  CreditCard,
  Upload,
  Camera,
  X,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn, formatCurrency } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Checkbox } from "@/components/ui/checkbox"

type DocumentType = "boleto" | "fatura"

interface ImportDocumentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ExtractedTransaction {
  descricao: string
  valor: number
  data: string
  tipo: "SAIDA" | "ENTRADA"
  categoria?: string
  selected?: boolean
}

type Step = "select" | "upload" | "preview" | "success"

export function ImportDocumentModal({
  open,
  onOpenChange,
}: ImportDocumentModalProps) {
  const { toast } = useToast()
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>("select")
  const [documentType, setDocumentType] = useState<DocumentType | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [transactions, setTransactions] = useState<ExtractedTransaction[]>([])
  const [error, setError] = useState<string | null>(null)

  const resetModal = () => {
    setStep("select")
    setDocumentType(null)
    setFile(null)
    setPreview(null)
    setIsLoading(false)
    setTransactions([])
    setError(null)
  }

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(resetModal, 300)
  }

  const handleSelectType = (type: DocumentType) => {
    setDocumentType(type)
    setStep("upload")
  }

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    setError(null)

    // Create preview for images
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleProcess = async () => {
    if (!file || !documentType) return

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", documentType)

      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar documento")
      }

      // Mark all transactions as selected by default
      const transactionsWithSelection = data.transactions.map(
        (t: ExtractedTransaction) => ({
          ...t,
          selected: true,
        })
      )

      setTransactions(transactionsWithSelection)
      setStep("preview")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar documento")
      toast({
        title: "Erro no processamento",
        description: err instanceof Error ? err.message : "Não foi possível processar o documento",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTransaction = (index: number) => {
    setTransactions((prev) =>
      prev.map((t, i) =>
        i === index ? { ...t, selected: !t.selected } : t
      )
    )
  }

  const toggleAll = (selected: boolean) => {
    setTransactions((prev) => prev.map((t) => ({ ...t, selected })))
  }

  const handleImport = () => {
    const selectedTransactions = transactions.filter((t) => t.selected)

    if (selectedTransactions.length === 0) {
      toast({
        title: "Nenhuma transação selecionada",
        description: "Selecione pelo menos uma transação para importar.",
        variant: "destructive",
      })
      return
    }

    // TODO: Actually import transactions to the store/API
    // For now, just show success

    setStep("success")

    toast({
      title: "Transações importadas",
      description: `${selectedTransactions.length} transação(ões) importada(s) com sucesso.`,
    })
  }

  const selectedCount = transactions.filter((t) => t.selected).length
  const totalValue = transactions
    .filter((t) => t.selected)
    .reduce((sum, t) => sum + t.valor, 0)

  const content = (
    <div className="space-y-4 py-2">
      {/* Step 1: Select document type */}
      {step === "select" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Selecione o tipo de documento que deseja importar
          </p>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleSelectType("boleto")}
              className={cn(
                "flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed",
                "hover:border-primary hover:bg-primary/5 transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <div className="h-14 w-14 rounded-full bg-amber-500/10 flex items-center justify-center">
                <FileText className="h-7 w-7 text-amber-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold">Boleto</p>
                <p className="text-xs text-muted-foreground">
                  Conta de luz, água, etc.
                </p>
              </div>
            </button>

            <button
              onClick={() => handleSelectType("fatura")}
              className={cn(
                "flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed",
                "hover:border-primary hover:bg-primary/5 transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <div className="h-14 w-14 rounded-full bg-purple-500/10 flex items-center justify-center">
                <CreditCard className="h-7 w-7 text-purple-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold">Fatura</p>
                <p className="text-xs text-muted-foreground">
                  Cartão de crédito
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Upload file */}
      {step === "upload" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStep("select")
                setFile(null)
                setPreview(null)
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            <span className="text-sm text-muted-foreground">
              {documentType === "boleto" ? "Importar Boleto" : "Importar Fatura"}
            </span>
          </div>

          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center gap-4 p-8 rounded-xl border-2 border-dashed",
                "cursor-pointer hover:border-primary hover:bg-primary/5 transition-all",
                "min-h-[200px]"
              )}
            >
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium">Arraste o arquivo aqui</p>
                <p className="text-sm text-muted-foreground">
                  ou clique para selecionar
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Tirar foto
                </Button>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Escolher arquivo
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Suporta: JPG, PNG, PDF (máx. 10MB)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File preview */}
              <div className="relative rounded-xl border bg-muted/30 p-4">
                <button
                  onClick={() => {
                    setFile(null)
                    setPreview(null)
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background"
                >
                  <X className="h-4 w-4" />
                </button>

                {preview ? (
                  <div className="relative w-full h-[300px]">
                    <Image
                      src={preview}
                      alt="Preview do documento"
                      fill
                      className="rounded-lg object-contain"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4">
                    <FileText className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Process button */}
              <Button
                onClick={handleProcess}
                disabled={isLoading}
                className="w-full h-12"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Processar documento
                  </>
                )}
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      )}

      {/* Step 3: Preview transactions */}
      {step === "preview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep("upload")}
            >
              <X className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            <span className="text-sm font-medium">
              {transactions.length} transação(ões) encontrada(s)
            </span>
          </div>

          {/* Select all */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedCount === transactions.length}
                onCheckedChange={(checked) => toggleAll(!!checked)}
              />
              <span className="text-sm font-medium">Selecionar todas</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {selectedCount} selecionada(s)
            </span>
          </div>

          {/* Transaction list */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {transactions.map((transaction, index) => (
              <div
                key={index}
                onClick={() => toggleTransaction(index)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                  transaction.selected
                    ? "border-primary bg-primary/5"
                    : "border-transparent bg-muted/30 hover:bg-muted/50"
                )}
              >
                <Checkbox
                  checked={transaction.selected}
                  onCheckedChange={() => toggleTransaction(index)}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{transaction.descricao}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{transaction.data}</span>
                    {transaction.categoria && (
                      <>
                        <span>•</span>
                        <span>{transaction.categoria}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className={cn(
                  "font-semibold",
                  transaction.tipo === "SAIDA" ? "text-rose-500" : "text-emerald-500"
                )}>
                  {transaction.tipo === "SAIDA" ? "-" : "+"}
                  {formatCurrency(transaction.valor)}
                </span>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transações selecionadas</span>
              <span className="font-medium">{selectedCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold text-lg text-rose-500">
                {formatCurrency(totalValue)}
              </span>
            </div>
          </div>

          {/* Import button */}
          <Button
            onClick={handleImport}
            disabled={selectedCount === 0}
            className="w-full h-12 bg-emerald-500 hover:bg-emerald-600"
          >
            <Check className="h-4 w-4 mr-2" />
            Importar {selectedCount} transação(ões)
          </Button>
        </div>
      )}

      {/* Step 4: Success */}
      {step === "success" && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Check className="h-8 w-8 text-emerald-500" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-lg">Importação concluída!</h3>
            <p className="text-sm text-muted-foreground">
              {selectedCount} transação(ões) foram adicionadas
            </p>
          </div>
          <Button onClick={handleClose} className="w-full">
            Fechar
          </Button>
        </div>
      )}
    </div>
  )

  const title = step === "select"
    ? "Importar Documento"
    : step === "upload"
    ? documentType === "boleto"
      ? "Importar Boleto"
      : "Importar Fatura"
    : step === "preview"
    ? "Revisar Transações"
    : "Sucesso"

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {step === "select" && <Upload className="h-5 w-5 text-primary" />}
              {step === "upload" && documentType === "boleto" && (
                <FileText className="h-5 w-5 text-amber-500" />
              )}
              {step === "upload" && documentType === "fatura" && (
                <CreditCard className="h-5 w-5 text-purple-500" />
              )}
              {step === "preview" && <FileText className="h-5 w-5 text-primary" />}
              {step === "success" && <Check className="h-5 w-5 text-emerald-500" />}
              {title}
            </DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center justify-center gap-2">
            {step === "select" && <Upload className="h-5 w-5 text-primary" />}
            {step === "upload" && documentType === "boleto" && (
              <FileText className="h-5 w-5 text-amber-500" />
            )}
            {step === "upload" && documentType === "fatura" && (
              <CreditCard className="h-5 w-5 text-purple-500" />
            )}
            {step === "preview" && <FileText className="h-5 w-5 text-primary" />}
            {step === "success" && <Check className="h-5 w-5 text-emerald-500" />}
            {title}
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-8">{content}</div>
      </DrawerContent>
    </Drawer>
  )
}
