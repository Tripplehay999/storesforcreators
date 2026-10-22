"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { submitApplication, type ApplicationState } from "@/app/actions";
import { BRAND_NAME } from "@/lib/format";
import { showInfo, toast } from "@/lib/ui";

type Info = { title: string; label: string; body: string };

const initialApplication: ApplicationState = {
  status: "idle",
  message: ""
};

function observeReveals() {
  const elements = [...document.querySelectorAll(".reveal:not(.visible)")];

  if (!("IntersectionObserver" in window)) {
    elements.forEach(element => element.classList.add("visible"));
    return () => {};
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  elements.forEach(element => observer.observe(element));
  return () => observer.disconnect();
}

/**
 * Site-wide dialogs, toast, and the delegated click handlers that the
 * original script.js used ([data-apply], [data-buy], [data-policy], …),
 * so server-rendered markup can keep using plain data attributes.
 */
export default function UIRoot({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const applyRef = useRef<HTMLDialogElement>(null);
  const infoRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [info, setInfo] = useState<Info>({ title: "Information", label: "INFORMATION", body: "" });
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [application, submit, sending] = useActionState(submitApplication, initialApplication);

  useEffect(() => {
    let frame = 0;
    let disconnect = () => {};

    frame = requestAnimationFrame(() => {
      disconnect = observeReveals();
    });

    return () => {
      cancelAnimationFrame(frame);
      disconnect();
    };
  }, [pathname]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const onToast = (event: Event) => {
      setToastMessage((event as CustomEvent<string>).detail);
      setToastVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => setToastVisible(false), 3200);
    };

    const onInfo = (event: Event) => {
      setInfo((event as CustomEvent<Info>).detail);
      infoRef.current?.showModal();
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      const close = target.closest("[data-close]");

      if (close) {
        close.closest("dialog")?.close();
        return;
      }

      if (target instanceof HTMLDialogElement) {
        target.close();
        return;
      }

      if (target.closest("[data-apply]")) {
        applyRef.current?.showModal();
        return;
      }

      if (target.closest("[data-buy]")) {
        showInfo(
          "Product preview",
          "CHECKOUT NOT CONNECTED",
          "This is a customizable storefront preview. Live payments, booking, and digital product delivery are not yet connected."
        );
        return;
      }

      if (target.closest("[data-policy]")) {
        showInfo(
          "Privacy & terms",
          "FINAL POLICIES REQUIRED",
          "The final privacy policy, terms of service, refund policy, and applicable disclosures must be completed before accepting live transactions."
        );
      }
    };

    const onImageError = (event: Event) => {
      const image = event.target;

      if (!(image instanceof HTMLImageElement) || image.dataset.fallbackApplied) return;

      image.dataset.fallbackApplied = "true";

      if (image.src.includes("/templates/")) {
        image.style.objectFit = "contain";
        image.style.background = "#f0e3ed";
        image.alt = "Budget planner image unavailable. Check the public/templates folder.";
      }
    };

    window.addEventListener("btg:toast", onToast);
    window.addEventListener("btg:info", onInfo);
    document.addEventListener("click", onClick);
    document.addEventListener("error", onImageError, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("btg:toast", onToast);
      window.removeEventListener("btg:info", onInfo);
      document.removeEventListener("click", onClick);
      document.removeEventListener("error", onImageError, true);
    };
  }, []);

  useEffect(() => {
    if (application.status === "sent") {
      formRef.current?.reset();
      toast("Application sent. Thank you!");
    }
  }, [application]);

  async function copyApplication() {
    const form = formRef.current;

    if (!form) return;

    const labels: Record<string, string> = {
      name: "Name",
      email: "Email",
      social: "Social profile",
      followers: "Followers",
      niche: "Niche",
      message: "Message"
    };

    const text =
      `${BRAND_NAME} — Creator Application\n\n` +
      [...new FormData(form).entries()]
        .map(([key, value]) => `${labels[key] ?? key}: ${value}`)
        .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      toast("Application copied. It has not been submitted.");
    } catch {
      const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
      const link = document.createElement("a");

      link.href = url;
      link.download = "btg-creator-application.txt";
      link.click();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast("Application saved as a text file.");
    }
  }

  return (
    <>
      <dialog id="apply-dialog" className="modal" ref={applyRef}>
        <button className="modal-close" data-close aria-label="Close">×</button>

        <div className="modal-heading">
          <span className="eyebrow">BECOME A BTG CREATOR</span>
          <h2>Let&apos;s build<br /><em>your next thing.</em></h2>
          <p>Tell us a little about yourself and your audience.</p>
        </div>

        <form id="apply-form" ref={formRef} action={submit}>
          <label>
            Your name
            <input name="name" required placeholder="Your full name" />
          </label>

          <label>
            Email address
            <input name="email" type="email" required placeholder="you@example.com" />
          </label>

          {!signedIn && (
            <label>
              Create a password
              <input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
              />
              <small className="form-status">You&apos;ll use this to log in to your creator hub.</small>
            </label>
          )}

          <label>
            TikTok or Instagram profile
            <input name="social" required placeholder="@yourhandle" />
          </label>

          <label>
            Approximate followers
            <select name="followers" required defaultValue="">
              <option value="">Choose a range</option>
              <option>Under 10,000</option>
              <option>10,000–25,000</option>
              <option>25,000–50,000</option>
              <option>50,000–100,000</option>
              <option>100,000–250,000</option>
              <option>250,000+</option>
            </select>
          </label>

          <label>
            Your content niche
            <input name="niche" placeholder="Finance, beauty, fitness, lifestyle..." />
          </label>

          <label>
            Anything else we should know?
            <textarea name="message" rows={3} placeholder="Tell us about your audience and ideas" />
          </label>

          <button className="btn btn-dark" type="submit" disabled={sending}>
            {sending ? "Sending…" : signedIn ? "Send my application ↗" : "Create my account & apply ↗"}
          </button>

          <p id="apply-status" className={`form-status${application.status === "error" ? " form-error" : ""}`}>
            {application.message || (signedIn
              ? "We'll review your details and reply by email."
              : <>Already have an account? <a href="/login">Log in ↗</a></>)}
          </p>

          {application.status === "error" && (
            <button type="button" className="btn btn-soft" onClick={copyApplication}>
              Copy application details
            </button>
          )}
        </form>
      </dialog>

      <dialog id="info-dialog" className="modal info-modal" ref={infoRef}>
        <button className="modal-close" data-close aria-label="Close">×</button>
        <span className="eyebrow">{info.label}</span>
        <h2>{info.title}</h2>
        <p>{info.body}</p>
        <button className="btn btn-dark" data-close>Got it</button>
      </dialog>

      <div className={`toast${toastVisible ? " show" : ""}`} role="status" aria-live="polite">
        {toastMessage}
      </div>
    </>
  );
}
