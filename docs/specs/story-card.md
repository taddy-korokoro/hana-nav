# 旅のしおり生成（Canvas API）

サーバーコスト ¥0 のクライアントサイド完結。

| 方式 | コスト | レスポンス |
|---|---|---|
| サーバーサイド（sharp/satori） | サーバー CPU + Vercel Function | 1〜3秒 |
| **クライアントサイド（Canvas API）** ✅ | **¥0** | **即時** |

## `components/StoryCardGenerator.tsx`

```typescript
'use client';

import { useRef, useState } from 'react';

interface StoryCardProps {
  userImageUrl: string;
  flowerName: string;
  flowerLanguage?: string;
  spotName?: string;
  visitedDate: string;
  comment?: string;
}

export default function StoryCardGenerator(props: StoryCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = async () => {
    setIsGenerating(true);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    canvas.width = 1080;
    canvas.height = 1920;

    const img = await loadImage(props.userImageUrl);
    drawImageCover(ctx, img, 0, 0, canvas.width, canvas.height);

    // 下部グラデーションオーバーレイ
    const gradient = ctx.createLinearGradient(0, canvas.height * 0.5, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, canvas.height * 0.5, canvas.width, canvas.height * 0.5);

    // 花名
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 96px "Noto Sans JP", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(props.flowerName, canvas.width / 2, 1450);

    // 花言葉
    if (props.flowerLanguage) {
      ctx.font = 'italic 42px "Noto Sans JP", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.fillText(`〜 ${props.flowerLanguage} 〜`, canvas.width / 2, 1530);
    }

    // スポット名
    if (props.spotName) {
      ctx.font = '48px "Noto Sans JP", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText(`@ ${props.spotName}`, canvas.width / 2, 1620);
    }

    // 日付
    ctx.font = '36px "Noto Sans JP", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(props.visitedDate, canvas.width / 2, 1700);

    // コメント
    if (props.comment) {
      ctx.font = '40px "Noto Sans JP", sans-serif';
      wrapText(ctx, `"${props.comment}"`, canvas.width / 2, 1790, canvas.width - 200, 50);
    }

    // ロゴ（右下）
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText('🌸 hana nav', canvas.width - 60, canvas.height - 60);

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setIsGenerating(false);
      }
    }, 'image/png');
  };

  const loadImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

  const drawImageCover = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number, y: number, w: number, h: number
  ) => {
    const imgRatio = img.width / img.height;
    const canvasRatio = w / h;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;

    if (imgRatio > canvasRatio) {
      sw = img.height * canvasRatio;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / canvasRatio;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  };

  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string, x: number, y: number,
    maxWidth: number, lineHeight: number
  ) => {
    const words = text.split('');
    let line = '';
    let yPos = y;
    for (const char of words) {
      const testLine = line + char;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, x, yPos);
        line = char;
        yPos += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, yPos);
  };

  const shareToSns = async () => {
    if (!downloadUrl) return;
    const blob = await fetch(downloadUrl).then(r => r.blob());
    const file = new File([blob], 'hananav-story.png', { type: 'image/png' });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: '旅のしおり | hana nav',
          text: `${props.flowerName}を見つけました🌸 #花ナビ`,
        });
      } catch (err) {
        console.log('シェアキャンセル', err);
      }
    } else {
      // フォールバック：ダウンロード
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'hananav-story.png';
      a.click();
    }
  };

  return (
    <div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <button onClick={generate} disabled={isGenerating}>
        {isGenerating ? '生成中...' : '🎨 旅のしおりを作る'}
      </button>
      {downloadUrl && (
        <>
          <img src={downloadUrl} alt="preview" style={{ maxWidth: '300px' }} />
          <button onClick={shareToSns}>📤 SNSにシェア</button>
        </>
      )}
    </div>
  );
}
```
