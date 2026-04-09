export async function extractImageHintsFromPhoto(
  photoUrl?: string | null
): Promise<string[]> {
  if (!photoUrl) return [];

  // MVP scaffold:
  // Aquí luego podremos conectar OCR o visión para leer grabados, referencias
  // y pistas visuales del catalizador.
  return [];
}
