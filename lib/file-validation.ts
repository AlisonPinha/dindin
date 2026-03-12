/**
 * Validates file content by checking magic bytes (file signatures).
 * No external dependencies - uses raw byte comparison.
 */

interface FileSignature {
  mimeType: string;
  bytes: number[];
  offset?: number;
  /** Additional signature that must also match (e.g., WebP has two parts) */
  secondBytes?: number[];
  secondOffset?: number;
}

const FILE_SIGNATURES: FileSignature[] = [
  // JPEG: FF D8 FF
  { mimeType: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  { mimeType: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  // GIF: 47 49 46 38 (GIF87a or GIF89a)
  { mimeType: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  // WebP: 52 49 46 46 at offset 0 AND 57 45 42 50 at offset 8
  {
    mimeType: "image/webp",
    bytes: [0x52, 0x49, 0x46, 0x46],
    secondBytes: [0x57, 0x45, 0x42, 0x50],
    secondOffset: 8,
  },
  // PDF: 25 50 44 46 (%PDF)
  { mimeType: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
];

/**
 * Checks file magic bytes against known signatures and validates
 * that the detected type matches the declared MIME type.
 */
export function validateFileSignature(
  buffer: ArrayBuffer,
  declaredMimeType: string
): { valid: boolean; detectedType: string | null } {
  const view = new Uint8Array(buffer);

  // Need at least 12 bytes to check all signatures (WebP needs offset 8 + 4 bytes)
  if (view.length < 12) {
    return { valid: false, detectedType: null };
  }

  for (const sig of FILE_SIGNATURES) {
    const offset = sig.offset ?? 0;

    // Check primary bytes
    let matches = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (view[offset + i] !== sig.bytes[i]) {
        matches = false;
        break;
      }
    }

    if (!matches) continue;

    // Check secondary bytes if required (WebP)
    if (sig.secondBytes && sig.secondOffset !== undefined) {
      let secondMatches = true;
      for (let i = 0; i < sig.secondBytes.length; i++) {
        if (view[sig.secondOffset + i] !== sig.secondBytes[i]) {
          secondMatches = false;
          break;
        }
      }
      if (!secondMatches) continue;
    }

    // Normalize declared MIME type for comparison (image/jpg -> image/jpeg)
    const normalizedDeclared = declaredMimeType === "image/jpg" ? "image/jpeg" : declaredMimeType;

    return {
      valid: sig.mimeType === normalizedDeclared,
      detectedType: sig.mimeType,
    };
  }

  return { valid: false, detectedType: null };
}
