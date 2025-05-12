<script lang="ts">
import { createEventDispatcher } from 'svelte';
export let cat: { name: string; fields: string[]; kinks: string[] };
export let selection: Record<string, number> = {};
const dispatch = createEventDispatcher();

const levels = [
  { label: 'Not Entered', class: 'notEntered' },
  { label: 'Favorite', class: 'favorite' },
  { label: 'Like', class: 'like' },
  { label: 'Okay', class: 'okay' },
  { label: 'Maybe', class: 'maybe' },
  { label: 'No', class: 'no' }
];

function getKey(cat: string, field: string, kink: string) {
  return `${cat}|${field}|${kink}`;
}

function selectLevel(cat: string, field: string, kink: string, level: number) {
  dispatch('select', {cat, field, kink, level});
}
</script>
<div class="kinkCategory cat-{cat.name.replace(/\s+/g, '').toLowerCase()}">
  <h2>{cat.name}</h2>
  <table class="kinkGroup">
    <thead>
      <tr>
        {#each cat.fields as field}
          <th class="choicesCol">{field}</th>
        {/each}
        <th>Kink</th>
      </tr>
    </thead>
    <tbody>
      {#each cat.kinks as kink}
        <tr class="kinkRow kink-{kink.replace(/\s+/g, '').toLowerCase()}">
          {#each cat.fields as field}
            <td>
              <div class="choices">
                {#each levels as l, i}
                  <button
                    class="choice {l.class} {selection[getKey(cat.name, field, kink)] === i ? 'selected' : ''}"
                    title={l.label}
                    on:click={() => selectLevel(cat.name, field, kink, i)}
                  ></button>
                {/each}
              </div>
            </td>
          {/each}
          <td>{kink}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
