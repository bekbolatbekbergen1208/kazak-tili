import type { Metadata } from "next";
import { WordTranslator } from "@/components/word-translator";
import "./translation.css";
import "./globals.css";
import "./extra.css";
import "./extra2.css";
import "./control.css";
import "./methodology.css";
import "./lesson-method.css";
import "./mistake-review.css";
import "./catalog.css";
import "./voice.css";
import "./listening.css";
import "./progression.css";
import "./scenes.css";
import "./help.css";
import "./learning.css";
import "./characters.css";
import "./dossha.css";
import "./polish.css";
import "./brand.css";
import "./cartoon.css";

export const metadata: Metadata = {
  title: "QazaqDos — қазақ тілін саяхатпен үйрен",
  description: "Балаларға арналған бейімделмелі қазақ тілі платформасы",
  icons: {
    icon: {
      url: "/qazaqdos-logo.png",
      type: "image/png",
      sizes: "1254x1254",
    },
    apple: "/qazaqdos-logo.png",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="kk">
      <body>{children}<WordTranslator /></body>
    </html>
  );
}
