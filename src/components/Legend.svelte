<script lang="ts">
const levels = [
  { label: 'Not Entered', color: '#FFFFFF', class: 'notEntered' },
  { label: 'Favorite', color: '#6DB5FE', class: 'favorite' },
  { label: 'Like', color: '#23FD22', class: 'like' },
  { label: 'Okay', color: '#FDFD6B', class: 'okay' },
  { label: 'Maybe', color: '#DB6C00', class: 'maybe' },
  { label: 'No', color: '#920000', class: 'no' }
];
</script>
<div class="legend">
  {#each levels as l}
    <div>
      <span class="choice {l.class}" style="background-color: {l.color}"></span>
      <span class="legend-text">{l.label}</span>
    </div>
  {/each}
</div>
