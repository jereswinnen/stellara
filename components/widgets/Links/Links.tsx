"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkIcon, PlusIcon, ExternalLinkIcon } from "lucide-react";
import { AddLinkSheet } from "@/components/widgets/Links/AddLinkSheet";
import { ViewLinkSheet } from "@/components/widgets/Links/ViewLinkSheet";
import { useLinks } from "@/hooks/useLinks";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/lib/supabase";
import { TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipProvider } from "@/components/ui/tooltip";

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
  const { loading, recentLinks, addLink, updateLink, deleteLink, fetchLinks } =
    useLinks(user);
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [isViewLinkOpen, setIsViewLinkOpen] = useState(false);

  // Listen for link list refresh events
  useEffect(() => {
    // Subscribe to link list refresh events
    const unsubscribe = linkEvents.subscribe(() => {
      fetchLinks();
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, [fetchLinks]);

  // Handle adding a link
  const handleAddLink = async (linkData: any) => {
    const success = await addLink(linkData);

    if (success) {
      // Notify all components that need to refresh their link lists
      linkEvents.emit();

      // Close the sheet after successful add
      setIsAddLinkOpen(false);
    }

    return success;
  };

  // Handle updating a link
  const handleUpdateLink = async (linkData: any) => {
    const success = await updateLink(linkData);

    if (success) {
      // Notify all components that need to refresh their link lists
      linkEvents.emit();

      // Close the sheet after successful update
      setIsViewLinkOpen(false);
    }

    return success;
  };

  // Handle deleting a link
  const handleDeleteLink = async (linkId: string) => {
    const success = await deleteLink(linkId);

    if (success) {
      // Notify all components that need to refresh their link lists
      linkEvents.emit();

      // Close the sheet after successful delete
      setIsViewLinkOpen(false);
    }

    return success;
  };

  // Open the view link sheet
  const openViewLinkSheet = (link: Link) => {
    setSelectedLink(link);
    setIsViewLinkOpen(true);
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">Links</CardTitle>
        <Button
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setIsAddLinkOpen(true)}
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p>Loading links...</p>
          </div>
        ) : recentLinks.length > 0 ? (
          <div className="space-y-3">
            {recentLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-start space-x-3 border rounded-lg p-3 hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => openViewLinkSheet(link)}
              >
                <div className="flex-shrink-0 mt-1">
                  {link.image ? (
                    <img
                      src={link.image}
                      alt={link.title}
                      className="h-10 w-10 object-cover rounded"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-muted flex items-center justify-center rounded">
                      <LinkIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium line-clamp-1">
                      {link.title}
                    </p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex-shrink-0"
                          >
                            <ExternalLinkIcon className="h-4 w-4 text-muted-foreground" />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Open link</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {link.url}
                  </p>
                  {link.tags && link.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {link.tags.map((tag) => (
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
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <LinkIcon className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No links saved yet</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setIsAddLinkOpen(true)}
            >
              <PlusIcon className="mr-1 h-4 w-4" />
              Add your first link
            </Button>
          </div>
        )}

        {/* AddLinkSheet - always render it once, controlled by isAddLinkOpen */}
        <AddLinkSheet
          onAddLink={handleAddLink}
          isOpen={isAddLinkOpen}
          onOpenChange={setIsAddLinkOpen}
        />

        {/* ViewLinkSheet - only render when a link is selected */}
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
