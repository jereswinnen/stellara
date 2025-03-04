import React, { useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface TagInputProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TagInput({
  tags,
  onAddTag,
  onRemoveTag,
  disabled = false,
  placeholder = "Add a tag",
}: TagInputProps) {
  const [newTag, setNewTag] = useState("");

  const handleAddTag = () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) {
      return;
    }
    onAddTag(newTag.trim());
    setNewTag("");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          id="tags"
          placeholder={placeholder}
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddTag();
            }
          }}
          disabled={disabled}
        />
        <Button
          type="button"
          size="sm"
          onClick={handleAddTag}
          disabled={disabled || !newTag.trim()}
        >
          Add
        </Button>
      </div>
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
