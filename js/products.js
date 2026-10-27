"use strict";
 
const STORAGE_KEY = "northStarSavedItems";
 
// Data: every product on the page, stored as an array of objects.
const products = [
  { id: "signature-country-loaf", name: "Signature Country Loaf", category: "Breads" },
  { id: "seeded-multigrain", name: "Seeded Multigrain", category: "Breads" },
  { id: "rustic-white-boule", name: "Rustic White Boule", category: "Breads" },
  { id: "chocolate-chunk-cookies", name: "Brown Butter Chocolate Chunk Cookies", category: "Pastries" },
  { id: "glazed-honey-buns", name: "Glazed Honey Buns", category: "Pastries" },
  { id: "sandwich-cookies", name: "Sugar-Dusted Sandwich Cookies", category: "Pastries" },
  { id: "classic-layer-cakes", name: "Classic Layer Cakes", category: "Cakes" },
  { id: "seasonal-fruit-cakes", name: "Seasonal Fruit Cakes", category: "Cakes" },
  { id: "cupcakes-by-the-dozen", name: "Cupcakes by the Dozen", category: "Cakes" }
];
 
// The visitor's saved choices: an array of { id, name } objects.
let savedItems = [];
 
/* ---------- Data helpers ---------- */
 
function findProduct(id) {
  return products.find((product) => product.id === id);
}
 
function isSaved(id) {
  return savedItems.some((item) => item.id === id);
}
 
/* ---------- Browser storage ---------- */
 
function loadSavedItems() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(stored)) {
      return stored
        .filter((item) => item && findProduct(item.id))
        .map((item) => ({ id: item.id, name: findProduct(item.id).name }));
    }
  } catch (error) {
    // Storage is unavailable or the saved data is damaged: start with an empty list.
  }
  return [];
}
 
function persistSavedItems() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedItems));
  } catch (error) {
    // The list still works for this visit even if it cannot be stored.
  }
}
 
/* ---------- Actions ---------- */
 
function toggleItem(id) {
  const product = findProduct(id);
  if (!product) {
    return;
  }
  if (isSaved(id)) {
    savedItems = savedItems.filter((item) => item.id !== id);
  } else {
    savedItems.push({ id: product.id, name: product.name });
  }
  persistSavedItems();
  refreshPage();
}
 
function clearAllItems() {
  savedItems = [];
  persistSavedItems();
  refreshPage();
}
 
/* ---------- Updating the page ---------- */
 
function addSaveButtons() {
  document.querySelectorAll("li[data-id]").forEach((listItem) => {
    const product = findProduct(listItem.dataset.id);
    if (!product) {
      return;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "save-btn";
    button.dataset.id = product.id;
    button.setAttribute("aria-label", "Save " + product.name + " to my list");
    listItem.appendChild(button);
  });
}
 
function updateSaveButtons() {
  document.querySelectorAll(".save-btn").forEach((button) => {
    const saved = isSaved(button.dataset.id);
    button.setAttribute("aria-pressed", String(saved));
    button.textContent = saved ? "Saved \u2713" : "Save";
  });
}
 
function renderSavedList() {
  const list = document.getElementById("saved-list");
  const status = document.getElementById("saved-status");
  list.innerHTML = "";
 
  savedItems.forEach((item) => {
    const listItem = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = item.name;
 
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-btn";
    removeButton.dataset.id = item.id;
    removeButton.textContent = "Remove";
    removeButton.setAttribute("aria-label", "Remove " + item.name + " from my list");
 
    listItem.append(name, removeButton);
    list.appendChild(listItem);
  });
 
  const count = savedItems.length;
  if (count === 0) {
    status.textContent = "You haven\u2019t saved anything yet. Choose Save on any item below.";
  } else {
    status.textContent = count + (count === 1 ? " item" : " items") + " saved. Your list is remembered on this device.";
  }
 
  document.getElementById("clear-saved").hidden = count === 0;
  document.getElementById("preorder-link").hidden = count === 0;
}
 
function refreshPage() {
  updateSaveButtons();
  renderSavedList();
}
 
/* ---------- Start up ---------- */
 
function handleClick(event) {
  const saveButton = event.target.closest(".save-btn");
  if (saveButton) {
    toggleItem(saveButton.dataset.id);
    return;
  }
 
  const removeButton = event.target.closest(".remove-btn");
  if (removeButton) {
    toggleItem(removeButton.dataset.id);
    document.getElementById("saved-status").focus();
    return;
  }
 
  if (event.target.closest("#clear-saved")) {
    clearAllItems();
    document.getElementById("saved-status").focus();
  }
}
 
function init() {
  savedItems = loadSavedItems();
  addSaveButtons();
  refreshPage();
  document.addEventListener("click", handleClick);
}
 
init();
