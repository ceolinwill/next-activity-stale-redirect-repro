import { redirect } from "next/navigation";
import { Suspense } from "react";

async function Content({ searchParams }) {
  const { to } = await searchParams;

  if (to === "b") {
    redirect("/b");
  }

  return <h1>Page A</h1>;
}

export default function PageA({ searchParams }) {
  return (
    <Suspense fallback={<p>Loading A…</p>}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
