"use client";

import { useState, useRef, useEffect } from "react";
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
  BookOpenIcon,
  StarIcon,
  ArchiveIcon,
  Trash2Icon,
  ExternalLinkIcon,
  Loader2,
  X,
  CircleCheckBig,
} from "lucide-react";
import { UpdateArticleData } from "@/hooks/useArticles";
import { Article } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TagInput } from "@/components/global/TagInput";

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
  const [activeTab, setActiveTab] = useState("content");

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
      setActiveTab("content");
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
        {/* Only show the trigger if provided */}
        {trigger && <div onClick={(e) => e.preventDefault()}>{trigger}</div>}

        <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Article Details</SheetTitle>
            <SheetDescription>View and edit article details</SheetDescription>
          </SheetHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="mt-4">
              <div className="space-y-4">
                {/* Article preview */}
                <div className="flex items-start space-x-3 border rounded-lg p-3">
                  <div className="flex-shrink-0 mt-1">
                    {article.image ? (
                      <img
                        src={article.image}
                        alt={article.title}
                        className="h-12 w-12 object-cover rounded"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-muted flex items-center justify-center rounded">
                        <BookOpenIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium line-clamp-2">
                        {article.title}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {article.url}
                    </p>
                    <div className="mt-2">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLinkIcon className="h-3 w-3" />
                        Open article
                      </a>
                    </div>
                  </div>
                </div>

                {/* Article content */}
                <div className="border rounded-lg p-6 max-h-[60vh] overflow-y-auto bg-card">
                  {article.body ? (
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert article-content"
                      dangerouslySetInnerHTML={{ __html: article.body }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <BookOpenIcon className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        No content available
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="mt-4">
              <div className="space-y-4">
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
                    disabled={isLoading}
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
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CircleCheckBig className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <SheetFooter className="flex flex-col space-y-2 sm:space-y-0">
            <div className="flex justify-between w-full">
              <div className="flex gap-2">
                <Button
                  variant={editedArticle.is_favorite ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleFavorite}
                  disabled={isLoading}
                >
                  <StarIcon className="h-4 w-4 mr-1" />
                  {editedArticle.is_favorite ? "Favorited" : "Favorite"}
                </Button>
                <Button
                  variant={editedArticle.is_archive ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleArchive}
                  disabled={isLoading}
                >
                  <ArchiveIcon className="h-4 w-4 mr-1" />
                  {editedArticle.is_archive ? "Archived" : "Archive"}
                </Button>
              </div>
              <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isLoading}>
                    <Trash2Icon className="h-4 w-4 mr-1" />
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
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
