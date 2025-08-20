import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';

const duckRabbitImage = '/lovable-uploads/7dc8cb48-5dd1-4e36-9594-dceeed5c7e9f.png';

interface GameState {
  bird: {
    x: number;
    y: number;
    velocity: number;
    size: number;
  };
  pipes: Array<{
    x: number;
    height: number;
    gap: number;
    passed: boolean;
  }>;
  score: number;
  gameOver: boolean;
  gameStarted: boolean;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const BIRD_SIZE = 80; // Made even bigger
const PIPE_WIDTH = 80;
const PIPE_GAP = 220; // Made easier with bigger gap
const GRAVITY = 0.5; // Gentler gravity
const JUMP_FORCE = -10; // Gentler jump
const PIPE_SPEED = 2.5; // Slower pipes

export const FlappyGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [gameState, setGameState] = useState<GameState>({
    bird: {
      x: 150,
      y: GAME_HEIGHT / 2,
      velocity: 0,
      size: BIRD_SIZE,
    },
    pipes: [],
    score: 0,
    gameOver: false,
    gameStarted: false,
  });

  const [duckRabbit, setDuckRabbit] = useState<HTMLImageElement | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Simple function to remove white background from image
  const removeWhiteBackground = (img: HTMLImageElement): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    // Draw the original image
    ctx.drawImage(img, 0, 0);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Make white/near-white pixels transparent
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // If pixel is white or very light (near white), make it transparent
      if (r > 240 && g > 240 && b > 240) {
        data[i + 3] = 0; // Set alpha to 0 (transparent)
      }
    }
    
    // Put the modified image data back
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };

  // Load and process duck-rabbit image
  useEffect(() => {
    const processImage = async () => {
      try {
        setIsProcessingImage(true);
        console.log('Loading duck-rabbit image...');
        
        // Load original image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          try {
            // Remove white background
            const processedCanvas = removeWhiteBackground(img);
            
            // Create new image from processed canvas
            const processedImg = new Image();
            processedImg.onload = () => {
              setDuckRabbit(processedImg);
              console.log('Duck-rabbit image processed successfully!');
              setIsProcessingImage(false);
            };
            processedImg.src = processedCanvas.toDataURL('image/png');
          } catch (error) {
            console.error('Failed to process image:', error);
            // Use original image as fallback
            setDuckRabbit(img);
            setIsProcessingImage(false);
          }
        };
        
        img.onerror = () => {
          console.error('Failed to load image');
          setIsProcessingImage(false);
        };
        
        img.src = duckRabbitImage;
      } catch (error) {
        console.error('Failed to process duck-rabbit image:', error);
        setIsProcessingImage(false);
      }
    };

    processImage();
  }, []);

  const jump = useCallback(() => {
    if (!gameState.gameStarted) {
      setGameState(prev => ({ ...prev, gameStarted: true }));
      return;
    }
    
    if (gameState.gameOver) return;
    
    setGameState(prev => ({
      ...prev,
      bird: {
        ...prev.bird,
        velocity: JUMP_FORCE,
      },
    }));
  }, [gameState.gameStarted, gameState.gameOver]);

  const resetGame = () => {
    setGameState({
      bird: {
        x: 150,
        y: GAME_HEIGHT / 2,
        velocity: 0,
        size: BIRD_SIZE,
      },
      pipes: [],
      score: 0,
      gameOver: false,
      gameStarted: false,
    });
  };

  const drawHandDrawnRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    ctx.beginPath();
    
    // Create wobbly hand-drawn lines
    const wobble = 4; // Increase wobble amount
    const steps = 8; // More steps for more wobbly effect
    
    // Top line
    ctx.moveTo(x + (Math.random() - 0.5) * wobble, y + (Math.random() - 0.5) * wobble);
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      const currentX = x + width * progress + (Math.random() - 0.5) * wobble;
      const currentY = y + (Math.random() - 0.5) * wobble;
      ctx.lineTo(currentX, currentY);
    }
    
    // Right line
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      const currentX = x + width + (Math.random() - 0.5) * wobble;
      const currentY = y + height * progress + (Math.random() - 0.5) * wobble;
      ctx.lineTo(currentX, currentY);
    }
    
    // Bottom line
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      const currentX = x + width - width * progress + (Math.random() - 0.5) * wobble;
      const currentY = y + height + (Math.random() - 0.5) * wobble;
      ctx.lineTo(currentX, currentY);
    }
    
    // Left line
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      const currentX = x + (Math.random() - 0.5) * wobble;
      const currentY = y + height - height * progress + (Math.random() - 0.5) * wobble;
      ctx.lineTo(currentX, currentY);
    }
    
    ctx.closePath();
    ctx.stroke();
  };

  const gameLoop = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with paper background
    ctx.fillStyle = '#faf9f7';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (!gameState.gameStarted) {
      // Draw start screen
      ctx.fillStyle = '#000';
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Flappy Duck-Rabbit', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);
      ctx.font = '18px monospace';
      ctx.fillText('Click to start!', GAME_WIDTH / 2, GAME_HEIGHT / 2);
      
      // Draw duck-rabbit in center
      if (duckRabbit) {
        ctx.drawImage(duckRabbit, gameState.bird.x - BIRD_SIZE / 2, gameState.bird.y - BIRD_SIZE / 2, BIRD_SIZE, BIRD_SIZE);
      }
      
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    if (gameState.gameOver) {
      // Draw game over screen
      ctx.fillStyle = '#000';
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);
      ctx.font = '20px monospace';
      ctx.fillText(`Score: ${gameState.score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);
      ctx.font = '16px monospace';
      ctx.fillText('Click Reset to play again', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);
      return;
    }

    // Update bird physics
    setGameState(prev => {
      const newBird = {
        ...prev.bird,
        y: prev.bird.y + prev.bird.velocity,
        velocity: prev.bird.velocity + GRAVITY,
      };

      // Check boundaries
      if (newBird.y < 0 || newBird.y > GAME_HEIGHT - newBird.size) {
        return { ...prev, gameOver: true };
      }

      // Update pipes
      let newPipes = [...prev.pipes];
      let newScore = prev.score;

      // Add new pipes with more spacing
      if (newPipes.length === 0 || newPipes[newPipes.length - 1].x < GAME_WIDTH - 350) {
        newPipes.push({
          x: GAME_WIDTH,
          height: Math.random() * (GAME_HEIGHT - PIPE_GAP - 100) + 50,
          gap: PIPE_GAP,
          passed: false,
        });
      }

      // Move pipes and check collisions
      newPipes = newPipes.map(pipe => {
        const updatedPipe = { ...pipe, x: pipe.x - PIPE_SPEED };

        // Check if bird passed pipe
        if (!updatedPipe.passed && updatedPipe.x + PIPE_WIDTH < newBird.x) {
          updatedPipe.passed = true;
          newScore += 1;
        }

        return updatedPipe;
      });

      // Check collisions separately to avoid type issues
      const hasCollision = newPipes.some(pipe => 
        newBird.x < pipe.x + PIPE_WIDTH &&
        newBird.x + newBird.size > pipe.x &&
        (newBird.y < pipe.height || newBird.y + newBird.size > pipe.height + pipe.gap)
      );

      if (hasCollision) {
        return { ...prev, gameOver: true };
      }

      // Filter out off-screen pipes
      const filteredPipes = newPipes.filter(pipe => pipe.x > -PIPE_WIDTH);

      return {
        ...prev,
        bird: newBird,
        pipes: filteredPipes,
        score: newScore,
      };
    });

    // Draw bird (duck-rabbit) with mirroring
    if (duckRabbit) {
      ctx.save();
      ctx.translate(gameState.bird.x, gameState.bird.y);
      
      // Mirror horizontally and vertically for variety
      const shouldMirrorX = gameState.bird.velocity > 0; // Mirror when falling
      const shouldMirrorY = false; // Keep Y normal for now
      
      if (shouldMirrorX) ctx.scale(-1, 1);
      if (shouldMirrorY) ctx.scale(1, -1);
      
      // Rotate based on velocity for more dynamic movement
      ctx.rotate(Math.min(gameState.bird.velocity * 0.1, 1));
      
      ctx.drawImage(duckRabbit, -BIRD_SIZE / 2, -BIRD_SIZE / 2, BIRD_SIZE, BIRD_SIZE);
      ctx.restore();
    }

    // Draw pipes with hand-drawn style
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    
    gameState.pipes.forEach(pipe => {
      // Top pipe
      drawHandDrawnRect(ctx, pipe.x, 0, PIPE_WIDTH, pipe.height);
      // Bottom pipe
      drawHandDrawnRect(ctx, pipe.x, pipe.height + pipe.gap, PIPE_WIDTH, GAME_HEIGHT - pipe.height - pipe.gap);
    });

    // Draw score
    ctx.fillStyle = '#000';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(gameState.score.toString(), 30, 50);

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, duckRabbit]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameLoop]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [jump]);

  return (
    <div className="flex flex-col items-center gap-4 bg-paper min-h-screen p-8">
      <h1 className="text-4xl font-bold text-ink mb-4">Flappy Duck-Rabbit</h1>
      
      {isProcessingImage && (
        <div className="text-ink-light">Processing duck-rabbit image...</div>
      )}
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          onClick={jump}
          className="border-4 border-ink bg-paper cursor-pointer shadow-lg"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      <div className="flex gap-4">
        <Button 
          onClick={jump}
          variant="outline"
          className="border-ink text-ink hover:bg-ink hover:text-paper"
        >
          {!gameState.gameStarted ? 'Start Game' : 'Jump'}
        </Button>
        
        <Button 
          onClick={resetGame}
          variant="outline"
          className="border-ink text-ink hover:bg-ink hover:text-paper"
        >
          Reset Game
        </Button>
      </div>

      <div className="text-center text-ink-light">
        <p>Click the canvas or press SPACE to jump!</p>
        <p>Score: {gameState.score}</p>
      </div>
    </div>
  );
};