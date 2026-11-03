import { notFound } from "next/navigation";

/** Unknown store URLs land here, so the 404 shows inside the store in the right language. */
export default function UnknownPage() {
  notFound();
}
