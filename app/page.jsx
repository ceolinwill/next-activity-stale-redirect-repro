import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Home</h1>
      <Link href="/a?to=b">Open /a?to=b (redirects to /b)</Link>
    </main>
  );
}
