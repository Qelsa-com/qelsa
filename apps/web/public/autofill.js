/* Qelsa external-application autofill.
 * Loaded by the one-time bookmarklet created in Qelsa. It fills recognizable
 * text fields and selections, never submits a form, and never uploads files.
 */
(() => {
  const token = window.__qelsaAutofillToken;
  const api = window.__qelsaAutofillApi;
  if (!token || !api) {
    showBanner("Qelsa autofill token is missing. Create a fresh link in Qelsa.", true);
    return;
  }

  const bannerId = "qelsa-autofill-banner";
  document.getElementById(bannerId)?.remove();
  const banner = showBanner("Qelsa is filling this application…");

  fetch(`${api}/api/agent/autofill?token=${encodeURIComponent(token)}`, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("This autofill link is expired or already used.");
      return response.json();
    })
    .then(async (packet) => {
      const report = fill(packet);
      const resumeAttached = await attachResume(packet);
      report.resumeAttached = resumeAttached;
      const resumeMessage = resumeAttached
        ? " Your resume was attached."
        : packet.resume_url
          ? " Your browser blocked the resume attachment — upload it from the link in Qelsa."
          : " Upload your resume before submitting.";
      banner.innerHTML = `<strong>Qelsa autofill complete.</strong> ${report.filled} field${report.filled === 1 ? "" : "s"} filled.${resumeMessage} Review everything and submit when ready.`;
      banner.style.borderColor = "rgba(34,197,94,.45)";
      window.__qelsaAutofillReport = report;
      setTimeout(() => banner.remove(), 14000);
    })
    .catch((error) => {
      banner.innerHTML = `<strong>Qelsa autofill couldn't run.</strong> ${escapeHtml(error.message || "Try a fresh link from Qelsa.")}`;
      banner.style.borderColor = "rgba(244,63,94,.5)";
    });

  function showBanner(message, error = false) {
    let el = document.getElementById(bannerId);
    if (!el) {
      el = document.createElement("div");
      el.id = bannerId;
      Object.assign(el.style, {
        position: "fixed",
        right: "18px",
        bottom: "18px",
        zIndex: "2147483647",
        maxWidth: "360px",
        padding: "12px 14px",
        borderRadius: "12px",
        background: "#111827",
        color: "#f8fafc",
        border: "1px solid rgba(56,189,248,.4)",
        boxShadow: "0 12px 40px rgba(0,0,0,.28)",
        font: "13px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      });
      document.documentElement.appendChild(el);
    }
    el.innerHTML = message;
    if (error) el.style.borderColor = "rgba(244,63,94,.5)";
    return el;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[char]));
  }

  function labelFor(el) {
    const parts = [
      el.getAttribute("autocomplete"),
      el.getAttribute("aria-label"),
      el.getAttribute("placeholder"),
      el.getAttribute("name"),
      el.id,
    ];
    if (el.labels) for (const label of el.labels) parts.push(label.innerText);
    const parent = el.closest("label, .field, .form-group, [class*='field'], [class*='input']");
    if (parent) parts.push(parent.innerText?.slice(0, 160));
    return parts.filter(Boolean).join(" ").toLowerCase().replace(/\s+/g, " ");
  }

  function visible(el) {
    if (el.disabled || el.readOnly || el.type === "hidden" || el.type === "password") return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function setValue(el, value) {
    if (value == null || value === "" || !visible(el)) return false;
    if (el.tagName === "SELECT") {
      const normalized = String(value).toLowerCase();
      const option = [...el.options].find(
        (opt) => opt.value.toLowerCase() === normalized || opt.text.toLowerCase().includes(normalized),
      );
      if (!option) return false;
      el.value = option.value;
    } else {
      if (el.value && String(el.value).trim()) return false;
      const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      if (setter) setter.call(el, value);
      else el.value = value;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.style.outline = "2px solid rgba(56,189,248,.65)";
    setTimeout(() => {
      el.style.outline = "";
    }, 2500);
    return true;
  }

  async function attachResume(packet) {
    if (!packet.resume_url) return false;
    // Many ATS file inputs are visually hidden behind a styled upload button.
    const fileInputs = [...document.querySelectorAll("input[type=file]")].filter((input) => !input.disabled);
    if (!fileInputs.length) return false;
    const target =
      fileInputs.find((input) => /resume|cv|attach/i.test(labelFor(input))) ?? fileInputs[0];
    try {
      const response = await fetch(packet.resume_url, { cache: "no-store" });
      if (!response.ok) return false;
      const blob = await response.blob();
      const filename = packet.resume_title || "Qelsa-resume.pdf";
      const file = new File([blob], filename, { type: blob.type || "application/pdf" });
      const transfer = new DataTransfer();
      transfer.items.add(file);
      target.files = transfer.files;
      target.dispatchEvent(new Event("change", { bubbles: true }));
      target.style.outline = "2px solid rgba(56,189,248,.65)";
      setTimeout(() => {
        target.style.outline = "";
      }, 2500);
      return true;
    } catch {
      return false;
    }
  }

  function fill(packet) {
    const fields = [...document.querySelectorAll("input, textarea, select")];
    const used = new Set();
    let filled = 0;
    const fillOne = (value, patterns, options = {}) => {
      if (!value) return false;
      for (const el of fields) {
        if (used.has(el)) continue;
        const label = labelFor(el);
        if (!patterns.some((pattern) => pattern.test(label))) continue;
        if (options.nameField && /company|employer|school|college|university|user ?name|username|job title|role title|reference/.test(label)) continue;
        if (el.tagName === "TEXTAREA" && el.value?.trim() && !options.allowAppend) continue;
        if (setValue(el, value)) {
          used.add(el);
          filled += 1;
          return true;
        }
      }
      return false;
    };

    fillOne(packet.email, [/\be-?mail\b/, /email address/]);
    fillOne(packet.phone, [/\bphone\b/, /mobile/, /\btel\b/, /telephone/]);
    fillOne(packet.first_name, [/first name/, /given name/, /\bfname\b/]);
    fillOne(packet.last_name, [/last name/, /family name/, /surname/, /\blname\b/]);
    fillOne(packet.name, [/full name/, /your name/, /legal name/, /^name$/, /\bname\b/], { allowAppend: false, nameField: true });
    fillOne(packet.location, [/\bcity\b/, /location/, /where are you based/, /current location/]);
    fillOne(packet.linkedin_url, [/linkedin/]);
    fillOne(packet.github_url, [/github/]);
    fillOne(packet.website, [/portfolio/, /personal website/, /\bwebsite\b/]);
    fillOne(packet.headline, [/current title/, /job title/, /current role/, /headline/]);
    fillOne(packet.experiences?.[0]?.company, [/current company/, /employer/, /company name/]);
    fillOne(packet.cover_letter, [/cover letter/, /why (do )?you want/, /why this role/, /message to (the )?hiring/], { allowAppend: true });
    fillOne(packet.summary, [/summary/, /about you/, /professional summary/]);

    return {
      filled,
      hasResume: Boolean(packet.resume_url),
      resumeUrl: packet.resume_url || null,
      totalFields: fields.length,
    };
  }
})();
