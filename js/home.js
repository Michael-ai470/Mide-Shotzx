// js/home.js
import { createMotion } from '../motion-kit/core/core.js';
import { heroReel } from './hero-reel.js';
import { sideRail } from '../motion-kit/recipes/side-rail.js';
import { indexList, indexFigures } from '../motion-kit/recipes/index-list.js';
import { initSite } from './site.js';
import { filmCards } from './films.js';

// The hero first: it holds gated text (motion-kit/README.md, load order rule).
const hero = document.querySelector('[data-hero]');
createMotion(hero, (env) => heroReel(hero, env));

initSite();

// Selected work: the row slides while the section holds. Phones keep the swipe row.
const rail = document.querySelector('[data-rail]');
createMotion(rail, (env) => sideRail(rail, env, { step: 70 }), { when: '(min-width: 900px)' });

const index = document.querySelector('[data-index]');
createMotion(index, (env) => indexList(index, env), { when: '(min-width: 900px)' });
createMotion(index, () => indexFigures(index), { when: '(max-width: 899px)' });

filmCards();
