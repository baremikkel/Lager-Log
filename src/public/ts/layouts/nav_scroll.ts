// Shows a fade + arrow on each side of the navigation bar when more links are
// hidden in that direction, so it's clear the bar can be swiped sideways.
document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById("navLinks") as HTMLUListElement | null;
    const left = document.getElementById("navScrollLeft") as HTMLButtonElement | null;
    const right = document.getElementById("navScrollRight") as HTMLButtonElement | null;
    if (!list || !left || !right) return;

    const EDGE_TOLERANCE_PX = 4;

    const update = () => {
        const maxScroll = list.scrollWidth - list.clientWidth;
        setVisible(left, list.scrollLeft > EDGE_TOLERANCE_PX);
        setVisible(right, list.scrollLeft < maxScroll - EDGE_TOLERANCE_PX);
    };

    const scrollBy = (direction: number) =>
        list.scrollBy({ left: direction * list.clientWidth * 0.6, behavior: "smooth" });

    left.addEventListener("click", () => scrollBy(-1));
    right.addEventListener("click", () => scrollBy(1));
    list.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();

    // Make sure the link for the current page is visible on load.
    const current = Array.from(list.querySelectorAll("a")).find(
        (a) => a.pathname === window.location.pathname,
    );
    current?.scrollIntoView({ block: "nearest", inline: "center" });
    if (current) {
        current.classList.add("bg-sky-700", "md:bg-transparent", "md:underline");
        current.setAttribute("aria-current", "page");
    }
});

function setVisible(element: HTMLElement, visible: boolean): void {
    element.classList.toggle("hidden", !visible);
    element.classList.toggle("flex", visible);
}
