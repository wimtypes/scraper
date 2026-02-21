import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface Article {
    id: string;
    source: string;
    title: string;
    summary: string;
    url: string;
    published_at: string;
    saved?: boolean;
}

export function Feed() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async (force = false) => {
        setLoading(true);
        setError(false);
        try {
            const endpoint = force ? "/api/refresh" : "/api/articles";
            const method = force ? "POST" : "GET";
            const res = await fetch(endpoint, { method });
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setArticles(data.articles || []);
        } catch (e) {
            console.error(e);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="container mx-auto max-w-5xl py-12 px-4">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-heading font-bold">Latest Intelligence</h2>
                <Button onClick={() => fetchArticles(true)} disabled={loading} variant="outline">
                    {loading ? "Refreshing..." : "Force Refresh"}
                </Button>
            </div>

            {loading && (
                <div className="py-20 text-center text-muted-foreground">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
                    <p>Fetching the latest AI articles...</p>
                </div>
            )}

            {error && !loading && (
                <div className="py-20 text-center text-destructive">
                    <p className="text-xl">⚠️ Couldn't fetch articles.</p>
                    <p className="mt-2 text-muted-foreground">Is the Python server running?</p>
                </div>
            )}

            {!loading && !error && articles.length === 0 && (
                <div className="py-20 text-center text-muted-foreground">
                    <p className="text-xl">📭 Nothing new in the last 24 hours.</p>
                    <p className="mt-2">Check back soon.</p>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                    <article
                        key={article.id}
                        className="flex flex-col justify-between rounded-xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-md"
                    >
                        <div>
                            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                <span>{article.source === "bens_bites" ? "🍪" : "⚡"}</span>
                                <span>{article.source.replace(/_/g, " ")}</span>
                            </div>
                            <h3 className="mb-3 text-lg font-bold leading-tight text-foreground line-clamp-3">
                                {article.title}
                            </h3>
                            <p className="mb-6 text-sm text-muted-foreground line-clamp-4">
                                {article.summary}
                            </p>
                        </div>
                        <div className="flex items-center justify-between border-t pt-4">
                            <time className="text-xs font-mono text-muted-foreground">
                                {new Date(article.published_at).toLocaleDateString()}
                            </time>
                            <a
                                href={article.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-semibold text-primary hover:underline"
                            >
                                Read →
                            </a>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
