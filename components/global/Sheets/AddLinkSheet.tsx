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
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { PlusIcon, Loader2, CircleCheckBig } from "lucide-react";
import { NewLinkData } from "@/hooks/useLinks";
import { fetchUrlMetadata } from "@/lib/urlMetadata";
import { TagInput } from "@/components/global/TagInput";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTags } from "@/components/providers/TagsProvider";

interface AddLinkSheetProps {
  onAddLink: (linkData: NewLinkData) => Promise<boolean>;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddLinkSheet({
  onAddLink,
  isOpen,
  onOpenChange,
}: AddLinkSheetProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [newLink, setNewLink] = useState<NewLinkData>({
    url: "",
    title: "",
    tags: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);

  // Get the current user
  const { user } = useAuth();

  // Get all existing tags from the Tags context
  const { allTags, addTag } = useTags();

  // Focus on URL input when sheet opens
  useEffect(() => {
    const sheetOpen = isOpen !== undefined ? isOpen : isSheetOpen;

    if (sheetOpen) {
      setTimeout(() => {
        urlInputRef.current?.focus();
      }, 100);
    } else {
      // Reset form when sheet closes
      resetForm();
    }
  }, [isOpen, isSheetOpen]);

  // Reset form when sheet is closed
  const resetForm = () => {
    setNewLink({
      url: "",
      title: "",
      tags: [],
    });
    setSuccess(false);
  };

  // Handle sheet open/close
  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    onOpenChange?.(open);

    if (open) {
      // Focus the URL input when the sheet opens
      setTimeout(() => {
        urlInputRef.current?.focus();
      }, 100);
    } else {
      resetForm();
    }
  };

  // Handle adding a link
  const handleAddLink = async () => {
    if (!newLink.url) return;

    setIsLoading(true);
    try {
      const success = await onAddLink(newLink);
      if (success) {
        setSuccess(true);
        setTimeout(() => {
          resetForm();
          // Let the parent component handle closing the sheet
          onOpenChange?.(false);
        }, 1000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle URL input change and fetch metadata
  const handleUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setNewLink({ ...newLink, url });

    // Only fetch metadata if URL is valid
    if (url && url.startsWith("http") && url.includes(".")) {
      setIsFetchingMetadata(true);
      try {
        const metadata = await fetchUrlMetadata(url);
        if (metadata) {
          setNewLink((prev) => ({
            ...prev,
            url,
            title: metadata.title || prev.title,
            image: metadata.image || prev.image,
          }));
        }
      } catch (error) {
        console.error("Error fetching metadata:", error);
      } finally {
        setIsFetchingMetadata(false);
      }
    }
  };

  // Handle adding a tag
  const handleAddTag = (tag: string) => {
    // Add to the global tags list if it's a new tag
    addTag(tag);

    setNewLink({
      ...newLink,
      tags: [...(newLink.tags || []), tag],
    });
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setNewLink({
      ...newLink,
      tags: newLink.tags?.filter((tag) => tag !== tagToRemove),
    });
  };

  return (
    <Sheet
      open={isOpen !== undefined ? isOpen : isSheetOpen}
      onOpenChange={handleSheetOpenChange}
    >
      {/* Only show the trigger button if isOpen is not provided externally */}
      {isOpen === undefined && (
        <SheetTrigger asChild>
          <Button size="sm" className="h-8 w-8 p-0">
            <PlusIcon className="h-4 w-4" />
          </Button>
        </SheetTrigger>
      )}
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border">
          <SheetTitle>Add a new link</SheetTitle>
          <SheetDescription>
            Add a new link to your collection.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                ref={urlInputRef}
                placeholder="https://example.com"
                value={newLink.url}
                onChange={handleUrlChange}
                disabled={isLoading}
                autoFocus
              />
            </div>
            {isFetchingMetadata && (
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Fetching metadata...
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Link title"
              value={newLink.title}
              onChange={(e) =>
                setNewLink({ ...newLink, title: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <TagInput
              tags={newLink.tags || []}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              existingTags={allTags}
              disabled={isLoading}
              placeholder="Add a tag (type to see suggestions)"
            />
          </div>
        </div>

        <SheetFooter>
          <Button
            onClick={handleAddLink}
            disabled={isLoading || !newLink.url || success}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding Link...
              </>
            ) : success ? (
              <>
                <CircleCheckBig className="h-4 w-4" />
                Link Added!
              </>
            ) : (
              <>Add Link</>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
