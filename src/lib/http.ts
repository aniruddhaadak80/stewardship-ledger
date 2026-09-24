export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

export function objectValue(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected server error.";
}

export function jsonError(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}
