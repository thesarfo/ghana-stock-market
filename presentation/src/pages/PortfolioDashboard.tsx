import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, TrashIcon, ChartPieIcon } from '@heroicons/react/24/outline';
import type { Portfolio } from '../types/portfolio';
import { portfolioService } from '../services/portfolioService';
import { Button, Card, LoadingSpinner, AlertDialog } from '../components/ui';

export const PortfolioDashboard: React.FC = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = async () => {
    try
    {
      const data = await portfolioService.getAllPortfolios();
      setPortfolios(data);
    } catch (err)
    {
      setError('Failed to load portfolios');
    } finally
    {
      setLoading(false);
    }
  };

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortfolioName.trim()) return;

    setIsCreating(true);
    try
    {
      await portfolioService.createPortfolio({ name: newPortfolioName });
      setNewPortfolioName('');
      loadPortfolios();
    } catch (err)
    {
      setError('Failed to create portfolio');
    } finally
    {
      setIsCreating(false);
    }
  };

  const openDeleteDialog = (id: string, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteTarget({ id, name });
  };

  const handleDeletePortfolio = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try
    {
      await portfolioService.deletePortfolio(deleteTarget.id);
      loadPortfolios();
      setDeleteTarget(null);
    } catch (err)
    {
      setError('Failed to delete portfolio');
    } finally
    {
      setIsDeleting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><LoadingSpinner size="lg" /></div>;

  const totalAssets = portfolios.reduce((acc, p) => acc + p.items.length, 0);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-primary-600 p-5 sm:p-8 text-white shadow-xl">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-balance">My Portfolios</h1>
          <p className="text-primary-100 mb-4 sm:mb-6 max-w-xl text-pretty text-sm sm:text-base">
            Track your investments, analyze performance, and simulate future wealth.
          </p>
          <div className="flex gap-6 sm:gap-8">
            <div>
              <p className="text-sm text-primary-200 font-medium uppercase tracking-wider">Total Portfolios</p>
              <p className="text-4xl font-bold tabular-nums">{portfolios.length}</p>
            </div>
            <div>
              <p className="text-sm text-primary-200 font-medium uppercase tracking-wider">Total Holdings</p>
              <p className="text-4xl font-bold tabular-nums">{totalAssets}</p>
            </div>
          </div>
        </div>
        <ChartPieIcon className="absolute -right-8 -bottom-8 size-64 text-white/10 rotate-12" />
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl flex items-center">
          <span className="mr-2">⚠️</span> {error}
        </div>
      )}

      {/* Create Section */}
      <Card className="p-4 sm:p-6 border-primary-100 bg-primary-50">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 text-balance">Create New Portfolio</h2>
        <form onSubmit={handleCreatePortfolio} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <input
            type="text"
            value={newPortfolioName}
            onChange={(e) => setNewPortfolioName(e.target.value)}
            placeholder="Portfolio Name (e.g., Retirement Fund)"
            className="input flex-1"
          />
          <Button
            type="submit"
            disabled={!newPortfolioName.trim()}
            isLoading={isCreating}
            className="whitespace-nowrap w-full sm:w-auto justify-center"
          >
            <PlusIcon className="size-5 mr-2" />
            Create Portfolio
          </Button>
        </form>
      </Card>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {portfolios.map((portfolio) => (
          <Link key={portfolio.id} to={`/portfolios/${portfolio.id}`} className="block group">
            <Card hover className="h-full p-6 flex flex-col justify-between group-hover:border-primary-200">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="size-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                    <ChartPieIcon className="size-6" />
                  </div>
                  <button
                    onClick={(e) => openDeleteDialog(portfolio.id, portfolio.name, e)}
                    className="text-gray-400 hover:text-danger-500 p-1 rounded-full hover:bg-danger-50"
                    aria-label="Delete portfolio"
                  >
                    <TrashIcon className="size-5" />
                  </button>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 text-balance">
                  {portfolio.name}
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  Created {new Date(portfolio.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-sm font-medium text-gray-600 tabular-nums">
                  {portfolio.items.length} Holdings
                </span>
                <span className="text-sm font-semibold text-primary-600 group-hover:translate-x-1 transition-transform duration-150">
                  View Details →
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {portfolios.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <div className="size-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChartPieIcon className="size-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1 text-balance">No portfolios yet</h3>
          <p className="text-gray-500 text-pretty">Create your first portfolio to start tracking your wealth.</p>
        </div>
      )}

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeletePortfolio}
        title="Delete Portfolio"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};

