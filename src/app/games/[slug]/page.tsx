import { redirect } from 'next/navigation';

export default async function GameRedirectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/top-up/${slug}`);
}
