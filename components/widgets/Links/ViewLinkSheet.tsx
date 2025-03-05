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
  LinkIcon,
  StarIcon,
  ArchiveIcon,
  Trash2Icon,
  Loader2,
  CircleCheckBig,
  SquareArrowOutUpRight,
} from "lucide-react";
import { UpdateLinkData } from "@/hooks/useLinks";
import { Link } from "@/lib/supabase";
import { TagInput } from "@/components/global/TagInput";
import { useTags } from "@/components/providers/TagsProvider";
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
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

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
  const [editedLink, setEditedLink] = useState<Link>({ ...link });
  const [hasChanges, setHasChanges] = useState(false);

  // Create a user object from the link's user_id
  const userObj = link?.user_id ? { id: link.user_id } : null;

  // Get all existing tags from the Tags context
  const { allTags, loading: tagsLoading, addTag } = useTags();

  // Reset form when link changes
  useEffect(() => {
    setEditedLink({ ...link });
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
      setEditedLink({ ...link });
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
    console.log("Adding tag:", tag);

    // Add to the global tags list if it's a new tag
    addTag(tag);

    setEditedLink({
      ...editedLink,
      tags: [...(editedLink.tags || []), tag],
    });
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    console.log("Removing tag:", tagToRemove);
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

        <SheetContent className="overflow-y-auto">
          <SheetHeader className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border">
            <SheetTitle>Link Details</SheetTitle>
            <SheetDescription>View and edit link details</SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-4">
            {/* Link preview */}
            <div className="flex items-start gap-3 border rounded-lg p-3">
              <div className="flex-shrink-0">
                {link.image ? (
                  <img
                    src={link.image}
                    alt={link.title}
                    className="size-12 object-cover rounded"
                  />
                ) : (
                  <div className="size-12 bg-muted flex items-center justify-center rounded">
                    <LinkIcon className="size-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <p className="text-sm font-medium line-clamp-2">
                    {link.title}
                  </p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0"
                        >
                          <SquareArrowOutUpRight className="size-4 text-muted-foreground hover:text-primary" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Open link</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {link.url}
                </p>
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
                existingTags={allTags}
                disabled={isLoading}
                placeholder="Add a tag (type to see suggestions)"
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
