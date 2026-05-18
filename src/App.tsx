import { useEffect } from 'react';
import { RecipeProvider, useRecipes } from './context/RecipeContext';
import { RecipeSelector } from './components/RecipeSelector';
import { VolumeInput } from './components/VolumeInput';
import { ViewModeToggle } from './components/ViewModeToggle';
import { StockManager } from './components/StockManager';
import { RecipeTable } from './components/RecipeTable';
import { Calculator, FileText, Package, RotateCcw } from 'lucide-react';

function CalculatorContent() {
  const { selectedRecipe, viewMode, calculate, calculationResults, setSelectedRecipe } = useRecipes();

  useEffect(() => {
    if (selectedRecipe) {
      calculate();
    }
  }, [selectedRecipe, viewMode, calculate]);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Калькулятор рецептуры купажа</h1>
              <p className="text-sm text-gray-500">Расчёт компонентов по объёму или остаткам сырья</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-500" />
                Параметры расчёта
              </h2>

              <RecipeSelector />
              <VolumeInput />
              <ViewModeToggle />

              {selectedRecipe && (
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600
                           bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Сбросить выбор
                </button>
              )}
            </div>

            <StockManager />
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2">
            <RecipeTable />
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <Package className="w-5 h-5 text-blue-600 mt-0.5" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900">Информация</h3>
              <ul className="mt-2 text-sm text-blue-700 space-y-1">
                <li>• Базовые данные рецептуры указаны на 1000 кг купажа</li>
                <li>• Расчёт по объёму: укажите нужный объём для автоматического пересчёта</li>
                <li>• Расчёт по остаткам: введите наличие сырья для определения максимального объёма</li>
                <li>• Редактирование: измените базовые количества для адаптации рецептуры</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            © 2026 Калькулятор рецептуры купажа
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <RecipeProvider>
      <CalculatorContent />
    </RecipeProvider>
  );
}

export default App;