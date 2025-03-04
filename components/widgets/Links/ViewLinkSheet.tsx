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
  LinkIcon,
  StarIcon,
  ArchiveIcon,
  Trash2Icon,
  ExternalLinkIcon,
  Loader2,
  X,
  CircleCheckBig,
} from "lucide-react";
import { UpdateLinkData } from "@/hooks/useLinks";
import { Link } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { TagInput } from "@/components/global/TagInput";
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

interface ViewLinkSheetProps {
  link: Link;
  onUpdateLink: (linkData: UpdateLinkData) => Promise<boolean>;
  onDeleteLink: (linkId: string) => Promise<boolean>;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function ViewLinkSheet({
  link,
  onUpdateLink,
  onDeleteLink,
  isOpen,
  onOpenChange,
  trigger,
}: ViewLinkSheetProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editedLink, setEditedLink] = useState<UpdateLinkData>({
    id: link.id,
    title: link.title,
    tags: link.tags || [],
    is_favorite: link.is_favorite,
    is_archive: link.is_archive,
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Reset form when link changes
  useEffect(() => {
    setEditedLink({
      id: link.id,
      title: link.title,
      tags: link.tags || [],
      is_favorite: link.is_favorite,
      is_archive: link.is_archive,
    });
    setHasChanges(false);
  }, [link]);

  // Check for changes when editedLink changes
  useEffect(() => {
    // Skip the initial render
    if (!link) return;

    const tagsChanged =
      JSON.stringify(editedLink.tags) !== JSON.stringify(link.tags || []);

    const hasChanged =
      editedLink.title !== link.title ||
      editedLink.is_favorite !== link.is_favorite ||
      editedLink.is_archive !== link.is_archive ||
      tagsChanged;

    setHasChanges(hasChanged);
  }, [editedLink, link]);

  // Handle sheet open/close
  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    onOpenChange?.(open);

    if (!open) {
      // Reset form when closing
      setEditedLink({
        id: link.id,
        title: link.title,
        tags: link.tags || [],
        is_favorite: link.is_favorite,
        is_archive: link.is_archive,
      });
      setHasChanges(false);
    }
  };

  // Handle updating a link
  const handleUpdateLink = async () => {
    setIsLoading(true);
    try {
      const success = await onUpdateLink(editedLink);
      if (success) {
        // Let the parent component handle closing the sheet
        onOpenChange?.(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting a link
  const handleDeleteLink = async () => {
    setIsLoading(true);
    try {
      const success = await onDeleteLink(link.id);
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
    const updatedLink = {
      ...editedLink,
      is_favorite: !editedLink.is_favorite,
    };
    setEditedLink(updatedLink);
    await onUpdateLink(updatedLink);
  };

  // Handle toggling archive status
  const handleToggleArchive = async () => {
    const updatedLink = {
      ...editedLink,
      is_archive: !editedLink.is_archive,
    };
    setEditedLink(updatedLink);
    await onUpdateLink(updatedLink);
  };

  // Handle adding a tag
  const handleAddTag = (tag: string) => {
    setEditedLink({
      ...editedLink,
      tags: [...(editedLink.tags || []), tag],
    });
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setEditedLink({
      ...editedLink,
      tags: editedLink.tags?.filter((tag) => tag !== tagToRemove),
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

        <SheetContent>
          <SheetHeader>
            <SheetTitle>Link Details</SheetTitle>
            <SheetDescription>View and edit link details</SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-4">
            {/* Link preview */}
            <div className="flex items-start space-x-3 border rounded-lg p-3">
              <div className="flex-shrink-0 mt-1">
                {link.image ? (
                  <img
                    src={link.image}
                    alt={link.title}
                    className="h-12 w-12 object-cover rounded"
                  />
                ) : (
                  <div className="h-12 w-12 bg-muted flex items-center justify-center rounded">
                    <LinkIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <p className="text-sm font-medium line-clamp-2">
                    {link.title}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {link.url}
                </p>
                <div className="mt-2">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs flex items-center gap-1 text-primary hover:underline"
                  >
                    <ExternalLinkIcon className="h-3 w-3" />
                    Open link
                  </a>
                </div>
              </div>
            </div>

            {/* Edit title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editedLink.title}
                onChange={(e) =>
                  setEditedLink({ ...editedLink, title: e.target.value })
                }
                disabled={isLoading}
              />
            </div>

            {/* Edit tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <TagInput
                tags={editedLink.tags || []}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
                disabled={isLoading}
              />
            </div>
          </div>

          <SheetFooter className="flex flex-col space-y-2 sm:space-y-0">
            <div className="flex justify-between w-full">
              <div className="flex gap-2">
                <Button
                  variant={editedLink.is_favorite ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleFavorite}
                  disabled={isLoading}
                >
                  <StarIcon className="h-4 w-4" />
                  {editedLink.is_favorite ? "Favorited" : "Favorite"}
                </Button>
                <Button
                  variant={editedLink.is_archive ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleArchive}
                  disabled={isLoading}
                >
                  <ArchiveIcon className="h-4 w-4" />
                  {editedLink.is_archive ? "Archived" : "Archive"}
                </Button>
              </div>
              <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isLoading}>
                    <Trash2Icon className="h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this link. This action cannot
                      be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteLink}
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
            <Button
              onClick={handleUpdateLink}
              disabled={isLoading || !hasChanges}
              className="w-full mt-4"
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
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
