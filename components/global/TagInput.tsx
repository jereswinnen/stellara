import React, { useState, useEffect, useRef, useMemo } from "react";
import { X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface TagInputProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  disabled?: boolean;
  placeholder?: string;
  existingTags?: string[]; // Existing tags from other content types
  maxSuggestions?: number; // Maximum number of suggestions to show
}

export function TagInput({
  tags,
  onAddTag,
  onRemoveTag,
  disabled = false,
  placeholder = "Add a tag",
  existingTags = [], // Default to empty array
  maxSuggestions = 5, // Default to 5 suggestions
}: TagInputProps) {
  const [newTag, setNewTag] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ensure existingTags is an array
  const safeExistingTags = useMemo(() => {
    if (!existingTags) return [];
    if (!Array.isArray(existingTags)) {
      console.error("existingTags is not an array:", existingTags);
      return [];
    }
    return existingTags;
  }, [existingTags]);

  // Calculate filtered suggestions using useMemo instead of state
  const filteredSuggestions = useMemo(() => {
    if (!newTag.trim()) {
      return [];
    }

    if (safeExistingTags.length === 0) {
      return [];
    }

    const inputLower = newTag.toLowerCase();
    const filtered = safeExistingTags
      .filter(
        (tag) =>
          // Only show tags that:
          // 1. Match the current input (case insensitive)
          // 2. Are not already in the current tags list (case insensitive)
          tag.toLowerCase().includes(inputLower) &&
          !tags.some((t) => t.toLowerCase() === tag.toLowerCase())
      )
      .sort((a, b) => {
        // Sort exact matches first, then by alphabetical order
        const aStartsWith = a.toLowerCase().startsWith(inputLower);
        const bStartsWith = b.toLowerCase().startsWith(inputLower);

        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.localeCompare(b);
      })
      .slice(0, maxSuggestions); // Limit number of suggestions

    return filtered;
  }, [newTag, safeExistingTags, tags, maxSuggestions]);

  // Update open state based on filtered suggestions
  useEffect(() => {
    const shouldBeOpen = newTag.length > 0 && filteredSuggestions.length > 0;
    setOpen(shouldBeOpen);
  }, [newTag, filteredSuggestions.length]);

  const handleAddTag = (tagToAdd: string = newTag) => {
    const trimmedTag = tagToAdd.trim();
    if (!trimmedTag) return;

    // Check if tag already exists (case-insensitive)
    const tagExists = tags.some(
      (t) => t.toLowerCase() === trimmedTag.toLowerCase()
    );

    if (!tagExists) {
      onAddTag(trimmedTag);
    }

    setNewTag("");
    setOpen(false);

    // Focus the input after adding a tag
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          id="tags"
          placeholder={placeholder}
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddTag();
            } else if (e.key === "," && newTag.trim()) {
              // Allow comma to add tags as well
              e.preventDefault();
              handleAddTag();
            }
          }}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="button"
          size="sm"
          onClick={() => handleAddTag()}
          disabled={disabled || !newTag.trim()}
        >
          Add
        </Button>
      </div>

      {/* Show suggestions as a simple dropdown when typing */}
      {open && filteredSuggestions.length > 0 && (
        <div className="mt-1 border rounded-md shadow-sm bg-background z-10 relative">
          <div className="py-1 px-2 text-xs font-medium text-muted-foreground border-b">
            Existing Tags
          </div>
          <ul className="py-1 max-h-[200px] overflow-auto">
            {filteredSuggestions.map((tag) => (
              <li
                key={tag}
                className="px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer flex items-center justify-between"
                onClick={() => handleAddTag(tag)}
              >
                <span>{tag}</span>
                <Check className="h-4 w-4 text-muted-foreground" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {tag}
              <button
                type="button"
                className="h-3 w-3 inline-flex items-center justify-center rounded-full focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveTag(tag);
                }}
                aria-label={`Remove ${tag} tag`}
                disabled={disabled}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-pointer" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
