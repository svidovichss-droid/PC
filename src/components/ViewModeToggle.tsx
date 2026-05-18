import { useRecipes } from '../context/RecipeContext';

export function ViewModeToggle() {
  const { viewMode, setViewMode, selectedRecipe } = useRecipes();

  if (!selectedRecipe) return null;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Режим расчёта
      </label>
      <div className="flex rounded-lg overflow-hidden border border-gray-300">
        <button
          onClick={() => setViewMode('volume')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors
                     ${viewMode === 'volume'
                       ? 'bg-blue-600 text-white'
                       : 'bg-white text-gray-700 hover:bg-gray-50'
                     }`}
        >
          По объёму
        </button>
        <button
          onClick={() => setViewMode('stock')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors
                     ${viewMode === 'stock'
                       ? 'bg-blue-600 text-white'
                       : 'bg-white text-gray-700 hover:bg-gray-50'
                     }`}
        >
          По остаткам
        </button>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        {viewMode === 'volume'
          ? 'Расчёт по заданному объёму купажа'
          : 'Расчёт максимального объёма по остаткам сырья'}
      </p>
    </div>
  );
}