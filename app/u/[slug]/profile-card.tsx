"use client";

import React from "react";
import {
  Mail,
  Globe,
  Phone,
  MessageCircle,
  MapPin,
  Linkedin,
  ArrowUpRight,
} from "lucide-react";

type Profile = {
  fullName: string;
  title: string | null;
  company: string | null;
  phone: string | null;
  whatsapp: string | null;
  emailPublic: string | null;
  website: string | null;
  linkedin: string | null;
  address: string | null;
  mapUrl: string | null;
  photoUrl: string | null;
  companyLogoUrl: string | null;
};

type Row = {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  mono?: boolean;
};

export default function ProfileCard({
  slug,
  profile,
}: {
  slug: string;
  profile: Profile;
}) {
  const name = profile.fullName;
  const title = profile.title || "";
  const company = profile.company || "";

  const phone = profile.phone || "";
  const whatsapp = profile.whatsapp || "";
  const email = profile.emailPublic || "";
  const website = profile.website || "";
  const linkedin = profile.linkedin || "";
  const address = profile.address || "";
  const mapUrl = profile.mapUrl || "";
  const photoUrl = profile.photoUrl || "";
  const companyLogoUrl = profile.companyLogoUrl || "";

  const telLink = phone ? `tel:${phone}` : "";
  const waLink = whatsapp ? `https://wa.me/${digitsOnly(whatsapp)}` : "";
  const mailLink = email ? `mailto:${email}` : "";
  const webLink = website ? normalizeUrl(website) : "";
  const liLink = linkedin ? normalizeUrl(linkedin) : "";
  const mapLink = mapUrl ? normalizeUrl(mapUrl) : "";

  const publicPath = `/u/${slug}`;
  const fullPublicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${publicPath}`
      : publicPath;

  const rows: Row[] = [
    {
      icon: <Mail size={18} strokeWidth={2} />,
      label: "Email",
      value: email,
      href: mailLink,
      mono: true,
    },
    {
      icon: <Globe size={18} strokeWidth={2} />,
      label: "Website",
      value: website,
      href: webLink,
      mono: true,
    },
    {
      icon: <Phone size={18} strokeWidth={2} />,
      label: "Phone",
      value: phone,
      href: telLink,
      mono: true,
    },
    {
      icon: <MessageCircle size={18} strokeWidth={2} />,
      label: "WhatsApp",
      value: whatsapp ? "Message me" : "",
      href: waLink,
    },
    {
      icon: <MapPin size={18} strokeWidth={2} />,
      label: "Address",
      value: address || (mapLink ? "Open map" : ""),
      href: mapLink || undefined,
    },
    {
      icon: <Linkedin size={18} strokeWidth={2} />,
      label: "LinkedIn",
      value: linkedin,
      href: liLink,
      mono: true,
    },
  ].filter((r) => r.value && r.value.trim() !== "");

  async function share() {
    const url = fullPublicUrl;

    const nav = navigator as Navigator & {
      share?: (data: { title?: string; url?: string; text?: string }) => Promise<void>;
    };

    if (nav.share) {
      try {
        await nav.share({ title: name, url });
        return;
      } catch {
        // ignore and fallback to copy
      }
    }

    await navigator.clipboard.writeText(url);
    toast("Link copied");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(fullPublicUrl);
    toast("Link copied");
  }

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#050A14]" />
      <div className="absolute -top-44 -left-44 h-[560px] w-[560px] rounded-full bg-blue-500/18 blur-3xl" />
      <div className="absolute -bottom-52 -right-52 h-[620px] w-[620px] rounded-full bg-cyan-400/14 blur-3xl" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/6 via-transparent to-black/40" />
      <div className="absolute inset-0 [background:radial-gradient(900px_600px_at_50%_0%,rgba(255,255,255,0.08),transparent_60%)]" />

      <div className="relative min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[460px]">
          {/* Glass Card */}
          <div className="rounded-[28px] border border-white/12 bg-white/6 shadow-[0_25px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl overflow-hidden">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Photo */}
                <div className="h-[82px] w-[82px] rounded-[22px] overflow-hidden bg-white/8 border border-white/12 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_28px_rgba(0,0,0,0.28)] shrink-0 sm:h-[92px] sm:w-[92px]">
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoUrl}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-semibold sm:text-4xl">
                      {name?.slice(0, 1)?.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Name + meta */}
                <div className="min-w-0 flex-1 pt-1 sm:pt-2">
                  <div className="text-[24px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[28px] truncate">
                    {name}
                  </div>

                  {(title || company) && (
                    <div className="mt-2 text-white/70 text-[13px] leading-snug sm:text-[14px]">
                      <div className="truncate">{title}</div>
                      <div className="truncate">{company}</div>
                    </div>
                  )}
                </div>

                {/* Company Logo (new) */}
                {companyLogoUrl ? (
                  <div className="shrink-0 pt-1 sm:pt-2">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/20 bg-white p-2 shadow-[0_10px_30px_rgba(0,0,0,0.18)] sm:h-16 sm:w-16">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={companyLogoUrl}
                        alt="Company logo"
                        className="max-h-full max-w-full rounded object-contain"
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Top buttons */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <a
                  href={`/api/u/${slug}/vcard`}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 transition px-4 py-3 font-semibold text-center shadow-lg shadow-blue-600/20 active:scale-[0.99]"
                >
                  Save Contact
                </a>

                <button
                  onClick={share}
                  className="rounded-xl bg-white/10 hover:bg-white/14 transition px-4 py-3 font-semibold text-center border border-white/12 active:scale-[0.99]"
                >
                  Share
                </button>
              </div>

              {/* Rows */}
              <div className="mt-5 space-y-3">
                {rows.map((r, idx) => (
                  <InfoRow
                    key={idx}
                    icon={r.icon}
                    label={r.label}
                    value={r.value}
                    href={r.href}
                    mono={r.mono}
                  />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between text-xs text-white/55">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400/80 shadow-[0_0_18px_rgba(52,211,153,0.45)]" />
                Tap NFC to open
              </div>

              <button
                className="underline underline-offset-4 hover:text-white/75"
                onClick={copyLink}
              >
                Copy Link
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-col items-center gap-3 text-center">
            <a
              href="https://1card.fyi"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center transition hover:opacity-80"
              aria-label="Visit 1card.fyi"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/1card-fyi-logo-white.svg"
                alt="1card.fyi"
                className="h-8 w-auto opacity-50"
              />
            </a>
            <div className="text-xs text-white/30">
              Powered by{" "}
              <a
                href="https://3jtec.com"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 transition hover:text-white/50"
              >
                3J Technologies
              </a>
            </div>
          </div>
        </div>
      </div>

      <Toast />
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  href,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  mono?: boolean;
}) {
  const inner = (
    <div className="rounded-2xl border border-white/12 bg-white/5 hover:bg-white/9 transition px-4 py-3 flex items-center justify-between gap-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div className="flex items-center gap-3 min-w-0">
        {/* Icon tile */}
        <div className="h-10 w-10 rounded-xl bg-white/6 border border-white/12 flex items-center justify-center text-white/85">
          {icon}
        </div>

        <div className="min-w-0">
          <div className="text-[11px] tracking-wide text-white/60">
            {label.toUpperCase()}
          </div>
          <div
            className={`font-semibold text-white/92 truncate ${
              mono ? "font-mono text-[13px]" : "text-[14px]"
            }`}
          >
            {value}
          </div>
        </div>
      </div>

      <div className="h-9 w-9 rounded-xl bg-white/6 border border-white/12 flex items-center justify-center text-white/70">
        <ArrowUpRight size={18} strokeWidth={2} />
      </div>
    </div>
  );

  if (!href) return inner;

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
      className="block"
    >
      {inner}
    </a>
  );
}

/* ---------- Minimal toast ---------- */

let toastTimer: ReturnType<typeof setTimeout> | undefined;

function toast(msg: string) {
  const el = document.getElementById("toast");
  if (!el) return;

  el.textContent = msg;
  el.style.opacity = "1";
  el.style.transform = "translate(-50%, 0px)";

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translate(-50%, 6px)";
  }, 1400);
}

function Toast() {
  return (
    <div
      id="toast"
      style={{
        position: "fixed",
        left: "50%",
        bottom: 24,
        transform: "translate(-50%, 6px)",
        background: "rgba(20, 25, 35, 0.85)",
        border: "1px solid rgba(255,255,255,0.12)",
        padding: "10px 14px",
        borderRadius: 999,
        fontSize: 12,
        color: "rgba(255,255,255,0.9)",
        opacity: 0,
        transition: "all 200ms ease",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        pointerEvents: "none",
        zIndex: 50,
      }}
    />
  );
}

/* ---------- Helpers ---------- */

function digitsOnly(s: string) {
  return s.replace(/\D/g, "");
}

function normalizeUrl(url: string) {
  const u = url.trim();
  if (!u) return u;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return "https://" + u;
}
