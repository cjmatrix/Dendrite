import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import P5Sandbox from "../P5Sandbox";

export const markdownComponents = {
  code({ className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || "");
    const codeString = String(children).replace(/\n$/, "");
    if (match && match[1] === "p5") {
      return <P5Sandbox p5CodeString={codeString} />;
    }
  console.log("markdwon rendering")
    return match ? (
      <div className="my-5 rounded-xl overflow-hidden border border-white/5 bg-[var(--theme-bg-surface)] shadow-lg">
        {/* Language header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--theme-bg-elevated)] border-b border-white/5">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-400 tracking-wider uppercase">
            <span>{match[1].toUpperCase()}</span>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(codeString)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors px-2 py-1.5 rounded hover:bg-white/5"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy
          </button>
        </div>
        {/* Code block */}
        <SyntaxHighlighter
          style={vscDarkPlus as any}
          language={match[1]}
          PreTag="pre"
          customStyle={{
            margin: 0,
            padding: "1.25rem",
            background: "transparent",
            fontSize: "14.5px",
            lineHeight: "1.6",
          }}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    ) : (
      <code
        className="bg-zinc-700/40 px-[0.3rem] py-[0.1rem] mx-[0.3rem] my-[0.5rem] font-thin rounded-md text-amber-200/90 text-[14.5px] border border-zinc-600/30"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre({ children }: any) {
    return <>{children}</>;
  },
  table({ children, ...props }: any) {
    return (
      <div className="w-full overflow-x-auto my-6 rounded-xl border border-zinc-700/50 shadow-md">
        <table
          className="w-full text-left border-collapse text-[15px]"
          {...props}
        >
          {children}
        </table>
      </div>
    );
  },
  thead({ children, ...props }: any) {
    return (
      <thead className="bg-zinc-800/40 border-b border-zinc-700/60" {...props}>
        {children}
      </thead>
    );
  },
  tbody({ children, ...props }: any) {
    return (
      <tbody className="divide-y divide-zinc-700/40" {...props}>
        {children}
      </tbody>
    );
  },
  th({ children, ...props }: any) {
    return (
      <th
        className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider"
        {...props}
      >
        {children}
      </th>
    );
  },
  td({ children, ...props }: any) {
    return (
      <td className="px-4 py-3 text-gray-300" {...props}>
        {children}
      </td>
    );
  },
  tr({ children, ...props }: any) {
    return (
      <tr
        className="hover:bg-zinc-800/50 transition-colors even:bg-zinc-800/30"
        {...props}
      >
        {children}
      </tr>
    );
  },
  blockquote({ children, ...props }: any) {
    // Extract the text content to detect callout patterns
    let isCallout = false;
    let calloutType = "note";
    let title = "";

    // A helper to recursively extract the first text string from React children
    const extractFirstText = (nodes: any): string => {
      let text = "";
      React.Children.forEach(nodes, (child) => {
        if (typeof child === "string") {
          text += child;
        } else if (child && child.props && child.props.children) {
          text += extractFirstText(child.props.children);
        }
      });
      return text;
    };

    const firstText = extractFirstText(children);

    // Detect GitHub-style callouts like [!NOTE], [!WARNING], etc.
    const calloutMatch = firstText.match(
      /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i,
    );

    if (calloutMatch) {
      isCallout = true;
      calloutType = calloutMatch[1].toLowerCase();
      // Capitalize first letter for the title
      title = calloutType.charAt(0).toUpperCase() + calloutType.slice(1);
    }

    // A helper to clone the children and strip the [!TYPE] string from the start.
    const stripCalloutPrefix = (nodes: any, prefixToStrip: string): any => {
      let stripped = false; // Only strip once
      return React.Children.map(nodes, (child) => {
        if (
          typeof child === "string" &&
          !stripped &&
          child.trim().startsWith(prefixToStrip)
        ) {
          stripped = true;
          const newStr = child.replace(
            new RegExp(
              `^\\s*${prefixToStrip.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`,
              "i",
            ),
            "",
          );
          return newStr || null; // If empty string after strip, return null so it doesn't render an empty line
        }
        if (React.isValidElement(child)) {
          return React.cloneElement(
            child,
            (child as React.ReactElement<any>).props,
            stripCalloutPrefix(
              (child as React.ReactElement<any>).props.children,
              prefixToStrip,
            ),
          );
        }
        return child;
      });
    };

    let processedChildren = children;
    if (isCallout && calloutMatch) {
      processedChildren = stripCalloutPrefix(children, calloutMatch[0]);
    }

    if (isCallout) {
      // Premium colors based on callout type
      const styles: Record<
        string,
        {
          bg: string;
          border: string;
          text: string;
          iconColor: string;
          icon: React.ReactNode;
        }
      > = {
        note: {
          bg: "bg-blue-500/10",
          border: "border-blue-500/50",
          text: "text-blue-400",
          iconColor: "text-blue-400",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              width="16"
              height="16"
              fill="currentColor"
            >
              <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.5a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path>
            </svg>
          ),
        },
        tip: {
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/50",
          text: "text-emerald-400",
          iconColor: "text-emerald-400",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              width="16"
              height="16"
              fill="currentColor"
            >
              <path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"></path>
            </svg>
          ),
        },
        important: {
          bg: "bg-purple-500/10",
          border: "border-purple-500/50",
          text: "text-purple-400",
          iconColor: "text-purple-400",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              width="16"
              height="16"
              fill="currentColor"
            >
              <path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path>
            </svg>
          ),
        },
        warning: {
          bg: "bg-amber-500/10",
          border: "border-amber-500/50",
          text: "text-amber-400",
          iconColor: "text-amber-400",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              width="16"
              height="16"
              fill="currentColor"
            >
              <path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.399A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.554Zm4.415 4.303a.75.75 0 0 0-1.45-.385L8.25 9.5a.75.75 0 0 0 1.5 0Zm-1.859 6.4a1 1 0 1 0-2 0 1 1 0 0 0 2 0Z"></path>
            </svg>
          ),
        },
        caution: {
          bg: "bg-red-500/10",
          border: "border-red-500/50",
          text: "text-red-400",
          iconColor: "text-red-400",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              width="16"
              height="16"
              fill="currentColor"
            >
              <path d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path>
            </svg>
          ),
        },
      };

      const style = styles[calloutType] || styles.note;

      return (
        <div
          data-callout-type={calloutType}
          className={`my-5 p-4 rounded-xl border-l-[3px] ${style.bg} ${style.border} text-gray-300 text-[15.5px] shadow-sm`}
          {...props}
        >
          <div
            className={`flex items-center gap-2 mb-2 font-semibold ${style.text}`}
          >
            <span className={`shrink-0 mt-px ${style.iconColor}`}>
              {style.icon}
            </span>
            <span>{title}</span>
          </div>
          <div className="opacity-90 leading-relaxed [&>p:last-child]:mb-0 [&>p:first-child]:mt-0">
            {processedChildren}
          </div>
        </div>
      );
    }

    // Default premium blockquote (if no callout string is found)
    return (
      <blockquote
        className="my-5 py-3 pr-4 pl-5 border-l-[3px] border-zinc-500/50 bg-zinc-800/30 rounded-r-xl text-gray-400 italic"
        {...props}
      >
        {children}
      </blockquote>
    );
  },
};
