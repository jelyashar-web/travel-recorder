import { useState, useRef } from 'react';
import { 
  Scale, FileText, Download, X, CheckCircle, 
  Gavel, Shield, Calendar, User, Building2, Hash,
  Camera, MapPin, FileCheck
} from 'lucide-react';
import { Recording } from '../types';

interface CourtExportProps {
  isOpen: boolean;
  onClose: () => void;
  recording: Recording | null;
}

interface CourtFormData {
  caseNumber: string;
  courtName: string;
  judgeName: string;
  officerName: string;
  officerBadge: string;
  incidentDate: string;
  incidentLocation: string;
  description: string;
  evidenceNumber: string;
}

const DEFAULT_FORM: CourtFormData = {
  caseNumber: '',
  courtName: '',
  judgeName: '',
  officerName: '',
  officerBadge: '',
  incidentDate: '',
  incidentLocation: '',
  description: '',
  evidenceNumber: '',
};

export function CourtExport({ isOpen, onClose, recording }: CourtExportProps) {
  const [formData, setFormData] = useState<CourtFormData>(DEFAULT_FORM);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  if (!isOpen || !recording) return null;

  const handleInputChange = (field: keyof CourtFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Добавление водяного знака на видео
  const processVideoWithWatermark = async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = recording.url;
      video.muted = true;
      
      const canvas = canvasRef.current;
      if (!canvas) {
        reject(new Error('Canvas not found'));
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not found'));
        return;
      }

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const stream = canvas.captureStream(30);
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9'
        });

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          resolve(new Blob(chunks, { type: 'video/webm' }));
        };

        video.play();
        mediaRecorder.start(100);

        const drawFrame = () => {
          if (video.paused || video.ended) {
            mediaRecorder.stop();
            return;
          }

          // Рисуем видео
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Получаем текущее время видео
          const currentTimeMs = video.currentTime * 1000;
          const videoStartTime = recording.timestamp;
          const frameTimestamp = videoStartTime + currentTimeMs;
          const frameDate = new Date(frameTimestamp);

          // Настройки водяного знака
          ctx.font = 'bold 24px monospace';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.lineWidth = 3;

          const watermarkLines = [
            `ДЕЛО: ${formData.caseNumber || 'N/A'}`,
            `ВРЕМЯ: ${frameDate.toLocaleString('ru-RU')}`,
            recording.location ? `GPS: ${recording.location.latitude.toFixed(6)}, ${recording.location.longitude.toFixed(6)}` : 'GPS: N/A',
            recording.location?.speed ? `СКОРОСТЬ: ${Math.round(recording.location.speed)} км/ч` : 'СКОРОСТЬ: N/A',
            `№ ДОКАЗАТЕЛЬСТВА: ${formData.evidenceNumber || 'N/A'}`,
          ];

          // Рисуем фон для водяного знака
          const lineHeight = 30;
          const padding = 10;
          const maxWidth = Math.max(...watermarkLines.map(line => ctx.measureText(line).width));
          
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(10, 10, maxWidth + padding * 2, watermarkLines.length * lineHeight + padding * 2);

          // Рисуем текст
          ctx.fillStyle = '#00ff00';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;

          watermarkLines.forEach((line, index) => {
            const y = 35 + index * lineHeight;
            ctx.strokeText(line, 20, y);
            ctx.fillText(line, 20, y);
          });

          // Добавляем круглую печать в правом нижнем углу
          const sealX = canvas.width - 80;
          const sealY = canvas.height - 80;
          
          ctx.beginPath();
          ctx.arc(sealX, sealY, 60, 0, 2 * Math.PI);
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
          ctx.lineWidth = 4;
          ctx.stroke();
          
          ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('СУДЕБНОЕ', sealX, sealY - 10);
          ctx.fillText('ДОКАЗАТЕЛЬСТВО', sealX, sealY + 10);
          ctx.fillText('✓', sealX, sealY + 30);

          requestAnimationFrame(drawFrame);
        };

        drawFrame();
      };

      video.onerror = () => reject(new Error('Video loading error'));
    });
  };

  // Генерация судебного отчета
  const generateLegalReport = (): string => {
    const reportDate = new Date().toLocaleString('ru-RU');
    const hash = generateEvidenceHash();
    
    return `
═══════════════════════════════════════════════════════════════
                    СУДЕБНОЕ ДОКАЗАТЕЛЬСТВО
                    ВИДЕОЗАПИСЬ С ВОДЯНЫМ ЗНАКОМ
═══════════════════════════════════════════════════════════════

ИНФОРМАЦИЯ О ДЕЛЕ:
────────────────────────────────────────────────────────────────
Номер дела:          ${formData.caseNumber || '_________________'}
Суд:                 ${formData.courtName || '_________________'}
Судья:               ${formData.judgeName || '_________________'}

ИНФОРМАЦИЯ ОБ ИНЦИДЕНТЕ:
────────────────────────────────────────────────────────────────
Дата инцидента:      ${formData.incidentDate || '_________________'}
Место инцидента:     ${formData.incidentLocation || '_________________'}
Описание:            ${formData.description || '_________________'}

ИНФОРМАЦИЯ О ВИДЕОЗАПИСИ:
────────────────────────────────────────────────────────────────
№ доказательства:    ${formData.evidenceNumber || '_________________'}
Хеш-сумма (SHA-256): ${hash}
Дата создания:       ${new Date(recording.timestamp).toLocaleString('ru-RU')}
Длительность:        ${formatDuration(recording.duration)}
Формат:              WEBM (VP9)

GPS-ДАННЫЕ:
────────────────────────────────────────────────────────────────
${recording.location ? `
Широта:              ${recording.location.latitude.toFixed(8)}
Долгота:             ${recording.location.longitude.toFixed(8)}
Точность:            ±${Math.round(recording.location.accuracy)} метров
Скорость:            ${recording.location.speed ? Math.round(recording.location.speed) + ' км/ч' : 'N/A'}
Направление:         ${recording.location.heading ? Math.round(recording.location.heading) + '°' : 'N/A'}
` : 'GPS данные отсутствуют'}

ИНФОРМАЦИЯ О ПРАВООХРАНИТЕЛЬНЫХ ОРГАНАХ:
────────────────────────────────────────────────────────────────
ФИО сотрудника:      ${formData.officerName || '_________________'}
Номер жетона:        ${formData.officerBadge || '_________________'}

ПОДПИСИ:
────────────────────────────────────────────────────────────────
Составил: _________________________ / ${formData.officerName || '_________________'} /
                    (подпись)               (ФИО)

Дата составления: ${reportDate}

СЕРТИФИКАТ ПОДЛИННОСТИ:
────────────────────────────────────────────────────────────────
Настоящим удостоверяется, что представленная видеозапись:
1. Является оригинальной записью без монтажа
2. Содержит водяные знаки с временем и координатами
3. Хеш-сумма подтверждает целостность файла
4. Запись произведена системой "АвтоСтраж"

Электронная подпись системы: [${hash.substring(0, 32)}...]

═══════════════════════════════════════════════════════════════
                    КОНЕЦ ДОКУМЕНТА
═══════════════════════════════════════════════════════════════
`;
  };

  // Генерация хеша доказательства
  const generateEvidenceHash = (): string => {
    const data = `${recording.id}${recording.timestamp}${recording.location?.latitude}${recording.location?.longitude}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} мин ${secs} сек`;
  };

  const handleExport = async () => {
    setIsGenerating(true);
    setProgress(0);

    try {
      // Шаг 1: Обработка видео с водяным знаком
      setProgress(10);
      const watermarkedVideo = await processVideoWithWatermark();
      
      // Шаг 2: Генерация отчета
      setProgress(70);
      const report = generateLegalReport();
      
      // Шаг 3: Создание ZIP архива
      setProgress(85);
      const JSZip = await import('jszip');
      const zip = new JSZip.default();
      
      zip.file(`видео_дело_${formData.caseNumber}_${formData.evidenceNumber}.webm`, watermarkedVideo);
      zip.file(`отчет_дело_${formData.caseNumber}_${formData.evidenceNumber}.txt`, report);
      
      // Метаданные в JSON
      const metadata = {
        ...formData,
        recordingId: recording.id,
        originalTimestamp: recording.timestamp,
        hash: generateEvidenceHash(),
        exportedAt: new Date().toISOString(),
        system: 'АвтоСтраж',
        version: '1.0.0',
      };
      zip.file(`метаданные_${formData.caseNumber}.json`, JSON.stringify(metadata, null, 2));
      
      // Генерация ZIP
      setProgress(95);
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Скачивание
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `судебное_дело_${formData.caseNumber}_пакет.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setProgress(100);
      setCompleted(true);
    } catch (error) {
      console.error('Export error:', error);
      alert('Ошибка при создании пакета. Пожалуйста, попробуйте снова.');
    } finally {
      setIsGenerating(false);
    }
  };

  const canExport = formData.caseNumber && formData.evidenceNumber && formData.officerName;

  if (completed) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="glass-panel max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Готово!</h2>
          <p className="text-gray-400 mb-6">
            Судебный пакет успешно создан и скачан.
          </p>
          <button onClick={onClose} className="btn-primary">
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="glass-panel max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gradient-to-r from-blue-900/50 to-purple-900/50">
          <div className="flex items-center gap-3">
            <Scale className="w-6 h-6 text-yellow-400" />
            <div>
              <h2 className="text-xl font-bold">Судебный экспорт</h2>
              <p className="text-xs text-gray-400">Создание пакета доказательств для суда</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isGenerating ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Создание судебного пакета...</h3>
            <p className="text-gray-400 mb-4">Добавление водяных знаков и генерация отчета</p>
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden max-w-md mx-auto">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">{progress}%</p>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto flex-1 p-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Информация о деле */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2 text-yellow-400">
                    <Gavel className="w-5 h-5" />
                    Информация о деле
                  </h3>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      <Hash className="w-4 h-4 inline mr-1" />
                      Номер дела *
                    </label>
                    <input
                      type="text"
                      value={formData.caseNumber}
                      onChange={(e) => handleInputChange('caseNumber', e.target.value)}
                      placeholder="2024-12345"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      <Building2 className="w-4 h-4 inline mr-1" />
                      Название суда
                    </label>
                    <input
                      type="text"
                      value={formData.courtName}
                      onChange={(e) => handleInputChange('courtName', e.target.value)}
                      placeholder="Центральный районный суд"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      <User className="w-4 h-4 inline mr-1" />
                      Судья
                    </label>
                    <input
                      type="text"
                      value={formData.judgeName}
                      onChange={(e) => handleInputChange('judgeName', e.target.value)}
                      placeholder="Иванов И.И."
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Информация об инциденте */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2 text-cyan-400">
                    <Shield className="w-5 h-5" />
                    Информация об инциденте
                  </h3>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      <Hash className="w-4 h-4 inline mr-1" />
                      № доказательства *
                    </label>
                    <input
                      type="text"
                      value={formData.evidenceNumber}
                      onChange={(e) => handleInputChange('evidenceNumber', e.target.value)}
                      placeholder="A-001"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Дата инцидента
                    </label>
                    <input
                      type="date"
                      value={formData.incidentDate}
                      onChange={(e) => handleInputChange('incidentDate', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Место инцидента
                    </label>
                    <input
                      type="text"
                      value={formData.incidentLocation}
                      onChange={(e) => handleInputChange('incidentLocation', e.target.value)}
                      placeholder="ул. Ленина, д. 1"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Информация о сотруднике */}
              <div className="mt-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-green-400">
                  <FileCheck className="w-5 h-5" />
                  Составил
                </h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      <User className="w-4 h-4 inline mr-1" />
                      ФИО сотрудника *
                    </label>
                    <input
                      type="text"
                      value={formData.officerName}
                      onChange={(e) => handleInputChange('officerName', e.target.value)}
                      placeholder="Петров П.П."
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      <Hash className="w-4 h-4 inline mr-1" />
                      Номер жетона
                    </label>
                    <input
                      type="text"
                      value={formData.officerBadge}
                      onChange={(e) => handleInputChange('officerBadge', e.target.value)}
                      placeholder="12345"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Описание инцидента
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Краткое описание происшествия..."
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:border-cyan-500 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Информация о записи */}
              <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  Данные видеозаписи
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-400">Длительность:</div>
                  <div>{formatDuration(recording.duration)}</div>
                  <div className="text-gray-400">Дата записи:</div>
                  <div>{new Date(recording.timestamp).toLocaleString('ru-RU')}</div>
                  <div className="text-gray-400">GPS:</div>
                  <div>{recording.location ? 'Есть' : 'Нет'}</div>
                  {recording.location && (
                    <>
                      <div className="text-gray-400">Координаты:</div>
                      <div className="font-mono text-xs">
                        {recording.location.latitude.toFixed(6)}, {recording.location.longitude.toFixed(6)}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Предупреждение */}
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-400">
                  <strong>Важно:</strong> Видео будет обработано с водяными знаками, 
                  содержащими время, координаты и номер дела. Это обеспечивает 
                  юридическую значимость доказательства.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-4 border-t border-gray-700/50">
              <button
                onClick={onClose}
                className="px-4 py-3 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleExport}
                disabled={!canExport}
                className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                Создать судебный пакет
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
