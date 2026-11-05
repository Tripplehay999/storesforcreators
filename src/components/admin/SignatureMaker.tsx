"use client";

import { useRef, useState } from "react";
import { toast } from "@/lib/ui";

type Props = {
  addresses: string[];
  defaultName: string;
  logoUrl: string;
  siteUrl: string;
};

const esc = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * A Gmail signature: logo on the left, name and contact details on the right. Tables and inline
 * styles only, because Gmail (and the apps the email is read in) drop anything else. The logo is
 * loaded from the live site, so it shows for everyone who gets the email.
 */
function signatureHtml({ name, title, address, logoUrl, siteUrl }: { name: string; title: string; address: string; logoUrl: string; siteUrl: string }) {
  const site = siteUrl.replace(/^https?:\/\/(www\.)?/, "");
  const role = title.trim() ? `${esc(title.trim())} · Stores for Creators` : "Stores for Creators";

  return `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;color:#1c1722;">
<tr>
<td style="padding:0 12px 0 0;vertical-align:middle;"><a href="${esc(siteUrl)}"><img src="${esc(logoUrl)}" width="52" height="52" alt="Stores for Creators" style="display:block;width:52px;height:52px;border:0;border-radius:12px;"></a></td>
<td style="padding:2px 0 2px 12px;vertical-align:middle;border-left:3px solid #d4f57a;font-size:13px;line-height:1.5;">
${name.trim() ? `<strong style="font-size:14px;color:#1c1722;">${esc(name.trim())}</strong><br>` : ""}<span style="color:#7a7180;">${role}</span><br>
<a href="mailto:${esc(address)}" style="color:#1c1722;text-decoration:none;">${esc(address)}</a> &nbsp;·&nbsp; <a href="${esc(siteUrl)}" style="color:#1c1722;">${esc(site)}</a>
</td>
</tr>
</table>`;
}

function signatureText({ name, title, address, siteUrl }: { name: string; title: string; address: string; siteUrl: string }) {
  return [name.trim(), title.trim() ? `${title.trim()} · Stores for Creators` : "Stores for Creators", address, siteUrl]
    .filter(Boolean)
    .join("\n");
}

export default function SignatureMaker({ addresses, defaultName, logoUrl, siteUrl }: Props) {
  const [name, setName] = useState(defaultName);
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState(addresses[0] ?? "");
  const preview = useRef<HTMLDivElement>(null);

  const html = signatureHtml({ name, title, address, logoUrl, siteUrl });

  async function copy() {
    // Copy it as formatted text (with the picture), so it pastes into Gmail looking like the preview.
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([signatureText({ name, title, address, siteUrl })], { type: "text/plain" })
        })
      ]);
      toast("Signature copied. Paste it into Gmail's signature box.");
      return;
    } catch {
      // Older browsers: select the preview itself and copy that.
    }

    const node = preview.current;
    const selection = window.getSelection();
    if (!node || !selection) return toast("Couldn't copy. Select the signature with your mouse and press Ctrl+C.");
    const range = document.createRange();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
    const copied = document.execCommand("copy");
    selection.removeAllRanges();
    toast(copied ? "Signature copied. Paste it into Gmail's signature box." : "Couldn't copy. Select the signature with your mouse and press Ctrl+C.");
  }

  return (
    <div className="adm-signature">
      <div className="adm-form">
        <label>
          Your name
          <input className="adm-input" value={name} onChange={event => setName(event.target.value)} placeholder="Your name" maxLength={60} />
        </label>
        <label>
          Your role (optional)
          <input className="adm-input" value={title} onChange={event => setTitle(event.target.value)} placeholder="Founder" maxLength={60} />
        </label>
        <label className="full">
          Email address
          <select className="adm-select" value={address} onChange={event => setAddress(event.target.value)}>
            {addresses.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>

      <div className="adm-signature-paper" aria-label="Signature preview">
        <div ref={preview} dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      <button className="adm-btn adm-btn-primary" type="button" onClick={copy}>Copy signature</button>
    </div>
  );
}
