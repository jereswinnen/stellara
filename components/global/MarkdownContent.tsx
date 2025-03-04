"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={`markdown-content ${className || ""}`}>
      <ReactMarkdown
        components={{
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-5 space-y-1" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-5 space-y-1" {...props} />
          ),
          li: ({ node, ...props }) => <li className="my-1" {...props} />,
          p: ({ node, ...props }) => <p className="my-2" {...props} />,
          a: ({ node, ...props }) => (
            <a className="text-blue-500 hover:underline" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold" {...props} />
          ),
          em: ({ node, ...props }) => <em className="italic" {...props} />,
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold my-3" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-bold my-3" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-bold my-2" {...props} />
          ),
          code: ({ node, ...props }) => (
            <code
              className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded"
              {...props}
            />
          ),
          pre: ({ node, ...props }) => (
            <pre
              className="bg-gray-100 dark:bg-gray-800 p-3 rounded my-3 overflow-auto"
              {...props}
            />
          ),
          // Handle HTML tags directly
          del: ({ node, ...props }) => <del {...props} />,
          u: ({ node, ...props }) => <u {...props} />,
        }}
        // Use plugins to support GitHub Flavored Markdown and HTML
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
