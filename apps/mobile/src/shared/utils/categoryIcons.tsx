import React from 'react';
import {
  Banknote,
  UtensilsCrossed,
  Car,
  Home,
  ShoppingBag,
  Gamepad2,
  HeartPulse,
  Smartphone,
  PiggyBank,
  Pin,
  Tag,
} from 'lucide-react-native';

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<any>> = {
  Salaire: Banknote,
  Nourriture: UtensilsCrossed,
  Transport: Car,
  Logement: Home,
  Shopping: ShoppingBag,
  Loisirs: Gamepad2,
  'Santé': HeartPulse,
  Abonnements: Smartphone,
  'Épargne': PiggyBank,
  Autre: Pin,
};

export function getCategoryLucideIcon(categoryName: string): React.ComponentType<any> {
  return CATEGORY_ICON_MAP[categoryName] || Tag;
}

export function renderCategoryIcon(categoryName: string, size: number = 20, color: string = '#6366f1') {
  const IconComponent = getCategoryLucideIcon(categoryName);
  return <IconComponent size={size} color={color} />;
}
