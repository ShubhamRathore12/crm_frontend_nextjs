"use client";

import gsap from "gsap";

/**
 * Stagger cards entrance animation
 */
export function animateCardsIn(container: HTMLElement | null, selector = ".anim-card", delay = 0.1) {
  if (!container) return;
  const cards = container.querySelectorAll(selector);
  if (!cards.length) return;
  gsap.fromTo(cards,
    { y: 30, opacity: 0, scale: 0.96 },
    { y: 0, opacity: 1, scale: 1, stagger: 0.06, duration: 0.45, ease: "power2.out", delay }
  );
}

/**
 * Fade in from bottom
 */
export function animateFadeUp(el: HTMLElement | null, delay = 0) {
  if (!el) return;
  gsap.fromTo(el, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay });
}

/**
 * Counter animation for numeric values
 */
export function animateCounter(el: HTMLElement | null, target: number, duration = 1) {
  if (!el || isNaN(target) || target === 0) return;
  const obj = { val: 0 };
  gsap.to(obj, {
    val: target,
    duration,
    ease: "power2.out",
    onUpdate: () => { el.textContent = Math.round(obj.val).toLocaleString(); },
  });
}

/**
 * Page header entrance
 */
export function animatePageHeader(el: HTMLElement | null) {
  if (!el) return;
  gsap.fromTo(el, { y: -15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" });
}

/**
 * Table rows stagger
 */
export function animateTableRows(container: HTMLElement | null, selector = "tr") {
  if (!container) return;
  const rows = container.querySelectorAll(selector);
  if (!rows.length) return;
  gsap.fromTo(rows,
    { x: -15, opacity: 0 },
    { x: 0, opacity: 1, stagger: 0.03, duration: 0.3, ease: "power2.out", delay: 0.2 }
  );
}

/**
 * Smooth scale on hover (call on mouseenter)
 */
export function hoverScaleIn(el: HTMLElement | null) {
  if (!el) return;
  gsap.to(el, { scale: 1.02, duration: 0.2, ease: "power2.out" });
}

/**
 * Smooth scale reset (call on mouseleave)
 */
export function hoverScaleOut(el: HTMLElement | null) {
  if (!el) return;
  gsap.to(el, { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.5)" });
}
