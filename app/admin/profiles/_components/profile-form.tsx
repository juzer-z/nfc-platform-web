"use client";

import Link from "next/link";
import type { Profile as PrismaProfile } from "@prisma/client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Profile = PrismaProfile;

type ProfileFormState = Omit<Profile, "id"> & {
  id?: string;
};

type MutationError = {
  error?: string;
};

type CreateProfileResponse = {
  id?: string;
  slug?: string;
};

type UploadResponse = {
  url?: string;
  error?: string;
};

type Props =
  | { mode: "create"; initial?: Partial<Profile> }
  | { mode: "edit"; initial: Profile };

const MAX_PHOTO_BYTES = 400 * 1024; // 400KB
const MAX_LOGO_BYTES = 200 * 1024; // 200KB

export default function ProfileForm(props: Props) {
  const router = useRouter();

  const [form, setForm] = useState<ProfileFormState>(() => ({
    id: props.mode === "edit" ? props.initial.id : undefined,
    slug: props.initial?.slug ?? "",
    fullName: props.initial?.fullName ?? "",
    title: props.initial?.title ?? null,
    company: props.initial?.company ?? null,
    department: props.initial?.department ?? null,
    phone: props.initial?.phone ?? null,
    whatsapp: props.initial?.whatsapp ?? null,
    emailPublic: props.initial?.emailPublic ?? null,
    website: props.initial?.website ?? null,
    linkedin: props.initial?.linkedin ?? null,
    address: props.initial?.address ?? null,
    mapUrl: props.initial?.mapUrl ?? null,
    photoUrl: props.initial?.photoUrl ?? null,
    companyLogoUrl: props.initial?.companyLogoUrl ?? null,
    isActive: props.initial?.isActive ?? true,
    isPublished: props.initial?.isPublished ?? true,
    createdAt: props.initial?.createdAt ?? new Date(),
    updatedAt: props.initial?.updatedAt ?? new Date(),
    userId: props.initial?.userId ?? null,
  }));

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function update<K extends keyof ProfileFormState>(
    key: K,
    value: ProfileFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const suggestedSlug = useMemo(() => {
    if (form.slug.trim()) return form.slug.trim();
    return slugify(form.fullName);
  }, [form.slug, form.fullName]);

  const publicUrl = useMemo(
    () => `/u/${suggestedSlug || "your-slug"}`,
    [suggestedSlug]
  );

  const inputClass =
    "mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white " +
    "placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/60";

  async function onPickImage(
    file: File,
    type: "photo" | "logo",
    clearInput: () => void
  ) {
    try {
      setMessage("");

      const max = type === "photo" ? MAX_PHOTO_BYTES : MAX_LOGO_BYTES;
      if (file.size > max) {
        throw new Error(
          type === "photo"
            ? "User photo too large (max 400 KB)"
            : "Company logo too large (max 200 KB)"
        );
      }

      if (type === "photo") setUploadingPhoto(true);
      else setUploadingLogo(true);

      const url = await uploadImage(file, type);

      if (type === "photo") update("photoUrl", url);
      else update("companyLogoUrl", url);

      setMessage(
        `${type === "photo" ? "Photo" : "Logo"} uploaded. Now click Save.`
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed");
    } finally {
      if (type === "photo") setUploadingPhoto(false);
      else setUploadingLogo(false);
      clearInput();
    }
  }

  async function saveOrCreate() {
    setSaving(true);
    setMessage("");

    const fullName = form.fullName.trim();
    if (!fullName) {
      setMessage("Full Name is required");
      setSaving(false);
      return;
    }

    const payload = {
      fullName,
      slug: form.slug.trim() || null,
      title: emptyToNull(form.title),
      company: emptyToNull(form.company),
      department: emptyToNull(form.department),
      phone: emptyToNull(form.phone),
      whatsapp: emptyToNull(form.whatsapp),
      emailPublic: emptyToNull(form.emailPublic),
      website: emptyToNull(form.website),
      linkedin: emptyToNull(form.linkedin),
      address: emptyToNull(form.address),
      mapUrl: emptyToNull(form.mapUrl),
      photoUrl: emptyToNull(form.photoUrl),
      companyLogoUrl: emptyToNull(form.companyLogoUrl),
      isActive: form.isActive,
      isPublished: form.isPublished,
    };

    try {
      if (props.mode === "create") {
        const res = await fetch("/api/admin/profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data: CreateProfileResponse & MutationError = await res
          .json()
          .catch(() => ({}));
        if (!res.ok) {
          setMessage(typeof data?.error === "string" ? data.error : "Create failed");
          return;
        }

        const id = data?.id as string | undefined;
        if (!id) {
          setMessage("Created, but server did not return the new ID.");
          return;
        }

        router.push(`/admin/profiles/${id}`);
        return;
      }

      const res = await fetch(`/api/admin/profiles/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: MutationError = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(typeof data?.error === "string" ? data.error : "Save failed");
        return;
      }

      setMessage("Saved successfully");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProfile() {
    if (!form.id) return;
    const ok = confirm("Delete this profile permanently?");
    if (!ok) return;

    setDeleting(true);
    setMessage("");

    try {
      const res = await fetch(`/api/admin/profiles/${form.id}`, { method: "DELETE" });
      const data: MutationError = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage(typeof data?.error === "string" ? data.error : "Delete failed");
        return;
      }

      router.push("/admin/profiles");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      {message && (
        <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white">
          {message}
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        <Field label="Full Name" hint="Required">
          <input
            className={inputClass}
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            placeholder="e.g., Juzer Zulfikar Ali"
          />
        </Field>

        <Field label="Slug" hint={`Public link: ${publicUrl}`}>
          <input
            className={inputClass}
            value={form.slug}
            onChange={(e) => update("slug", e.target.value)}
            placeholder="leave blank to auto-generate"
          />
        </Field>

        <Field label="Title">
          <input
            className={inputClass}
            value={form.title ?? ""}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g., Technical Director"
          />
        </Field>

        <Field label="Company">
          <input
            className={inputClass}
            value={form.company ?? ""}
            onChange={(e) => update("company", e.target.value)}
            placeholder="e.g., Ezzy Automations Limited"
          />
        </Field>

        <Field label="Department">
          <input
            className={inputClass}
            value={form.department ?? ""}
            onChange={(e) => update("department", e.target.value)}
            placeholder="e.g., Engineering"
          />
        </Field>

        <Field label="Phone">
          <input
            className={inputClass}
            value={form.phone ?? ""}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+8801XXXXXXXXX"
          />
        </Field>

        <Field label="WhatsApp">
          <input
            className={inputClass}
            value={form.whatsapp ?? ""}
            onChange={(e) => update("whatsapp", e.target.value)}
            placeholder="+8801XXXXXXXXX"
          />
        </Field>

        <Field label="Public Email">
          <input
            className={inputClass}
            value={form.emailPublic ?? ""}
            onChange={(e) => update("emailPublic", e.target.value)}
            placeholder="name@company.com"
          />
        </Field>

        <Field label="LinkedIn">
          <input
            className={inputClass}
            value={form.linkedin ?? ""}
            onChange={(e) => update("linkedin", e.target.value)}
            placeholder="https://www.linkedin.com/in/username/"
          />
        </Field>

        <Field label="Website">
          <input
            className={inputClass}
            value={form.website ?? ""}
            onChange={(e) => update("website", e.target.value)}
            placeholder="ezzy.group"
          />
        </Field>

        <Field label="Address">
          <input
            className={inputClass}
            value={form.address ?? ""}
            onChange={(e) => update("address", e.target.value)}
            placeholder="Gulshan, Dhaka"
          />
        </Field>

        <Field label="Map URL">
          <input
            className={inputClass}
            value={form.mapUrl ?? ""}
            onChange={(e) => update("mapUrl", e.target.value)}
            placeholder="https://maps.google.com/..."
          />
        </Field>

        <Field label="User Photo">
          <UploadPicker
            id="profile-photo"
            label={form.photoUrl ? "Replace photo" : "Choose photo"}
            uploading={uploadingPhoto}
            onPick={async (file, clearInput) => {
              await onPickImage(file, "photo", clearInput);
            }}
          />
          {form.photoUrl && (
            <img
              src={form.photoUrl}
              alt="User photo"
              className="mt-3 h-20 w-20 rounded-2xl border border-white/15 object-cover"
            />
          )}
          <div className="mt-2 text-xs text-white/40">Max 400 KB | JPG/PNG/WEBP</div>
        </Field>

        <Field label="Company Logo">
          <UploadPicker
            id="company-logo"
            label={form.companyLogoUrl ? "Replace logo" : "Choose logo"}
            uploading={uploadingLogo}
            onPick={async (file, clearInput) => {
              await onPickImage(file, "logo", clearInput);
            }}
          />
          {form.companyLogoUrl && (
            <div className="mt-3 inline-flex rounded-2xl border border-white/15 bg-white p-3 shadow-sm">
              <img
                src={form.companyLogoUrl}
                alt="Company logo"
                className="h-12 w-auto rounded object-contain"
              />
            </div>
          )}
          <div className="mt-2 text-xs text-white/40">Max 200 KB | JPG/PNG/WEBP</div>
        </Field>
      </div>

      <div className="flex flex-wrap gap-6">
        <Toggle
          label="Active"
          checked={form.isActive}
          onChange={(v) => update("isActive", v)}
        />
        <Toggle
          label="Published"
          checked={form.isPublished}
          onChange={(v) => update("isPublished", v)}
        />
      </div>

      <div className="flex flex-wrap gap-3 pt-4">
        <button
          onClick={saveOrCreate}
          disabled={saving}
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold disabled:opacity-60 hover:bg-blue-700"
        >
          {saving
            ? props.mode === "create"
              ? "Creating..."
              : "Saving..."
            : props.mode === "create"
              ? "Create Profile"
              : "Save"}
        </button>

        <a
          href={publicUrl}
          target="_blank"
          className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold hover:bg-emerald-700"
          rel="noreferrer"
        >
          View Public Page
        </a>

        <Link
          href="/admin/profiles"
          className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-semibold"
        >
          Back
        </Link>

        {props.mode === "edit" && (
          <button
            onClick={deleteProfile}
            disabled={deleting}
            className="ml-auto rounded-xl bg-red-600 px-6 py-3 font-semibold disabled:opacity-60 hover:bg-red-700"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>
    </div>
  );
}

function UploadPicker({
  id,
  label,
  uploading,
  onPick,
}: {
  id: string;
  label: string;
  uploading: boolean;
  onPick: (file: File, clearInput: () => void) => Promise<void>;
}) {
  return (
    <div className="mt-2">
      <input
        id={id}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        disabled={uploading}
        onChange={async (e) => {
          const input = e.currentTarget;
          const file = input.files?.[0];
          if (!file) return;
          await onPick(file, () => {
            input.value = "";
          });
        }}
      />
      <label
        htmlFor={id}
        className={`inline-flex cursor-pointer items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition ${
          uploading
            ? "bg-white/10 opacity-60"
            : "bg-white/10 hover:border-blue-400/60 hover:bg-blue-500/20"
        }`}
      >
        {uploading ? "Uploading..." : label}
      </label>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-white/60">{label}</div>
      {hint && <div className="mt-1 text-xs text-white/40">{hint}</div>}
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-white">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`h-8 w-14 rounded-full transition ${
          checked ? "bg-emerald-500" : "bg-white/20"
        }`}
      >
        <div
          className={`h-6 w-6 rounded-full bg-white transition ${
            checked ? "translate-x-7" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

function emptyToNull(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function uploadImage(file: File, type: "photo" | "logo") {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`/api/admin/uploads?type=${type}`, {
    method: "POST",
    body: fd,
  });

  const data: UploadResponse = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Upload failed");
  if (!data.url) throw new Error("Upload succeeded but no URL was returned");
  return data.url;
}
