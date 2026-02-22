/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Timer, 
  RotateCcw, 
  Play, 
  Pause, 
  ChevronRight,
  AlertCircle,
  Zap
} from 'lucide-react';
import { GRID_COLS, GRID_ROWS, INITIAL_ROWS, MIN_VALUE, MAX_VALUE, MIN_TARGET, MAX_TARGET, TIME_LIMIT } from './constants';
import { BlockData, GameMode, GameState } from './types';

const generateId = () => Math.random().toString(36).substring(2, 9);

const getRandomValue = () => Math.floor(Math.random() * (MAX_VALUE - MIN_VALUE + 1)) + MIN_VALUE;

const getRandomTarget = () => Math.floor(Math.random() * (MAX_TARGET - MIN_TARGET + 1)) + MIN_TARGET;

const COLORS = [
  '#FF5F5F', // Red
  '#5F9FFF', // Blue
  '#5FFF9F', // Green
  '#FFBF5F', // Orange
  '#BF5FFF', // Purple
  '#5FFFFF', // Cyan
  '#FF5FFF', // Pink
];

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

export default function App() {
  const [mode, setMode] = useState<GameMode | null>(null);
  const [grid, setGrid] = useState<BlockData[]>([]);
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [isPaused, setIsPaused] = useState(false);
  const [highScore, setHighScore] = useState(0);

  // Initialize game
  const initGame = useCallback((selectedMode: GameMode) => {
    const initialGrid: BlockData[] = [];
    for (let r = GRID_ROWS - INITIAL_ROWS; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        initialGrid.push({
          id: generateId(),
          value: getRandomValue(),
          row: r,
          col: c,
          isSelected: false,
          color: getRandomColor(),
        });
      }
    }
    setGrid(initialGrid);
    setScore(0);
    setTarget(getRandomTarget());
    setSelectedIds([]);
    setIsGameOver(false);
    setMode(selectedMode);
    setTimeLeft(TIME_LIMIT);
    setIsPaused(false);
  }, []);

  // Add a new row at the bottom
  const addNewRow = useCallback(() => {
    setGrid(prev => {
      // Check for game over: if any block is at row 0
      const willGameOver = prev.some(b => b.row === 0);
      if (willGameOver) {
        setIsGameOver(true);
        return prev;
      }

      // Move existing blocks up
      const movedGrid = prev.map(b => ({ ...b, row: b.row - 1 }));
      
      // Add new row at GRID_ROWS - 1
      const newRow: BlockData[] = [];
      for (let c = 0; c < GRID_COLS; c++) {
        newRow.push({
          id: generateId(),
          value: getRandomValue(),
          row: GRID_ROWS - 1,
          col: c,
          isSelected: false,
          color: getRandomColor(),
        });
      }
      
      return [...movedGrid, ...newRow];
    });
    
    if (mode === 'time') {
      setTimeLeft(TIME_LIMIT);
    }
  }, [mode]);

  // Handle block selection
  const toggleBlock = (id: string) => {
    if (isGameOver || isPaused) return;

    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Calculate current sum
  const currentSum = useMemo(() => {
    return grid
      .filter(b => selectedIds.includes(b.id))
      .reduce((sum, b) => sum + b.value, 0);
  }, [grid, selectedIds]);

  // Check sum and eliminate
  useEffect(() => {
    if (currentSum === target && target > 0) {
      // Success!
      setScore(prev => prev + selectedIds.length * 10);
      
      setGrid(prev => {
        // 1. Remove selected blocks
        const remaining = prev.filter(b => !selectedIds.includes(b.id));
        
        // 2. Apply gravity column by column
        const newGrid: BlockData[] = [];
        for (let c = 0; c < GRID_COLS; c++) {
          const colBlocks = remaining
            .filter(b => b.col === c)
            .sort((a, b) => b.row - a.row); // Bottom to top
          
          colBlocks.forEach((b, index) => {
            newGrid.push({
              ...b,
              row: GRID_ROWS - 1 - index // Place at the lowest possible row
            });
          });
        }
        return newGrid;
      });

      setSelectedIds([]);
      setTarget(getRandomTarget());
      
      if (mode === 'classic') {
        addNewRow();
      } else if (mode === 'time') {
        setTimeLeft(TIME_LIMIT);
      }
    } else if (currentSum > target) {
      // Failed - clear selection
      setSelectedIds([]);
    }
  }, [currentSum, target, selectedIds, addNewRow, mode]);

  // Timer logic for Time Mode
  useEffect(() => {
    if (mode === 'time' && !isGameOver && !isPaused) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            addNewRow();
            return TIME_LIMIT;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [mode, isGameOver, isPaused, addNewRow]);

  // High score persistence
  useEffect(() => {
    const saved = localStorage.getItem('sum-eliminate-highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('sum-eliminate-highscore', score.toString());
    }
  }, [score, highScore]);

  // Ensure at least 4 rows of blocks (4 rows * 6 columns = 24 blocks)
  useEffect(() => {
    if (mode && !isGameOver && !isPaused) {
      if (grid.length < 24) {
        addNewRow();
      }
    }
  }, [grid.length, mode, isGameOver, isPaused, addNewRow]);

  if (!mode) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-[#1A1A1A] border-2 border-[#D4AF37] shadow-[8px_8px_0px_0px_rgba(212,175,55,0.3)] p-8"
        >
          <div className="flex flex-col gap-1 mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#D4AF37] flex items-center justify-center">
                <Zap className="text-black" size={20} />
              </div>
              <h1 className="text-4xl font-black tracking-tighter uppercase italic text-[#D4AF37]">Sum Eliminate</h1>
            </div>
            <h2 className="text-2xl font-bold tracking-widest text-white/90 border-l-4 border-[#D4AF37] pl-3">数字消除</h2>
          </div>
          
          <p className="text-white/60 mb-8 font-medium leading-relaxed">
            选择数字凑齐目标总和，防止方块触顶！<br/>
            Select numbers to reach the target sum. Don't let the blocks reach the top!
          </p>

          <div className="space-y-4">
            <button 
              onClick={() => initGame('classic')}
              className="w-full group flex items-center justify-between p-4 border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all"
            >
              <div className="text-left">
                <span className="block font-bold uppercase tracking-tight">经典模式 Classic Mode</span>
                <span className="text-xs opacity-80">成功后新增一行 Add a row after each success</span>
              </div>
              <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button 
              onClick={() => initGame('time')}
              className="w-full group flex items-center justify-between p-4 border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all"
            >
              <div className="text-left">
                <span className="block font-bold uppercase tracking-tight">计时模式 Time Mode</span>
                <span className="text-xs opacity-80">在倒计时结束前完成 Race against the clock</span>
              </div>
              <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {highScore > 0 && (
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-sm">
              <span className="font-mono uppercase opacity-50 text-white">历史最高 All-time Best</span>
              <span className="font-mono font-bold text-[#D4AF37]">{highScore}</span>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-white">
      {/* Header */}
      <header className="max-w-xl mx-auto pt-8 px-4 flex items-center justify-between mb-8">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">目标 Target</span>
          <span className="text-5xl font-bold font-mono leading-none tracking-tighter">{target}</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">得分 Score</span>
            <span className="text-2xl font-bold font-mono">{score}</span>
          </div>
          
          {mode === 'time' && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">时间 Time</span>
              <div className="flex items-center gap-2">
                <Timer size={16} className={timeLeft <= 3 ? "text-red-500 animate-pulse" : ""} />
                <span className={`text-2xl font-bold font-mono ${timeLeft <= 3 ? "text-red-500" : ""}`}>
                  {timeLeft}s
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Game Board */}
      <main className="max-w-xl mx-auto px-4 pb-12">
        <div className="relative aspect-[6/12] w-full bg-white border-2 border-[#141414] shadow-[12px_12px_0px_0px_rgba(20,20,20,1)] overflow-hidden">
          {/* Grid Lines */}
          <div className="absolute inset-0 grid grid-cols-6 pointer-events-none opacity-[0.03]">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border-r border-[#141414]" />
            ))}
          </div>
          <div className="absolute inset-0 grid grid-rows-12 pointer-events-none opacity-[0.03]">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="border-b border-[#141414]" />
            ))}
          </div>

          {/* Warning Line */}
          <div className="absolute top-[8.33%] left-0 right-0 border-t-2 border-dashed border-red-500/20 z-0" />

          {/* Blocks */}
          <AnimatePresence mode="popLayout">
            {grid.map((block) => (
              <motion.button
                key={block.id}
                layout
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  left: `${block.col * (100 / GRID_COLS)}%`,
                  top: `${block.row * (100 / GRID_ROWS)}%`,
                }}
                exit={{ scale: 1.2, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                onClick={() => toggleBlock(block.id)}
                style={{
                  backgroundColor: selectedIds.includes(block.id) ? '#141414' : block.color,
                  color: 'white',
                }}
                className={`absolute w-[16.66%] h-[8.33%] flex items-center justify-center border border-black/10 transition-colors shadow-inner
                  ${selectedIds.includes(block.id) ? 'z-10 ring-4 ring-inset ring-white/30' : 'z-0'}
                `}
              >
                <span className="text-2xl font-bold font-mono drop-shadow-md">{block.value}</span>
              </motion.button>
            ))}
          </AnimatePresence>

          {/* Current Selection Info */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-50 pointer-events-none">
            <div className="px-3 py-1 bg-white border-2 border-[#141414] text-xs font-mono font-bold uppercase shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              总和 Sum: {currentSum} / {target}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex items-center justify-between">
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="p-3 border-2 border-[#141414] hover:bg-[#141414] hover:text-white transition-colors"
          >
            {isPaused ? <Play size={20} /> : <Pause size={20} />}
          </button>

          <div className="flex gap-4">
            <button 
              onClick={() => setMode(null)}
              className="px-6 py-2 border-2 border-[#141414] font-bold uppercase tracking-tighter hover:bg-[#141414] hover:text-white transition-colors"
            >
              菜单 Menu
            </button>
            <button 
              onClick={() => initGame(mode)}
              className="p-3 border-2 border-[#141414] hover:bg-[#141414] hover:text-white transition-colors"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>
      </main>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#E4E3E0]/90 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-sm w-full bg-white border-2 border-[#141414] shadow-[12px_12px_0px_0px_rgba(20,20,20,1)] p-8 text-center"
            >
              <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
              <h2 className="text-4xl font-bold uppercase tracking-tighter italic mb-2">游戏结束 Game Over</h2>
              <p className="text-[#141414]/60 mb-8 font-medium">方块已触顶！ The blocks reached the top!</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-[#141414]/5 border border-[#141414]/10">
                  <span className="block text-[10px] font-mono uppercase opacity-50 mb-1">得分 Score</span>
                  <span className="text-2xl font-bold font-mono">{score}</span>
                </div>
                <div className="p-4 bg-[#141414]/5 border border-[#141414]/10">
                  <span className="block text-[10px] font-mono uppercase opacity-50 mb-1">最高 Best</span>
                  <span className="text-2xl font-bold font-mono">{highScore}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => initGame(mode)}
                  className="w-full py-4 bg-[#141414] text-white font-bold uppercase tracking-tight hover:bg-[#141414]/90 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} /> 再来一局 Try Again
                </button>
                <button 
                  onClick={() => setMode(null)}
                  className="w-full py-4 border-2 border-[#141414] font-bold uppercase tracking-tight hover:bg-[#141414] hover:text-white transition-colors"
                >
                  主菜单 Main Menu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pause Overlay */}
      <AnimatePresence>
        {isPaused && !isGameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#E4E3E0]/60 backdrop-blur-[2px] z-40 flex items-center justify-center"
          >
            <button 
              onClick={() => setIsPaused(false)}
              className="group flex flex-col items-center gap-4"
            >
              <div className="w-20 h-20 bg-white border-2 border-[#141414] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] flex items-center justify-center group-hover:bg-[#141414] group-hover:text-white transition-all">
                <Play size={32} fill="currentColor" />
              </div>
              <span className="font-bold uppercase tracking-widest text-sm">已暂停 Paused</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
