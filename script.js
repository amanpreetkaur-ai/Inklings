function toggleSearch(event) {
    event.preventDefault();
    document.getElementById("search-panel").classList.toggle("active");
}
document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.getElementById("menuToggle");
    const sideDrawer = document.getElementById("sideDrawer");
    const closeBtn = document.getElementById("closeBtn");
    const navOverlay = document.getElementById("navOverlay");

    // Function to open navigation panel view
    const openMenu = () => {
        sideDrawer.classList.add("open");
        navOverlay.classList.add("open");
            document.body.style.overflow = "hidden"; /* Locks page scrolling while open */
        };

    // Function to dismiss navigation panel view
    const closeMenu = () => {
        sideDrawer.classList.remove("open");
        navOverlay.classList.remove("open");
            document.body.style.overflow = ""; /* Restores main scroll window behaviors */
        };

    // Click Event Observers
    menuToggle.addEventListener("click", openMenu);
    closeBtn.addEventListener("click", closeMenu);
    navOverlay.addEventListener("click", closeMenu);
});