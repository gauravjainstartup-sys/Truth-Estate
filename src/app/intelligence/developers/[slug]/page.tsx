import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEVELOPERS, developerBySlug } from "@/lib/developers";
import DeveloperProfile from "@/components/intelligence/DeveloperProfile";

export function generateStaticParams() {
  return DEVELOPERS.map((d) => ({ slug: d.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const dev = developerBySlug(slug);
  if (!dev) return { title: "Developer Intelligence — Truth Estate" };
  return {
    title: `${dev.name} — Developer Intelligence | Truth Estate`,
    description: `Independent developer intelligence on ${dev.name}: track record, delivery performance and financial health. ${dev.tagline}`,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dev = developerBySlug(slug);
  if (!dev) notFound();
  return <DeveloperProfile dev={dev} />;
}
