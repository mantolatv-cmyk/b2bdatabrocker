import { redirect } from "next/navigation";

/**
 * Root page — redirects to dashboard.
 * In production, this would be a landing page or login.
 */
export default function HomePage() {
  redirect("/dashboard");
}
