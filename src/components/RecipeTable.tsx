import { useState } from 'react';
import { useRecipes } from '../context/RecipeContext';
import { Edit2, Check, X, AlertTriangle, Beaker, Droplets } from 'lucide-react';

export function RecipeTable() {
  const {
    selectedRecipe,
    calculationResults,
    updateComponentQuantity,
    updateComponentDryMatter,
    targetVolume,
    viewMode,
    maxPossibleVolume,
    calculatedVolume
  } = useRecipes();

  const [editingField, setEditingField] = useState<{ component: string; field: 'quantity' | 'dryMatter' } | null>(null);
  const [editValue, setEditValue] = useState('');

  if (!selectedRecipe) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <div className="text-gray-400 mb-2">Выберите рецептуру</div>
        <div className="text-sm text-gray-400">
          Результаты расчёта появятся здесь
        </div>
      </div>
    );
  }

  const handleStartEdit = (componentName: string, field: 'quantity' | 'dryMatter', currentValue: number) => {
    setEditingField({ component: componentName, field });
    setEditValue(String(currentValue));
  };

  const handleSaveEdit = () => {
    if (editingField) {
      const newValue = parseFloat(editValue);
      if (!isNaN(newValue) && newValue >= 0) {
        if (editingField.field === 'quantity') {
          updateComponentQuantity(editingField.component, newValue);
        } else {
          updateComponentDryMatter(editingField.component, newValue);
        }
      }
    }
    setEditingField(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  // Build display data from calculation results or base recipe
  const displayData = calculationResults.length > 0
    ? calculationResults.map(r => ({
        name: r.component.name,
        code: r.component.code,
        dryMatter: r.component.dryMatter,
        actualDryMatter: r.component.actualDryMatter ?? r.component.dryMatter,
        baseQuantity: r.baseQuantity,
        requiredQuantity: r.requiredQuantity,
        dryMatterContribution: r.dryMatterContribution,
        fromStock: r.fromStock,
        shortage: r.stockShortage,
        isAdjusted: r.isAdjusted,
        isFlexible: r.isFlexible,
        isUserChanged: r.baseQuantity !== (r.component.baseQuantity * (targetVolume / 1000))
      }))
    : selectedRecipe.components.map(c => ({
        name: c.name,
        code: c.code,
        dryMatter: c.dryMatter,
        actualDryMatter: c.actualDryMatter ?? c.dryMatter,
        baseQuantity: c.baseQuantity,
        requiredQuantity: c.baseQuantity,
        dryMatterContribution: (c.baseQuantity * c.dryMatter) / 100,
        fromStock: 0,
        shortage: 0,
        isAdjusted: false,
        isFlexible: c.isFlexible,
        isUserChanged: false
      }));

  const totalBase = displayData.reduce((sum, d) => sum + d.baseQuantity, 0);
  const totalRequired = displayData.reduce((sum, d) => sum + d.requiredQuantity, 0);
  const totalDryMatter = displayData.reduce((sum, d) => sum + d.dryMatterContribution, 0);
  const totalShortage = displayData.reduce((sum, d) => sum + d.shortage, 0);

  // Calculate final dry matter percentage
  const finalDryMatter = totalRequired > 0 ? (totalDryMatter / totalRequired) * 100 : 0;

  // Find which ingredients have actual dry matter different from base
  const changedIngredients = displayData.filter(d => d.actualDryMatter !== d.dryMatter);
  // Find ingredient changed directly by user
  const userChangedIngredient = displayData.find(d => d.isUserChanged && !d.isFlexible);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">{selectedRecipe.name}</h3>
            <p className="text-sm text-gray-500">Код: {selectedRecipe.code}</p>
          </div>
          <div className="flex items-center gap-4">
            {viewMode === 'stock' && maxPossibleVolume > 0 && (
              <div className="text-right">
                <div className="text-sm text-gray-500">Расчётный объём</div>
                <div className="text-lg font-semibold text-green-600">{calculatedVolume} кг</div>
              </div>
            )}
            {viewMode === 'stock' && maxPossibleVolume > 0 && (
              <div className="text-right">
                <div className="text-sm text-gray-500">Лимитирующий</div>
                <div className="text-lg font-semibold text-orange-600">{maxPossibleVolume} кг</div>
              </div>
            )}
            {calculationResults.length > 0 && (
              <div className="text-right px-3 py-1 bg-blue-100 rounded-lg">
                <div className="text-xs text-blue-600">Вес купажа</div>
                <div className="text-lg font-bold text-blue-700">{totalRequired.toFixed(1)} кг</div>
              </div>
            )}
            {calculationResults.length > 0 && (
              <div className="text-right px-3 py-1 bg-green-100 rounded-lg">
                <div className="text-xs text-green-600">Итого СВ</div>
                <div className="text-lg font-bold text-green-700">{finalDryMatter.toFixed(1)}%</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info about changes */}
      {changedIngredients.length > 0 || userChangedIngredient ? (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-700">
          <div className="flex items-center gap-2">
            <Beaker className="w-4 h-4" />
            <span>
              {userChangedIngredient && (
                <>Изменён вес: {userChangedIngredient.name} → {userChangedIngredient.requiredQuantity.toFixed(1)} кг → </>
              )}
              {changedIngredients.length > 0 && (
                <>Изменено СВ: {changedIngredients.map(d => d.name).join(', ')}</>
              )}
              {displayData.some(d => d.isFlexible && d.isAdjusted) && (
                <span className="ml-2 font-medium">
                  → Вода компенсировала изменение
                </span>
              )}
            </span>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Компонент
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Код SAP
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                СВ баз. %
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-blue-600 uppercase tracking-wider">
                <div className="flex items-center justify-center gap-1">
                  <Beaker className="w-3 h-3" />
                  СВ факт. %
                </div>
              </th>
              {calculationResults.length > 0 ? (
                <>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    База, кг
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-blue-600 uppercase tracking-wider">
                    {viewMode === 'volume' ? 'Расчёт, кг' : 'Требуется, кг'}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-green-600 uppercase tracking-wider">
                    СВ, кг
                  </th>
                  {viewMode === 'stock' && (
                    <>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Со склада
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-orange-600 uppercase tracking-wider">
                        Дефицит
                      </th>
                    </>
                  )}
                </>
              ) : (
                <>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    База, кг
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    СВ, кг
                  </th>
                </>
              )}
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Изменить
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayData.map((item, idx) => {
              const isEditingQuantity = editingField?.component === item.name && editingField.field === 'quantity';
              const isEditingDryMatter = editingField?.component === item.name && editingField.field === 'dryMatter';
              const hasStockShortage = item.shortage > 0;
              const isChangedByUser = item.actualDryMatter !== item.dryMatter;

              return (
                <tr
                  key={idx}
                  className={`
                    ${hasStockShortage ? 'bg-orange-50' : ''}
                    ${item.isFlexible && item.isAdjusted ? 'bg-purple-50' : ''}
                    ${item.isUserChanged && !item.isFlexible ? 'bg-blue-50' : ''}
                  `}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {item.isFlexible && (
                        <div className="p-1 bg-purple-100 rounded" title="Гибкий компонент (компенсатор)">
                          <Droplets className="w-4 h-4 text-purple-600" />
                        </div>
                      )}
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-500">
                    {item.code || '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-500">
                    {item.dryMatter}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isEditingDryMatter ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-20 px-2 py-1 border border-blue-400 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => handleStartEdit(item.name, 'dryMatter', item.actualDryMatter)}
                        className={`text-sm font-medium ${isChangedByUser ? 'text-blue-600 bg-blue-50 px-2 py-0.5 rounded' : 'text-gray-900'}`}
                        title="Нажмите для редактирования"
                      >
                        {item.actualDryMatter.toFixed(1)}%
                      </button>
                    )}
                  </td>
                  {calculationResults.length > 0 ? (
                    <>
                      <td className="px-4 py-3 text-right text-sm text-gray-500">
                        {item.baseQuantity.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-medium ${
                          item.isFlexible && item.isAdjusted
                            ? 'text-purple-600'
                            : isChangedByUser
                              ? 'text-blue-600'
                              : 'text-blue-600'
                        }`}>
                          {item.requiredQuantity.toFixed(2)}
                        </span>
                        {item.isUserChanged && !item.isFlexible && (
                          <span className="ml-1 text-xs text-blue-500" title="Изменено пользователем">
                            ✎
                          </span>
                        )}
                        {item.isAdjusted && !isChangedByUser && !item.isFlexible && (
                          <span className="ml-1 text-xs text-purple-500" title="Компенсировано">
                            ↻
                          </span>
                        )}
                        {isChangedByUser && (
                          <span className="ml-1 text-xs text-blue-500" title="Изменено по СВ">
                            ★
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-green-600 font-medium">
                        {item.dryMatterContribution.toFixed(2)}
                      </td>
                      {viewMode === 'stock' && (
                        <>
                          <td className="px-4 py-3 text-right text-sm text-gray-600">
                            {item.fromStock.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {item.shortage > 0 ? (
                              <span className="inline-flex items-center gap-1 text-sm font-medium text-orange-600">
                                <AlertTriangle className="w-4 h-4" />
                                {item.shortage.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-sm text-green-600">—</span>
                            )}
                          </td>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        {isEditingQuantity ? (
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-400 rounded text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        ) : (
                          item.baseQuantity.toFixed(2)
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">
                        {item.dryMatterContribution.toFixed(2)}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3 text-center">
                    {isEditingQuantity || isEditingDryMatter ? (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={handleSaveEdit}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                          title="Сохранить"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-gray-400 hover:bg-gray-200 rounded"
                          title="Отмена"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(item.name, 'quantity', item.baseQuantity)}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Редактировать базу"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-gray-300">
            <tr>
              <td className="px-4 py-3">
                <span className="text-sm font-semibold text-gray-900">ИТОГО</span>
              </td>
              <td colSpan={2}></td>
              <td className="px-4 py-3 text-center">
                <span className="text-sm font-bold text-green-700">{finalDryMatter.toFixed(1)}%</span>
              </td>
              {calculationResults.length > 0 ? (
                <>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {totalBase.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-blue-700">
                    {totalRequired.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-green-700">
                    {totalDryMatter.toFixed(2)}
                  </td>
                  {viewMode === 'stock' && <td colSpan={2}></td>}
                </>
              ) : (
                <>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {totalBase.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {totalDryMatter.toFixed(2)}
                  </td>
                </>
              )}
              <td></td>
            </tr>
            {totalShortage > 0 && (
              <tr className="bg-orange-100">
                <td colSpan={viewMode === 'stock' ? 4 : 4} className="px-4 py-2">
                  <span className="text-sm font-medium text-orange-700">
                    Общий дефицит сырья
                  </span>
                </td>
                <td colSpan={viewMode === 'stock' ? 5 : 3} className="px-4 py-2 text-right">
                  <span className="text-sm font-bold text-orange-700">
                    {totalShortage.toFixed(2)} кг
                  </span>
                </td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex flex-wrap items-center gap-4">
          <span>💡 <strong>База</strong> — пропорция из рецептуры</span>
          <span className="text-blue-600">★</span> <span>— изменено пользователем</span>
          <span className="text-purple-600">↻</span> <span>— компенсировано</span>
          <span className="flex items-center gap-1">
            <Droplets className="w-3 h-3 text-purple-600" /> — гибкий компонент (компенсатор)
          </span>
        </div>
      </div>
    </div>
  );
}