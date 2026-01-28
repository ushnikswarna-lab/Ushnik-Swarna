/** Dummy menu data for Header & Bottombar */

export const MAIN_NAV = [
  { title: "New Arrivals", href: "/jewellery?new=1" },
  { title: "Express Delivery", href: "/jewellery?express=1", icon: "truck" },
  { title: "Earrings", href: "/jewellery?category=earrings", megaMenu: true },
  { title: "Pendants", href: "/jewellery?category=pendants" },
  { title: "Rings", href: "/jewellery?category=rings" },
  { title: "Diamond Jewellery", href: "/jewellery?category=diamond", megaMenu: true },
  { title: "More Jewellery", href: "/jewellery" },
  { title: "Gifting", href: "/jewellery?gifting=1" },
  { title: "Wedding Collections", href: "/jewellery?wedding=1" },
] as const;

export const MEGA_MENU = {
  shopByStyle: [
    { label: "Earrings", href: "/jewellery?category=earrings" },
    { label: "Rings", href: "/jewellery?category=rings" },
    { label: "Bangles & Bracelets", href: "/jewellery?category=bangles" },
    { label: "Mangalsutras", href: "/jewellery?category=mangalsutras" },
    { label: "Pendants", href: "/jewellery?category=pendants" },
    { label: "Nosepins", href: "/jewellery?category=nosepins" },
    { label: "Jewellery Sets", href: "/jewellery?category=sets" },
    { label: "Necklaces", href: "/jewellery?category=necklaces" },
  ],
  shopByPrice: [
    { label: "Under ₹10,000", href: "/jewellery?max=10000" },
    { label: "₹10,000 – ₹20,000", href: "/jewellery?min=10000&max=20000" },
    { label: "₹20,000 – ₹50,000", href: "/jewellery?min=20000&max=50000" },
    { label: "₹50,000 – ₹75,000", href: "/jewellery?min=50000&max=75000" },
    { label: "₹75,000 – ₹1 L", href: "/jewellery?min=75000&max=100000" },
    { label: "Above ₹1 L", href: "/jewellery?min=100000" },
  ],
  shopByOccasion: [
    { label: "Party Wear", href: "/jewellery?occasion=party" },
    { label: "Casual Wear", href: "/jewellery?occasion=casual" },
    { label: "Office Wear", href: "/jewellery?occasion=office" },
    { label: "Engagement Wear", href: "/jewellery?occasion=engagement" },
  ],
};

export const BOTTOMBAR_ITEMS = [
  { id: "account", label: "Account", href: "/dashboard", icon: "user" },
  { id: "scanner", label: "Price Scanner", href: "/price-scanner", icon: "barcode" },
  { id: "categories", label: "Categories", href: "/jewellery", icon: "grid" },
  { id: "scheme", label: "Gold Scheme", href: "/schemes", icon: "coins" },
  { id: "help", label: "Help", href: "/contact", icon: "help" },
] as const;
