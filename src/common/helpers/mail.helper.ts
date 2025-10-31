export const getHeader = (headers: any[], name: string) =>
  headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ||
  undefined;
