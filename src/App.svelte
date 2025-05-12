<script lang="ts">
import Legend from './components/Legend.svelte';
import KinkCategory from './components/KinkCategory.svelte';
import EditOverlay from './components/EditOverlay.svelte';
import { onMount, tick } from 'svelte';

// Beispiel-Daten, später aus Store oder Datei
let categories = [
  {
    name: 'Bodies',
    fields: ['General'],
    kinks: ['Skinny', 'Chubby', 'Small breasts', 'Large breasts', 'Small cocks', 'Large cocks']
  },
  {
    name: 'Clothing',
    fields: ['Self', 'Partner'],
    kinks: ['Clothed sex', 'Lingerie', 'Stockings', 'Heels', 'Leather', 'Latex', 'Uniform / costume', 'Cross-dressing']
  }
];

let showEdit = false;

// Auswahl-State: key = `${cat}|${field}|${kink}`
let selection: Record<string, number> = {};

function getKey(cat: string, field: string, kink: string) {
  return `${cat}|${field}|${kink}`;
}

function handleSelect(e: CustomEvent<{cat: string, field: string, kink: string, level: number}>) {
  const {cat, field, kink, level} = e.detail;
  selection[getKey(cat, field, kink)] = level;
}

function openEdit() {
  showEdit = true;
}
function closeEdit() {
  showEdit = false;
}

function handleEditAccept(e: CustomEvent<{text: string}>) {
  categories = parseKinksText(e.detail.text);
  showEdit = false;
}

function parseKinksText(text: string) {
  const lines = text.replace(/\r/g, '').split('\n');
  const cats = [];
  let cat: any = null;
  let catName = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.length) continue;
    if (line[0] === '#') {
      if (catName && cat) cats.push(cat);
      catName = line.substring(1).trim();
      cat = { name: catName, fields: [], kinks: [] };
    }
    if (!catName) continue;
    if (line[0] === '(') {
      cat.fields = line.substring(1, line.length - 1).split(',').map((s) => s.trim());
    }
    if (line[0] === '*') {
      if (!cat.kinks) cat.kinks = [];
      cat.kinks.push(line.substring(1).trim());
    }
  }
  if (catName && cat) cats.push(cat);
  return cats;
}

const levels = [
  { label: 'Not Entered', color: '#FFFFFF', class: 'notEntered' },
  { label: 'Favorite', color: '#6DB5FE', class: 'favorite' },
  { label: 'Like', color: '#23FD22', class: 'like' },
  { label: 'Okay', color: '#FDFD6B', class: 'okay' },
  { label: 'Maybe', color: '#DB6C00', class: 'maybe' },
  { label: 'No', color: '#920000', class: 'no' }
];

let exportUrl = '';
let loading = false;

async function exportKinkList() {
  const username = prompt('Bitte Namen eingeben (optional):') || '';
  loading = true;
  exportUrl = '';
  await tick();

  // Canvas-Größe dynamisch bestimmen
  const numCols = 4;
  const columnWidth = 250;
  const rowHeight = 25;
  const titleHeight = 35;
  const offsetTop = 60;
  const offsetLeft = 10;
  let totalRows = 0;
  categories.forEach(cat => {
    totalRows += 1 + cat.kinks.length;
  });
  const canvasHeight = offsetTop + totalRows * rowHeight + 60;
  const canvasWidth = offsetLeft * 2 + numCols * columnWidth;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000';
  ctx.font = 'bold 24px Arial';
  ctx.fillText('Kinklist ' + (username ? '(' + username + ')' : ''), 20, 40);

  // Legende
  ctx.font = 'bold 13px Arial';
  levels.forEach((l, i) => {
    ctx.beginPath();
    ctx.arc(160 + i * 120, 65, 8, 0, 2 * Math.PI);
    ctx.fillStyle = l.color;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.fillText(l.label, 175 + i * 120, 70);
  });

  // Kategorien und Kinks
  let y = offsetTop + 20;
  categories.forEach(cat => {
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText(cat.name, offsetLeft, y);
    y += rowHeight;
    ctx.font = '12px Arial';
    cat.kinks.forEach(kink => {
      let x = offsetLeft;
      cat.fields.forEach((field, fIdx) => {
        // Auswahlkreis
        const key = getKey(cat.name, field, kink);
        const levelIdx = selection[key] ?? 0;
        ctx.beginPath();
        ctx.arc(x + 15, y - 8, 8, 0, 2 * Math.PI);
        ctx.fillStyle = levels[levelIdx].color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.stroke();
        x += 30;
      });
      ctx.fillStyle = '#000';
      ctx.fillText(kink, offsetLeft + cat.fields.length * 30 + 10, y);
      y += rowHeight;
    });
    y += 10;
  });

  // Upload zu Imgur
  const dataUrl = canvas.toDataURL('image/png');
  try {
    const res = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        Authorization: 'Client-ID 9db53e5936cd02f',
        Accept: 'application/json'
      },
      body: new URLSearchParams({
        image: dataUrl.split(',')[1],
        type: 'base64'
      })
    });
    const result = await res.json();
    if (result && result.data && result.data.id) {
      exportUrl = `https://i.imgur.com/${result.data.id}.png`;
    } else {
      alert('Upload fehlgeschlagen');
    }
  } catch {
    alert('Upload fehlgeschlagen (Netzwerk)');
  }
  loading = false;
}
</script>

<div class="widthWrapper">
  <button id="Edit" on:click={openEdit}>Edit</button>
  <h1>Kink list</h1>
  <Legend />
  <button id="Export" on:click={exportKinkList} disabled={loading}>Export</button>
  {#if loading}
    <div id="Loading">Exportiere...</div>
  {/if}
  {#if exportUrl}
    <div id="ExportResult">
      <a href={exportUrl} target="_blank">Bild-Link: {exportUrl}</a>
    </div>
  {/if}
  <div id="InputList">
    {#each categories as cat}
      <KinkCategory {cat} {selection} on:select={handleSelect} />
    {/each}
  </div>
</div>
<EditOverlay bind:open={showEdit} {categories} on:close={closeEdit} on:accept={handleEditAccept} />

<style>
.widthWrapper {
  max-width: 1700px;
  margin-left: auto;
  margin-right: auto;
  position: relative;
}
</style>
