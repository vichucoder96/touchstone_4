"use strict";
 
const STORAGE_KEY = "northStarSavedItems";
const MIN_NOTICE_DAYS = 5;
const MAX_DETAILS_LENGTH = 500;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
 
const form = document.getElementById("request-form");
const statusMessage = document.getElementById("form-status");
const prefillNote = document.getElementById("prefill-note");
 
// Data: each field with its input, its error message element, and its check.
const fields = {
  name: { input: document.getElementById("name"), error: document.getElementById("name-error"), check: checkName },
  email: { input: document.getElementById("email"), error: document.getElementById("email-error"), check: checkEmail },
  requestType: { input: document.getElementById("request-type"), error: document.getElementById("request-type-error"), check: checkRequestType },
  pickupDate: { input: document.getElementById("pickup-date"), error: document.getElementById("pickup-date-error"), check: checkPickupDate },
  itemDetails: { input: document.getElementById("item-details"), error: document.getElementById("item-details-error"), check: checkItemDetails }
};
 
/* ---------- Helpers ---------- */
 
function needsFiveDayNotice() {
  const type = fields.requestType.input.value;
  return type === "cake-order" || type === "event-catering";
}
 
function daysFromToday(dateText) {
  const parts = dateText.split("-").map(Number);
  const picked = new Date(parts[0], parts[1] - 1, parts[2]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((picked - today) / 86400000);
}
 
function earliestPickupText() {
  const earliest = new Date();
  earliest.setDate(earliest.getDate() + MIN_NOTICE_DAYS);
  return earliest.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}
 
/* ---------- Validation checks (each returns an error message, or "" if valid) ---------- */
 
function checkName() {
  const value = fields.name.input.value.trim();
  if (value === "") {
    return "Please enter your name.";
  }
  if (value.length < 2) {
    return "Your name must be at least 2 characters long.";
  }
  return "";
}
 
function checkEmail() {
  const value = fields.email.input.value.trim();
  if (value === "") {
    return "Please enter your email address so we can reply.";
  }
  if (!EMAIL_PATTERN.test(value)) {
    return "Please enter a valid email address, such as name@example.com.";
  }
  return "";
}
 
function checkRequestType() {
  if (fields.requestType.input.value === "") {
    return "Please choose a request type.";
  }
  return "";
}
 
function checkPickupDate() {
  const value = fields.pickupDate.input.value;
  if (value === "") {
    return needsFiveDayNotice()
      ? "Please choose a pickup date. Cakes and events need at least " + MIN_NOTICE_DAYS + " days\u2019 notice."
      : "";
  }
  const days = daysFromToday(value);
  if (days < 0) {
    return "The pickup date can\u2019t be in the past.";
  }
  if (needsFiveDayNotice() && days < MIN_NOTICE_DAYS) {
    return "Cakes and events need at least " + MIN_NOTICE_DAYS + " days\u2019 notice. Please choose " + earliestPickupText() + " or later.";
  }
  return "";
}
 
function checkItemDetails() {
  const value = fields.itemDetails.input.value.trim();
  const type = fields.requestType.input.value;
  if (value === "" && (type === "pre-order" || type === "cake-order")) {
    return "Please tell us what you would like to order.";
  }
  if (value.length > MAX_DETAILS_LENGTH) {
    return "Please keep this under " + MAX_DETAILS_LENGTH + " characters (it is " + value.length + " now).";
  }
  return "";
}
 
/* ---------- Showing feedback ---------- */
 
function showError(field, message) {
  field.error.textContent = "Error: " + message;
  field.input.setAttribute("aria-invalid", "true");
}
 
function clearError(field) {
  field.error.textContent = "";
  field.input.removeAttribute("aria-invalid");
}
 
function validateField(field) {
  const message = field.check();
  if (message === "") {
    clearError(field);
    return true;
  }
  showError(field, message);
  return false;
}
 
function validateAll() {
  let firstInvalid = null;
  let invalidCount = 0;
  Object.values(fields).forEach((field) => {
    if (!validateField(field)) {
      invalidCount += 1;
      if (firstInvalid === null) {
        firstInvalid = field.input;
      }
    }
  });
  return { firstInvalid: firstInvalid, invalidCount: invalidCount };
}
 
function clearAllFeedback() {
  Object.values(fields).forEach(clearError);
  statusMessage.textContent = "";
  prefillNote.hidden = true;
}
 
/* ---------- Event handlers ---------- */
 
function handleSubmit(event) {
  event.preventDefault();
  const result = validateAll();
 
  if (result.firstInvalid) {
    const word = result.invalidCount === 1 ? "field needs" : "fields need";
    statusMessage.textContent = result.invalidCount + " " + word + " your attention. Please fix the message" + (result.invalidCount === 1 ? "" : "s") + " shown above.";
    result.firstInvalid.focus();
    return;
  }
 
  // This is a static site with no server, so a valid request ends here with a confirmation.
  const firstName = fields.name.input.value.trim().split(" ")[0];
  form.reset();
  statusMessage.textContent = "Thank you, " + firstName + "! Your request was received. We will reply by email within one business day.";
  statusMessage.focus();
}
 
function handleReset() {
  // Wait for the browser to clear the fields, then clear the messages.
  setTimeout(clearAllFeedback, 0);
}
 
function setUpLiveFeedback() {
  Object.values(fields).forEach((field) => {
    // Check a field when the user leaves it.
    field.input.addEventListener("blur", () => validateField(field));
    // While a field shows an error, re-check as the user types so they can fix it right away.
    field.input.addEventListener("input", () => {
      if (field.input.getAttribute("aria-invalid") === "true") {
        validateField(field);
      }
    });
  });
 
  // The request type changes what the date and details need.
  fields.requestType.input.addEventListener("change", () => {
    validateField(fields.requestType);
    [fields.pickupDate, fields.itemDetails].forEach((field) => {
      if (field.input.getAttribute("aria-invalid") === "true") {
        validateField(field);
      }
    });
  });
}
 
/* ---------- Pre-fill from the Products page ---------- */
 
function loadSavedNames() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(stored)) {
      return stored
        .filter((item) => item && typeof item.name === "string")
        .map((item) => item.name);
    }
  } catch (error) {
    // No saved items available.
  }
  return [];
}
 
function prefillItemDetails() {
  const names = loadSavedNames();
  const details = fields.itemDetails.input;
  if (names.length === 0 || details.value.trim() !== "") {
    return;
  }
  details.value = "I would like to order: " + names.join(", ") + ".";
  prefillNote.hidden = false;
}
 
/* ---------- Start up ---------- */
 
function init() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  fields.pickupDate.input.min = today.getFullYear() + "-" + month + "-" + day;
 
  prefillItemDetails();
  setUpLiveFeedback();
  form.addEventListener("submit", handleSubmit);
  form.addEventListener("reset", handleReset);
}
 
init();
