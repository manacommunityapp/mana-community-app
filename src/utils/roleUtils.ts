/**
 * Sorts role objects with ADMIN (or Admin) first, followed by all remaining roles in alphabetical order by label or name.
 */
export function sortRoles<T extends { label?: string; name: string }>(roles: T[]): T[] {
  return [...roles].sort((a, b) => {
    const aNameUpper = (a.name || "").trim().toUpperCase();
    const bNameUpper = (b.name || "").trim().toUpperCase();

    // ADMIN or ADMINISTRATOR always comes first
    const isAAdmin = aNameUpper === "ADMIN" || aNameUpper === "ADMINISTRATOR";
    const isBAdmin = bNameUpper === "ADMIN" || bNameUpper === "ADMINISTRATOR";

    if (isAAdmin && !isBAdmin) return -1;
    if (!isAAdmin && isBAdmin) return 1;

    // Compare alphabetically by display label (or name if no label)
    const aLabel = (a.label || a.name || "").trim();
    const bLabel = (b.label || b.name || "").trim();

    return aLabel.localeCompare(bLabel, undefined, { sensitivity: "base", numeric: true });
  });
}

/**
 * Sorts role string names with ADMIN first, followed by all remaining role names in alphabetical order.
 */
export function sortRoleStrings(roles: string[]): string[] {
  return [...roles].sort((a, b) => {
    const aUpper = (a || "").trim().toUpperCase();
    const bUpper = (b || "").trim().toUpperCase();

    // ADMIN or ADMINISTRATOR always comes first
    const isAAdmin = aUpper === "ADMIN" || aUpper === "ADMINISTRATOR";
    const isBAdmin = bUpper === "ADMIN" || bUpper === "ADMINISTRATOR";

    if (isAAdmin && !isBAdmin) return -1;
    if (!isAAdmin && isBAdmin) return 1;

    return a.trim().localeCompare(b.trim(), undefined, { sensitivity: "base", numeric: true });
  });
}
