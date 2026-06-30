import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROJECT_INTEL, projectBySlug } from "@/lib/projects";
import ProjectProfile from "@/components/intelligence/ProjectProfile";

export function generateStaticParams() {
  return PROJECT_INTEL.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = projectBySlug(slug);
  if (!p) return { title: "Project Intelligence — Truth Estate" };
  return {
    title: `${p.name} — Project Intelligence | Truth Estate`,
    description: `Independent Truth Score (${p.truthScore}/100) for ${p.name} by ${p.developer}, ${p.market}: verdict, score anatomy, pricing, strengths and watch-outs. ${p.reason}`,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = projectBySlug(slug);
  if (!p) notFound();
  return <ProjectProfile p={p} />;
}
