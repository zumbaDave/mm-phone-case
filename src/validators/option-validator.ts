// bg-blue-950 border-blue-950
// bg-zinc-900 border-zinc-900
// bg-rose-950 border-rose-950

import { PRODUCT_PRICES } from "@/config/products";

// The above comments are because tailwind does not really recognize custom labels.. eg tw: zinc-900
//  But by adding the comments, tailwind will recognize them

export const COLORS = [
    { label: "Black", value: "black", tw: 'zinc-900' },
    { label: "Blue", value: "blue", tw: 'blue-950' },
    { label: "Rose", value: "rose", tw: 'rose-950' }
] as const;

// as const tells typescript that it is not an array of any string and/or any array lengths,
//   but an array of these exact strings..
// So it is exactly three elements in the array with exactly these strings in it

export const MODELS = {
    name: "models",
    options: [
        { label: "iPhone X", value: "iphonex" },
        { label: "iPhone 11", value: "iphone11" },
        { label: "iPhone 12", value: "iphone12" },
        { label: "iPhone 13", value: "iphone13" },
        { label: "iPhone 14", value: "iphone14" },
        { label: "iPhone 15", value: "iphone15" },
        { label: "iPhone 16", value: "iphone16" }
    ]
} as const;

export const MATERIALS = {
    name: "material",
    options: [
        { label: "Silicon", value: "silicon", description: undefined, price: PRODUCT_PRICES.material.silicon },
        { label: "Soft Polycarbonate", value: "polycarbonate", description: "Scratch-resistant coating", price: PRODUCT_PRICES.material.polycarbonate },
    ]
} as const;

export const FINISHES = {
    name: "finish",
    options: [
        { label: "Smooth Finish", value: "smooth", description: undefined, price: PRODUCT_PRICES.finish.smooth },
        { label: "Textured Finish", value: "textured", description: "Soft grippy texture", price: PRODUCT_PRICES.finish.textured },
    ]
} as const;