import type { SearchModule } from '../../../services/search/searchService';

export interface ModuleConfig {
  value: SearchModule;
  label: string;
  icon: string;
}

export interface ModuleGroup {
  label: string;
  modules: ModuleConfig[];
}

export const MODULE_GROUPS: ModuleGroup[] = [
  { label: 'People', modules: [
    { value: 'PERSON', label: 'People & Skills', icon: '👤' },
  ]},
  { label: 'Events', modules: [
    { value: 'EVENT', label: 'Events', icon: '🎉' },
    { value: 'POOJA', label: 'Pooja & Religious', icon: '🪔' },
  ]},
  { label: 'Sports', modules: [
    { value: 'SPORTS_EVENT', label: 'Sports Events', icon: '⚽' },
    { value: 'COACHING', label: 'Coaching', icon: '🏋️' },
  ]},
  { label: 'Food', modules: [
    { value: 'FOOD_RESTAURANT', label: 'Restaurants', icon: '🍽️' },
    { value: 'FOOD_MENU_ITEM', label: 'Menu Items', icon: '🍛' },
    { value: 'GROCERY_PRODUCT', label: 'Grocery', icon: '🛒' },
    { value: 'HOME_CHEF', label: 'Home Chefs', icon: '👨‍🍳' },
  ]},
  { label: 'Services', modules: [
    { value: 'HOME_SERVICE', label: 'Home Services', icon: '🔧' },
    { value: 'VENDOR', label: 'Vendors', icon: '🏪' },
  ]},
  { label: 'Marketplace', modules: [
    { value: 'MARKETPLACE_LISTING', label: 'Listings', icon: '🏷️' },
  ]},
  { label: 'Health', modules: [
    { value: 'HEALTH_DOCTOR', label: 'Doctors', icon: '🩺' },
    { value: 'HEALTH_CLINIC', label: 'Clinics', icon: '🏥' },
  ]},
  { label: 'Education', modules: [
    { value: 'COURSE', label: 'Courses', icon: '📚' },
    { value: 'WORKSHOP', label: 'Workshops', icon: '🎨' },
  ]},
  { label: 'Travel', modules: [
    { value: 'TRIP', label: 'Trips', icon: '✈️' },
    { value: 'RIDE', label: 'Rides', icon: '🚗' },
  ]},
  { label: 'Work', modules: [
    { value: 'JOB', label: 'Jobs', icon: '💼' },
    { value: 'PROFESSIONAL_SERVICE', label: 'Professional Services', icon: '👔' },
  ]},
];

export const MODULE_LABEL: Record<string, string> = Object.fromEntries(
  MODULE_GROUPS.flatMap(g => g.modules.map(m => [m.value, m.label]))
);

export const MODULE_ICON: Record<string, string> = Object.fromEntries(
  MODULE_GROUPS.flatMap(g => g.modules.map(m => [m.value, m.icon]))
);

export const ALL_MODULES: SearchModule[] = MODULE_GROUPS.flatMap(g => g.modules.map(m => m.value));
