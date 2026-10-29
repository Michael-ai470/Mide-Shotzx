// js/services.js
import './page.js';
import { createMotion } from '../motion-kit/core/core.js';
import { indexList, indexFigures } from '../motion-kit/recipes/index-list.js';

const index = document.querySelector('[data-index]');
createMotion(index, (env) => indexList(index, env), { when: '(min-width: 900px)' });
createMotion(index, () => indexFigures(index), { when: '(max-width: 899px)' });
