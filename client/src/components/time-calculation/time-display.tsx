import { Clock } from "lucide-react";
import type { TimeCalculation } from "@/types";
import { formatWorkTime } from "@/utils/time-calculator";

interface TimeDisplayProps {
  calculation: TimeCalculation;
  value: number;
  className?: string;
  showDescription?: boolean;
}

export function TimeDisplay({ 
  calculation, 
  value, 
  className = "", 
  showDescription = true 
}: TimeDisplayProps) {
  const timeString = formatWorkTime(calculation);
  
  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-center mb-2">
        <Clock className="w-5 h-5 text-yellow-600 mr-2" />
        <span className="text-yellow-800 font-medium text-center">
          {showDescription && (
            <>Essa compra custou </>
          )}
          <span className="font-bold">{timeString}</span>
          {showDescription && (
            <> do seu trabalho</>
          )}
        </span>
      </div>
      
      {showDescription && (
        <p className="text-sm text-yellow-700 text-center">
          Baseado no valor de R$ {value.toFixed(2)}
        </p>
      )}
    </div>
  );
}
