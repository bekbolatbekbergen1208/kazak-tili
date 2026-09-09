import { notFound } from "next/navigation";
import { readingBook } from "@/lib/books/catalog";
import { BookReader } from "@/components/books/reader";
export default async function Page({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const book = readingBook(bookId);
  if (!book) notFound();
  return <BookReader key={book.id} book={book} />;
}
