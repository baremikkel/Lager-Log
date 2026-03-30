
export interface Category {
    id: number;
    name: string;
}

export interface Inventory {
    id: number;
    product_id: number;
    product_amount: number;
}

export interface Product {
    id: number;
    product_barcode: string;
    product_name: string;
    stock: number;
}

export interface Recipe {
    id: number;
    recipe_title: string;
    std_serving_size: number;
    recipe_steps: string;
}

export interface RecipeIngredient {
    id: number;
    product_id: number;
    recipe_id: number; 
    amount: number;
    note?: string;
}