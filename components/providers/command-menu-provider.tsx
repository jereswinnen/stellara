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
import { AddBookSheet } from "@/components/widgets/Books/AddBookSheet";
import { AddLinkSheet } from "@/components/widgets/Links/AddLinkSheet";
import { AddArticleSheet } from "@/components/widgets/Articles/AddArticleSheet";
import { useBooks } from "@/hooks/useBooks";
import { useLinks } from "@/hooks/useLinks";
import { useArticles } from "@/hooks/useArticles";
import {
  BookOpenIcon,
  LinkIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  StickyNoteIcon,
} from "lucide-react";
import { NewBookData } from "@/hooks/useBooks";
import { NewLinkData } from "@/hooks/useLinks";
import { NewArticleData } from "@/hooks/useArticles";
import { useAuth } from "@/components/providers/auth-provider";
import { linkEvents } from "@/components/widgets/Links/Links";
import { articleEvents } from "@/components/widgets/Articles/Articles";
import { useRouter } from "next/navigation";

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
  openAddArticleSheet: () => void;
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
  const [isAddArticleSheetOpen, setIsAddArticleSheetOpen] = useState(false);
  const { user } = useAuth();
  const { addBook } = useBooks(user);
  const { addLink } = useLinks(user);
  const { addArticle } = useArticles(user);
  const router = useRouter();

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

      // Add article shortcut (⌘A)
      if (e.key === "a" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        openAddArticleSheet();
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

  const openAddArticleSheet = () => {
    // Close command menu first
    setIsCommandOpen(false);

    // Use a sequence of timeouts to ensure the sheet opens and input gets focused
    setTimeout(() => {
      setIsAddArticleSheetOpen(true);
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

  // Wrap addArticle to handle sheet closing and notify listeners
  const handleAddArticle = useCallback(
    async (articleData: NewArticleData) => {
      const success = await addArticle(articleData);

      if (success) {
        // Close the sheet after successful add
        setIsAddArticleSheetOpen(false);

        // Notify all components that need to refresh their article lists
        articleEvents.emit();
      }

      return success;
    },
    [addArticle]
  );

  // Navigation functions
  const navigateTo = (path: string) => {
    setIsCommandOpen(false);
    router.push(path);
  };

  return (
    <CommandMenuContext.Provider
      value={{ openAddBookSheet, openAddLinkSheet, openAddArticleSheet }}
    >
      {children}

      {/* Command Dialog */}
      <CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => navigateTo("/")}>
              <LayoutDashboardIcon className="h-4 w-4" />
              Dashboard
            </CommandItem>
            <CommandItem onSelect={() => navigateTo("/articles")}>
              <FileTextIcon className="h-4 w-4" />
              Articles
            </CommandItem>
            <CommandItem onSelect={() => navigateTo("/books")}>
              <BookOpenIcon className="h-4 w-4" />
              Books
            </CommandItem>
            <CommandItem onSelect={() => navigateTo("/links")}>
              <LinkIcon className="h-4 w-4" />
              Links
            </CommandItem>
            <CommandItem onSelect={() => navigateTo("/notes")}>
              <StickyNoteIcon className="h-4 w-4" />
              Notes
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="Actions">
            <CommandItem onSelect={openAddBookSheet}>
              <BookOpenIcon className="h-4 w-4" />
              Add Book
              <CommandShortcut>⌘B</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={openAddLinkSheet}>
              <LinkIcon className="h-4 w-4" />
              Add Link
              <CommandShortcut>⌘L</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={openAddArticleSheet}>
              <FileTextIcon className="h-4 w-4" />
              Add Article
              <CommandShortcut>⌘A</CommandShortcut>
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

      {/* AddArticleSheet */}
      <AddArticleSheet
        onAddArticle={handleAddArticle}
        isOpen={isAddArticleSheetOpen}
        onOpenChange={setIsAddArticleSheetOpen}
      />
    </CommandMenuContext.Provider>
  );
}
