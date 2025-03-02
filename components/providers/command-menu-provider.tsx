"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";
import { AddBookSheet } from "@/components/widgets/ReadingList/AddBookSheet";
import { AddLinkSheet } from "@/components/widgets/Links/AddLinkSheet";
import { useReadingList } from "@/hooks/useReadingList";
import { useLinks } from "@/hooks/useLinks";
import { BookOpenIcon, LinkIcon } from "lucide-react";
import { NewBookData } from "@/hooks/useReadingList";
import { NewLinkData } from "@/hooks/useLinks";
import { useAuth } from "@/components/providers/auth-provider";
import { linkEvents } from "@/components/widgets/Links/Links";

// Create a simple event emitter for book list refresh
export const bookListEvents = {
  listeners: new Set<() => void>(),

  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  },

  emit() {
    this.listeners.forEach((callback) => callback());
  },
};

interface CommandMenuContextType {
  openAddBookSheet: () => void;
  openAddLinkSheet: () => void;
}

const CommandMenuContext = createContext<CommandMenuContextType | undefined>(
  undefined
);

export function useCommandMenu() {
  const context = useContext(CommandMenuContext);
  if (context === undefined) {
    throw new Error("useCommandMenu must be used within a CommandMenuProvider");
  }
  return context;
}

export function CommandMenuProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isAddBookSheetOpen, setIsAddBookSheetOpen] = useState(false);
  const [isAddLinkSheetOpen, setIsAddLinkSheetOpen] = useState(false);
  const { user } = useAuth();
  const { addBook } = useReadingList(user);
  const { addLink } = useLinks(user);

  // Set up keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command menu shortcut (⌘K)
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandOpen((open) => !open);
      }

      // Add book shortcut (⌘B)
      if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        openAddBookSheet();
      }

      // Add link shortcut (⌘L)
      if (e.key === "l" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        openAddLinkSheet();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openAddBookSheet = () => {
    // Close command menu first
    setIsCommandOpen(false);

    // Use a sequence of timeouts to ensure the sheet opens and input gets focused
    setTimeout(() => {
      setIsAddBookSheetOpen(true);
    }, 50);
  };

  const openAddLinkSheet = () => {
    // Close command menu first
    setIsCommandOpen(false);

    // Use a sequence of timeouts to ensure the sheet opens and input gets focused
    setTimeout(() => {
      setIsAddLinkSheetOpen(true);
    }, 50);
  };

  // Wrap addBook to handle sheet closing and notify listeners
  const handleAddBook = useCallback(
    async (bookData: NewBookData) => {
      const success = await addBook(bookData);

      if (success) {
        // Close the sheet after successful add
        setIsAddBookSheetOpen(false);

        // Notify all components that need to refresh their book lists
        bookListEvents.emit();
      }

      return success;
    },
    [addBook]
  );

  // Wrap addLink to handle sheet closing and notify listeners
  const handleAddLink = useCallback(
    async (linkData: NewLinkData) => {
      const success = await addLink(linkData);

      if (success) {
        // Close the sheet after successful add
        setIsAddLinkSheetOpen(false);

        // Notify all components that need to refresh their link lists
        linkEvents.emit();
      }

      return success;
    },
    [addLink]
  );

  return (
    <CommandMenuContext.Provider value={{ openAddBookSheet, openAddLinkSheet }}>
      {children}

      {/* Command Dialog */}
      <CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem onSelect={openAddBookSheet}>
              <BookOpenIcon className="mr-2 h-4 w-4" />
              Add Book
              <CommandShortcut>⌘B</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={openAddLinkSheet}>
              <LinkIcon className="mr-2 h-4 w-4" />
              Add Link
              <CommandShortcut>⌘L</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* AddBookSheet */}
      <AddBookSheet
        onAddBook={handleAddBook}
        isOpen={isAddBookSheetOpen}
        onOpenChange={setIsAddBookSheetOpen}
      />

      {/* AddLinkSheet */}
      <AddLinkSheet
        onAddLink={handleAddLink}
        isOpen={isAddLinkSheetOpen}
        onOpenChange={setIsAddLinkSheetOpen}
      />
    </CommandMenuContext.Provider>
  );
}
