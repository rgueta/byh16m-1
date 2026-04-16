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

// Convertir timestamp solo días y horas
export const timeAgoSimple = (timestamp: Date | string | number): string => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInHours = Math.floor(
    (now.getTime() - past.getTime()) / (1000 * 60 * 60)
  );

  if (diffInHours >= 720) {
    const months = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    return `${months[past.getMonth()]} ${past.getDate()}`;
  } else if (diffInHours >= 24) {
    const days = Math.floor(diffInHours / 24);
    return `${days}d`;
  } else if (diffInHours >= 1) {
    return `${diffInHours}h`;
  } else {
    const diffInMinutes = Math.floor(
      (now.getTime() - past.getTime()) / (1000 * 60)
    );
    if (diffInMinutes >= 1) {
      return `${diffInMinutes}m`;
    } else {
      return "else";
    }
  }
};
