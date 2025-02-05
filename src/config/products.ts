export const PRODUCT_PRICES = {
    material: {
        silicon: 0,
        polycarbonate: 5_00,  // fancy way of saying 5 dollars in javascript, actually it is 500 cents
    },
    finish: {
        smooth: 0,
        textured: 3_00
    }
} as const;

export const BASE_PRICE = 14_00