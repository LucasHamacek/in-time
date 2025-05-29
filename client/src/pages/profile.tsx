import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getHourlyRate, getDailyRate } from "@/utils/time-calculator";
import { formatCurrency } from "@/utils/format";

const profileSchema = z.object({
  monthlySalary: z.number().min(1, "Salário deve ser maior que zero"),
  weeklyHours: z.number().min(1, "Carga horária deve ser maior que zero").max(168, "Máximo 168 horas por semana"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { userProfile, updateProfile } = useAuth();
  const { toast } = useToast();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      monthlySalary: userProfile?.monthlySalary || 0,
      weeklyHours: userProfile?.weeklyHours || 0,
    },
  });

  const watchedValues = form.watch();
  const hourlyRate = getHourlyRate(watchedValues.monthlySalary, watchedValues.weeklyHours);
  const dailyRate = getDailyRate(watchedValues.monthlySalary, watchedValues.weeklyHours);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile(data);
      toast({
        title: "Perfil atualizado!",
        description: "Suas configurações foram salvas com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar perfil",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Perfil</h1>
        <p className="text-slate-600">Configure suas informações para cálculos precisos</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="monthlySalary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700">
                    Salário Mensal (R$)
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">R$</span>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        placeholder="3500"
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </FormControl>
                  <p className="text-sm text-slate-500 mt-1">Seu salário bruto mensal</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weeklyHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700">
                    Carga Horária Semanal
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type="number"
                        step="0.5"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        placeholder="40"
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500">horas</span>
                    </div>
                  </FormControl>
                  <p className="text-sm text-slate-500 mt-1">Quantas horas você trabalha por semana</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Calculated Values Display */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h3 className="font-medium text-slate-800 mb-3">Valores Calculados</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Valor por hora</p>
                  <p className="text-lg font-semibold text-slate-800">
                    {hourlyRate > 0 ? formatCurrency(hourlyRate) : "R$ 0,00"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Valor por dia</p>
                  <p className="text-lg font-semibold text-slate-800">
                    {dailyRate > 0 ? formatCurrency(dailyRate) : "R$ 0,00"}
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-xl transition-colors"
            >
              Salvar Configurações
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
