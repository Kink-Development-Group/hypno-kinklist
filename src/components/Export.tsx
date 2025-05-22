import React, { useState, useCallback, useEffect } from "react";
import { useKinklist } from "../context/KinklistContext";
import { downloadImage, setupCanvas } from "../utils";
import ErrorModal from "./ErrorModal";
import NameModal from "./NameModal";

interface ExportProps {}

const Export: React.FC<ExportProps> = () => {
  const { kinks, levels, selection } = useKinklist();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [pendingExportName, setPendingExportName] = useState<string>("");

  const handleExport = useCallback(() => {
    setIsNameModalOpen(true);
  }, []);

  const handleNameSubmit = (name: string) => {
    setIsNameModalOpen(false);
    setPendingExportName(name);
  };

  useEffect(() => {
    if (pendingExportName !== null) {
      if (pendingExportName === "") {
        // User cancelled or empty, do nothing
        setPendingExportName("");
        return;
      }
      (async () => {
        setIsLoading(true);
        setIsSuccess(false);
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
            bottom: 10,
          };
          const categories = Object.keys(kinks);
          const numCats = categories.length;
          const dualCats = categories.filter(
            (cat) => kinks[cat].fields.length > 1,
          ).length;
          const simpleCats = numCats - dualCats;
          let numKinks = 0;
          categories.forEach((cat) => {
            numKinks += kinks[cat].kinks.length;
          });
          const totalHeight =
            numKinks * rowHeight +
            dualCats * titleSubtitleHeight +
            simpleCats * simpleTitleHeight;
          interface Column {
            height: number;
            drawStack: any[];
          }
          const columns: Column[] = [];
          for (let i = 0; i < numCols; i++) {
            columns.push({ height: 0, drawStack: [] });
          }
          const avgColHeight = totalHeight / numCols;
          let columnIndex = 0;
          categories.forEach((catName) => {
            const category = kinks[catName];
            const fields = category.fields;
            const catKinks = category.kinks;
            let catHeight = 0;
            catHeight +=
              fields.length === 1 ? simpleTitleHeight : titleSubtitleHeight;
            catHeight += catKinks.length * rowHeight;
            if (columns[columnIndex].height + catHeight / 2 > avgColHeight)
              columnIndex++;
            while (columnIndex >= numCols) columnIndex--;
            const column = columns[columnIndex];
            const drawCall: any = { y: column.height };
            column.drawStack.push(drawCall);
            if (fields.length < 2) {
              column.height += simpleTitleHeight;
              drawCall.type = "simpleTitle";
              drawCall.data = catName;
            } else {
              column.height += titleSubtitleHeight;
              drawCall.type = "titleSubtitle";
              drawCall.data = {
                category: catName,
                fields: fields,
              };
            }
            catKinks.forEach((kinkName) => {
              const drawCall = {
                y: column.height,
                type: "kinkRow",
                data: {
                  choices: [] as string[],
                  colors: {} as Record<string, string>,
                  text: kinkName,
                },
              };
              column.drawStack.push(drawCall);
              column.height += rowHeight;
              fields.forEach((field) => {
                const selItem = selection.find(
                  (item) =>
                    item.category === catName &&
                    item.kink === kinkName &&
                    item.field === field,
                );
                const value = selItem ? selItem.value : Object.keys(levels)[0];
                drawCall.data.choices.push(value);
              });
              Object.entries(levels).forEach(([name, level]) => {
                drawCall.data.colors[name] = level.color;
              });
            });
          });
          let tallestColumnHeight = 0;
          for (let i = 0; i < columns.length; i++) {
            if (tallestColumnHeight < columns[i].height) {
              tallestColumnHeight = columns[i].height;
            }
          }
          const canvasWidth =
            offsets.left + offsets.right + columnWidth * numCols;
          const canvasHeight =
            offsets.top + offsets.bottom + tallestColumnHeight;
          let displayName = pendingExportName.length
            ? `(${pendingExportName})`
            : "";
          const canvas = setupCanvas(
            canvasWidth,
            canvasHeight,
            displayName,
            levels,
          );
          const context = canvas.getContext("2d")!;
          const drawCallHandlers = {
            simpleTitle: (
              context: CanvasRenderingContext2D,
              drawCall: any,
            ): void => {
              context.fillStyle = "#000000";
              context.font = "bold 18px Arial";
              context.fillText(drawCall.data, drawCall.x, drawCall.y + 5);
            },
            titleSubtitle: (
              context: CanvasRenderingContext2D,
              drawCall: any,
            ): void => {
              context.fillStyle = "#000000";
              context.font = "bold 18px Arial";
              context.fillText(
                drawCall.data.category,
                drawCall.x,
                drawCall.y + 5,
              );
              const fieldsStr = drawCall.data.fields.join(", ");
              context.font = "italic 12px Arial";
              context.fillText(fieldsStr, drawCall.x, drawCall.y + 20);
            },
            kinkRow: (
              context: CanvasRenderingContext2D,
              drawCall: any,
            ): void => {
              context.fillStyle = "#000000";
              context.font = "12px Arial";
              const x = drawCall.x + 5 + drawCall.data.choices.length * 20;
              const y = drawCall.y - 6;
              context.fillText(drawCall.data.text, x, y);
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
          for (let i = 0; i < columns.length; i++) {
            const column = columns[i];
            const drawStack = column.drawStack;
            const drawX = offsets.left + columnWidth * i;
            for (let j = 0; j < drawStack.length; j++) {
              const drawCall = drawStack[j];
              drawCall.x = drawX;
              drawCall.y += offsets.top;
              type DrawCallType = "simpleTitle" | "titleSubtitle" | "kinkRow";
              const drawCallType = drawCall.type as DrawCallType;
              if (drawCallHandlers[drawCallType]) {
                drawCallHandlers[drawCallType](context, drawCall);
              }
            }
          }
          downloadImage(canvas, pendingExportName);
          setIsSuccess(true);
          setTimeout(() => setIsSuccess(false), 3000);
        } catch (e) {
          setError("Fehler beim Exportieren des Bildes.");
        } finally {
          setIsLoading(false);
          setPendingExportName("");
        }
      })();
    }
  }, [pendingExportName, kinks, levels, selection]);

  const handleCloseError = () => setError(null);

  return (
    <div id="ExportWrapper">
      <NameModal
        open={isNameModalOpen}
        onSubmit={handleNameSubmit}
        onClose={() => setIsNameModalOpen(false)}
      />
      {error && <ErrorModal message={error} onClose={handleCloseError} />}
      <div
        id="SuccessMessage"
        className={isSuccess ? "visible" : ""}
        aria-live="polite"
      >
        Bild erfolgreich heruntergeladen!
      </div>
      <button
        id="Export"
        onClick={handleExport}
        disabled={isLoading}
        aria-busy={isLoading}
      >
        Export
      </button>
      <div
        id="Loading"
        className={isLoading ? "visible" : ""}
        aria-live="polite"
      >
        Lädt
      </div>
    </div>
  );
};

export default Export;
