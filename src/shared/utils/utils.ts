import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  format,
  startOfWeek,
  isSameDay as dfnsIsSameDay,
  isSameWeek as dfnsIsSameWeek,
} from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Check if a date is today
 */
const isToday = (date: Date): boolean => {
  const today = new Date();
  return dfnsIsSameDay(date, today);
};

/**
 * Check if a date is yesterday
 */
const isYesterday = (date: Date): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dfnsIsSameDay(date, yesterday);
};

/**
 * Check if two dates are in the same week (Sunday to Saturday)
 */
const isSameWeek = (date1: Date, date2: Date): boolean => {
  return dfnsIsSameWeek(date1, date2, { weekStartsOn: 0 });
};

/**
 * Check if a date is within this year
 */
const isThisYear = (date: Date): boolean => {
  const today = new Date();
  return date.getFullYear() === today.getFullYear();
};

/**
 * Format date for chat message separators
 * Returns dynamic labels like "Today", "Yesterday", "Monday", "January 15", etc.
 * @param date - Date object or ISO string
 * @returns Formatted date string for display
 */
export const formatMessageDate = (date: Date | string): string => {
  const messageDate = typeof date === "string" ? new Date(date) : date;
  const today = new Date();

  if (isNaN(messageDate.getTime())) return "Unknown date";
  if (isToday(messageDate)) return "Today";
  if (isYesterday(messageDate)) return "Yesterday";
  if (isSameWeek(messageDate, today)) return format(messageDate, "EEEE"); // Monday, etc.
  if (isThisYear(messageDate)) return format(messageDate, "MMMM d"); // July 11
  return format(messageDate, "MMMM d, yyyy"); // July 11, 2023
};

/**
 * Check if two dates are on the same day
 * @param date1 - First date (Date object or ISO string)
 * @param date2 - Second date (Date object or ISO string)
 * @returns True if both dates are on the same day
 */
export const isSameDay = (
  date1: Date | string,
  date2: Date | string
): boolean => {
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "string" ? new Date(date2) : date2;

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
  return dfnsIsSameDay(d1, d2);
};

/**
 * Converts URLs in a message string to clickable, styled, accessible anchor tags.
 * Preserves line breaks.
 * @param message - The message string to process
 * @returns HTML string with URLs replaced by <a> tags
 */
export const linkifyMessage = (message: string): string => {
  if (!message) return "";
  // Regex to match URLs (http, https, www)
  const urlRegex =
    /((https?:\/\/|www\.)[\w\-._~:/?#[\]@!$&'()*+,;=%]+)(?=[\s\n]|$)/gi;
  // Replace URLs with anchor tags
  let html = message.replace(urlRegex, (url) => {
    let href = url;
    if (!href.startsWith("http")) {
      href = "https://" + href;
    }
    // Tailwind: underline, decoration-inherit, hover:decoration-inherit, focus:outline-none
    return `<a href="${href}" class="underline decoration-inherit hover:decoration-inherit focus:outline-none" target="_blank" rel="noopener noreferrer" aria-label="Open link: ${url}">${url}</a>`;
  });
  // Replace line breaks with <br />
  html = html.replace(/\n/g, "<br />");
  return html;
};
