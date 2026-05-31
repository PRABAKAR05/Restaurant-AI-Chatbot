const pdf = require('pdf-parse');

export async function parsePDFToChunks(buffer: Buffer): Promise<string[]> {
  try {
    const data = await pdf(buffer);
    const rawText = data.text;

    // Clean the text
    const cleanedText = rawText
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();

    if (!cleanedText) {
      throw new Error('No text content found in PDF');
    }

    // Split into chunks of ~500 characters with 50 character overlap
    const chunkSize = 500;
    const overlap = 50;
    const chunks: string[] = [];

    let startIndex = 0;
    while (startIndex < cleanedText.length) {
      let endIndex = startIndex + chunkSize;

      // Try to break at a sentence or word boundary
      if (endIndex < cleanedText.length) {
        const lastPeriod = cleanedText.lastIndexOf('.', endIndex);
        const lastNewline = cleanedText.lastIndexOf('\n', endIndex);
        const breakPoint = Math.max(lastPeriod, lastNewline);

        if (breakPoint > startIndex + chunkSize / 2) {
          endIndex = breakPoint + 1;
        }
      }

      const chunk = cleanedText.slice(startIndex, endIndex).trim();

      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      // Move start forward, accounting for overlap
      startIndex = endIndex - overlap;

      // Prevent infinite loop
      if (startIndex >= cleanedText.length - overlap) {
        break;
      }
    }

    return chunks.filter((chunk) => chunk.length > 10);
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error(
      `Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
