import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Calculator as CalculatorIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { TimeDisplay } from "@/components/time-calculation/time-display";
import { calculateWorkTime } from "@/utils/time-calculator";
import { formatCurrency } from "@/utils/format";
import { apiRequest } from "@/lib/queryClient";
import type { Purchase } from "@/types";

const calculatorSchema = z.object({
  value: z.number().min(0.01, "Valor deve ser maior que zero"),
});

type CalculatorFormData = z.infer<typeof calculatorSchema>;

const quickAmounts = [50, 100, 200, 500];

export default function CalculatorPage() {
  const [calculationResult, setCalculationResult] = useState<{
    value: number;
    timeCalculation: any;
  } | null>(null);

  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CalculatorFormData>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      value: 0,
    },
  });

  const watchedValue = form.watch("value");

  // Calculate time whenever value changes
  const timeCalculation = userProfile?.monthlySalary && userProfile?.weeklyHours && watchedValue > 0
    ? calculateWorkTime(watchedValue, userProfile.monthlySalary, userProfile.weeklyHours)
    : null;

  // Save calculation mutation
  const saveCalculationMutation = useMutation({
    mutationFn: async (purchaseData: Omit<Purchase, 'id' | 'createdAt'>): Promise<Purchase> => {
      const response = await apiRequest("POST", "/api/purchases", purchaseData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/purchases/${userProfile?.id}`] });
      toast({
        title: "Cálculo salvo no histórico!",
        description: "Você pode visualizá-lo na seção de histórico",
      });
      form.reset();
      setCalculationResult(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar cálculo",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const handleQuickAmount = (amount: number) => {
    form.setValue("value", amount);
  };

  const handleSaveCalculation = () => {
    if (!timeCalculation || !userProfile || watchedValue <= 0) return;

    const purchaseData = {
      userId: userProfile.id!,
      value: watchedValue,
      timeHours: timeCalculation.hours,
      timeMinutes: timeCalculation.minutes,
      description: `Cálculo Manual - ${formatCurrency(watchedValue)}`,
      type: 'manual' as const,
    };

    saveCalculationMutation.mutate(purchaseData);
  };

  const canCalculateTime = userProfile?.monthlySalary && userProfile?.weeklyHours;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Calculadora Manual</h1>
        <p className="text-slate-600">Digite um valor para converter em tempo de trabalho</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form className="space-y-6">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Valor da Compra (R$)
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-lg">R$</span>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                          className="w-full pl-10 pr-4 py-4 text-xl border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Real-time Calculation Result */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-600 mb-2">Tempo de Trabalho Equivalente</p>
                  <div className="text-3xl font-bold text-yellow-500 mb-2">
                    {timeCalculation ? (
                      <>{timeCalculation.hours}h {timeCalculation.minutes}m</>
                    ) : (
                      <>0h 0m</>
                    )}
                  </div>
                  <p className="text-slate-600">
                    {watchedValue > 0 && canCalculateTime
                      ? `Para ganhar ${formatCurrency(watchedValue)}`
                      : canCalculateTime
                      ? "Digite um valor para ver o cálculo"
                      : "Configure seu perfil para ver o cálculo"
                    }
                  </p>
                </div>
              </div>

              {/* Time Display */}
              {timeCalculation && watchedValue > 0 && (
                <TimeDisplay
                  calculation={timeCalculation}
                  value={watchedValue}
                />
              )}

              {/* Quick Amount Buttons */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">Valores Rápidos</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => handleQuickAmount(amount)}
                      className="p-3 border border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                    >
                      {formatCurrency(amount)}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                onClick={handleSaveCalculation}
                disabled={!timeCalculation || watchedValue <= 0 || saveCalculationMutation.isPending}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-xl transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveCalculationMutation.isPending ? "Salvando..." : "Salvar no Histórico"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Profile Warning */}
      {!canCalculateTime && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CalculatorIcon className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Configure seu perfil</h3>
              <p className="text-slate-600 mb-4">
                Para calcular o tempo de trabalho, configure seu salário e carga horária no perfil.
              </p>
              <Button onClick={() => window.location.href = "/profile"}>
                Configurar Perfil
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
