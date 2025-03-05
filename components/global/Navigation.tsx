"use client";

import Link from "next/link";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { useCommandMenu } from "@/components/providers/CommandMenuProvider";

export function Navigation() {
  const {
    openAddBookSheet,
    openAddLinkSheet,
    openAddArticleSheet,
    openAddNoteSheet,
  } = useCommandMenu();

  return (
    <Menubar className="sticky top-0 z-50 mx-auto bg-background/80 backdrop-blur-lg">
      <MenubarMenu>
        <MenubarTrigger className="font-bold">Home</MenubarTrigger>
        <MenubarContent>
          <Link href="/" passHref>
            <MenubarItem>Dashboard</MenubarItem>
          </Link>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Articles</MenubarTrigger>
        <MenubarContent>
          <Link href="/articles" passHref>
            <MenubarItem>All Articles</MenubarItem>
          </Link>
          <MenubarSeparator />
          <MenubarItem onSelect={openAddArticleSheet}>
            Add Article
            <MenubarShortcut>⌘A</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Books</MenubarTrigger>
        <MenubarContent>
          <Link href="/books" passHref>
            <MenubarItem>All Books</MenubarItem>
          </Link>
          <MenubarSeparator />
          <MenubarItem onSelect={openAddBookSheet}>
            Add Book
            <MenubarShortcut>⌘B</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Links</MenubarTrigger>
        <MenubarContent>
          <Link href="/links" passHref>
            <MenubarItem>All Links</MenubarItem>
          </Link>
          <MenubarSeparator />
          <MenubarItem onSelect={openAddLinkSheet}>
            Add Link
            <MenubarShortcut>⌘L</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Notes</MenubarTrigger>
        <MenubarContent>
          <Link href="/notes" passHref>
            <MenubarItem>All Notes</MenubarItem>
          </Link>
          <MenubarSeparator />
          <MenubarItem onSelect={openAddNoteSheet}>
            Add Note
            <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
