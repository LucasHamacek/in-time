import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Upload, Check, Loader2, Save, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { TimeDisplay } from "@/components/time-calculation/time-display";
import { calculateWorkTime } from "@/utils/time-calculator";
import { formatCurrency } from "@/utils/format";
import { apiRequest } from "@/lib/queryClient";
import type { OCRResult, Purchase } from "@/types";

export default function UploadPage() {
  const [analysisResult, setAnalysisResult] = useState<OCRResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // OCR processing mutation
  const ocrMutation = useMutation({
    mutationFn: async (file: File): Promise<OCRResult> => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Falha ao processar imagem');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      setProcessing(false);
      
      if (data.success) {
        toast({
          title: "Cupom analisado com sucesso!",
          description: `Valor extraído: ${formatCurrency(data.totalValue)}`,
        });
      } else {
        toast({
          title: "Não foi possível extrair o valor",
          description: "Tente novamente com uma imagem mais clara",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      setProcessing(false);
      toast({
        title: "Erro ao processar cupom",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  // Save purchase mutation
  const savePurchaseMutation = useMutation({
    mutationFn: async (purchaseData: Omit<Purchase, 'id' | 'createdAt'>): Promise<Purchase> => {
      const response = await apiRequest("POST", "/api/purchases", purchaseData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/purchases/${userProfile?.id}`] });
      toast({
        title: "Compra salva no histórico!",
        description: "Você pode visualizá-la na seção de histórico",
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar compra",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      setProcessing(true);
      setAnalysisResult(null);
      ocrMutation.mutate(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
    },
    multiple: false,
  });

  const handleCameraCapture = () => {
    // Trigger file input to open camera on mobile devices
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use rear camera
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setUploadedFile(file);
        setProcessing(true);
        setAnalysisResult(null);
        ocrMutation.mutate(file);
      }
    };
    input.click();
  };

  const handleSaveToHistory = () => {
    if (!analysisResult || !userProfile || !analysisResult.success) return;

    const timeCalculation = calculateWorkTime(
      analysisResult.totalValue,
      userProfile.monthlySalary || 0,
      userProfile.weeklyHours || 0
    );

    const purchaseData = {
      userId: userProfile.id!,
      value: analysisResult.totalValue,
      timeHours: timeCalculation.hours,
      timeMinutes: timeCalculation.minutes,
      description: "Cupom Fiscal",
      type: 'ocr' as const,
    };

    savePurchaseMutation.mutate(purchaseData);
  };

  const resetForm = () => {
    setAnalysisResult(null);
    setUploadedFile(null);
    setProcessing(false);
  };

  const canCalculateTime = userProfile?.monthlySalary && userProfile?.weeklyHours;
  const timeCalculation = analysisResult?.success && canCalculateTime
    ? calculateWorkTime(analysisResult.totalValue, userProfile.monthlySalary!, userProfile.weeklyHours!)
    : null;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Analisar Cupom</h1>
        <p className="text-slate-600">Tire uma foto do seu cupom fiscal para análise automática</p>
      </div>

      {/* Upload Area */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 hover:border-blue-500 hover:bg-blue-50"
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">Tire uma foto do cupom</h3>
            <p className="text-slate-600 mb-4">Ou arraste e solte uma imagem aqui</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleCameraCapture}
                className="inline-flex items-center bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Camera className="w-4 h-4 mr-2" />
                Usar Câmera
              </Button>
              <Button
                variant="outline"
                className="inline-flex items-center"
              >
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Arquivo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing State */}
      {processing && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Analisando cupom...</h3>
              <p className="text-slate-600">Extraindo informações do cupom fiscal</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Result */}
      {analysisResult && analysisResult.success && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Análise Concluída!</h3>
              
              <div className="bg-slate-50 rounded-xl p-6 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Valor da Compra</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {formatCurrency(analysisResult.totalValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Tempo de Trabalho</p>
                    <p className="text-2xl font-bold text-yellow-500">
                      {timeCalculation ? `${timeCalculation.hours}h ${timeCalculation.minutes}m` : "Configure seu perfil"}
                    </p>
                  </div>
                </div>
              </div>

              {timeCalculation && (
                <TimeDisplay
                  calculation={timeCalculation}
                  value={analysisResult.totalValue}
                  className="mb-6"
                />
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={handleSaveToHistory}
                  disabled={savePurchaseMutation.isPending || !canCalculateTime}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {savePurchaseMutation.isPending ? "Salvando..." : "Salvar no Histórico"}
                </Button>
                <Button
                  onClick={resetForm}
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Analisar Outro
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Warning */}
      {!canCalculateTime && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-yellow-500" />
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
