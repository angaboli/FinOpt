const ICON_MAP: Record<string, string> = {
  alimentation: "basket-outline",
  transport: "car-outline",
  logement: "home-outline",
  santé: "medkit-outline",
  loisirs: "game-controller-outline",
  abonnements: "repeat-outline",
  restaurant: "restaurant-outline",
  shopping: "bag-handle-outline",
  éducation: "school-outline",
  autres: "grid-outline",
  revenu: "cash-outline",
  salaire: "briefcase-outline",
  virement: "swap-horizontal-outline",
};

export function categoryIcon(name: string): string {
  return ICON_MAP[name.toLowerCase().trim()] ?? "pricetag-outline";
}
