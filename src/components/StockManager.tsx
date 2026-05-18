import { useState } from 'react';
import { useRecipes } from '../context/RecipeContext';
import { Package, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

export function StockManager() {
  const { stock, updateStockItem, selectedRecipe } = useRecipes();
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'quantity' | 'dryMatter' | null>(null);
  const [newCode, setNewCode] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newDryMatter, setNewDryMatter] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  if (!selectedRecipe) return null;

  // Get unique component codes from current recipe
  const recipeComponents = selectedRecipe.components
    .filter(c => c.code)
    .map(c => ({ code: c.code!, name: c.name }));

  const handleSaveEdit = () => {
    if (editingCode) {
      const quantity = parseFloat(newQuantity) || 0;
      const dryMatter = newDryMatter ? parseFloat(newDryMatter) : null;
      updateStockItem(editingCode, quantity, dryMatter);
    }
    setEditingCode(null);
    setEditingField(null);
    setNewQuantity('');
    setNewDryMatter('');
  };

  const handleAddNew = () => {
    if (newCode && newQuantity) {
      const dryMatter = newDryMatter ? parseFloat(newDryMatter) : null;
      updateStockItem(newCode, parseFloat(newQuantity) || 0, dryMatter);
    }
    setNewCode('');
    setNewQuantity('');
    setNewDryMatter('');
    setIsAddingNew(false);
  };

  const handleStartEdit = (code: string, field: 'quantity' | 'dryMatter', currentValue: string) => {
    setEditingCode(code);
    setEditingField(field);
    setNewQuantity(field === 'quantity' ? currentValue : '');
    setNewDryMatter(field === 'dryMatter' ? currentValue : '');
  };

  const handleCancelEdit = () => {
    setEditingCode(null);
    setEditingField(null);
    setNewQuantity('');
    setNewDryMatter('');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Остатки сырья</h3>
        </div>
        <button
          onClick={() => setIsAddingNew(!isAddingNew)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg
                   hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить
        </button>
      </div>

      {isAddingNew && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="КодSAP"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              placeholder="Кол-во (кг)"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              value={newDryMatter}
              onChange={(e) => setNewDryMatter(e.target.value)}
              placeholder="СВ факт. %"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setIsAddingNew(false); setNewCode(''); setNewQuantity(''); setNewDryMatter(''); }}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleAddNew}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Сохранить
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {recipeComponents.length === 0 && stock.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Нет данных об остатках</p>
            <p className="text-xs text-gray-400 mt-1">
              Добавьте остатки сырья для расчёта
            </p>
          </div>
        ) : (
          <>
            {/* Recipe components with stock */}
            {recipeComponents.map(comp => {
              const stockItem = stock.find(s => s.code === comp.code);
              const isEditing = editingCode === comp.code;

              return (
                <div
                  key={comp.code}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500">{comp.code}</div>
                    <div className="text-sm text-gray-900 truncate">{comp.name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Quantity editing */}
                    {isEditing && editingField === 'quantity' ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={newQuantity}
                          onChange={(e) => setNewQuantity(e.target.value)}
                          className="w-24 px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="кг"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveEdit}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-gray-400 hover:bg-gray-200 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(comp.code, 'quantity', String(stockItem?.quantity || ''))}
                        className="text-sm text-gray-700 hover:text-blue-600 min-w-[80px] text-right"
                      >
                        {stockItem?.quantity?.toFixed(1) || '0'} кг
                      </button>
                    )}
                    {/* Dry matter editing */}
                    {isEditing && editingField === 'dryMatter' ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={newDryMatter}
                          onChange={(e) => setNewDryMatter(e.target.value)}
                          className="w-20 px-2 py-1 border border-blue-400 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="%"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveEdit}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-gray-400 hover:bg-gray-200 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(comp.code, 'dryMatter', stockItem?.actualDryMatter ? String(stockItem.actualDryMatter) : '')}
                        className={`text-xs px-2 py-1 rounded ${
                          stockItem?.actualDryMatter ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        } hover:bg-blue-200`}
                        title="СВ фактическое"
                      >
                        {stockItem?.actualDryMatter ? `${stockItem.actualDryMatter.toFixed(1)}%` : 'СВ?'}
                      </button>
                    )}
                    <button
                      onClick={() => handleStartEdit(comp.code, 'quantity', String(stockItem?.quantity || ''))}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Custom stock items not in recipe */}
            {stock.filter(s => !recipeComponents.find(c => c.code === s.code)).map(item => (
              <div
                key={item.code}
                className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg border border-orange-100"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-orange-600">{item.code}</div>
                  <div className="text-sm text-gray-900 truncate">{item.name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 min-w-[80px] text-right">
                    {item.quantity.toFixed(1)} кг
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    item.actualDryMatter ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {item.actualDryMatter ? `${item.actualDryMatter.toFixed(1)}%` : 'СВ?'}
                  </span>
                  <button
                    onClick={() => {
                      setEditingCode(item.code);
                      setNewQuantity(String(item.quantity));
                      setNewDryMatter(item.actualDryMatter ? String(item.actualDryMatter) : '');
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateStockItem(item.code, 0)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}