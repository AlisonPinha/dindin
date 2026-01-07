"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  X,
  Check,
  CheckCheck,
  Trash2,
  ArrowRight,
  History,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/hooks/use-notifications"
import type { AppNotification, NotificationType } from "@/types"

const typeConfig: Record<
  NotificationType,
  {
    icon: React.ElementType
    color: string
    bg: string
  }
> = {
  info: {
    icon: Info,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  danger: {
    icon: XCircle,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  success: {
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
}

interface NotificationItemProps {
  notification: AppNotification
  onMarkAsRead: (id: string) => void
  onRemove: (id: string) => void
  onAction?: (notification: AppNotification) => void
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onRemove,
  onAction,
}: NotificationItemProps) {
  const config = typeConfig[notification.type]
  const Icon = config.icon

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id)
    }
    if (notification.action) {
      onAction?.(notification)
    }
  }

  return (
    <div
      className={cn(
        "group relative flex gap-3 p-3 rounded-lg transition-colors cursor-pointer",
        notification.isRead
          ? "bg-transparent hover:bg-muted/50"
          : "bg-muted/30 hover:bg-muted/50"
      )}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
      )}

      {/* Icon */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          config.bg
        )}
      >
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <p
          className={cn(
            "text-sm leading-tight",
            notification.isRead ? "font-normal" : "font-medium"
          )}
        >
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/60">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>
          {notification.action && (
            <span
              className={cn(
                "text-[10px] font-medium flex items-center gap-0.5",
                config.color
              )}
            >
              {notification.action.label}
              <ArrowRight className="h-2.5 w-2.5" />
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.isRead && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMarkAsRead(notification.id)
            }}
            className="p-1 rounded-md hover:bg-background text-muted-foreground hover:text-foreground"
            title="Marcar como lida"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(notification.id)
          }}
          className="p-1 rounded-md hover:bg-background text-muted-foreground hover:text-destructive"
          title="Remover"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export function NotificationCenter() {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    clearRead,
    getUnreadCount,
  } = useNotifications()

  const [isOpen, setIsOpen] = useState(false)
  const unreadCount = getUnreadCount()

  const unreadNotifications = notifications.filter((n) => !n.isRead)
  // readNotifications used in "all" tab which shows all notifications

  const handleAction = (notification: AppNotification) => {
    if (notification.action?.href) {
      window.location.href = notification.action.href
      setIsOpen(false)
    }
    if (notification.action?.onClick) {
      notification.action.onClick()
      setIsOpen(false)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-40" />
              <span className="relative flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                {unreadCount} nova{unreadCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={markAllAsRead}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar todas
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="unread" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-10 p-0">
            <TabsTrigger
              value="unread"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4"
            >
              Não lidas
              {unreadCount > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  ({unreadCount})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4"
            >
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unread" className="mt-0">
            <ScrollArea className="h-[320px]">
              {unreadNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Bell className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">Tudo em dia!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Nenhuma notificação pendente
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {unreadNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onRemove={removeNotification}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="all" className="mt-0">
            <ScrollArea className="h-[320px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <History className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">Sem histórico</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Suas notificações aparecerão aqui
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onRemove={removeNotification}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={clearRead}
            >
              <Trash2 className="h-3 w-3" />
              Limpar lidas
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive gap-1"
              onClick={clearAll}
            >
              <Trash2 className="h-3 w-3" />
              Limpar todas
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
