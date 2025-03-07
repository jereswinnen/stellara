"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkIcon, PlusIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddLinkSheet } from "@/components/global/sheets/AddLinkSheet";
import { ViewLinkSheet } from "@/components/global/sheets/ViewLinkSheet";
import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { supabase, Link } from "@/lib/supabase";
import { extractDomain } from "@/lib/utils";
import { LinkActions } from "@/components/global/LinkActions";

// Create a simple event emitter for links refresh
export const linkEvents = {
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

export function Links() {
  const { user } = useAuth();
  const router = useRouter();
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [isViewLinkOpen, setIsViewLinkOpen] = useState(false);

  // Fetch links from the database
  const fetchLinks = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("links")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching links:", error);
        return;
      }

      setLinks(data || []);
    } catch (error) {
      console.error("Error fetching links:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch links on component mount and when user changes
  useEffect(() => {
    if (user) {
      fetchLinks();
    }
  }, [user]);

  // Listen for link list refresh events
  useEffect(() => {
    // Subscribe to link list refresh events
    const unsubscribe = linkEvents.subscribe(() => {
      fetchLinks();
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Handle adding a link
  const handleAddLink = async (linkData: any) => {
    try {
      const { data, error } = await supabase
        .from("links")
        .insert([{ ...linkData, user_id: user?.id }])
        .select();

      if (error) {
        console.error("Error adding link:", error);
        return false;
      }

      // Refresh links
      fetchLinks();
      return true;
    } catch (error) {
      console.error("Error adding link:", error);
      return false;
    }
  };

  // Handle updating a link
  const handleUpdateLink = async (linkData: any) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("links")
        .update(linkData)
        .eq("id", linkData.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating link:", error);
        return false;
      }

      // Refresh links
      fetchLinks();
      return true;
    } catch (error) {
      console.error("Error updating link:", error);
      return false;
    }
  };

  // Handle deleting a link
  const handleDeleteLink = async (linkId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("links")
        .delete()
        .eq("id", linkId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting link:", error);
        return false;
      }

      // Refresh links
      fetchLinks();
      return true;
    } catch (error) {
      console.error("Error deleting link:", error);
      return false;
    }
  };

  // Open the view link sheet
  const openViewLinkSheet = (link: Link) => {
    setSelectedLink(link);
    setIsViewLinkOpen(true);
  };

  const openLink = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, "_blank");
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold">Links</CardTitle>
        <Button
          size="sm"
          className="size-8"
          onClick={() => setIsAddLinkOpen(true)}
        >
          <PlusIcon className="size-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex gap-2 items-center justify-center">
            <Loader2 className="size-4 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading links...</p>
          </div>
        ) : links.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {links.map((link) => (
              <div
                key={link.id}
                className="cursor-pointer flex items-center justify-between gap-2 p-3 border rounded-md hover:bg-muted/50 transition-colors"
                onClick={(e) => openLink(link.url, e)}
              >
                <div className="flex-shrink-0">
                  {link.image ? (
                    <img
                      src={link.image}
                      alt={link.title}
                      className="size-10 object-cover rounded"
                    />
                  ) : (
                    <div className="size-10 bg-muted flex items-center justify-center rounded">
                      <LinkIcon className="size-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col">
                  <p className="text-sm font-medium line-clamp-1">
                    {link.title}
                  </p>
                  {/* <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium line-clamp-1">
                      {link.title}
                    </p>
                    {link.tags && link.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {link.tags.map((tag: string) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs px-1.5 py-0"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div> */}
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {extractDomain(link.url)}
                  </p>
                </div>

                <LinkActions
                  link={link}
                  onUpdateLink={handleUpdateLink}
                  onDeleteLink={handleDeleteLink}
                  align="end"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2 items-center justify-center text-center">
            <LinkIcon className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground">No links saved yet</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddLinkOpen(true)}
            >
              <PlusIcon className="size-4" />
              Add your first link
            </Button>
          </div>
        )}

        <AddLinkSheet
          onAddLink={handleAddLink}
          isOpen={isAddLinkOpen}
          onOpenChange={setIsAddLinkOpen}
        />

        {selectedLink && (
          <ViewLinkSheet
            link={selectedLink}
            onUpdateLink={handleUpdateLink}
            onDeleteLink={handleDeleteLink}
            isOpen={isViewLinkOpen}
            onOpenChange={setIsViewLinkOpen}
          />
        )}
      </CardContent>
    </Card>
  );
}
