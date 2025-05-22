import { KinksData, LevelsData, Selection } from "../types";

export const strToClass = (str: string): string => {
  let className = "";
  str = str.toLowerCase();
  const validChars = "abcdefghijklmnopqrstuvwxyz";
  let newWord = false;

  for (let i = 0; i < str.length; i++) {
    const chr = str[i];
    if (validChars.indexOf(chr) >= 0) {
      if (newWord) {
        className += chr.toUpperCase();
      } else {
        className += chr;
      }
      newWord = false;
    } else {
      newWord = true;
    }
  }

  return className;
};

export const log = (val: number, base: number): number => {
  return Math.log(val) / Math.log(base);
};

export const parseKinksText = (
  text: string,
  errorHandler: (msg: string) => void = (msg) => window.alert(msg),
): KinksData | null => {
  const newKinks: KinksData = {};
  const lines = text.replace(/\r/g, "").split("\n");

  let cat: (Partial<KinksData[string]> & { descriptions?: string[] }) | null =
    null;
  let catName: string | null = null;
  let lastKinkIdx: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.length) continue;

    if (line[0] === "#") {
      if (
        catName &&
        cat &&
        Array.isArray(cat.fields) &&
        cat.fields.length > 0 &&
        Array.isArray(cat.kinks) &&
        cat.kinks.length > 0
      ) {
        newKinks[catName] = { ...cat, name: catName } as KinksData[string];
      }
      catName = line.substring(1).trim();
      cat = { kinks: [], descriptions: [] };
      lastKinkIdx = null;
    }

    if (!catName) continue;

    if (line[0] === "(") {
      if (cat) {
        cat.fields = line
          .substring(1, line.length - 1)
          .trim()
          .split(",")
          .map((field) => field.trim());
      }
    } else if (line[0] === "*") {
      const kink = line.substring(1).trim();
      if (cat && Array.isArray(cat.kinks) && Array.isArray(cat.descriptions)) {
        cat.kinks.push(kink);
        cat.descriptions.push(""); // Platzhalter für Beschreibung
        lastKinkIdx = cat.kinks.length - 1;
      }
    } else if (
      line[0] === "?" &&
      cat &&
      Array.isArray(cat.descriptions) &&
      lastKinkIdx !== null
    ) {
      // Beschreibung für den letzten Kink
      cat.descriptions[lastKinkIdx] = line.substring(1).trim();
    }
  }

  if (
    catName &&
    cat &&
    Array.isArray(cat.fields) &&
    cat.fields.length > 0 &&
    Array.isArray(cat.kinks) &&
    cat.kinks.length > 0
  ) {
    newKinks[catName] = { ...cat, name: catName } as KinksData[string];
  }

  return newKinks;
};

export const kinksToText = (kinks: KinksData): string => {
  let kinksText = "";
  const kinkCats = Object.keys(kinks);

  for (let i = 0; i < kinkCats.length; i++) {
    const catName = kinkCats[i];
    const catFields = kinks[catName].fields;
    const catKinks = kinks[catName].kinks;
    const catDescriptions = kinks[catName].descriptions || [];

    kinksText += "#" + catName + "\r\n";
    kinksText += "(" + catFields.join(", ") + ")\r\n";

    for (let j = 0; j < catKinks.length; j++) {
      kinksText += "* " + catKinks[j] + "\r\n";
      if (catDescriptions[j] && catDescriptions[j].trim().length > 0) {
        kinksText += "? " + catDescriptions[j].trim() + "\r\n";
      }
    }

    kinksText += "\r\n";
  }

  return kinksText;
};

// Helper functions for URL hash encoding/decoding
const hashChars =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.=+*^!@";

const maxPow = (base: number, maxVal: number): number => {
  let maxPow = 1;
  for (let pow = 1; Math.pow(base, pow) <= maxVal; pow++) {
    maxPow = pow;
  }
  return maxPow;
};

const prefix = (input: string, len: number, char: string): string => {
  let result = input;
  while (result.length < len) {
    result = char + result;
  }
  return result;
};

export const encode = (base: number, input: number[]): string => {
  const hashBase = hashChars.length;
  const outputPow = maxPow(hashBase, Number.MAX_SAFE_INTEGER);
  const inputPow = maxPow(base, Math.pow(hashBase, outputPow));

  let output = "";
  const numChunks = Math.ceil(input.length / inputPow);
  let inputIndex = 0;

  for (let chunkId = 0; chunkId < numChunks; chunkId++) {
    let inputIntValue = 0;
    for (let pow = 0; pow < inputPow; pow++) {
      const inputVal = input[inputIndex++];
      if (typeof inputVal === "undefined") break;
      const val = inputVal * Math.pow(base, pow);
      inputIntValue += val;
    }

    let outputCharValue = "";
    while (inputIntValue > 0) {
      const maxPow = Math.floor(log(inputIntValue, hashBase));
      const powVal = Math.pow(hashBase, maxPow);
      const charInt = Math.floor(inputIntValue / powVal);
      const subtract = charInt * powVal;
      const char = hashChars[charInt];
      outputCharValue += char;
      inputIntValue -= subtract;
    }

    const chunk = prefix(outputCharValue, outputPow, hashChars[0]);
    output += chunk;
  }

  return output;
};

export const decode = (base: number, output: string): number[] => {
  const hashBase = hashChars.length;
  const outputPow = maxPow(hashBase, Number.MAX_SAFE_INTEGER);

  const values: number[] = [];
  const numChunks = Math.max(output.length / outputPow);

  for (let i = 0; i < numChunks; i++) {
    const chunk = output.substring(i * outputPow, (i + 1) * outputPow);
    const chunkValues = decodeChunk(base, chunk);

    for (let j = 0; j < chunkValues.length; j++) {
      values.push(chunkValues[j]);
    }
  }

  return values;
};

const decodeChunk = (base: number, chunk: string): number[] => {
  const hashBase = hashChars.length;
  const outputPow = maxPow(hashBase, Number.MAX_SAFE_INTEGER);
  const inputPow = maxPow(base, Math.pow(hashBase, outputPow));

  let chunkInt = 0;
  for (let i = 0; i < chunk.length; i++) {
    const char = chunk[i];
    const charInt = hashChars.indexOf(char);
    const pow = chunk.length - 1 - i;
    const intVal = Math.pow(hashBase, pow) * charInt;
    chunkInt += intVal;
  }

  const output: number[] = [];
  for (let pow = inputPow - 1; pow >= 0; pow--) {
    const posBase = Math.floor(Math.pow(base, pow));
    const posVal = Math.floor(chunkInt / posBase);
    const subtract = posBase * posVal;
    output.push(posVal);
    chunkInt -= subtract;
  }

  output.reverse();
  return output;
};

export const updateHash = (
  selection: Selection[],
  levels: LevelsData,
): string => {
  const hashValues: number[] = [];

  // Get all choices from the selection
  selection.forEach((item) => {
    // Find the level index
    const levelNames = Object.keys(levels);
    const levelIndex = levelNames.indexOf(item.value);
    hashValues.push(levelIndex >= 0 ? levelIndex : 0);
  });

  const hash = encode(Object.keys(levels).length, hashValues);
  window.location.hash = hash;
  return hash;
};

export const parseHash = (
  levels: LevelsData,
  kinks: KinksData,
): Selection[] | null => {
  const hash = window.location.hash.substring(1);
  if (hash.length < 10) return null;

  const levelCount = Object.keys(levels).length;
  const levelValues = decode(levelCount, hash);

  // Convert level values (indexes) to full Selection objects
  const allKinks = getAllKinks(kinks, levels);
  const updatedSelection: Selection[] = [];

  for (let i = 0; i < Math.min(levelValues.length, allKinks.length); i++) {
    const levelIndex = levelValues[i];
    const levelNames = Object.keys(levels);
    const levelName = levelNames[levelIndex] || levelNames[0];

    updatedSelection.push({
      ...allKinks[i],
      value: levelName,
    });
  }

  return updatedSelection;
};

export const getAllKinks = (
  kinks: KinksData,
  levels: LevelsData,
  existingSelection: Selection[] = [],
): Selection[] => {
  const list: Selection[] = [];
  const selectionMap = new Map<string, string>();

  // Create a map of existing selections for fast lookup
  existingSelection.forEach((item) => {
    const key = `${item.category}-${item.kink}-${item.field}`;
    selectionMap.set(key, item.value);
  });

  const categories = Object.keys(kinks);
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    const fields = kinks[category].fields;
    const kinkArr = kinks[category].kinks;

    for (let j = 0; j < fields.length; j++) {
      const field = fields[j];
      for (let k = 0; k < kinkArr.length; k++) {
        const kink = kinkArr[k];
        const key = `${category}-${kink}-${field}`;
        const value = selectionMap.get(key) || Object.keys(levels)[0];

        const obj: Selection = {
          category,
          kink,
          field,
          value,
          showField: fields.length >= 2,
        };

        list.push(obj);
      }
    }
  }

  return list;
};

// Download image function
export const downloadImage = (
  canvas: HTMLCanvasElement,
  username: string,
): void => {
  try {
    const filename = `kinklist_${username ? username.replace(/[^a-z0-9]/gi, "_").toLowerCase() : "export"}_${new Date().toISOString().slice(0, 10)}.png`;

    // Create a temporary link element to trigger the download
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    }, 100);
  } catch (error) {
    console.error("Error downloading image:", error);
    throw error;
  }
};

// Canvas drawing functions
export const setupCanvas = (
  width: number,
  height: number,
  username: string,
  levels: LevelsData,
): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d")!;
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.font = "bold 24px Arial";
  context.fillStyle = "#000000";
  context.fillText("Kinklist " + username, 5, 25);

  drawLegend(context, levels);
  return canvas;
};

export const drawLegend = (
  context: CanvasRenderingContext2D,
  levels: LevelsData,
): void => {
  context.font = "bold 13px Arial";
  context.fillStyle = "#000000";

  const levelNames = Object.keys(levels);
  const x = context.canvas.width - 15 - 120 * levelNames.length;

  for (let i = 0; i < levelNames.length; i++) {
    context.beginPath();
    context.arc(x + 120 * i, 17, 8, 0, 2 * Math.PI, false);
    context.fillStyle = levels[levelNames[i]].color;
    context.fill();
    context.strokeStyle = "rgba(0, 0, 0, 0.5)";
    context.lineWidth = 1;
    context.stroke();

    context.fillStyle = "#000000";
    context.fillText(levelNames[i], x + 15 + i * 120, 22);
  }
};

// Drawing call handlers
export const drawCallHandlers = {
  simpleTitle: (context: CanvasRenderingContext2D, drawCall: any): void => {
    context.fillStyle = "#000000";
    context.font = "bold 18px Arial";
    context.fillText(drawCall.data, drawCall.x, drawCall.y + 5);
  },

  titleSubtitle: (context: CanvasRenderingContext2D, drawCall: any): void => {
    context.fillStyle = "#000000";
    context.font = "bold 18px Arial";
    context.fillText(drawCall.data.category, drawCall.x, drawCall.y + 5);

    const fieldsStr = drawCall.data.fields.join(", ");
    context.font = "italic 12px Arial";
    context.fillText(fieldsStr, drawCall.x, drawCall.y + 20);
  },

  kinkRow: (context: CanvasRenderingContext2D, drawCall: any): void => {
    context.fillStyle = "#000000";
    context.font = "12px Arial";

    const x = drawCall.x + 5 + drawCall.data.choices.length * 20;
    const y = drawCall.y - 6;
    context.fillText(drawCall.data.text, x, y);

    // Circles
    for (let i = 0; i < drawCall.data.choices.length; i++) {
      const choice = drawCall.data.choices[i];
      const color = drawCall.data.colors[choice];

      const x = 10 + drawCall.x + i * 20;
      const y = drawCall.y - 10;

      context.beginPath();
      context.arc(x, y, 8, 0, 2 * Math.PI, false);
      context.fillStyle = color;
      context.fill();
      context.strokeStyle = "rgba(0, 0, 0, 0.5)";
      context.lineWidth = 1;
      context.stroke();
    }
  },
};

// Diese Funktionen wurden durch React-State-basierte Implementierungen ersetzt
