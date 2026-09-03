import type { Metadata } from "next";
import "./globals.css";
import "./extra.css";
import "./extra2.css";
import "./control.css";
import "./methodology.css";
import "./lesson-method.css";
import "./mistake-review.css";
import "./catalog.css";

export const metadata: Metadata = { title: "QazaqDos — қазақ тілін саяхатпен үйрен", description: "Балаларға арналған бейімделмелі қазақ тілі платформасы" };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="kk"><body>{children}</body></html>; }
