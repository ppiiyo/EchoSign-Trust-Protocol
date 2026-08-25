import React, { useState, useEffect } from 'react';
import {
  Link2,
  ShieldAlert,
  ShieldCheck,
  RotateCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Wrench,
  Boxes
} from 'lucide-react';
import { Block, ChainStats } from '../types';

interface BlockchainExplorerProps {
  onChainUpdate?: () => void;
}

export const BlockchainExplorer: React.FC<BlockchainExplorerProps> = ({ onChainUpdate }) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [stats, setStats] = useState<ChainStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tamperMessage, setTamperMessage] = useState<string | null>(null);

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/blockchain/blocks');
      const data = await res.json();
      setBlocks(data.chain || []);
      setStats(data.stats || null);
      if (onChainUpdate) onChainUpdate();
    } catch (err) {
      console.error('Failed to load blocks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  const handleTamper = async (blockIndex: number) => {
    try {
      const res = await fetch('/api/v1/blockchain/tamper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockIndex })
      });
      const data = await res.json();
      setTamperMessage(data.message);
      fetchBlocks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRepair = async () => {
    try {
      const res = await fetch('/api/v1/blockchain/repair', { method: 'POST' });
      const data = await res.json();
      setTamperMessage(data.message);
      fetchBlocks();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredBlocks = searchQuery
    ? blocks.filter(
        (b) =>
          b.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.previousHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
          JSON.stringify(b.data).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : blocks;

  return (
    <div className="space-y-6">
      {/* Overview Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="text-[11px] text-slate-400 font-mono uppercase">Всего Блоков в Цепочке</div>
          <div className="text-2xl font-black text-slate-100 font-mono mt-1">
            {stats?.totalBlocks || blocks.length}
          </div>
          <div className="text-[10px] text-cyan-400 mt-1">Неизменяемый реестр</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="text-[11px] text-slate-400 font-mono uppercase">Транзакций Верификации</div>
          <div className="text-2xl font-black text-slate-100 font-mono mt-1">
            {stats?.totalTransactions || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Зафиксировано SHA-256</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="text-[11px] text-slate-400 font-mono uppercase">Сложность Майнинга (PoW)</div>
          <div className="text-2xl font-black text-slate-100 font-mono mt-1">
            {stats?.difficulty || 3} Нуля
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Proof-of-Work Target</div>
        </div>

        <div
          className={`border rounded-2xl p-4 shadow-lg ${
            stats?.isValid
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/80 text-rose-300 animate-pulse'
          }`}
        >
          <div className="text-[11px] uppercase font-mono">Целостность Реестра</div>
          <div className="text-lg font-black mt-1 flex items-center space-x-1.5">
            {stats?.isValid ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>ВАЛИДЕН (OK)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span>НАРУШЕНА!</span>
              </>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {stats?.isValid ? 'Все блоки согласованы' : 'Обнаружена фальсификация'}
          </div>
        </div>
      </div>

      {/* Tamper Simulation & Security Alert Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-slate-100 font-semibold text-base mb-1">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>Симулятор Атак на Реестр & Проверка Криптографической Устойчивости</span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Проверьте, как система немедленно выявляет попытку подмены данных в историческом блоке без валидного пересчета Proof of Work.
            </p>
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <button
              onClick={() => handleTamper(blocks.length - 1)}
              disabled={blocks.length <= 1}
              className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-700/80 text-rose-300 text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 transition-all"
            >
              <Flame className="w-4 h-4 text-rose-400" />
              <span>Симулировать Подделку Блока #{blocks.length - 1}</span>
            </button>

            <button
              onClick={handleRepair}
              className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-300 text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-pointer transition-all"
            >
              <Wrench className="w-4 h-4 text-cyan-400" />
              <span>Восстановить (Re-mine)</span>
            </button>
          </div>
        </div>

        {tamperMessage && (
          <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200">
            {tamperMessage}
          </div>
        )}
      </div>

      {/* Search & Refresh */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Поиск по хешу, TxID или блоку..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <button
          onClick={fetchBlocks}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium flex items-center space-x-1.5 cursor-pointer"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Обновить реестр</span>
        </button>
      </div>

      {/* Blocks Visual Chain */}
      <div className="space-y-4">
        {filteredBlocks.map((block, idx) => (
          <div
            key={block.index}
            className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative transition-all hover:border-slate-700 font-mono text-xs"
          >
            {/* Block Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-950 flex items-center justify-center border border-cyan-800 text-cyan-400 font-bold">
                  #{block.index}
                </div>
                <div>
                  <span className="font-bold text-slate-100 text-sm">
                    {block.index === 0 ? 'Genesis Block (Генезис)' : `Verification Block #${block.index}`}
                  </span>
                  <span className="text-[11px] text-slate-500 ml-2">
                    {new Date(block.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                  Nonce: <span className="text-cyan-400 font-bold">{block.nonce}</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400">
                  PoW Target OK
                </span>
              </div>
            </div>

            {/* Block Hashes & Merkle Root */}
            <div className="space-y-1.5 text-[11px] break-all bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-3">
              <div>
                <span className="text-slate-500">Block Hash:</span>{' '}
                <span className="text-cyan-300 font-bold">{block.hash}</span>
              </div>
              <div>
                <span className="text-slate-500">Merkle Root:</span>{' '}
                <span className="text-emerald-400 font-bold">{block.merkleRoot || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500">Previous Hash:</span>{' '}
                <span className="text-slate-400">{block.previousHash}</span>
              </div>
              {block.data?.l2Anchor && (
                <div className="pt-1 border-t border-slate-900 flex items-center space-x-2 text-[10px] text-purple-300">
                  <span className="text-slate-500">L2 Anchor:</span>
                  <span>{block.data.l2Anchor.network}</span>
                  <span className="text-emerald-400">● Rollup Confirmed</span>
                </div>
              )}
            </div>

            {/* Block Data / Transactions */}
            {block.data && (
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold mb-1.5">
                  Содержимое блока ({block.data.transactions?.length || 0} транзакций):
                </div>
                {block.data.transactions && block.data.transactions.length > 0 ? (
                  <div className="space-y-2">
                    {block.data.transactions.map((tx, tIdx) => (
                      <div
                        key={tIdx}
                        className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-400">Tx:</span>
                            <span className="text-slate-200 font-semibold">{tx.txId.slice(0, 18)}...</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                tx.verdict === 'AUTHENTIC'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-rose-950 text-rose-400 border border-rose-800'
                              }`}
                            >
                              {tx.verdict}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">
                            Audio SHA-256: {tx.audioHash.slice(0, 24)}...
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(tx.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 text-[11px] italic bg-slate-950/40 p-2 rounded">
                    {JSON.stringify(block.data)}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
