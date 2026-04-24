import Papa from 'papaparse';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { AppExportBundle, GeneratedCardText, GeneratedPrompt, TextStyle } from '../types';

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadJsonFile(filename: string, data: unknown): void {
  downloadTextFile(filename, JSON.stringify(data, null, 2));
}

export function promptsToText(prompts: GeneratedPrompt[]): string {
  return prompts
    .map((prompt, index) => `# ${index + 1} ${prompt.title}\n${prompt.content}`)
    .join('\n\n');
}

export function cardTextsToCsv(cardTexts: GeneratedCardText[]): string {
  return Papa.unparse(
    cardTexts.map((item) => ({
      id: item.id,
      text: item.text,
      roundTypeId: item.roundTypeId,
      themeId: item.themeId,
      version: item.version,
      tone: item.tone
    }))
  );
}

export function parseCardTextCsv(content: string): string[] {
  const result = Papa.parse<Record<string, string>>(content, { header: true });
  return result.data
    .map((row) => row.text?.trim())
    .filter((text): text is string => Boolean(text));
}

export function parseCardTextJson(content: string): string[] {
  const parsed = JSON.parse(content) as Array<{ text?: string }>;
  return parsed
    .map((entry) => entry.text?.trim())
    .filter((text): text is string => Boolean(text));
}

interface PngExportOptions {
  textStyle: TextStyle;
  frontDesignDataUrl: string;
  backDesignDataUrl: string;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement | null> {
  if (!dataUrl) return Promise.resolve(null);

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = dataUrl;
  });
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function drawContainedImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const imageRatio = image.width / image.height;
  const targetRatio = width / height;

  let drawWidth = width;
  let drawHeight = height;

  if (imageRatio > targetRatio) {
    drawHeight = width / imageRatio;
  } else {
    drawWidth = height * imageRatio;
  }

  const offsetX = x + (width - drawWidth) / 2;
  const offsetY = y + (height - drawHeight) / 2;
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function drawOutlinedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  style: TextStyle
): void {
  const isRed = style === 'red-white-outline';
  context.font = 'bold 32px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.lineWidth = 6;
  context.strokeStyle = isRed ? '#ffffff' : '#000000';
  context.fillStyle = isRed ? '#ff2d2d' : '#ffffff';

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = context.measureText(testLine).width;
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) lines.push(currentLine);

  const lineHeight = 38;
  const startY = y - ((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, index) => {
    const lineY = startY + index * lineHeight;
    context.strokeText(line, x, lineY);
    context.fillText(line, x, lineY);
  });
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to generate PNG blob'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

async function renderCardPng(
  text: string,
  textStyle: TextStyle,
  designImage: HTMLImageElement | null,
  isBack: boolean
): Promise<Blob> {
  const width = 1000;
  const height = 1400;
  const padding = 36;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas context unavailable');
  }

  context.clearRect(0, 0, width, height);
  drawRoundedRect(context, padding, padding, width - padding * 2, height - padding * 2, 52);
  context.fillStyle = '#171717';
  context.fill();
  context.lineWidth = 10;
  context.strokeStyle = '#ffffff';
  context.stroke();
  context.save();
  drawRoundedRect(context, padding, padding, width - padding * 2, height - padding * 2, 52);
  context.clip();

  if (designImage) {
    drawContainedImage(context, designImage, padding, padding, width - padding * 2, height - padding * 2);
  } else {
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#56006f');
    gradient.addColorStop(0.5, '#ff2ea2');
    gradient.addColorStop(1, '#ff8c24');
    context.fillStyle = gradient;
    context.fillRect(padding, padding, width - padding * 2, height - padding * 2);
  }

  if (isBack) {
    drawOutlinedText(context, 'Pants on Fire!', width / 2, height / 2 - 80, width - 220, textStyle);
    drawOutlinedText(context, 'Find the Liar', width / 2, height / 2 + 40, width - 220, textStyle);
  } else {
    drawOutlinedText(context, text, width / 2, height / 2, width - 240, textStyle);
  }

  context.restore();
  return canvasToBlob(canvas);
}

export async function exportPngCardsZip(
  deckName: string,
  cardTexts: string[],
  options: PngExportOptions
): Promise<void> {
  const zip = new JSZip();
  const frontsFolder = zip.folder('fronts');
  const backsFolder = zip.folder('backs');

  if (!frontsFolder || !backsFolder) {
    throw new Error('Failed to initialize ZIP folders');
  }

  const [frontImage, backImage] = await Promise.all([
    loadImage(options.frontDesignDataUrl),
    loadImage(options.backDesignDataUrl)
  ]);

  for (let index = 0; index < cardTexts.length; index += 1) {
    const text = cardTexts[index];
    const frontBlob = await renderCardPng(text, options.textStyle, frontImage, false);
    const backBlob = await renderCardPng('', options.textStyle, backImage, true);
    const fileName = `card-${String(index + 1).padStart(3, '0')}.png`;
    frontsFolder.file(fileName, frontBlob);
    backsFolder.file(fileName, backBlob);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${deckName || 'pants-on-fire-deck'}-png-cards.zip`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function exportDeckZip(
  deckName: string,
  frontDesignDataUrl: string,
  backDesignDataUrl: string,
  cardTexts: string[],
  textStyle: TextStyle
): Promise<void> {
  const zip = new JSZip();
  const [frontImage, backImage] = await Promise.all([loadImage(frontDesignDataUrl), loadImage(backDesignDataUrl)]);

  if (frontDesignDataUrl) {
    zip.file('front-design.txt', frontDesignDataUrl);
  }

  if (backDesignDataUrl) {
    zip.file('back-design.txt', backDesignDataUrl);
  }

  zip.file('card-texts.csv', Papa.unparse(cardTexts.map((text, index) => ({ index: index + 1, text }))));

  cardTexts.forEach((text, index) => {
    zip.file(`cards/card-${String(index + 1).padStart(3, '0')}.txt`, text);
  });

  const pngFolder = zip.folder('png-cards');
  if (pngFolder) {
    for (let index = 0; index < cardTexts.length; index += 1) {
      const frontBlob = await renderCardPng(cardTexts[index], textStyle, frontImage, false);
      const backBlob = await renderCardPng('', textStyle, backImage, true);
      const basename = `card-${String(index + 1).padStart(3, '0')}`;
      pngFolder.file(`${basename}-front.png`, frontBlob);
      pngFolder.file(`${basename}-back.png`, backBlob);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${deckName || 'pants-on-fire-deck'}.zip`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportDeckPdf(
  title: string,
  cardTexts: string[],
  cardsPerPage: 8 | 9 | 10,
  includeBack: boolean
): void {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 10;
  const usableWidth = 190;
  const usableHeight = 277;
  const cols = cardsPerPage >= 9 ? 3 : 2;
  const rows = Math.ceil(cardsPerPage / cols);
  const cellWidth = usableWidth / cols;
  const cellHeight = usableHeight / rows;

  let cardIndex = 0;

  function drawPage(isBackPage: boolean): void {
    pdf.setFontSize(10);
    pdf.text(`${title} ${isBackPage ? 'Back' : 'Front'}`, margin, 6);

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (cardIndex >= cardTexts.length) return;

        const x = margin + col * cellWidth;
        const y = margin + row * cellHeight;
        pdf.rect(x, y, cellWidth - 2, cellHeight - 2, 'S');

        if (isBackPage) {
          pdf.setFontSize(12);
          pdf.text('Pants on Fire!', x + 4, y + 12);
          pdf.setFontSize(9);
          pdf.text('Find the Liar', x + 4, y + 18);
        } else {
          const wrapped = pdf.splitTextToSize(cardTexts[cardIndex], cellWidth - 8);
          pdf.setFontSize(8);
          pdf.text(wrapped, x + 4, y + 12);
          cardIndex += 1;
        }
      }
    }
  }

  while (cardIndex < cardTexts.length) {
    drawPage(false);

    if (cardIndex < cardTexts.length) {
      pdf.addPage();
    }
  }

  if (includeBack) {
    pdf.addPage();
    cardIndex = 0;
    while (cardIndex < cardTexts.length) {
      drawPage(true);
      for (let i = 0; i < cardsPerPage; i += 1) {
        cardIndex += 1;
      }
      if (cardIndex < cardTexts.length) {
        pdf.addPage();
      }
    }
  }

  pdf.save(`${title || 'pants-on-fire-deck'}.pdf`);
}

export function copyToClipboard(content: string): Promise<void> {
  return navigator.clipboard.writeText(content);
}

export function createAppExportBundle(bundle: AppExportBundle): AppExportBundle {
  return bundle;
}
