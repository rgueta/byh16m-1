export const monthlyFolder = async () => {
  const d = new Date();
  const m = d.getMonth() + 1;

  const folder = (await m.toString()) + d.getFullYear().toString();
  return folder;
  // throw new ReferenceError("error generated");
};

export const encodeUrlSafe = (url: string): string => {
  if (!url) return "";
  // Codifica solo caracteres problemáticos, NO las barras
  return url
    .replace(/ /g, "%20") // espacios
    .replace(/#/g, "%23") // numeral
    .replace(/\?/g, "%3F") // interrogación
    .replace(/&/g, "%26") // ampersand
    .replace(/=/g, "%3D"); // igual
  // No reemplazar / (barra) ni caracteres de ruta
};
