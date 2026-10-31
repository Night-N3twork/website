export function routeArgs(params: Record<string, string | undefined> = {}, url = 'http://localhost/', init?: RequestInit): never {
  return { request: new Request(url, init), params, context: {}, unstable_pattern: '' } as never;
}
