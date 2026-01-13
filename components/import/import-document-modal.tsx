"use client"

import { useState, useRef, useMemo } from "react"
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
  AlertTriangle,
  Search,
  ChevronDown,
  ChevronUp,
  Pencil,
  Filter,
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { cn, formatCurrency } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Checkbox } from "@/components/ui/checkbox"
import { useStore } from "@/hooks/use-store"
import { useSWRData } from "@/hooks/use-swr-data"

type FilterType = "all" | "installments" | "single" | "duplicates"

// Componente de item de transação com suporte a edição
interface TransactionItemProps {
  transaction: {
    descricao: string
    valor: number
    data: string
    tipo: "SAIDA" | "ENTRADA"
    categoria?: string
    parcela?: number
    totalParcelas?: number
    selected?: boolean
  }
  index: number
  isDuplicate: boolean
  isEditing: boolean
  editForm: { descricao: string; categoria: string } | null
  onToggle: () => void
  onEdit: (e: React.MouseEvent) => void
  onEditChange: (form: { descricao: string; categoria: string } | null) => void
  onEditSave: () => void
  onEditCancel: () => void
  categories: string[]
  compact?: boolean
}

function TransactionItem({
  transaction,
  isDuplicate,
  isEditing,
  editForm,
  onToggle,
  onEdit,
  onEditChange,
  onEditSave,
  onEditCancel,
  categories,
  compact,
}: TransactionItemProps) {
  if (isEditing && editForm) {
    return (
      <div className={cn("p-3 space-y-2", compact ? "bg-muted/20" : "rounded-xl border-2 border-primary/50 bg-primary/5")}>
        <Input
          value={editForm.descricao}
          onChange={(e) => onEditChange({ ...editForm, descricao: e.target.value })}
          placeholder="Descrição"
          className="h-8 text-sm"
          autoFocus
        />
        <Select
          value={editForm.categoria || "none"}
          onValueChange={(v) => onEditChange({ ...editForm, categoria: v === "none" ? "" : v })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem categoria</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onEditCancel} className="flex-1 h-7 text-xs">
            Cancelar
          </Button>
          <Button size="sm" onClick={onEditSave} className="flex-1 h-7 text-xs">
            Salvar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onToggle}
      className={cn(
        "flex items-start gap-3 p-3 transition-all",
        compact ? "" : "rounded-xl border-2",
        isDuplicate
          ? compact ? "bg-amber-500/5 opacity-70" : "border-amber-500/30 bg-amber-500/5 cursor-not-allowed opacity-70"
          : transaction.selected
          ? compact ? "bg-primary/5" : "border-primary/50 bg-primary/5 cursor-pointer"
          : compact ? "hover:bg-muted/30" : "border-transparent bg-muted/40 hover:bg-muted/60 cursor-pointer"
      )}
    >
      <Checkbox
        checked={transaction.selected}
        disabled={isDuplicate}
        onCheckedChange={onToggle}
        onClick={(e) => e.stopPropagation()}
        className="mt-0.5 shrink-0"
      />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm leading-tight line-clamp-2">
            {transaction.descricao}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            {!isDuplicate && (
              <button
                onClick={onEdit}
                className="p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
            <span className={cn(
              "font-semibold text-sm whitespace-nowrap",
              transaction.tipo === "SAIDA" ? "text-rose-500" : "text-emerald-500"
            )}>
              {transaction.tipo === "SAIDA" ? "-" : "+"}
              {formatCurrency(transaction.valor)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground">
            {transaction.data}
          </span>
          {transaction.parcela && transaction.totalParcelas && (
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
              {transaction.parcela}/{transaction.totalParcelas}
            </span>
          )}
          {transaction.categoria && (
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
              {transaction.categoria}
            </span>
          )}
          {isDuplicate && (
            <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10">
              <AlertTriangle className="h-3 w-3" />
              Duplicada
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

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
  parcela?: number       // Número da parcela atual
  totalParcelas?: number // Total de parcelas
  selected?: boolean
  isDuplicate?: boolean
}

type Step = "select" | "upload" | "preview" | "success"

export function ImportDocumentModal({
  open,
  onOpenChange,
}: ImportDocumentModalProps) {
  const { toast } = useToast()
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { categories, transactions: existingTransactions } = useStore()
  const { mutators } = useSWRData()

  const [step, setStep] = useState<Step>("select")
  const [documentType, setDocumentType] = useState<DocumentType | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [transactions, setTransactions] = useState<ExtractedTransaction[]>([])
  const [error, setError] = useState<string | null>(null)
  const [duplicateIndices, setDuplicateIndices] = useState<Set<number>>(new Set())

  // Novos estados para filtros, busca e edição
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<FilterType>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<{ descricao: string; categoria: string } | null>(null)

  const resetModal = () => {
    setStep("select")
    setDocumentType(null)
    setFile(null)
    setPreview(null)
    setIsLoading(false)
    setTransactions([])
    setError(null)
    setDuplicateIndices(new Set())
    setSearchQuery("")
    setFilterType("all")
    setFilterCategory("all")
    setExpandedGroups(new Set())
    setEditingIndex(null)
    setEditForm(null)
  }

  // Função para normalizar descrição (remover acentos, lowercase, etc)
  const normalizeDescription = (desc: string): string => {
    return desc
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .replace(/\s+/g, " ")
      // Remover informações de parcela da descrição para comparação
      .replace(/parcela\s*\d+\s*(de|\/)\s*\d+/gi, "")
      .replace(/\d+\s*\/\s*\d+\s*$/, "")
      .trim()
  }

  // Função para verificar se uma transação é duplicada
  const checkDuplicate = (
    newTransaction: ExtractedTransaction,
    existing: typeof existingTransactions
  ): boolean => {
    if (existing.length === 0) return false

    const newDate = new Date(newTransaction.data)
    const newValue = Math.abs(newTransaction.valor)
    const newDesc = normalizeDescription(newTransaction.descricao)

    // Comparar com transações existentes
    return existing.some((existingTx) => {
      // Mesmo tipo
      const existingType = existingTx.type === "income" ? "ENTRADA" : "SAIDA"
      if (existingType !== newTransaction.tipo) return false

      // Mesmo valor (com tolerância de 0.01 para arredondamentos)
      const existingValue = Math.abs(existingTx.amount)
      if (Math.abs(existingValue - newValue) > 0.01) return false

      // Mesma data (com tolerância de ±3 dias para diferenças de processamento)
      const existingDate = new Date(existingTx.date)
      const daysDiff = Math.abs(
        (newDate.getTime() - existingDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysDiff > 3) return false

      // Descrição similar (normalizada, case-insensitive, sem acentos)
      const existingDesc = normalizeDescription(existingTx.description)

      // Verificar se as descrições são muito similares (80% de similaridade)
      const similarity = calculateSimilarity(newDesc, existingDesc)
      if (similarity < 0.8) return false

      // Se chegou aqui, é potencialmente duplicata
      // Mas para parcelas, precisamos verificar se é a MESMA parcela
      // Se a nova transação tem info de parcela, verificar se já existe essa parcela específica
      if (newTransaction.parcela && newTransaction.totalParcelas) {
        // Verificar se a descrição existente contém info da mesma parcela
        const existingDescFull = existingTx.description.toLowerCase()
        const parcelaPattern = new RegExp(
          `parcela\\s*${newTransaction.parcela}\\s*(de|\\/)\\s*${newTransaction.totalParcelas}|` +
          `${newTransaction.parcela}\\s*\\/\\s*${newTransaction.totalParcelas}`,
          "i"
        )

        // Se a descrição existente não menciona essa parcela específica,
        // pode ser outra parcela do mesmo produto - não é duplicata
        if (!parcelaPattern.test(existingDescFull)) {
          // Verificar se é uma parcela diferente do mesmo produto
          const anyParcelaPattern = /parcela\s*(\d+)\s*(de|\/)\s*(\d+)|(\d+)\s*\/\s*(\d+)/i
          const match = existingDescFull.match(anyParcelaPattern)
          if (match) {
            // Tem info de parcela diferente - não é duplicata
            return false
          }
        }
      }

      return true
    })
  }

  // Função para calcular similaridade entre strings (Jaccard similarity simplificado)
  const calculateSimilarity = (str1: string, str2: string): number => {
    if (str1 === str2) return 1.0

    // Se uma string contém a outra, alta similaridade
    if (str1.includes(str2) || str2.includes(str1)) return 0.9

    // Calcular palavras em comum
    const words1 = new Set(str1.split(/\s+/).filter((w) => w.length > 2))
    const words2 = new Set(str2.split(/\s+/).filter((w) => w.length > 2))

    if (words1.size === 0 || words2.size === 0) return 0

    const words1Array = Array.from(words1)
    const words2Array = Array.from(words2)
    const intersection = new Set(words1Array.filter((w) => words2.has(w)))
    const union = new Set([...words1Array, ...words2Array])

    return intersection.size / union.size
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

      // Detectar duplicatas antes de marcar como selecionadas
      const transactionsWithDuplicates = data.transactions.map(
        (t: ExtractedTransaction) => {
          const isDuplicate = checkDuplicate(t, existingTransactions)
          return {
            ...t,
            selected: !isDuplicate, // Não selecionar duplicatas por padrão
            isDuplicate,
          }
        }
      )

      // Encontrar índices das duplicatas
      const duplicates = new Set<number>()
      transactionsWithDuplicates.forEach((t: ExtractedTransaction & { isDuplicate?: boolean }, idx: number) => {
        if (t.isDuplicate) {
          duplicates.add(idx)
        }
      })

      setDuplicateIndices(duplicates)
      setTransactions(transactionsWithDuplicates)
      setStep("preview")

      // Mostrar aviso se houver duplicatas
      if (duplicates.size > 0) {
        toast({
          title: "Transações duplicadas detectadas",
          description: `${duplicates.size} transação(ões) já existem no sistema e foram desmarcadas automaticamente.`,
          variant: "default",
        })
      }
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

  const handleImport = async () => {
    const selectedTransactions = transactions.filter((t) => t.selected)

    if (selectedTransactions.length === 0) {
      toast({
        title: "Nenhuma transação selecionada",
        description: "Selecione pelo menos uma transação para importar.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Mapear nome de categoria para ID de categoria
      const findCategoryId = (categoryName: string | undefined): string | null => {
        if (!categoryName) return null
        
        // Normalizar nome da categoria (case-insensitive, remover acentos)
        const normalized = categoryName
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()

        // Mapear categorias comuns do OCR para categorias do sistema
        const categoryMap: Record<string, string[]> = {
          alimentação: ["alimentação", "comida", "restaurante", "supermercado"],
          transporte: ["transporte", "uber", "taxi", "combustível", "gasolina"],
          compras: ["compras", "shopping", "mercado", "mercado livre"],
          assinaturas: ["assinaturas", "streaming", "netflix", "spotify"],
          lazer: ["lazer", "entretenimento", "cinema", "show"],
          saúde: ["saúde", "farmacia", "médico", "hospital"],
          educação: ["educação", "escola", "curso", "livro"],
          moradia: ["moradia", "aluguel", "condomínio", "luz", "água", "internet"],
          outros: ["outros", "outras"],
        }

        // Procurar categoria exata primeiro
        const exactMatch = categories.find(
          (cat) => cat.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalized
        )
        if (exactMatch) return exactMatch.id

        // Procurar por mapeamento
        for (const [key, aliases] of Object.entries(categoryMap)) {
          if (aliases.some(alias => normalized.includes(alias))) {
            const matched = categories.find(
              (cat) => cat.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === key
            )
            if (matched) return matched.id
          }
        }

        // Se não encontrar, procurar por substring
        const partialMatch = categories.find(
          (cat) => cat.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(normalized) ||
                   normalized.includes(cat.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
        )
        if (partialMatch) return partialMatch.id

        return null
      }

      // Validar e preparar transações para importação
      const transactionsToImport = selectedTransactions.map((t) => {
        // Validar data (não pode ser muito no futuro ou muito no passado)
        const transactionDate = new Date(t.data)
        const today = new Date()
        const maxDate = new Date(today)
        maxDate.setFullYear(today.getFullYear() + 1) // Máximo 1 ano no futuro
        const minDate = new Date(today)
        minDate.setFullYear(today.getFullYear() - 10) // Máximo 10 anos no passado

        let finalDate = transactionDate
        if (transactionDate > maxDate) {
          finalDate = today // Se data no futuro, usar hoje
        } else if (transactionDate < minDate) {
          finalDate = today // Se data muito antiga, usar hoje
        }

        // Validar valor (deve ser positivo)
        const valor = Math.abs(t.valor)

        // Mapear tipo
        const tipo = t.tipo === "ENTRADA" ? "income" : "expense"

        // Encontrar categoria
        const categoryId = findCategoryId(t.categoria)

        // Montar descrição com info de parcela se existir
        let descricao = t.descricao.trim()
        if (t.parcela && t.totalParcelas) {
          descricao = `${descricao} (${t.parcela}/${t.totalParcelas})`
        }

        return {
          descricao,
          valor,
          tipo,
          data: finalDate.toISOString().split("T")[0], // Formato YYYY-MM-DD
          categoryId,
        }
      })

      // Importar transações em lote
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      for (const transaction of transactionsToImport) {
        try {
          const response = await fetch("/api/transacoes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              descricao: transaction.descricao,
              valor: transaction.valor,
              tipo: transaction.tipo === "income" ? "ENTRADA" : "SAIDA",
              data: transaction.data,
              categoryId: transaction.categoryId,
            }),
          })

          if (response.ok) {
            await response.json()
            successCount++
          } else {
            const error = await response.json()
            const errorMsg = error.error || "Erro desconhecido"
            errors.push(`${transaction.descricao}: ${errorMsg}`)
            errorCount++
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "Erro de conexão"
          errors.push(`${transaction.descricao}: ${errorMsg}`)
          errorCount++
        }
      }

      if (successCount > 0) {
        // Atualizar dados do SWR para refletir as novas transações
        await mutators.transactions()
        setStep("success")
        toast({
          title: "Importação concluída",
          description: `${successCount} transação(ões) importada(s) com sucesso.${errorCount > 0 ? ` ${errorCount} falharam.` : ""}`,
        })
      } else {
        const errorDetails = errors.length > 0 ? `\n\nErros:\n${errors.slice(0, 3).join("\n")}${errors.length > 3 ? `\n... e mais ${errors.length - 3} erro(s)` : ""}` : ""
        throw new Error(`Nenhuma transação foi importada. Verifique os dados e tente novamente.${errorDetails}`)
      }
    } catch (err) {
      toast({
        title: "Erro na importação",
        description: err instanceof Error ? err.message : "Erro ao importar transações",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedCount = transactions.filter((t) => t.selected).length

  // Calcular total considerando tipo (SAIDA subtrai, ENTRADA soma)
  const totalValue = transactions
    .filter((t) => t.selected)
    .reduce((sum, t) => {
      if (t.tipo === "ENTRADA") {
        return sum + t.valor
      } else {
        return sum - t.valor
      }
    }, 0)

  // Obter categorias únicas das transações
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>()
    transactions.forEach((t) => {
      if (t.categoria) cats.add(t.categoria)
    })
    return Array.from(cats).sort()
  }, [transactions])

  // Agrupar transações por estabelecimento (para parcelas)
  interface TransactionGroup {
    key: string
    descricao: string
    transactions: Array<ExtractedTransaction & { originalIndex: number }>
    totalValor: number
    isInstallment: boolean
  }

  const groupedTransactions = useMemo(() => {
    // Primeiro, aplicar filtros
    let filtered = transactions.map((t, i) => ({ ...t, originalIndex: i }))

    // Filtro de busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((t) =>
        t.descricao.toLowerCase().includes(query) ||
        t.categoria?.toLowerCase().includes(query)
      )
    }

    // Filtro de tipo
    if (filterType === "installments") {
      filtered = filtered.filter((t) => t.parcela && t.totalParcelas)
    } else if (filterType === "single") {
      filtered = filtered.filter((t) => !t.parcela || !t.totalParcelas)
    } else if (filterType === "duplicates") {
      filtered = filtered.filter((t) => duplicateIndices.has(t.originalIndex))
    }

    // Filtro de categoria
    if (filterCategory !== "all") {
      filtered = filtered.filter((t) => t.categoria === filterCategory)
    }

    // Agrupar por descrição (para parcelas do mesmo estabelecimento)
    const groups = new Map<string, TransactionGroup>()

    filtered.forEach((t) => {
      // Criar chave de agrupamento baseada na descrição normalizada
      const normalizedDesc = t.descricao
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim()

      // Se for parcela, agrupar. Senão, cada transação é seu próprio grupo
      const isInstallment = !!(t.parcela && t.totalParcelas)
      const key = isInstallment ? `installment_${normalizedDesc}` : `single_${t.originalIndex}`

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          descricao: t.descricao,
          transactions: [],
          totalValor: 0,
          isInstallment,
        })
      }

      const group = groups.get(key)!
      group.transactions.push(t)
      group.totalValor += t.valor
    })

    // Ordenar transações dentro de cada grupo por número da parcela
    groups.forEach((group) => {
      group.transactions.sort((a, b) => (a.parcela || 0) - (b.parcela || 0))
    })

    return Array.from(groups.values())
  }, [transactions, searchQuery, filterType, filterCategory, duplicateIndices])

  // Toggle expansão de grupo
  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  // Selecionar/deselecionar grupo inteiro
  const toggleGroupSelection = (group: TransactionGroup) => {
    const allSelected = group.transactions.every((t) => t.selected)
    const newSelected = !allSelected

    setTransactions((prev) =>
      prev.map((t, i) => {
        const inGroup = group.transactions.some((gt) => gt.originalIndex === i)
        if (inGroup && !duplicateIndices.has(i)) {
          return { ...t, selected: newSelected }
        }
        return t
      })
    )
  }

  // Editar transação
  const startEditing = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const t = transactions[index]
    if (!t) return
    setEditingIndex(index)
    setEditForm({ descricao: t.descricao, categoria: t.categoria || "" })
  }

  const saveEditing = () => {
    if (editingIndex === null || !editForm) return

    setTransactions((prev) =>
      prev.map((t, i) =>
        i === editingIndex
          ? { ...t, descricao: editForm.descricao, categoria: editForm.categoria || undefined }
          : t
      )
    )
    setEditingIndex(null)
    setEditForm(null)
  }

  const cancelEditing = () => {
    setEditingIndex(null)
    setEditForm(null)
  }

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
                Suporta: JPG, PNG, PDF (máx. 10MB imagens, 32MB PDFs)
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
        <div className="flex flex-col h-full -my-2">
          {/* Barra de busca e filtros */}
          <div className="space-y-2 py-3 border-b">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar transações..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="installments">Parcelas</SelectItem>
                  <SelectItem value="single">À vista</SelectItem>
                  {duplicateIndices.size > 0 && (
                    <SelectItem value="duplicates">Duplicadas ({duplicateIndices.size})</SelectItem>
                  )}
                </SelectContent>
              </Select>

              {uniqueCategories.length > 0 && (
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas categorias</SelectItem>
                    {uniqueCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Seleção e contador */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={selectedCount === transactions.length && duplicateIndices.size === 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setTransactions((prev) =>
                        prev.map((t, i) => ({
                          ...t,
                          selected: !duplicateIndices.has(i),
                        }))
                      )
                    } else {
                      toggleAll(false)
                    }
                  }}
                />
                <label htmlFor="select-all" className="text-xs font-medium cursor-pointer">
                  Selecionar todas
                </label>
              </div>
              <div className="flex items-center gap-2">
                {duplicateIndices.size > 0 && filterType !== "duplicates" && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {duplicateIndices.size}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {selectedCount}/{transactions.length}
                </span>
              </div>
            </div>
          </div>

          {/* Lista de transações agrupadas */}
          <div className="flex-1 overflow-y-auto py-2 -mx-1 px-1 min-h-0 max-h-[35vh] md:max-h-[45vh]">
            {groupedTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Nenhuma transação encontrada</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {groupedTransactions.map((group) => {
                  const isExpanded = expandedGroups.has(group.key)
                  const groupSelectedCount = group.transactions.filter((t) => t.selected).length
                  const allSelected = groupSelectedCount === group.transactions.length
                  const someSelected = groupSelectedCount > 0 && !allSelected

                  // Se for grupo de parcelas com mais de 1 transação
                  if (group.isInstallment && group.transactions.length > 1) {
                    return (
                      <div key={group.key} className="rounded-xl border-2 border-muted overflow-hidden">
                        {/* Cabeçalho do grupo */}
                        <div
                          className={cn(
                            "flex items-center gap-3 p-3 cursor-pointer transition-colors",
                            allSelected ? "bg-primary/5" : "bg-muted/30 hover:bg-muted/50"
                          )}
                          onClick={() => toggleGroup(group.key)}
                        >
                          <Checkbox
                            checked={allSelected}
                            ref={(el) => {
                              if (el && someSelected) {
                                (el as HTMLButtonElement).dataset.state = "indeterminate"
                              }
                            }}
                            onCheckedChange={() => toggleGroupSelection(group)}
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">{group.descricao}</p>
                              <span className="text-xs px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium shrink-0">
                                {group.transactions.length} parcelas
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {groupSelectedCount}/{group.transactions.length} selecionadas
                            </p>
                          </div>
                          <span className="font-semibold text-sm text-rose-500 shrink-0">
                            -{formatCurrency(group.totalValor)}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                        </div>

                        {/* Transações expandidas */}
                        {isExpanded && (
                          <div className="border-t divide-y">
                            {group.transactions.map((t) => {
                              const isDuplicate = duplicateIndices.has(t.originalIndex)
                              return (
                                <TransactionItem
                                  key={t.originalIndex}
                                  transaction={t}
                                  index={t.originalIndex}
                                  isDuplicate={isDuplicate}
                                  isEditing={editingIndex === t.originalIndex}
                                  editForm={editForm}
                                  onToggle={() => !isDuplicate && toggleTransaction(t.originalIndex)}
                                  onEdit={(e) => startEditing(t.originalIndex, e)}
                                  onEditChange={setEditForm}
                                  onEditSave={saveEditing}
                                  onEditCancel={cancelEditing}
                                  categories={uniqueCategories}
                                  compact
                                />
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  }

                  // Transação individual (não agrupada)
                  const t = group.transactions[0]
                  if (!t) return null
                  const isDuplicate = duplicateIndices.has(t.originalIndex)
                  return (
                    <TransactionItem
                      key={t.originalIndex}
                      transaction={t}
                      index={t.originalIndex}
                      isDuplicate={isDuplicate}
                      isEditing={editingIndex === t.originalIndex}
                      editForm={editForm}
                      onToggle={() => !isDuplicate && toggleTransaction(t.originalIndex)}
                      onEdit={(e) => startEditing(t.originalIndex, e)}
                      onEditChange={setEditForm}
                      onEditSave={saveEditing}
                      onEditCancel={cancelEditing}
                      categories={uniqueCategories}
                    />
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer com resumo e botão */}
          <div className="pt-3 border-t mt-2 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{selectedCount}</span> selecionada{selectedCount !== 1 ? 's' : ''}
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground block">Total</span>
                <span className={cn(
                  "font-bold text-lg",
                  totalValue >= 0 ? "text-emerald-500" : "text-rose-500"
                )}>
                  {formatCurrency(Math.abs(totalValue))}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("upload")}
                className="shrink-0"
              >
                Voltar
              </Button>
              <Button
                onClick={handleImport}
                disabled={selectedCount === 0 || isLoading}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Importar {selectedCount}
                  </>
                )}
              </Button>
            </div>
          </div>
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
        <DialogContent className={cn(
          "max-w-md",
          step === "preview" && "max-w-lg"
        )}>
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
