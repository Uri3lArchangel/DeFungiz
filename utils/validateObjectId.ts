export function isValidObjectId(id: string): boolean {
    // Basic check for ObjectID format (24 hex characters)
    return /^[0-9a-fA-F]{24}$/.test(id);
  }