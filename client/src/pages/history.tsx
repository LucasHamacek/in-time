import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Camera, Calculator, Eye, Trash2, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatRelativeDate } from "@/utils/format";
import { formatWorkTime } from "@/utils/time-calculator";
import type { Purchase } from "@/types";

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: purchases = [], isLoading } = useQuery<Purchase[]>({
    queryKey: [`/api/purchases/${userProfile?.id}`],
    enabled: !!userProfile?.id,
  });

  // Delete purchase mutation
  const deletePurchaseMutation = useMutation({
    mutationFn: async (purchaseId: number): Promise<void> => {
      await apiRequest("DELETE", `/api/purchases/${purchaseId}/${userProfile?.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/purchases/${userProfile?.id}`] });
      toast({
        title: "Item removido",
        description: "O item foi removido do histórico",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover item",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  // Filter and sort purchases
  const filteredPurchases = purchases
    .filter((purchase) =>
      purchase.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "value":
          return b.value - a.value;
        case "time":
          return (b.timeHours * 60 + b.timeMinutes) - (a.timeHours * 60 + a.timeMinutes);
        default: // date
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

  const handleDeletePurchase = (purchaseId: number) => {
    if (confirm("Tem certeza que deseja remover este item do histórico?")) {
      deletePurchaseMutation.mutate(purchaseId);
    }
  };

  const handleExportHistory = () => {
    if (purchases.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Adicione algumas compras primeiro",
        variant: "destructive",
      });
      return;
    }

    // Create CSV content
    const csvContent = [
      ["Data", "Descrição", "Valor", "Tempo de Trabalho", "Tipo"].join(","),
      ...purchases.map(purchase => [
        purchase.createdAt ? new Date(purchase.createdAt).toLocaleDateString('pt-BR') : '',
        purchase.description || '',
        purchase.value.toString(),
        `${purchase.timeHours}h ${purchase.timeMinutes}m`,
        purchase.type === 'ocr' ? 'Cupom Fiscal' : 'Cálculo Manual'
      ].join(","))
    ].join("\n");

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'intime-historico.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Histórico exportado!",
      description: "O arquivo CSV foi baixado com sucesso",
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Histórico de Compras</h1>
        <p className="text-slate-600">Todas as suas análises de cupons e cálculos salvos</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar por descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Data</SelectItem>
                  <SelectItem value="value">Valor</SelectItem>
                  <SelectItem value="time">Tempo</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleExportHistory}
                variant="outline"
                className="flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-20 bg-slate-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/6"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPurchases.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                {searchTerm ? "Nenhum resultado encontrado" : "Nenhuma compra registrada"}
              </h3>
              <p className="text-slate-600 mb-4">
                {searchTerm 
                  ? "Tente buscar por outros termos"
                  : "Comece analisando um cupom fiscal ou usando a calculadora"
                }
              </p>
              {!searchTerm && (
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => window.location.href = "/upload"}>
                    Analisar Cupom
                  </Button>
                  <Button variant="outline" onClick={() => window.location.href = "/calculator"}>
                    Usar Calculadora
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPurchases.map((purchase) => (
            <Card key={purchase.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-20 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                      {purchase.type === 'ocr' ? (
                        <Camera className="w-6 h-6 text-slate-500" />
                      ) : (
                        <Calculator className="w-6 h-6 text-slate-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-1">
                        {purchase.description || 
                         (purchase.type === 'ocr' ? 'Cupom Fiscal' : 'Cálculo Manual')}
                      </h3>
                      <p className="text-sm text-slate-600 mb-2">
                        {purchase.createdAt ? formatRelativeDate(purchase.createdAt) : ''}
                      </p>
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="text-sm text-slate-600">Valor</p>
                          <p className="font-semibold text-slate-800">
                            {formatCurrency(purchase.value)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Tempo de Trabalho</p>
                          <p className="font-semibold text-yellow-500">
                            {formatWorkTime({
                              hours: purchase.timeHours,
                              minutes: purchase.timeMinutes,
                              totalMinutes: 0
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDeletePurchase(purchase.id)}
                      disabled={deletePurchaseMutation.isPending}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
