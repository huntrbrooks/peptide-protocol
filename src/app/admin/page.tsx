"use client";

import dynamic from "next/dynamic";

const AdminDashboard = dynamic(
  () => import("./AdminDashboard").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto max-w-6xl px-4 py-12 text-sm text-muted sm:px-6">
        Loading admin…
      </div>
    ),
  },
);

export default function AdminPage() {
  return <AdminDashboard />;
}
