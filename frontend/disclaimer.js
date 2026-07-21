// Persistent disclaimer banner. Can be minimized within the current tab
// session for convenience, but always reappears in full on a fresh page
// load / new session — sessionStorage (not localStorage) is what makes
// that true, since it's cleared when the tab/browser session ends.
const banner = document.getElementById("disclaimerBanner");
const toggleBtn = document.getElementById("disclaimerToggle");
const STORAGE_KEY = "disclaimerMinimized";

function setBannerState(minimized) {
  banner.classList.toggle("minimized", minimized);
  toggleBtn.textContent = minimized ? "Expand" : "Minimize";
}

setBannerState(sessionStorage.getItem(STORAGE_KEY) === "1");

toggleBtn.addEventListener("click", () => {
  const minimized = !banner.classList.contains("minimized");
  setBannerState(minimized);
  sessionStorage.setItem(STORAGE_KEY, minimized ? "1" : "0");
});
