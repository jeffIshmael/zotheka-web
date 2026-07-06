"use client";

import Script from "next/script";
import { useEffect } from "react";
import { REDDIT_ATTESTATIONS } from "@/lib/landing-content";

function RedditEmbed({ url, title }: { url: string; title: string }) {
  useEffect(() => {
    const win = window as Window & { reddit?: { embed?: { process: () => void } } };
    win.reddit?.embed?.process?.();
  }, [url]);

  return (
    <blockquote
      className="reddit-embed-bq rounded-xl overflow-hidden border border-border bg-surface shadow-card"
      data-embed-height="320"
    >
      <a href={url} target="_blank" rel="noopener noreferrer">
        {title}
      </a>
    </blockquote>
  );
}

export function RedditAttestations() {
  return (
    <>
      <Script src="https://embed.reddit.com/widgets.js" strategy="lazyOnload" />
      <div className="grid gap-6 md:grid-cols-2">
        {REDDIT_ATTESTATIONS.map((post) => (
          <RedditEmbed key={post.url} url={post.url} title={post.title} />
        ))}
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        Real posts from{" "}
        <a
          href="https://www.reddit.com/r/Malawi/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-brand-green hover:underline"
        >
          r/Malawi
        </a>
        . Click any card to read the full thread on Reddit.
      </p>
    </>
  );
}
