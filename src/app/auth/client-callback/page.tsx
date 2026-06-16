import { redirect } from "next/navigation";

export default function AuthClientCallbackPage() {
  redirect("/admin/login?error=invalid_auth_callback");
}
