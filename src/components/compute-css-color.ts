function expandCssVars(color: string, el: HTMLElement): string {
  const style = getComputedStyle(el);
  const varRegex = /var\((--[a-zA-Z0-9\-_]+)\)/;
  let result = color;
  let match: RegExpMatchArray | null;
  while ((match = result.match(varRegex))) {
    const [fullMatch, varName] = match;
    const varValue = style.getPropertyValue(varName).trim();
    result = result.replace(fullMatch, varValue || "");
  }
  return result;
}

function fixDoubleWrapping(color: string): string {
  const colorFnRegex = /^(hsl|rgb|hwb|cmyk|lab|lch|oklab|oklch)\(\s*(.+)\)$/i;

  while (true) {
    const match = color.match(colorFnRegex);
    if (!match) break;
    const outerFn = match[1].toLowerCase();
    const inside = match[2].trim();
    const innerFnMatch = inside.match(
      /^(hsl|rgb|hwb|cmyk|lab|lch|oklab|oklch)\(/i
    );
    if (!innerFnMatch) break;
    const innerFn = innerFnMatch[1].toLowerCase();
    if (outerFn === innerFn) {
      color = inside;
    } else {
      break;
    }
  }
  return color;
}

function fixSlashPlacement(color: string): string {
  const regex = /^(\w+)\(([^)]*)\)\s*\/\s*(\S+)$/;
  const match = color.match(regex);
  if (match) {
    const [, fnName, inside, alpha] = match;
    return `${fnName}(${inside.trim()} / ${alpha.trim()})`;
  }
  return color;
}

export function computeCssColor(
  color: any,
  el: HTMLElement | null = null
): string {
  if (el === null) {
    if (typeof window === "undefined") return "#000";
    el = document.documentElement;
  }
  const expanded = expandCssVars(color, el);
  const unwrapped = fixDoubleWrapping(expanded);
  const fixedSlash = fixSlashPlacement(unwrapped);
  return fixedSlash;
}
