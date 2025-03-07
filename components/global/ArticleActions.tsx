"use client";

import { useState } from "react";
import { Article } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Ellipsis,
  Star,
  StarOff,
  Archive,
  ArchiveX,
  SquareArrowOutUpRight,
  ClipboardCopy,
  Trash2,
  TagIcon,
} from "lucide-react";
import { UpdateArticleData } from "@/hooks/useArticles";
import { ViewArticleSheet } from "@/components/global/Sheets/ViewArticleSheet";
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

interface ArticleActionsProps {
  article: Article;
  onUpdateArticle: (articleData: UpdateArticleData) => Promise<boolean>;
  onDeleteArticle: (articleId: string) => Promise<boolean>;
  //onCopyUrl?: () => void;
  triggerVariant?: "icon" | "text";
  align?: "start" | "center" | "end";
}

export function ArticleActions({
  article,
  onUpdateArticle,
  onDeleteArticle,
  //onCopyUrl,
  triggerVariant = "icon",
  align = "end",
}: ArticleActionsProps) {
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [updatingFavorite, setUpdatingFavorite] = useState(false);
  const [updatingArchive, setUpdatingArchive] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggleFavorite = async (e?: React.MouseEvent) => {
    if (!article) return;
    if (e) e.stopPropagation();

    try {
      setUpdatingFavorite(true);
      await onUpdateArticle({
        id: article.id,
        is_favorite: !article.is_favorite,
      });
    } finally {
      setUpdatingFavorite(false);
    }
  };

  const handleToggleArchive = async (e: React.MouseEvent) => {
    if (!article) return;
    if (e) e.stopPropagation();

    try {
      setUpdatingArchive(true);
      await onUpdateArticle({
        id: article.id,
        is_archive: !article.is_archive,
      });
    } finally {
      setUpdatingArchive(false);
    }
  };

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(article.url);
  };

  const handleOpenEditSheet = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditSheet(true);
  };

  const handleOpenDeleteAlert = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteAlert(true);
  };

  const handleOpenOriginal = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(article.url, "_blank");
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(true);
    try {
      await onDeleteArticle(article.id);
    } finally {
      setDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  const handleSheetOpenChange = (open: boolean) => {
    // Prevent event propagation by using setTimeout
    // This ensures the click event doesn't bubble up when the sheet is closed
    setTimeout(() => {
      setShowEditSheet(open);
    }, 0);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            onClick={(e) => e.stopPropagation()}
          >
            <Ellipsis className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} onClick={(e) => e.stopPropagation()}>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleOpenEditSheet}>
            <TagIcon className="size-4" />
            Edit Tags
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleFavorite}>
            {article?.is_favorite ? (
              <>
                <StarOff className="size-4" />
                Remove from Favorites
              </>
            ) : (
              <>
                <Star className="size-4" />
                Add to Favorites
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleArchive}>
            {article?.is_archive ? (
              <>
                <ArchiveX className="size-4" />
                Unarchive
              </>
            ) : (
              <>
                <Archive className="size-4" />
                Move to Archive
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleOpenOriginal}>
            <SquareArrowOutUpRight className="size-4" />
            View Original
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyUrl}>
            <ClipboardCopy className="size-4" />
            Copy Article URL
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={handleOpenDeleteAlert}
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Sheet */}
      <div className="hidden" onClick={(e) => e.stopPropagation()}>
        <ViewArticleSheet
          article={article}
          onUpdateArticle={onUpdateArticle}
          onDeleteArticle={onDeleteArticle}
          isOpen={showEditSheet}
          onOpenChange={handleSheetOpenChange}
        />
      </div>

      {/* Delete Alert Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              article from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
