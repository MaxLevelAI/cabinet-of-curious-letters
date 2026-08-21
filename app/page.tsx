import Script from "next/script";
import documentSource from "../index.html?raw";

const bodyMatch = documentSource.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
const siteMarkup = (bodyMatch?.[1] ?? "").replace(
  /<script\s+src=["']\/app\.js["'][^>]*><\/script>/i,
  "",
);

export default function HomePage() {
  return (
    <>
      <div className="site-root" dangerouslySetInnerHTML={{ __html: siteMarkup }} />
      <Script src="/app.js" strategy="afterInteractive" />
    </>
  );
}
