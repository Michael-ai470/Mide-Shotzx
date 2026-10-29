// js/about.js
import './page.js';
import { createMotion } from '../motion-kit/core/core.js';
import { develop } from '../motion-kit/recipes/develop.js';
import { filmCards } from './films.js';

// Each portrait comes up like a darkroom print as it scrolls in.
document.querySelectorAll('.member').forEach((member) => createMotion(member, () => develop(member)));

filmCards();
