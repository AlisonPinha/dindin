"use client"

import { useState } from "react"
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Tag,
  ArrowUpCircle,
  ArrowDownCircle,
  Lock,
  Home,
  ShoppingBag,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { cn, generateId } from "@/lib/utils"

type CategoryType = "income" | "expense"
type BudgetGroup = "essentials" | "lifestyle" | "investments"

interface CategoryWithGroup {
  id: string
  name: string
  type: CategoryType
  color: string
  icon?: string
  budgetGroup?: BudgetGroup
  isDefault: boolean
  order: number
}

interface CategoriesTabProps {
  categories: CategoryWithGroup[]
  onCategoriesChange: (categories: CategoryWithGroup[]) => void
}

const colorOptions = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#0ea5e9", "#3b82f6", "#8b5cf6", "#d946ef", "#ec4899",
  "#64748b", "#71717a",
]

const budgetGroups: { value: BudgetGroup; label: string; icon: React.ElementType; color: string }[] = [
  { value: "essentials", label: "Essenciais (50%)", icon: Home, color: "text-blue-500" },
  { value: "lifestyle", label: "Estilo de Vida (30%)", icon: ShoppingBag, color: "text-purple-500" },
  { value: "investments", label: "Investimentos (20%)", icon: TrendingUp, color: "text-emerald-500" },
]

export function CategoriesTab({ categories, onCategoriesChange }: CategoriesTabProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<CategoryType>("expense")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryWithGroup | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<CategoryWithGroup | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    type: "expense" as CategoryType,
    color: "#3b82f6",
    budgetGroup: "lifestyle" as BudgetGroup,
  })

  const filteredCategories = categories
    .filter((c) => c.type === activeTab)
    .sort((a, b) => a.order - b.order)

  const handleOpenCreate = () => {
    setEditingCategory(null)
    setFormData({
      name: "",
      type: activeTab,
      color: "#3b82f6",
      budgetGroup: activeTab === "expense" ? "lifestyle" : "investments",
    })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (category: CategoryWithGroup) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color,
      budgetGroup: category.budgetGroup || "lifestyle",
    })
    setIsDialogOpen(true)
  }

  const handleOpenDelete = (category: CategoryWithGroup) => {
    if (category.isDefault) {
      toast({
        title: "Categoria protegida",
        description: "Categorias padrão não podem ser excluídas.",
        variant: "destructive",
      })
      return
    }
    setDeletingCategory(category)
    setIsDeleteDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome da categoria.",
        variant: "destructive",
      })
      return
    }

    if (editingCategory) {
      const updated = categories.map((c) =>
        c.id === editingCategory.id
          ? {
              ...c,
              name: formData.name,
              color: formData.color,
              budgetGroup: formData.type === "expense" ? formData.budgetGroup : undefined,
            }
          : c
      )
      onCategoriesChange(updated)
      toast({
        title: "Categoria atualizada",
        description: `${formData.name} foi atualizada com sucesso.`,
      })
    } else {
      const maxOrder = Math.max(...categories.filter((c) => c.type === formData.type).map((c) => c.order), 0)
      const newCategory: CategoryWithGroup = {
        id: generateId(),
        name: formData.name,
        type: formData.type,
        color: formData.color,
        budgetGroup: formData.type === "expense" ? formData.budgetGroup : undefined,
        isDefault: false,
        order: maxOrder + 1,
      }
      onCategoriesChange([...categories, newCategory])
      toast({
        title: "Categoria criada",
        description: `${formData.name} foi adicionada com sucesso.`,
      })
    }

    setIsDialogOpen(false)
  }

  const handleDelete = () => {
    if (!deletingCategory) return

    const updated = categories.filter((c) => c.id !== deletingCategory.id)
    onCategoriesChange(updated)
    toast({
      title: "Categoria excluída",
      description: `${deletingCategory.name} foi removida.`,
    })
    setIsDeleteDialogOpen(false)
    setDeletingCategory(null)
  }

  const handleMoveUp = (category: CategoryWithGroup) => {
    const sameTypeCategories = categories.filter((c) => c.type === category.type).sort((a, b) => a.order - b.order)
    const index = sameTypeCategories.findIndex((c) => c.id === category.id)
    if (index <= 0) return

    const updated = categories.map((c) => {
      if (c.id === category.id) return { ...c, order: sameTypeCategories[index - 1].order }
      if (c.id === sameTypeCategories[index - 1].id) return { ...c, order: category.order }
      return c
    })
    onCategoriesChange(updated)
  }

  const handleMoveDown = (category: CategoryWithGroup) => {
    const sameTypeCategories = categories.filter((c) => c.type === category.type).sort((a, b) => a.order - b.order)
    const index = sameTypeCategories.findIndex((c) => c.id === category.id)
    if (index >= sameTypeCategories.length - 1) return

    const updated = categories.map((c) => {
      if (c.id === category.id) return { ...c, order: sameTypeCategories[index + 1].order }
      if (c.id === sameTypeCategories[index + 1].id) return { ...c, order: category.order }
      return c
    })
    onCategoriesChange(updated)
  }

  const getBudgetGroupBadge = (group?: BudgetGroup) => {
    if (!group) return null
    const config = budgetGroups.find((g) => g.value === group)
    if (!config) return null
    return (
      <Badge variant="secondary" className={cn("text-xs", config.color)}>
        <config.icon className="h-3 w-3 mr-1" />
        {group === "essentials" ? "50%" : group === "lifestyle" ? "30%" : "20%"}
      </Badge>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Categorias</CardTitle>
              <CardDescription>
                Organize suas categorias de receitas e despesas
              </CardDescription>
            </div>
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Categoria
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CategoryType)}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="expense" className="gap-2">
                <ArrowDownCircle className="h-4 w-4" />
                Despesas ({categories.filter((c) => c.type === "expense").length})
              </TabsTrigger>
              <TabsTrigger value="income" className="gap-2">
                <ArrowUpCircle className="h-4 w-4" />
                Receitas ({categories.filter((c) => c.type === "income").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="expense" className="space-y-2">
              {filteredCategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Tag className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Nenhuma categoria de despesa</p>
                </div>
              ) : (
                filteredCategories.map((category, index) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between rounded-lg border p-3 group hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => handleMoveUp(category)}
                          disabled={index === 0}
                        >
                          <GripVertical className="h-3 w-3 rotate-90" />
                        </Button>
                      </div>
                      <div
                        className="h-4 w-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{category.name}</span>
                        {category.isDefault && (
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        )}
                        {getBudgetGroupBadge(category.budgetGroup)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveUp(category)}
                        disabled={index === 0}
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <ArrowUpCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveDown(category)}
                        disabled={index === filteredCategories.length - 1}
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <ArrowDownCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDelete(category)}
                        className={cn(
                          "text-destructive hover:text-destructive",
                          category.isDefault && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={category.isDefault}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="income" className="space-y-2">
              {filteredCategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Tag className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Nenhuma categoria de receita</p>
                </div>
              ) : (
                filteredCategories.map((category, index) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between rounded-lg border p-3 group hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-4 w-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{category.name}</span>
                        {category.isDefault && (
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveUp(category)}
                        disabled={index === 0}
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <ArrowUpCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveDown(category)}
                        disabled={index === filteredCategories.length - 1}
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <ArrowDownCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDelete(category)}
                        className={cn(
                          "text-destructive hover:text-destructive",
                          category.isDefault && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={category.isDefault}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Atualize as informações da categoria"
                : "Adicione uma nova categoria"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome da categoria"
              />
            </div>

            {/* Type */}
            {!editingCategory && (
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: CategoryType) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">
                      <div className="flex items-center gap-2">
                        <ArrowDownCircle className="h-4 w-4 text-rose-500" />
                        Despesa
                      </div>
                    </SelectItem>
                    <SelectItem value="income">
                      <div className="flex items-center gap-2">
                        <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                        Receita
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Budget Group (only for expenses) */}
            {formData.type === "expense" && (
              <div className="space-y-2">
                <Label>Grupo da Regra 50/30/20</Label>
                <Select
                  value={formData.budgetGroup}
                  onValueChange={(value: BudgetGroup) =>
                    setFormData({ ...formData, budgetGroup: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetGroups.map((group) => (
                      <SelectItem key={group.value} value={group.value}>
                        <div className="flex items-center gap-2">
                          <group.icon className={cn("h-4 w-4", group.color)} />
                          {group.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Color */}
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={cn(
                      "h-8 w-8 rounded-full transition-all",
                      formData.color === color &&
                        "ring-2 ring-offset-2 ring-offset-background ring-foreground"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingCategory ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {deletingCategory?.name}?
              Transações existentes perderão a categoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
