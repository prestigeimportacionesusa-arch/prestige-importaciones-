import { getBrands, getCategories } from "@/lib/data";
import ProductForm from "@/components/ProductForm";

export default async function NewProductPage({ searchParams }) {
  const sp = await searchParams;
  const [brands, categories] = await Promise.all([getBrands(), getCategories()]);
  return (
    <div>
      <h2>Nuevo producto</h2>
      <ProductForm brands={brands} categories={categories} error={sp?.error} />
    </div>
  );
}
