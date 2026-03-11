export const fetchJson = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  // Set up a 10-second timeout so requests never hang forever
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      },
      signal: controller.signal,
    });

    let parsedData: unknown = null;
    try {
      parsedData = await response.json();
    } catch {
      parsedData = null;
    }

    if (!response.ok) {
      const serverMessage =
        parsedData !== null &&
          typeof parsedData === "object" &&
          "message" in parsedData &&
          typeof (parsedData as Record<string, unknown>).message === "string"
          ? (parsedData as Record<string, string>).message
          : `Request failed with status ${response.status}`;

      throw new Error(serverMessage);
    }

    if (
      parsedData !== null &&
      typeof parsedData === "object" &&
      "data" in parsedData
    ) {
      return (parsedData as Record<string, unknown>).data as T;
    }

    return parsedData as T;
  } finally {
    clearTimeout(timeoutId);
  }
};