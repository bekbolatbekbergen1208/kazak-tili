export async function prepareVisionImage(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 20_000_000)
    throw Error("JPG, PNG немесе WebP суреті 20 МБ-тан аспасын.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
    } catch {
      throw Error(
        "Сурет ашылмады немесе файл бүлінген. Басқа JPG, PNG не WebP файлын таңда.",
      );
    }
    if (
      !image.naturalWidth ||
      !image.naturalHeight ||
      image.naturalWidth * image.naturalHeight > 40_000_000
    )
      throw Error(
        "Сурет өлшемі тым үлкен. 40 мегапиксельден кіші кадрды таңда.",
      );
    const scale = Math.min(
      1,
      1600 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw Error("Браузер суретті өңдей алмады.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    // Canvas removes original metadata and sends only the visible, resized pixels.
    const data = canvas.toDataURL("image/jpeg", 0.9);
    if (data.length > 4_500_000)
      throw Error("Сурет тым үлкен. Кішірек кадрды таңда.");
    return data;
  } finally {
    URL.revokeObjectURL(url);
  }
}
