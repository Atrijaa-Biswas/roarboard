export const sanitiseInput = (input: string): string => {
  if (!input) return '';
  return input.replace(/<[^>]*>?/gm, '').trim().substring(0, 500);
};
