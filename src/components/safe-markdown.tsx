import ReactMarkdown from "react-markdown";

// Markdown here can originate from untrusted web content summarized by an LLM.
// Images are not rendered: an <img> pointing at an attacker URL would be fetched
// automatically by the browser, leaking the viewer's IP and timing.
export function SafeMarkdown({ children }: { children: string }) {
  return <ReactMarkdown disallowedElements={["img"]}>{children}</ReactMarkdown>;
}
