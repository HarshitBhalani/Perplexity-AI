"use client";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

const MarkdownRenderer = ({ content, className = "" }) => {
  return (
    <div className={`prose prose-slate dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Custom styling for code blocks
          pre: ({ children, ...props }) => (
            <pre
              {...props}
              className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto border dark:border-gray-700"
            >
              {children}
            </pre>
          ),
          code: ({ inline, children, ...props }) => (
            <code
              {...props}
              className={
                inline
                  ? "bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono"
                  : "font-mono text-sm"
              }
            >
              {children}
            </code>
          ),
          // Custom styling for blockquotes
          blockquote: ({ children, ...props }) => (
            <blockquote
              {...props}
              className="border-l-4 border-blue-500 pl-4 italic text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-r"
            >
              {children}
            </blockquote>
          ),
          // Custom styling for tables
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto">
              <table
                {...props}
                className="min-w-full border-collapse border border-gray-300 dark:border-gray-600"
              >
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th
              {...props}
              className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 px-4 py-2 text-left font-semibold"
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td
              {...props}
              className="border border-gray-300 dark:border-gray-600 px-4 py-2"
            >
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
