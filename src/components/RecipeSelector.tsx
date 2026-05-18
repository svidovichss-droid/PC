import { useState, useMemo } from 'react';
import { useRecipes } from '../context/RecipeContext';
import { Recipe } from '../types/recipe';
import { Search, FileText, X } from 'lucide-react';

export function RecipeSelector() {
  const { recipes, setSelectedRecipe, selectedRecipe } = useRecipes();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredRecipes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return recipes.slice(0, 50);
    return recipes.filter(r =>
      r.code.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [recipes, searchQuery]);

  const handleSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Рецептура
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 text-left bg-white border border-gray-300 rounded-lg
                   hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                   flex items-center justify-between gap-2 transition-colors"
      >
        {selectedRecipe ? (
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">
              <span className="font-medium">{selectedRecipe.code}</span>
              <span className="text-gray-500 ml-2">{selectedRecipe.name}</span>
            </span>
          </div>
        ) : (
          <span className="text-gray-400">Выберите рецептуру</span>
        )}
        {selectedRecipe && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRecipe(null);
            }}
            className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по коду или названию..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {filteredRecipes.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                Рецептуры не найдены
              </div>
            ) : (
              filteredRecipes.map(recipe => (
                <button
                  key={recipe.code}
                  onClick={() => handleSelect(recipe)}
                  className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors
                             ${selectedRecipe?.code === recipe.code ? 'bg-blue-50' : ''}`}
                >
                  <div className="font-medium text-gray-900">{recipe.code}</div>
                  <div className="text-sm text-gray-500 truncate">{recipe.name}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {recipe.components.length} компонентов • {recipe.totalBase.toFixed(1)} кг
                  </div>
                </button>
              ))
            )}
          </div>
          {recipes.length > 50 && (
            <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-500 text-center">
              Показано {filteredRecipes.length} из {recipes.length} рецептур
            </div>
          )}
        </div>
      )}
    </div>
  );
}