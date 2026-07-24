import { useState, useEffect } from "react";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  FolderTree,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Label } from "../../ui/label";
import { vendorCategoryService } from "../../../../services/vendorService";
import { showSuccess, showError } from "../../../../utils/ToastUtils";
import type { VendorCategoryResponse, VendorCategoryRequest } from "../../../../types/api";

export function VendorCategories() {
  const [categories, setCategories] = useState<VendorCategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create/Edit dialog
  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    editing: VendorCategoryResponse | null;
  }>({ open: false, editing: null });
  const [formData, setFormData] = useState<VendorCategoryRequest>({
    name: "",
    description: "",
    icon: "",
    parentId: null,
    sortOrder: 0,
  });
  const [formLoading, setFormLoading] = useState(false);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    category: VendorCategoryResponse | null;
  }>({ open: false, category: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Pagination (client-side since getCategories returns all)
  const [page, setPage] = useState(0);
  const pageSize = 12;

  async function loadCategories() {
    setLoading(true);
    try {
      const result = await vendorCategoryService.getCategories();
      setCategories(result);
    } catch {
      showError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const filtered = search
    ? categories.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.description ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : categories;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  function openCreateDialog() {
    setFormData({ name: "", description: "", icon: "", parentId: null, sortOrder: 0 });
    setFormDialog({ open: true, editing: null });
  }

  function openEditDialog(category: VendorCategoryResponse) {
    setFormData({
      name: category.name,
      description: category.description ?? "",
      icon: category.icon ?? "",
      parentId: category.parentId,
      sortOrder: category.sortOrder,
    });
    setFormDialog({ open: true, editing: category });
  }

  async function handleSave() {
    setFormLoading(true);
    try {
      if (formDialog.editing) {
        await vendorCategoryService.updateCategory(formDialog.editing.id, formData);
        showSuccess("Category updated");
      } else {
        await vendorCategoryService.createCategory(formData);
        showSuccess("Category created");
      }
      setFormDialog({ open: false, editing: null });
      loadCategories();
    } catch {
      showError(formDialog.editing ? "Failed to update category" : "Failed to create category");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteDialog.category) return;
    setDeleteLoading(true);
    try {
      await vendorCategoryService.deleteCategory(deleteDialog.category.id);
      showSuccess("Category deleted");
      setDeleteDialog({ open: false, category: null });
      loadCategories();
    } catch {
      showError("Failed to delete category");
    } finally {
      setDeleteLoading(false);
    }
  }

  // Get parent categories (top-level only, exclude the one being edited)
  const parentOptions = categories.filter(
    (c) => c.parentId === null && c.id !== formDialog.editing?.id,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Vendor Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize vendors into categories
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-1" />
          Add Category
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Category cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">No categories found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-lg shrink-0">
                      {c.icon || <FolderTree className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-medium truncate">{c.name}</CardTitle>
                      {c.parentName && (
                        <p className="text-xs text-muted-foreground truncate">
                          Parent: {c.parentName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" title="Edit" onClick={() => openEditDialog(c)}>
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete"
                      onClick={() => setDeleteDialog({ open: true, category: c })}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {c.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {c.description}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant={c.active ? "default" : "outline"}>
                    {c.active ? "Active" : "Inactive"}
                  </Badge>
                  {c.vendorCount !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      {c.vendorCount} vendor{c.vendorCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog
        open={formDialog.open}
        onOpenChange={(open) => {
          if (!open) setFormDialog({ open: false, editing: null });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formDialog.editing ? "Edit Category" : "Create Category"}</DialogTitle>
            <DialogDescription>
              {formDialog.editing
                ? `Update "${formDialog.editing.name}" category details.`
                : "Add a new vendor category."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                placeholder="Category name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Input
                id="cat-desc"
                placeholder="Short description"
                value={formData.description ?? ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-icon">Icon (emoji)</Label>
              <Input
                id="cat-icon"
                placeholder="e.g. wrench icon"
                value={formData.icon ?? ""}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Parent Category</Label>
              <Select
                value={formData.parentId != null ? String(formData.parentId) : "NONE"}
                onValueChange={(v) =>
                  setFormData({ ...formData, parentId: v === "NONE" ? null : Number(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None (top-level)</SelectItem>
                  {parentOptions.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormDialog({ open: false, editing: null })}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={formLoading || !formData.name.trim()}>
              {formLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {formDialog.editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) setDeleteDialog({ open: false, category: null });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteDialog.category?.name}&quot;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, category: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
