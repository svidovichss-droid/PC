import { useRecipes } from '../context/RecipeContext';
import { Scale } from 'lucide-react';

export function VolumeInput() {
  const { targetVolume, setTargetVolume, maxPossibleVolume, viewMode } = useRecipes();

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Объём купажа (кг)
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Scale className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="number"
          min="1"
          max="100000"
          value={targetVolume}
          onChange={(e) => setTargetVolume(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Введите объём..."
        />
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Базовый расчёт: данные на 1000 кг
      </p>
      {viewMode === 'stock' && maxPossibleVolume > 0 && (
        <p className="mt-1 text-xs text-orange-600">
          Максимально возможный объём: {maxPossibleVolume} кг
        </p>
      )}
    </div>
  );
}