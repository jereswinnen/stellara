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
import { AddArticleSheet } from "@/components/global/sheets/AddArticleSheet";
import { AddBookSheet } from "@/components/global/sheets/AddBookSheet";
import { AddLinkSheet } from "@/components/global/sheets/AddLinkSheet";
import { AddNoteSheet } from "@/components/global/sheets/AddNoteSheet";
import { AddPodcastSheet } from "@/components/global/sheets/AddPodcastSheet";
import { useArticles } from "@/hooks/useArticles";
import { useBooks } from "@/hooks/useBooks";
import { useLinks } from "@/hooks/useLinks";
import { useNotes } from "@/hooks/useNotes";
import { usePodcasts } from "@/hooks/usePodcasts";
import {
  BookOpenIcon,
  LinkIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  StickyNoteIcon,
  SettingsIcon,
  HeadphonesIcon,
} from "lucide-react";
import { NewBookData } from "@/hooks/useBooks";
import { NewLinkData } from "@/hooks/useLinks";
import { NewArticleData } from "@/hooks/useArticles";
import { NewPodcastFeedData } from "@/hooks/usePodcasts";
import { useAuth } from "@/components/providers/AuthProvider";
import { articleEvents } from "@/components/widgets/Articles";
import { linkEvents } from "@/components/widgets/Links";
import { podcastEvents } from "@/hooks/usePodcasts";
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

// Create a simple event emitter for note list refresh
export const noteListEvents = {
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
  openAddArticleSheet: () => void;
  openAddBookSheet: () => void;
  openAddLinkSheet: () => void;
  openAddNoteSheet: () => void;
  openAddPodcastSheet: () => void;
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
  const [isAddArticleSheetOpen, setIsAddArticleSheetOpen] = useState(false);
  const [isAddBookSheetOpen, setIsAddBookSheetOpen] = useState(false);
  const [isAddLinkSheetOpen, setIsAddLinkSheetOpen] = useState(false);
  const [isAddNoteSheetOpen, setIsAddNoteSheetOpen] = useState(false);
  const [isAddPodcastSheetOpen, setIsAddPodcastSheetOpen] = useState(false);

  const router = useRouter();
  const { user } = useAuth();
  const { addArticle } = useArticles(user);
  const { addBook } = useBooks(user);
  const { addLink } = useLinks(user);
  const { createNote } = useNotes(user);
  const { addPodcastFeed } = usePodcasts(user);

  // Set up keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandOpen((open) => !open);
      }

      // Add Article: Cmd+A
      if (e.key === "a" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        setIsAddArticleSheetOpen(true);
      }

      // Add Book: Cmd+B
      if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsAddBookSheetOpen(true);
      }

      // Add Link: Cmd+L
      if (e.key === "l" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsAddLinkSheetOpen(true);
      }

      // Add Note: Cmd+N
      if (e.key === "n" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsAddNoteSheetOpen(true);
      }

      // Add Podcast Feed: Cmd+P
      if (e.key === "p" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsAddPodcastSheetOpen(true);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Sheet open functions
  const openAddArticleSheet = useCallback(() => {
    setIsAddArticleSheetOpen(true);
    setIsCommandOpen(false);
  }, []);

  const openAddBookSheet = useCallback(() => {
    setIsAddBookSheetOpen(true);
    setIsCommandOpen(false);
  }, []);

  const openAddLinkSheet = useCallback(() => {
    setIsAddLinkSheetOpen(true);
    setIsCommandOpen(false);
  }, []);

  const openAddNoteSheet = useCallback(() => {
    setIsAddNoteSheetOpen(true);
    setIsCommandOpen(false);
  }, []);

  const openAddPodcastSheet = useCallback(() => {
    setIsAddPodcastSheetOpen(true);
    setIsCommandOpen(false);
  }, []);

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

  // Wrap createNote to handle sheet closing and notify listeners
  const handleAddNote = useCallback(
    async (noteData: { title: string; content: string; tags: string[] }) => {
      // Convert the noteData to the format expected by createNote
      const success = await createNote({ content: noteData.content });

      if (success) {
        // Close the sheet after successful add
        setIsAddNoteSheetOpen(false);

        // Notify all components that need to refresh their note lists
        noteListEvents.emit();
      }

      return success;
    },
    [createNote]
  );

  // Wrap addPodcastFeed to handle sheet closing and notify listeners
  const handleAddPodcastFeed = useCallback(
    async (feedData: NewPodcastFeedData) => {
      const success = await addPodcastFeed(feedData);

      if (success) {
        // Close the sheet after successful add
        setIsAddPodcastSheetOpen(false);

        // Notify all components that need to refresh their podcast lists
        podcastEvents.emit();
      }

      return success;
    },
    [addPodcastFeed]
  );

  // Navigation functions
  const navigateTo = (path: string) => {
    setIsCommandOpen(false);
    router.push(path);
  };

  return (
    <CommandMenuContext.Provider
      value={{
        openAddArticleSheet,
        openAddBookSheet,
        openAddLinkSheet,
        openAddNoteSheet,
        openAddPodcastSheet,
      }}
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
            <CommandItem onSelect={() => navigateTo("/podcasts")}>
              <HeadphonesIcon className="h-4 w-4" />
              Podcasts
            </CommandItem>
            <CommandItem onSelect={() => navigateTo("/settings")}>
              <SettingsIcon className="h-4 w-4" />
              Settings
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="Actions">
            <CommandItem onSelect={openAddArticleSheet}>
              <FileTextIcon className="h-4 w-4" />
              Add Article
              <CommandShortcut>⌘A</CommandShortcut>
            </CommandItem>
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
            <CommandItem onSelect={openAddNoteSheet}>
              <StickyNoteIcon className="h-4 w-4" />
              Add Note
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={openAddPodcastSheet}>
              <HeadphonesIcon className="h-4 w-4" />
              Add Podcast Feed
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* AddArticleSheet */}
      <AddArticleSheet
        onAddArticle={handleAddArticle}
        isOpen={isAddArticleSheetOpen}
        onOpenChange={setIsAddArticleSheetOpen}
      />

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

      {/* AddNoteSheet */}
      <AddNoteSheet
        onAddNote={handleAddNote}
        isOpen={isAddNoteSheetOpen}
        onOpenChange={setIsAddNoteSheetOpen}
      />

      {/* AddPodcastSheet */}
      <AddPodcastSheet
        onAddPodcastFeed={handleAddPodcastFeed}
        isOpen={isAddPodcastSheetOpen}
        onOpenChange={setIsAddPodcastSheetOpen}
      />
    </CommandMenuContext.Provider>
  );
}
