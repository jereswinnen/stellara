"use client";

import { useState } from "react";
import { Link } from "@/lib/supabase";
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
  SquareArrowOutUpRight,
  ClipboardCopy,
  Trash2,
  TagIcon,
  Pencil,
} from "lucide-react";
import { ViewLinkSheet } from "@/components/global/sheets/ViewLinkSheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LinkActionsProps {
  link: Link;
  onUpdateLink: (linkData: any) => Promise<boolean>;
  onDeleteLink: (linkId: string) => Promise<boolean>;
  onCopyUrl?: () => void;
  align?: "start" | "center" | "end";
}

export function LinkActions({
  link,
  onUpdateLink,
  onDeleteLink,
  onCopyUrl,
  align = "end",
}: LinkActionsProps) {
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onUpdateLink({
      id: link.id,
      is_favorite: !link.is_favorite,
    });
  };

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCopyUrl) {
      onCopyUrl();
    } else {
      // Default implementation if no custom handler is provided
      navigator.clipboard.writeText(link.url);
    }
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
    window.open(link.url, "_blank");
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(true);
    try {
      await onDeleteLink(link.id);
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
            <Pencil className="size-4 mr-2" />
            Edit Link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleFavorite}>
            {link?.is_favorite ? (
              <>
                <StarOff className="size-4 mr-2" />
                Remove from Favorites
              </>
            ) : (
              <>
                <Star className="size-4 mr-2" />
                Add to Favorites
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleOpenOriginal}>
            <SquareArrowOutUpRight className="size-4 mr-2" />
            Open Link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyUrl}>
            <ClipboardCopy className="size-4 mr-2" />
            Copy Link URL
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={handleOpenDeleteAlert}
          >
            <Trash2 className="size-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Sheet */}
      <div className="hidden" onClick={(e) => e.stopPropagation()}>
        <ViewLinkSheet
          link={link}
          onUpdateLink={onUpdateLink}
          onDeleteLink={onDeleteLink}
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
              link from your account.
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
