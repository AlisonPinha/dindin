"use client"

import { useState } from "react"
import {
  Bell,
  BellOff,
  Mail,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Wallet,
  Save,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface NotificationSettings {
  categoryLimitEnabled: boolean
  categoryLimitThreshold: number
  weeklyEmailEnabled: boolean
  weeklyEmailDay: string
  transactionReminderEnabled: boolean
  transactionReminderTime: string
  goalProgressEnabled: boolean
  budgetAlertEnabled: boolean
  budgetAlertThreshold: number
}

interface NotificationsTabProps {
  settings: NotificationSettings
  onSettingsChange: (settings: NotificationSettings) => void
}

const weekDays = [
  { value: "monday", label: "Segunda-feira" },
  { value: "tuesday", label: "Terça-feira" },
  { value: "wednesday", label: "Quarta-feira" },
  { value: "thursday", label: "Quinta-feira" },
  { value: "friday", label: "Sexta-feira" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
]

const reminderTimes = [
  { value: "morning", label: "Manhã (9h)" },
  { value: "afternoon", label: "Tarde (14h)" },
  { value: "evening", label: "Noite (19h)" },
  { value: "night", label: "Noite (21h)" },
]

export function NotificationsTab({ settings, onSettingsChange }: NotificationsTabProps) {
  const { toast } = useToast()
  const [localSettings, setLocalSettings] = useState(settings)
  const [isDirty, setIsDirty] = useState(false)

  const updateSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }))
    setIsDirty(true)
  }

  const handleSave = () => {
    onSettingsChange(localSettings)
    setIsDirty(false)
    toast({
      title: "Preferências salvas",
      description: "Suas configurações de notificação foram atualizadas.",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header with Save Button */}
      {isDirty && (
        <div className="flex justify-end">
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Salvar Alterações
          </Button>
        </div>
      )}

      {/* Category Limit Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle>Alertas de Limite de Categoria</CardTitle>
          </div>
          <CardDescription>
            Receba alertas quando seus gastos em uma categoria atingirem determinado percentual do limite
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ativar alertas de limite</Label>
              <p className="text-sm text-muted-foreground">
                Notificar quando categorias atingirem o limite
              </p>
            </div>
            <Switch
              checked={localSettings.categoryLimitEnabled}
              onCheckedChange={(checked) => updateSetting("categoryLimitEnabled", checked)}
            />
          </div>

          {localSettings.categoryLimitEnabled && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Alertar quando atingir</Label>
                  <span className="font-semibold text-amber-500">
                    {localSettings.categoryLimitThreshold}%
                  </span>
                </div>
                <Slider
                  value={[localSettings.categoryLimitThreshold]}
                  onValueChange={(value) => updateSetting("categoryLimitThreshold", value[0])}
                  min={50}
                  max={100}
                  step={5}
                  className="[&_[role=slider]]:border-amber-500"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget Alert */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-500" />
            <CardTitle>Alerta de Orçamento Geral</CardTitle>
          </div>
          <CardDescription>
            Receba alertas quando seus gastos totais atingirem percentual da renda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ativar alerta de orçamento</Label>
              <p className="text-sm text-muted-foreground">
                Notificar quando gastos atingirem % da renda
              </p>
            </div>
            <Switch
              checked={localSettings.budgetAlertEnabled}
              onCheckedChange={(checked) => updateSetting("budgetAlertEnabled", checked)}
            />
          </div>

          {localSettings.budgetAlertEnabled && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Alertar quando atingir</Label>
                  <span className="font-semibold text-blue-500">
                    {localSettings.budgetAlertThreshold}% da renda
                  </span>
                </div>
                <Slider
                  value={[localSettings.budgetAlertThreshold]}
                  onValueChange={(value) => updateSetting("budgetAlertThreshold", value[0])}
                  min={50}
                  max={100}
                  step={5}
                  className="[&_[role=slider]]:border-blue-500"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Email Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-emerald-500" />
            <CardTitle>Resumo Semanal por Email</CardTitle>
          </div>
          <CardDescription>
            Receba um resumo semanal das suas finanças por email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enviar resumo semanal</Label>
              <p className="text-sm text-muted-foreground">
                Gastos, saldo, metas e dicas da semana
              </p>
            </div>
            <Switch
              checked={localSettings.weeklyEmailEnabled}
              onCheckedChange={(checked) => updateSetting("weeklyEmailEnabled", checked)}
            />
          </div>

          {localSettings.weeklyEmailEnabled && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Dia do envio</Label>
                <Select
                  value={localSettings.weeklyEmailDay}
                  onValueChange={(value) => updateSetting("weeklyEmailDay", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {weekDays.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Reminder */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-violet-500" />
            <CardTitle>Lembrete de Lançar Transações</CardTitle>
          </div>
          <CardDescription>
            Receba lembretes diários para registrar suas transações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ativar lembretes</Label>
              <p className="text-sm text-muted-foreground">
                Lembrar de registrar gastos do dia
              </p>
            </div>
            <Switch
              checked={localSettings.transactionReminderEnabled}
              onCheckedChange={(checked) => updateSetting("transactionReminderEnabled", checked)}
            />
          </div>

          {localSettings.transactionReminderEnabled && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Horário do lembrete</Label>
                <Select
                  value={localSettings.transactionReminderTime}
                  onValueChange={(value) => updateSetting("transactionReminderTime", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reminderTimes.map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goal Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-rose-500" />
            <CardTitle>Progresso de Metas</CardTitle>
          </div>
          <CardDescription>
            Receba notificações sobre o progresso das suas metas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações de metas</Label>
              <p className="text-sm text-muted-foreground">
                Atualizações quando atingir marcos (25%, 50%, 75%, 100%)
              </p>
            </div>
            <Switch
              checked={localSettings.goalProgressEnabled}
              onCheckedChange={(checked) => updateSetting("goalProgressEnabled", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-background">
              {localSettings.categoryLimitEnabled ||
              localSettings.weeklyEmailEnabled ||
              localSettings.transactionReminderEnabled ||
              localSettings.goalProgressEnabled ||
              localSettings.budgetAlertEnabled ? (
                <Bell className="h-5 w-5 text-emerald-500" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="font-medium">Status das Notificações</p>
              <div className="text-sm text-muted-foreground mt-1 space-y-1">
                <p>
                  Alertas de categoria:{" "}
                  <span className={localSettings.categoryLimitEnabled ? "text-emerald-500" : "text-rose-500"}>
                    {localSettings.categoryLimitEnabled ? "Ativo" : "Desativado"}
                  </span>
                </p>
                <p>
                  Alerta de orçamento:{" "}
                  <span className={localSettings.budgetAlertEnabled ? "text-emerald-500" : "text-rose-500"}>
                    {localSettings.budgetAlertEnabled ? "Ativo" : "Desativado"}
                  </span>
                </p>
                <p>
                  Resumo semanal:{" "}
                  <span className={localSettings.weeklyEmailEnabled ? "text-emerald-500" : "text-rose-500"}>
                    {localSettings.weeklyEmailEnabled ? "Ativo" : "Desativado"}
                  </span>
                </p>
                <p>
                  Lembretes diários:{" "}
                  <span className={localSettings.transactionReminderEnabled ? "text-emerald-500" : "text-rose-500"}>
                    {localSettings.transactionReminderEnabled ? "Ativo" : "Desativado"}
                  </span>
                </p>
                <p>
                  Progresso de metas:{" "}
                  <span className={localSettings.goalProgressEnabled ? "text-emerald-500" : "text-rose-500"}>
                    {localSettings.goalProgressEnabled ? "Ativo" : "Desativado"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
