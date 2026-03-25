import { getAllProducts, getProductByBarcode } from "./database/databaseClient";


async function hasProductAllready(barcode: string) {
    const containProduct = await getProductByBarcode(barcode);
    if (!containProduct) {
        return false;
    }
    return true;
}

export { hasProductAllready };