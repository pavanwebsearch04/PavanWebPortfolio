"use client";

import { useId, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { contact } from "@/data/contact";
import { services } from "@/data/services";

type SubmitState = "idle" | "submitting" | "sent" | "not_configured" | "error";
type FieldId = "name" | "email" | "phone" | "projectType" | "message";

interface FormValues {
  name: string;
  email: string;
  phone: string;
  projectType: string;
  budget: string;
  message: string;
  /** honeypot — real visitors never see this field */
  website: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// digits with an optional leading +, spaces, dashes, dots or brackets; 7 to 15 digits
const PHONE_RE = /^\+?[\d\s().-]{7,20}$/;
const phoneDigits = (v: string) => v.replace(/\D/g, "").length;

// The nine services, then "Something else". The API route builds the same
// list from data/services.ts, so the two can never drift apart.
const PROJECT_TYPES = [...services.map((s) => s.title), "Something else"];

type SendResult = "sent" | "not_configured" | "error";

// The server route only answers { ok: true } once the email service has
// accepted the message, so "sent" is never claimed on a guess.
async function sendMessage(values: FormValues): Promise<SendResult> {
  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (res.ok) return "sent";
    if (res.status === 503) return "not_configured";
    return "error";
  } catch {
    return "error";
  }
}

function mailtoHref(values: FormValues) {
  const subject = `Website enquiry${values.projectType ? `: ${values.projectType}` : ""}`;
  const body = [
    `Hi Pavan,`,
    ``,
    values.message,
    ``,
    `Project type: ${values.projectType || "—"}`,
    `Phone: ${values.phone || "—"}`,
    `Budget: ${values.budget || "—"}`,
    ``,
    `${values.name}`,
    `${values.email}`,
  ].join("\n");
  return `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function FieldMarker({ active }: { active: boolean }) {
  return (
    <motion.span
      animate={{ backgroundColor: active ? "#D4483B" : "rgba(237,234,227,0.3)", scale: active ? 1.2 : 1 }}
      transition={{ duration: 0.25 }}
      className="h-1.5 w-1.5 rounded-full"
      aria-hidden
    />
  );
}

export default function ContactForm({ onFormActive }: { onFormActive: (active: boolean) => void }) {
  const [values, setValues] = useState<FormValues>({
    name: "",
    email: "",
    phone: "",
    projectType: "",
    budget: "",
    message: "",
    website: "",
  });
  const [errors, setErrors] = useState<Partial<Record<FieldId, string>>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const nameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const typeId = useId();
  const budgetId = useId();
  const messageId = useId();

  const handleFocus = (field: string) => {
    setFocusedField(field);
    onFormActive(true);
  };
  const handleBlur = () => {
    setFocusedField(null);
    onFormActive(false);
  };

  const validate = (): boolean => {
    const next: Partial<Record<FieldId, string>> = {};
    if (!values.name.trim()) next.name = "Please enter your full name.";
    if (!values.email.trim()) next.email = "Please enter your email address.";
    else if (!EMAIL_RE.test(values.email.trim())) next.email = "Please enter a valid email address.";
    if (!values.phone.trim()) next.phone = "Please enter your mobile number.";
    else if (!PHONE_RE.test(values.phone.trim()) || phoneDigits(values.phone) < 7 || phoneDigits(values.phone) > 15)
      next.phone = "Please enter a valid mobile number (7 to 15 digits, e.g. +918003811135).";
    if (!values.projectType) next.projectType = "Please choose the closest project type.";
    if (values.message.trim().length < 10) next.message = "Please share a few details (at least 10 characters).";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      const first = (["name", "email", "phone", "projectType", "message"] as FieldId[]).find((f) => next[f]);
      const ids: Record<FieldId, string> = { name: nameId, email: emailId, phone: phoneId, projectType: typeId, message: messageId };
      if (first) document.getElementById(ids[first])?.focus();
    }
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitState === "submitting" || !validate()) return;
    setSubmitState("submitting");
    onFormActive(true);
    const result = await sendMessage(values);
    setSubmitState(result);
    onFormActive(false);
    if (result === "sent") {
      setValues({ name: "", email: "", phone: "", projectType: "", budget: "", message: "", website: "" });
    }
  };

  const set = (field: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (submitState !== "idle" && submitState !== "submitting") setSubmitState("idle");
  };

  const fieldClass = (field: string, hasError: boolean) =>
    `w-full border-b bg-paper/[0.05] px-3 py-3 text-[1.0625rem] text-paper outline-none transition-colors placeholder:text-paper-dim ${
      hasError
        ? "border-crimson-bright"
        : focusedField === field
          ? "border-crimson-bright/60"
          : "border-paper/45"
    }`;

  const labelClass = "flex items-center gap-2 font-mono text-nav text-paper-body";
  const errorText = (id: string, msg?: string) =>
    msg ? (
      <p id={`${id}-error`} className="text-support text-crimson-text">
        {msg}
      </p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7" aria-describedby={`${messageId}-status`}>
      <div className="flex flex-col gap-2">
        <label htmlFor={nameId} className={labelClass}>
          <FieldMarker active={focusedField === "name"} />
          FULL NAME
        </label>
        <input
          id={nameId}
          type="text"
          name="name"
          autoComplete="name"
          value={values.name}
          onChange={set("name")}
          onFocus={() => handleFocus("name")}
          onBlur={handleBlur}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${nameId}-error` : undefined}
          placeholder="Your full name"
          className={fieldClass("name", Boolean(errors.name))}
        />
        {errorText(nameId, errors.name)}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={emailId} className={labelClass}>
          <FieldMarker active={focusedField === "email"} />
          EMAIL ADDRESS
        </label>
        <input
          id={emailId}
          type="email"
          name="email"
          autoComplete="email"
          value={values.email}
          onChange={set("email")}
          onFocus={() => handleFocus("email")}
          onBlur={handleBlur}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${emailId}-error` : undefined}
          placeholder="you@example.com"
          className={fieldClass("email", Boolean(errors.email))}
        />
        {errorText(emailId, errors.email)}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={phoneId} className={labelClass}>
          <FieldMarker active={focusedField === "phone"} />
          MOBILE NUMBER
        </label>
        <input
          id={phoneId}
          type="tel"
          name="phone"
          inputMode="tel"
          autoComplete="tel"
          value={values.phone}
          onChange={set("phone")}
          onFocus={() => handleFocus("phone")}
          onBlur={handleBlur}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? `${phoneId}-error` : undefined}
          placeholder="+918003811135"
          className={fieldClass("phone", Boolean(errors.phone))}
        />
        {errorText(phoneId, errors.phone)}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={typeId} className={labelClass}>
          <FieldMarker active={focusedField === "projectType"} />
          PROJECT TYPE
        </label>
        <select
          id={typeId}
          name="projectType"
          value={values.projectType}
          onChange={set("projectType")}
          onFocus={() => handleFocus("projectType")}
          onBlur={handleBlur}
          aria-invalid={Boolean(errors.projectType)}
          aria-describedby={errors.projectType ? `${typeId}-error` : undefined}
          className={`${fieldClass("projectType", Boolean(errors.projectType))} ${values.projectType ? "" : "text-paper-dim"}`}
        >
          <option value="" className="bg-ink-graphite text-paper-dim">
            Select a project type
          </option>
          {PROJECT_TYPES.map((t) => (
            <option key={t} value={t} className="bg-ink-graphite text-paper">
              {t}
            </option>
          ))}
        </select>
        {errorText(typeId, errors.projectType)}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={budgetId} className={labelClass}>
          <FieldMarker active={focusedField === "budget"} />
          BUDGET RANGE <span className="text-paper-dim">(OPTIONAL)</span>
        </label>
        <input
          id={budgetId}
          type="text"
          name="budget"
          value={values.budget}
          onChange={set("budget")}
          onFocus={() => handleFocus("budget")}
          onBlur={handleBlur}
          placeholder="e.g. ₹30,000–50,000, or “not sure yet”"
          className={fieldClass("budget", false)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={messageId} className={labelClass}>
          <FieldMarker active={focusedField === "message"} />
          PROJECT DETAILS
        </label>
        <textarea
          id={messageId}
          name="message"
          rows={5}
          value={values.message}
          onChange={set("message")}
          onFocus={() => handleFocus("message")}
          onBlur={handleBlur}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? `${messageId}-error` : undefined}
          placeholder="What are you looking to build? Include any pages, features or deadlines."
          className={`${fieldClass("message", Boolean(errors.message))} resize-none`}
        />
        {errorText(messageId, errors.message)}
      </div>

      {/* honeypot: hidden from people and assistive tech, bots tend to fill it */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set("website")} />
        </label>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <motion.button
          type="submit"
          disabled={submitState === "submitting"}
          whileHover={submitState === "idle" ? { x: 3 } : undefined}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="flex w-fit items-center gap-2.5 border border-paper/45 bg-paper/[0.06] px-7 py-3.5 font-mono text-support font-medium tracking-wide text-paper transition-colors hover:border-crimson-bright/70 hover:bg-paper/[0.1] disabled:opacity-60"
        >
          <AnimatePresence mode="wait" initial={false}>
            {submitState === "sent" ? (
              <motion.span
                key="sent"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-2"
              >
                <Check size={14} className="text-crimson-text" />
                MESSAGE SENT
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-2"
              >
                {submitState === "submitting" ? "SENDING…" : "SEND MESSAGE"}
                <ArrowRight size={14} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <div id={`${messageId}-status`} role="status" aria-live="polite">
          <AnimatePresence>
            {submitState === "sent" && (
              <motion.p
                key="sent"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-sm text-support text-paper-body"
              >
                Thanks &mdash; your message was delivered. I&rsquo;ll reply to the email address you provided.
              </motion.p>
            )}
            {(submitState === "not_configured" || submitState === "error") && (
              <motion.div
                key="fallback"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="flex max-w-md flex-col gap-3 overflow-hidden"
              >
                <p className="text-support text-paper-body">
                  {submitState === "not_configured"
                    ? "This form isn’t connected to an email service yet, so nothing was sent."
                    : "Something went wrong and your message wasn’t sent."}{" "}
                  You can email me directly instead &mdash; your details are ready to go in the message.
                </p>
                <a
                  href={mailtoHref(values)}
                  className="w-fit border border-crimson-bright/60 bg-crimson/20 px-5 py-3 font-mono text-support font-medium tracking-wide text-paper transition-colors hover:bg-crimson/35"
                >
                  EMAIL {contact.email.toUpperCase()}
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </form>
  );
}
