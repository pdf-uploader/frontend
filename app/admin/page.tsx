import { redirect } from "next/navigation";

/** Legacy `/admin` → dedicated manage-users route. */
export default function AdminPage() {
  redirect("/users");
}
