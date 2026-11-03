import Link from "next/link";

export default function PageB() {
  return (
    <main>
      <h1>Page B</h1>
      <Link href="/a">Open /a (no search params, must not redirect)</Link>
    </main>
  );
}
