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
          // Optimierte Layout-Parameter
          const numCols = 2; // Weniger Spalten für mehr Platz pro Element
          const columnWidth = 450; // Breitere Spalten
          const simpleTitleHeight = 36;
          const titleSubtitleHeight = 46;
          const rowHeight = 40; // Mehr Platz für Text und Beschreibungen
          const offsets = {
            left: 30,
            right: 30,
            top: 90, // Platz für Legende
            bottom: 40,
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
            const catDescriptions = category.descriptions || [];

            // Filtere Kinks: Nur solche mit mindestens einer Auswahl ≠ 'Not Entered' ODER Kommentar
            const filteredKinks = catKinks.filter((kinkName, kinkIdx) => {
              let hasNonDefault = false;
              let hasComment = false;
              fields.forEach((field) => {
                const selItem = selection.find(
                  (item) =>
                    item.category === catName &&
                    item.kink === kinkName &&
                    item.field === field,
                );
                if (selItem && selItem.value !== "Not Entered") {
                  hasNonDefault = true;
                }
                if (selItem?.comment && selItem.comment.trim() !== "") {
                  hasComment = true;
                }
              });
              return hasNonDefault || hasComment;
            });

            if (filteredKinks.length === 0) return; // Keine Kinks in dieser Kategorie zum Export

            let catHeight = 0;
            catHeight +=
              fields.length === 1 ? simpleTitleHeight : titleSubtitleHeight;
            catHeight += filteredKinks.length * rowHeight;
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
            filteredKinks.forEach((kinkName) => {
              const kinkIdx = catKinks.indexOf(kinkName);
              const drawCall = {
                y: column.height,
                type: "kinkRow",
                data: {
                  choices: [] as string[],
                  colors: {} as Record<string, string>,
                  text: kinkName,
                  hasComment: false,
                  comment: "",
                  description: catDescriptions[kinkIdx] || "",
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
                if (selItem?.comment && selItem.comment.trim() !== "") {
                  drawCall.data.hasComment = true;
                  drawCall.data.comment = selItem.comment;
                }
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

          // Umfassende Legende am Anfang
          renderComprehensiveLegend(context, levels, canvasWidth);

          const drawCallHandlers = {
            simpleTitle: (
              context: CanvasRenderingContext2D,
              drawCall: any,
            ): void => {
              context.save();
              // Deutlichere Trennlinie für Kategorien
              context.beginPath();
              context.moveTo(drawCall.x, drawCall.y + simpleTitleHeight - 8);
              context.lineTo(
                drawCall.x + columnWidth - 40,
                drawCall.y + simpleTitleHeight - 8,
              );
              context.strokeStyle = "#3f51b5"; // Konsistente Farbe
              context.lineWidth = 2;
              context.stroke();

              // Größere, klare Überschrift
              context.font = "bold 16px Arial, sans-serif";
              context.fillStyle = "#3f51b5"; // Konsistente Farbe
              context.fillText(drawCall.data, drawCall.x + 5, drawCall.y + 18);
              context.restore();
            },
            titleSubtitle: (
              context: CanvasRenderingContext2D,
              drawCall: any,
            ): void => {
              context.save();
              // Deutlichere Trennlinie
              context.beginPath();
              context.moveTo(drawCall.x, drawCall.y + 28);
              context.lineTo(drawCall.x + columnWidth - 40, drawCall.y + 28);
              context.strokeStyle = "#3f51b5";
              context.lineWidth = 2;
              context.stroke();

              // Größere, klare Überschrift und gut lesbarer Untertitel
              context.font = "bold 16px Arial, sans-serif";
              context.fillStyle = "#3f51b5";
              context.fillText(
                drawCall.data.category,
                drawCall.x + 5,
                drawCall.y + 18,
              );
              context.font = "italic 12px Arial, sans-serif";
              context.fillStyle = "#666666";
              context.fillText(
                drawCall.data.fields.join(", "),
                drawCall.x + 5,
                drawCall.y + 38,
              );
              context.restore();
            },
            kinkRow: (
              context: CanvasRenderingContext2D,
              drawCall: any,
            ): void => {
              context.save();

              // Subtile Zeilenhintergründe für Lesbarkeit
              const isEven = Math.floor(drawCall.y / rowHeight) % 2 === 0;
              const bgY = drawCall.y;
              if (isEven) {
                context.fillStyle = "rgba(245, 245, 245, 0.7)";
                context.fillRect(
                  drawCall.x,
                  bgY - 16,
                  columnWidth - 20,
                  rowHeight,
                );
              }

              // Kink-Name - besser positioniert
              const circleSize = 7; // Etwas größere Kreise für bessere Sichtbarkeit
              const circleSpacing = 16; // Mehr Platz zwischen Kreisen

              const circleOffsetX =
                drawCall.data.choices.length * circleSpacing;
              const x = drawCall.x + circleOffsetX;
              const y = drawCall.y;

              context.font = "13px Arial, sans-serif";
              context.fillStyle = "#333333";
              context.fillText(drawCall.data.text, x + 8, y);

              // Vollständige Beschreibung statt abgeschnittene
              let descY = y + 18; // Mehr Abstand zum Haupttext
              if (
                drawCall.data.description &&
                drawCall.data.description.trim() !== ""
              ) {
                const description = drawCall.data.description;
                context.font = "italic 11px Arial, sans-serif";
                context.fillStyle = "#666666";

                // Text wird nicht mehr abgeschnitten
                context.fillText(description, x + 8, descY);
              }

              // Kommentare vollständig anzeigen
              if (drawCall.data.hasComment) {
                // Kommentarsymbol und Text nebeneinander
                const commentX =
                  x + context.measureText(drawCall.data.text).width + 8;

                // Symbol
                context.font = "bold 11px Arial";
                context.fillStyle = "#0277bd";
                context.fillText("💬", commentX, y);

                // Kommentartext in voller Länge anzeigen
                const commentY = descY + (drawCall.data.description ? 18 : 0);
                context.font = "italic 11px Arial, sans-serif";
                context.fillStyle = "#0277bd";
                if (drawCall.data.comment) {
                  context.fillText(drawCall.data.comment, x + 8, commentY);
                }
              }
              // Deutlicher sichtbare Auswahlkreise
              for (let i = 0; i < drawCall.data.choices.length; i++) {
                const choice = drawCall.data.choices[i];
                const color = drawCall.data.colors[choice];
                const cx = drawCall.x + 8 + i * circleSpacing;
                const cy = drawCall.y - 4;

                context.beginPath();
                context.arc(cx, cy, circleSize, 0, 2 * Math.PI, false);
                context.fillStyle = color;
                context.fill();
                context.lineWidth = 1;
                context.strokeStyle = "rgba(0, 0, 0, 0.5)";
                context.stroke();
              }
              context.restore();
            },
          };

          // Alle Elemente zeichnen
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

          // Dezenter Footer
          const footerText = "Created with https://kink.hypnose-stammtisch.de";
          context.save();
          context.font = "italic 10px Arial";
          context.fillStyle = "#888888";
          const textMetrics = context.measureText(footerText);
          const padding = 8;
          const x = canvasWidth - textMetrics.width - padding;
          const y = canvasHeight - padding;
          context.fillText(footerText, x, y);
          context.restore();

          downloadImage(canvas, pendingExportName);
          setIsSuccess(true);
          setTimeout(() => setIsSuccess(false), 3000);
        } catch (e) {
          setError("Fehler beim Exportieren des Bildes.");
          console.error(e);
        } finally {
          setIsLoading(false);
          setPendingExportName("");
        }
      })();
    }
  }, [pendingExportName, kinks, levels, selection]);

  // Funktion für umfassende, klare Legende
  const renderComprehensiveLegend = (
    context: CanvasRenderingContext2D,
    levels: any,
    canvasWidth: number,
  ) => {
    context.save();

    const legendY = 30; // Mehr Platz von oben
    const levelNames = Object.keys(levels);

    // Gesamtbreite für die Legende berechnen
    const legendTitleWidth = 70;
    const itemWidth = 90; // Mehr Platz pro Element
    const totalLegendWidth = legendTitleWidth + levelNames.length * itemWidth;

    // Zentrierte Position mit genug Platz
    const legendX = (canvasWidth - totalLegendWidth) / 2;

    // Legendentitel
    context.font = "bold 14px Arial";
    context.fillStyle = "#3f51b5"; // Konsistente Farbe mit Überschriften
    context.fillText("Legende:", legendX, legendY);

    // Legendenhintergrund (dezent)
    context.fillStyle = "rgba(245, 245, 245, 0.5)";
    context.fillRect(legendX - 10, legendY - 25, totalLegendWidth + 20, 60);

    // Circles und Labels
    let currentX = legendX + legendTitleWidth;
    levelNames.forEach((levelName) => {
      const color = levels[levelName].color;

      // Circle
      context.beginPath();
      context.arc(currentX, legendY, 8, 0, 2 * Math.PI); // Größere Kreise
      context.fillStyle = color;
      context.fill();
      context.lineWidth = 1;
      context.strokeStyle = "rgba(0, 0, 0, 0.5)";
      context.stroke();

      // Label
      context.font = "12px Arial"; // Größere Schrift
      context.fillStyle = "#333333";
      context.fillText(levelName, currentX + 12, legendY + 4); // Bessere Positionierung

      currentX += itemWidth;
    });

    // Deutlichere Trennlinie unter der Legende
    context.beginPath();
    context.moveTo(legendX - 10, legendY + 25);
    context.lineTo(legendX + totalLegendWidth + 10, legendY + 25);
    context.strokeStyle = "#3f51b5"; // Konsistente Farbe
    context.lineWidth = 2;
    context.stroke();

    context.restore();
  };

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
