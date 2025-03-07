"use client";

import React, { useState, useRef, useCallback, KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
} from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minHeight?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
  minHeight = "150px",
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = useCallback(
    (prefix: string, suffix: string = "") => {
      if (!textareaRef.current) return;

      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const beforeText = value.substring(0, start);
      const afterText = value.substring(end);

      // If text is selected, wrap it with markdown
      if (selectedText) {
        const newValue = `${beforeText}${prefix}${selectedText}${suffix}${afterText}`;
        onChange(newValue);

        // Set selection to maintain the selected text (including the markdown)
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(
            start + prefix.length,
            end + prefix.length
          );
        }, 0);
      } else {
        // If no text is selected, insert markdown and place cursor between prefix and suffix
        const newValue = `${beforeText}${prefix}${suffix}${afterText}`;
        onChange(newValue);

        // Place cursor between prefix and suffix
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(
            start + prefix.length,
            start + prefix.length
          );
        }, 0);
      }
    },
    [value, onChange]
  );

  const handleBoldClick = () => insertMarkdown("**", "**");
  const handleItalicClick = () => insertMarkdown("*", "*");
  const handleUnderlineClick = () => insertMarkdown("<u>", "</u>");
  const handleStrikethroughClick = () => insertMarkdown("~~", "~~");
  const handleListClick = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const beforeText = value.substring(0, lineStart);
    const afterText = value.substring(lineStart);

    onChange(`${beforeText}- ${afterText}`);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart + 2, lineStart + 2);
    }, 0);
  };

  const handleOrderedListClick = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const beforeText = value.substring(0, lineStart);
    const afterText = value.substring(lineStart);

    onChange(`${beforeText}1. ${afterText}`);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart + 3, lineStart + 3);
    }, 0);
  };

  const handleLinkClick = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    if (selectedText) {
      insertMarkdown("[", "](url)");
    } else {
      insertMarkdown("[text](url)");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const currentLine = getCurrentLine(value, start);

      // Check if the current line is a list item
      const unorderedListMatch = currentLine.match(/^(\s*)- (.*)/);
      const orderedListMatch = currentLine.match(/^(\s*)(\d+)\. (.*)/);

      if (unorderedListMatch) {
        e.preventDefault();

        const [, indent, content] = unorderedListMatch;

        // If the list item is empty, end the list
        if (!content.trim()) {
          const beforeText = value.substring(0, start - indent.length - 2);
          const afterText = value.substring(start);
          const newValue = `${beforeText}\n${afterText}`;
          onChange(newValue);

          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
              start - indent.length - 1,
              start - indent.length - 1
            );
          }, 0);
        } else {
          // Continue the list with a new item
          const beforeText = value.substring(0, start);
          const afterText = value.substring(start);
          const newValue = `${beforeText}\n${indent}- ${afterText}`;
          onChange(newValue);

          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
              start + 1 + indent.length + 2,
              start + 1 + indent.length + 2
            );
          }, 0);
        }
      } else if (orderedListMatch) {
        e.preventDefault();

        const [, indent, number, content] = orderedListMatch;
        const nextNumber = parseInt(number) + 1;

        // If the list item is empty, end the list
        if (!content.trim()) {
          const beforeText = value.substring(
            0,
            start - indent.length - number.length - 2
          );
          const afterText = value.substring(start);
          const newValue = `${beforeText}\n${afterText}`;
          onChange(newValue);

          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
              start - indent.length - number.length - 1,
              start - indent.length - number.length - 1
            );
          }, 0);
        } else {
          // Continue the list with the next number
          const beforeText = value.substring(0, start);
          const afterText = value.substring(start);
          const newValue = `${beforeText}\n${indent}${nextNumber}. ${afterText}`;
          onChange(newValue);

          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
              start + 1 + indent.length + nextNumber.toString().length + 2,
              start + 1 + indent.length + nextNumber.toString().length + 2
            );
          }, 0);
        }
      }
    }
  };

  // Helper function to get the current line
  const getCurrentLine = (text: string, cursorPosition: number): string => {
    const lineStart = text.lastIndexOf("\n", cursorPosition - 1) + 1;
    const lineEnd = text.indexOf("\n", cursorPosition);
    return text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);
  };

  return (
    <div className="space-y-2">
      <ToggleGroup type="multiple" className="justify-start">
        <ToggleGroupItem
          value="bold"
          aria-label="Toggle bold"
          onClick={handleBoldClick}
        >
          <Bold className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="italic"
          aria-label="Toggle italic"
          onClick={handleItalicClick}
        >
          <Italic className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="underline"
          aria-label="Toggle underline"
          onClick={handleUnderlineClick}
        >
          <Underline className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="strikethrough"
          aria-label="Toggle strikethrough"
          onClick={handleStrikethroughClick}
        >
          <Strikethrough className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="list"
          aria-label="Add bullet list"
          onClick={handleListClick}
        >
          <List className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="ordered-list"
          aria-label="Add numbered list"
          onClick={handleOrderedListClick}
        >
          <ListOrdered className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="link"
          aria-label="Add link"
          onClick={handleLinkClick}
        >
          <LinkIcon className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        style={{ minHeight }}
        disabled={disabled}
      />
    </div>
  );
}
