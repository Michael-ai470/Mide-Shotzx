// js/page.js
// Inner pages: the page header arrives (words flip up, the lead comes into focus), then
// the shared site motion. Pages with more to do import this and add their own.
import { createMotion } from '../motion-kit/core/core.js';
import { heroFrame } from '../motion-kit/recipes/hero-frame.js';
import { initSite } from './site.js';

const head = document.querySelector('[data-hero]');
createMotion(head, (env) => heroFrame(head, env));
initSite();
