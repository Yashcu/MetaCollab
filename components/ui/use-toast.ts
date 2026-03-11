"use client";

import type React from "react";
import { toast as sonnerToast } from "sonner";

export const toast = (props: {
  title?: string;
  description?: React.ReactNode;
  variant?: "default" | "destructive" | null;
  duration?: number;
}) => {
  if (props.variant === "destructive") {
    return sonnerToast.error(props.title || "Error", {
      description: props.description,
      duration: props.duration,
    });
  }

  return sonnerToast(props.title || "Notification", {
    description: props.description,
    duration: props.duration,
  });
};