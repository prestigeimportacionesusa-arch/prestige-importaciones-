import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBrands, getCategories } from "@/lib/data";
import ProductForm from "@/components/ProductForm";

export default async function EditProductPage({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: product }, brands, categories] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    getBrands(),
    getCategories(),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h2>Editar producto</h2>
      <ProductForm product={product} brands={brands} categories={categories} error={sp?.error} />
    </div>
  );
}
