import React, { useState } from 'react';
import { useKinklist } from '../context/KinklistContext';
import { exportToImgur, setupCanvas } from '../utils';

interface ExportProps {
  imgurClientId: string;
}

const Export: React.FC<ExportProps> = ({ imgurClientId }) => {
  const { kinks, levels, selection } = useKinklist();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [exportUrl, setExportUrl] = useState<string>('');

  const handleExport = async () => {
    const username = prompt("Bitte geben Sie Ihren Namen ein");
    if (typeof username !== 'string') return;
    
    let displayName = username.length ? `(${username})` : '';
    
    setIsLoading(true);
    setExportUrl('');

    try {
      // Constants
      const numCols = 6;
      const columnWidth = 250;
      const simpleTitleHeight = 35;
      const titleSubtitleHeight = 50;
      const rowHeight = 25;
      const offsets = {
        left: 10,
        right: 10,
        top: 50,
        bottom: 10
      };

      // Find out how many we have of everything
      const categories = Object.keys(kinks);
      const numCats = categories.length;
      const dualCats = categories.filter(cat => kinks[cat].fields.length > 1).length;
      const simpleCats = numCats - dualCats;
      
      // Count total kinks
      let numKinks = 0;
      categories.forEach(cat => {
        numKinks += kinks[cat].kinks.length;
      });

      // Determine height required for all categories and kinks
      const totalHeight = (
        (numKinks * rowHeight) +
        (dualCats * titleSubtitleHeight) +
        (simpleCats * simpleTitleHeight)
      );

      // Initialize columns and drawStacks
      interface Column {
        height: number;
        drawStack: any[];
      }

      const columns: Column[] = [];
      for (let i = 0; i < numCols; i++) {
        columns.push({ height: 0, drawStack: [] });
      }

      // Create drawcalls and place them in the drawStack
      const avgColHeight = totalHeight / numCols;
      let columnIndex = 0;

      categories.forEach(catName => {
        const category = kinks[catName];
        const fields = category.fields;
        const catKinks = category.kinks;

        let catHeight = 0;
        catHeight += (fields.length === 1) ? simpleTitleHeight : titleSubtitleHeight;
        catHeight += (catKinks.length * rowHeight);

        // Determine which column to place this category in
        if ((columns[columnIndex].height + (catHeight / 2)) > avgColHeight) columnIndex++;
        while (columnIndex >= numCols) columnIndex--;
        const column = columns[columnIndex];

        // Drawcall for title
        const drawCall: any = { y: column.height };
        column.drawStack.push(drawCall);
        
        if (fields.length < 2) {
          column.height += simpleTitleHeight;
          drawCall.type = 'simpleTitle';
          drawCall.data = catName;
        } else {
          column.height += titleSubtitleHeight;
          drawCall.type = 'titleSubtitle';
          drawCall.data = {
            category: catName,
            fields: fields
          };
        }

        // Drawcalls for kinks
        catKinks.forEach((kinkName) => {
          const drawCall = {
            y: column.height, 
            type: 'kinkRow', 
            data: {
              choices: [] as string[],
              colors: {} as Record<string, string>,
              text: kinkName
            }
          };
          
          column.drawStack.push(drawCall);
          column.height += rowHeight;

          // Add choices
          fields.forEach(field => {
            // Find the selection for this kink/field
            const selItem = selection.find(item => 
              item.category === catName && 
              item.kink === kinkName && 
              item.field === field
            );
            
            const value = selItem ? selItem.value : Object.keys(levels)[0];
            drawCall.data.choices.push(value);
          });
          
          // Add colors for each level
          Object.entries(levels).forEach(([name, level]) => {
            drawCall.data.colors[name] = level.color;
          });
        });
      });

      // Find tallest column height
      let tallestColumnHeight = 0;
      for (let i = 0; i < columns.length; i++) {
        if (tallestColumnHeight < columns[i].height) {
          tallestColumnHeight = columns[i].height;
        }
      }

      // Setup canvas dimensions
      const canvasWidth = offsets.left + offsets.right + (columnWidth * numCols);
      const canvasHeight = offsets.top + offsets.bottom + tallestColumnHeight;
      
      // Create canvas
      const canvas = setupCanvas(canvasWidth, canvasHeight, displayName, levels);
      const context = canvas.getContext('2d')!;

      // Render columns to canvas
      const drawCallHandlers = {
        simpleTitle: (context: CanvasRenderingContext2D, drawCall: any): void => {
          context.fillStyle = '#000000';
          context.font = "bold 18px Arial";
          context.fillText(drawCall.data, drawCall.x, drawCall.y + 5);
        },
        
        titleSubtitle: (context: CanvasRenderingContext2D, drawCall: any): void => {
          context.fillStyle = '#000000';
          context.font = "bold 18px Arial";
          context.fillText(drawCall.data.category, drawCall.x, drawCall.y + 5);

          const fieldsStr = drawCall.data.fields.join(', ');
          context.font = "italic 12px Arial";
          context.fillText(fieldsStr, drawCall.x, drawCall.y + 20);
        },
        
        kinkRow: (context: CanvasRenderingContext2D, drawCall: any): void => {
          context.fillStyle = '#000000';
          context.font = "12px Arial";

          const x = drawCall.x + 5 + (drawCall.data.choices.length * 20);
          const y = drawCall.y - 6;
          context.fillText(drawCall.data.text, x, y);

          // Circles
          for (let i = 0; i < drawCall.data.choices.length; i++) {
            const choice = drawCall.data.choices[i];
            const color = drawCall.data.colors[choice];

            const x = 10 + drawCall.x + (i * 20);
            const y = drawCall.y - 10;

            context.beginPath();
            context.arc(x, y, 8, 0, 2 * Math.PI, false);
            context.fillStyle = color;
            context.fill();
            context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            context.lineWidth = 1;
            context.stroke();
          }
        }
      };

      for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        const drawStack = column.drawStack;

        const drawX = offsets.left + (columnWidth * i);
        for (let j = 0; j < drawStack.length; j++) {
          const drawCall = drawStack[j];
          drawCall.x = drawX;
          drawCall.y += offsets.top;

          type DrawCallType = 'simpleTitle' | 'titleSubtitle' | 'kinkRow';
          const drawCallType = drawCall.type as DrawCallType;

          if (drawCallHandlers[drawCallType]) {
            drawCallHandlers[drawCallType](context, drawCall);
          }
        }
      }

      // Send canvas to imgur
      const url = await exportToImgur(canvas, imgurClientId);
      setExportUrl(url);
    } catch (error) {
      console.error("Error during export:", error);
      alert('Fehler beim Hochladen zu Imgur.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div id="ExportWrapper">
      <input 
        type="text" 
        id="URL" 
        value={exportUrl} 
        readOnly 
        onClick={(e) => (e.target as HTMLInputElement).select()} 
        className={exportUrl ? 'visible' : ''} 
        aria-label="Export URL"
        placeholder="Export URL"
      />
      <button id="Export" onClick={handleExport}>Exportieren</button>
      <div id="Loading" className={isLoading ? 'visible' : ''}>Lädt</div>
    </div>
  );
};

export default Export;
