<script lang="ts">
import { createEventDispatcher } from 'svelte';
export let open: boolean;
export let categories: any[];
const dispatch = createEventDispatcher();
let text = '';

$: if (open) {
  text = categoriesToText(categories);
}

function categoriesToText(cats: any[]) {
  let t = '';
  for (const cat of cats) {
    t += `#${cat.name}\n`;
    t += `(${cat.fields.join(', ')})\n`;
    for (const kink of cat.kinks) {
      t += `* ${kink}\n`;
    }
    t += '\n';
  }
  return t;
}

function accept() {
  dispatch('accept', { text });
}
function close() {
  dispatch('close');
}
</script>
{#if open}
  <div class="overlay" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:1000;">
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:20px;">
      <textarea bind:value={text} style="width:500px;height:300px;"></textarea>
      <br />
      <button on:click={accept}>Accept</button>
      <button on:click={close}>Cancel</button>
    </div>
  </div>
{/if}
