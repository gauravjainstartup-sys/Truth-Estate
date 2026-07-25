import OfficeApp from "@/components/office/OfficeApp";

/* No brand suffix — the layout's title template appends it. */
export const metadata = { title: "Your Private Office" };

export default function Page() {
  return <OfficeApp section="home" />;
}
