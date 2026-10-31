export const isCurrent = (path: string, target: string): boolean => path === target || path.startsWith(`${target}/`);
