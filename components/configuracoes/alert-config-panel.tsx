"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Trash2, MessageCircle, Monitor, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api/fetch"

interface Category {
  id: string
  name: string
  color: string
}

interface AlertConfig {
  id: string
  categoria_id: string | null
  threshold: number
  canal: string
  categorias?: { nome: string; cor: string } | null
}

interface AlertConfigPanelProps {
  categories: Category[]
}

export function AlertConfigPanel({ categories }: AlertConfigPanelProps) {
  const { toast } = useToast()
  const [alerts, setAlerts] = useState<AlertConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedThreshold, setSelectedThreshold] = useState("80")
  const [selectedChannel, setSelectedChannel] = useState("dashboard")

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alertas")
      if (res.ok) {
        const data = await res.json()
        setAlerts(data)
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const handleAdd = async () => {
    if (!selectedCategory) {
      toast({ title: "Selecione uma categoria", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const res = await apiFetch("/api/alertas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: selectedCategory,
          threshold: parseInt(selectedThreshold),
          channel: selectedChannel,
        }),
      })

      if (res.ok) {
        toast({ title: "Alerta configurado" })
        setSelectedCategory("")
        await fetchAlerts()
      } else {
        const data = await res.json()
        toast({ title: data.error || "Erro ao criar alerta", variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro ao criar alerta", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await apiFetch(`/api/alertas?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== id))
        toast({ title: "Alerta removido" })
      }
    } catch {
      toast({ title: "Erro ao remover alerta", variant: "destructive" })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-500" />
          <CardTitle>Alertas por Categoria (WhatsApp/Dashboard)</CardTitle>
        </div>
        <CardDescription>
          Configure alertas individuais por categoria com envio via WhatsApp ou dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new alert */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
          <div className="space-y-1">
            <Label className="text-xs">Categoria</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Threshold</Label>
            <Select value={selectedThreshold} onValueChange={setSelectedThreshold}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="70">70%</SelectItem>
                <SelectItem value="80">80%</SelectItem>
                <SelectItem value="90">90%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Canal</Label>
            <Select value={selectedChannel} onValueChange={setSelectedChannel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dashboard">
                  <span className="flex items-center gap-1.5">
                    <Monitor className="h-3 w-3" /> Dashboard
                  </span>
                </SelectItem>
                <SelectItem value="whatsapp">
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="h-3 w-3" /> WhatsApp
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleAdd} disabled={isSaving} className="gap-1.5">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Adicionar
          </Button>
        </div>

        {/* List existing alerts */}
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
          </div>
        ) : alerts.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhum alerta configurado
          </p>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  {alert.canal === "whatsapp" ? (
                    <MessageCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Monitor className="h-4 w-4 text-blue-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {alert.categorias?.nome || "Geral"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Alertar em {alert.threshold}% via{" "}
                      {alert.canal === "whatsapp" ? "WhatsApp" : "Dashboard"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(alert.id)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
