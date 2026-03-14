"use client"

import { CheckCircle2, AlertTriangle, PlusCircle, Loader2 } from "lucide-react"

interface OcrTransaction {
  descricao: string
  valor: number
  data: string
  tipo: string
}

interface MatchedItem {
  ocrIndex: number
  ocr: OcrTransaction
  existing: { id: string; descricao: string; valor: number; data: string }
  existingId: string
  score: number
  source: "deterministic" | "ai"
}

interface NewItem {
  ocrIndex: number
  ocr: OcrTransaction
}

interface ConflictCandidate {
  existingId: string
  existing: { id: string; descricao: string; valor: number; data: string }
  score: number
}

interface ConflictItem {
  ocrIndex: number
  ocr: OcrTransaction
  candidates: ConflictCandidate[]
}

interface ReconciliationSummary {
  total: number
  matched: number
  new: number
  conflicts: number
}

interface ReconciliationResult {
  matched: MatchedItem[]
  new: NewItem[]
  conflicts: ConflictItem[]
  summary: ReconciliationSummary
}

interface ReconciliationViewProps {
  result: ReconciliationResult
  isLoading?: boolean
  onConfirmNew?: (ocrIndices: number[]) => void
  onResolveConflict?: (ocrIndex: number, existingId: string) => void
  onDismissMatch?: (ocrIndex: number) => void
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-")
  return `${day}/${month}/${year}`
}

export function ReconciliationView({
  result,
  isLoading,
  onConfirmNew,
  onResolveConflict,
  onDismissMatch,
}: ReconciliationViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="ml-3 text-sm text-zinc-400">Reconciliando transacoes...</span>
      </div>
    )
  }

  const { matched, conflicts, summary } = result
  const newItems = result.new

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Total" value={summary.total} color="text-zinc-300" />
        <SummaryCard label="Reconciliadas" value={summary.matched} color="text-emerald-400" />
        <SummaryCard label="Novas" value={summary.new} color="text-blue-400" />
        <SummaryCard label="Conflitos" value={summary.conflicts} color="text-amber-400" />
      </div>

      {/* Matched */}
      {matched.length > 0 && (
        <Section
          title="Reconciliadas automaticamente"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
          count={matched.length}
        >
          <div className="space-y-2">
            {matched.map((item) => (
              <MatchedRow key={item.ocrIndex} item={item} onDismiss={onDismissMatch} />
            ))}
          </div>
        </Section>
      )}

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <Section
          title="Conflitos (resolver manualmente)"
          icon={<AlertTriangle className="h-5 w-5 text-amber-400" />}
          count={conflicts.length}
        >
          <div className="space-y-3">
            {conflicts.map((item) => (
              <ConflictRow key={item.ocrIndex} item={item} onResolve={onResolveConflict} />
            ))}
          </div>
        </Section>
      )}

      {/* New */}
      {newItems.length > 0 && (
        <Section
          title="Novas transacoes"
          icon={<PlusCircle className="h-5 w-5 text-blue-400" />}
          count={newItems.length}
          action={
            onConfirmNew ? (
              <button
                onClick={() => onConfirmNew(newItems.map((i) => i.ocrIndex))}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                Importar todas
              </button>
            ) : undefined
          }
        >
          <div className="space-y-2">
            {newItems.map((item) => (
              <NewRow key={item.ocrIndex} item={item} />
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

// --- Sub-components ---

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  )
}

function Section({
  title,
  icon,
  count,
  action,
  children,
}: {
  title: string
  icon: React.ReactNode
  count: number
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30">
      <div className="flex items-center justify-between border-b border-zinc-700/50 px-4 py-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-medium text-zinc-200">
            {title} ({count})
          </h3>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function MatchedRow({
  item,
  onDismiss,
}: {
  item: MatchedItem
  onDismiss?: (ocrIndex: number) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-zinc-700/30 bg-zinc-800/50 px-3 py-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm text-zinc-200">{item.ocr.descricao}</span>
          <span className="shrink-0 text-xs text-zinc-500">{formatDate(item.ocr.data)}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
          <span>= {item.existing.descricao}</span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
              item.source === "ai"
                ? "bg-purple-500/20 text-purple-400"
                : "bg-emerald-500/20 text-emerald-400"
            }`}
          >
            {item.source === "ai" ? "IA" : "Auto"} {item.score}%
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-zinc-200">{formatCurrency(item.ocr.valor)}</span>
        {onDismiss && (
          <button
            onClick={() => onDismiss(item.ocrIndex)}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            Desfazer
          </button>
        )}
      </div>
    </div>
  )
}

function ConflictRow({
  item,
  onResolve,
}: {
  item: ConflictItem
  onResolve?: (ocrIndex: number, existingId: string) => void
}) {
  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-200">{item.ocr.descricao}</span>
        <span className="text-sm text-zinc-300">{formatCurrency(item.ocr.valor)}</span>
      </div>
      <p className="mb-2 text-xs text-zinc-500">Escolha a transacao correspondente:</p>
      <div className="space-y-1">
        {item.candidates.map((cand) => (
          <button
            key={cand.existingId}
            onClick={() => onResolve?.(item.ocrIndex, cand.existingId)}
            className="flex w-full items-center justify-between rounded border border-zinc-700/50 bg-zinc-800/50 px-2 py-1.5 text-left hover:border-indigo-500/50 hover:bg-zinc-700/50"
          >
            <div className="min-w-0 flex-1">
              <span className="truncate text-xs text-zinc-300">{cand.existing.descricao}</span>
              <span className="ml-2 text-xs text-zinc-500">{formatDate(cand.existing.data)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">{formatCurrency(cand.existing.valor)}</span>
              <span className="rounded-full bg-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400">
                {cand.score}%
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function NewRow({ item }: { item: NewItem }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-blue-500/20 bg-blue-500/5 px-3 py-2">
      <div className="min-w-0 flex-1">
        <span className="truncate text-sm text-zinc-200">{item.ocr.descricao}</span>
        <span className="ml-2 text-xs text-zinc-500">{formatDate(item.ocr.data)}</span>
      </div>
      <span className="text-sm font-medium text-zinc-200">{formatCurrency(item.ocr.valor)}</span>
    </div>
  )
}
