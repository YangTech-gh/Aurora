# GSAP 3.15 implementation notes

The official GSAP 3.15 release introduces `easeReverse` as a tween-level property for adaptive easing when an animation reverses; it can be `true` to reuse the forward ease or a separate ease string. The release notes state that `yoyoEase` is deprecated and internally replaced by `easeReverse` in 3.15.0.

The official ScrollTrigger documentation exposes `scrub`, `snap`, `pin`, `start`, `end`, `toggleActions`, `markers`, `onEnter`, `onLeave`, `onUpdate`, `matchMedia`, `refresh`, `kill` and `create` as relevant controls for scroll-linked motion. The editor should model these as explicit motion settings instead of treating every lifecycle as the same.

The official `gsap.context()` documentation describes collecting all GSAP animations and ScrollTriggers created inside a callback, optionally scoping selector text to a root element, then using `ctx.revert()` for cleanup. Generated framework code should use this pattern, with React using `useGSAP()` where appropriate and Vue/Svelte using mount/unmount lifecycle cleanup.

Sources consulted:

- https://gsap.com/blog/3-15/
- https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- https://gsap.com/docs/v3/GSAP/gsap.context()/
