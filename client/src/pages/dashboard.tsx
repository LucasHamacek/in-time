import { useQuery } from "@tanstack/react-query";
import { Clock, DollarSign, Receipt, Camera, Calculator, History } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import type { Purchase } from "@/types";
import { formatCurrency, formatRelativeDate } from "@/utils/format";
import { formatWorkTime } from "@/utils/time-calculator";

export default function DashboardPage() {
  const { userProfile } = useAuth();
  const [, setLocation] = useLocation();

  const { data: purchases = [] } = useQuery<Purchase[]>({
    queryKey: [`/api/purchases/${userProfile?.id}`],
    enabled: !!userProfile?.id,
  });

  // Calculate stats
  const totalSpent = purchases.reduce((sum, purchase) => sum + purchase.value, 0);
  const totalMinutes = purchases.reduce((sum, purchase) => sum + (purchase.timeHours * 60) + purchase.timeMinutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  const recentPurchases = purchases.slice(0, 3);

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Bem-vindo ao TempoVale</h1>
        <p className="text-slate-600">Descubra quanto tempo suas compras realmente custam</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Tempo Total Gasto</p>
              <p className="text-2xl font-bold text-slate-800">
                {totalHours}h {remainingMinutes}m
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Gasto</p>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Cupons Analisados</p>
              <p className="text-2xl font-bold text-slate-800">{purchases.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Receipt className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => setLocation("/upload")}
            className="flex items-center p-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors group"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200">
              <Camera className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-left">
              <p className="font-medium text-slate-800">Analisar Cupom</p>
              <p className="text-sm text-slate-600">Tire uma foto do seu cupom</p>
            </div>
          </button>

          <button
            onClick={() => setLocation("/calculator")}
            className="flex items-center p-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors group"
          >
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-yellow-200">
              <Calculator className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-left">
              <p className="font-medium text-slate-800">Calculadora</p>
              <p className="text-sm text-slate-600">Calcule manualmente</p>
            </div>
          </button>

          <button
            onClick={() => setLocation("/history")}
            className="flex items-center p-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors group"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-200">
              <History className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-left">
              <p className="font-medium text-slate-800">Ver Histórico</p>
              <p className="text-sm text-slate-600">Compras anteriores</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Purchases */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Compras Recentes</h2>
          <button
            onClick={() => setLocation("/history")}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            Ver todas
          </button>
        </div>
        
        <div className="space-y-3">
          {recentPurchases.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Nenhuma compra registrada ainda</p>
              <p className="text-sm text-slate-400">Comece analisando um cupom fiscal</p>
            </div>
          ) : (
            recentPurchases.map((purchase) => (
              <div key={purchase.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center">
                    {purchase.type === 'ocr' ? (
                      <Camera className="w-5 h-5 text-slate-500" />
                    ) : (
                      <Calculator className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">
                      {purchase.description || (purchase.type === 'ocr' ? 'Cupom Fiscal' : 'Cálculo Manual')}
                    </p>
                    <p className="text-sm text-slate-600">
                      {purchase.createdAt ? formatRelativeDate(purchase.createdAt) : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-800">{formatCurrency(purchase.value)}</p>
                  <p className="text-sm text-yellow-500 font-medium">
                    {formatWorkTime({ hours: purchase.timeHours, minutes: purchase.timeMinutes, totalMinutes: 0 })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
