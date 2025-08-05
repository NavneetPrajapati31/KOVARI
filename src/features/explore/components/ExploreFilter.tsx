// Budget filter options for Explore feature
export interface BudgetPreset {
  label: string;
  value: number;
}

export const budgetPresets: BudgetPreset[] = [
  { label: "Budget ₹10k", value: 10000 },
  { label: "Mid ₹20k", value: 20000 },
  { label: "Premium ₹35k", value: 35000 },
  { label: "Luxury ₹50k+", value: 50000 },
]


export interface CityType {
  name: string;
  code: string;
}

export const popularCities: CityType[] = [
  { name: "Bengaluru", code: "BLR" },
  { name: "Mumbai", code: "BOM" },
  { name: "Delhi", code: "DEL" },
  { name: "Chennai", code: "MAA" },
  { name: "Kolkata", code: "CCU" },
  { name: "Hyderabad", code: "HYD" },
  { name: "Goa", code: "GOI" },
  { name: "Pune", code: "PNQ" },
];




export const budgetMarks: number[] = [5000, 15000, 25000, 35000, 50000] 