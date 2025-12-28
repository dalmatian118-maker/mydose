
import { SectionStory } from './SectionStory.js';
import { SectionVisibility } from './SectionVisibility.js';
import { SectionUsability } from './SectionUsability.js';
import { SectionRoutine } from './SectionRoutine.js';
import { SectionSpecs } from './SectionSpecs.js';
import { SectionOutro } from './SectionOutro.js';

export function MydosePage() {
  return `
    <div class="mydose-body">
      ${SectionStory()}
      ${SectionVisibility()}
      ${SectionUsability()}
      ${SectionRoutine()}
      ${SectionSpecs()}
      ${SectionOutro()}
    </div>
  `;
}
