"use client"

import { useState } from "react"
import {
  Plus,
  Pencil,
  Trash2,
  Crown,
  User as UserIcon,
  Mail,
  Check,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import { useToast } from "@/hooks/use-toast"
import { cn, generateId } from "@/lib/utils"

interface FamilyMember {
  id: string
  name: string
  email: string
  avatar?: string | null
  isAdmin: boolean
}

interface FamilyMembersTabProps {
  members: FamilyMember[]
  onMembersChange: (members: FamilyMember[]) => void
}

const avatarSeeds = [
  "Felix", "Aneka", "Maria", "John", "Sophie", "Alex", "Luna", "Max",
  "Bella", "Leo", "Mia", "Oscar", "Emma", "Noah", "Ava", "Liam"
]

export function FamilyMembersTab({ members, onMembersChange }: FamilyMembersTabProps) {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [deletingMember, setDeletingMember] = useState<FamilyMember | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    avatar: "",
  })
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)

  const handleOpenCreate = () => {
    setEditingMember(null)
    setFormData({ name: "", email: "", avatar: "" })
    setSelectedAvatar(null)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (member: FamilyMember) => {
    setEditingMember(member)
    setFormData({
      name: member.name,
      email: member.email,
      avatar: member.avatar || "",
    })
    setSelectedAvatar(member.avatar || null)
    setIsDialogOpen(true)
  }

  const handleOpenDelete = (member: FamilyMember) => {
    if (member.isAdmin) {
      toast({
        title: "Não é possível excluir",
        description: "O administrador não pode ser removido.",
        variant: "destructive",
      })
      return
    }
    setDeletingMember(member)
    setIsDeleteDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do membro.",
        variant: "destructive",
      })
      return
    }

    if (editingMember) {
      // Update existing member
      const updated = members.map((m) =>
        m.id === editingMember.id
          ? { ...m, name: formData.name, email: formData.email, avatar: selectedAvatar }
          : m
      )
      onMembersChange(updated)
      toast({
        title: "Membro atualizado",
        description: `${formData.name} foi atualizado com sucesso.`,
      })
    } else {
      // Create new member
      const newMember: FamilyMember = {
        id: generateId(),
        name: formData.name,
        email: formData.email,
        avatar: selectedAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`,
        isAdmin: false,
      }
      onMembersChange([...members, newMember])
      toast({
        title: "Membro adicionado",
        description: `${formData.name} foi adicionado à família.`,
      })
    }

    setIsDialogOpen(false)
  }

  const handleDelete = () => {
    if (!deletingMember) return

    const updated = members.filter((m) => m.id !== deletingMember.id)
    onMembersChange(updated)
    toast({
      title: "Membro removido",
      description: `${deletingMember.name} foi removido da família.`,
    })
    setIsDeleteDialogOpen(false)
    setDeletingMember(null)
  }

  const handleSetAdmin = (memberId: string) => {
    const updated = members.map((m) => ({
      ...m,
      isAdmin: m.id === memberId,
    }))
    onMembersChange(updated)
    const newAdmin = members.find((m) => m.id === memberId)
    toast({
      title: "Administrador alterado",
      description: `${newAdmin?.name} agora é o administrador.`,
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Membros da Família</CardTitle>
              <CardDescription>
                Gerencie quem tem acesso ao app e suas permissões
              </CardDescription>
            </div>
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Membro
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-4",
                  member.isAdmin && "border-amber-500/50 bg-amber-500/5"
                )}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar || undefined} alt={member.name} />
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{member.name}</p>
                      {member.isAdmin && (
                        <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-600">
                          <Crown className="h-3 w-3" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!member.isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetAdmin(member.id)}
                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                    >
                      <Crown className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(member)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDelete(member)}
                    className={cn(
                      "text-destructive hover:text-destructive",
                      member.isAdmin && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={member.isAdmin}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {members.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <UserIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhum membro cadastrado</p>
                <Button variant="outline" className="mt-4" onClick={handleOpenCreate}>
                  Adicionar primeiro membro
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMember ? "Editar Membro" : "Novo Membro"}
            </DialogTitle>
            <DialogDescription>
              {editingMember
                ? "Atualize as informações do membro"
                : "Adicione um novo membro à família"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Avatar Selection */}
            <div className="space-y-3">
              <Label>Avatar</Label>
              <div className="flex flex-wrap gap-2">
                {avatarSeeds.map((seed) => {
                  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`
                  const isSelected = selectedAvatar === avatarUrl
                  return (
                    <button
                      key={seed}
                      type="button"
                      onClick={() => setSelectedAvatar(avatarUrl)}
                      className={cn(
                        "relative rounded-full transition-all",
                        isSelected && "ring-2 ring-primary ring-offset-2"
                      )}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={avatarUrl} />
                      </Avatar>
                      {isSelected && (
                        <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do membro"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingMember ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {deletingMember?.name} da família?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
