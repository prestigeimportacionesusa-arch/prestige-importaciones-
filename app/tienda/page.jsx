import { getProducts, getBrands, getCategories, getPromotions } from "@/lib/data";
import ShopClient from "@/components/ShopClient";

export const revalidate = 3600; // se actualiza al instante si el admin edita algo (revalidatePath), esto es solo un techo de seguridad

export const metadata = { title: "Tienda — Prestige Importaciones" };

export default async function ShopPage({ searchParams }) {
  const sp = await searchParams;
  const [products, brands, categories, promotions] = await Promise.all([
    getProducts(),
    getBrands(),
    getCategories(),
    getPromotions(),
  ]);

  const initialFilters = {
    genero: sp?.genero || "",
    marca: sp?.marca || "",
    categoria: sp?.categoria || "",
    search: sp?.buscar || "",
    soloOfertas: sp?.ofertas === "1",
    soloCombo: sp?.combo === "1",
  };

  return (
    <ShopClient
      products={products}
      brands={brands}
      categories={categories}
      promotions={promotions}
      initialFilters={initialFilters}
    />
  );
}
