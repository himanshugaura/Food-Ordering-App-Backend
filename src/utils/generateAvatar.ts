export const generateAvatar = () => {
  const randomSeed =
    Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    
  return `https://robohash.org/${randomSeed}?set=set1`;
};
