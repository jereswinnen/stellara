"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  StarIcon,
  ArchiveIcon,
  Trash2Icon,
  Loader2,
  CircleCheckBig,
} from "lucide-react";
import { UpdateArticleData } from "@/hooks/useArticles";
import { Article } from "@/lib/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TagInput } from "@/components/global/TagInput";
import { useTags } from "@/components/providers/TagsProvider";

interface ViewArticleSheetProps {
  article: Article;
  onUpdateArticle: (articleData: UpdateArticleData) => Promise<boolean>;
  onDeleteArticle: (articleId: string) => Promise<boolean>;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function ViewArticleSheet({
  article,
  onUpdateArticle,
  onDeleteArticle,
  isOpen,
  onOpenChange,
  trigger,
}: ViewArticleSheetProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editedArticle, setEditedArticle] = useState<UpdateArticleData>({
    id: article.id,
    title: article.title,
    tags: article.tags || [],
    is_favorite: article.is_favorite,
    is_archive: article.is_archive,
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Create a user object from the article's user_id
  // const userObj = article?.user_id ? { id: article.user_id } : null;

  // Get all existing tags from the Tags context
  const { allTags, addTag } = useTags();

  // Reset form when article changes
  useEffect(() => {
    setEditedArticle({
      id: article.id,
      title: article.title,
      tags: article.tags || [],
      is_favorite: article.is_favorite,
      is_archive: article.is_archive,
    });
    setHasChanges(false);
  }, [article]);

  // Check for changes when editedArticle changes
  useEffect(() => {
    // Skip the initial render
    if (!article) return;

    const tagsChanged =
      JSON.stringify(editedArticle.tags) !== JSON.stringify(article.tags || []);

    const hasChanged =
      editedArticle.title !== article.title ||
      editedArticle.is_favorite !== article.is_favorite ||
      editedArticle.is_archive !== article.is_archive ||
      tagsChanged;

    setHasChanges(hasChanged);
  }, [editedArticle, article]);

  // Handle sheet open/close
  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);

    if (!open) {
      // Reset state when closing
      setIsDeleteDialogOpen(false);

      // Reset form when closing
      setEditedArticle({
        id: article.id,
        title: article.title,
        tags: article.tags || [],
        is_favorite: article.is_favorite,
        is_archive: article.is_archive,
      });
      setHasChanges(false);
    }

    if (onOpenChange) {
      onOpenChange(open);
    }
  };

  // Handle updating an article
  const handleUpdateArticle = async () => {
    setIsLoading(true);
    try {
      const success = await onUpdateArticle(editedArticle);
      if (success) {
        // Let the parent component handle closing the sheet
        onOpenChange?.(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting an article
  const handleDeleteArticle = async () => {
    setIsLoading(true);
    try {
      const success = await onDeleteArticle(article.id);
      if (success) {
        setIsDeleteDialogOpen(false);
        // Let the parent component handle closing the sheet
        onOpenChange?.(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle toggling favorite status
  const handleToggleFavorite = async () => {
    const updatedArticle = {
      ...editedArticle,
      is_favorite: !editedArticle.is_favorite,
    };
    setEditedArticle(updatedArticle);
    await onUpdateArticle(updatedArticle);
  };

  // Handle toggling archive status
  const handleToggleArchive = async () => {
    const updatedArticle = {
      ...editedArticle,
      is_archive: !editedArticle.is_archive,
    };
    setEditedArticle(updatedArticle);
    await onUpdateArticle(updatedArticle);
  };

  // Handle adding a tag
  const handleAddTag = (tag: string) => {
    // Add to the global tags list if it's a new tag
    addTag(tag);

    setEditedArticle({
      ...editedArticle,
      tags: [...(editedArticle.tags || []), tag],
    });
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setEditedArticle({
      ...editedArticle,
      tags: editedArticle.tags?.filter((tag) => tag !== tagToRemove),
    });
  };

  return (
    <>
      <Sheet
        open={isOpen !== undefined ? isOpen : isSheetOpen}
        onOpenChange={handleSheetOpenChange}
      >
        <SheetContent className="min-w-screen md:min-w-auto md:max-w-2xl overflow-y-auto">
          <SheetHeader className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border">
            <SheetTitle>Article Details</SheetTitle>
            <SheetDescription>View and edit article details</SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-4">
            {/* Edit title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editedArticle.title}
                onChange={(e) =>
                  setEditedArticle({
                    ...editedArticle,
                    title: e.target.value,
                  })
                }
                disabled={isLoading}
              />
            </div>

            {/* Tags section */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <TagInput
                tags={editedArticle.tags || []}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
                existingTags={allTags}
                disabled={isLoading}
                placeholder="Add a tag (type to see suggestions)"
              />
            </div>

            {/* Save changes button */}
            {hasChanges && (
              <Button
                onClick={handleUpdateArticle}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CircleCheckBig className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
          </div>

          <SheetFooter className="flex flex-col space-y-2 sm:space-y-0">
            <div className="flex justify-between w-full">
              <div className="flex gap-2">
                <Button
                  variant={editedArticle.is_favorite ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleFavorite}
                  disabled={isLoading}
                >
                  <StarIcon className="h-4 w-4" />
                  {editedArticle.is_favorite ? "Favorited" : "Favorite"}
                </Button>
                <Button
                  variant={editedArticle.is_archive ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleArchive}
                  disabled={isLoading}
                >
                  <ArchiveIcon className="h-4 w-4" />
                  {editedArticle.is_archive ? "Archived" : "Archive"}
                </Button>
              </div>
              <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isLoading}>
                    <Trash2Icon className="size-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this article. This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteArticle}
                      disabled={isLoading}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
