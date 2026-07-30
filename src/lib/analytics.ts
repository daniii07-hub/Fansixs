"use client";

import { sendGAEvent } from "@next/third-parties/google";

export function trackLeadFormSubmission() {
  sendGAEvent("event", "generate_lead", {
    form_name: "contact_demo_form",
  });
}