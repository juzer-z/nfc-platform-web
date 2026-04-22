import { getAuthenticatedAdmin } from "@/lib/server-auth";
import { redirect } from "next/navigation";
import ProfileForm from "../_components/profile-form";

export default async function NewProfilePage() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#081021] via-[#0b1630] to-[#07101f] text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-bold">New Employee Profile</h1>
        <p className="mt-2 text-white/60">
          Create a profile, upload photo/logo, then publish.
        </p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_40px_120px_rgba(0,0,0,0.55)]">
          <ProfileForm mode="create" />
        </div>
      </div>
    </div>
  );
}
