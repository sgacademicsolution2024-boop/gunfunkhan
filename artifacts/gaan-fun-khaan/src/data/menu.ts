export type MenuItem = {
  id: string;
  name: string;
  price: number | null;
  category: "Tea" | "Coffee" | "Snacks" | "Other";
};

export const MENU_ITEMS: MenuItem[] = [
  { id: "t1", name: "Milk Tea", price: 10, category: "Tea" },
  { id: "t2", name: "Milk Tea Assam", price: 20, category: "Tea" },
  { id: "t3", name: "Darjeeling Tea Makaibari", price: 20, category: "Tea" },
  { id: "t4", name: "Black Tea", price: 10, category: "Tea" },
  { id: "t5", name: "Chocolate Tea", price: 35, category: "Tea" },
  { id: "t6", name: "Cream Tea", price: 25, category: "Tea" },
  { id: "t7", name: "Banarasi Tea", price: 30, category: "Tea" },
  { id: "t8", name: "Malai Tea", price: 25, category: "Tea" },
  { id: "t9", name: "Ice Tea", price: 40, category: "Tea" },
  { id: "t10", name: "Special Malai Kesar Kashmiri Tea", price: 181, category: "Tea" },
  { id: "c1", name: "Black Coffee", price: 10, category: "Coffee" },
  { id: "c2", name: "Milk Coffee", price: 20, category: "Coffee" },
  { id: "c3", name: "Chocolate Coffee", price: 40, category: "Coffee" },
  { id: "c4", name: "Hot Chocolate", price: 99, category: "Coffee" },
  { id: "s1", name: "French Fries Small", price: 33, category: "Snacks" },
  { id: "s2", name: "French Fries Large", price: 55, category: "Snacks" },
  { id: "s3", name: "Nuggets 8 pcs", price: 59, category: "Snacks" },
  { id: "s4", name: "Fish Finger 6 pcs", price: 120, category: "Snacks" },
  { id: "s5", name: "Cheese Ball 6 pcs", price: 79, category: "Snacks" },
  { id: "s6", name: "Chicken Wings 4 pcs", price: 99, category: "Snacks" },
  { id: "s7", name: "Chicken Lollipop 2 pcs", price: 55, category: "Snacks" },
  { id: "s8", name: "Chicken Lollipop 4 pcs", price: 99, category: "Snacks" },
  { id: "s9", name: "Chicken Strips 5 pcs", price: 99, category: "Snacks" },
  { id: "s10", name: "Chicken Pop", price: 99, category: "Snacks" },
  { id: "s11", name: "Chicken Garlic Finger", price: 118, category: "Snacks" },
  { id: "s12", name: "Chicken Peri Peri Finger", price: 69, category: "Snacks" },
  { id: "s13", name: "Kurseong Chicken Momo with Soup", price: 60, category: "Snacks" },
  { id: "s14", name: "Maggi Veg", price: 20, category: "Snacks" },
  { id: "s15", name: "Egg Maggi", price: 40, category: "Snacks" },
  { id: "s16", name: "Fried Maggi", price: 50, category: "Snacks" },
  { id: "s17", name: "All Mokal", price: 33, category: "Snacks" },
  { id: "s18", name: "Lassi", price: 33, category: "Snacks" },
  { id: "s19", name: "Breakfast Package", price: 59, category: "Snacks" },
  { id: "s20", name: "Sandwich Veg", price: 69, category: "Snacks" },
  { id: "s21", name: "Sandwich Chicken", price: 89, category: "Snacks" },
  { id: "o1", name: "Customise Cake", price: null, category: "Other" },
];

export const CATEGORIES = ["All", "Tea", "Coffee", "Snacks", "Other"] as const;
export type Category = typeof CATEGORIES[number];
