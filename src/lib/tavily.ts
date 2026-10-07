export interface TavilyResult {
  title: string;
  url: string;
  content: string;
}

export interface TavilyOptions {
  searchDepth?: "basic" | "advanced";
  includeDomains?: string[];
}

export async function tavilySearch(
  query: string,
  maxResults = 5,
  options: TavilyOptions = {}
): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "TAVILY_API_KEY não configurada. Crie uma chave gratuita (sem cartão) em https://tavily.com/ e coloque em .env.local"
    );
  }

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      max_results: maxResults,
      search_depth: options.searchDepth ?? "advanced",
      include_raw_content: false,
      ...(options.includeDomains?.length ? { include_domains: options.includeDomains } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Tavily Search falhou (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    results?: { title: string; url: string; content: string }[];
  };

  return (data.results ?? []).map((r) => ({
    title: r.title,
    url: r.url,
    content: r.content,
  }));
}
