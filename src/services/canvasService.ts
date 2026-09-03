import type { Point } from '../types/annotation';

export interface DrawingStroke {
  points: Point[];
  color: string;
  width: number;
  opacity: number;
  isHighlighter?: boolean;
}

export interface ShapeStyle {
  strokeColor: string;
  strokeWidth: number;
  fillColor?: string;
  opacity?: number;
  lineDash?: number[];
}

export class CanvasService {
  /**
   * Draws a smooth freehand stroke using midpoint quadratic bezier interpolation.
   */
  public drawSmoothStroke(ctx: CanvasRenderingContext2D, stroke: DrawingStroke): void {
    if (stroke.points.length === 0) return;

    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = stroke.opacity;

    if (stroke.isHighlighter) {
      ctx.globalCompositeOperation = 'multiply';
    }

    if (stroke.points.length === 1) {
      const p = stroke.points[0];
      ctx.arc(p.x, p.y, stroke.width / 2, 0, Math.PI * 2);
      ctx.fillStyle = stroke.color;
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length - 1; i++) {
      const p1 = stroke.points[i];
      const p2 = stroke.points[i + 1];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
    }

    const last = stroke.points[stroke.points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Draws geometric shapes: rectangle, circle, line, arrow.
   */
  public drawShape(
    ctx: CanvasRenderingContext2D,
    type: 'rect' | 'circle' | 'line' | 'arrow',
    start: Point,
    end: Point,
    style: ShapeStyle
  ): void {
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = style.strokeColor;
    ctx.lineWidth = style.strokeWidth;
    ctx.globalAlpha = style.opacity ?? 1.0;

    if (style.lineDash) {
      ctx.setLineDash(style.lineDash);
    }

    switch (type) {
      case 'rect': {
        const x = Math.min(start.x, end.x);
        const y = Math.min(start.y, end.y);
        const w = Math.abs(end.x - start.x);
        const h = Math.abs(end.y - start.y);

        if (style.fillColor && style.fillColor !== 'transparent') {
          ctx.fillStyle = style.fillColor;
          ctx.fillRect(x, y, w, h);
        }
        if (style.strokeWidth > 0) {
          ctx.strokeRect(x, y, w, h);
        }
        break;
      }
      case 'circle': {
        const rx = Math.abs(end.x - start.x) / 2;
        const ry = Math.abs(end.y - start.y) / 2;
        const cx = Math.min(start.x, end.x) + rx;
        const cy = Math.min(start.y, end.y) + ry;

        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        if (style.fillColor && style.fillColor !== 'transparent') {
          ctx.fillStyle = style.fillColor;
          ctx.fill();
        }
        if (style.strokeWidth > 0) {
          ctx.stroke();
        }
        break;
      }
      case 'line': {
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        break;
      }
      case 'arrow': {
        this.drawArrowLine(ctx, start, end, style.strokeWidth * 3.5);
        ctx.stroke();
        break;
      }
    }

    ctx.restore();
  }

  /**
   * Helper to draw a directed arrow with arrowhead.
   */
  private drawArrowLine(
    ctx: CanvasRenderingContext2D,
    from: Point,
    to: Point,
    headLength: number = 15
  ): void {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);

    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);

    ctx.lineTo(
      to.x - headLength * Math.cos(angle - Math.PI / 6),
      to.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(
      to.x - headLength * Math.cos(angle + Math.PI / 6),
      to.y - headLength * Math.sin(angle + Math.PI / 6)
    );
  }

  /**
   * Removes white/light backgrounds from uploaded signatures with soft anti-aliased alpha falloff.
   */
  public removeWhiteBackground(
    sourceCanvas: HTMLCanvasElement,
    threshold: number = 235
  ): HTMLCanvasElement {
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = sourceCanvas.width;
    outputCanvas.height = sourceCanvas.height;

    const ctx = outputCanvas.getContext('2d');
    if (!ctx) return sourceCanvas;

    ctx.drawImage(sourceCanvas, 0, 0);
    const imgData = ctx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

      if (brightness >= threshold) {
        data[i + 3] = 0; // Pure transparent
      } else if (brightness > threshold - 40) {
        // Soft alpha transition
        const alphaFactor = (threshold - brightness) / 40;
        data[i + 3] = Math.round(data[i + 3] * alphaFactor);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return outputCanvas;
  }

  /**
   * Converts HTMLCanvasElement to Blob with Promise.
   */
  public canvasToBlob(
    canvas: HTMLCanvasElement,
    mimeType: string = 'image/png',
    quality: number = 0.92
  ): Promise<Blob> {
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas to Blob conversion returned null'));
        },
        mimeType,
        quality
      );
    });
  }

  /**
   * Creates an Offscreen Canvas or standard Canvas helper.
   */
  public createCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    return { canvas, ctx };
  }

  /**
   * Cleans canvas dimensions to release GPU / browser raster memory.
   */
  public disposeCanvas(canvas: HTMLCanvasElement): void {
    canvas.width = 0;
    canvas.height = 0;
  }
}

export const canvasService = new CanvasService();
