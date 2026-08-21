import type { Metadata } from "next";
import "../styles.css";

export const metadata: Metadata = {
  title: "The Cabinet of Curious Letters | Stories Worth Opening",
  description:
    "Serialized stories delivered through real mail. Discover The Mud Letters: 24 weekly letters and one unforgettable gift for Dad.",
  openGraph: {
    title: "The Cabinet of Curious Letters",
    description: "Stories worth opening. Serialized stories delivered through real mail.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Cabinet of Curious Letters",
    description: "Stories worth opening. Serialized stories delivered through real mail.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
